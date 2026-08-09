import { ScriptExecutor } from './executor.js';
import { parseScriptOutput } from './helpers.js';
import type { OsaScriptOptions, Prettify, ScriptBuilder, ScriptExecutionResult } from './types.js';

export * from './builder.js';
export * from './compiler.js';
export * from './decompiler.js';
export * from './executor.js';
export * from './expressions.js';
export * from './helpers.js';
export * from './languages.js';
export * from './loader.js';
export * from './sdef.js';
// High-level data source APIs
export * as sources from './sources/index.js';
export type {
  AppleScriptDiagnostic,
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
  Prettify,
  ProcessInfo,
  Property,
  PropertyExtractor,
  ScriptBuilder,
  ScriptError,
  ScriptExecutionResult,
  Suite,
  TypeInfo,
  WindowInfo,
} from './types.js';
export * from './validator.js';

export function runScript<TScope extends string, TReturn>(
  script: ScriptBuilder<TScope, TReturn>,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<Prettify<TReturn>>>;

// eslint-disable-next-line no-redeclare
export function runScript<T = string>(
  script: string,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<Prettify<T>>>;

// Implementation
// eslint-disable-next-line no-redeclare
export async function runScript<T = string>(
  script: string | ScriptBuilder<string, T>,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> {
  const scriptString = typeof script === 'string' ? script : script.build();

  // If the output looks like JSON (starts with '[' or '{'), it is parsed automatically.
  // This handles returnAsJson, mapToJson, and returnJsonObject which return JSON strings.
  return parseScriptOutput<T>(await ScriptExecutor.execute(scriptString, options));
}

export const runScriptFile = async <T = string>(
  filePath: string,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> => ScriptExecutor.executeFile<T>(filePath, options);
