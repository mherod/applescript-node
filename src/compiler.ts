import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const exec = promisify(execCallback);

export interface CompileOptions {
  language?: 'AppleScript' | 'JavaScript';
  executeOnly?: boolean;
  stayOpen?: boolean;
  useStartupScreen?: boolean;
  outputPath?: string;
  bundleScript?: boolean;
}

export interface CompileResult {
  success: boolean;
  outputPath: string;
  error?: string;
}

function buildCompileFlags(options: CompileOptions): string[] {
  const flags: string[] = [];

  if (options.language) {
    flags.push(`-l ${options.language}`);
  }

  if (options.executeOnly) {
    flags.push('-x');
  }

  if (options.stayOpen) {
    flags.push('-s');
  }

  if (options.useStartupScreen) {
    flags.push('-u');
  }

  return flags;
}

export async function compileScript(
  script: string,
  options: CompileOptions = {},
): Promise<CompileResult> {
  try {
    // Create a temporary file for the source script
    const tmpId = randomBytes(8).toString('hex');
    const sourcePath = join(tmpdir(), `script_${tmpId}.applescript`);
    await writeFile(sourcePath, script, 'utf8');

    // Determine output path
    const outputPath = options.outputPath ?? join(tmpdir(), `script_${tmpId}.scpt`);
    const outputExt = options.bundleScript ? '.scptd' : '.scpt';
    const finalOutputPath = outputPath.endsWith(outputExt)
      ? outputPath
      : `${outputPath}${outputExt}`;

    // Build and execute compile command
    const flags = buildCompileFlags(options);
    const command = `osacompile ${flags.join(' ')} -o "${finalOutputPath}" "${sourcePath}"`;

    await exec(command);

    return {
      success: true,
      outputPath: finalOutputPath,
    };
  } catch (error) {
    const err = error as { message: string };
    return {
      success: false,
      outputPath: '',
      error: err.message,
    };
  }
}

export async function compileScriptFile(
  filePath: string,
  options: CompileOptions = {},
): Promise<CompileResult> {
  try {
    // Determine output path
    const outputPath = options.outputPath ?? filePath.replace(/\.[^.]+$/, '.scpt');
    const outputExt = options.bundleScript ? '.scptd' : '.scpt';
    const finalOutputPath = outputPath.endsWith(outputExt)
      ? outputPath
      : `${outputPath}${outputExt}`;

    // Build and execute compile command
    const flags = buildCompileFlags(options);
    const command = `osacompile ${flags.join(' ')} -o "${finalOutputPath}" "${filePath}"`;

    await exec(command);

    return {
      success: true,
      outputPath: finalOutputPath,
    };
  } catch (error) {
    const err = error as { message: string };
    return {
      success: false,
      outputPath: '',
      error: err.message,
    };
  }
}
