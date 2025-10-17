# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**applescript-node** is a production-ready Node.js library providing a type-safe interface for executing AppleScript and JavaScript through macOS's `osascript` command. The library bridges Node.js applications and macOS automation.

### Core Purpose

The library enables developers to:

- Automate macOS applications programmatically from Node.js
- Build complex automation workflows with fluent, intuitive API
- Create system administration tools interacting with macOS
- Develop testing frameworks for macOS applications
- Integrate macOS scripting into web applications and services

### Key Value Propositions

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Developer Experience**: Fluent builder API, intuitive and discoverable
- **Production Ready**: Extensive testing, error handling, documentation
- **Modern Architecture**: Promise-based, async/await, ESM-first
- **Comprehensive Coverage**: Complete macOS automation capabilities

**Platform requirement**: macOS-only, requires `osascript` command (macOS 10.10+).

## Build and Development Commands

### Building

- `pnpm build` - Full build (JavaScript + types)
- `pnpm build:js` - Build JavaScript with tsup
- `pnpm build:types` - Generate TypeScript declarations
- `pnpm dev` - Watch mode for development

### Testing

- `pnpm test` - Run all tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate coverage report (80% minimum threshold)

### Code Quality

- `pnpm lint` - Type check with tsc and lint with ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:fix` - Format and auto-fix lint issues
- `pnpm typecheck` - Type check without emitting files
- `pnpm verify` - Run lint, test, and build (full verification)

### Running Examples

- `pnpm run example:basic` - Basic script execution
- `pnpm run example:builder` - Fluent builder API
- `pnpm run example:compile` - Script compilation
- `pnpm run example:languages` - Language information
- `pnpm run example:list-apps` - List running applications
- `pnpm run example:windows` - Window management
- `pnpm examples` - Run all examples sequentially

## Architecture

### Core Modules

1. **executor.ts** (`ScriptExecutor`)

   - Primary execution engine for AppleScript/JavaScript
   - Handles string-based and file-based script execution
   - Manages `osascript` command flags and output formatting
   - Uses Node.js `child_process.exec` with promisified interface
   - Error handling: Captures stderr, exit codes, execution failures
   - Output processing: Handles human-readable vs raw output
   - Security: Properly escapes single quotes in scripts

2. **builder.ts** (`AppleScriptBuilder`)

   - Fluent API implementation for constructing AppleScript commands
   - Block stack management: Tracks nested blocks (tell/if/repeat/etc.)
   - Syntax validation: Ensures blocks properly opened/closed
   - Automatic indentation: Maintains proper AppleScript formatting
   - Method chaining: Returns `ScriptBuilder` for fluent interface
   - Value formatting: Handles AppleScript data types (strings, numbers, arrays, objects)
   - Block validation prevents malformed scripts

3. **compiler.ts** (`ScriptCompiler`)

   - Script compilation to `.scpt` (compiled) or `.scptd` (bundle) format
   - Uses `osacompile` command with various flags
   - Stay-open applications: Creates persistent script applications
   - Bundle creation: Supports `.scptd` bundle format
   - Execute-only compilation: Creates protected scripts
   - Startup screen support: Adds splash screens to applications

4. **decompiler.ts** (`ScriptDecompiler`)

   - Reverse compilation of `.scpt` files to source
   - Uses `osadecompile` command
   - Error handling: Manages decompilation failures gracefully
   - Source recovery: Extracts original script text from compiled files

5. **languages.ts** (`LanguageManager`)

   - OSA language discovery and capability querying
   - Uses `osalang` command to enumerate available languages
   - Capability parsing: Extracts language features and limitations
   - Language info: Provides detailed information per language
   - Default language detection: Identifies system default scripting language

6. **types.ts** (`TypeDefinitions`)
   - Central type system for the library
   - Key interfaces: `ScriptBuilder`, `ScriptExecutionResult`, `OsaScriptOptions`
   - AppleScript types: `AppleScriptValue`, `AppleScriptPrimitive`
   - System types: `WindowInfo`, `ProcessInfo`, `ApplicationTarget`
   - Configuration types: `CompileOptions`, `OsaLanguageInfo`
   - Error types: `ScriptError` with detailed error information

### Build System

- **tsup** for JavaScript bundling (ESM + CJS)
- **TypeScript** compiler for type declarations (separate from JS)
- **Module system**: NodeNext (ESM with `.js` extensions)
- **Output**: `dist/` directory with dual package exports
- **Bundling**: Rollup-based with tree shaking and minification
- **Source maps**: Generated for debugging
- **Package exports**: Conditional exports for ESM/CJS

### Testing Strategy

- **Vitest** with node environment
- **Coverage thresholds**: 80% minimum for statements/branches/functions/lines
- **Test organization**: Co-located test files (\*.test.ts) with source
- **Execution**: Single-threaded with randomized test sequence
- **Mocking**: Comprehensive mocking of `child_process.exec`
- **Integration tests**: Real `osascript` execution for end-to-end validation
- **Test categories**:
  - Unit tests for individual methods and classes
  - Integration tests for full workflow validation
  - Error handling tests for failure scenarios
  - Type safety tests for TypeScript compliance

### Code Quality Standards

- **ESLint v9** with flat configuration
- **TypeScript strict mode** with comprehensive type checking
- **Prettier** for consistent formatting
- **Key rules**:
  - Consistent type imports (`import type` for type-only)
  - No explicit `any` types (warnings for usage)
  - Unused variables start with `_` prefix
  - Array types use simple syntax (`string[]` not `Array<string>`)
  - Interfaces preferred over type aliases for objects
  - Consistent naming (camelCase for variables, PascalCase for types)
  - Maximum line length 100 characters
  - Trailing commas in multiline structures

### Pre-commit Quality Gates

**husky** + **lint-staged** for automated quality checks:

- **ESLint + Prettier** on all TypeScript files
- **Type checking** with `tsc --noEmit --skipLibCheck`
- **Vitest execution** on related test files
- **Type declaration build** verification
- **Staged file processing** for optimal performance
- **Automatic fixes** where possible (formatting, lint issues)

## Key Implementation Patterns

### Script Building with Block Stack

`AppleScriptBuilder` maintains block stack for proper AppleScript syntax:

- **Block types**: `tell`, `if`, `repeat`, `considering`, `ignoring`, `using`, `with`, `try`, `on`
- **Stack management**: Opening methods push blocks, `end()` pops and validates
- **Nesting validation**: Ensures proper block hierarchy and closure
- **Context awareness**: `then()` and `else()` validate inside `if` block
- **Build validation**: `build()` ensures all blocks properly closed

Example of proper block usage:

```typescript
createScript()
  .tell('Finder') // Pushes 'tell' block
  .if('count of windows > 0') // Pushes 'if' block
  .then() // Validates inside 'if'
  .closeWindow()
  .else() // Validates inside 'if'
  .displayDialog('No windows')
  .end() // Pops 'if' block
  .end() // Pops 'tell' block
  .build(); // Validates all blocks closed
