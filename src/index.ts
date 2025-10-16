import { AppleScriptBuilder } from './builder.js';
import { ScriptExecutor } from './executor.js';
import type { OsaScriptOptions, ScriptBuilder, ScriptExecutionResult } from './types.js';

export * from './builder.js';
export * from './compiler.js';
export * from './decompiler.js';
export * from './executor.js';
export * from './expressions.js';
export * from './languages.js';
export * from './sdef.js';
// High-level data source APIs
export * as sources from './sources/index.js';
export type {
  AppleScriptValue,
  ApplicationDictionary,
  ApplicationTarget,
  Class,
  Command,
  Element,
  Enumeration,
  Enumerator,
  OsaScriptOptions,
  Parameter,
  ProcessInfo,
  Property,
  ScriptBuilder,
  ScriptError,
  ScriptExecutionResult,
  Suite,
  TypeInfo,
  WindowInfo,
} from './types.js';
export * from './validator.js';

export const createScript = () => new AppleScriptBuilder();

// Overload 1: When passing ScriptBuilder, extract and use its TReturn type

export function runScript<TScope extends string, TReturn>(
  script: ScriptBuilder<TScope, TReturn>,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<TReturn>>;

// Overload 2: When passing string, use explicit generic parameter T
// eslint-disable-next-line no-redeclare
export function runScript<T = string>(
  script: string,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>>;

// Implementation
// eslint-disable-next-line no-redeclare
export async function runScript<T = string>(
  script: string | ScriptBuilder<string, T>,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> {
  const scriptString = typeof script === 'string' ? script : script.build();
  const result = await ScriptExecutor.execute(scriptString, options);

  // If the output looks like JSON (starts with '[' or '{'), parse it automatically
  // This handles returnAsJson, mapToJson, and returnJsonObject which return JSON strings
  if (result.success && result.output) {
    const trimmed = result.output.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(result.output) as T;
        return {
          ...result,
          output: parsed,
        };
      } catch {
        // If parsing fails, return the string as-is
        // This handles cases where the string happens to start with '[' or '{' but isn't valid JSON
      }
    }
  }

  return result as ScriptExecutionResult<T>;
}

export const runScriptFile = async <T = string>(
  filePath: string,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> => ScriptExecutor.executeFile<T>(filePath, options);
