# applescript-node

A robust, type-safe Node.js library for executing AppleScript and JavaScript through macOS's `osascript` command.

## Features

- 🔒 **Type-safe**: Full TypeScript support with proper type definitions
- 🛠 **Fluent Builder API**: Intuitive script construction with method chaining
- 🚀 **Promise-based**: Modern async/await interface
- 🎯 **Error Handling**: Comprehensive error capture and reporting
- 📝 **File Support**: Execute scripts from files or strings
- 🔄 **Flexible Output**: Control output formatting and error redirection
- 🔨 **Script Compilation**: Compile scripts to `.scpt` or `.scptd` bundles
- 🗣 **Language Support**: Query available OSA languages and capabilities
- 🪟 **Window Management**: Comprehensive window control and manipulation
- 📱 **Application Control**: Advanced application management features
- 🧪 **Well Tested**: Extensive test coverage with Vitest
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

- `tell(target: string): ScriptBuilder`
- `end(): ScriptBuilder`
- `if(condition: string): ScriptBuilder`
- `then(): ScriptBuilder`
- `else(): ScriptBuilder`
- `repeat(times?: number): ScriptBuilder`
- `on(handlerName: string, parameters?: string[]): ScriptBuilder`

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
- `displayDialog(text: string, options?: DialogOptions): ScriptBuilder`
- `displayNotification(text: string, options?: NotificationOptions): ScriptBuilder`

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

1. Fork the repository
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

ISC
