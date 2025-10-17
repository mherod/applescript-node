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
- 🧪 **Well Tested**: 366 tests with extensive coverage
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

### High-Level API (Recommended)

The easiest way to get started is with our high-level data source APIs:

```typescript
import { sources } from 'applescript-node';

// Get system information
const info = await sources.system.getInfo();
console.log(`Computer: ${info.computerName}, OS: ${info.osVersion}`);

// Get all open windows
const windows = await sources.windows.getAll();
console.log(`Found ${windows.length} open windows`);

// Get running applications
const apps = await sources.applications.getAll();
apps.forEach((app) => console.log(`- ${app.name} (${app.windowCount} windows)`));
```

### Builder API (Advanced)

For custom scripts, use the fluent builder with callback syntax:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tellApp('Finder', (finder) => finder.get('name of every disk'));

const result = await runScript(script);
if (result.success) {
  console.log('Disks:', result.output);
}
```

## Recent Improvements

### New Features (Latest)

- **Conditional Assignment with setIfExists**: New `setIfExists()` and `setEndIfExists()` methods for clean optional property handling
  - Simplifies "check if exists, convert type, or use default" pattern
  - More semantic and readable than `setTernary` for existence checks
  - Built-in type conversion support via `asType` parameter
  - Reduces boilerplate when handling optional fields
  - Perfect for extracting data from macOS applications with optional properties
- **Ultra-Shorthand Collection Mapping with Field Transformations**: Enhanced `mapToJson()` method with `PropertyExtractor` support
  - **Field-level transformations**: `firstOf` for multi-value fields, `ifExists` for optional properties
  - **Backward compatible**: Simple string properties still work as before
  - Reduces ~40 lines of collection mapping code to a single method call (62.5% reduction)
  - Handles initialization, iteration, property extraction, field transformations, error handling, and JSON conversion
  - Supports limit, until, while, and skipErrors options
  - Perfect for extracting structured data from macOS applications with complex field requirements
  - Example: Extract contacts with first email/phone and optional birthday in one call
- **Smart Property Picking**: New `pickEndRecord()` method with intelligent expression detection
  - Automatically detects simple properties vs complex expressions
  - Simple properties get "of source" appended automatically
  - Complex expressions (with "of", "as", "where", etc.) used as-is
  - Eliminates manual expression construction
- **Type-Safe Expressions**: All condition methods now accept ExprBuilder for compile-time type safety
  - Autocomplete support for comparison operators (gt, lt, gte, lte, eq, ne)
  - String operations (contains, startsWith, endsWith, length)
  - Logical operators (and, or, not) for composing complex conditions
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

Callback-style syntax provides clean scoping for complex scripts:

```typescript
import { createScript, runScript } from 'applescript-node';

// Create a new text file and write some text
const script = createScript().tellApp('System Events', (app) =>
  app
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
    .keystroke('\r'),
);

const result = await runScript(script);
```

### Window Management

High-level API for easy window queries:

```typescript
import { sources } from 'applescript-node';

// Get all windows across all applications
const allWindows = await sources.windows.getAll();
console.log(`Found ${allWindows.length} open windows`);

// Get windows for a specific app
const safariWindows = await sources.windows.getByApp('Safari');
safariWindows.forEach((win) => {
  console.log(`- ${win.name}: ${win.bounds.width}x${win.bounds.height}`);
});

// Get the currently focused window
const frontmost = await sources.windows.getFrontmost();
if (frontmost) {
  console.log(`Active: ${frontmost.name} (${frontmost.app})`);
}

// Get window counts by app
const counts = await sources.windows.getCountByApp();
console.log('Windows per app:', counts);
```

For custom window operations, use the builder API:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tellApp('Finder', (finder) =>
  finder.moveWindow('Downloads', 100, 100).resizeWindow('Downloads', 800, 600),
);

await runScript(script);
```

### Application Management

High-level API for application queries and control:

