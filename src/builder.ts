import { resolveExpression } from './builder-utils.js';
import { ExprBuilder } from './expressions.js';
import type { AppleScriptValue, JsonObjectShape, ScriptBuilder } from './types.js';

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
    return this.makeRecord(value as Record<string, AppleScriptValue>);
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
  tell(target: string): this {
    this.script.push(`${this.getIndentation()}tell application "${this.escapeString(target)}"`);
    this.pushBlock('tell', target);
    return this;
  }

  tellTarget(target: string): this {
    this.script.push(`${this.getIndentation()}tell ${target}`);
    this.pushBlock('tell', target);
    return this;
  }

  tellProcess(processName: string): this {
    this.script.push(
      `${this.getIndentation()}tell application "System Events" to tell process "${this.escapeString(processName)}"`,
    );
    this.pushBlock('tell', processName);
    return this;
  }

  on(handlerName: string, parameters?: string[]): this {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}on ${handlerName}${params}`);
    this.pushBlock('on', handlerName);
    return this;
  }

  /**
   * Define a handler using the 'to' syntax (alternative to 'on').
   * Both 'on' and 'to' are equivalent in AppleScript.
   * @param handlerName The name of the handler
   * @param parameters Optional array of parameter names
   * @returns This builder instance for method chaining
   * @example
   * .to('sayHello', ['name'])
   *   .displayDialog('Hello ' & name)
   * .endto()
   */
  to(handlerName: string, parameters?: string[]): this {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}to ${handlerName}${params}`);
    this.pushBlock('on', handlerName);
    return this;
  }

  /**
   * Call/invoke a handler with parameters.
   * @param handlerName The name of the handler to call
   * @param parameters Optional array of parameter values
   * @returns This builder instance for method chaining
   * @example
   * .callHandler('sayHello', ['"John"'])
   * .callHandler('processFile', ['theFile', 'true'])
   */
  callHandler(handlerName: string, parameters?: string[]): this {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}${handlerName}${params}`);
    return this;
  }

  /**
   * Call a handler from within a tell statement using 'my' keyword.
   * Required when calling handlers from within tell blocks.
   * @param handlerName The name of the handler to call
   * @param parameters Optional array of parameter values
   * @returns This builder instance for method chaining
   * @example
   * .tell('Finder')
   *   .my('processFile', ['theFile'])
   * .endtell()
   */
  my(handlerName: string, parameters?: string[]): this {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}my ${handlerName}${params}`);
    return this;
  }

  /**
   * Call a handler from within a tell statement using 'of me' syntax.
   * Alternative to 'my' keyword for calling handlers from within tell blocks.
   * @param handlerName The name of the handler to call
   * @param parameters Optional array of parameter values
   * @returns This builder instance for method chaining
   * @example
   * .tell('Finder')
   *   .ofMe('processFile', ['theFile'])
   * .endtell()
   */
  ofMe(handlerName: string, parameters?: string[]): this {
    const params = parameters?.length ? ` ${parameters.join(', ')}` : '';
    this.script.push(`${this.getIndentation()}${handlerName}${params} of me`);
    return this;
  }

  /**
   * Define a handler with labeled parameters (interleaved syntax).
   * AppleScript supports splitting parameter names with colons and spaces.
   * @param handlerName The name of the handler
   * @param labeledParams Object with parameter labels and values
   * @returns This builder instance for method chaining
   * @example
   * .onLabeled('displayError', { message: 'theErrorMessage', buttons: 'theButtons' })
   *   .displayDialog(theErrorMessage, { buttons: theButtons })
   * .endon()
   */
  onLabeled(handlerName: string, labeledParams: Record<string, string>): this {
    const paramPairs = Object.entries(labeledParams);
    const params = paramPairs.map(([label, value]) => `${label} ${value}`).join(', ');
    this.script.push(`${this.getIndentation()}on ${handlerName} ${params}`);
    this.pushBlock('on', handlerName);
    return this;
  }

  /**
   * Define a handler with labeled parameters using 'to' syntax.
   * @param handlerName The name of the handler
   * @param labeledParams Object with parameter labels and values
   * @returns This builder instance for method chaining
   */
  toLabeled(handlerName: string, labeledParams: Record<string, string>): this {
    const paramPairs = Object.entries(labeledParams);
    const params = paramPairs.map(([label, value]) => `${label} ${value}`).join(', ');
    this.script.push(`${this.getIndentation()}to ${handlerName} ${params}`);
    this.pushBlock('on', handlerName);
    return this;
  }

  // Event Handlers

  /**
   * Define a 'run' event handler (implicit or explicit).
   * The run handler is called when a script executes.
   * @param explicit If true, explicitly define the run handler; if false, use implicit
   * @returns This builder instance for method chaining
   * @example
   * .runHandler(true)  // Explicit: on run ... end run
   *   .displayDialog('Script is running')
   * .endrun()
   */
  runHandler(explicit = false): this {
    if (explicit) {
      this.script.push(`${this.getIndentation()}on run`);
      this.pushBlock('on', 'run');
    }
    return this;
  }

  /**
   * Define a 'quit' event handler.
   * Called when a script app quits.
   * @returns This builder instance for method chaining
   * @example
   * .quitHandler()
   *   .displayDialog('Script is quitting')
   * .endquit()
   */
  quitHandler(): this {
    this.script.push(`${this.getIndentation()}on quit`);
    this.pushBlock('on', 'quit');
    return this;
  }

  /**
   * Define an 'open' event handler for drag-and-drop support.
   * Makes the script app drag-and-droppable.
   * @param parameterName Name for the dropped items parameter (default: 'theDroppedItems')
   * @returns This builder instance for method chaining
   * @example
   * .openHandler('theFiles')
   *   .repeatWith('aFile', 'theFiles')
   *     .displayDialog('Processing: ' & aFile)
   *   .endrepeat()
   * .endopen()
   */
  openHandler(parameterName = 'theDroppedItems'): this {
    this.script.push(`${this.getIndentation()}on open ${parameterName}`);
    this.pushBlock('on', 'open');
    return this;
  }

  /**
   * Define an 'idle' event handler for stay-open applications.
   * Called periodically in stay-open script apps.
   *
   * The idle interval is controlled by the return value within the handler,
   * not by a parameter. Use `.return(seconds)` to set the next idle interval.
   *
   * @returns This builder instance for method chaining
   * @example
   * .idleHandler()
   *   .displayDialog('Idle processing')
   *   .return(30)  // Return 30 seconds for next idle interval
   * .endidle()
   */
  idleHandler(): this {
    this.script.push(`${this.getIndentation()}on idle`);
    this.pushBlock('on', 'idle');
    return this;
  }

  end(): this {
    if (this.blockStack.length === 0) {
      throw new ScriptBuilderError('Cannot call end(): no blocks are currently open');
    }

    const block = this.blockStack[this.blockStack.length - 1];
    this.popBlock();

    // For 'on' blocks, use the handler name if available, otherwise use 'on'
    const endText = block.type === 'on' && block.target ? block.target : block.type;
    this.addLine(`end ${endText}`);
    return this;
  }

  /**
   * Explicitly end an if block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endif(): this {
    this.validateBlockType('if');
    return this.end();
  }

  /**
   * Explicitly end a repeat block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endrepeat(): this {
    this.validateBlockType('repeat');
    return this.end();
  }

  /**
   * Explicitly end a try block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endtry(): this {
    this.validateBlockType('try');
    return this.end();
  }

  /**
   * Explicitly end a tell block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endtell(): this {
    this.validateBlockType('tell');
    return this.end();
  }

  /**
   * Explicitly end an on handler block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endon(): this {
    this.validateBlockType('on');
    return this.end();
  }

  /**
   * Explicitly end a considering block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endconsidering(): this {
    this.validateBlockType('considering');
    return this.end();
  }

  /**
   * Explicitly end an ignoring block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endignoring(): this {
    this.validateBlockType('ignoring');
    return this.end();
  }

  /**
   * Explicitly end a using block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endusing(): this {
    this.validateBlockType('using');
    return this.end();
  }

  /**
   * Explicitly end a with block.
   * Preferred over end() for clarity when working with multiple nested blocks.
   */
  endwith(): this {
    this.validateBlockType('with');
    return this.end();
  }

  /**
   * Explicitly end a 'to' handler block.
   * Preferred over end() for clarity when working with handlers.
   */
  endto(): this {
    this.validateBlockType('on'); // 'to' handlers use the same block type as 'on'
    return this.end();
  }

  /**
   * Explicitly end a 'run' handler block.
   * Preferred over end() for clarity when working with run handlers.
   */
  endrun(): this {
    this.validateBlockType('on');
    return this.end();
  }

  /**
   * Explicitly end a 'quit' handler block.
   * Preferred over end() for clarity when working with quit handlers.
   */
  endquit(): this {
    this.validateBlockType('on');
    return this.end();
  }

  /**
   * Explicitly end an 'open' handler block.
   * Preferred over end() for clarity when working with open handlers.
   */
  endopen(): this {
    this.validateBlockType('on');
    return this.end();
  }

  /**
   * Explicitly end an 'idle' handler block.
   * Preferred over end() for clarity when working with idle handlers.
   */
  endidle(): this {
    this.validateBlockType('on');
    return this.end();
  }

  if(condition: string | ((expr: ExprBuilder) => string)): this {
    const conditionStr = resolveExpression(condition);
    this.script.push(`${this.getIndentation()}if ${conditionStr}`);
    this.pushBlock('if');
    return this;
  }

  thenBlock(): this {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call thenBlock(): no if block is currently open');
    }
    // Append 'then' to the previous if statement line
    const lastLine = this.script[this.script.length - 1];
    this.script[this.script.length - 1] = `${lastLine} then`;
    return this;
  }

  else(): this {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call else(): no if block is currently open');
    }
    this.indentLevel--;
    this.script.push(`${this.getIndentation()}else`);
    this.indentLevel++;
    return this;
  }

  elseIf(condition: string): this {
    if (this.blockStack.length === 0 || this.blockStack[this.blockStack.length - 1].type !== 'if') {
      throw new ScriptBuilderError('Cannot call elseIf(): no if block is currently open');
    }
    this.indentLevel--;
    this.script.push(`${this.getIndentation()}else if ${condition}`);
    this.indentLevel++;
    return this;
  }

  repeat(times?: number): this {
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

  repeatWith(variable: string, list: string): this {
    if (!(variable && list)) {
      throw new ScriptBuilderError('Both variable and list must be provided for repeatWith');
    }
    this.script.push(`${this.getIndentation()}repeat with ${variable} in ${list}`);
    this.pushBlock('repeat');
    return this;
  }

  repeatUntil(condition: string): this {
    if (!condition) {
      throw new ScriptBuilderError('Condition must be provided for repeatUntil');
    }
    this.script.push(`${this.getIndentation()}repeat until ${condition}`);
    this.pushBlock('repeat');
    return this;
  }

  repeatWhile(condition: string): this {
    if (!condition) {
      throw new ScriptBuilderError('Condition must be provided for repeatWhile');
    }
    this.script.push(`${this.getIndentation()}repeat while ${condition}`);
    this.pushBlock('repeat');
    return this;
  }

  repeatWithRange(variable: string, start: number | string, end: number | string): this {
    if (!(variable && start && end)) {
      throw new ScriptBuilderError('Variable, start, and end must be provided for repeatWithRange');
    }
    const startExpr = typeof start === 'number' ? start.toString() : start;
    const endExpr = typeof end === 'number' ? end.toString() : end;
    this.script.push(
      `${this.getIndentation()}repeat with ${variable} from ${startExpr} to ${endExpr}`,
    );
    this.pushBlock('repeat');
    return this;
  }

  exitRepeat(): this {
    const hasRepeatBlock = this.blockStack.some((block) => block.type === 'repeat');
    if (!hasRepeatBlock) {
      throw new ScriptBuilderError('Cannot call exitRepeat(): no repeat block is currently open');
    }
    this.script.push(`${this.getIndentation()}exit repeat`);
    return this;
  }

  exitRepeatIf(condition: string | ((expr: ExprBuilder) => string)): this {
    const hasRepeatBlock = this.blockStack.some((block) => block.type === 'repeat');
    if (!hasRepeatBlock) {
      throw new ScriptBuilderError('Cannot call exitRepeatIf(): no repeat block is currently open');
    }
    const cond = resolveExpression(condition);
    this.script.push(`${this.getIndentation()}if ${cond} then`);
    this.indentLevel++;
    this.script.push(`${this.getIndentation()}exit repeat`);
    this.indentLevel--;
    this.script.push(`${this.getIndentation()}end if`);
    return this;
  }

  continueRepeat(): this {
    const hasRepeatBlock = this.blockStack.some((block) => block.type === 'repeat');
    if (!hasRepeatBlock) {
      throw new ScriptBuilderError(
        'Cannot call continueRepeat(): no repeat block is currently open',
      );
    }
    this.script.push(`${this.getIndentation()}continue repeat`);
    return this;
  }

  considering(attributes: string[]): this {
    if (!attributes.length) {
      throw new ScriptBuilderError('At least one attribute must be provided for considering');
    }
    this.script.push(`${this.getIndentation()}considering ${attributes.join(', ')}`);
    this.pushBlock('considering');
    return this;
  }

  ignoring(attributes: string[]): this {
    if (!attributes.length) {
      throw new ScriptBuilderError('At least one attribute must be provided for ignoring');
    }
    this.script.push(`${this.getIndentation()}ignoring ${attributes.join(', ')}`);
    this.pushBlock('ignoring');
    return this;
  }

  using(terms: string[]): this {
    this.script.push(`${this.getIndentation()}using terms from ${terms.join(', ')}`);
    this.pushBlock('using');
    return this;
  }

  with(timeout?: number, transaction?: boolean): this {
    let command = `${this.getIndentation()}with`;
    if (timeout !== undefined) command += ` timeout of ${timeout}`;
    if (transaction) command += ' transaction';
    this.script.push(command);
    this.pushBlock('with');
    return this;
  }

  try(): this {
    this.script.push(`${this.getIndentation()}try`);
    this.pushBlock('try');
    return this;
  }

  onError(variableName?: string): this {
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

  error(message: string, number?: number): this {
    let command = `${this.getIndentation()}error "${this.escapeString(message)}"`;
    if (number !== undefined) command += ` number ${number}`;
    this.script.push(command);
    return this;
  }

  return(value: AppleScriptValue): this {
    this.script.push(`${this.getIndentation()}return ${this.formatValue(value)}`);
    return this;
  }

  returnRaw(expression: string): this {
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
  returnJsonObject<TProperties extends Record<string, string>>(
    variableMap: TProperties,
  ): ScriptBuilder<never, JsonObjectShape<TProperties>> {
    const jsonExpr = this.buildJsonObject(variableMap);
    this.returnRaw(jsonExpr);
    return this as ScriptBuilder<never, JsonObjectShape<TProperties>>;
  }

  /**
   * Ultra-convenient shorthand for the common "map collection to JSON" pattern.
   * Replaces verbose manual iteration, property extraction, and JSON conversion.
   *
   * This single method handles:
   * - Creating temporary collection list
   * - Iterating through items (with optional limit/condition)
   * - Extracting properties with smart detection (simple vs complex expressions)
   * - Field-level transformations (firstOf, ifExists, type conversion)
   * - Error handling (skip failed items)
   * - JSON serialization and return
   *
   * @param itemVariable Loop variable name (e.g., 'aNote')
   * @param collection Collection to iterate (e.g., 'every note')
   * @param properties Mapping of JSON keys to AppleScript properties or PropertyExtractor objects
   * @param options Optional: limit, until/while conditions, error handling
   *
   * @example
   * // Simple properties
   * .tell('Notes')
   * .mapToJson('aNote', 'every note', {
   *   id: 'id',
   *   name: 'name',
   *   content: 'plaintext',
   *   created: 'creation date of aNote as string',
   * }, { limit: 10, skipErrors: true })
   * .endtell()
   *
   * @example
   * // Advanced field extractors (NEW!)
   * .tell('Contacts')
   * .mapToJson('aPerson', 'every person', {
   *   id: 'id',
   *   name: 'name',
   *   email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
   *   phone: { property: 'phones', firstOf: true },
   *   birthday: { property: 'birth date', ifExists: true, asType: 'string' },
   * }, { limit: 50, skipErrors: true })
   * .endtell()
   */
  mapToJson<
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
    options: {
      limit?: number;
      until?: string | ((expr: ExprBuilder) => string);
      while?: string | ((expr: ExprBuilder) => string);
      skipErrors?: boolean;
    } = {},
  ): ScriptBuilder<never, JsonObjectShape<TProperties>[]> {
    const listVar = '__collected_items';

    // 1. Initialize collection list
    this.set(listVar, []);

    // 2. Set up loop with optional limit/condition
    const buildBody = (b: ScriptBuilder) => {
      // Process properties to separate simple strings from transformations
      const transformedVars: Record<string, string> = {};
      const finalPropertyMap: Record<string, string> = {};

      for (const [jsonKey, propDef] of Object.entries(properties)) {
        if (typeof propDef === 'string') {
          // Simple string property - use directly
          finalPropertyMap[jsonKey] = propDef;
        } else {
          // PropertyExtractor - needs transformation
          if (!propDef.property) {
            throw new ScriptBuilderError(
              `PropertyExtractor for "${jsonKey}" must have a "property" field`,
            );
          }
          const tempVarName = `__temp_${jsonKey}`;
          const propExpr =
            typeof propDef.property === 'function'
              ? propDef.property(new ExprBuilder())
              : `${propDef.property} of ${itemVariable}`; // Append "of itemVariable" for string properties
          const defaultVal = propDef.default
            ? typeof propDef.default === 'function'
              ? propDef.default(new ExprBuilder())
              : propDef.default
            : 'missing value';

          if (propDef.firstOf) {
            // Use setFirstOf() for first-or-default pattern
            b.setFirstOf(tempVarName, propExpr, defaultVal);
          } else if (propDef.ifExists) {
            // Use setIfExists() for existence check pattern
            b.setIfExists(tempVarName, propExpr, defaultVal, propDef.asType);
          } else {
            // Just set the expression directly
            b.setExpression(tempVarName, propExpr);
          }

          transformedVars[jsonKey] = tempVarName;
          finalPropertyMap[jsonKey] = tempVarName;
        }
      }

      // Build record using both simple properties and transformed variables
      if (options.skipErrors) {
        b.tryCatch(
          (tryBlock) => tryBlock.pickEndRecord(listVar, itemVariable, finalPropertyMap),
          (catchBlock) => catchBlock.comment('Skip items with errors'),
        );
      } else {
        b.pickEndRecord(listVar, itemVariable, finalPropertyMap);
      }
    };

    if (options.limit !== undefined) {
      const limit = options.limit;
      this.set('__counter', 0);
      this.forEachUntil<string>(
        itemVariable,
        collection,
        (e) => e.gte('__counter', limit),
        (b) => {
          b.increment('__counter');
          buildBody(b);
        },
      );
    } else if (options.until !== undefined) {
      this.forEachUntil<string>(itemVariable, collection, options.until, buildBody);
    } else if (options.while !== undefined) {
      this.forEachWhile<string>(itemVariable, collection, options.while, buildBody);
    } else {
      this.forEach<string>(itemVariable, collection, buildBody);
    }

    // 3. Return as JSON - map JSON keys to record property keys (not AppleScript expressions)
    // The record has keys like {id: value, name: value}, so we need to map id→id, name→name, etc.
    const recordPropertyMap = Object.keys(properties).reduce<Record<string, string>>((acc, key) => {
      acc[key] = key; // JSON key maps to record property with same name
      return acc;
    }, {});
    return this.returnAsJson(listVar, recordPropertyMap, { skipErrors: options.skipErrors });
  }

  /**
   * Return a list of records as a JSON string.
   * Converts AppleScript records to JSON format by manually building the JSON string.
   * Handles proper escaping of strings, booleans, numbers, and null values.
   * @param listVariable Name of the variable containing a list of records
   * @param propertyMap Mapping of JSON keys to AppleScript property names (e.g., {id: 'noteId', name: 'noteName'})
   * @param options.skipErrors When true, records that fail to serialize are omitted from the
   * array. Defaults to false, so a failing record raises the underlying AppleScript error
   * rather than disappearing from the result.
   */
  returnAsJson<TProperties extends Record<string, string>>(
    listVariable: string,
    propertyMap: TProperties,
    options: { skipErrors?: boolean } = {},
  ): ScriptBuilder<never, JsonObjectShape<TProperties>[]> {
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
    // Records that fail to serialize propagate the AppleScript error by default, so a
    // dropped record is never silent. Pass { skipErrors: true } for lenient behaviour.
    const skipErrors = options.skipErrors ?? false;
    const pad = skipErrors ? '  ' : '';

    this.raw('set jsonParts to {}');
    this.raw(`repeat with rec in ${listVariable}`);
    if (skipErrors) {
      this.raw('  try');
    }
    this.raw(`  ${pad}set itemJson to "{"`);

    // Generate property access for each key in the property map
    const entries = Object.entries(propertyMap);
    entries.forEach(([jsonKey, appleScriptProp], index) => {
      const comma = index > 0 ? ',' : '';
      this.raw(
        `  ${pad}set itemJson to itemJson & "${comma}\\"${jsonKey}\\":" & my valueToJson(${appleScriptProp} of rec)`,
      );
    });

    this.raw(`  ${pad}set itemJson to itemJson & "}"`);
    this.raw(`  ${pad}set end of jsonParts to itemJson`);
    if (skipErrors) {
      this.raw('  end try');
    }
    this.raw('end repeat');
    this.raw('');
    this.raw(`set AppleScript's text item delimiters to ","`);
    this.raw(`set jsonArray to "[" & (jsonParts as text) & "]"`);
    this.raw(`set AppleScript's text item delimiters to ""`);
    this.raw('return jsonArray');
    return this as ScriptBuilder<never, JsonObjectShape<TProperties>[]>;
  }

  log(message: string): this {
    this.script.push(`${this.getIndentation()}log "${this.escapeString(message)}"`);
    return this;
  }

  comment(text: string): this {
    this.script.push(`${this.getIndentation()}-- ${text}`);
    return this;
  }

  // Application control
  activate(): this {
    this.script.push(`${this.getIndentation()}activate`);
    return this;
  }

  quit(): this {
    this.script.push(`${this.getIndentation()}quit`);
    return this;
  }

  reopen(): this {
    this.script.push(`${this.getIndentation()}reopen`);
    return this;
  }

  launch(): this {
    this.script.push(`${this.getIndentation()}launch`);
    return this;
  }

  running(): this {
    this.script.push(`${this.getIndentation()}running`);
    return this;
  }

  // Window management
  closeWindow(window?: string): this {
    if (window) {
      this.script.push(`${this.getIndentation()}close window "${this.escapeString(window)}"`);
    } else {
      this.script.push(`${this.getIndentation()}close front window`);
    }
    return this;
  }

  closeAllWindows(): this {
    this.script.push(`${this.getIndentation()}close every window`);
    return this;
  }

  minimizeWindow(window?: string): this {
    if (window) {
      this.script.push(
        `${this.getIndentation()}set miniaturized of window "${this.escapeString(window)}" to true`,
      );
    } else {
      this.script.push(`${this.getIndentation()}set miniaturized of front window to true`);
    }
    return this;
  }

  zoomWindow(window?: string): this {
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
  click(target: string): this {
    this.script.push(`${this.getIndentation()}click ${target}`);
    return this;
  }

  select(target: string): this {
    this.script.push(`${this.getIndentation()}select ${target}`);
    return this;
  }

  keystroke(text: string, modifiers?: string[]): this {
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
  keystrokes(text: string, delayBetween = 0.1): this {
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

  delay(seconds: number): this {
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
  set<TNewVar extends string>(variable: TNewVar, value: AppleScriptValue): ScriptBuilder<TNewVar> {
    this.script.push(`${this.getIndentation()}set ${variable} to ${this.formatValue(value)}`);
    return this as ScriptBuilder<TNewVar>;
  }

  setExpression<TNewVar extends string>(
    variable: TNewVar,
    expression: string | Record<string, string> | ((expr: ExprBuilder) => string),
  ): ScriptBuilder<TNewVar> {
    let expr: string;
    if (typeof expression === 'function') {
      expr = expression(new ExprBuilder());
    } else if (typeof expression === 'string') {
      expr = expression;
    } else {
      expr = this.makeRecordFrom(expression);
    }
    this.script.push(`${this.getIndentation()}set ${variable} to ${expr}`);
    return this as ScriptBuilder<TNewVar>;
  }

  setExpressions(expressions: Record<string, string | ((expr: ExprBuilder) => string)>): this {
    for (const [variable, expression] of Object.entries(expressions)) {
      const expr = resolveExpression(expression);
      this.script.push(`${this.getIndentation()}set ${variable} to ${expr}`);
    }
    return this;
  }

  appendTo(
    variable: string,
    expression: string | ((expr: ExprBuilder) => string),
    options?: { prependLinefeed?: boolean; appendLinefeed?: boolean },
  ): this {
    let expr = resolveExpression(expression);

    // Add linefeed wrapping if requested
    if (options?.prependLinefeed) {
      expr = `linefeed & ${expr}`;
    }
    if (options?.appendLinefeed) {
      expr = `${expr} & linefeed`;
    }

    this.script.push(`${this.getIndentation()}set ${variable} to ${variable} & ${expr}`);
    return this;
  }

  increment(variable: string, by = 1): this {
    this.script.push(`${this.getIndentation()}set ${variable} to ${variable} + ${by}`);
    return this;
  }

  decrement(variable: string, by = 1): this {
    this.script.push(`${this.getIndentation()}set ${variable} to ${variable} - ${by}`);
    return this;
  }

  get(property: string): this {
    this.script.push(`${this.getIndentation()}get ${property}`);
    return this;
  }

  copy<TNewVar extends string>(value: AppleScriptValue, to: TNewVar): ScriptBuilder<TNewVar> {
    this.script.push(`${this.getIndentation()}copy ${this.formatValue(value)} to ${to}`);
    return this as ScriptBuilder<TNewVar>;
  }

  count(items: string): this {
    this.script.push(`${this.getIndentation()}count ${items}`);
    return this;
  }

  setCountOf<TNewVar extends string>(variable: TNewVar, items: string): ScriptBuilder<TNewVar> {
    this.script.push(`${this.getIndentation()}set ${variable} to count of (${items})`);
    return this as ScriptBuilder<TNewVar>;
  }

  exists(item: string): this {
    this.script.push(`${this.getIndentation()}exists ${item}`);
    return this;
  }

  setEnd(variable: string, value: AppleScriptValue): this {
    this.script.push(
      `${this.getIndentation()}set end of ${variable} to ${this.formatValue(value)}`,
    );
    return this;
  }

  setEndRaw(
    variable: string,
    expression: string | Record<string, string> | ((expr: ExprBuilder) => string),
  ): this {
    let expr: string;
    if (typeof expression === 'function') {
      expr = expression(new ExprBuilder());
    } else if (typeof expression === 'string') {
      expr = expression;
    } else {
      expr = this.makeRecordFrom(expression);
    }
    this.script.push(`${this.getIndentation()}set end of ${variable} to ${expr}`);
    return this;
  }

  setEndRecord(
    listVariable: string,
    sourceOrExpressions: string | Record<string, string>,
    propertyMap?: Record<string, string>,
  ): this {
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
  ): this {
    const recordExpressions = Object.entries(propertyMap).reduce<Record<string, string>>(
      (acc, [key, prop]) => {
        // Check if property looks like a full expression (contains AppleScript keywords)
        // OR if it's a temp variable from PropertyExtractor (starts with __temp_)
        // If so, use as-is. Otherwise, append "of source" for shorthand.
        const isFullExpression =
          prop.startsWith('__temp_') ||
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

  /**
   * Set variable using ternary operator pattern with if-then-else block.
   * Much more concise than manually calling ifThenElse for simple conditional assignments.
   *
   * Generates an if-then-else block that sets the variable conditionally.
   *
   * @param variable - Variable name to set
   * @param condition - Condition to evaluate (string or ExprBuilder callback)
   * @param trueExpression - Expression to use if condition is true
   * @param falseExpression - Expression to use if condition is false
   *
   * @example
   * // With ExprBuilder for type-safe conditions
   * .setTernary('personEmail',
   *   (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
   *   (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
   *   'missing value'
   * )
   *
   * @example
   * // With strings
   * .setTernary('status',
   *   'count of items > 0',
   *   '"active"',
   *   '"empty"'
   * )
   *
   * @example
   * // Replaces verbose ifThenElse:
   * // .ifThenElse(
   * //   (e) => e.gt('x', 10),
   * //   (then_) => then_.set('result', 'high'),
   * //   (else_) => else_.set('result', 'low')
   * // )
   * // With concise ternary:
   * .setTernary('result', (e) => e.gt('x', 10), '"high"', '"low"')
   */
  setTernary<TNewVar extends string>(
    variable: TNewVar,
    condition: string | ((e: ExprBuilder) => string),
    trueExpression: string | ((e: ExprBuilder) => string),
    falseExpression: string | ((e: ExprBuilder) => string),
  ): ScriptBuilder<TNewVar> {
    const cond = resolveExpression(condition);
    const trueExpr = resolveExpression(trueExpression);
    const falseExpr = resolveExpression(falseExpression);

    // Generate proper if-then-else block (AppleScript doesn't support inline conditionals)
    return this.ifThenElse(
      cond,
      (then_) => then_.setExpression(variable, trueExpr),
      (else_) => else_.setExpression(variable, falseExpr),
    ) as ScriptBuilder<TNewVar>;
  }

  /**
   * Append to list using ternary operator pattern with if-then-else block.
   * Combines setEndRaw with conditional logic for ultra-concise syntax.
   *
   * Generates an if-then-else block that conditionally appends to the list.
   *
   * @param listVariable - Name of the list to append to
   * @param condition - Condition to evaluate (string or ExprBuilder callback)
   * @param trueExpression - Expression to append if condition is true
   * @param falseExpression - Expression to append if condition is false
   *
   * @example
   * // Conditionally append different values
   * .set('results', [])
   * .forEach('item', 'every file of desktop', (loop) =>
   *   loop.setEndTernary('results',
   *     (e) => e.gt(e.property('item', 'size'), 1000000),
   *     '"large"',
   *     '"small"'
   *   )
   * )
   *
   * @example
   * // With complex expressions
   * .setEndTernary('emails',
   *   'count of email addresses of person > 0',
   *   'value of item 1 of email addresses of person',
   *   'missing value'
   * )
   */
  setEndTernary(
    listVariable: string,
    condition: string | ((e: ExprBuilder) => string),
    trueExpression: string | ((e: ExprBuilder) => string),
    falseExpression: string | ((e: ExprBuilder) => string),
  ): ScriptBuilder {
    const cond = resolveExpression(condition);
    const trueExpr = resolveExpression(trueExpression);
    const falseExpr = resolveExpression(falseExpression);

    // Generate proper if-then-else block (AppleScript doesn't support inline conditionals)
    return this.ifThenElse(
      cond,
      (then_) => then_.setEndRaw(listVariable, trueExpr),
      (else_) => else_.setEndRaw(listVariable, falseExpr),
    );
  }

  /**
   * Set variable to first item of collection or default value if collection is empty.
   * Ultra-shorthand for the common "first or default" pattern.
   *
   * Automatically generates an if-then-else block that checks the collection count and sets the variable accordingly.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param collection - Collection expression to get first item from
   * @param defaultValue - Value to use if collection is empty (default: 'missing value')
   *
   * @example
   * // Get first email or missing value
   * .setFirstOf('personEmail', (e) => e.property('aPerson', 'emails'))
   *
   * @example
   * // Get first email or custom default
   * .setFirstOf('personEmail', (e) => e.property('aPerson', 'emails'), '"no-email@example.com"')
   *
   * @example
   * // With string expression
   * .setFirstOf('personEmail', 'emails of aPerson', 'missing value')
   *
   * @example
   * // Replaces verbose pattern:
   * // .setTernary('personEmail',
   * //   (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
   * //   (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
   * //   'missing value'
   * // )
   */
  setFirstOf<TNewVar extends string>(
    variable: TNewVar,
    collection: string | ((e: ExprBuilder) => string),
    defaultValue: string | ((e: ExprBuilder) => string) = 'missing value',
  ): ScriptBuilder<TNewVar> {
    const coll = resolveExpression(collection);
    const defaultVal = resolveExpression(defaultValue);

    // Generate proper if-then-else block (AppleScript doesn't support inline conditionals)
    return this.ifThenElse(
      `count of ${coll} > 0`,
      (then_) => then_.setExpression(variable, `value of item 1 of ${coll}`),
      (else_) => else_.setExpression(variable, defaultVal),
    ) as ScriptBuilder<TNewVar>;
  }

  /**
   * Append first item of collection or default value to a list.
   * Ultra-shorthand for the common "first or default" pattern in list building.
   *
   * Automatically generates an if-then-else block that checks the collection count and appends to the list accordingly.
   *
   * @param listVariable - Name of the list to append to
   * @param collection - Collection expression to get first item from
   * @param defaultValue - Value to use if collection is empty (default: 'missing value')
   *
   * @example
   * // Build list of first emails
   * .forEach('person', 'every person', (loop) =>
   *   loop.setEndFirstOf('emails', (e) => e.property('person', 'email addresses'))
   * )
   *
   * @example
   * // With custom default
   * .setEndFirstOf('results', 'items of record', '""')
   */
  setEndFirstOf(
    listVariable: string,
    collection: string | ((e: ExprBuilder) => string),
    defaultValue: string | ((e: ExprBuilder) => string) = 'missing value',
  ): ScriptBuilder {
    const coll = resolveExpression(collection);
    const defaultVal = resolveExpression(defaultValue);

    // Generate proper if-then-else block (AppleScript doesn't support inline conditionals)
    return this.ifThenElse(
      `count of ${coll} > 0`,
      (then_) => then_.setEndRaw(listVariable, `value of item 1 of ${coll}`),
      (else_) => else_.setEndRaw(listVariable, defaultVal),
    );
  }

  /**
   * Set variable to property value if it exists, otherwise use default value.
   * Ultra-shorthand for the common "take if exists or default" pattern.
   *
   * Automatically generates an if-then-else block that checks if the property exists
   * and sets the variable accordingly, with optional type conversion.
   *
   * @template TNewVar - The variable name (inferred from first parameter)
   * @param variable - Variable name to set (will be added to scope)
   * @param property - Property expression to check and retrieve
   * @param defaultValue - Value to use if property doesn't exist (default: 'missing value')
   * @param asType - Optional type to convert property to (e.g., 'string', 'integer')
   *
   * @example
   * // Get birth date as string or missing value
   * .setIfExists('personBirthday',
   *   (e) => e.property('aPerson', 'birth date'),
   *   'missing value',
   *   'string'
   * )
   *
   * @example
   * // Simpler syntax with string expression
   * .setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string')
   *
   * @example
   * // Without type conversion
   * .setIfExists('personNote', 'note of aPerson', '""')
   *
   * @example
   * // Replaces verbose pattern:
   * // .setTernary('personBirthday',
   * //   (e) => e.exists(e.property('aPerson', 'birth date')),
   * //   (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
   * //   'missing value'
   * // )
   */
  setIfExists<TNewVar extends string>(
    variable: TNewVar,
    property: string | ((e: ExprBuilder) => string),
    defaultValue: string | ((e: ExprBuilder) => string) = 'missing value',
    asType?: string,
  ): ScriptBuilder<TNewVar> {
    const prop = resolveExpression(property);
    const defaultVal = resolveExpression(defaultValue);

    // Build the value expression with optional type conversion
    const valueExpr = asType ? `${prop} as ${asType}` : prop;

    // Generate proper if-then-else block
    return this.ifThenElse(
      `exists ${prop}`,
      (then_) => then_.setExpression(variable, valueExpr),
      (else_) => else_.setExpression(variable, defaultVal),
    ) as ScriptBuilder<TNewVar>;
  }

  /**
   * Append property value to list if it exists, otherwise append default value.
   * Ultra-shorthand for the common "take if exists or default" pattern in list building.
   *
   * Automatically generates an if-then-else block that checks if the property exists
   * and appends to the list accordingly, with optional type conversion.
   *
   * @param listVariable - Name of the list to append to
   * @param property - Property expression to check and retrieve
   * @param defaultValue - Value to use if property doesn't exist (default: 'missing value')
   * @param asType - Optional type to convert property to (e.g., 'string', 'integer')
   *
   * @example
   * // Build list of birth dates
   * .forEach('person', 'every person', (loop) =>
   *   loop.setEndIfExists('dates', 'birth date of person', '""', 'string')
   * )
   *
   * @example
   * // With ExprBuilder
   * .setEndIfExists('notes',
   *   (e) => e.property('contact', 'note'),
   *   'missing value'
   * )
   */
  setEndIfExists(
    listVariable: string,
    property: string | ((e: ExprBuilder) => string),
    defaultValue: string | ((e: ExprBuilder) => string) = 'missing value',
    asType?: string,
  ): ScriptBuilder {
    const prop = resolveExpression(property);
    const defaultVal = resolveExpression(defaultValue);

    // Build the value expression with optional type conversion
    const valueExpr = asType ? `${prop} as ${asType}` : prop;

    // Generate proper if-then-else block
    return this.ifThenElse(
      `exists ${prop}`,
      (then_) => then_.setEndRaw(listVariable, valueExpr),
      (else_) => else_.setEndRaw(listVariable, defaultVal),
    );
  }

  setProperty(variable: string, property: string, value: AppleScriptValue): this {
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
  first(items: string): this {
    this.script.push(`${this.getIndentation()}first item of ${items}`);
    return this;
  }

  last(items: string): this {
    this.script.push(`${this.getIndentation()}last item of ${items}`);
    return this;
  }

  rest(items: string): this {
    this.script.push(`${this.getIndentation()}rest of ${items}`);
    return this;
  }

  reverse(items: string): this {
    this.script.push(`${this.getIndentation()}reverse of ${items}`);
    return this;
  }

  some(items: string, test: string): this {
    this.script.push(`${this.getIndentation()}some item of ${items} where ${test}`);
    return this;
  }

  every(items: string, test: string): this {
    this.script.push(`${this.getIndentation()}every item of ${items} where ${test}`);
    return this;
  }

  whose(items: string, condition: string): string {
    return `${items} whose ${condition}`;
  }

  getEvery(itemType: string, location?: string): this {
    const loc = location ? ` of ${location}` : '';
    this.script.push(`${this.getIndentation()}get every ${itemType}${loc}`);
    return this;
  }

  getEveryWhere(itemType: string, condition: string, location?: string): this {
    const loc = location ? ` of ${location}` : '';
    this.script.push(`${this.getIndentation()}get every ${itemType}${loc} where ${condition}`);
    return this;
  }

  // Text operations
  offset(text: string, in_: string): this {
    this.script.push(`${this.getIndentation()}offset of ${text} in ${in_}`);
    return this;
  }

  contains(text: string, in_: string): this {
    this.script.push(`${this.getIndentation()}${in_} contains ${text}`);
    return this;
  }

  beginsWith(text: string, with_: string): this {
    this.script.push(`${this.getIndentation()}${text} begins with ${with_}`);
    return this;
  }

  endsWith(text: string, with_: string): this {
    this.script.push(`${this.getIndentation()}${text} ends with ${with_}`);
    return this;
  }

  // System operations
  path(to: string): this {
    this.script.push(`${this.getIndentation()}path to ${to}`);
    return this;
  }

  info(for_: string): this {
    this.script.push(`${this.getIndentation()}info for ${for_}`);
    return this;
  }

  do(script: string): this {
    this.script.push(`${this.getIndentation()}do script "${this.escapeString(script)}"`);
    return this;
  }

  doShellScript(command: string, administrator?: boolean): this {
    let cmd = `${this.getIndentation()}do shell script "${this.escapeString(command)}"`;
    if (administrator) {
      cmd += ' with administrator privileges';
    }
    this.script.push(cmd);
    return this;
  }

  // Raw script and building
  raw(script: string): this {
    this.addLine(script);
    return this;
  }

  // Enhanced Application control
  getRunningApplications(): this {
    this.raw(
      'tell application "System Events" to return {name, bundle identifier, visible, frontmost} of every process where background only is false',
    );
    return this;
  }

  getFrontmostApplication(): this {
    this.raw(
      'tell application "System Events" to return name of first process where frontmost is true',
    );
    return this;
  }

  activateApplication(appName: string): this {
    this.raw(`tell application "${this.escapeString(appName)}" to activate`);
    return this;
  }

  hideApplication(appName: string): this {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to set visible to false`,
    );
    return this;
  }

  unhideApplication(appName: string): this {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to set visible to true`,
    );
    return this;
  }

  quitApplication(appName: string): this {
    this.raw(`tell application "${this.escapeString(appName)}" to quit`);
    return this;
  }

  isApplicationRunning(appName: string): this {
    this.raw(
      `tell application "System Events" to return exists (processes where name is "${this.escapeString(appName)}")`,
    );
    return this;
  }

  getApplicationInfo(appName: string): this {
    this.raw(
      `tell application "System Events" to tell process "${this.escapeString(appName)}" to return properties`,
    );
    return this;
  }

  // Enhanced Window management
  getWindowInfo(appName: string, windowName?: string): this {
    this.raw(
      windowName
        ? `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to return {name, id, bounds, miniaturized, zoomed}`
        : `tell application "${this.escapeString(appName)}" to tell front window to return {name, id, bounds, miniaturized, zoomed}`,
    );
    return this;
  }

  getAllWindows(appName: string): this {
    this.raw(
      `tell application "${this.escapeString(appName)}" to return {name, id, bounds, miniaturized, zoomed} of every window`,
    );
    return this;
  }

  getFrontmostWindow(appName: string): this {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell front window to return {name, id, bounds, miniaturized, zoomed}`,
    );
    return this;
  }

  setWindowBounds(
    appName: string,
    windowName: string,
    bounds: { x: number; y: number; width: number; height: number },
  ): this {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set bounds to {${bounds.x}, ${bounds.y}, ${bounds.x + bounds.width}, ${bounds.y + bounds.height}}`,
    );
    return this;
  }

  moveWindow(appName: string, windowName: string, x: number, y: number): this {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set position to {${x}, ${y}}`,
    );
    return this;
  }

  resizeWindow(appName: string, windowName: string, width: number, height: number): this {
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set size to {${width}, ${height}}`,
    );
    return this;
  }

  arrangeWindows(arrangement: 'cascade' | 'tile' | 'stack'): this {
    this.raw(`tell application "System Events" to tell process "Finder" to ${arrangement} windows`);
    return this;
  }

  focusWindow(appName: string, windowName: string): this {
    this.raw(`tell application "${this.escapeString(appName)}" to activate`);
    this.raw(
      `tell application "${this.escapeString(appName)}" to tell window "${this.escapeString(windowName)}" to set index to 1`,
    );
    return this;
  }

  switchToWindow(appName: string, windowName: string): this {
    return this.focusWindow(appName, windowName);
  }

  // Enhanced UI interaction
  pressKey(key: string, modifiers?: ('command' | 'option' | 'control' | 'shift')[]): this {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.raw(`tell application "System Events" to key code ${key}${modString}`);
    return this;
  }

  pressKeyCode(keyCode: number, modifiers?: ('command' | 'option' | 'control' | 'shift')[]): this {
    const modString = modifiers?.length ? ` using {${modifiers.join(', ')}}` : '';
    this.raw(`tell application "System Events" to key code ${keyCode}${modString}`);
    return this;
  }

  typeText(text: string): this {
    this.raw(`tell application "System Events" to keystroke "${this.escapeString(text)}"`);
    return this;
  }

  clickButton(buttonName: string): this {
    this.raw(`tell application "System Events" to click button "${this.escapeString(buttonName)}"`);
    return this;
  }

  clickMenuItem(menuName: string, itemName: string): this {
    this.raw(
      `tell application "System Events" to click menu item "${this.escapeString(itemName)}" of menu "${this.escapeString(menuName)}" of menu bar 1`,
    );
    return this;
  }

  /**
   * `tell application "iTerm2" … end tell` with automatic closing.
   * @param block Commands to run while iTerm2 is targeted
   * @param options.applicationName Override if your app registers another name (e.g. `"iTerm"`)
   */
  tellITerm2(
    block: (builder: ScriptBuilder) => void,
    options?: { applicationName?: string },
  ): this {
    const appName = options?.applicationName ?? 'iTerm2';
    this.tell(appName);
    block(this as ScriptBuilder);
    return this.end();
  }

  /** `tell current window … end tell` (use inside {@link tellITerm2}). */
  itermTellCurrentWindow(block: (builder: ScriptBuilder) => void): this {
    this.tellTarget('current window');
    block(this as ScriptBuilder);
    return this.end();
  }

  /** `tell current session of current window … end tell` (use inside {@link tellITerm2}). */
  itermTellCurrentSession(block: (builder: ScriptBuilder) => void): this {
    this.tellTarget('current session of current window');
    block(this as ScriptBuilder);
    return this.end();
  }

  /**
   * `tell <sessionRef> … end tell` for a session reference (e.g. `rightPane`,
   * `current session of newTab`).
   */
  itermTellSession(sessionRef: string, block: (builder: ScriptBuilder) => void): this {
    this.tellTarget(sessionRef);
    block(this as ScriptBuilder);
    return this.end();
  }

  itermCreateWindowWithDefaultProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(
        `create window with default profile command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw('create window with default profile');
    }
    return this;
  }

  itermCreateWindowWithProfile(profileName: string, options?: { command?: string }): this {
    const p = this.escapeString(profileName);
    if (options?.command !== undefined) {
      this.raw(`create window with profile "${p}" command "${this.escapeString(options.command)}"`);
    } else {
      this.raw(`create window with profile "${p}"`);
    }
    return this;
  }

  itermCreateHotkeyWindowWithProfile(profileName: string): this {
    this.raw(`create hotkey window with profile "${this.escapeString(profileName)}"`);
    return this;
  }

  itermCreateTabWithDefaultProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(`create tab with default profile command "${this.escapeString(options.command)}"`);
    } else {
      this.raw('create tab with default profile');
    }
    return this;
  }

  itermCreateTabWithProfile(profileName: string, options?: { command?: string }): this {
    const p = this.escapeString(profileName);
    if (options?.command !== undefined) {
      this.raw(`create tab with profile "${p}" command "${this.escapeString(options.command)}"`);
    } else {
      this.raw(`create tab with profile "${p}"`);
    }
    return this;
  }

  itermSplitHorizontallyWithDefaultProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(
        `split horizontally with default profile command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw('split horizontally with default profile');
    }
    return this;
  }

  itermSplitVerticallyWithDefaultProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(
        `split vertically with default profile command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw('split vertically with default profile');
    }
    return this;
  }

  itermSplitHorizontallyWithProfile(profileName: string, options?: { command?: string }): this {
    const p = this.escapeString(profileName);
    if (options?.command !== undefined) {
      this.raw(
        `split horizontally with profile "${p}" command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw(`split horizontally with profile "${p}"`);
    }
    return this;
  }

  itermSplitVerticallyWithProfile(profileName: string, options?: { command?: string }): this {
    const p = this.escapeString(profileName);
    if (options?.command !== undefined) {
      this.raw(
        `split vertically with profile "${p}" command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw(`split vertically with profile "${p}"`);
    }
    return this;
  }

  itermSplitHorizontallyWithSameProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(
        `split horizontally with same profile command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw('split horizontally with same profile');
    }
    return this;
  }

  itermSplitVerticallyWithSameProfile(options?: { command?: string }): this {
    if (options?.command !== undefined) {
      this.raw(
        `split vertically with same profile command "${this.escapeString(options.command)}"`,
      );
    } else {
      this.raw('split vertically with same profile');
    }
    return this;
  }

  /**
   * Sends keystrokes to the current session (use inside {@link itermTellCurrentSession} or similar).
   * @param options.newline Set false to append `newline NO` (omit trailing newline).
   */
  itermWriteText(text: string, options?: { newline?: boolean }): this {
    const escaped = this.escapeString(text);
    if (options?.newline === false) {
      this.raw(`write text "${escaped}" newline NO`);
    } else {
      this.raw(`write text "${escaped}"`);
    }
    return this;
  }

  /** Pipe a file into the session as typed input (iTerm2 `write contents of file`). */
  itermWriteContentsOfFile(path: string): this {
    this.raw(`write contents of file "${this.escapeString(path)}"`);
    return this;
  }

  /**
   * Sets a session variable (badge / user vars use names like `user.foo`).
   * @see https://www.iterm2.com/documentation-variables.html
   */
  itermSetSessionVariable(name: string, value: string): this {
    this.raw(`set variable named "${this.escapeString(name)}" to "${this.escapeString(value)}"`);
    return this;
  }

  /** Close the current session (use inside {@link itermTellCurrentSession} or similar). */
  itermCloseSession(): this {
    this.raw('close');
    return this;
  }

  /** Close the current tab (use inside {@link itermTellCurrentWindow}). */
  itermCloseTab(): this {
    this.raw('close current tab');
    return this;
  }

  /** Close the current window (use inside {@link tellITerm2}). */
  itermCloseCurrentWindow(): this {
    this.raw('close current window');
    return this;
  }

  /**
   * Reveal the hotkey window (bring to front if hidden).
   * Must be called inside {@link tellITerm2}.
   */
  itermRevealHotkeyWindow(): this {
    this.raw('reveal hotkey window');
    return this;
  }

  /**
   * Hide the hotkey window.
   * Must be called inside {@link tellITerm2}.
   */
  itermHideHotkeyWindow(): this {
    this.raw('hide hotkey window');
    return this;
  }

  /**
   * Toggle the hotkey window (show if hidden, hide if visible).
   * Must be called inside {@link tellITerm2}.
   */
  itermToggleHotkeyWindow(): this {
    this.raw('toggle hotkey window');
    return this;
  }

  /**
   * Select the previous pane/session in the current tab.
   * Use inside {@link itermTellCurrentWindow} or {@link itermTellCurrentSession}.
   */
  itermSelectPreviousSession(): this {
    this.raw('select previous session');
    return this;
  }

  /**
   * Select the next pane/session in the current tab.
   * Use inside {@link itermTellCurrentWindow} or {@link itermTellCurrentSession}.
   */
  itermSelectNextSession(): this {
    this.raw('select next session');
    return this;
  }

  /**
   * Set the name (title) of the current session.
   * Use inside {@link itermTellCurrentSession} or {@link itermTellSession}.
   */
  itermSetSessionName(name: string): this {
    this.raw(`set name to "${this.escapeString(name)}"`);
    return this;
  }

  /**
   * Get the name (title) of the current session into a variable.
   * Use inside {@link itermTellCurrentSession} or {@link itermTellSession}.
   * @param variableName AppleScript variable to store the result in
   */
  itermGetSessionName(variableName: string): this {
    this.raw(`set ${variableName} to name`);
    return this;
  }

  /**
   * Get the tty device path of the current session into a variable.
   * Use inside {@link itermTellCurrentSession} or {@link itermTellSession}.
   * @param variableName AppleScript variable to store the result in
   */
  itermGetSessionTty(variableName: string): this {
    this.raw(`set ${variableName} to tty`);
    return this;
  }

  // Convenience helpers for cleaner API
  /**
   * Simplified tell application pattern with automatic block closing.
   * Cleaner than manually calling tell()...end().
   * @param appName Name of the application to tell
   * @param block Callback that builds commands for the application
   */
  tellApp(appName: string, block: (builder: ScriptBuilder) => void): this {
    this.tell(appName);
    block(this as ScriptBuilder);
    return this.end();
  }

  /**
   * Simplified if-then pattern that automatically closes the if block.
   * Cleaner than manually calling if()...thenBlock()...endif().
   * @param condition The condition to check (string or ExprBuilder callback)
   * @param thenBlock Callback that builds the then branch
   */
  ifThen(
    condition: string | ((expr: ExprBuilder) => string),
    thenBlock: (builder: ScriptBuilder) => void,
  ): this {
    this.if(condition).thenBlock();
    thenBlock(this as ScriptBuilder);
    return this.endif();
  }

  /**
   * Simplified if-then-else pattern that automatically closes the if block.
   * Cleaner than manually calling if()...thenBlock()...else()...endif().
   * @param condition The condition to check (string or ExprBuilder callback)
   * @param thenBlock Callback that builds the then branch
   * @param elseBlock Callback that builds the else branch
   */
  ifThenElse(
    condition: string | ((expr: ExprBuilder) => string),
    thenBlock: (builder: ScriptBuilder) => void,
    elseBlock: (builder: ScriptBuilder) => void,
  ): this {
    this.if(condition).thenBlock();
    thenBlock(this as ScriptBuilder);
    this.else();
    elseBlock(this as ScriptBuilder);
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
  ): this {
    this.try();
    tryBlock(this as ScriptBuilder);
    this.onError();
    catchBlock(this as ScriptBuilder);
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
  ): this {
    this.try();
    tryBlock(this as ScriptBuilder);
    this.onError(errorVarName);
    catchBlock(this as ScriptBuilder);
    return this.endtry();
  }

  /**
   * Activate an application, execute a block, then restore the previously frontmost app.
   *
   * If the target app is already frontmost when the script runs, no focus-restore step
   * is emitted. Otherwise the original frontmost app is re-activated after the body.
   *
   * Generates AppleScript that:
   * 1. Captures the current frontmost application name into `_prevFrontApp`
   * 2. Activates the target application
   * 3. Executes the body block
   * 4. Conditionally restores focus to the original app (only if it differed)
   *
   * @param appName The application name to activate (e.g. "iTerm", "Finder")
   * @param body Callback that builds the block to execute while the app is active
   * @example
   * createScript()
   *   .withApplicationActivated("iTerm", (b) => {
   *     b.tell("iTerm")
   *       .raw('keystroke "hello"')
   *       .endtell()
   *   })
   */
  withApplicationActivated(appName: string, body: (builder: ScriptBuilder) => void): this {
    const escaped = this.escapeString(appName);
    this.tell('System Events')
      .setExpression('_prevFrontApp', 'name of first process where frontmost is true')
      .endtell();
    this.activateApplication(appName);
    body(this as ScriptBuilder);
    this.ifThen(`_prevFrontApp is not "${escaped}"`, (b) =>
      b.tellTarget('application _prevFrontApp').activate().endtell(),
    );
    return this;
  }

  /**
   * Iterate over items with automatic block closing.
   * More intuitive name for repeatWith that uses callback pattern.
   * @param variable Loop variable name
   * @param list Expression for the list to iterate (e.g., 'every note')
   * @param block Callback that builds the loop body
   */
  forEach<TNewVar extends string>(
    variable: TNewVar,
    list: string,
    block: (builder: ScriptBuilder<TNewVar>) => void,
  ): this {
    this.repeatWith(variable, list);
    block(this as ScriptBuilder<TNewVar>);
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
  forEachWhile<TNewVar extends string>(
    variable: TNewVar,
    list: string,
    condition: string | ((expr: ExprBuilder<TNewVar>) => string),
    block: (builder: ScriptBuilder<TNewVar>) => void,
  ): this {
    this.repeatWith(variable, list);
    this.ifThen(
      typeof condition === 'function' ? (e) => e.not(condition(e)) : (e) => e.not(condition),
      (b) => b.exitRepeat(),
    );
    block(this as ScriptBuilder<TNewVar>);
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
  forEachUntil<TNewVar extends string>(
    variable: TNewVar,
    list: string,
    condition: string | ((expr: ExprBuilder<TNewVar>) => string),
    block: (builder: ScriptBuilder<TNewVar>) => void,
  ): this {
    this.repeatWith(variable, list);
    this.ifThen(condition, (b) => b.exitRepeat());
    block(this as ScriptBuilder<TNewVar>);
    return this.endrepeat();
  }

  /**
   * Repeat a fixed number of times with automatic block closing.
   * @param times Number of times to repeat
   * @param block Callback that builds the loop body
   */
  repeatTimes(times: number, block: (builder: ScriptBuilder) => void): this {
    this.repeat(times);
    block(this as ScriptBuilder);
    return this.endrepeat();
  }

  /**
   * Repeat while condition is true with automatic block closing.
   * @param condition Condition to check (continues while true)
   * @param block Callback that builds the loop body
   */
  repeatWhileBlock(condition: string, block: (builder: ScriptBuilder) => void): this {
    this.repeatWhile(condition);
    block(this as ScriptBuilder);
    return this.endrepeat();
  }

  /**
   * Repeat until condition is true with automatic block closing.
   * @param condition Condition to check (continues until true)
   * @param block Callback that builds the loop body
   */
  repeatUntilBlock(condition: string, block: (builder: ScriptBuilder) => void): this {
    this.repeatUntil(condition);
    block(this as ScriptBuilder);
    return this.endrepeat();
  }

  /**
   * Load an existing AppleScript into the builder, preserving its structure.
   * Parses the script to detect block structure (tell, if, repeat, etc.) and
   * maintains proper nesting so you can continue editing with the builder API.
   * @param script The AppleScript source code to load
   * @returns This builder instance for method chaining
   */
  loadFromScript(script: string): this {
    const lines = script.split('\n');

    for (const line of lines) {
      // Add the line as-is to preserve original formatting
      this.script.push(line);

      // Detect block structure to maintain proper nesting
      const trimmed = line.trim().toLowerCase();

      // Detect block starts and update block stack
      // Note: Inline tell statements like "tell application X to do Y" are single-line
      // and should NOT push a block. However, "tell X to tell Y" is a nested tell block.
      // An inline tell has ` to ` followed by a command, not another `tell`.
      const isInlineTell = / to (?!tell)/.test(trimmed);
      const isInlineIf = / then .+/.test(trimmed);
      if ((trimmed.startsWith('tell ') || /^tell application/.exec(trimmed)) && !isInlineTell) {
        const target = this.extractTarget(line);
        this.pushBlock('tell', target);
      } else if (trimmed.startsWith('if ') && !isInlineIf) {
        // Only push block for multi-line if (not inline "if x then y")
        this.pushBlock('if');
      } else if (
        trimmed.startsWith('repeat ') ||
        trimmed === 'repeat' ||
        trimmed.startsWith('repeat with ')
      ) {
        this.pushBlock('repeat');
      } else if (trimmed === 'try' || trimmed.startsWith('try ')) {
        this.pushBlock('try');
      } else if (trimmed.startsWith('on ') && !trimmed.startsWith('on error')) {
        // Only push 'on' block for handler definitions, not 'on error' in try blocks
        this.pushBlock('on');
      } else if (trimmed.startsWith('considering ')) {
        this.pushBlock('considering');
      } else if (trimmed.startsWith('ignoring ')) {
        this.pushBlock('ignoring');
      } else if (trimmed.startsWith('using ')) {
        this.pushBlock('using');
      } else if (trimmed.startsWith('with ')) {
        this.pushBlock('with');
      }
      // Detect block ends and update block stack
      else if (
        trimmed === 'end' ||
        trimmed === 'end tell' ||
        trimmed === 'end if' ||
        trimmed === 'end repeat' ||
        trimmed === 'end try' ||
        trimmed === 'end considering' ||
        trimmed === 'end ignoring' ||
        trimmed === 'end using' ||
        trimmed === 'end with' ||
        trimmed.startsWith('end ')
      ) {
        this.popBlock();
      }
    }

    return this;
  }

  /**
   * Helper method to extract the target from a tell statement.
   * @param line The tell statement line
   * @returns The extracted target or undefined
   */
  private extractTarget(line: string): string | undefined {
    const match = /tell\s+(?:application\s+)?"?([^"]+)"?/i.exec(line);
    return match ? match[1].trim() : undefined;
  }

  build(): string {
    this.validateBlockStack();
    return this.script.join('\n');
  }

  reset(): this {
    this.script = [];
    this.indentLevel = 0;
    this.blockStack = [];
    return this;
  }
}

/**
 * Create a new AppleScript builder.
 * Preferred entry point for the fluent API — equivalent to `new AppleScriptBuilder()`.
 *
 * @example
 * import { createScript, runScript } from 'applescript-node';
 * const script = createScript().tell('Finder').get('name of front window').endtell();
 * const result = await runScript(script);
 */
export const createScript = (): AppleScriptBuilder => new AppleScriptBuilder();
