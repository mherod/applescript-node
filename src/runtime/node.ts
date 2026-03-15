import { exec as execCallback } from 'node:child_process';
import { randomBytes as cryptoRandomBytes } from 'node:crypto';
import { readFile as fsReadFile, writeFile as fsWriteFile } from 'node:fs/promises';
import { tmpdir as osTmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { RuntimeInterop } from './interop.js';

const execPromise = promisify(execCallback);

/**
 * Node.js implementation of the runtime interop layer.
 */
export const runtime: RuntimeInterop = {
  exec: (command) => execPromise(command),
  readFile: (path) => fsReadFile(path, 'utf-8'),
  writeFile: (path, data) => fsWriteFile(path, data, 'utf-8'),
  tmpdir: () => osTmpdir(),
  joinPath: (...segments) => join(...segments),
  randomBytes: (size) => cryptoRandomBytes(size),
};
