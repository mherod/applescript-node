import { ScriptExecutor } from '../executor.js';

/**
 * Execute a script and throw a contextual error when osascript reports failure.
 *
 * @example
 * await executeScriptOrThrow(script.build(), 'Failed to activate Safari');
 */
export async function executeScriptOrThrow(script: string, errorPrefix: string): Promise<void> {
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`${errorPrefix}: ${result.error}`);
  }
}

/**
 * Execute a script, throw on failure, and parse the JSON response.
 *
 * @example
 * const apps = await executeJsonScript<ApplicationInfo[]>(script.build(), {
 *   errorPrefix: 'Failed to get applications',
 *   fallbackJson: '[]',
 * });
 */
export async function executeJsonScript<T>(
  script: string,
  {
    errorPrefix,
    fallbackJson,
  }: {
    errorPrefix: string;
    fallbackJson: string;
  },
): Promise<T> {
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`${errorPrefix}: ${result.error}`);
  }

  return JSON.parse(result.output ?? fallbackJson) as T;
}
