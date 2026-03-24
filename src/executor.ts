import type { OsaScriptOptions, Prettify, ScriptExecutionResult } from './types.js';
import { runtime } from './runtime/node.js';

/**
 * Extract error information from an execution error.
 * Handles various error types (Error, ErrnoException, etc.) and extracts
 * both the error message and exit code with proper defaults.
 */
function extractErrorInfo(error: unknown): { message: string; exitCode: number } {
  const message = error instanceof Error ? error.message : String(error);
  const errnoException = error as { code?: string | number | null };
  const exitCode =
    typeof errnoException.code === 'string'
      ? Number.parseInt(errnoException.code, 10) || 1
      : typeof errnoException.code === 'number'
        ? errnoException.code
        : 1;
  return { message, exitCode };
}

/**
 * ScriptExecutor - Core execution engine for AppleScript and JavaScript
 *
 * **IMPORTANT: Error Handling**
 *
 * This class implements robust error handling that is critical for production use:
 *
 * 1. **Type-Safe Error Extraction**: Errors from `child_process.exec` can be various types
 *    (Error objects, ErrnoException, etc.). The error handling properly extracts:
 *    - Error messages from Error instances or converts other types to strings
 *    - Exit codes from ErrnoException.code (which can be string or number)
 *    - Defaults to exit code 1 if code is missing or invalid
 *
 * 2. **Exit Code Handling**: The exit code extraction handles three cases:
 *    - String codes: Parsed with parseInt (e.g., "1" -> 1)
 *    - Number codes: Used directly
 *    - Missing/null codes: Defaults to 1
 *
 * 3. **Why This Matters**: Without proper error handling:
 *    - TypeScript would allow unsafe type assertions
 *    - Runtime errors could occur when accessing error.code
 *    - Exit codes might be undefined, causing downstream issues
 *
 * **Usage Example:**
 * ```typescript
 * const result = await ScriptExecutor.execute('tell app "Finder" to activate');
 * if (!result.success) {
 *   console.error(`Script failed with exit code ${result.exitCode}: ${result.error}`);
 * }
 * ```
 *
 * **Testing Considerations:**
 * - Always test both success and failure paths
 * - Mock different error types (Error, ErrnoException, etc.)
 * - Verify exit codes are correctly extracted and defaulted
 * - Ensure error messages are properly extracted regardless of error type
 *
 * @see {@link ScriptExecutionResult} for the result structure
 * @see {@link OsaScriptOptions} for execution options
 */
export class ScriptExecutor {
  private static buildFlags(options: OsaScriptOptions = {}): string {
    const flags: string[] = [];

    if (options.language) {
      flags.push(`-l ${options.language}`);
    }

    const outputFlags = [];
    if (options.humanReadable !== false) outputFlags.push('h');
    if (options.errorToStdout) outputFlags.push('o');

    if (outputFlags.length > 0) {
      flags.push(`-s ${outputFlags.join('')}`);
    }

    return flags.join(' ');
  }

  /**
   * Execute an AppleScript or JavaScript string
   *
   * **Error Handling:**
   * This method implements comprehensive error handling that safely extracts:
   * - Error messages from any error type (Error, ErrnoException, etc.)
   * - Exit codes with proper type checking and defaults
   *
   * **Important Notes:**
   * - Script strings are automatically escaped for shell safety
   * - Single quotes in scripts are escaped using the pattern: `'` -> `'"'"'`
   * - Always returns a result object, never throws (errors are captured in result)
   *
   * @param script - The AppleScript or JavaScript code to execute
   * @param options - Execution options (language, output format, etc.)
   * @returns Promise resolving to execution result with success flag, output, error, and exit code
   *
   * @example
   * ```typescript
   * const result = await ScriptExecutor.execute('tell app "Finder" to get name');
   * if (result.success) {
   *   // result.output === "Finder"
   * } else {
   *   console.error(`Failed: ${result.error} (exit code: ${result.exitCode})`);
   * }
   * ```
   */
  static async execute<T = string>(
    script: string,
    options: OsaScriptOptions = {},
  ): Promise<ScriptExecutionResult<T>> {
    try {
      const flags = ScriptExecutor.buildFlags(options);
      const command = `osascript ${flags} -e '${script.replace(/'/g, "'\"'\"'")}'`;

      const { stdout } = await runtime.exec(command);

      return {
        success: true,
        output: stdout.trim() as Prettify<T>,
        exitCode: 0,
      };
    } catch (error) {
      const { message, exitCode } = extractErrorInfo(error);
      return {
        success: false,
        output: null as Prettify<T>,
        error: message,
        exitCode,
      };
    }
  }

  /**
   * Execute an AppleScript or JavaScript file
   *
   * **Error Handling:**
   * Uses the same robust error handling as `execute()` method.
   * See {@link ScriptExecutor.execute} for details on error handling patterns.
   *
   * **Important Notes:**
   * - File paths are passed directly to osascript (no shell escaping needed)
   * - File must exist and be readable
   * - Always returns a result object, never throws
   *
   * @param filePath - Path to the script file (.applescript, .scpt, etc.)
   * @param options - Execution options (language, output format, etc.)
   * @returns Promise resolving to execution result with success flag, output, error, and exit code
   *
   * @example
   * ```typescript
   * const result = await ScriptExecutor.executeFile('./scripts/my-script.applescript');
   * if (result.success) {
   *   // result.output contains the script output
   * }
   * ```
   */
  static async executeFile<T = string>(
    filePath: string,
    options: OsaScriptOptions = {},
  ): Promise<ScriptExecutionResult<T>> {
    try {
      const flags = ScriptExecutor.buildFlags(options);
      const command = `osascript ${flags} "${filePath}"`;

      const { stdout } = await runtime.exec(command);

      return {
        success: true,
        output: stdout.trim() as Prettify<T>,
        exitCode: 0,
      };
    } catch (error) {
      const { message, exitCode } = extractErrorInfo(error);
      return {
        success: false,
        output: null as Prettify<T>,
        error: message,
        exitCode,
      };
    }
  }
}
