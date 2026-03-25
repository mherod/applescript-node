import type { ExprBuilder } from './expressions.js';

/**
 * Utility type to expand and prettify complex types for better IDE tooltips.
 * Forces TypeScript to display the full expanded type instead of showing type aliases.
 * Handles arrays, objects, and primitives correctly.
 */
export type Prettify<T> = T extends T[]
  ? Prettify<T>[]
  : T extends object
    ? { [K in keyof T]: T[K] }
    : T;

// Configuration options for script execution
export interface OsaScriptOptions {
  // The scripting language to use
  language?: 'AppleScript' | 'JavaScript';
  // Format output for human readability
  humanReadable?: boolean;
  // Direct errors to stdout instead of stderr
  errorToStdout?: boolean;
}

export type ScriptExecutionResult<T = unknown> =
  | {
      success: true;
      output?: Prettify<T>;
      error?: undefined;
      exitCode: number;
    }
  | {
      success: false;
      output?: Prettify<T>;
      error: string;
      exitCode: number;
    };

/**
 * Window information for a single application window.
 * Used by builder methods like getWindowInfo() and getAllWindows().
 * For system-wide window enumeration, see sources.windows.WindowInfo.
 */
export interface WindowInfo {
  name: string;
  id: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  minimized: boolean;
  zoomed: boolean;
}

export interface ProcessInfo {
  name: string;
  bundleId?: string;
  visible: boolean;
  frontmost: boolean;
}

// AppleScript value types
export type AppleScriptPrimitive = string | number | boolean | null;
export type AppleScriptValue =
  | AppleScriptPrimitive
  | { [key: string]: AppleScriptValue }
  | AppleScriptValue[];

/**
 * Map AppleScript type names to TypeScript types.
 */
type AppleScriptTypeToTS<T extends string> = T extends 'string'
  ? string
  : T extends 'text'
    ? string
    : T extends 'integer'
      ? number
      : T extends 'real'
        ? number
        : T extends 'number'
          ? number
          : T extends 'boolean'
            ? boolean
            : T extends 'date'
              ? string
              : string; // Default to string for unknown types

/**
 * Infer TypeScript type from AppleScript property name.
 * Common boolean properties and patterns are mapped to boolean type.
 * Pattern matching includes:
 * - Properties ending in 'able' (capability/state)
 * - Properties ending in 'ed' (past tense/state)
 * - Common boolean properties
 */
type InferTypeFromPropertyName<T extends string> =
  // Pattern: ends with 'able' (closeable, resizable, movable, etc.)
  T extends `${string}able`
    ? boolean
    : // Pattern: ends with 'ed' (minimized, modified, titled, etc.)
      T extends `${string}ed`
      ? boolean
      : // Specific common boolean properties
        T extends
            | 'shared'
            | 'password protected'
            | 'passwordProtected'
            | 'company'
            | 'isCompany'
            | 'visible'
            | 'frontmost'
            | 'floating'
            | 'modal'
        ? boolean
        : string;

/**
 * Normalize a property definition to its runtime value type.
 * Extracts the TypeScript type from PropertyExtractor's asType field.
 * Simple string properties infer type from property name.
 */
type NormalizeProperty<T> = T extends string
  ? InferTypeFromPropertyName<T>
  : T extends { property: unknown }
    ? T extends { asType: infer TType extends string }
      ? AppleScriptTypeToTS<TType>
      : string
    : never;

/**
 * Helper type to infer the shape of objects returned by returnAsJson and mapToJson.
 * Intelligently infers TypeScript types from PropertyExtractor's asType field.
 * Simple string properties default to string type.
 *
 * @example
 * // Simple properties default to string
 * type Result1 = JsonObjectShape<{ id: 'id', name: 'name' }>;
 * // Result: { id: string, name: string }
 *
 * @example
 * // PropertyExtractor without asType defaults to string
 * type Result2 = JsonObjectShape<{
 *   id: 'id',
 *   email: { property: string, firstOf: true }
 * }>;
 * // Result: { id: string, email: string }
 *
 * @example
 * // PropertyExtractor with asType infers the correct TypeScript type
 * type Result3 = JsonObjectShape<{
 *   name: 'name',
 *   created: {
 *     property: (e: ExprBuilder<never>) => string;
 *     ifExists: true;
 *     asType: 'string';
 *   },
 *   count: {
 *     property: 'count',
 *     asType: 'integer';
 *   }
 * }>;
 * // Result: { name: string, created: string, count: number }
 */
export type JsonObjectShape<
  T extends Record<
    string,
    | string
    | {
        readonly property?: string | ((e: ExprBuilder) => string);
        readonly firstOf?: boolean;
        readonly ifExists?: boolean;
        readonly asType?: string;
        readonly default?: string | ((e: ExprBuilder) => string);
      }
  >,
> = Prettify<{
  [K in keyof T]: NormalizeProperty<T[K]>;
}>;

