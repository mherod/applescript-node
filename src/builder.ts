import type { AppleScriptValue, ScriptBuilder } from './types';

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
  private blockStack: { type: BlockType; target?: string }[] = [];

  private getIndentation(): string {
    return this.INDENT.repeat(this.indentLevel);
  }

  private pushBlock(type: BlockType, target?: string) {
    this.blockStack.push({ type, target });
    this.indentLevel++;
  }

  private popBlock(expectedType?: BlockType) {
    if (this.blockStack.length === 0) {
      throw new ScriptBuilderError('Cannot end block: no blocks are currently open');
    }

    const currentBlock = this.blockStack[this.blockStack.length - 1];
    if (expectedType && currentBlock.type !== expectedType) {
      throw new ScriptBuilderError(
        `Block mismatch: trying to end "${expectedType}" but current block is "${currentBlock.type}"`,
      );
    }

    this.blockStack.pop();
    this.indentLevel--;
  }

  private validateBlockStack() {
    if (this.blockStack.length > 0) {
      const unclosedBlocks = this.blockStack.map((b) => b.type).join(', ');
      throw new ScriptBuilderError(`Unclosed blocks remain: ${unclosedBlocks}`);
    }
  }

  // Core language constructs
  tell(target: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}tell application "${target}"`);
    this.pushBlock('tell', target);
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
    this.indentLevel++;
    return this;
  }

  with(timeout?: number, transaction?: boolean): ScriptBuilder {
    let command = `${this.getIndentation()}with`;
    if (timeout !== undefined) command += ` timeout of ${timeout}`;
    if (transaction) command += ' transaction';
    this.script.push(command);
    this.indentLevel++;
    return this;
  }

  try(): ScriptBuilder {
    this.script.push(`${this.getIndentation()}try`);
    this.indentLevel++;
    return this;
  }

  error(message: string, number?: number): ScriptBuilder {
    let command = `${this.getIndentation()}error "${message}"`;
    if (number !== undefined) command += ` number ${number}`;
    this.script.push(command);
    return this;
  }

  return(value: AppleScriptValue): ScriptBuilder {
    this.script.push(`${this.getIndentation()}return ${this.formatValue(value)}`);
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
      this.script.push(`${this.getIndentation()}close window "${window}"`);
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
      this.script.push(`${this.getIndentation()}set miniaturized of window "${window}" to true`);
    } else {
      this.script.push(`${this.getIndentation()}set miniaturized of front window to true`);
    }
    return this;
  }

  zoomWindow(window?: string): ScriptBuilder {
    if (window) {
      this.script.push(`${this.getIndentation()}set zoomed of window "${window}" to true`);
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
    this.script.push(`${this.getIndentation()}keystroke "${text}"${modString}`);
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
    let command = `${this.getIndentation()}display dialog "${text}"`;

    if (options.buttons?.length) {
      command += ` buttons {"${options.buttons.join('", "')}"}`;
    }

    if (options.defaultButton) {
      command += ` default button "${options.defaultButton}"`;
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
    let command = `${this.getIndentation()}display notification "${text}"`;

    if (options.title) {
      command += ` with title "${options.title}"`;
    }

    if (options.subtitle) {
      command += ` subtitle "${options.subtitle}"`;
    }

    if (options.sound) {
      command += ` sound name "${options.sound}"`;
    }

    this.script.push(command);
    return this;
  }

  // Variables and properties
  set(variable: string, value: AppleScriptValue): ScriptBuilder {
    this.script.push(`${this.getIndentation()}set ${variable} to ${this.formatValue(value)}`);
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

  exists(item: string): ScriptBuilder {
    this.script.push(`${this.getIndentation()}exists ${item}`);
    return this;
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
    this.script.push(`${this.getIndentation()}do script "${script}"`);
    return this;
  }

  doShellScript(command: string, administrator?: boolean): ScriptBuilder {
    let cmd = `${this.getIndentation()}do shell script "${command}"`;
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

  private formatValue(value: AppleScriptValue): string {
    if (value === null) return 'missing value';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) {
      return `{${value.map((v) => this.formatValue(v)).join(', ')}}`;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([k, v]) => `${k}:${this.formatValue(v)}`)
        .join(', ');
      return `{${entries}}`;
    }
    return String(value);
  }

  // Enhanced Application control
  getRunningApplications(): ScriptBuilder {
    this.tell('System Events')
      .raw(
        'tell application "System Events" to return {name, bundle identifier, visible, frontmost} of every process where background only is false',
      )
      .end();
    return this;
  }

  getFrontmostApplication(): ScriptBuilder {
    this.tell('System Events')
      .raw(
        'tell application "System Events" to return name of first process where frontmost is true',
      )
      .end();
    return this;
  }

  activateApplication(appName: string): ScriptBuilder {
    this.tell(appName).raw('activate').end();
    return this;
  }

  hideApplication(appName: string): ScriptBuilder {
    this.tell('System Events').raw(`tell process "${appName}" to set visible to false`).end();
    return this;
  }

  unhideApplication(appName: string): ScriptBuilder {
    this.tell('System Events').raw(`tell process "${appName}" to set visible to true`).end();
    return this;
  }

  quitApplication(appName: string): ScriptBuilder {
    this.tell(appName).raw('quit').end();
    return this;
  }

  isApplicationRunning(appName: string): ScriptBuilder {
    this.tell('System Events').raw(`return exists (processes where name is "${appName}")`).end();
    return this;
  }

  getApplicationInfo(appName: string): ScriptBuilder {
    this.tell('System Events').raw(`tell process "${appName}" to return properties`).end();
    return this;
  }

  // Enhanced Window management
  getWindowInfo(appName: string, windowName?: string): ScriptBuilder {
    this.tell(appName)
      .raw(
        windowName
          ? `tell window "${windowName}" to return {name, id, bounds, miniaturized, zoomed}`
          : 'tell front window to return {name, id, bounds, miniaturized, zoomed}',
      )
      .end();
    return this;
  }

  getAllWindows(appName: string): ScriptBuilder {
    this.tell(appName).raw('return {name, id, bounds, miniaturized, zoomed} of every window').end();
    return this;
  }

  getFrontmostWindow(appName: string): ScriptBuilder {
    this.tell(appName)
      .raw('tell front window to return {name, id, bounds, miniaturized, zoomed}')
      .end();
    return this;
  }

  setWindowBounds(
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ): ScriptBuilder {
    this.tell(appName)
      .raw(
        `tell window "${windowName}" to set bounds to {${bounds.x}, ${bounds.y}, ${bounds.x + bounds.width}, ${bounds.y + bounds.height}}`,
      )
      .end();
    return this;
  }

  moveWindow(appName: string, windowName: string, x: number, y: number): ScriptBuilder {
    this.tell(appName).raw(`tell window "${windowName}" to set position to {${x}, ${y}}`).end();
    return this;
  }

  resizeWindow(appName: string, windowName: string, width: number, height: number): ScriptBuilder {
    this.tell(appName)
      .raw(`tell window "${windowName}" to set size to {${width}, ${height}}`)
      .end();
    return this;
  }

  arrangeWindows(arrangement: 'cascade' | 'tile' | 'stack'): ScriptBuilder {
    this.tell('System Events')
      .raw(`tell application "System Events" to tell process "Finder" to ${arrangement} windows`)
      .end();
    return this;
  }

  focusWindow(appName: string, windowName: string): ScriptBuilder {
    this.tell(appName).raw('activate').raw(`tell window "${windowName}" to set index to 1`).end();
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
    this.tell('System Events').raw(`key code ${key}${modString}`).end();
    return this;
  }

  pressKeyCode(
    keyCode: number,
    modifiers?: Array<'command' | 'option' | 'control' | 'shift'>,
  ): ScriptBuilder {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.tell('System Events').raw(`key code ${keyCode}${modString}`).end();
    return this;
  }

  typeText(text: string): ScriptBuilder {
    this.tell('System Events').raw(`keystroke "${text}"`).end();
    return this;
  }

  clickButton(buttonName: string): ScriptBuilder {
    this.tell('System Events').raw(`click button "${buttonName}"`).end();
    return this;
  }

  clickMenuItem(menuName: string, itemName: string): ScriptBuilder {
    this.tell('System Events')
      .raw(`click menu item "${itemName}" of menu "${menuName}" of menu bar 1`)
      .end();
    return this;
  }

  build(): string {
    this.validateBlockStack();
    return this.script.join('\n');
  }
}
