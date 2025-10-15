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

export const runScript = async <T = string>(
  script: string | ScriptBuilder,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> => {
  const scriptString = typeof script === 'string' ? script : script.build();
  return ScriptExecutor.execute<T>(scriptString, options);
};

export const runScriptFile = async <T = string>(
  filePath: string,
  options?: OsaScriptOptions,
): Promise<ScriptExecutionResult<T>> => ScriptExecutor.executeFile<T>(filePath, options);
