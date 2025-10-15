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

export interface ScriptBuilder {
  // Core language constructs
  tell: (target: string) => ScriptBuilder;
  tellProcess: (processName: string) => ScriptBuilder;
  end: () => ScriptBuilder;
  if: (condition: string) => ScriptBuilder;
  then: () => ScriptBuilder;
  else: () => ScriptBuilder;
  elseIf: (condition: string) => ScriptBuilder;
  repeat: (times?: number) => ScriptBuilder;
  repeatWith: (variable: string, list: string) => ScriptBuilder;
  repeatUntil: (condition: string) => ScriptBuilder;
  repeatWhile: (condition: string) => ScriptBuilder;
  exitRepeat: () => ScriptBuilder;
  continueRepeat: () => ScriptBuilder;
  on: (handlerName: string, parameters?: string[]) => ScriptBuilder;
  considering: (attributes: string[]) => ScriptBuilder;
  ignoring: (attributes: string[]) => ScriptBuilder;
  using: (terms: string[]) => ScriptBuilder;
  with: (timeout?: number, transaction?: boolean) => ScriptBuilder;
  try: () => ScriptBuilder;
  onError: (variableName?: string) => ScriptBuilder;
  error: (message: string, number?: number) => ScriptBuilder;
  return: (value: AppleScriptValue) => ScriptBuilder;
  returnRaw: (expression: string) => ScriptBuilder;
  log: (message: string) => ScriptBuilder;
  comment: (text: string) => ScriptBuilder;

  // Enhanced Application control
  activate: () => ScriptBuilder;
  quit: () => ScriptBuilder;
  reopen: () => ScriptBuilder;
  launch: () => ScriptBuilder;
  running: () => ScriptBuilder;
  getRunningApplications: () => ScriptBuilder;
  getFrontmostApplication: () => ScriptBuilder;
  activateApplication: (appName: string) => ScriptBuilder;
  hideApplication: (appName: string) => ScriptBuilder;
  unhideApplication: (appName: string) => ScriptBuilder;
  quitApplication: (appName: string) => ScriptBuilder;
  isApplicationRunning: (appName: string) => ScriptBuilder;
  getApplicationInfo: (appName: string) => ScriptBuilder;

  // Enhanced Window management
  closeWindow: (window?: string) => ScriptBuilder;
  closeAllWindows: () => ScriptBuilder;
  minimizeWindow: (window?: string) => ScriptBuilder;
  zoomWindow: (window?: string) => ScriptBuilder;
  getWindowInfo: (appName: string, windowName?: string) => ScriptBuilder;
  getAllWindows: (appName: string) => ScriptBuilder;
  getFrontmostWindow: (appName: string) => ScriptBuilder;
  setWindowBounds: (
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ) => ScriptBuilder;
  moveWindow: (appName: string, windowName: string, x: number, y: number) => ScriptBuilder;
  resizeWindow: (
    appName: string,
    windowName: string,
    width: number,
    height: number,
  ) => ScriptBuilder;
  arrangeWindows: (arrangement: 'cascade' | 'tile' | 'stack') => ScriptBuilder;
  focusWindow: (appName: string, windowName: string) => ScriptBuilder;
  switchToWindow: (appName: string, windowName: string) => ScriptBuilder;

  // Enhanced UI interaction
  click: (target: string) => ScriptBuilder;
  keystroke: (text: string, modifiers?: string[]) => ScriptBuilder;
  delay: (seconds: number) => ScriptBuilder;
  pressKey: (
    key: string,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ) => ScriptBuilder;
  pressKeyCode: (
    keyCode: number,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ) => ScriptBuilder;
  typeText: (text: string) => ScriptBuilder;
  clickButton: (buttonName: string) => ScriptBuilder;
  clickMenuItem: (menuName: string, itemName: string) => ScriptBuilder;

  // Dialog and alerts
  displayDialog: (
    text: string,
    options?: {
      buttons?: string[];
      defaultButton?: string;
      withIcon?: 'stop' | 'note' | 'caution';
      givingUpAfter?: number;
    },
  ) => ScriptBuilder;
  displayNotification: (
    text: string,
    options?: {
      title?: string;
      subtitle?: string;
      sound?: string;
    },
  ) => ScriptBuilder;

  // Variables and properties
  set: (variable: string, value: AppleScriptValue) => ScriptBuilder;
  setExpression: (variable: string, expression: string | Record<string, string>) => ScriptBuilder;
  increment: (variable: string, by?: number) => ScriptBuilder;
  decrement: (variable: string, by?: number) => ScriptBuilder;
  get: (property: string) => ScriptBuilder;
  copy: (value: AppleScriptValue, to: string) => ScriptBuilder;
  count: (items: string) => ScriptBuilder;
  setCountOf: (variable: string, items: string) => ScriptBuilder;
  exists: (item: string) => ScriptBuilder;
  setEnd: (variable: string, value: AppleScriptValue) => ScriptBuilder;
  setEndRaw: (variable: string, expression: string | Record<string, string>) => ScriptBuilder;
  setEndRecord: (
    listVariable: string,
    sourceOrExpressions: string | Record<string, string>,
    propertyMap?: Record<string, string>,
  ) => ScriptBuilder;
  setProperty: (variable: string, property: string, value: AppleScriptValue) => ScriptBuilder;
  makeRecordFrom: (variableNames: Record<string, string>) => string;

  // List operations
  first: (items: string) => ScriptBuilder;
  last: (items: string) => ScriptBuilder;
  rest: (items: string) => ScriptBuilder;
  reverse: (items: string) => ScriptBuilder;
  some: (items: string, test: string) => ScriptBuilder;
  every: (items: string, test: string) => ScriptBuilder;
  whose: (items: string, condition: string) => string;
  getEvery: (itemType: string, location?: string) => ScriptBuilder;
  getEveryWhere: (itemType: string, condition: string, location?: string) => ScriptBuilder;

  // Text operations
  offset: (text: string, in_: string) => ScriptBuilder;
  contains: (text: string, in_: string) => ScriptBuilder;
  beginsWith: (text: string, with_: string) => ScriptBuilder;
  endsWith: (text: string, with_: string) => ScriptBuilder;

  // System operations
  path: (to: string) => ScriptBuilder;
  info: (for_: string) => ScriptBuilder;
  do: (script: string) => ScriptBuilder;
  doShellScript: (command: string, administrator?: boolean) => ScriptBuilder;

  // Raw script and building
  raw: (script: string) => ScriptBuilder;
  build: () => string;
  reset: () => ScriptBuilder;
}
