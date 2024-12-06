// Configuration options for script execution
export type OsaScriptOptions = {
  language?: 'AppleScript' | 'JavaScript';
  humanReadable?: boolean;
  errorToStdout?: boolean;
};

export type ScriptExecutionResult<T = unknown> = {
  success: boolean;
  output: T;
  error?: string;
  exitCode: number;
};

export type WindowInfo = {
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
};

export type ProcessInfo = {
  name: string;
  bundleId?: string;
  visible: boolean;
  frontmost: boolean;
};

export type ScriptBuilder = {
  // Core language constructs
  tell: (target: string) => ScriptBuilder;
  end: () => ScriptBuilder;
  if: (condition: string) => ScriptBuilder;
  then: () => ScriptBuilder;
  else: () => ScriptBuilder;
  repeat: (times?: number) => ScriptBuilder;
  repeatWith: (variable: string, list: string) => ScriptBuilder;
  repeatUntil: (condition: string) => ScriptBuilder;
  repeatWhile: (condition: string) => ScriptBuilder;
  on: (handlerName: string, parameters?: string[]) => ScriptBuilder;
  considering: (attributes: string[]) => ScriptBuilder;
  ignoring: (attributes: string[]) => ScriptBuilder;
  using: (terms: string[]) => ScriptBuilder;
  with: (timeout?: number, transaction?: boolean) => ScriptBuilder;
  try: () => ScriptBuilder;
  error: (message: string, number?: number) => ScriptBuilder;
  return: (value: AppleScriptValue) => ScriptBuilder;

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
  get: (property: string) => ScriptBuilder;
  copy: (value: AppleScriptValue, to: string) => ScriptBuilder;
  count: (items: string) => ScriptBuilder;
  exists: (item: string) => ScriptBuilder;

  // List operations
  first: (items: string) => ScriptBuilder;
  last: (items: string) => ScriptBuilder;
  rest: (items: string) => ScriptBuilder;
  reverse: (items: string) => ScriptBuilder;
  some: (items: string, test: string) => ScriptBuilder;
  every: (items: string, test: string) => ScriptBuilder;

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
};

export type AppleScriptValue =
  | string
  | number
  | boolean
  | null
  | AppleScriptValue[]
  | { [key: string]: AppleScriptValue };

export type ApplicationTarget = {
  name: string;
  bundleId?: string;
};

export type ScriptError = {
  message: string;
  line?: number;
  column?: number;
  source?: string;
};
