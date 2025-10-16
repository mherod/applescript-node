import type { ExprBuilder } from './expressions.js';

// Configuration options for script execution
export interface OsaScriptOptions {
  // The scripting language to use
  language?: 'AppleScript' | 'JavaScript';
  // Format output for human readability
  humanReadable?: boolean;
  // Direct errors to stdout instead of stderr
  errorToStdout?: boolean;
}

export interface ScriptExecutionResult<T = unknown> {
  success: boolean;
  output: T;
  error?: string;
  exitCode: number;
}

export interface WindowInfo {
  name: string;
  index: number;
  bounds?: {
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
 * ScriptBuilder with generic type tracking for variable scope.
 *
 * The generic type parameter `TScope` tracks variables that are in scope at any point
 * in the script. Loop methods like `forEach`, `forEachWhile`, and `forEachUntil` extend
 * the scope by adding their loop variable, enabling TypeScript autocomplete for those
 * variables within the loop callback.
 *
 * @template TScope - Union of variable names available in the current scope.
 *   Starts as `never` and is extended by loop methods.
 *
 * @example
 * // Basic loop - 'aPerson' is added to scope
 * createScript()
 *   .forEach('aPerson', 'every person', (b) => {
 *     // Within this callback, TScope = 'aPerson'
 *     b.setExpression('name', (e) => e.property('aPerson', 'name'));
 *     //                                        ^^^^^^^^ gets autocomplete!
 *   })
 *
 * @example
 * // Nested loops - both variables in scope
 * createScript()
 *   .forEach('anAccount', 'every account', (outer) => {
 *     // TScope = 'anAccount'
 *     outer.forEach('aNote', 'notes', (inner) => {
 *       // TScope = 'anAccount' | 'aNote'
 *       inner.setExpression('acc', (e) => e.property('anAccount', 'name'));
 *       inner.setExpression('note', (e) => e.property('aNote', 'name'));
 *     });
 *   })
 */
export interface ScriptBuilder<TScope extends string = never> {
  // Core language constructs
  tell: (target: string) => ScriptBuilder<TScope>;
  tellProcess: (processName: string) => ScriptBuilder<TScope>;
  end: () => ScriptBuilder<TScope>;
  // Explicit block endings for clarity
  endif: () => ScriptBuilder<TScope>;
  endrepeat: () => ScriptBuilder<TScope>;
  endtry: () => ScriptBuilder<TScope>;
  endtell: () => ScriptBuilder<TScope>;
  endon: () => ScriptBuilder<TScope>;
  endconsidering: () => ScriptBuilder<TScope>;
  endignoring: () => ScriptBuilder<TScope>;
  endusing: () => ScriptBuilder<TScope>;
  endwith: () => ScriptBuilder<TScope>;
  if: (condition: string | ((expr: ExprBuilder<TScope>) => string)) => ScriptBuilder<TScope>;
  then: () => ScriptBuilder<TScope>;
  else: () => ScriptBuilder<TScope>;
  elseIf: (condition: string) => ScriptBuilder<TScope>;
  repeat: (times?: number) => ScriptBuilder<TScope>;
  repeatWith: <TNewVar extends string>(
    variable: TNewVar,
    list: string,
  ) => ScriptBuilder<TScope | TNewVar>;
  repeatUntil: (condition: string) => ScriptBuilder<TScope>;
  repeatWhile: (condition: string) => ScriptBuilder<TScope>;
  exitRepeat: () => ScriptBuilder<TScope>;
  continueRepeat: () => ScriptBuilder<TScope>;
  on: (handlerName: string, parameters?: string[]) => ScriptBuilder<TScope>;
  considering: (attributes: string[]) => ScriptBuilder<TScope>;
  ignoring: (attributes: string[]) => ScriptBuilder<TScope>;
  using: (terms: string[]) => ScriptBuilder<TScope>;
  with: (timeout?: number, transaction?: boolean) => ScriptBuilder<TScope>;
  try: () => ScriptBuilder<TScope>;
  onError: (variableName?: string) => ScriptBuilder<TScope>;
  error: (message: string, number?: number) => ScriptBuilder<TScope>;
  return: (value: AppleScriptValue) => ScriptBuilder<TScope>;
  returnRaw: (expression: string) => ScriptBuilder<TScope>;
  buildJsonObject: (variableMap: Record<string, string>) => string;
  returnJsonObject: (variableMap: Record<string, string>) => ScriptBuilder<TScope>;
  returnAsJson: (
    listVariable: string,
    propertyMap: Record<string, string>,
  ) => ScriptBuilder<TScope>;
  mapToJson: (
    itemVariable: string,
    collection: string,
    properties: Record<string, string>,
    options?: {
      limit?: number;
      until?: string | ((expr: ExprBuilder<TScope>) => string);
      while?: string | ((expr: ExprBuilder<TScope>) => string);
      skipErrors?: boolean;
    },
  ) => ScriptBuilder<TScope>;
  log: (message: string) => ScriptBuilder<TScope>;
  comment: (text: string) => ScriptBuilder<TScope>;

  // Convenience helpers for cleaner API
  tellApp: (
    appName: string,
    block: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  ifThen: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
    thenBlock: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  ifThenElse: (
    condition: string | ((expr: ExprBuilder<TScope>) => string),
    thenBlock: (builder: ScriptBuilder<TScope>) => void,
    elseBlock: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  tryCatch: (
    tryBlock: (builder: ScriptBuilder<TScope>) => void,
    catchBlock: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  tryCatchError: (
    tryBlock: (builder: ScriptBuilder<TScope>) => void,
    errorVarName: string,
    catchBlock: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
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
    block: (builder: ScriptBuilder<TScope | TNewVar>) => void,
  ) => ScriptBuilder<TScope>;
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
    block: (builder: ScriptBuilder<TScope | TNewVar>) => void,
  ) => ScriptBuilder<TScope>;
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
    block: (builder: ScriptBuilder<TScope | TNewVar>) => void,
  ) => ScriptBuilder<TScope>;
  repeatTimes: (
    times: number,
    block: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  repeatWhileBlock: (
    condition: string,
    block: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;
  repeatUntilBlock: (
    condition: string,
    block: (builder: ScriptBuilder<TScope>) => void,
  ) => ScriptBuilder<TScope>;

  // Enhanced Application control
  activate: () => ScriptBuilder<TScope>;
  quit: () => ScriptBuilder<TScope>;
  reopen: () => ScriptBuilder<TScope>;
  launch: () => ScriptBuilder<TScope>;
  running: () => ScriptBuilder<TScope>;
  getRunningApplications: () => ScriptBuilder<TScope>;
  getFrontmostApplication: () => ScriptBuilder<TScope>;
  activateApplication: (appName: string) => ScriptBuilder<TScope>;
  hideApplication: (appName: string) => ScriptBuilder<TScope>;
  unhideApplication: (appName: string) => ScriptBuilder<TScope>;
  quitApplication: (appName: string) => ScriptBuilder<TScope>;
  isApplicationRunning: (appName: string) => ScriptBuilder<TScope>;
  getApplicationInfo: (appName: string) => ScriptBuilder<TScope>;

  // Enhanced Window management
  closeWindow: (window?: string) => ScriptBuilder<TScope>;
  closeAllWindows: () => ScriptBuilder<TScope>;
  minimizeWindow: (window?: string) => ScriptBuilder<TScope>;
  zoomWindow: (window?: string) => ScriptBuilder<TScope>;
  getWindowInfo: (appName: string, windowName?: string) => ScriptBuilder<TScope>;
  getAllWindows: (appName: string) => ScriptBuilder<TScope>;
  getFrontmostWindow: (appName: string) => ScriptBuilder<TScope>;
  setWindowBounds: (
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => ScriptBuilder<TScope>;
  moveWindow: (appName: string, windowName: string, x: number, y: number) => ScriptBuilder<TScope>;
  resizeWindow: (
    appName: string,
    windowName: string,
    width: number,
    height: number,
  ) => ScriptBuilder<TScope>;
  arrangeWindows: (arrangement: 'cascade' | 'tile' | 'stack') => ScriptBuilder<TScope>;
  focusWindow: (appName: string, windowName: string) => ScriptBuilder<TScope>;
  switchToWindow: (appName: string, windowName: string) => ScriptBuilder<TScope>;

  // Enhanced UI interaction
  click: (target: string) => ScriptBuilder<TScope>;
  keystroke: (text: string, modifiers?: string[]) => ScriptBuilder<TScope>;
  keystrokes: (text: string, delayBetween?: number) => ScriptBuilder<TScope>;
  delay: (seconds: number) => ScriptBuilder<TScope>;
  pressKey: (
    key: string,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ) => ScriptBuilder<TScope>;
  pressKeyCode: (
    keyCode: number,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ) => ScriptBuilder<TScope>;
  typeText: (text: string) => ScriptBuilder<TScope>;
  clickButton: (buttonName: string) => ScriptBuilder<TScope>;
  clickMenuItem: (menuName: string, itemName: string) => ScriptBuilder<TScope>;

  // Dialog and alerts
  displayDialog: (
    text: string,
    options?: {
      buttons?: string[];
      defaultButton?: string;
      withIcon?: 'stop' | 'note' | 'caution';
      givingUpAfter?: number;
    },
  ) => ScriptBuilder<TScope>;
  displayNotification: (
    text: string,
    options?: {
      title?: string;
      subtitle?: string;
      sound?: string;
    },
  ) => ScriptBuilder<TScope>;

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
  ) => ScriptBuilder<TScope | TNewVar>;
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
  ) => ScriptBuilder<TScope | TNewVar>;
  increment: (variable: string, by?: number) => ScriptBuilder<TScope>;
  decrement: (variable: string, by?: number) => ScriptBuilder<TScope>;
  get: (property: string) => ScriptBuilder<TScope>;
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
  ) => ScriptBuilder<TScope | TNewVar>;
  count: (items: string) => ScriptBuilder<TScope>;
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
  ) => ScriptBuilder<TScope | TNewVar>;
  exists: (item: string) => ScriptBuilder<TScope>;
  setEnd: (variable: string, value: AppleScriptValue) => ScriptBuilder<TScope>;
  setEndRaw: (
    variable: string,
    expression: string | Record<string, string> | ((expr: ExprBuilder<TScope>) => string),
  ) => ScriptBuilder<TScope>;
  setEndRecord: (
    listVariable: string,
    sourceOrExpressions: string | Record<string, string>,
    propertyMap?: Record<string, string>,
  ) => ScriptBuilder<TScope>;
  pickEndRecord: (
    listVariable: string,
    sourceObject: string,
    propertyMap: Record<string, string>,
  ) => ScriptBuilder<TScope>;
  setProperty: (
    variable: string,
    property: string,
    value: AppleScriptValue,
  ) => ScriptBuilder<TScope>;
  makeRecordFrom: (variableNames: Record<string, string>) => string;

  // List operations
  first: (items: string) => ScriptBuilder<TScope>;
  last: (items: string) => ScriptBuilder<TScope>;
  rest: (items: string) => ScriptBuilder<TScope>;
  reverse: (items: string) => ScriptBuilder<TScope>;
  some: (items: string, test: string) => ScriptBuilder<TScope>;
  every: (items: string, test: string) => ScriptBuilder<TScope>;
  whose: (items: string, condition: string) => string;
  getEvery: (itemType: string, location?: string) => ScriptBuilder<TScope>;
  getEveryWhere: (itemType: string, condition: string, location?: string) => ScriptBuilder<TScope>;

  // Text operations
  offset: (text: string, in_: string) => ScriptBuilder<TScope>;
  contains: (text: string, in_: string) => ScriptBuilder<TScope>;
  beginsWith: (text: string, with_: string) => ScriptBuilder<TScope>;
  endsWith: (text: string, with_: string) => ScriptBuilder<TScope>;

  // System operations
  path: (to: string) => ScriptBuilder<TScope>;
  info: (for_: string) => ScriptBuilder<TScope>;
  do: (script: string) => ScriptBuilder<TScope>;
  doShellScript: (command: string, administrator?: boolean) => ScriptBuilder<TScope>;

  // Raw script and building
  raw: (script: string) => ScriptBuilder<TScope>;
  build: () => string;
  reset: () => ScriptBuilder<TScope>;
}
