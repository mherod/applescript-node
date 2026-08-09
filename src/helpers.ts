/**
 * Top-level scripting helpers.
 *
 * Thin, dependency-free conveniences that sit above {@link ScriptExecutor} and the
 * fluent builder for the common "just run this" cases, without giving up the
 * escaping guarantees the builder provides.
 *
 * @module helpers
 */

import { AppleScriptBuilder } from './builder.js';
import { ScriptExecutor } from './executor.js';
import type {
  AppleScriptValue,
  OsaScriptOptions,
  Prettify,
  ScriptBuilder,
  ScriptExecutionResult,
} from './types.js';

/**
 * Escape a JavaScript string for safe embedding inside an AppleScript string literal.
 *
 * Backslashes are escaped first, then quotes, so an input backslash never combines
 * with a following quote to produce an unterminated literal.
 *
 * @example
 * escapeAppleScriptString('say "hi"\\now'); // 'say \\"hi\\"\\\\now'
 */
export function escapeAppleScriptString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Convert a JavaScript value into its AppleScript literal form.
 *
 * Strings become quoted literals, `null` becomes `missing value`, arrays become
 * AppleScript lists, and plain objects become records.
 *
 * @example
 * toAppleScriptLiteral(['a', 1, true]); // '{"a", 1, true}'
 * toAppleScriptLiteral({ name: 'Finder' }); // '{name:"Finder"}'
 */
export function toAppleScriptLiteral(value: AppleScriptValue): string {
  if (value === null) return 'missing value';
  if (typeof value === 'string') return `"${escapeAppleScriptString(value)}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `{${value.map((v) => toAppleScriptLiteral(v)).join(', ')}}`;

  const entries = Object.entries(value as Record<string, AppleScriptValue>)
    .map(([key, val]) => `${key}:${toAppleScriptLiteral(val)}`)
    .join(', ');
  return `{${entries}}`;
}

/**
 * Tagged template that builds an AppleScript source string with safely escaped
 * interpolations. Values are converted with {@link toAppleScriptLiteral}, so a
 * user-supplied string can never break out of its literal.
 *
 * @example
 * const name = 'Finder';
 * const script = osa`tell application ${name} to get name of front window`;
 * // tell application "Finder" to get name of front window
 */
export function osa(strings: TemplateStringsArray, ...values: AppleScriptValue[]): string {
  return strings.reduce(
    (acc, part, index) =>
      index === 0 ? part : `${acc}${toAppleScriptLiteral(values[index - 1])}${part}`,
    '',
  );
}

/**
 * Parse osascript output as JSON when it looks like JSON, otherwise leave it alone.
 *
 * Shared by {@link runScript} and the helpers below so every entry point agrees on
 * when output is auto-parsed.
 */
export function parseScriptOutput<T>(
  result: ScriptExecutionResult<string>,
): ScriptExecutionResult<T> {
  if (!result.success || typeof result.output !== 'string') {
    return result as unknown as ScriptExecutionResult<T>;
  }

  const trimmed = result.output.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
    return result as unknown as ScriptExecutionResult<T>;
  }

  try {
    return {
      success: true,
      output: JSON.parse(result.output) as Prettify<T>,
      exitCode: result.exitCode,
    };
  } catch {
    // Output merely looks like JSON — hand back the raw string.
    return result as unknown as ScriptExecutionResult<T>;
  }
}

/**
 * Error thrown by the `*OrThrow` helpers when osascript reports a failure.
 *
 * Carries the exit code and the script that produced it so callers can log or retry.
 */
export class ScriptExecutionError extends Error {
  readonly exitCode: number;
  readonly script: string;

  constructor(message: string, exitCode: number, script: string) {
    super(message);
    this.name = 'ScriptExecutionError';
    this.exitCode = exitCode;
    this.script = script;
  }
}

const toSource = <T>(script: string | ScriptBuilder<string, T>): string =>
  typeof script === 'string' ? script : script.build();

/**
 * Run a script and return its output directly, throwing {@link ScriptExecutionError}
 * on failure instead of returning a result object.
 *
 * @example
 * const name = await runScriptOrThrow<string>(osa`tell application "Finder" to get name`);
 */
export async function runScriptOrThrow<T = string>(
  script: string | ScriptBuilder<string, T>,
  options?: OsaScriptOptions,
): Promise<Prettify<T>> {
  const source = toSource(script);
  const result = parseScriptOutput<T>(await ScriptExecutor.execute(source, options));

  if (!result.success) {
    throw new ScriptExecutionError(result.error, result.exitCode, source);
  }

  return result.output as Prettify<T>;
}

/**
 * Run a JavaScript for Automation (JXA) script.
 *
 * Equivalent to passing `{ language: 'JavaScript' }`, with the same automatic JSON
 * parsing as {@link runScript}.
 *
 * @example
 * const result = await runJxa<string>('Application("Finder").name()');
 */
export async function runJxa<T = string>(
  script: string,
  options?: Omit<OsaScriptOptions, 'language'>,
): Promise<ScriptExecutionResult<T>> {
  return parseScriptOutput<T>(
    await ScriptExecutor.execute(script, { ...options, language: 'JavaScript' }),
  );
}

/**
 * Run a body of script inside a `tell application` block for the named app.
 *
 * The body may be a raw AppleScript string or a callback that receives the builder
 * already positioned inside the block — the block is closed for you either way.
 *
 * @example
 * await tell('Finder', 'get name of front window');
 *
 * @example
 * await tell('Safari', (b) => b.get('URL of front document'));
 */
export async function tell<T = string>(
  application: string,
  body: string | ((builder: AppleScriptBuilder) => void),
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> {
  const builder = new AppleScriptBuilder().tell(application);

  if (typeof body === 'string') {
    builder.raw(body);
  } else {
    body(builder);
  }

  return parseScriptOutput<T>(await ScriptExecutor.execute(builder.endtell().build(), options));
}

/**
 * Activate (bring to the front) the named application.
 *
 * @example
 * await activate('Safari');
 */
export async function activate(application: string): Promise<void> {
  const script = osa`tell application ${application} to activate`;
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new ScriptExecutionError(result.error, result.exitCode, script);
  }
}

/**
 * Report whether the named application is currently running, without launching it.
 *
 * @example
 * if (await isRunning('Music')) { ... }
 */
export async function isRunning(application: string): Promise<boolean> {
  const script = osa`tell application "System Events" to (name of processes) contains ${application}`;
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new ScriptExecutionError(result.error, result.exitCode, script);
  }

  return result.output?.trim() === 'true';
}