/**
 * Property extractor descriptor for advanced field transformations in mapToJson.
 * Allows specifying how to extract and transform individual properties.
 *
 * @example
 * // Simple string property (used as-is)
 * { name: 'name' }
 *
 * @example
 * // First item from collection or default
 * { email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true } }
 *
 * @example
 * // Property with existence check and type conversion
 * { birthday: { property: 'birth date', ifExists: true, asType: 'string' as const, default: 'missing value' } }
 */
export interface PropertyExtractor<TType extends string = string> {
  /**
   * The property expression to extract.
   * Can be a string (e.g., 'name', 'emails') or an ExprBuilder callback.
   */
  property: string | ((e: ExprBuilder) => string);

  /**
   * If true, gets the first item from the collection or uses default value if empty.
   * Uses setFirstOf() internally.
   */
  firstOf?: boolean;

  /**
   * If true, checks if the property exists before extracting it.
   * Uses setIfExists() internally.
   */
  ifExists?: boolean;

  /**
   * Optional type conversion (e.g., 'string', 'integer', 'text').
   * Only applies when if Exists is true.
   * Use `as const` to preserve the literal type: asType: 'string' as const
   */
  asType?: TType;

  /**
   * Default value to use if property is missing or empty.
   * Defaults to 'missing value' if not specified.
   */
  default?: string | ((e: ExprBuilder) => string);
}

export interface ApplicationTarget {
  name: string;
  bundleId?: string;
}

export interface ScriptError {
  message: string;
  line?: number;
  column?: number;
  source?: string;
}

// Scripting definition (sdef) types for application introspection
export interface TypeInfo {
  type: string;
  list?: boolean;
}

export interface Parameter {
  name: string;
  code: string;
  type: TypeInfo;
  optional?: boolean;
  description?: string;
}

export interface Property {
  name: string;
  code: string;
  type: TypeInfo;
  access: 'r' | 'rw';
  description?: string;
}

export interface Element {
  type: string;
  access?: 'r' | 'rw';
}

export interface Enumerator {
  name: string;
  code: string;
  description?: string;
}

export interface Enumeration {
  name: string;
  code: string;
  enumerators: Enumerator[];
}

export interface Command {
  name: string;
  code: string;
  description?: string;
  directParameter?: TypeInfo & { description?: string };
  parameters: Parameter[];
  result?: TypeInfo & { description?: string };
}

export interface Class {
  name: string;
  code: string;
  description?: string;
  plural?: string;
  inherits?: string;
  properties: Property[];
  elements: Element[];
}

export interface Suite {
  name: string;
  code: string;
  description?: string;
  classes: Class[];
  commands: Command[];
  enumerations: Enumeration[];
}

export interface ApplicationDictionary {
  suites: Suite[];
}

/**
 * ScriptBuilder with generic type tracking for variable scope and return type.
 *
 * @template TScope - Union of variable names available in the current scope.
 *   Starts as `never` and is extended by loop methods and variable assignments.
 * @template TReturn - The return type of the script when executed.
 *   Defaults to `unknown` and is set by methods like `returnAsJson()`.
 *
 * @example
 * // Variable scope tracking
 * createScript()
 *   .set('counter', 0)
 *   .forEach('aPerson', 'every person', (b) => {
 *     // Both 'counter' and 'aPerson' are in scope
 *     b.ifThen((e) => e.gte('counter', 50), ...)
 *   })
 *
 * @example
 * // Return type inference
 * const script = createScript()
 *   .tell('Contacts')
 *   .returnAsJson('results', {
 *     id: 'id',
 *     name: 'name',
 *     email: 'email',
 *   })
 *   .endtell();
 *
 * // Type is inferred: Array<{ id: unknown; name: unknown; email: unknown }>
 * const result = await runScript(script);
 * console.log(result.output[0].name); // TypeScript knows this exists!
 */
