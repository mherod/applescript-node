import type { OsaScriptOptions, ScriptBuilder, ScriptExecutionResult } from './types.js';
import { ScriptExecutor } from './executor.js';
import { AppleScriptBuilder } from './builder.js';

export type {
  OsaScriptOptions,
  ScriptBuilder,
  ScriptExecutionResult,
  WindowInfo,
  ProcessInfo,
  AppleScriptValue,
  ApplicationTarget,
  ScriptError,
  ApplicationDictionary,
  Suite,
  Class,
  Command,
  Enumeration,
  Property,
  Element,
  Parameter,
  TypeInfo,
  Enumerator,
} from './types.js';
export * from './executor.js';
export * from './builder.js';
export * from './expressions.js';
export * from './languages.js';
export * from './compiler.js';
export * from './decompiler.js';
export * from './sdef.js';
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
): Promise<ScriptExecutionResult<T>> => {
  return ScriptExecutor.executeFile<T>(filePath, options);
};
