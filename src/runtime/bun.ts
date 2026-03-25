import { randomBytes as cryptoRandomBytes } from 'node:crypto';
import { tmpdir as osTmpdir } from 'node:os';
import { join } from 'node:path';
import type { RuntimeInterop } from './interop.js';

// Minimal type declarations for Bun globals used in this file.
// Scoped here to avoid polluting the Node.js-targeted type environment.
declare const Bun: {
  spawn(
    command: string[],
    opts?: { stdout?: 'pipe' | 'inherit' | 'ignore'; stderr?: 'pipe' | 'inherit' | 'ignore' },
  ): {
    stdout: ReadableStream<Uint8Array>;
    stderr: ReadableStream<Uint8Array>;
    readonly exited: Promise<number>;
  };
  file(path: string): { text(): Promise<string> };
  write(path: string, data: string): Promise<void>;
};

/**
 * Bun implementation of the runtime interop layer.
 *
 * Uses Bun-native APIs where they offer advantages (file I/O, process spawning)
 * and Node.js-compatible imports for utilities that Bun supports natively
 * (crypto, os, path).
 */
export const runtime: RuntimeInterop = {
  async exec(command) {
    const proc = Bun.spawn(['sh', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const err = new Error(stderr || `Command failed with exit code ${exitCode}`) as Error & {
        code: number;
      };
      err.code = exitCode;
      throw err;
    }

    return { stdout, stderr };
  },

  async readFile(path) {
    return Bun.file(path).text();
  },

  async writeFile(path, data) {
    await Bun.write(path, data);
  },

  tmpdir: () => osTmpdir(),
  joinPath: (...segments) => join(...segments),
  randomBytes: (size) => cryptoRandomBytes(size),
};
