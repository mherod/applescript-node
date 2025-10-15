import { exec as execCallback } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCallback);

export interface DecompileResult {
  success: boolean;
  source?: string;
  error?: string;
}

export async function decompileScript(scriptPath: string): Promise<DecompileResult> {
  try {
    const { stdout, stderr } = await exec(`osadecompile "${scriptPath}"`);

    if (stderr) {
      return {
        success: false,
        error: stderr.trim(),
      };
    }

    return {
      success: true,
      source: stdout.trim(),
    };
  } catch (error) {
    const err = error as { message: string };
    return {
      success: false,
      error: err.message,
    };
  }
}
