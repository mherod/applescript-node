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
  AppleScriptDiagnostic,
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
 * Strings become quoted literals, arrays become AppleScript lists, and plain
 * objects become records. Both `null` and `undefined` become `missing value` —
 * `undefined` is outside `AppleScriptValue`, but it reaches this function from
 * plain-JS callers and from optional properties that are absent at runtime, and
 * `missing value` is what AppleScript calls the same idea. Without the guard
 * those cases fall through to the record branch and throw from
 * `Object.entries(undefined)`.
 *
 * @example
 * toAppleScriptLiteral(['a', 1, true]); // '{"a", 1, true}'
 * toAppleScriptLiteral({ name: 'Finder' }); // '{name:"Finder"}'
 * toAppleScriptLiteral({ name: 'Finder', note: undefined }); // '{name:"Finder", note:missing value}'
 */
export function toAppleScriptLiteral(value: AppleScriptValue | undefined): string {
  if (value === null || value === undefined) return 'missing value';
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
export function osa(
  strings: TemplateStringsArray,
  ...values: (AppleScriptValue | undefined)[]
): string {
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
 * osascript diagnostics look like:
 *
 *   32:40: execution error: Can't get application "NoSuchApp". (-1728)
 *   execution error: Error: Error: jxa boom (-2700)      <- JXA omits the offsets
 *   6:32: execution error: failed (twice) (already) (7)  <- message may hold parens
 *
 * The message is matched greedily so a trailing `(number)` wins over any
 * parentheses inside the message itself, and it is matched with `[\s\S]` rather
 * than `.` because an AppleScript `error "a" & return & "b"` puts a carriage
 * return inside the message, which `.` does not match.
 */
const DIAGNOSTIC_WITH_NUMBER = /^(?:(\d+):(\d+):\s*)?(.+? error):\s*([\s\S]*)\s\((-?\d+)\)$/;
const DIAGNOSTIC_WITHOUT_NUMBER = /^(?:(\d+):(\d+):\s*)?(.+? error):\s*([\s\S]*)$/;

const toOffset = (value: string | undefined): number | undefined =>
  value === undefined ? undefined : Number.parseInt(value, 10);

/**
 * AppleScript's `return` is a carriage return, so multi-line messages arrive
 * CR-separated and would overprint themselves in a terminal. `raw` keeps the
 * original bytes; `message` gets newlines.
 */
const normaliseNewlines = (message: string): string => message.replace(/\r\n?/g, '\n');

/**
 * Pull the structured diagnostic out of a failed run's error text.
 *
 * The two runtimes hand us different shapes. Node's `promisify(exec)` prefixes
 * the thrown message with `Command failed: <command>` and puts the diagnostic
 * after it; Bun throws the raw stderr, so the diagnostic is the very first line.
 * Rather than assume a position, drop the command echo and scan what remains
 * from the end — the diagnostic always trails the command it describes, and a
 * script whose own source happens to contain `... error: ... (-1)` cannot be
 * mistaken for it.
 *
 * Returns `undefined` when no line has the diagnostic shape — a missing script
 * file, for instance, reports `osascript: <path>: No such file or directory`.
 *
 * @example
 * const diagnostic = parseAppleScriptError(result.error);
 * if (diagnostic?.errorNumber === -1728) { ... }
 */
export function parseAppleScriptError(errorText: string): AppleScriptDiagnostic | undefined {
  const lines = errorText
    .split('\n')
    .filter((line) => !line.startsWith('Command failed:'))
    .reverse();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const withNumber = DIAGNOSTIC_WITH_NUMBER.exec(trimmed);
    if (withNumber) {
      const [, start, end, kind, message, errorNumber] = withNumber;
      return {
        kind,
        message: normaliseNewlines(message),
        errorNumber: Number.parseInt(errorNumber, 10),
        start: toOffset(start),
        end: toOffset(end),
        raw: trimmed,
      };
    }

    const withoutNumber = DIAGNOSTIC_WITHOUT_NUMBER.exec(trimmed);
    if (withoutNumber) {
      const [, start, end, kind, message] = withoutNumber;
      return {
        kind,
        message: normaliseNewlines(message),
        start: toOffset(start),
        end: toOffset(end),
        raw: trimmed,
      };
    }
  }

  return undefined;
}

/**
 * Error thrown by the `*OrThrow` helpers when osascript reports a failure.
 *
 * `message` is the AppleScript diagnostic where one could be parsed, so logging
 * the error shows `Can't get application "NoSuchApp".` rather than the shell
 * command osascript was invoked with. The untouched text stays on `stderr`, and
 * `diagnostic` carries the parsed fields when they are available.
 */
export class ScriptExecutionError extends Error {
  readonly exitCode: number;
  readonly script: string;
  /** Complete error text as reported, including the `Command failed:` line. */
  readonly stderr: string;
  /** Parsed diagnostic, absent when osascript did not emit one. */
  readonly diagnostic?: AppleScriptDiagnostic;

  constructor(stderr: string, exitCode: number, script: string) {
    const diagnostic = parseAppleScriptError(stderr);
    super(diagnostic?.message ?? stderr.trim());
    this.name = 'ScriptExecutionError';
    this.exitCode = exitCode;
    this.script = script;
    this.stderr = stderr;
    this.diagnostic = diagnostic;
  }

  /** AppleScript error number, e.g. `-1728`, when osascript reported one. */
  get errorNumber(): number | undefined {
    return this.diagnostic?.errorNumber;
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
