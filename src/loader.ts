import { AppleScriptBuilder } from './builder.js';
import { runtime } from './runtime/active.js';

/**
 * Load an AppleScript file and return a builder instance that can be edited further.
 * The script is parsed to maintain proper block structure (tell, if, repeat, etc.)
 * so you can continue adding commands using the fluent builder API.
 *
 * @param filePath Absolute or relative path to the AppleScript (.applescript or .scpt) file
 * @returns Promise that resolves to an AppleScriptBuilder instance with the loaded script
 * @throws Error if the file cannot be read
 *
 * @example
 * ```typescript
 * // Load an existing script and append new commands
 * const script = await loadScript('./my-script.applescript');
 * script
 *   .tell('Finder')
 *   .displayDialog('Script loaded and extended!')
 *   .endtell();
 *
 * const result = await runScript(script);
 * console.log(result.output);
 * ```
 */
export async function loadScript(filePath: string): Promise<AppleScriptBuilder> {
  try {
    const content = await runtime.readFile(filePath);
    const builder = new AppleScriptBuilder();
    builder.loadFromScript(content);
    return builder;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to load script from ${filePath}: ${error.message}`);
    }
    throw error;
  }
}
