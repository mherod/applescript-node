import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScriptExecutor } from './executor.js';
import {
  activate,
  escapeAppleScriptString,
  isRunning,
  osa,
  parseAppleScriptError,
  parseScriptOutput,
  runJxa,
  runScriptOrThrow,
  ScriptExecutionError,
  tell,
  toAppleScriptLiteral,
} from './helpers.js';

const ok = (output: string) => ({ success: true as const, output, exitCode: 0 });
const fail = (error: string) => ({ success: false as const, error, exitCode: 1 });

describe('escapeAppleScriptString', () => {
  it('escapes backslashes before quotes', () => {
    expect(escapeAppleScriptString('a\\"b')).toBe('a\\\\\\"b');
  });

  it('escapes control characters', () => {
    expect(escapeAppleScriptString('a\nb\tc\rd')).toBe('a\\nb\\tc\\rd');
  });
});

describe('toAppleScriptLiteral', () => {
  it('formats primitives', () => {
    expect(toAppleScriptLiteral('hi')).toBe('"hi"');
    expect(toAppleScriptLiteral(42)).toBe('42');
    expect(toAppleScriptLiteral(true)).toBe('true');
    expect(toAppleScriptLiteral(null)).toBe('missing value');
  });

  it('formats lists and records', () => {
    expect(toAppleScriptLiteral(['a', 1])).toBe('{"a", 1}');
    expect(toAppleScriptLiteral({ name: 'Finder', open: true })).toBe('{name:"Finder", open:true}');
  });

  /**
   * `undefined` is outside AppleScriptValue, so TypeScript callers cannot reach
   * these, but plain-JS consumers and absent optional properties can — and
   * without a guard they fall through to Object.entries(undefined) and throw.
   */
  it('treats undefined as missing value rather than throwing', () => {
    expect(toAppleScriptLiteral(undefined)).toBe('missing value');
    expect(toAppleScriptLiteral({ name: 'Finder', note: undefined })).toBe(
      '{name:"Finder", note:missing value}',
    );
    expect(toAppleScriptLiteral(['a', undefined])).toBe('{"a", missing value}');
  });

  it('interpolates undefined into osa as missing value', () => {
    expect(osa`set x to ${undefined}`).toBe('set x to missing value');
  });
});

describe('osa', () => {
  it('interpolates values as escaped literals', () => {
    const name = 'Fin"der';
    expect(osa`tell application ${name} to activate`).toBe(
      'tell application "Fin\\"der" to activate',
    );
  });

  it('returns the raw template when there are no interpolations', () => {
    expect(osa`get name`).toBe('get name');
  });
});

describe('parseScriptOutput', () => {
  it('parses JSON-looking output', () => {
    expect(parseScriptOutput<{ a: number }>(ok('{"a":1}')).output).toEqual({ a: 1 });
  });

  it('leaves non-JSON output alone', () => {
    expect(parseScriptOutput(ok('Finder')).output).toBe('Finder');
  });

  it('leaves malformed JSON as a string', () => {
    expect(parseScriptOutput(ok('{not json')).output).toBe('{not json');
  });

  it('passes failures through', () => {
    expect(parseScriptOutput(fail('boom')).success).toBe(false);
  });
});

/**
 * Every fixture below is real osascript stderr, captured by
 * scripts/debug-script-error-shape.ts rather than written by hand.
 */
