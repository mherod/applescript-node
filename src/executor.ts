import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';
import type { OsaScriptOptions, ScriptExecutionResult } from './types.js';

const exec = promisify(execCallback);

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

  static async execute<T = string>(
    script: string,
    options: OsaScriptOptions = {},
  ): Promise<ScriptExecutionResult<T>> {
    try {
      const flags = ScriptExecutor.buildFlags(options);
      const command = `osascript ${flags} -e '${script.replace(/'/g, "'\"'\"'")}'`;

      const { stdout } = await exec(command);

      return {
        success: true,
        output: stdout.trim() as T,
        exitCode: 0,
      };
    } catch (error) {
      const err = error as { message: string; code: number };
      return {
        success: false,
        output: null as T,
        error: err.message,
        exitCode: err.code || 1,
      };
    }
  }

  static async executeFile<T = string>(
    filePath: string,
    options: OsaScriptOptions = {},
  ): Promise<ScriptExecutionResult<T>> {
    try {
      const flags = ScriptExecutor.buildFlags(options);
      const command = `osascript ${flags} "${filePath}"`;

      const { stdout } = await exec(command);

      return {
        success: true,
        output: stdout.trim() as T,
        exitCode: 0,
      };
    } catch (error) {
      const err = error as { message: string; code: number };
      return {
        success: false,
        output: null as T,
        error: err.message,
        exitCode: err.code || 1,
      };
    }
  }
}
