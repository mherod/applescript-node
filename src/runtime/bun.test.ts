import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { RuntimeInterop } from './interop.js';

/**
 * Bun runtime tests run in Vitest (Node), so we mock the Bun global.
 * This verifies the module's wiring — not Bun's actual I/O behaviour.
 */

const mockSpawn = vi.fn();
const mockFile = vi.fn();
const mockWrite = vi.fn();

beforeAll(() => {
  // Provide a minimal Bun global so the module can be imported
  (globalThis as Record<string, unknown>).Bun = {
    spawn: mockSpawn,
    file: mockFile,
    write: mockWrite,
  };
});

afterAll(() => {
  delete (globalThis as Record<string, unknown>).Bun;
});

describe('Bun runtime interop', () => {
  let runtime: RuntimeInterop;

  beforeAll(async () => {
    // Dynamic import after Bun global is available
    const mod = await import('./bun.js');
    runtime = mod.runtime;
  });

  it('satisfies the RuntimeInterop interface', () => {
    expect(runtime).toBeDefined();
    expect(typeof runtime.exec).toBe('function');
    expect(typeof runtime.readFile).toBe('function');
    expect(typeof runtime.writeFile).toBe('function');
    expect(typeof runtime.tmpdir).toBe('function');
    expect(typeof runtime.joinPath).toBe('function');
    expect(typeof runtime.randomBytes).toBe('function');
  });

  it('exec resolves stdout/stderr on success', async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('hello\n'));
        controller.close();
      },
    });
    const mockStderr = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(''));
        controller.close();
      },
    });

    mockSpawn.mockReturnValue({
      stdout: mockStdout,
      stderr: mockStderr,
      exited: Promise.resolve(0),
    });

    const result = await runtime.exec('echo hello');
    expect(result.stdout).toBe('hello\n');
    expect(result.stderr).toBe('');
    expect(mockSpawn).toHaveBeenCalledWith(['sh', '-c', 'echo hello'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
  });

  it('exec throws on non-zero exit code', async () => {
    const mockStdout = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
    const mockStderr = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('not found'));
        controller.close();
      },
    });

    mockSpawn.mockReturnValue({
      stdout: mockStdout,
      stderr: mockStderr,
      exited: Promise.resolve(1),
    });

    await expect(runtime.exec('bad-command')).rejects.toThrow('not found');
  });

  it('readFile delegates to Bun.file().text()', async () => {
    mockFile.mockReturnValue({ text: () => Promise.resolve('file content') });

    const result = await runtime.readFile('/tmp/test.txt');
    expect(result).toBe('file content');
    expect(mockFile).toHaveBeenCalledWith('/tmp/test.txt');
  });

  it('writeFile delegates to Bun.write()', async () => {
    mockWrite.mockResolvedValue(undefined);

    await runtime.writeFile('/tmp/out.txt', 'data');
    expect(mockWrite).toHaveBeenCalledWith('/tmp/out.txt', 'data');
  });

  it('tmpdir returns OS temp directory', () => {
    expect(runtime.tmpdir()).toBe(tmpdir());
  });

  it('joinPath joins segments', () => {
    expect(runtime.joinPath('/tmp', 'a', 'b')).toBe(join('/tmp', 'a', 'b'));
  });

  it('randomBytes returns a Buffer of the requested size', () => {
    const bytes = runtime.randomBytes(16);
    expect(bytes).toBeInstanceOf(Buffer);
    expect(bytes.length).toBe(16);
    // Verify it uses crypto (non-zero bytes with overwhelming probability)
    expect(bytes.some((b) => b !== 0)).toBe(true);
  });

  it('randomBytes produces hex string like Node implementation', () => {
    const hex = runtime.randomBytes(8).toString('hex');
    expect(hex).toMatch(/^[0-9a-f]{16}$/);
  });
});