export interface ScriptBuilder<TScope extends string = never, TReturn = unknown> {
  // Core language constructs
  tell: (target: string) => ScriptBuilder<TScope, TReturn>;
  tellTarget: (target: string) => ScriptBuilder<TScope, TReturn>;
  tellProcess: (processName: string) => ScriptBuilder<TScope, TReturn>;
  end: () => ScriptBuilder<TScope, TReturn>;
  // Explicit block endings for clarity
  endif: () => ScriptBuilder<TScope, TReturn>;
  endrepeat: () => ScriptBuilder<TScope, TReturn>;
  endtry: () => ScriptBuilder<TScope, TReturn>;
  endtell: () => ScriptBuilder<TScope, TReturn>;
  endon: () => ScriptBuilder<TScope, TReturn>;
  endto: () => ScriptBuilder<TScope, TReturn>;
  endrun: () => ScriptBuilder<TScope, TReturn>;
  endquit: () => ScriptBuilder<TScope, TReturn>;
  endopen: () => ScriptBuilder<TScope, TReturn>;
  endidle: () => ScriptBuilder<TScope, TReturn>;
  endconsidering: () => ScriptBuilder<TScope, TReturn>;
  endignoring: () => ScriptBuilder<TScope, TReturn>;
  endusing: () => ScriptBuilder<TScope, TReturn>;
  endwith: () => ScriptBuilder<TScope, TReturn>;
  if: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope, TReturn>;
  thenBlock: () => ScriptBuilder<TScope, TReturn>;
  else: () => ScriptBuilder<TScope, TReturn>;
  elseIf: (condition: string) => ScriptBuilder<TScope, TReturn>;
  repeat: (times?: number) => ScriptBuilder<TScope, TReturn>;
  repeatWith: <TNewVar extends string>(
    variable: TNewVar,
    list: string,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  repeatUntil: (condition: string) => ScriptBuilder<TScope, TReturn>;
  repeatWhile: (condition: string) => ScriptBuilder<TScope, TReturn>;
  repeatWithRange: <TNewVar extends string>(
    variable: TNewVar,
    start: number | string,
    end: number | string,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  exitRepeat: () => ScriptBuilder<TScope, TReturn>;
  exitRepeatIf: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope, TReturn>;
  continueRepeat: () => ScriptBuilder<TScope, TReturn>;
  on: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope, TReturn>;
  to: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope, TReturn>;
  callHandler: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope, TReturn>;
  my: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope, TReturn>;
  ofMe: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope, TReturn>;
  onLabeled: (
    handlerName: string,
    labeledParams: Record<string, string>,
  ) => ScriptBuilder<TScope, TReturn>;
  toLabeled: (
    handlerName: string,
    labeledParams: Record<string, string>,
  ) => ScriptBuilder<TScope, TReturn>;
  runHandler: (explicit?: boolean) => ScriptBuilder<TScope, TReturn>;
  quitHandler: () => ScriptBuilder<TScope, TReturn>;
  openHandler: (parameterName?: string) => ScriptBuilder<TScope, TReturn>;
  idleHandler: () => ScriptBuilder<TScope, TReturn>;
  considering: (attributes: string[]) => ScriptBuilder<TScope, TReturn>;
  ignoring: (attributes: string[]) => ScriptBuilder<TScope, TReturn>;
  using: (terms: string[]) => ScriptBuilder<TScope, TReturn>;
  with: (timeout?: number, transaction?: boolean) => ScriptBuilder<TScope, TReturn>;
  try: () => ScriptBuilder<TScope, TReturn>;
  onError: (variableName?: string) => ScriptBuilder<TScope, TReturn>;
  error: (message: string, number?: number) => ScriptBuilder<TScope, TReturn>;
  return: (value: AppleScriptValue) => ScriptBuilder<TScope, TReturn>;
  returnRaw: (expression: string) => ScriptBuilder<TScope, TReturn>;
  buildJsonObject: (variableMap: Record<string, string>) => string;
  /**
   * Return a single JSON object from variables.
   * Sets the return type to the shape of the object.
   *
   * @template TProperties - Property map type (inferred)
   */
  returnJsonObject: <TProperties extends Record<string, string>>(
    variableMap: TProperties,
  ) => ScriptBuilder<TScope, JsonObjectShape<TProperties>>;
  /**
   * Return a list of records as a JSON array.
   * Sets the return type to an array of objects with the shape of the property map.
   *
   * @template TProperties - Property map type (inferred)
   * @param listVariable - Variable containing the list of records
   * @param propertyMap - Mapping of JSON keys to AppleScript properties
   * @returns Builder with return type set to Array<JsonObjectShape<TProperties>>
   *
   * @example
   * const script = createScript()
   *   .tell('Contacts')
   *   .returnAsJson('results', {
   *     id: 'id',
   *     name: 'name',
   *     email: 'email',
   *   })
   *   .endtell();
   *
   * // Type is inferred as: Array<{ id: string; name: string; email: string }>
   * const result = await runScript(script);
   * result.output[0].name; // TypeScript knows 'name' exists!
   */
  returnAsJson: <TProperties extends Record<string, string>>(
    listVariable: string,
    propertyMap: TProperties,
  ) => ScriptBuilder<TScope, JsonObjectShape<TProperties>[]>;
  /**
   * Map a collection to JSON with automatic iteration, property extraction, and type inference.
   * Sets the return type to an array of objects with the shape of the properties map.
   *
   * Supports advanced property extractors for field-level transformations:
   * - Simple strings for direct property access
   * - PropertyExtractor objects for firstOf, ifExists, and type conversion
   *
   * @template TProperties - Property map type (inferred)
   *
   * @example
   * // Simple properties
   * .mapToJson('aPerson', 'every person', {
   *   id: 'id',
   *   name: 'name'
   * })
   *
   * @example
   * // Advanced field extractors
   * .mapToJson('aPerson', 'every person', {
   *   id: 'id',
   *   name: 'name',
   *   email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
   *   birthday: { property: 'birth date', ifExists: true, asType: 'string' }
   * }, { limit: 50, skipErrors: true })
   */
  mapToJson: <
    TProperties extends Record<
      string,
      | string
      | {
          readonly property?: string | ((e: ExprBuilder) => string);
          readonly firstOf?: boolean;
          readonly ifExists?: boolean;
          readonly asType?: string;
          readonly default?: string | ((e: ExprBuilder) => string);
        }
    >,
  >(
    itemVariable: string,
    collection: string,
    properties: TProperties,
    options?: {
      limit?: number;
      until?: string | ((expr: ExprBuilder<TScope>) => string);
      while?: string | ((expr: ExprBuilder<TScope>) => string);
      skipErrors?: boolean;
    },
  ) => ScriptBuilder<TScope, JsonObjectShape<TProperties>[]>;
  log: (message: string) => ScriptBuilder<TScope, TReturn>;
  comment: (text: string) => ScriptBuilder<TScope, TReturn>;

  // Convenience helpers for cleaner API
  tellApp: (
    appName: string,
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  ifThen: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
    thenBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  ifThenElse: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
    thenBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
    elseBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  tryCatch: (
    tryBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
    catchBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  tryCatchError: (
    tryBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
    errorVarName: string,
    catchBlock: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  withApplicationActivated: (
    appName: string,
    body: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Iterate over a list with a loop variable, executing a block for each item.
   *
   * This is a generic method that extends the type scope. The loop variable `TNewVar`
   * is added to the scope within the callback, enabling TypeScript autocomplete.
   *
   * @template TNewVar - The name of the loop variable (inferred from first parameter)
   * @param variable - Loop variable name (will be added to scope)
   * @param list - AppleScript list expression to iterate over
   * @param block - Callback that receives a builder with extended scope (TScope | TNewVar)
   * @returns Builder instance for method chaining
   *
   * @example
   * .forEach('aPerson', 'every person', (b) => {
   *   // 'aPerson' is now in scope
   *   b.setExpression('name', (e) => e.property('aPerson', 'name'));
   *   b.setExpression('email', (e) => e.valueOfItem(1, e.property('aPerson', 'emails')));
   * })
   *
   * @example
   * // Nested loops with multiple scoped variables
   * .forEach('anAccount', 'every account', (outer) => {
   *   outer.forEach('aNote', 'notes of anAccount', (inner) => {
   *     // Both 'anAccount' and 'aNote' are in scope
   *     inner.setExpression('accountName', (e) => e.property('anAccount', 'name'));
   *     inner.setExpression('noteName', (e) => e.property('aNote', 'name'));
   *   });
   * })
   */
  forEach: <TNewVar extends string>(
    variable: TNewVar,
    list: string,
    block: (builder: ScriptBuilder<TScope | TNewVar, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Iterate over a list while a condition is true.
   *
   * This is a generic method that extends the type scope. The loop variable is added
   * to the scope, and the condition callback also receives the extended scope.
   *
   * @template TNewVar - The name of the loop variable (inferred from first parameter)
   * @param variable - Loop variable name (will be added to scope)
   * @param list - AppleScript list expression to iterate over
   * @param condition - Condition to check before each iteration (string or callback with scoped ExprBuilder)
   * @param block - Callback that receives a builder with extended scope
   * @returns Builder instance for method chaining
   *
   * @example
   * .forEachWhile(
   *   'aPerson',
   *   'matchingPeople',
   *   (e) => e.exists(e.property('aPerson', 'email')),  // 'aPerson' in scope
   *   (b) => {
   *     b.setExpression('email', (e) =>
   *       e.valueOfItem(1, e.property('aPerson', 'emails'))  // 'aPerson' in scope
   *     );
   *   }
   * )
   */
  forEachWhile: <TNewVar extends string>(
    variable: TNewVar,
    list: string,
    condition: string | ((expr: ExprBuilder<TScope | TNewVar>) => string),
    block: (builder: ScriptBuilder<TScope | TNewVar, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Iterate over a list until a condition becomes true (then exit loop).
   *
   * This is a generic method that extends the type scope. The loop variable is added
   * to the scope, and both the condition callback and block callback receive the extended scope.
   *
   * @template TNewVar - The name of the loop variable (inferred from first parameter)
   * @param variable - Loop variable name (will be added to scope)
   * @param list - AppleScript list expression to iterate over
   * @param condition - Exit condition (loop stops when this becomes true)
   * @param block - Callback that receives a builder with extended scope
   * @returns Builder instance for method chaining
   *
   * @example
   * .set('counter', 0)
   * .forEachUntil(
   *   'aPerson',
   *   'matchingPeople',
   *   (e) => e.gte('counter', 50),  // Exit when counter >= 50
   *   (b) => {
   *     b.increment('counter');
   *     b.ifThen(
   *       (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),  // 'aPerson' in scope
   *       (then_) => then_.setExpression('email', (e) =>
   *         e.valueOfItem(1, e.property('aPerson', 'emails'))
   *       )
   *     );
   *   }
   * )
   */
  forEachUntil: <TNewVar extends string>(
    variable: TNewVar,
    list: string,
    condition: string | ((expr: ExprBuilder<TScope | TNewVar>) => string),
    block: (builder: ScriptBuilder<TScope | TNewVar, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  repeatTimes: (
    times: number,
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  repeatWhileBlock: (
    condition: string,
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  repeatUntilBlock: (
    condition: string,
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;

  // Enhanced Application control
  activate: () => ScriptBuilder<TScope, TReturn>;
  quit: () => ScriptBuilder<TScope, TReturn>;
  reopen: () => ScriptBuilder<TScope, TReturn>;
  launch: () => ScriptBuilder<TScope, TReturn>;
  running: () => ScriptBuilder<TScope, TReturn>;
  getRunningApplications: () => ScriptBuilder<TScope, TReturn>;
  getFrontmostApplication: () => ScriptBuilder<TScope, TReturn>;
  activateApplication: (appName: string) => ScriptBuilder<TScope, TReturn>;
  hideApplication: (appName: string) => ScriptBuilder<TScope, TReturn>;
  unhideApplication: (appName: string) => ScriptBuilder<TScope, TReturn>;
  quitApplication: (appName: string) => ScriptBuilder<TScope, TReturn>;
  isApplicationRunning: (appName: string) => ScriptBuilder<TScope, TReturn>;
  getApplicationInfo: (appName: string) => ScriptBuilder<TScope, TReturn>;

  // Enhanced Window management
  closeWindow: (window?: string) => ScriptBuilder<TScope, TReturn>;
  closeAllWindows: () => ScriptBuilder<TScope, TReturn>;
  minimizeWindow: (window?: string) => ScriptBuilder<TScope, TReturn>;
  zoomWindow: (window?: string) => ScriptBuilder<TScope, TReturn>;
  getWindowInfo: (appName: string, windowName?: string) => ScriptBuilder<TScope, TReturn>;
  getAllWindows: (appName: string) => ScriptBuilder<TScope, TReturn>;
  getFrontmostWindow: (appName: string) => ScriptBuilder<TScope, TReturn>;
  setWindowBounds: (
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => ScriptBuilder<TScope, TReturn>;
  moveWindow: (
    appName: string,
    windowName: string,
    x: number,
    y: number,
  ) => ScriptBuilder<TScope, TReturn>;
  resizeWindow: (
    appName: string,
    windowName: string,
    width: number,
    height: number,
  ) => ScriptBuilder<TScope, TReturn>;
  arrangeWindows: (arrangement: 'cascade' | 'tile' | 'stack') => ScriptBuilder<TScope, TReturn>;
  focusWindow: (appName: string, windowName: string) => ScriptBuilder<TScope, TReturn>;
  switchToWindow: (appName: string, windowName: string) => ScriptBuilder<TScope, TReturn>;

  // Enhanced UI interaction
  click: (target: string) => ScriptBuilder<TScope, TReturn>;
  select: (target: string) => ScriptBuilder<TScope, TReturn>;
  keystroke: (text: string, modifiers?: string[]) => ScriptBuilder<TScope, TReturn>;
  keystrokes: (text: string, delayBetween?: number) => ScriptBuilder<TScope, TReturn>;
  delay: (seconds: number) => ScriptBuilder<TScope, TReturn>;
  pressKey: (
    key: string,
    modifiers?: ('command' | 'option' | 'control' | 'shift')[],
  ) => ScriptBuilder<TScope, TReturn>;
  pressKeyCode: (
    keyCode: number,
    modifiers?: ('command' | 'option' | 'control' | 'shift')[],
  ) => ScriptBuilder<TScope, TReturn>;
  typeText: (text: string) => ScriptBuilder<TScope, TReturn>;
  clickButton: (buttonName: string) => ScriptBuilder<TScope, TReturn>;
  clickMenuItem: (menuName: string, itemName: string) => ScriptBuilder<TScope, TReturn>;

  /**
   * iTerm2 (terminal) scripting via its AppleScript dictionary.
   * Deprecated upstream in favor of the Python API, but still widely used.
   * Default application name is `iTerm2`; pass `applicationName` if your install
   * exposes a different scripting name (e.g. legacy `iTerm`).
   */
  tellITerm2: (
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
    options?: { applicationName?: string },
  ) => ScriptBuilder<TScope, TReturn>;
  itermTellCurrentWindow: (
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  itermTellCurrentSession: (
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  itermTellSession: (
    sessionRef: string,
    block: (builder: ScriptBuilder<TScope, TReturn>) => void,
  ) => ScriptBuilder<TScope, TReturn>;
  itermCreateWindowWithDefaultProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermCreateWindowWithProfile: (
    profileName: string,
    options?: { command?: string },
  ) => ScriptBuilder<TScope, TReturn>;
  itermCreateHotkeyWindowWithProfile: (profileName: string) => ScriptBuilder<TScope, TReturn>;
  itermCreateTabWithDefaultProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermCreateTabWithProfile: (
    profileName: string,
    options?: { command?: string },
  ) => ScriptBuilder<TScope, TReturn>;
  itermSplitHorizontallyWithDefaultProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermSplitVerticallyWithDefaultProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermSplitHorizontallyWithProfile: (
    profileName: string,
    options?: { command?: string },
  ) => ScriptBuilder<TScope, TReturn>;
  itermSplitVerticallyWithProfile: (
    profileName: string,
    options?: { command?: string },
  ) => ScriptBuilder<TScope, TReturn>;
  itermSplitHorizontallyWithSameProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermSplitVerticallyWithSameProfile: (options?: {
    command?: string;
  }) => ScriptBuilder<TScope, TReturn>;
  itermWriteText: (text: string, options?: { newline?: boolean }) => ScriptBuilder<TScope, TReturn>;
  itermWriteContentsOfFile: (path: string) => ScriptBuilder<TScope, TReturn>;
  itermSetSessionVariable: (name: string, value: string) => ScriptBuilder<TScope, TReturn>;
  itermCloseSession: () => ScriptBuilder<TScope, TReturn>;
  itermCloseTab: () => ScriptBuilder<TScope, TReturn>;
  itermCloseCurrentWindow: () => ScriptBuilder<TScope, TReturn>;
  itermRevealHotkeyWindow: () => ScriptBuilder<TScope, TReturn>;
  itermHideHotkeyWindow: () => ScriptBuilder<TScope, TReturn>;
  itermToggleHotkeyWindow: () => ScriptBuilder<TScope, TReturn>;
  itermSelectPreviousSession: () => ScriptBuilder<TScope, TReturn>;
  itermSelectNextSession: () => ScriptBuilder<TScope, TReturn>;
  itermSetSessionName: (name: string) => ScriptBuilder<TScope, TReturn>;
  itermGetSessionName: (variableName: string) => ScriptBuilder<TScope, TReturn>;
  itermGetSessionTty: (variableName: string) => ScriptBuilder<TScope, TReturn>;

  // Dialog and alerts
  displayDialog: (
    text: string,
    options?: {
      buttons?: string[];
      defaultButton?: string;
      withIcon?: 'stop' | 'note' | 'caution';
      givingUpAfter?: number;
    },
  ) => ScriptBuilder<TScope, TReturn>;
  displayNotification: (
    text: string,
    options?: {
      title?: string;
      subtitle?: string;
      sound?: string;
    },
  ) => ScriptBuilder<TScope, TReturn>;

  // Variables and properties
  /**
   * Set a variable to a value and add it to the tracked scope.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param value - Value to assign
   * @returns Builder with extended scope including the new variable
   *
   * @example
   * createScript()
   *   .set('counter', 0)
   *   .set('results', [])
   *   .forEachUntil('aNote', 'every note',
   *     (e) => e.gte('counter', 50),  // 'counter' is in scope!
   *     (b) => {
   *       b.increment('counter');
   *       b.setEndRecord('results', {...});  // 'results' is in scope!
   *     }
   *   )
   */
  set: <TNewVar extends string>(
    variable: TNewVar,
    value: AppleScriptValue,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  /**
   * Set a variable to an expression and add it to the tracked scope.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param expression - Expression (string, record, or callback)
   * @returns Builder with extended scope including the new variable
   *
   * @example
   * .setExpression('personEmail', (e) =>
   *   e.valueOfItem(1, e.property('aPerson', 'emails'))
   * )
   * // Later 'personEmail' is in scope
   */
  setExpression: <TNewVar extends string>(
    variable: TNewVar,
    expression: string | Record<string, string> | ((expr: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  setExpressions: (
    expressions: Record<string, string | ((expr: ExprBuilder<TScope>) => string)>,
  ) => ScriptBuilder<TScope, TReturn>;
  appendTo: (
    variable: string,
    expression: string | ((expr: ExprBuilder<TScope>) => string),
    options?: { prependLinefeed?: boolean; appendLinefeed?: boolean },
  ) => ScriptBuilder<TScope, TReturn>;
  increment: (variable: string, by?: number) => ScriptBuilder<TScope, TReturn>;
  decrement: (variable: string, by?: number) => ScriptBuilder<TScope, TReturn>;
  get: (property: string) => ScriptBuilder<TScope, TReturn>;
  /**
   * Copy a value to a variable and add it to the tracked scope.
   *
   * @template TNewVar - The variable name (inferred from second parameter)
   * @param value - Value to copy
   * @param to - Variable name (will be added to scope)
   * @returns Builder with extended scope including the new variable
   */
  copy: <TNewVar extends string>(
    value: AppleScriptValue,
    to: TNewVar,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  count: (items: string) => ScriptBuilder<TScope, TReturn>;
  /**
   * Set a variable to the count of items and add it to the tracked scope.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param items - Items to count
   * @returns Builder with extended scope including the new variable
   */
  setCountOf: <TNewVar extends string>(
    variable: TNewVar,
    items: string,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  exists: (item: string) => ScriptBuilder<TScope, TReturn>;
  setEnd: (variable: string, value: AppleScriptValue) => ScriptBuilder<TScope, TReturn>;
  setEndRaw: (
    variable: string,
    expression: string | Record<string, string> | ((expr: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope, TReturn>;
  setEndRecord: (
    listVariable: string,
    sourceOrExpressions: string | Record<string, string>,
    propertyMap?: Record<string, string>,
  ) => ScriptBuilder<TScope, TReturn>;
  pickEndRecord: (
    listVariable: string,
    sourceObject: string,
    propertyMap: Record<string, string>,
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Set variable using ternary operator pattern with if-then-else block.
   * Much more concise than manually calling ifThenElse for simple conditional assignments.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param condition - Condition to evaluate (string or ExprBuilder callback)
   * @param trueExpression - Expression to use if condition is true
   * @param falseExpression - Expression to use if condition is false
   * @returns Builder with extended scope including the new variable
   *
   * @example
   * // Replaces verbose manual ifThenElse calls for simple assignments
   * .setTernary('personEmail',
   *   (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
   *   (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
   *   'missing value'
   * )
   * // Generates an if-then-else block that conditionally sets personEmail
   */
  setTernary: <TNewVar extends string>(
    variable: TNewVar,
    condition: string | ((e: ExprBuilder<TScope>) => string),
    trueExpression: string | ((e: ExprBuilder<TScope>) => string),
    falseExpression: string | ((e: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  /**
   * Append to list using ternary operator pattern with if-then-else block.
   * Combines setEndRaw with conditional logic for ultra-concise syntax.
   *
   * @param listVariable - Name of the list to append to
   * @param condition - Condition to evaluate (string or ExprBuilder callback)
   * @param trueExpression - Expression to append if condition is true
   * @param falseExpression - Expression to append if condition is false
   * @returns Builder instance for method chaining
   *
   * @example
   * // Conditionally append different values based on condition
   * .forEach('item', 'every file of desktop', (loop) =>
   *   loop.setEndTernary('results',
   *     (e) => e.gt(e.property('item', 'size'), 1000000),
   *     '"large"',
   *     '"small"'
   *   )
   * )
   * // Generates an if-then-else block that conditionally appends to results
   */
  setEndTernary: (
    listVariable: string,
    condition: string | ((e: ExprBuilder<TScope>) => string),
    trueExpression: string | ((e: ExprBuilder<TScope>) => string),
    falseExpression: string | ((e: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Set variable to first item of collection or default value if collection is empty.
   * Ultra-shorthand for the common "first or default" pattern.
   *
   * Automatically generates: `set variable to (if count of collection > 0 then value of item 1 of collection else defaultValue)`
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param collection - Collection expression (string or ExprBuilder callback)
   * @param defaultValue - Value to use if collection is empty (defaults to 'missing value')
   * @returns Builder with extended scope including the new variable
   *
   * @example
   * // OLD WAY: Verbose ternary with explicit condition
   * .setTernary('personEmail',
   *   (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
   *   (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
   *   'missing value'
   * )
   *
   * // NEW WAY: Ultra-concise first-or-default
   * .setFirstOf('personEmail', (e) => e.property('aPerson', 'emails'))
   *
   * @example
   * // With custom default value
   * .setFirstOf('userEmail', 'emailAddresses', '"noreply@example.com"')
   */
  setFirstOf: <TNewVar extends string>(
    variable: TNewVar,
    collection: string | ((e: ExprBuilder<TScope>) => string),
    defaultValue?: string | ((e: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  /**
   * Append first item of collection or default value to a list.
   * Ultra-shorthand for the common "first or default" pattern in list building.
   *
   * Automatically generates: `set end of list to (if count of collection > 0 then value of item 1 of collection else defaultValue)`
   *
   * @param listVariable - Name of the list to append to
   * @param collection - Collection expression (string or ExprBuilder callback)
   * @param defaultValue - Value to append if collection is empty (defaults to 'missing value')
   * @returns Builder instance for method chaining
   *
   * @example
   * // Building a list with first-or-default pattern
   * .set('emailList', [])
   * .forEach('person', 'every person', (loop) =>
   *   loop.setEndFirstOf('emailList', (e) => e.property('person', 'emails'))
   * )
   *
   * @example
   * // With custom default
   * .setEndFirstOf('phoneNumbers', 'availablePhones', '"555-0000"')
   */
  setEndFirstOf: (
    listVariable: string,
    collection: string | ((e: ExprBuilder<TScope>) => string),
    defaultValue?: string | ((e: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope, TReturn>;
  /**
   * Set variable to property value if it exists, otherwise use default value.
   * Ultra-shorthand for the common "take if exists or default" pattern.
   *
   * Automatically generates: `if exists property then set variable to property [as type] else set variable to defaultValue`
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param property - Property expression to check and retrieve (string or ExprBuilder callback)
   * @param defaultValue - Value to use if property doesn't exist (defaults to 'missing value')
   * @param asType - Optional type to convert property to (e.g., 'string', 'integer')
   * @returns Builder with extended scope including the new variable
   *
   * @example
   * // OLD WAY: Verbose ternary with exists check and type conversion
   * .setTernary('personBirthday',
   *   (e) => e.exists(e.property('aPerson', 'birth date')),
   *   (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
   *   'missing value'
   * )
   *
   * // NEW WAY: Ultra-concise if-exists with type conversion
   * .setIfExists('personBirthday',
   *   (e) => e.property('aPerson', 'birth date'),
   *   'missing value',
   *   'string'
   * )
   *
   * @example
   * // Even simpler with string expression
   * .setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string')
   *
   * @example
   * // Without type conversion
   * .setIfExists('personNote', 'note of aPerson', '""')
   */
  setIfExists: <TNewVar extends string>(
    variable: TNewVar,
    property: string | ((e: ExprBuilder<TScope>) => string),
    defaultValue?: string | ((e: ExprBuilder<TScope>) => string),
    asType?: string,
  ) => ScriptBuilder<TScope | TNewVar, TReturn>;
  /**
   * Append property value to list if it exists, otherwise append default value.
   * Ultra-shorthand for the common "take if exists or default" pattern in list building.
   *
   * Automatically generates: `if exists property then set end of list to property [as type] else set end of list to defaultValue`
   *
   * @param listVariable - Name of the list to append to
   * @param property - Property expression to check and retrieve (string or ExprBuilder callback)
   * @param defaultValue - Value to append if property doesn't exist (defaults to 'missing value')
   * @param asType - Optional type to convert property to (e.g., 'string', 'integer')
   * @returns Builder instance for method chaining
   *
   * @example
   * // Building a list with if-exists pattern
   * .set('birthdayList', [])
   * .forEach('person', 'every person', (loop) =>
   *   loop.setEndIfExists('birthdayList',
   *     'birth date of person',
   *     '""',
   *     'string'
   *   )
   * )
   *
   * @example
   * // With ExprBuilder
   * .setEndIfExists('notes',
   *   (e) => e.property('contact', 'note'),
   *   'missing value'
   * )
   */
  setEndIfExists: (
    listVariable: string,
    property: string | ((e: ExprBuilder<TScope>) => string),
    defaultValue?: string | ((e: ExprBuilder<TScope>) => string),
    asType?: string,
  ) => ScriptBuilder<TScope, TReturn>;
  setProperty: (
    variable: string,
    property: string,
    value: AppleScriptValue,
  ) => ScriptBuilder<TScope, TReturn>;
  makeRecordFrom: (variableNames: Record<string, string>) => string;

  // List operations
  first: (items: string) => ScriptBuilder<TScope, TReturn>;
  last: (items: string) => ScriptBuilder<TScope, TReturn>;
  rest: (items: string) => ScriptBuilder<TScope, TReturn>;
  reverse: (items: string) => ScriptBuilder<TScope, TReturn>;
  some: (items: string, test: string) => ScriptBuilder<TScope, TReturn>;
  every: (items: string, test: string) => ScriptBuilder<TScope, TReturn>;
  whose: (items: string, condition: string) => string;
  getEvery: (itemType: string, location?: string) => ScriptBuilder<TScope, TReturn>;
  getEveryWhere: (
    itemType: string,
    condition: string,
    location?: string,
  ) => ScriptBuilder<TScope, TReturn>;

  // Text operations
  offset: (text: string, in_: string) => ScriptBuilder<TScope, TReturn>;
  contains: (text: string, in_: string) => ScriptBuilder<TScope, TReturn>;
  beginsWith: (text: string, with_: string) => ScriptBuilder<TScope, TReturn>;
  endsWith: (text: string, with_: string) => ScriptBuilder<TScope, TReturn>;

  // System operations
  path: (to: string) => ScriptBuilder<TScope, TReturn>;
  info: (for_: string) => ScriptBuilder<TScope, TReturn>;
  do: (script: string) => ScriptBuilder<TScope, TReturn>;
  doShellScript: (command: string, administrator?: boolean) => ScriptBuilder<TScope, TReturn>;

  // Raw script and building
  raw: (script: string) => ScriptBuilder<TScope, TReturn>;
  build: () => string;
  reset: () => ScriptBuilder<TScope, TReturn>;
}
