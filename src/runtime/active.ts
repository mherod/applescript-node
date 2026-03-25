import type { RuntimeInterop } from './interop.js';
import { runtime as nodeRuntime } from './node.js';

let impl: RuntimeInterop = nodeRuntime;

/**
 * Switch process-wide I/O and subprocess implementation (Node vs Bun).
 * Prefer `applescript-node/bun` or `applescript-node/node` instead of calling this directly.
 */
export function setActiveRuntime(runtime: RuntimeInterop): void {
  impl = runtime;
}

/** Active runtime used by executor, compiler, and other environment-bound modules. */
export const runtime: RuntimeInterop = {
  exec: (command) => impl.exec(command),
  readFile: (path) => impl.readFile(path),
  writeFile: (path, data) => impl.writeFile(path, data),
  tmpdir: () => impl.tmpdir(),
  joinPath: (...segments) => impl.joinPath(...segments),
  randomBytes: (size) => impl.randomBytes(size),
};
