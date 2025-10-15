import { ExprBuilder } from './expressions.js';
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

  private validateBlockType(expectedType: BlockType): void {
    if (this.blockStack.length === 0) {
      throw new ScriptBuilderError(
        `Cannot end ${expectedType} block: no blocks are currently open`,
      );
    }
    const currentBlock = this.blockStack[this.blockStack.length - 1];
    if (currentBlock.type !== expectedType) {
      throw new ScriptBuilderError(
        `Cannot end ${expectedType} block: currently inside ${currentBlock.type} block`,
      );
    }
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

  /**
   * Explicitly end an if block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endif(): ScriptBuilder {
    this.validateBlockType('if');
    return this.end();
  }

  /**
   * Explicitly end a repeat block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endrepeat(): ScriptBuilder {
    this.validateBlockType('repeat');
    return this.end();
  }

  /**
   * Explicitly end a try block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endtry(): ScriptBuilder {
    this.validateBlockType('try');
    return this.end();
  }

  /**
   * Explicitly end a tell block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endtell(): ScriptBuilder {
    this.validateBlockType('tell');
    return this.end();
  }

  /**
   * Explicitly end an on handler block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endon(): ScriptBuilder {
    this.validateBlockType('on');
    return this.end();
  }

  /**
   * Explicitly end a considering block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endconsidering(): ScriptBuilder {
    this.validateBlockType('considering');
    return this.end();
  }

  /**
   * Explicitly end an ignoring block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endignoring(): ScriptBuilder {
    this.validateBlockType('ignoring');
    return this.end();
  }

  /**
   * Explicitly end a using block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endusing(): ScriptBuilder {
    this.validateBlockType('using');
    return this.end();
  }

  /**
   * Explicitly end a with block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endwith(): ScriptBuilder {
    this.validateBlockType('with');
    return this.end();
  }

  if(condition: string | ((expr: ExprBuilder) => string)): ScriptBuilder {
    const conditionStr = typeof condition === 'function' ? condition(new ExprBuilder()) : condition;
    this.script.push(`${this.getIndentation()}if ${conditionStr}`);
    this.pushBlock('if');
    return this;
  }

  then(): ScriptBuilder {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call then(): no if block is currently open');
    }
    // Append 'then' to the previous if statement line
    const lastLine = this.script[this.script.length - 1];
    this.script[this.script.length - 1] = `${lastLine} then`;
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
    if (!(variable && list)) {
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

  /**
   * Build a JSON object string from AppleScript variables.
   * Generates clean, readable JSON without manual string concatenation.
   *
   * @param variableMap Mapping of JSON keys to AppleScript variable names
   * @returns AppleScript expression that evaluates to a JSON string
   *
   * @example
   * // Instead of manual string building:
   * // '"{" & "\\"name\\":\\"" & winName & "\\"}" '
   *
   * // Use:
   * const jsonExpr = builder.buildJsonObject({
   *   name: 'winName',
   *   position: 'winPosition',
   *   size: 'winSize'
   * });
   * builder.returnRaw(jsonExpr);
   *
   * // Generates: '{"name":"Calculator","position":"100,200","size":"800x600"}'
   */
  buildJsonObject(variableMap: Record<string, string>): string {
    const entries = Object.entries(variableMap);

    // Build the JSON string expression
    const parts: string[] = ['"{"'];

    entries.forEach(([jsonKey, varName], index) => {
      const comma = index > 0 ? ',' : '';
      // Each part: ,"key":"value"
      parts.push(`"${comma}\\"${jsonKey}\\":\\""`);
      parts.push(varName);
      parts.push('"\\""');
    });

    parts.push('"}"');

    // Join with & operators
    return parts.join(' & ');
  }

  /**
   * Build and return a JSON object from AppleScript variables.
   * Convenience method that combines buildJsonObject() with returnRaw().
   *
   * @param variableMap Mapping of JSON keys to AppleScript variable names
   *
   * @example
   * .setExpression('winName', 'name of window 1')
   * .setExpression('winPosition', 'position of window 1 as text')
   * .returnJsonObject({
   *   name: 'winName',
   *   position: 'winPosition'
   * })
   */
  returnJsonObject(variableMap: Record<string, string>): ScriptBuilder {
    const jsonExpr = this.buildJsonObject(variableMap);
    return this.returnRaw(jsonExpr);
  }

  /**
   * Ultra-convenient shorthand for the common "map collection to JSON" pattern.
   * Replaces verbose manual iteration, property extraction, and JSON conversion.
   *
   * This single method handles:
   * - Creating temporary collection list
   * - Iterating through items (with optional limit/condition)
   * - Extracting properties with smart detection (simple vs complex expressions)
   * - Error handling (skip failed items)
   * - JSON serialization and return
   *
   * @param itemVariable Loop variable name (e.g., 'aNote')
   * @param collection Collection to iterate (e.g., 'every note')
   * @param properties Mapping of JSON keys to AppleScript properties
   * @param options Optional: limit, until/while conditions, error handling
   *
   * @example
   * // Ultra-concise! Replaces ~20 lines of builder code
   * .tell('Notes')
   * .mapToJson('aNote', 'every note', {
   *   id: 'id',
   *   name: 'name',
   *   content: 'plaintext',
   *   created: 'creation date of aNote as string',
   * }, { limit: 10, skipErrors: true })
   * .endtell()
   */
  mapToJson(
    itemVariable: string,
    collection: string,
    properties: Record<string, string>,
    options: {
      limit?: number;
      until?: string | ((expr: ExprBuilder) => string);
      while?: string | ((expr: ExprBuilder) => string);
      skipErrors?: boolean;
    } = {},
  ): ScriptBuilder {
    const listVar = '__collected_items';

    // 1. Initialize collection list
    this.set(listVar, []);

    // 2. Set up loop with optional limit/condition
    const buildBody = (b: ScriptBuilder) => {
      const addRecord = () => b.pickEndRecord(listVar, itemVariable, properties);

      if (options.skipErrors) {
        b.tryCatch(
          (tryBlock) => tryBlock.pickEndRecord(listVar, itemVariable, properties),
          (catchBlock) => catchBlock.comment('Skip items with errors'),
        );
      } else {
        addRecord();
      }
    };

    if (options.limit !== undefined) {
      const limit = options.limit;
      this.set('__counter', 0);
      this.forEachUntil(
        itemVariable,
        collection,
        (e) => e.gte('__counter', limit),
        (b) => {
          b.increment('__counter');
          buildBody(b);
        },
      );
    } else if (options.until !== undefined) {
      this.forEachUntil(itemVariable, collection, options.until, buildBody);
    } else if (options.while !== undefined) {
      this.forEachWhile(itemVariable, collection, options.while, buildBody);
    } else {
      this.forEach(itemVariable, collection, buildBody);
    }

    // 3. Return as JSON - map JSON keys to record property keys (not AppleScript expressions)
    // The record has keys like {id: value, name: value}, so we need to map id→id, name→name, etc.
    const recordPropertyMap = Object.keys(properties).reduce<Record<string, string>>((acc, key) => {
      acc[key] = key; // JSON key maps to record property with same name
      return acc;
    }, {});
    return this.returnAsJson(listVar, recordPropertyMap);
  }

  /**
   * Return a list of records as a JSON string.
   * Converts AppleScript records to JSON format by manually building the JSON string.
   * Handles proper escaping of strings, booleans, numbers, and null values.
   * @param listVariable Name of the variable containing a list of records
   * @param propertyMap Mapping of JSON keys to AppleScript property names (e.g., {id: 'noteId', name: 'noteName'})
   */
  returnAsJson(listVariable: string, propertyMap: Record<string, string>): ScriptBuilder {
    // Prepend handlers to the beginning of the script (they must be at top level)
    const handlers = [
      '',
      'on escapeJsonString(str)',
      '  set escapedStr to str',
      `  set escapedStr to my replaceText(escapedStr, "\\\\", "\\\\\\\\")`,
      `  set escapedStr to my replaceText(escapedStr, "\\"", "\\\\\\"") `,
      `  set escapedStr to my replaceText(escapedStr, return, "\\\\n")`,
      `  set escapedStr to my replaceText(escapedStr, linefeed, "\\\\n")`,
      `  set escapedStr to my replaceText(escapedStr, tab, "\\\\t")`,
      '  return escapedStr',
      'end escapeJsonString',
      '',
      'on replaceText(theText, searchStr, replaceStr)',
      `  set AppleScript's text item delimiters to searchStr`,
      '  set textItems to text items of theText',
      `  set AppleScript's text item delimiters to replaceStr`,
      '  set newText to textItems as text',
      `  set AppleScript's text item delimiters to ""`,
      '  return newText',
      'end replaceText',
      '',
      'on valueToJson(val)',
      '  if val is missing value then',
      `    return "null"`,
      '  else if class of val is boolean then',
      '    if val then',
      `      return "true"`,
      '    else',
      `      return "false"`,
      '    end if',
      '  else if class of val is integer or class of val is real then',
      '    return val as text',
      '  else',
      `    return "\\"" & my escapeJsonString(val as text) & "\\""`,
      '  end if',
      'end valueToJson',
      '',
    ];

    // Insert handlers at the beginning of the script
    this.script.unshift(...handlers);

    // Build JSON array from list of records (at current position in script)
    this.raw('set jsonParts to {}');
    this.raw(`repeat with rec in ${listVariable}`);
    this.raw('  try');
    this.raw(`    set itemJson to "{"`);

    // Generate property access for each key in the property map
    const entries = Object.entries(propertyMap);
    entries.forEach(([jsonKey, appleScriptProp], index) => {
      const comma = index > 0 ? ',' : '';
      this.raw(
        `    set itemJson to itemJson & "${comma}\\"${jsonKey}\\":" & my valueToJson(${appleScriptProp} of rec)`,
      );
    });

    this.raw(`    set itemJson to itemJson & "}"`);
    this.raw('    set end of jsonParts to itemJson');
    this.raw('  end try');
    this.raw('end repeat');
    this.raw('');
    this.raw(`set AppleScript's text item delimiters to ","`);
    this.raw(`set jsonArray to "[" & (jsonParts as text) & "]"`);
    this.raw(`set AppleScript's text item delimiters to ""`);
    this.raw('return jsonArray');
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

  /**
   * Type multiple characters with automatic delays between each keystroke.
   * Convenient shorthand for typing sequences like numbers or text.
   * @param text String of characters to type (each character gets a separate keystroke)
   * @param delayBetween Delay in seconds between each keystroke (default: 0.1)
   * @example
   * // Instead of:
   * // .keystroke('1').delay(0.1).keystroke('2').delay(0.1).keystroke('3')
   * // Use:
   * // .keystrokes('123')
   */
  keystrokes(text: string, delayBetween = 0.1): ScriptBuilder {
    const chars = text.split('');
    chars.forEach((char, index) => {
      this.keystroke(char);
      // Add delay after each keystroke except the last one
      if (index < chars.length - 1) {
        this.delay(delayBetween);
      }
    });
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

  /**
   * Intuitive shorthand for picking properties from a source object and building a record.
   * Automatically detects full expressions vs simple property names:
   * - Simple properties (no special keywords) get "of source" appended
   * - Complex expressions (with 'of', 'as', 'where', etc.) are used as-is
   *
   * @param listVariable Name of the list to append the record to
   * @param sourceObject Name of the source object to extract properties from
   * @param propertyMap Mapping of record keys to property names/expressions
   *
   * @example
   * // Mix simple properties and complex expressions
   * .pickEndRecord('notesList', 'aNote', {
   *   noteId: 'id',                              // => id of aNote
   *   noteName: 'name',                          // => name of aNote
   *   noteCreated: 'creation date of aNote as string',  // used as-is (has 'as')
   *   noteModified: 'modification date as string',      // used as-is (has 'as')
   * })
   */
  pickEndRecord(
    listVariable: string,
    sourceObject: string,
    propertyMap: Record<string, string>,
  ): ScriptBuilder {
    const recordExpressions = Object.entries(propertyMap).reduce<Record<string, string>>(
      (acc, [key, prop]) => {
        // Check if property looks like a full expression (contains AppleScript keywords)
        // If so, use as-is. Otherwise, append "of source" for shorthand.
        const isFullExpression =
          prop.includes(' of ') ||
          prop.includes(' where ') ||
          prop.includes(' as ') ||
          prop.includes(' whose ') ||
          prop.includes(' thru ') ||
          prop.includes('every ') ||
          prop.includes('some ') ||
          prop.includes('first ') ||
          prop.includes('last ') ||
          prop.includes('count ') ||
          prop.includes('length ') ||
          prop.includes(' contains ') ||
          prop.includes(' begins with ') ||
          prop.includes(' ends with ');

        acc[key] = isFullExpression ? prop : `${prop} of ${sourceObject}`;
        return acc;
      },
      {},
    );

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

  // Convenience helpers for cleaner API
  /**
   * Simplified tell application pattern with automatic block closing.
   * Cleaner than manually calling tell()...end().
   * @param appName Name of the application to tell
   * @param block Callback that builds commands for the application
   */
  tellApp(appName: string, block: (builder: ScriptBuilder) => void): ScriptBuilder {
    this.tell(appName);
    block(this);
    return this.end();
  }

  /**
   * Simplified if-then pattern that automatically closes the if block.
   * Cleaner than manually calling if()...then()...endif().
   * @param condition The condition to check (string or ExprBuilder callback)
   * @param thenBlock Callback that builds the then branch
   */
  ifThen(
    condition: string | ((expr: ExprBuilder) => string),
    thenBlock: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.if(condition).then();
    thenBlock(this);
    return this.endif();
  }

  /**
   * Simplified if-then-else pattern that automatically closes the if block.
   * Cleaner than manually calling if()...then()...else()...endif().
   * @param condition The condition to check (string or ExprBuilder callback)
   * @param thenBlock Callback that builds the then branch
   * @param elseBlock Callback that builds the else branch
   */
  ifThenElse(
    condition: string | ((expr: ExprBuilder) => string),
    thenBlock: (builder: ScriptBuilder) => void,
    elseBlock: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.if(condition).then();
    thenBlock(this);
    this.else();
    elseBlock(this);
    return this.endif();
  }

  /**
   * Simplified try-catch pattern that automatically closes the try block.
   * Cleaner than manually calling try()...onError()...endtry().
   * @param tryBlock Callback that builds the try branch
   * @param catchBlock Callback that builds the on error branch
   */
  tryCatch(
    tryBlock: (builder: ScriptBuilder) => void,
    catchBlock: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.try();
    tryBlock(this);
    this.onError();
    catchBlock(this);
    return this.endtry();
  }

  /**
   * Simplified try-catch pattern with error variable capture.
   * @param tryBlock Callback that builds the try branch
   * @param errorVarName Name of the variable to capture the error
   * @param catchBlock Callback that builds the on error branch
   */
  tryCatchError(
    tryBlock: (builder: ScriptBuilder) => void,
    errorVarName: string,
    catchBlock: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.try();
    tryBlock(this);
    this.onError(errorVarName);
    catchBlock(this);
    return this.endtry();
  }

  /**
   * Iterate over items with automatic block closing.
   * More intuitive name for repeatWith that uses callback pattern.
   * @param variable Loop variable name
   * @param list Expression for the list to iterate (e.g., 'every note')
   * @param block Callback that builds the loop body
   */
  forEach(variable: string, list: string, block: (builder: ScriptBuilder) => void): ScriptBuilder {
    this.repeatWith(variable, list);
    block(this);
    return this.endrepeat();
  }

  /**
   * Iterate over items while a condition is true.
   * Combines forEach with an early exit condition for cleaner syntax.
   * @param variable Loop variable name
   * @param list Expression for the list to iterate (e.g., 'every note')
   * @param condition Condition to check before each iteration (continues while true)
   * @param block Callback that builds the loop body
   */
  forEachWhile(
    variable: string,
    list: string,
    condition: string | ((expr: ExprBuilder) => string),
    block: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.repeatWith(variable, list);
    this.ifThen(
      typeof condition === 'function' ? (e) => e.not(condition(e)) : (e) => e.not(condition),
      (b) => b.exitRepeat(),
    );
    block(this);
    return this.endrepeat();
  }

  /**
   * Iterate over items until a condition becomes true.
   * Combines forEach with an early exit condition for cleaner syntax.
   * @param variable Loop variable name
   * @param list Expression for the list to iterate (e.g., 'every note')
   * @param condition Condition to check before each iteration (exits when true)
   * @param block Callback that builds the loop body
   */
  forEachUntil(
    variable: string,
    list: string,
    condition: string | ((expr: ExprBuilder) => string),
    block: (builder: ScriptBuilder) => void,
  ): ScriptBuilder {
    this.repeatWith(variable, list);
    this.ifThen(condition, (b) => b.exitRepeat());
    block(this);
    return this.endrepeat();
  }

  /**
   * Repeat a fixed number of times with automatic block closing.
   * @param times Number of times to repeat
   * @param block Callback that builds the loop body
   */
  repeatTimes(times: number, block: (builder: ScriptBuilder) => void): ScriptBuilder {
    this.repeat(times);
    block(this);
    return this.endrepeat();
  }

  /**
   * Repeat while condition is true with automatic block closing.
   * @param condition Condition to check (continues while true)
   * @param block Callback that builds the loop body
   */
  repeatWhileBlock(condition: string, block: (builder: ScriptBuilder) => void): ScriptBuilder {
    this.repeatWhile(condition);
    block(this);
    return this.endrepeat();
  }

  /**
   * Repeat until condition is true with automatic block closing.
   * @param condition Condition to check (continues until true)
   * @param block Callback that builds the loop body
   */
  repeatUntilBlock(condition: string, block: (builder: ScriptBuilder) => void): ScriptBuilder {
    this.repeatUntil(condition);
    block(this);
    return this.endrepeat();
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