```

### Command Execution Pattern

Script execution follows consistent pattern through `ScriptExecutor`:

1. **Flag building**: Convert options to `osascript` flags
2. **Script escaping**: Escape single quotes and special characters
3. **Command construction**: Build complete `osascript` command
4. **Execution**: Use `child_process.exec` with promisified interface
5. **Result processing**: Parse stdout/stderr into structured result
6. **Error handling**: Capture exit codes and error messages

### Type Safety Architecture

Comprehensive type safety through multiple layers:

- **Generic return types**: `runScript<T>()` for strongly-typed output
- **Method chaining**: Builder methods return `ScriptBuilder` for fluent interface
- **Options interfaces**: Strongly-typed configuration objects
- **Union types**: For modifiers, window arrangements, language options
- **AppleScript value types**: Proper typing for AppleScript data structures
- **Error types**: Structured error information with line/column details

## API Design Philosophy

### Fluent Builder Pattern

Fluent builder pattern for intuitive script construction:

- **Method chaining**: Each method returns builder for continued chaining
- **Contextual methods**: Grouped by functionality (UI, windows, apps)
- **Progressive disclosure**: Simple methods for common tasks, advanced for complex scenarios
- **Discoverability**: IntelliSense provides comprehensive method suggestions

### Error Handling Strategy

Comprehensive error handling across all operations:

- **Execution errors**: Captured from `osascript` stderr and exit codes
- **Validation errors**: Block stack validation and syntax checking
- **Type errors**: TypeScript compile-time error prevention
- **Runtime errors**: Graceful handling of system-level failures
- **Error context**: Detailed error messages with source information

### Performance Considerations

Optimized for development and production:

- **Lazy evaluation**: Scripts built only when `build()` called
- **Efficient execution**: Direct `osascript` process spawning
- **Memory management**: Minimal object creation during script building
- **Caching**: Language information and capabilities cached
- **Streaming**: Large script outputs handled efficiently

## Common Use Cases and Patterns

### Application Automation

```typescript
// Launch and control applications
const script = createScript()
  .tell('Finder')
  .activate()
  .tell('System Events')
  .keystroke('n', ['command']) // New window
  .delay(1)
  .keystroke('Hello World')
  .end()
  .end();
