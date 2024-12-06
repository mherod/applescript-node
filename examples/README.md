# applescript-node Examples

This directory contains example scripts demonstrating various features of the `applescript-node` library.

## Running Examples

Make sure you have the dependencies installed:

```bash
pnpm install
```

You can run examples using the provided npm scripts:

```bash
# Run all examples
pnpm run examples

# Run individual examples
pnpm run example:basic     # Basic script execution
pnpm run example:builder   # Fluent builder API
pnpm run example:compile   # Script compilation
pnpm run example:languages # Language information
```

Each example uses the correct TypeScript configuration and will run with proper module resolution.

## TypeScript Configuration

The examples have their own `tsconfig.json` that extends the root configuration. This setup:

- Allows importing from the library using the package name
- Maintains proper type checking
- Keeps example builds separate from the library

```typescript
// Import like you would in a real project
import { runScript, createScript } from 'applescript-node';
```

### Module Resolution

The examples use `tsconfig-paths` to resolve the `applescript-node` package name to the local source code. This means:

- You can write imports as if the package was installed from npm
- TypeScript will properly resolve types and provide IntelliSense
- No need to use relative paths in the examples
- The setup matches how end users will use the library

## Available Examples

### 1. Basic Script Execution (`basic-script.ts`)

Demonstrates basic script execution and type-safe results handling.

- Simple Finder commands
- Type-safe file information retrieval
- Error handling

### 2. Fluent Builder API (`fluent-builder.ts`)

Shows how to use the fluent builder API to construct complex scripts.

- System Events automation
- Multiple tell blocks
- Keyboard input simulation
- Dialog display

### 3. Script Compilation (`script-compilation.ts`)

Examples of compiling scripts to various formats.

- Compile to .scpt file
- Create stay-open applications
- Bundle scripts
- Execute compiled scripts

### 4. Language Information (`language-info.ts`)

Demonstrates the language information utilities.

- List installed OSA languages
- View language capabilities
- Get default language
- Display detailed information

## Output Directory

The `output` directory is used by the compilation examples to store compiled scripts and applications.

## Notes

- Some examples interact with the UI and file system. Make sure you understand what each script does before running it.
- Stay-open scripts will continue running until manually terminated.
- Some examples may require additional permissions (e.g., Accessibility access for System Events).