describe('parseAppleScriptError', () => {
  const stderr = (diagnostic: string) => `Command failed: osascript -s h -e 'x'\n${diagnostic}\n`;

  it('parses offsets, kind, message, and error number', () => {
    expect(
      parseAppleScriptError(
        stderr('32:40: execution error: Can’t get application "NoSuchApp". (-1728)'),
      ),
    ).toEqual({
      kind: 'execution error',
      message: 'Can’t get application "NoSuchApp".',
      errorNumber: -1728,
      start: 32,
      end: 40,
      raw: '32:40: execution error: Can’t get application "NoSuchApp". (-1728)',
    });
  });

  it('parses a syntax error with a custom error number', () => {
    const parsed = parseAppleScriptError(stderr('6:26: execution error: deliberate failure (42)'));
    expect(parsed?.errorNumber).toBe(42);
    expect(parsed?.message).toBe('deliberate failure');
  });

  it('keeps parentheses that belong to the message', () => {
    const parsed = parseAppleScriptError(
      stderr('6:32: execution error: failed (twice) (already) (7)'),
    );
    expect(parsed?.message).toBe('failed (twice) (already)');
    expect(parsed?.errorNumber).toBe(7);
  });

  it('handles JXA errors, which carry no offsets', () => {
    const parsed = parseAppleScriptError(stderr('execution error: Error: Error: jxa boom (-2700)'));
    expect(parsed?.start).toBeUndefined();
    expect(parsed?.end).toBeUndefined();
    expect(parsed?.message).toBe('Error: Error: jxa boom');
  });

  it('normalises carriage returns in the message but not in raw', () => {
    const parsed = parseAppleScriptError(
      stderr('6:38: execution error: line one\rline two (-2700)'),
    );
    expect(parsed?.message).toBe('line one\nline two');
    expect(parsed?.raw).toBe('6:38: execution error: line one\rline two (-2700)');
  });

  it('parses a diagnostic that omits the error number', () => {
    const parsed = parseAppleScriptError(stderr('12:29: syntax error: something went wrong'));
    expect(parsed?.errorNumber).toBeUndefined();
    expect(parsed?.message).toBe('something went wrong');
  });

  it('returns undefined when no line has the diagnostic shape', () => {
    expect(
      parseAppleScriptError(
        'Command failed: osascript -s h "/tmp/nope.scpt"\nosascript: /tmp/nope.scpt: No such file or directory\n',
      ),
    ).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(parseAppleScriptError('')).toBeUndefined();
  });

  it('ignores the command line, even when the script itself looks like a diagnostic', () => {
    expect(
      parseAppleScriptError(`Command failed: osascript -s h -e 'log "execution error: nope (-1)"'`),
    ).toBeUndefined();
  });

  /**
   * The Node runtime throws through promisify(exec), which prefixes the message
   * with `Command failed: <command>`. The Bun runtime throws the raw stderr, so
   * the diagnostic is line 0 with nothing before it.
   */
  it('parses the Bun runtime shape, which has no command preamble', () => {
    const parsed = parseAppleScriptError(
      '32:40: execution error: Can’t get application "NoSuchApp". (-1728)\n',
    );
    expect(parsed?.errorNumber).toBe(-1728);
    expect(parsed?.message).toBe('Can’t get application "NoSuchApp".');
  });

  it('parses the Bun shape for a script whose source spans lines', () => {
    const parsed = parseAppleScriptError('6:26: execution error: deliberate failure (42)\n');
    expect(parsed?.errorNumber).toBe(42);
  });

  it('finds the diagnostic when the command echo spans several lines', () => {
    const parsed = parseAppleScriptError(
      [
        `Command failed: osascript -s h -e 'tell application "Finder"`,
        '  get bogus property',
        `end tell'`,
        '32:40: execution error: Can’t get bogus property. (-1728)',
        '',
      ].join('\n'),
    );
    expect(parsed?.errorNumber).toBe(-1728);
    expect(parsed?.message).toBe('Can’t get bogus property.');
  });

  it('returns undefined for the Bun runtime fallback message', () => {
    expect(parseAppleScriptError('Command failed with exit code 1')).toBeUndefined();
  });
});

describe('ScriptExecutionError', () => {
  const stderr =
    'Command failed: osascript -s h -e \'x\'\n32:40: execution error: Can’t get application "NoSuchApp". (-1728)\n';

  it('uses the diagnostic as its message and keeps the raw text', () => {
    const error = new ScriptExecutionError(stderr, 1, 'x');
    expect(error.message).toBe('Can’t get application "NoSuchApp".');
    expect(error.errorNumber).toBe(-1728);
    expect(error.diagnostic?.kind).toBe('execution error');
    expect(error.stderr).toBe(stderr);
    expect(error.script).toBe('x');
    expect(error.exitCode).toBe(1);
  });

  it('falls back to the full text when there is no diagnostic', () => {
    const error = new ScriptExecutionError('osascript: nope: No such file or directory\n', 1, 'x');
    expect(error.message).toBe('osascript: nope: No such file or directory');
    expect(error.diagnostic).toBeUndefined();
    expect(error.errorNumber).toBeUndefined();
  });

  it('is catchable as an Error', () => {
    expect(new ScriptExecutionError(stderr, 1, 'x')).toBeInstanceOf(Error);
  });
});

describe('execution helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('runScriptOrThrow returns parsed output', async () => {
    vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok('[1,2]'));
    await expect(runScriptOrThrow<number[]>('anything')).resolves.toEqual([1, 2]);
  });

  it('runScriptOrThrow throws ScriptExecutionError on failure', async () => {
    vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(fail('bad script'));
    await expect(runScriptOrThrow('anything')).rejects.toThrow(ScriptExecutionError);
  });

  it('runJxa selects the JavaScript language', async () => {
    const spy = vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok('Finder'));
    await runJxa('Application("Finder").name()');
    expect(spy).toHaveBeenCalledWith(
      'Application("Finder").name()',
      expect.objectContaining({ language: 'JavaScript' }),
    );
  });

  it('tell wraps a raw body in a tell block', async () => {
    const spy = vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok('Desktop'));
    await tell('Finder', 'get name of front window');
    expect(spy.mock.calls[0]?.[0]).toBe(
      'tell application "Finder"\n  get name of front window\nend tell',
    );
  });

  it('tell accepts a builder callback', async () => {
    const spy = vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok('https://example.com'));
    await tell('Safari', (b) => b.get('URL of front document'));
    expect(spy.mock.calls[0]?.[0]).toContain('URL of front document');
  });

  it('activate escapes the application name', async () => {
    const spy = vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok(''));
    await activate('My "App"');
    expect(spy.mock.calls[0]?.[0]).toBe('tell application "My \\"App\\"" to activate');
  });

  it('activate throws on failure', async () => {
    vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(fail('no such app'));
    await expect(activate('Nope')).rejects.toThrow(ScriptExecutionError);
  });

  it('isRunning maps osascript booleans', async () => {
    const spy = vi.spyOn(ScriptExecutor, 'execute').mockResolvedValue(ok('true\n'));
    await expect(isRunning('Music')).resolves.toBe(true);
    spy.mockResolvedValue(ok('false'));
    await expect(isRunning('Music')).resolves.toBe(false);
  });
});