```

### Window Management

```typescript
// Complex window operations
const script = createScript()
  .tell('Finder')
  .getWindowInfo('Finder', 'Downloads')
  .moveWindow('Finder', 'Downloads', 100, 100)
  .resizeWindow('Finder', 'Downloads', 800, 600)
  .end();
```

### System Integration

```typescript
// System-level operations
const script = createScript()
  .tell('System Events')
  .getRunningApplications()
  .doShellScript('ls -la', true) // With admin privileges
  .end();
```

### Error Recovery

```typescript
// Robust error handling
const result = await runScript(script);
if (!result.success) {
  console.error('Script failed:', result.error);
  // Implement fallback logic
}
```

### Building Records from Variables (Shorthand Methods)

Shorthand methods eliminate repetitive boilerplate when extracting properties and creating records:

#### setExpression with Record Objects

```typescript
// OLD WAY - using makeRecordFrom
const script = createScript()
  .setExpression('accName', 'name of acc')
  .setExpression('accId', 'id of acc')
  .setExpression(
    'record',
    createScript().makeRecordFrom({
      accountName: 'accName',
      accountId: 'accId',
    }),
  );

// NEW WAY - Record objects accepted directly
const script = createScript()
  .setExpression('accName', 'name of acc')
  .setExpression('accId', 'id of acc')
  .setExpression('record', {
    accountName: 'accName',
    accountId: 'accId',
  });
```

#### setEndRecord for Ultra-Clean Syntax

`setEndRecord()` combines property extraction and record creation in one step:

```typescript
// Form 1: Direct expressions (use full expressions)
const script = createScript()
  .set('accountInfo', [])
  .repeatWith('acc', 'every account')
  .setEndRecord('accountInfo', {
    accountName: 'name of acc',
    accountId: 'id of acc',
    noteCount: 'count of notes in acc',
  })
  .end();

// Form 2: Source object shorthand (automatically appends "of source")
const script = createScript()
  .set('accountInfo', [])
  .repeatWith('acc', 'every account')
  .setEndRecord('accountInfo', 'acc', {
    accountName: 'name',
    accountId: 'id',
    noteCount: 'count of notes',
  })
  .end();
```

**Implementation Details:**

- `setEndRecord()` reduces boilerplate by ~31% vs manual temporary variables
- Form 1 accepts Record with full expressions as values
- Form 2 accepts source object name, automatically constructs "property of source" expressions
- Both forms generate AppleScript records and append to lists in single operation
- Type-safe with full TypeScript support
- Validates propertyMap provided when using source object form

### Explicit Paired Endings

Explicit block endings improve code clarity and reduce errors when working with nested blocks:

```typescript
// Use explicit endings for clarity
const script = createScript()
  .tell('Finder')
  .if('count of windows > 0')
  .raw('activate front window')
  .endif() // Explicit: ends the if block
  .endtell() // Explicit: ends the tell block
  .build();

// These validate correct block types - will error if mismatched
builder.if('x > 5').endif(); // ✓ Correct
builder.repeat(5).endrepeat(); // ✓ Correct
builder.try().endtry(); // ✓ Correct
builder.tell('App').endtell(); // ✓ Correct

// Type-safe - will throw error if block types don't match
builder.if('x > 5').endrepeat(); // ✗ Error: trying to close repeat, not if
```

**Available explicit endings:**

- `endif()` - for if blocks
- `endrepeat()` - for repeat blocks
- `endtry()` - for try blocks
- `endtell()` - for tell blocks
- `endon()` - for on handler blocks
- `endconsidering()` - for considering blocks
- `endignoring()` - for ignoring blocks
- `endusing()` - for using blocks
- `endwith()` - for with blocks

**Benefits:**

- Eliminates confusion about which `end()` closes which block
- IDE autocomplete shows all ending options
- Runtime validation catches mismatched block types
- Self-documenting code that's easy to understand

### Convenience Helper Methods

Convenience helpers simplify common patterns and automatically manage block closing:

#### ifThen and ifThenElse

```typescript
// OLD WAY: Manual block management
const script = createScript().if('counter > 10').then().raw('log "greater"').endif();

