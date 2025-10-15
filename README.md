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
- 🧪 **Well Tested**: 80+ tests with extensive coverage
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

### New Features

- **Error Handling**: Added `try()` and `onError()` methods for proper exception handling
- **Conditional Logic**: New `elseIf()` method for chained conditional statements
- **Loop Control**: Added `exitRepeat()` and `continueRepeat()` for loop flow control
- **Process Support**: New `tellProcess()` method for simplified System Events process commands
- **Builder Reusability**: Added `reset()` method to reuse builder instances

### Improvements

- **String Escaping**: Automatic escaping of quotes and backslashes in all string values
- **Block Tracking**: Fixed block stack tracking for `using()`, `with()`, and `try()` blocks
- **Enhanced Methods**: Improved fluent chaining for window and application methods
- **Test Coverage**: Expanded to 80+ tests with comprehensive coverage of new features

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

### Working with System Events Processes

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tellProcess('Finder').raw('set visible to false').end();

await runScript(script);
```

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
pnpm run example:list-apps # List running applications
pnpm run example:windows   # Window management
```

## API Reference

### Main Functions

- `runScript<T>(script: string | ScriptBuilder, options?: OsaScriptOptions): Promise<ScriptExecutionResult<T>>`
- `runScriptFile<T>(filePath: string, options?: OsaScriptOptions): Promise<ScriptExecutionResult<T>>`
- `createScript(): ScriptBuilder`
- `compileScript(script: string, options?: CompileOptions): Promise<CompileResult>`
- `compileScriptFile(filePath: string, options?: CompileOptions): Promise<CompileResult>`
- `getInstalledLanguages(): Promise<OsaLanguageInfo[]>`
- `getDefaultLanguage(): Promise<OsaLanguageInfo>`

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
