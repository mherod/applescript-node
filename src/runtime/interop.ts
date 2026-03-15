/**
 * Runtime interop interface — abstracts all Node.js-specific APIs behind a
 * single object so the rest of the codebase is runtime-agnostic.
 */
export interface RuntimeInterop {
  /** Execute a shell command and return stdout/stderr. */
  exec(command: string): Promise<{ stdout: string; stderr: string }>;

  /** Read a file as a UTF-8 string. */
  readFile(path: string): Promise<string>;

  /** Write a string to a file (UTF-8). */
  writeFile(path: string, data: string): Promise<void>;

  /** Return the OS temporary directory. */
  tmpdir(): string;

  /** Join path segments. */
  joinPath(...segments: string[]): string;

  /** Return cryptographically random bytes. */
  randomBytes(size: number): Buffer;
}
