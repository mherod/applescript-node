import type { AppleScriptValue, ScriptBuilder } from './types.js';

type BlockType =
  | 'tell'
  | 'if'
  | 'repeat'
  | 'considering'
  | 'ignoring'
  | 'using'
  | 'with'
  | 'try'
  | 'on';

class ScriptBuilderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptBuilderError';
  }
}

export class AppleScriptBuilder implements ScriptBuilder {
  private script: string[] = [];
  private indentLevel = 0;
  private readonly INDENT = '  ';
  private blockStack: Array<{ type: BlockType; target?: string }> = [];

  private getIndentation(): string {
    return this.INDENT.repeat(this.indentLevel);
  }

  private escapeString(str: string): string {
    // In AppleScript, backslashes and quotes need to be escaped
    // Also handle common escape sequences
    return str
      .replace(/\\/g, '\\\\') // Backslash
      .replace(/"/g, '\\"') // Quote
      .replace(/\n/g, '\\n') // Newline
      .replace(/\r/g, '\\r') // Carriage return
      .replace(/\t/g, '\\t'); // Tab
  }

  private formatValue(value: AppleScriptValue): string {
    if (value === null) return 'missing value';
    if (typeof value === 'string') return `"${this.escapeString(value)}"`;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) {
      return `{${value.map((v) => this.formatValue(v)).join(', ')}}`;
    }
    const entries = Object.entries(value as Record<string, AppleScriptValue>)
      .map(([k, v]) => `${k}:${this.formatValue(v)}`)
      .join(', ');
    return `{${entries}}`;
  }

  private makeRecord(properties: Record<string, AppleScriptValue>): string {
    const entries = Object.entries(properties)
      .map(([k, v]) => `${k}:${this.formatValue(v)}`)
      .join(', ');
    return `{${entries}}`;
  }

  private validateBlockStack(): void {
    if (this.blockStack.length > 0) {
      const unclosedBlocks = this.blockStack.map((b) => b.type).join(', ');
      throw new ScriptBuilderError(`Unclosed blocks remain: ${unclosedBlocks}`);
    }
  }

  private pushBlock(type: BlockType, target?: string): void {
    this.blockStack.push({ type, target });
    this.indentLevel++;
  }

  private popBlock(): void {
    if (this.blockStack.length === 0) {
      throw new ScriptBuilderError('Cannot end block: no blocks are currently open');
    }
    this.blockStack.pop();
    this.indentLevel--;
  }

  private addLine(line: string): void {
    this.script.push(`${this.getIndentation()}${line}`);
  }