```typescript
import { sources } from 'applescript-node';

// Get all running applications
const apps = await sources.applications.getAll();
console.log('Running Applications:');
apps.forEach((app) => {
  console.log(`- ${app.name} (PID: ${app.pid}, Windows: ${app.windowCount})`);
});

// Get the frontmost (active) application
const frontmost = await sources.applications.getFrontmost();
console.log(`Active app: ${frontmost.name}`);

// Check if an app is running
const isRunning = await sources.applications.isRunning('Safari');
console.log(`Safari running: ${isRunning}`);

// Get specific app info
const safari = await sources.applications.getByName('Safari');
if (safari) {
  console.log(`Safari bundle ID: ${safari.bundleId}`);
}

// Control applications
await sources.applications.activate('Finder');
await sources.applications.hide('Safari');
await sources.applications.quit('TextEdit');
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

Callback-style `tryCatch` helper automatically manages block scoping:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript().tryCatchError(
  (try_) =>
    try_.tellApp('Finder', (finder) => finder.raw('get name of window "NonExistentWindow"')),
  'errorMessage',
  (catch_) => catch_.displayDialog('An error occurred').raw('log errorMessage'),
);

await runScript(script);
```

For simpler cases without error capture:

```typescript
const script = createScript().tryCatch(
  (try_) => try_.tellApp('Notes', (notes) => notes.raw('get name of first note')),
  (catch_) => catch_.displayDialog('Could not access notes'),
);
```

### Conditional Logic with ifThenElse

Callback-style helpers with ExprBuilder for type-safe conditions:

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .set('temperature', 75)
  .ifThenElse(
    (e) => e.gt('temperature', 80),
    (then_) => then_.displayDialog('Hot!'),
    (else_) =>
      else_.ifThenElse(
        (e) => e.gt('temperature', 60),
        (then_) => then_.displayDialog('Warm'),
        (else_) => else_.displayDialog('Cold'),
      ),
  );

await runScript(script);
```

For simple if-then cases:

```typescript
const script = createScript()
  .set('counter', 10)
  .ifThen(
    (e) => e.gt('counter', 5),
    (then_) => then_.displayDialog('Counter is greater than 5'),
  );
```

String-based conditions are also supported:

```typescript
const script = createScript().ifThenElse(
  'temperature > 80',
  (then_) => then_.displayDialog('Hot!'),
  (else_) => else_.displayDialog('Not hot'),
);
```

### Conditional Assignment with setIfExists

The `setIfExists()` and `setEndIfExists()` methods simplify the common pattern of checking if a property exists, optionally converting its type, and using a default value if it doesn't exist.

```typescript
import { createScript, runScript } from 'applescript-node';

// Common pattern: handle optional properties with type conversion
const script = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  // Check if birth date exists, convert to string, or use default
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .end()
  .end();