// NEW WAY: Cleaner with convenience helper
const script = createScript().ifThen('counter > 10', (b) => {
  b.raw('log "greater"');
});

// if-then-else pattern
const script = createScript().ifThenElse(
  'counter > 10',
  (then_) => {
    then_.raw('log "greater"');
  },
  (else_) => {
    else_.raw('log "not greater"');
  },
);
```

#### tryCatch

```typescript
// OLD WAY: Manual try-catch management
const script = createScript().try().raw('activate').onError().raw('log "failed"').endtry();

// NEW WAY: Simplified with helper
const script = createScript().tryCatch(
  (try_) => {
    try_.raw('activate');
  },
  (catch_) => {
    catch_.raw('log "failed"');
  },
);

// With error variable capture
const script = createScript().tryCatchError(
  (try_) => {
    try_.raw('activate');
  },
  'errorMsg', // Error variable name
  (catch_) => {
    catch_.raw('log errorMsg');
  },
);
```

**Benefits:**

- Blocks automatically closed - no forgotten `endif()` calls
- Callback parameters clearly show scope
- JavaScript indentation matches block hierarchy
- Callbacks can use standard TypeScript features

### Conditional Assignment with setIfExists

The `setIfExists()` and `setEndIfExists()` methods provide a semantic, readable way to handle optional properties with type conversion and default values.

```typescript
// Common pattern: Check if property exists, convert type, or use default
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
  .endrepeat()
  .endtell();
```

**Comparison - Old vs New:**

```typescript
// OLD WAY: Using setTernary (verbose)
.setTernary(
  'personBirthday',
  (e) => e.exists(e.property('aPerson', 'birth date')),
  (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
  'missing value',
)

// NEW WAY: Using setIfExists (concise)
.setIfExists(
  'personBirthday',
  (e) => e.property('aPerson', 'birth date'),
  'missing value',
  'string',
)
```

**Implementation Details:**

- Generates proper if-then-else blocks (AppleScript doesn't support inline conditionals)
- Built-in type conversion via `asType` parameter
- Default value is optional (defaults to `'missing value'`)
- Both string-based and ExprBuilder property expressions supported
- Type-safe with full TypeScript support and generic type tracking

**Usage Patterns:**

```typescript
// Basic existence check without type conversion
.setIfExists('personEmail', (e) => e.property('aPerson', 'email'), 'missing value')

// With type conversion
.setIfExists('createdDate', (e) => e.property('note', 'creation date'), 'missing value', 'string')

// String-based property
.setIfExists('personPhone', 'phone of aPerson', '""')

// Append to list if exists
.setEndIfExists('datesList', (e) => e.property('note', 'creation date'), 'missing value', 'string')
```

**Generated AppleScript:**

```applescript
if exists birth date of aPerson then
  set personBirthday to birth date of aPerson as string
else
  set personBirthday to missing value
end if
```

**Benefits:**

- More semantic than `setTernary` - method name clearly shows intent
- Cleaner API - no need to manually construct existence check
- Self-documenting - obviously checking for property existence
- Consistent default value handling across codebase
- Built-in type conversion reduces boilerplate
- Integrates seamlessly with other builder methods

### Enhanced mapToJson() with PropertyExtractor

The `mapToJson()` method now supports field-level transformations using `PropertyExtractor` objects. This eliminates the need for manual property extraction loops and dramatically simplifies collection mapping code.

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

**Basic Usage - Backward Compatible:**

```typescript
// Simple string properties (same as before)
const script = createScript()
  .tell('Notes')
  .mapToJson(
    'aNote',
    'every note',
    {
      id: 'id',
      name: 'name',
      content: 'plaintext',
    },
    { limit: 10, skipErrors: true },
  )
  .endtell();
```

**Advanced Usage - PropertyExtractor with Field Transformations:**

```typescript
// Extract contacts with complex field requirements
const script = createScript()
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

      // PropertyExtractor: Get first email from collection
      email: {
        property: (e) => e.property('aPerson', 'emails'),
        firstOf: true,
        default: 'missing value',
      },

      // PropertyExtractor: String property syntax
      phone: {
        property: 'phones',
        firstOf: true,
      },

      // PropertyExtractor: Optional field with type conversion
      birthday: {
        property: 'birth date',
        ifExists: true,
        asType: 'string',
        default: 'missing value',
      },

      isCompany: 'company',
    },
    { limit: 50, skipErrors: true },
  )
  .endtell();
