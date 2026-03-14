import { ScriptExecutor } from '../executor.js';

/**
 * Execute a script and throw a contextual error when osascript reports failure.
 *
 * @example
 * await executeScriptOrThrow(script.build(), 'Failed to activate Safari');
 */
export async function executeScriptOrThrow(script: string, errorContext: string): Promise<void> {
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`${errorContext}: ${result.error}`);
  }
}

/**
 * Execute a script, throw on failure, and parse the JSON response.
 *
 * @example
 * const apps = await executeJsonScript<ApplicationInfo[]>(script.build(), {
 *   errorContext: 'Failed to get applications',
 *   fallbackJson: '[]',
 * });
 */
export async function executeJsonScript<T>(
  script: string,
  {
    errorContext,
    fallbackJson,
  }: {
    errorContext: string;
    fallbackJson: string;
  },
): Promise<T> {
  const result = await ScriptExecutor.execute(script);

  if (!result.success) {
    throw new Error(`${errorContext}: ${result.error}`);
  }

  const raw = result.output ?? fallbackJson;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return JSON.parse(fallbackJson) as T;
  }
}