  // Core language constructs
  tell(target: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}tell application "${this.escapeString(target)}"`);
    this.pushBlock('tell', target);
    return this;
  }

  tellProcess(processName: string): ScriptBuilder {
    this.script.push(
      `${this.getIndentation()}tell application "System Events" to tell process "${this.escapeString(processName)}"`,
    );
    this.pushBlock('tell', processName);
    return this;
  }

  on(handlerName: string, parameters?: string[]): ScriptBuilder {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}on ${handlerName}${params}`);
    this.pushBlock('on');
    return this;
  }

  end(): ScriptBuilder {
    if (this.blockStack.length === 0) {
      throw new ScriptBuilderError('Cannot call end(): no blocks are currently open');
    }

    const block = this.blockStack[this.blockStack.length - 1];
    this.popBlock();
    this.script.push(`${this.getIndentation()}end ${block.type}`);
    return this;
  }

  if(condition: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}if ${condition}`);
    this.pushBlock('if');
    return this;
  }

  then(): ScriptBuilder {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call then(): no if block is currently open');
    }
    this.script.push(`${this.getIndentation()}then`);
    return this;
  }

  else(): ScriptBuilder {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call else(): no if block is currently open');
    }
    this.indentLevel--;
    this.script.push(`${this.getIndentation()}else`);
    this.indentLevel++;
    return this;
  }

  elseIf(condition: string): ScriptBuilder {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call elseIf(): no if block is currently open');
    }
    this.indentLevel--;
    this.script.push(`${this.getIndentation()}else if ${condition}`);
    this.indentLevel++;
    return this;
  }

  repeat(times?: number): ScriptBuilder {
    if (times !== undefined && (!Number.isInteger(times) || times < 1)) {
      throw new ScriptBuilderError('Repeat times must be a positive integer');
    }

    if (times !== undefined) {
      this.script.push(`${this.getIndentation()}repeat ${times} times`);
    } else {
      this.script.push(`${this.getIndentation()}repeat`);
    }
    this.pushBlock('repeat');
    return this;
  }

  repeatWith(variable: string, list: string): ScriptBuilder {
    if (!variable || !list) {
      throw new ScriptBuilderError('Both variable and list must be provided for repeatWith');
    }
    this.script.push(`${this.getIndentation()}repeat with ${variable} in ${list}`);
    this.pushBlock('repeat');
    return this;
  }

  repeatUntil(condition: string): ScriptBuilder {
    if (!condition) {
      throw new ScriptBuilderError('Condition must be provided for repeatUntil');
    }
    this.script.push(`${this.getIndentation()}repeat until ${condition}`);
    this.pushBlock('repeat');
    return this;
  }

  repeatWhile(condition: string): ScriptBuilder {
    if (!condition) {
      throw new ScriptBuilderError('Condition must be provided for repeatWhile');
    }
    this.script.push(`${this.getIndentation()}repeat while ${condition}`);
    this.pushBlock('repeat');
    return this;
  }

  exitRepeat(): ScriptBuilder {
    const hasRepeatBlock = this.blockStack.some((block) => block.type === 'repeat');
    if (!hasRepeatBlock) {
      throw new ScriptBuilderError('Cannot call exitRepeat(): no repeat block is currently open');
    }
    this.script.push(`${this.getIndentation()}exit repeat`);
    return this;
  }

  continueRepeat(): ScriptBuilder {
    const hasRepeatBlock = this.blockStack.some((block) => block.type === 'repeat');
    if (!hasRepeatBlock) {
      throw new ScriptBuilderError(
        'Cannot call continueRepeat(): no repeat block is currently open',
      );
    }
    this.script.push(`${this.getIndentation()}continue repeat`);
    return this;
  }

  considering(attributes: string[]): ScriptBuilder {
    if (!attributes.length) {
      throw new ScriptBuilderError('At least one attribute must be provided for considering');
    }
    this.script.push(`${this.getIndentation()}considering ${attributes.join(', ')}`);
    this.pushBlock('considering');
    return this;
  }

  ignoring(attributes: string[]): ScriptBuilder {
    if (!attributes.length) {
      throw new ScriptBuilderError('At least one attribute must be provided for ignoring');
    }
    this.script.push(`${this.getIndentation()}ignoring ${attributes.join(', ')}`);
    this.pushBlock('ignoring');
    return this;
  }

  using(terms: string[]): ScriptBuilder {
    this.script.push(`${this.getIndentation()}using terms from ${terms.join(', ')}`);
    this.pushBlock('using');
    return this;
  }

  with(timeout?: number, transaction?: boolean): ScriptBuilder {
    let command = `${this.getIndentation()}with`;
    if (timeout !== undefined) command += ` timeout of ${timeout}`;
    if (transaction) command += ' transaction';
    this.script.push(command);
    this.pushBlock('with');
    return this;
  }

  try(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}try`);
    this.pushBlock('try');
    return this;
  }

  onError(variableName?: string): ScriptBuilder {
    if (
      this.blockStack.length === 0 ||
      this.blockStack[this.blockStack.length - 1].type !== 'try'
    ) {
      throw new ScriptBuilderError('Cannot call onError(): no try block is currently open');
    }
    this.indentLevel--;
    const varPart = variableName ? ` ${variableName}` : '';
    this.script.push(`${this.getIndentation()}on error${varPart}`);
    this.indentLevel++;
    return this;
  }

  error(message: string, number?: number): ScriptBuilder {
    let command = `${this.getIndentation()}error "${this.escapeString(message)}"`;
    if (number !== undefined) command += ` number ${number}`;
    this.script.push(command);
    return this;
  }

  return(value: AppleScriptValue): ScriptBuilder {
    this.script.push(`${this.getIndentation()}return ${this.formatValue(value)}`);
    return this;
  }

  returnRaw(expression: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}return ${expression}`);
    return this;
  }

  log(message: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}log "${this.escapeString(message)}"`);
    return this;
  }

  comment(text: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}-- ${text}`);
    return this;
  }

  // Application control
  activate(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}activate`);
    return this;
  }

  quit(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}quit`);
    return this;
  }

  reopen(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}reopen`);
    return this;
  }

  launch(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}launch`);
    return this;
  }

  running(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}running`);
    return this;
  }

  // Window management
  closeWindow(window?: string): ScriptBuilder {
    if (window) {
      this.script.push(`${this.getIndentation()}close window "${this.escapeString(window)}"`);
    } else {
      this.script.push(`${this.getIndentation()}close front window`);
    }
    return this;
  }

  closeAllWindows(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}close every window`);
    return this;
  }

  minimizeWindow(window?: string): ScriptBuilder {
    if (window) {
      this.script.push(
        `${this.getIndentation()}set miniaturized of window "${this.escapeString(window)}" to true`,
      );
    } else {
      this.script.push(`${this.getIndentation()}set miniaturized of front window to true`);
    }
    return this;
  }

  zoomWindow(window?: string): ScriptBuilder {
    if (window) {
      this.script.push(
        `${this.getIndentation()}set zoomed of window "${this.escapeString(window)}" to true`,
      );
    } else {
      this.script.push(`${this.getIndentation()}set zoomed of front window to true`);
    }
    return this;
  }

  // UI interaction
  click(target: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}click ${target}`);
    return this;
  }

  keystroke(text: string, modifiers?: string[]): ScriptBuilder {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.script.push(`${this.getIndentation()}keystroke "${this.escapeString(text)}"${modString}`);
    return this;
  }

  delay(seconds: number): ScriptBuilder {
    this.script.push(`${this.getIndentation()}delay ${seconds}`);
    return this;
  }

  // Dialog and alerts
  displayDialog(
    text: string,
    options: {
      buttons?: string[];
      defaultButton?: string;
      withIcon?: 'stop' | 'note' | 'caution';
      givingUpAfter?: number;
    } = {},
  ): ScriptBuilder {
    let command = `${this.getIndentation()}display dialog "${this.escapeString(text)}"`;

    if (options.buttons?.length) {
      const escapedButtons = options.buttons.map((b) => this.escapeString(b));
      command += ` buttons {"${escapedButtons.join('", "')}"}`;
    }

    if (options.defaultButton) {
      command += ` default button "${this.escapeString(options.defaultButton)}"`;
    }

    if (options.withIcon) {
      command += ` with icon ${options.withIcon}`;
    }

    if (options.givingUpAfter) {
      command += ` giving up after ${options.givingUpAfter}`;
    }

    this.script.push(command);
    return this;
  }

  displayNotification(
    text: string,
    options: {
      title?: string;
      subtitle?: string;
      sound?: string;
    } = {},
  ): ScriptBuilder {
    let command = `${this.getIndentation()}display notification "${this.escapeString(text)}"`;

    if (options.title) {
      command += ` with title "${this.escapeString(options.title)}"`;
    }

    if (options.subtitle) {
      command += ` subtitle "${this.escapeString(options.subtitle)}"`;
    }

    if (options.sound) {
      command += ` sound name "${this.escapeString(options.sound)}"`;
    }

    this.script.push(command);
    return this;
  }

  // Variables and properties
  set(variable: string, value: AppleScriptValue): ScriptBuilder {
    this.script.push(`${this.getIndentation()}set ${variable} to ${this.formatValue(value)}`);
    return this;
  }

  setExpression(variable: string, expression: string | Record<string, string>): ScriptBuilder {
    const expr = typeof expression === 'string' ? expression : this.makeRecordFrom(expression);
    this.script.push(`${this.getIndentation()}set ${variable} to ${expr}`);
    return this;
  }

  increment(variable: string, by = 1): ScriptBuilder {
    this.script.push(`${this.getIndentation()}set ${variable} to ${variable} + ${by}`);
    return this;
  }

  decrement(variable: string, by = 1): ScriptBuilder {
    this.script.push(`${this.getIndentation()}set ${variable} to ${variable} - ${by}`);
    return this;
  }

  get(property: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}get ${property}`);
    return this;
  }

  copy(value: AppleScriptValue, to: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}copy ${this.formatValue(value)} to ${to}`);
    return this;
  }

  count(items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}count ${items}`);
    return this;
  }

  setCountOf(variable: string, items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}set ${variable} to count of (${items})`);
    return this;
  }

  exists(item: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}exists ${item}`);
    return this;
  }

  setEnd(variable: string, value: AppleScriptValue): ScriptBuilder {
    this.script.push(
      `${this.getIndentation()}set end of ${variable} to ${this.formatValue(value)}`,
    );
    return this;
  }

  setEndRaw(variable: string, expression: string | Record<string, string>): ScriptBuilder {
    const expr = typeof expression === 'string' ? expression : this.makeRecordFrom(expression);
    this.script.push(`${this.getIndentation()}set end of ${variable} to ${expr}`);
    return this;
  }

  setEndRecord(
    listVariable: string,
    sourceOrExpressions: string | Record<string, string>,
    propertyMap?: Record<string, string>,
  ): ScriptBuilder {
    let recordExpressions: Record<string, string>;

    if (typeof sourceOrExpressions === 'string') {
      // Form 1: .setEndRecord(list, source, {key: 'property'})
      // Automatically append "of source" to each property
      if (!propertyMap) {
        throw new ScriptBuilderError(
          'propertyMap is required when sourceOrExpressions is a source object name',
        );
      }
      const sourceObj = sourceOrExpressions;
      recordExpressions = Object.entries(propertyMap).reduce<Record<string, string>>(
        (acc, [key, prop]) => {
          acc[key] = `${prop} of ${sourceObj}`;
          return acc;
        },
        {},
      );
    } else {
      // Form 2: .setEndRecord(list, {key: 'full expression'})
      recordExpressions = sourceOrExpressions;
    }

    const recordStr = this.makeRecordFrom(recordExpressions);
    this.script.push(`${this.getIndentation()}set end of ${listVariable} to ${recordStr}`);
    return this;
  }

  setProperty(variable: string, property: string, value: AppleScriptValue): ScriptBuilder {
    this.script.push(
      `${this.getIndentation()}set ${property} of ${variable} to ${this.formatValue(value)}`,
    );
    return this;
  }

  makeRecordFrom(variableNames: Record<string, string>): string {
    const entries = Object.entries(variableNames)
      .map(([key, varName]) => `${key}:${varName}`)
      .join(', ');
    return `{${entries}}`;
  }

  // List operations
  first(items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}first item of ${items}`);
    return this;
  }

  last(items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}last item of ${items}`);
    return this;
  }

  rest(items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}rest of ${items}`);
    return this;
  }

  reverse(items: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}reverse of ${items}`);
    return this;
  }

  some(items: string, test: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}some item of ${items} where ${test}`);
    return this;
  }

  every(items: string, test: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}every item of ${items} where ${test}`);
    return this;
  }

  whose(items: string, condition: string): string {
    return `${items} whose ${condition}`;
  }

  getEvery(itemType: string, location?: string): ScriptBuilder {
    const loc = location ? ` of ${location}` : '';
    this.script.push(`${this.getIndentation()}get every ${itemType}${loc}`);
    return this;
  }

  getEveryWhere(itemType: string, condition: string, location?: string): ScriptBuilder {
    const loc = location ? ` of ${location}` : '';
    this.script.push(`${this.getIndentation()}get every ${itemType}${loc} where ${condition}`);
    return this;
  }

  // Text operations
  offset(text: string, in_: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}offset of ${text} in ${in_}`);
    return this;
  }

  contains(text: string, in_: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}${in_} contains ${text}`);
    return this;
  }

  beginsWith(text: string, with_: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}${text} begins with ${with_}`);
    return this;
  }

  endsWith(text: string, with_: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}${text} ends with ${with_}`);
    return this;
  }

  // System operations
  path(to: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}path to ${to}`);
    return this;
  }

  info(for_: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}info for ${for_}`);
    return this;
  }

  do(script: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}do script "${this.escapeString(script)}"`);
    return this;
  }

  doShellScript(command: string, administrator?: boolean): ScriptBuilder {
    let cmd = `${this.getIndentation()}do shell script "${this.escapeString(command)}"`;
    if (administrator) {
      cmd += ' with administrator privileges';
    }
    this.script.push(cmd);
    return this;
  }

  // Raw script and building
  raw(script: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}${script}`);
    return this;
  }

  // Enhanced Application control
  getRunningApplications(): ScriptBuilder {
    this.raw(
      'tell application "System Events" to return {name, bundle identifier, visible, frontmost} of every process where background only is false',
    );
    return this;
  }

  getFrontmostApplication(): ScriptBuilder {
    this.raw(
      'tell application "System Events" to return name of first process where frontmost is true',
    );
    return this;
  }

  activateApplication(appName: string): ScriptBuilder {
    this.raw(`tell application "${this.escapeString(appName)}" to activate`);
    return this;
  }

  hideApplication(appName: string): ScriptBuilder {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to set visible to false`,
    );
    return this;
  }

  unhideApplication(appName: string): ScriptBuilder {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to set visible to true`,
    );
    return this;
  }

  quitApplication(appName: string): ScriptBuilder {
    this.raw(`tell application "${this.escapeString(appName)}" to quit`);
    return this;
  }

  isApplicationRunning(appName: string): ScriptBuilder {
    this.raw(
      `tell application "System Events" to return exists (processes where name is "${this.escapeString(appName)}")`,
    );
    return this;
  }

  getApplicationInfo(appName: string): ScriptBuilder {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to return properties`,
    );
    return this;
  }

  // Enhanced Window management
  getWindowInfo(appName: string, windowName?: string): ScriptBuilder {
    this.raw(
      windowName
        ? `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to return {name, id, bounds, miniaturized, zoomed}`
        : `tell application "${this.escapeString(appName)}" to tell front window to return {name, id, bounds, miniaturized, zoomed}`,
    );
    return this;
  }

  getAllWindows(appName: string): ScriptBuilder {
    this.raw(
      `tell application "${this.escapeString(appName)}" to return {name, id, bounds, miniaturized, zoomed} of every window`,
    );
    return this;
  }

  getFrontmostWindow(appName: string): ScriptBuilder {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell front window to return {name, id, bounds, miniaturized, zoomed}`,
    );
    return this;
  }

  setWindowBounds(
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ): ScriptBuilder {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set bounds to {${bounds.x}, ${bounds.y}, ${bounds.x + bounds.width}, ${bounds.y + bounds.height}}`,
    );
    return this;
  }

  moveWindow(appName: string, windowName: string, x: number, y: number): ScriptBuilder {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set position to {${x}, ${y}}`,
    );
    return this;
  }

  resizeWindow(appName: string, windowName: string, width: number, height: number): ScriptBuilder {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set size to {${width}, ${height}}`,
    );
    return this;
  }

  arrangeWindows(arrangement: 'cascade' | 'tile' | 'stack'): ScriptBuilder {
    this.raw(`tell application "System Events" to tell process "Finder" to ${arrangement} windows`);
    return this;
  }

  focusWindow(appName: string, windowName: string): ScriptBuilder {
    this.raw(`tell application "${this.escapeString(appName)}" to activate`);
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set index to 1`,
    );
    return this;
  }

  switchToWindow(appName: string, windowName: string): ScriptBuilder {
    return this.focusWindow(appName, windowName);
  }

  // Enhanced UI interaction
  pressKey(
    key: string,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ): ScriptBuilder {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.raw(`tell application "System Events" to key code ${key}${modString}`);
    return this;
  }

  pressKeyCode(
    keyCode: number,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ): ScriptBuilder {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.raw(`tell application "System Events" to key code ${keyCode}${modString}`);
    return this;
  }

  typeText(text: string): ScriptBuilder {
    this.raw(`tell application "System Events" to keystroke "${this.escapeString(text)}"`);
    return this;
  }

  clickButton(buttonName: string): ScriptBuilder {
    this.raw(`tell application "System Events" to click button "${this.escapeString(buttonName)}"`);
    return this;
  }

  clickMenuItem(menuName: string, itemName: string): ScriptBuilder {
    this.raw(
      `tell application "System Events" to click menu item "${this.escapeString(itemName)}" of menu "${this.escapeString(menuName)}" of menu bar 1`,
    );
    return this;
  }

  build(): string {
    this.validateBlockStack();
    return this.script.join('\n');
  }

  reset(): ScriptBuilder {
    this.script = [];
    this.indentLevel = 0;
    this.blockStack = [];
    return this;
  }
}
