# applescript-node

[![Test](https://github.com/mherod/applescript-node/actions/workflows/test.yml/badge.svg)](https://github.com/mherod/applescript-node/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/applescript-node.svg)](https://badge.fury.io/js/applescript-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)
[![Node Version](https://img.shields.io/node/v/applescript-node)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

A robust, type-safe Node.js library for executing AppleScript and JavaScript through macOS's `osascript` command.

## Requirements

- macOS (10.10 or later)
- Node.js (18.0.0 or later)
- TypeScript 5.0+ (for development)

## Features

- 🔒 **Type-safe**: Full TypeScript support with proper type definitions
- 🛠 **Fluent Builder API**: Intuitive script construction with method chaining
- 🚀 **Promise-based**: Modern async/await interface
- 🎯 **Error Handling**: Comprehensive error capture with try-catch support
- 🔁 **Loop Control**: Full support for repeat loops with exit and continue
- 🔀 **Conditional Logic**: If-elseIf-else chains with proper nesting
- 🔄 **Builder Reusability**: Reset and reuse builder instances
- 🛡️ **String Escaping**: Automatic escaping of quotes and special characters
- 📝 **File Support**: Execute scripts from files or strings
- 🔄 **Flexible Output**: Control output formatting and error redirection
- 🔨 **Script Compilation**: Compile scripts to `.scpt` or `.scptd` bundles
- 🗣 **Language Support**: Query available OSA languages and capabilities
- 🪟 **Window Management**: Comprehensive window control and manipulation
- 📱 **Application Control**: Advanced application management features
- 🔍 **Application Introspection**: Extract and parse scripting dictionaries (sdef) from any macOS app
- ✅ **Script Validation**: Runtime validation with intelligent error detection and suggestions
- 🧪 **Well Tested**: 189 tests with extensive coverage
- 🔍 **Static Analysis**: ESLint and Prettier integration

## Installation

```bash
# Using pnpm (recommended)
pnpm add applescript-node

# Using npm
npm install applescript-node

# Using yarn
yarn add applescript-node
```

## Quick Start

```typescript
import { runScript } from 'applescript-node';

// Execute a simple script
const result = await runScript('tell application "Finder" to get name of every disk');

if (result.success) {
  console.log('Disks:', result.output);
} else {
  console.error('Error:', result.error);
}
```

## Recent Improvements

### New Features (Latest)

- **Simplified Record Creation**: `setExpression()` and `setEndRaw()` now accept Record objects directly, eliminating the need for `createScript().makeRecordFrom()` wrapper
- **Smart Record Building**: New `setEndRecord()` method with automatic "of source" appending for ultra-clean syntax
  - Reduces boilerplate by 31% in common patterns
  - Two forms: source object shorthand or full expressions
  - Perfect for building lists of records from loops

### Previous Features

- **Error Handling**: Added `try()` and `onError()` methods for proper exception handling
- **Conditional Logic**: New `elseIf()` method for chained conditional statements
- **Loop Control**: Added `exitRepeat()` and `continueRepeat()` for loop flow control
- **Process Support**: New `tellProcess()` method for simplified System Events process commands
- **Builder Reusability**: Added `reset()` method to reuse builder instances

### Improvements

- **String Escaping**: Automatic escaping of quotes and backslashes in all string values
- **Block Tracking**: Fixed block stack tracking for `using()`, `with()`, and `try()` blocks
- **Enhanced Methods**: Improved fluent chaining for window and application methods
- **Test Coverage**: Expanded to 189 tests with comprehensive coverage of new features

## Usage Examples

### Using the Fluent Builder

```typescript
import { createScript, runScript } from 'applescript-node';

// Create a new text file and write some text
const script = createScript()
  .tell('System Events')
  // Press Cmd+N for new document
  .keystroke('n', ['command'])
  // Wait for window to open
  .delay(1)
  // Type some text
  .keystroke('Hello from applescript-node!')
  // Press Cmd+S to save
  .keystroke('s', ['command'])
  .delay(0.5)
  // Type filename
  .keystroke('example.txt')
  // Press return to save
  .keystroke('\r')
  .end();

const result = await runScript(script);
```

### Window Management

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .tell('Finder')
  // Get window info
  .raw('tell window "Downloads" to return {name, bounds}')
  .end();

const result = await runScript(script);

// Move and resize window
const moveAndResize = createScript()
  .tell('Finder')
  .moveWindow('Downloads', 100, 100)
  .resizeWindow('Downloads', 800, 600)
  .end();

await runScript(moveAndResize);
```

### Application Management

```typescript
import { createScript, runScript } from 'applescript-node';

// List all running applications
const script = createScript().tell('System Events').get('name of every process').end();

const result = await runScript(script);

if (result.success) {
  console.log('Running Applications:');
  console.log(
    result.output
      .split(',')
      .map((app) => `- ${app.trim()}`)
      .join('\n'),
  );
}
```

### Script Compilation

```typescript
import { compileScript, compileScriptFile } from 'applescript-node';

// Compile a script to a stay-open application
const script = `
on run
  display dialog "Script is running..."
end run

on idle
  display notification "Still alive!" with title "Stay-Open Script"
  return 60 -- Run idle handler every 60 seconds
end idle`;

const result = await compileScript(script, {
  outputPath: 'StayOpen.app',
  stayOpen: true,
  useStartupScreen: true,
});
```

### Type-Safe Results

```typescript
interface FileInfo {
  name: string;
  size: number;
}

const result = await runScript<FileInfo[]>(
  'tell application "Finder" to get {name, size} of every file of desktop',
);

if (result.success) {
  result.output.forEach((file) => {
    console.log(`${file.name}: ${file.size} bytes`);
  });
}
```

### Error Handling with Try-Catch

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .try()
  .tell('Finder')
  .raw('get name of window "NonExistentWindow"')
  .end()
  .onError('errorMessage')
  .displayDialog('An error occurred')
  .raw('log errorMessage')
  .end();

await runScript(script);
```

### Conditional Logic with elseIf

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .set('temperature', 75)
  .if('temperature > 80')
  .then()
  .displayDialog('Hot!')
  .elseIf('temperature > 60')
  .then()
  .displayDialog('Warm')
  .else()
  .displayDialog('Cold')
  .end();

await runScript(script);
```

### Loop Control

```typescript
import { createScript, runScript } from 'applescript-node';

// Exit loop early
const exitScript = createScript()
  .repeat(10)
  .set('counter', 'counter + 1')
  .if('counter = 5')
  .then()
  .exitRepeat()
  .end()
  .end();

// Skip iteration
const continueScript = createScript()
  .repeatWith('i', '{1, 2, 3, 4, 5}')
  .if('i = 3')
  .then()
  .continueRepeat()
  .end()
  .raw('log i')
  .end();
```

### Reusing Builder with reset()

```typescript
import { createScript, runScript } from 'applescript-node';

const builder = createScript();

// First script
builder.tell('Finder').activate().end();
const result1 = await runScript(builder.build());

// Reset and create a new script
builder.reset();
builder.tell('Safari').activate().end();
const result2 = await runScript(builder.build());
```

### Building Records from Variables (New!)

The builder now provides intuitive shorthand methods for creating AppleScript records from extracted properties, eliminating boilerplate code.

```typescript
import { createScript, runScript } from 'applescript-node';

// OLD WAY - verbose with temporary variables
const oldScript = createScript()
  .tell('Notes')
  .set('accountInfo', [])
  .repeatWith('acc', 'every account')
  .setExpression('accName', 'name of acc')
  .setExpression('accId', 'id of acc')
  .setExpression('noteCount', 'count of notes in acc')
  .setExpression('accRecord', {
    accountName: 'accName',
    accountId: 'accId',
    noteCount: 'noteCount',
  })
  .setEndRaw('accountInfo', 'accRecord')
  .end()
  .end();

// NEW WAY 1 - Direct expressions in setEndRecord
const newScript1 = createScript()
  .tell('Notes')
  .set('accountInfo', [])
  .repeatWith('acc', 'every account')
  .setEndRecord('accountInfo', {
    accountName: 'name of acc',
    accountId: 'id of acc',
    noteCount: 'count of notes in acc',
  })
  .end()
  .end();

// NEW WAY 2 - Automatic "of source" with setEndRecord
const newScript2 = createScript()
  .tell('Notes')
  .set('accountInfo', [])
  .repeatWith('acc', 'every account')
  .setEndRecord('accountInfo', 'acc', {
    accountName: 'name',
    accountId: 'id',
    noteCount: 'count of notes',
  })
  .end()
  .end();

const result = await runScript(newScript2);
```

**Benefits:**

- 31% fewer lines of code
- No temporary variables needed
- Direct property-to-record mapping
- More readable and maintainable

### Working with System Events Processes

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tellProcess('Finder').raw('set visible to false').end();

await runScript(script);
```

### Application Introspection with sdef

The library provides comprehensive support for extracting and parsing application scripting dictionaries (sdef files). This enables runtime discovery of application capabilities, validation, and documentation generation.

```typescript
import {
  getApplicationDictionary,
  getAllCommands,
  getAllClasses,
  findCommand,
  findClass,
} from 'applescript-node';

// Get the scripting dictionary for Messages.app
const dictionary = await getApplicationDictionary('/System/Applications/Messages.app');

// Explore available commands
const commands = getAllCommands(dictionary);
console.log(`Found ${commands.length} commands`);

// Find a specific command
const sendCommand = findCommand(dictionary, 'send');
if (sendCommand) {
  console.log('Send command parameters:', sendCommand.parameters);
  console.log('Return type:', sendCommand.result?.type);
}

// Explore available classes
const classes = getAllClasses(dictionary);
console.log(`Found ${classes.length} classes`);

// Find a specific class
const chatClass = findClass(dictionary, 'chat');
if (chatClass) {
  console.log(
    'Chat properties:',
    chatClass.properties.map((p) => p.name),
  );
  console.log(
    'Chat elements:',
    chatClass.elements.map((e) => e.type),
  );
}

// Iterate through suites
for (const suite of dictionary.suites) {
  console.log(`Suite: ${suite.name}`);
  console.log(`  Commands: ${suite.commands.length}`);
  console.log(`  Classes: ${suite.classes.length}`);
  console.log(`  Enumerations: ${suite.enumerations.length}`);
}
```

#### Caching

The `getApplicationDictionary` function automatically caches parsed dictionaries for performance:

```typescript
// First call - parses the sdef
const dict1 = await getApplicationDictionary('/System/Applications/Messages.app');

// Second call - returns cached result (fast!)
const dict2 = await getApplicationDictionary('/System/Applications/Messages.app');

// Bypass cache if needed
const dict3 = await getApplicationDictionary('/System/Applications/Messages.app', false);

// Clear the cache
import { clearSdefCache } from 'applescript-node';
clearSdefCache();
```

#### Direct sdef Access

You can also work with raw sdef XML:

```typescript
import { getSdef, parseSdef } from 'applescript-node';

// Extract raw sdef XML
const xml = await getSdef('/System/Applications/Music.app');
console.log(xml);

// Parse sdef XML manually
const dictionary = parseSdef(xml);
```

#### Use Cases

**Runtime Validation**

```typescript
const dictionary = await getApplicationDictionary('/System/Applications/Messages.app');
const sendCommand = findCommand(dictionary, 'send');

if (!sendCommand) {
  throw new Error('Messages.app does not support the send command');
}

// Validate parameter types before building script
console.log(
  'Required parameters:',
  sendCommand.parameters.filter((p) => !p.optional),
);
```

**Documentation Generation**

```typescript
const dictionary = await getApplicationDictionary('/System/Applications/Music.app');

for (const suite of dictionary.suites) {
  console.log(`\n## ${suite.name}\n`);
  console.log(suite.description);

  for (const command of suite.commands) {
    console.log(`\n### ${command.name}`);
    console.log(command.description);
    console.log('Parameters:');
    command.parameters.forEach((param) => {
      console.log(`- ${param.name} (${param.type.type})${param.optional ? ' [optional]' : ''}`);
    });
  }
}
```

**Discovery and Exploration**

```typescript
// Find all applications that support a specific command
const apps = [
  '/System/Applications/Messages.app',
  '/System/Applications/Mail.app',
  '/System/Applications/Music.app',
];

for (const appPath of apps) {
  try {
    const dict = await getApplicationDictionary(appPath);
    const hasCommand = findCommand(dict, 'send');
    if (hasCommand) {
      console.log(`${appPath.split('/').pop()} supports 'send' command`);
    }
  } catch (error) {
    // App doesn't have scripting support
  }
}
```

### Script Validation

The library provides powerful runtime script validation using application scripting dictionaries. Validate your scripts before execution to catch errors early and get helpful suggestions.

```typescript
import { ScriptValidator, createScript } from 'applescript-node';

// Create a validator for Messages.app
const validator = await ScriptValidator.forApplication('/System/Applications/Messages.app');

// Build a script
const script = createScript().tell('Messages').raw('send "Hello" to "+1234567890"').end();

// Validate before execution
const result = validator.validate(script.build());

if (!result.valid) {
  console.log('Validation errors:');
  result.errors.forEach((err) => {
    console.log(`- ${err.message}`);
    if (err.suggestion) {
      console.log(`  Suggestion: ${err.suggestion}`);
    }
  });
}
```

#### Validation Features

**Command Validation**
Detects unknown commands and suggests corrections:

```typescript
const script = `
  tell application "Messages"
    sen "Hello"  // Typo: should be "send"
  end tell
`;

const result = validator.validate(script, { provideSuggestions: true });
// Warning: Command 'sen' might not exist in Messages
// Suggestion: Did you mean 'send'?
```

**Property Access Validation**
Prevents writes to read-only properties:

```typescript
const issues = validator.validatePropertyAccess('chat', 'id', 'write');
// Error: Property 'id' is read-only on class 'chat'
```

**Parameter Validation**
Ensures required parameters are provided:

```typescript
const issues = validator.validateCommand('send', {});
// Error: Required parameter 'to' is missing for command 'send'
```

#### Validation Options

```typescript
interface ValidationOptions {
  strictness?: 'strict' | 'normal' | 'lenient';
  provideSuggestions?: boolean;
}

// Strict mode: warnings treated as errors
const strictResult = validator.validate(script, { strictness: 'strict' });

// Lenient mode: only report errors
const lenientResult = validator.validate(script, { strictness: 'lenient' });

// Disable suggestions for faster validation
const fastResult = validator.validate(script, { provideSuggestions: false });
```

#### Validation Result Structure

```typescript
interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string;
  suggestion?: string;
  line?: number;
  column?: number;
}
```

#### Quick Validation Helper

For simple validation without creating a validator instance:

```typescript
import { validateScript } from 'applescript-node';

const result = await validateScript(myScript, '/System/Applications/Messages.app', {
  strictness: 'normal',
});
```

#### Validation Benefits

- **Catch errors early**: Find issues before script execution
- **Better error messages**: Get specific feedback about what's wrong
- **Helpful suggestions**: Receive "did you mean?" suggestions for typos
- **Type safety**: Verify property access levels and parameter types
- **Faster development**: Less trial-and-error debugging

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/applescript-node.git
cd applescript-node

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

### Available Scripts

- `pnpm build` - Build the project
- `pnpm dev` - Watch mode development build
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm lint` - Run ESLint
- `pnpm format` - Run Prettier
- `pnpm examples` - Run all example scripts

### Running Examples

The project includes several example scripts demonstrating various features:

```bash
pnpm run example:basic     # Basic script execution
pnpm run example:builder   # Fluent builder API
pnpm run example:compile   # Script compilation
pnpm run example:languages # Language information
pnpm run example:list-apps  # List running applications
pnpm run example:windows    # Window management
pnpm run example:sdef       # Application introspection with sdef
pnpm run example:validation # Script validation with sdef
pnpm run example:messages   # Messages app automation
```

## API Reference

### Main Functions

#### Script Execution

- `runScript<T>(script: string | ScriptBuilder, options?: OsaScriptOptions): Promise<ScriptExecutionResult<T>>`
- `runScriptFile<T>(filePath: string, options?: OsaScriptOptions): Promise<ScriptExecutionResult<T>>`
- `createScript(): ScriptBuilder`

#### Script Compilation

- `compileScript(script: string, options?: CompileOptions): Promise<CompileResult>`
- `compileScriptFile(filePath: string, options?: CompileOptions): Promise<CompileResult>`

#### Language Information

- `getInstalledLanguages(): Promise<OsaLanguageInfo[]>`
- `getDefaultLanguage(): Promise<OsaLanguageInfo>`

#### Application Introspection (sdef)

- `getApplicationDictionary(appPath: string, useCache?: boolean): Promise<ApplicationDictionary>` - Get and parse application scripting dictionary
- `getSdef(appPath: string): Promise<string>` - Extract raw sdef XML from application
- `parseSdef(xml: string): ApplicationDictionary` - Parse sdef XML into structured types
- `clearSdefCache(): void` - Clear the sdef cache
- `getAllCommands(dictionary: ApplicationDictionary): Command[]` - Get all commands from all suites
- `getAllClasses(dictionary: ApplicationDictionary): Class[]` - Get all classes from all suites
- `findCommand(dictionary: ApplicationDictionary, commandName: string): Command | undefined` - Find a specific command
- `findClass(dictionary: ApplicationDictionary, className: string): Class | undefined` - Find a specific class

#### Script Validation

- `ScriptValidator.forApplication(appPath: string): Promise<ScriptValidator>` - Create a validator for an application
- `validator.validate(script: string, options?: ValidationOptions): ValidationResult` - Validate a script
- `validator.validateCommand(commandName: string, parameters?: Record<string, unknown>): ValidationIssue[]` - Validate a command and its parameters
- `validator.validatePropertyAccess(className: string, propertyName: string, accessType: 'read' | 'write'): ValidationIssue[]` - Validate property access
- `validator.getAvailableCommands(): Command[]` - Get all available commands
- `validator.getAvailableClasses(): Class[]` - Get all available classes
- `validateScript(script: string, appPath: string, options?: ValidationOptions): Promise<ValidationResult>` - Quick validation helper

### ScriptBuilder Methods

The ScriptBuilder provides a rich set of methods for constructing AppleScript commands:

#### Core Language Constructs

- `tell(target: string): ScriptBuilder` - Tell an application to execute commands
- `tellProcess(processName: string): ScriptBuilder` - Tell a System Events process
- `end(): ScriptBuilder` - End the current block
- `if(condition: string): ScriptBuilder` - Start conditional block
- `then(): ScriptBuilder` - Then clause for if statements
- `else(): ScriptBuilder` - Else clause for if statements
- `elseIf(condition: string): ScriptBuilder` - Else-if clause for chained conditions
- `repeat(times?: number): ScriptBuilder` - Repeat loop
- `repeatWith(variable: string, list: string): ScriptBuilder` - Repeat with loop
- `repeatUntil(condition: string): ScriptBuilder` - Repeat until loop
- `repeatWhile(condition: string): ScriptBuilder` - Repeat while loop
- `exitRepeat(): ScriptBuilder` - Exit from repeat loop
- `continueRepeat(): ScriptBuilder` - Continue to next iteration
- `try(): ScriptBuilder` - Start try-catch block
- `onError(variableName?: string): ScriptBuilder` - Error handler for try blocks
- `on(handlerName: string, parameters?: string[]): ScriptBuilder` - Define handler
- `using(terms: string[]): ScriptBuilder` - Using terms block
- `with(timeout?: number, transaction?: boolean): ScriptBuilder` - With timeout/transaction
- `considering(attributes: string[]): ScriptBuilder` - Considering block
- `ignoring(attributes: string[]): ScriptBuilder` - Ignoring block

#### Application Control

- `activate(): ScriptBuilder`
- `quit(): ScriptBuilder`
- `launch(): ScriptBuilder`
- `running(): ScriptBuilder`
- `getRunningApplications(): ScriptBuilder`
- `getFrontmostApplication(): ScriptBuilder`

#### Window Management

- `closeWindow(window?: string): ScriptBuilder`
- `minimizeWindow(window?: string): ScriptBuilder`
- `zoomWindow(window?: string): ScriptBuilder`
- `moveWindow(appName: string, windowName: string, x: number, y: number): ScriptBuilder`
- `resizeWindow(appName: string, windowName: string, width: number, height: number): ScriptBuilder`

#### UI Interaction

- `click(target: string): ScriptBuilder`
- `keystroke(text: string, modifiers?: string[]): ScriptBuilder`
- `delay(seconds: number): ScriptBuilder`
- `pressKey(key: string, modifiers?: Array<'command' | 'option' | 'control' | 'shift'>): ScriptBuilder`
- `pressKeyCode(keyCode: number, modifiers?: Array<'command' | 'option' | 'control' | 'shift'>): ScriptBuilder`
- `typeText(text: string): ScriptBuilder`
- `clickButton(buttonName: string): ScriptBuilder`
- `clickMenuItem(menuName: string, itemName: string): ScriptBuilder`
- `displayDialog(text: string, options?: DialogOptions): ScriptBuilder`
- `displayNotification(text: string, options?: NotificationOptions): ScriptBuilder`

#### Variables and Properties

- `set(variable: string, value: AppleScriptValue): ScriptBuilder`
- `setExpression(variable: string, expression: string | Record<string, string>): ScriptBuilder` - Set variable to expression or record
- `setEndRaw(variable: string, expression: string | Record<string, string>): ScriptBuilder` - Append expression or record to list
- `setEndRecord(listVariable: string, sourceOrExpressions: string | Record<string, string>, propertyMap?: Record<string, string>): ScriptBuilder` - Shorthand for appending records to lists
  - Form 1: `setEndRecord(list, source, {key: 'property'})` - Automatically appends "of source"
  - Form 2: `setEndRecord(list, {key: 'full expression'})` - Uses expressions as-is
- `get(property: string): ScriptBuilder`
- `copy(value: AppleScriptValue, to: string): ScriptBuilder`
- `count(items: string): ScriptBuilder`
- `exists(item: string): ScriptBuilder`

#### Utility Methods

- `raw(script: string): ScriptBuilder` - Insert raw AppleScript code
- `build(): string` - Build the final script
- `reset(): ScriptBuilder` - Reset builder state for reuse

### Configuration Types

```typescript
type OsaScriptOptions = {
  language?: 'AppleScript' | 'JavaScript';
  humanReadable?: boolean;
  errorToStdout?: boolean;
};

type CompileOptions = {
  language?: 'AppleScript' | 'JavaScript';
  executeOnly?: boolean;
  stayOpen?: boolean;
  useStartupScreen?: boolean;
  outputPath?: string;
  bundleScript?: boolean;
};

interface OsaLanguageInfo {
  name: string;
  subtype: string;
  manufacturer: string;
  capabilities: {
    compiling: boolean;
    sourceData: boolean;
    coercion: boolean;
    eventHandling: boolean;
    recording: boolean;
    convenience: boolean;
    dialects: boolean;
    appleEvents: boolean;
  };
  description?: string;
}

// Application dictionary types (sdef)
interface ApplicationDictionary {
  suites: Suite[];
}

interface Suite {
  name: string;
  code: string;
  description?: string;
  classes: Class[];
  commands: Command[];
  enumerations: Enumeration[];
}

interface Class {
  name: string;
  code: string;
  description?: string;
  plural?: string;
  inherits?: string;
  properties: Property[];
  elements: Element[];
}

interface Command {
  name: string;
  code: string;
  description?: string;
  directParameter?: TypeInfo & { description?: string };
  parameters: Parameter[];
  result?: TypeInfo & { description?: string };
}

interface Property {
  name: string;
  code: string;
  type: TypeInfo;
  access: 'r' | 'rw';
  description?: string;
}

interface TypeInfo {
  type: string;
  list?: boolean;
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository from [mherod/applescript-node](https://github.com/mherod/applescript-node)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the test suite (`pnpm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Maintain type safety
- Follow the existing code style
- Update documentation for significant changes
- Add examples for new features

## License

MIT
