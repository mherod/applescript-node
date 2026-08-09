import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ScriptExecutor } from './executor.js';
import {
  activate,
  escapeAppleScriptString,
  isRunning,
  osa,
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