```

**How It Works Internally:**

For each PropertyExtractor field, mapToJson():

1. Generates a temporary variable (e.g., `__temp_email`)
2. Calls `setFirstOf()` if `firstOf: true` is specified
3. Calls `setIfExists()` if `ifExists: true` is specified
4. Stores the transformed value in the temp variable
5. Uses the temp variable in the final record construction

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
              firstName: 'first name of aPerson',
              lastName: 'last name of aPerson',
              organization: 'organization of aPerson',
              email: 'personEmail',
              phone: 'personPhone',
              birthday: 'personBirthday',
              isCompany: 'company of aPerson',
            }),
        (catchBlock) => catchBlock.comment('Skip contacts with errors'),
      ),
  )
  .returnAsJson('contactsList', {
    id: 'id',
    name: 'name',
    firstName: 'firstName',
    lastName: 'lastName',
    organization: 'organization',
    email: 'email',
    phone: 'phone',
    birthday: 'birthday',
    isCompany: 'isCompany',
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
      firstName: 'first name',
      lastName: 'last name',
      organization: 'organization',
      email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
      phone: { property: 'phones', firstOf: true },
      birthday: { property: 'birth date', ifExists: true, asType: 'string' },
      isCompany: 'company',
    },
    { limit: 50, skipErrors: true },
  )
  .endtell();
```

**PropertyExtractor Options:**

- **firstOf**: Checks if collection has items, gets `value of item 1`, or uses default
  - Generates: `if count of <property> > 0 then ... else ...`
  - Perfect for multi-value fields like emails, phones, addresses
- **ifExists**: Checks if property exists before accessing
  - Generates: `if exists <property> then ... else ...`
  - Optional type conversion via `asType` parameter
  - Perfect for optional fields like birth dates, notes, custom fields
- **asType**: Converts property to specified AppleScript type
  - Example: `asType: 'string'` generates `as string`
  - Works with both firstOf and ifExists
- **default**: Default value if property missing or collection empty
  - Can be string literal or ExprBuilder callback
  - Defaults to `'missing value'` if not specified

**Generated AppleScript Example:**

For the contacts example above, mapToJson() generates approximately:

```applescript
tell application "Contacts"
  set __collected_items to {}
  set __counter to 0
  repeat with aPerson in every person
    if __counter >= 50 then
      exit repeat
    end if
    set __counter to __counter + 1

    -- firstOf transformation for email
    if count of emails of aPerson > 0 then
      set __temp_email to value of item 1 of emails of aPerson
    else
      set __temp_email to missing value
    end if

    -- firstOf transformation for phone
    if count of phones > 0 then
      set __temp_phone to value of item 1 of phones
    else
      set __temp_phone to missing value
    end if

    -- ifExists transformation for birthday
    if exists birth date then
      set __temp_birthday to birth date as string
    else
      set __temp_birthday to missing value
    end if

    try
      set end of __collected_items to {
        id:id of aPerson,
        name:name of aPerson,
        firstName:first name of aPerson,
        lastName:last name of aPerson,
        organization:organization of aPerson,
        email:__temp_email of aPerson,
        phone:__temp_phone of aPerson,
        birthday:__temp_birthday of aPerson,
        isCompany:company of aPerson
      }
    on error
      -- Skip items with errors
    end try
  end repeat

  -- JSON conversion code...
  return jsonArray
end tell
```

**Key Benefits:**

- **62.5% code reduction**: From ~40 lines to ~15 lines
- **Declarative syntax**: Describes what you want, not how to get it
- **Type-safe**: Full TypeScript support with PropertyExtractor interface
- **Backward compatible**: Simple string properties work as before
- **Self-documenting**: Field transformations clearly specified inline
- **Leverages existing methods**: Uses battle-tested `setFirstOf()` and `setIfExists()` internally
- **Consistent behavior**: Same transformation logic across all usages
- **Reduces bugs**: Less manual loop/conditional code to maintain