await runScript(script);
```

**Comparison - Old vs New Approach:**

```typescript
// OLD WAY: Using setTernary (verbose - 6 lines)
const oldScript = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  .setTernary(
    'personBirthday',
    (e) => e.exists(e.property('aPerson', 'birth date')),
    (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
    'missing value',
  )
  .end()
  .end();

// NEW WAY: Using setIfExists (concise - 5 lines, clearer intent)
const newScript = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .end()
  .end();
```

**Appending to Lists with setEndIfExists:**

```typescript
// Build a list with conditional values
const script = createScript()
  .tell('Notes')
  .set('datesList', [])
  .repeatWith('aNote', 'every note')
  // Append to list only if property exists, with type conversion
  .setEndIfExists(
    'datesList',
    (e) => e.property('aNote', 'creation date'),
    'missing value',
    'string',
  )
  .end()
  .end();
```

**Handling Multiple Optional Fields:**

```typescript
const script = createScript()
  .tell('Contacts')
  .set('contactsList', [])
  .repeatWith('aPerson', 'every person')
  // Handle multiple optional fields
  .setIfExists('personEmail', (e) => e.property('aPerson', 'email'), 'missing value')
  .setIfExists('personPhone', (e) => e.property('aPerson', 'phone'), 'missing value')
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  // Build record from the variables
  .setEndRecord('contactsList', {
    name: 'name of aPerson',
    email: 'personEmail',
    phone: 'personPhone',
    birthday: 'personBirthday',
  })
  .end()
  .end();
```

**Method Signatures:**

```typescript
// Set variable if property exists, with optional type conversion
setIfExists(
  variable: string,
  property: string | ((e: ExprBuilder) => string),
  defaultValue?: string | ((e: ExprBuilder) => string),
  asType?: string,
): ScriptBuilder;

// Append to list if property exists, with optional type conversion
setEndIfExists(
  listVariable: string,
  property: string | ((e: ExprBuilder) => string),
  defaultValue?: string | ((e: ExprBuilder) => string),
  asType?: string,
): ScriptBuilder;
```

**Benefits:**

- More readable and self-documenting than `setTernary`
- Built-in type conversion support via `asType` parameter
- Consistent default value handling
- Type-safe with ExprBuilder support
- Integrates seamlessly with other builder methods
- Generates proper if-then-else blocks under the hood

### Loop Control

Callback-style `forEach` with conditional exit:

```typescript
import { createScript, runScript } from 'applescript-node';

// Exit loop early with ExprBuilder
const exitScript = createScript()
  .set('counter', 0)
  .repeat(10, (loop) =>
    loop.set('counter', 'counter + 1').ifThen(
      (e) => e.eq('counter', 5),
      (then_) => then_.exitRepeat(),
    ),
  );

// Iterate with forEach callback
const script = createScript()
  .set('results', [])
  .forEach('i', '{1, 2, 3, 4, 5}', (loop) =>
    loop.ifThenElse(
      (e) => e.eq('i', 3),
      (then_) => then_.continueRepeat(),
      (else_) => else_.setEndRaw('results', 'i'),
    ),
  );

await runScript(script);
```

Using `forEachUntil` for conditional iteration:

```typescript
const script = createScript()
  .set('found', 'false')
  .forEachUntil(
    'item',
    'every file of desktop',
    (e) => e.eq('found', 'true'),
    (loop) =>
      loop.ifThen(
        (e) => e.contains('name of item', '"important"'),
        (then_) => then_.set('found', 'true'),
      ),
  );
```

### Reusing Builder with reset()

```typescript
import { createScript, runScript } from 'applescript-node';

const builder = createScript();

// First script with explicit ending
builder.tellApp('Finder', (app) => app.activate());
const result1 = await runScript(builder.build());

// Reset and create a new script
builder.reset();
builder.tellApp('Safari', (app) => app.activate());
const result2 = await runScript(builder.build());
```

Explicit block endings for manual block management:

```typescript
// Using explicit endtell() for clarity
const script = createScript().tell('Finder').activate().endtell(); // Explicit ending - more readable than .end()
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

### Smart Property Picking with pickEndRecord()

The `pickEndRecord()` method intelligently detects whether properties are simple names or complex expressions, automatically appending "of source" only when needed.

```typescript
import { createScript, runScript } from 'applescript-node';

const script = createScript()
  .tell('Notes')
  .set('notesList', [])
  .repeatWith('aNote', 'every note')
  .pickEndRecord('notesList', 'aNote', {
    // Simple properties - automatically get "of aNote" appended
    id: 'id',
    name: 'name',
    shared: 'shared',
    // Complex expressions - used as-is (detected by keywords like "of", "as", "where")
    created: 'creation date of aNote as string',
    preview: 'text 1 thru 100 of body',
    participantCount: 'count of participants',
  })
  .end()
  .end();

await runScript(script);
```

**Smart Detection Rules:**

The method detects complex expressions by checking for AppleScript keywords:

- Property access: `of`, `'s`
- Type casting: `as`
- Filtering: `where`, `whose`
- Ranges: `thru`, `through`
- Collections: `every`, `some`, `first`, `last`
- Functions: `count`, `length`
- String operations: `contains`, `begins with`, `ends with`

**Benefits:**

- No need to manually write "of source" for every property
- Prevents double-appending errors
- Self-documenting code - clear which are simple properties vs expressions
- Type-safe with full TypeScript support

### Ultra-Shorthand Collection to JSON with mapToJson()

The `mapToJson()` method is the ultimate shorthand for the common pattern of iterating over a collection, extracting properties, and converting to JSON.

#### Basic Usage with Simple Properties

```typescript
import { createScript, runScript } from 'applescript-node';

// Extract first 10 notes as JSON with automatic error handling
const script = createScript()
  .tell('Notes')
  .mapToJson(
    'aNote',
    'every note',
    {
      id: 'id',
      name: 'name',
      content: 'plaintext',
      created: 'creation date of aNote as string',
      modified: 'modification date of aNote as string',
      shared: 'shared',
      passwordProtected: 'password protected',
    },
    { limit: 10, skipErrors: true },
  )
  .endtell()
  .build();

const result = await runScript<
  Array<{
    id: string;
    name: string;
    content: string;
    created: string;
    modified: string;
    shared: boolean;
    passwordProtected: boolean;
  }>
>(script);

if (result.success) {
  const notes = JSON.parse(result.output);
  console.log(`Retrieved ${notes.length} notes`);
  notes.forEach((note) => console.log(`- ${note.name}`));
}
```

#### Advanced Field Transformations with PropertyExtractor

The enhanced `mapToJson()` now supports field-level transformations using `PropertyExtractor` objects. This eliminates the need for manual property extraction and conditional logic.

**PropertyExtractor Interface:**

```typescript
interface PropertyExtractor {
  property: string | ((e: ExprBuilder) => string);
  firstOf?: boolean; // Get first item from collection or default
  ifExists?: boolean; // Check if property exists before accessing
  asType?: string; // Convert property to specified type
  default?: string | ((e: ExprBuilder) => string); // Default value
}
```

**Example: Extracting Contacts with Optional Fields**

```typescript
import { createScript, runScript } from 'applescript-node';

// Extract contacts with smart handling of optional/multi-value fields
const contactsScript = createScript()
  .tell('Contacts')
  .mapToJson(
    'aPerson',
    'every person',
    {
      // Simple properties (used as-is)
      id: 'id',
      name: 'name',
      firstName: 'first name',
      lastName: 'last name',
      organization: 'organization',
      jobTitle: 'job title',

      // PropertyExtractor: Get first email or default to missing value
      email: {
        property: (e) => e.property('aPerson', 'emails'),
        firstOf: true,
      },

      // PropertyExtractor: Get first phone with string property syntax
      phone: {
        property: 'phones',
        firstOf: true,
      },

      // PropertyExtractor: Check if birthday exists and convert to string
      birthday: {
        property: 'birth date',
        ifExists: true,
        asType: 'string',
      },

      isCompany: 'company',
    },
    { limit: 50, skipErrors: true },
  )
  .endtell();

const result = await runScript(contactsScript);
if (result.success) {
  const contacts = result.output; // Automatically parsed as JSON
  console.log(`Retrieved ${contacts.length} contacts`);
}
```

**What This Does Behind the Scenes:**

For fields with `PropertyExtractor`:

1. **firstOf**: Generates code to check if collection has items, gets first item's value, or uses default
2. **ifExists**: Generates code to check if property exists before accessing, with optional type conversion
3. Stores transformed values in temporary variables
4. Uses temp variables in final record construction

**Comparison - Before vs After:**

```typescript
// BEFORE: Manual extraction (~40 lines)
const oldScript = createScript()
  .tell('Contacts')
  .set('contactsList', [])
  .set('counter', 0)
  .forEachUntil(
    'aPerson',
    'every person',
    (e) => e.gt('counter', 50),
    (b) =>
      b.increment('counter').tryCatch(
        (tryBlock) =>
          tryBlock
            // Manual firstOf for email
            .setFirstOf('personEmail', (e) => e.property('aPerson', 'emails'), 'missing value')
            // Manual firstOf for phone
            .setFirstOf('personPhone', (e) => e.property('aPerson', 'phones'), 'missing value')
            // Manual ifExists for birthday
            .setIfExists(
              'personBirthday',
              (e) => e.property('aPerson', 'birth date'),
              'missing value',
              'string',
            )
            // Build record manually
            .setEndRecord('contactsList', {
              id: 'id of aPerson',
              name: 'name of aPerson',
              email: 'personEmail',
              phone: 'personPhone',
              birthday: 'personBirthday',
              // ... more fields
            }),
        (catchBlock) => catchBlock.comment('Skip contacts with errors'),
      ),
  )
  .returnAsJson('contactsList', {
    /* all field mappings */
  })
  .endtell();

// AFTER: PropertyExtractor (~15 lines - 62.5% reduction!)
const newScript = createScript()
  .tell('Contacts')
  .mapToJson(
    'aPerson',
    'every person',
    {
      id: 'id',
      name: 'name',
      email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
      phone: { property: 'phones', firstOf: true },
      birthday: { property: 'birth date', ifExists: true, asType: 'string' },
      // ... more fields
    },
    { limit: 50, skipErrors: true },
  )
  .endtell();
```

**Advanced Options:**

```typescript
// Limit number of items
.mapToJson('item', 'collection', { prop: 'value' }, { limit: 50 })

// Conditional iteration with ExprBuilder
.mapToJson('item', 'collection', { prop: 'value' }, {
  until: (e) => e.gt('counter', 100)
})

// String-based conditions
.mapToJson('item', 'collection', { prop: 'value' }, {
  until: 'found = true'
})

// While conditions
.mapToJson('item', 'collection', { prop: 'value' }, {
  while: (e) => e.lt('counter', 50)
})

// Disable error handling for better performance (if you trust the data)
.mapToJson('item', 'collection', { prop: 'value' }, {
  skipErrors: false
})

// No options - collect everything
.mapToJson('item', 'collection', { prop: 'value' })
```

**What It Does Behind the Scenes:**

The single `mapToJson()` call expands to approximately 30 lines of AppleScript:

1. Creates temporary collection list
2. Sets up counter (if limit specified)
3. Iterates with repeat loop
4. Adds exit condition (if limit/until/while specified)
5. Wraps in try-catch (if skipErrors enabled)
6. Uses `pickEndRecord()` for smart property extraction
7. Generates JSON helper functions (escapeJsonString, valueToJson, etc.)
8. Converts records to JSON objects
9. Returns properly formatted JSON array

**Real-World Example - Messages.app:**

```typescript
// Extract recent chats with participant info
const chatsScript = createScript()
  .tell('Messages')
  .mapToJson(
    'aChat',
    'every chat',
    {
      id: 'id',
      displayName: 'name',
      participants: 'count of participants',
      lastMessage: 'text of last message',
    },
    { limit: 20, skipErrors: true },
  )
  .endtell();

const result = await runScript(chatsScript);
const chats = JSON.parse(result.output);
```

**Benefits:**

- **~97% code reduction**: From ~30 lines to 1 method call
- **Automatic JSON handling**: No manual string escaping or formatting
- **Robust error handling**: Skip problematic items without crashing
- **Flexible iteration**: Limit, conditional loops, early exit
- **Type-safe**: Full TypeScript support for input and output
- **Performance**: Built-in optimizations like counter-based limits

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
pnpm run example:basic             # Basic script execution
pnpm run example:builder           # Fluent builder API
pnpm run example:compile           # Script compilation
pnpm run example:languages         # Language information
pnpm run example:list-apps         # List running applications
pnpm run example:windows           # Window management
pnpm run example:sdef              # Application introspection with sdef
pnpm run example:validation        # Script validation with sdef
pnpm run example:messages          # Messages app automation
pnpm run example:ternary           # Ternary-style conditional assignment
pnpm run example:if-exists         # If-exists pattern for optional properties
pnpm run example:first-or-default  # First-or-default pattern demo
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
- `pickEndRecord(listVariable: string, sourceObject: string, propertyMap: Record<string, string>): ScriptBuilder` - Smart property picking with automatic expression detection
  - Detects simple properties vs complex expressions based on AppleScript keywords
  - Simple properties automatically get "of source" appended
  - Complex expressions (with "of", "as", "where", etc.) used as-is
- `setIfExists(variable: string, property: string | ExprBuilder, defaultValue?: string | ExprBuilder, asType?: string): ScriptBuilder` - Set variable if property exists, with optional type conversion
  - Checks if property exists, converts to type (if specified), or uses default value
  - More semantic than `setTernary` for existence checks
- `setEndIfExists(listVariable: string, property: string | ExprBuilder, defaultValue?: string | ExprBuilder, asType?: string): ScriptBuilder` - Append to list if property exists, with optional type conversion
  - Same as `setIfExists` but appends to list instead of setting variable
- `get(property: string): ScriptBuilder`
- `copy(value: AppleScriptValue, to: string): ScriptBuilder`
- `count(items: string): ScriptBuilder`
- `exists(item: string): ScriptBuilder`

#### Collection and JSON Operations

- `mapToJson(itemVariable: string, collection: string, properties: Record<string, string | PropertyExtractor>, options?: MapToJsonOptions): ScriptBuilder` - Ultra-shorthand for collection-to-JSON conversion with field transformations
  - Handles initialization, iteration, property extraction, field transformations, error handling, and JSON conversion in one call
  - Properties can be simple strings or `PropertyExtractor` objects for advanced transformations
  - PropertyExtractor supports: `firstOf` (get first item from collection), `ifExists` (check existence), `asType` (type conversion), `default` (default value)
  - Options: `{ limit?, until?, while?, skipErrors? }`
  - Reduces ~40 lines of code to a single method call (62.5% reduction)
  - Returns properly formatted JSON array string
  - Backward compatible: simple string properties work as before

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