**Real-World Example - See `examples/contacts-automation.ts`:**

The contacts example demonstrates a realistic use case: extracting contact data with a mix of required fields, multi-value fields (emails, phones), and optional fields (birthday). The PropertyExtractor approach reduces the code from ~40 lines to ~15 lines while maintaining clarity and type safety.

### Type-Safe Expressions with ExprBuilder

`ExprBuilder` provides type-safe expression building with autocomplete:

```typescript
import { ExprBuilder } from 'applescript-node';

// OLD WAY: String-based conditions are error-prone
.if('counter > 10')  // Typo: what if you type 'countre'? No error until runtime!

// NEW WAY: Type-safe with ExprBuilder
.if((e) => e.gt('counter', 10))  // ✓ Autocomplete, type checking

// Comparison operators
const e = new ExprBuilder();
e.gt('x', 5)              // x > 5
e.lt('x', 5)              // x < 5
e.gte('x', 5)             // x ≥ 5
e.lte('x', 5)             // x ≤ 5
e.eq('status', 'done')    // status = "done"
e.ne('status', 'pending') // status ≠ "pending"

// String operations
e.length('name')          // length of name
e.contains('name', '"J"') // name contains "J"
e.startsWith('text', '"A"') // text begins with "A"
e.endsWith('text', '"Z"') // text ends with "Z"

// Property and count operations
e.property('note', 'name')      // name of note
e.count('notes')                // count of notes
e.exists('window "Settings"')   // exists window "Settings"
e.typeEquals('value', 'text')   // the type of value is text

// Logical operators
e.and('x > 5', 'y < 10')        // x > 5 and y < 10
e.or('x > 5', 'y > 10')         // x > 5 or y > 10
e.not('exists window')          // not exists window

// Complex expressions
const cond = e.and(
  e.gt(e.length('name'), 5),
  e.eq('status', 'active')
);
// Produces: length of name > 5 and status = "active"
```

**Usage with builder:**

```typescript
const script = createScript()
  .tell('Notes')
  .set('notesList', [])
  .repeatWith('aNote', 'every note')
  // Use ExprBuilder for condition
  .ifThen(
    (e) => e.gt('counter', 50),
    (b) => {
      b.exitRepeat();
    },
  )
  .tryCatch(
    (b) => {
      b.setExpression('notePlaintext', 'plaintext of aNote');
      // Nested expressions
      b.ifThenElse(
        (e) => e.gt(e.length('notePlaintext'), 100),
        (then_) => {
          then_.setExpression('notePreview', 'text 1 thru 100 of notePlaintext & "..."');
        },
        (else_) => {
          else_.set('notePreview', 'notePlaintext');
        },
      );
      b.setEndRecord('notesList', {
        noteName: 'name of aNote',
        noteId: 'id of aNote',
        preview: 'notePreview',
      });
    },
    (c) => {
      c.comment('Skip notes with errors');
    },
  )
  .endrepeat()
  .returnRaw('notesList')
  .endtell()
  .build();
```

**Benefits:**

- Type-safe conditions with TypeScript checking
- IDE autocomplete for all operators
- Self-documenting: `e.gt()` is clearer than `>`
- Composable expressions with `and()`, `or()`, `not()`
- Prevents common mistakes like property name typos

## Development Guidelines

### Adding New Features

When extending the library:

1. **Type definitions first**: Add types to `types.ts` before implementation
2. **Builder methods**: Add methods to `AppleScriptBuilder` class
3. **Tests required**: Unit tests for new functionality
4. **Documentation**: Update README and examples
5. **Backward compatibility**: Ensure existing APIs remain stable

### Testing New Code

Testing requirements for new features:

- **Unit tests**: Test individual methods and classes
- **Integration tests**: Test with real `osascript` execution
- **Error cases**: Test failure scenarios and edge cases
- **Type safety**: Ensure TypeScript types are correct
- **Coverage**: Maintain 80%+ test coverage

### Code Review Checklist

Before submitting changes:

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Examples work correctly

## Testing Considerations

### Platform Requirements

- **macOS only**: Tests require `osascript` command
- **Real execution**: Integration tests use actual `osascript`
- **Mocking strategy**: Unit tests mock `child_process.exec`
- **Error simulation**: Test success and failure scenarios

### Test Categories

- **Unit tests**: Individual method and class testing with mocks
- **Integration tests**: Full workflow testing with real `osascript`
- **Error handling**: Test script failures, syntax errors, system errors
- **Type safety**: Validate TypeScript type checking and inference
- **Block validation**: Test builder block stack validation and error cases

### Mocking Patterns

```typescript
// Mock successful execution
vi.mocked(exec).mockResolvedValueOnce({
  stdout: 'expected output',
  stderr: '',
});

// Mock execution failure
vi.mocked(exec).mockRejectedValueOnce(new Error('Script execution failed'));
```

## Import Path Aliasing

Sophisticated path aliasing for development:

- **`applescript-node`** maps to `./src/index.ts` for internal imports
- **External package simulation**: Internal imports mimic external package usage
- **TypeScript resolution**: Proper module resolution for development and build
- **IDE support**: Full IntelliSense and navigation

## File Structure and Organization

### Source Code Layout

```
src/
├── index.ts          # Main entry point and public API
├── types.ts          # Central type definitions
├── executor.ts       # Script execution engine
├── builder.ts        # Fluent builder implementation
├── compiler.ts       # Script compilation
├── decompiler.ts     # Script decompilation
└── languages.ts      # Language discovery and capabilities
```

### Example Code Organization

```
examples/
├── basic-script.ts      # Simple script execution
├── fluent-builder.ts    # Builder API demonstration
├── script-compilation.ts # Compilation examples
├── script-decompilation.ts # Decompilation examples
├── language-info.ts     # Language discovery
├── list-applications.ts # Application management
├── window-management.ts # Window control
└── output/             # Generated script files
```

### Test Organization

```
src/
├── executor.test.ts     # Execution engine tests
├── builder.test.ts      # Builder functionality tests
├── compiler.test.ts     # Compilation tests
├── decompiler.test.ts   # Decompilation tests
└── languages.test.ts    # Language discovery tests
```

## Performance and Optimization

### Execution Performance

- **Direct process spawning**: Uses `child_process.exec` for optimal performance
- **Minimal overhead**: Lightweight wrapper around `osascript`
- **Memory efficiency**: Lazy script building and minimal object creation
- **Concurrent execution**: Supports parallel script execution

### Build Performance

- **Incremental builds**: tsup supports incremental compilation
- **Type-only builds**: Separate TypeScript compilation for types
- **Parallel processing**: Multiple build steps run in parallel
- **Caching**: Language information and capabilities cached

### Development Experience

- **Fast feedback**: Watch mode for rapid development
- **Type checking**: Real-time TypeScript error detection
- **Hot reloading**: Automatic rebuild on file changes
- **Comprehensive tooling**: Full IDE support with IntelliSense

## Security Considerations

### Script Execution Safety

- **Input validation**: Proper escaping of script strings
- **Error isolation**: Script failures don't crash Node.js process
- **Permission handling**: Respects macOS security permissions
- **Sandboxing**: Scripts run in isolated `osascript` processes

### Code Quality Security

- **Type safety**: Prevents runtime type errors
- **Static analysis**: ESLint catches potential security issues
- **Dependency management**: Regular dependency updates
- **Audit tools**: Security vulnerability scanning

## Troubleshooting Common Issues

### Build Issues

- **TypeScript errors**: Run `pnpm typecheck` to identify type issues
- **Import errors**: Ensure proper `.js` extensions in imports
- **Module resolution**: Check tsconfig.json path mappings

### Runtime Issues

- **Script execution failures**: Check `osascript` availability and permissions
- **Block validation errors**: Ensure proper `end()` calls for all blocks
- **Type errors**: Verify generic type parameters are correct

### Development Issues

- **Test failures**: Ensure tests run on macOS with `osascript` available
- **Linting errors**: Run `pnpm format:fix` to auto-fix common issues
- **Coverage failures**: Add tests for uncovered code paths

## Contributing Workflow

### Getting Started

1. Fork and clone repository
2. Install dependencies with `pnpm install`
3. Run tests to ensure everything works
4. Create feature branch for changes

### Development Process

1. Make changes following coding standards
2. Add tests for new functionality
3. Run quality checks (`pnpm verify`)
4. Update documentation as needed
5. Submit pull request with detailed description

### Release Process

1. Version bump in package.json
2. Update changelog with new features
3. Run full verification (`pnpm verify`)
4. Publish to npm (`pnpm publish`)
5. Create GitHub release with release notes
