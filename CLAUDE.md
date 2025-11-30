# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**applescript-node** is a production-ready Node.js library providing a type-safe interface for executing AppleScript and JavaScript through macOS's `osascript`. Bridges Node.js applications and macOS automation.

### Core Purpose

The library enables developers to:

- Automate macOS applications from Node.js
- Build automation workflows with fluent API
- Create system administration tools for macOS
- Develop testing frameworks for macOS applications
- Integrate macOS scripting into web applications and services

### Key Value Propositions

- **Type Safety**: Full TypeScript support
- **Developer Experience**: Fluent builder API, intuitive and discoverable
- **Production Ready**: Extensive testing, error handling
- **Modern Architecture**: Promise-based, async/await, ESM-first
- **Comprehensive Coverage**: Complete macOS automation

**Platform requirement**: macOS-only, requires `osascript` (macOS 10.10+).

## Build and Development Commands

### Building

- `pnpm build` - Full build (JavaScript + types)
- `pnpm build:js` - Build JavaScript with tsup
- `pnpm build:types` - Generate TypeScript declarations
- `pnpm dev` - Watch mode for development

### Testing

- `pnpm test` - Run all tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate coverage report (80% minimum)

### Code Quality

- `pnpm lint` - Type check with tsc and lint with ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:fix` - Format and auto-fix lint issues
- `pnpm typecheck` - Type check without emitting
- `pnpm verify` - Run lint, test, and build

### Running Examples

- `pnpm run example:basic` - Basic script execution
- `pnpm run example:builder` - Fluent builder API
- `pnpm run example:compile` - Script compilation
- `pnpm run example:languages` - Language information
- `pnpm run example:list-apps` - List running applications
- `pnpm run example:windows` - Window management
- `pnpm examples` - Run all examples

## Architecture

### Core Modules

1. **executor.ts** (`ScriptExecutor`)

   - Primary execution engine for AppleScript/JavaScript
   - Handles string and file-based execution
   - Manages `osascript` flags and output formatting
   - Uses Node.js `child_process.exec` with promisified interface
   - Error handling: Captures stderr, exit codes
   - Output processing: Handles human-readable vs raw output
   - Security: Escapes single quotes in scripts

2. **builder.ts** (`AppleScriptBuilder`)

   - Fluent API for constructing commands
   - Block stack management: Tracks nested blocks
   - Syntax validation: Ensures blocks opened/closed
   - Automatic indentation: Maintains formatting
   - Method chaining: Returns `ScriptBuilder` for fluent interface
   - Value formatting: Handles data types
   - Block validation prevents malformed scripts

3. **compiler.ts** (`ScriptCompiler`)

   - Compilation to `.scpt` or `.scptd` format
   - Uses `osacompile` with flags
   - Stay-open applications: Creates persistent apps
   - Bundle creation: Supports `.scptd` format
   - Execute-only compilation: Creates protected scripts
   - Startup screen support: Adds splash screens

4. **decompiler.ts** (`ScriptDecompiler`)

   - Reverse compilation of `.scpt` files
   - Uses `osadecompile`
   - Error handling: Manages decompilation failures
   - Source recovery: Extracts script text

5. **languages.ts** (`LanguageManager`)

   - OSA language discovery and querying
   - Uses `osalang` to enumerate languages
   - Capability parsing: Extracts features
   - Language info: Provides information
   - Default language detection: Identifies system default

6. **types.ts** (`TypeDefinitions`)
   - Central type system
   - Key interfaces: `ScriptBuilder`, `ScriptExecutionResult`, `OsaScriptOptions`
   - AppleScript types: `AppleScriptValue`, `AppleScriptPrimitive`
   - System types: `WindowInfo`, `ProcessInfo`, `ApplicationTarget`
   - Configuration types: `CompileOptions`, `OsaLanguageInfo`
   - Error types: `ScriptError` with error information

### Build System

- **tsup** for JavaScript bundling
- **TypeScript** compiler for type declarations
- **Module system**: NodeNext
- **Output**: `dist/` with dual package exports
- **Bundling**: Rollup-based with tree shaking
- **Source maps**: Generated
- **Package exports**: Conditional exports

### Testing Strategy

- **Vitest** with node environment
- **Coverage thresholds**: 80% minimum
- **Test organization**: Co-located test files (\*.test.ts)
- **Execution**: Single-threaded with randomized sequence
- **Mocking**: Comprehensive mocking
- **Integration tests**: Real `osascript` execution
- **Test categories**:
  - Unit tests for methods and classes
  - Integration tests for workflow validation
  - Error handling tests for failure scenarios
  - Type safety tests for TypeScript compliance

### Code Quality Standards

- **ESLint v9** with flat config
- **TypeScript strict mode**
- **Prettier** for formatting
- **Key rules**:
  - Consistent type imports
  - No explicit `any` types
  - Unused variables with `_` prefix
  - Array types use simple syntax
  - Interfaces preferred over type aliases
  - Consistent naming
  - Maximum line length 100
  - Trailing commas

### Pre-commit Quality Gates

**husky** + **lint-staged** for quality checks:

- **ESLint + Prettier** on TypeScript files
- **Type checking** with `tsc --noEmit --skipLibCheck`
- **Vitest execution** on test files
- **Type declaration build** verification
- **Staged file processing** for performance
- **Automatic fixes** where possible

## Key Implementation Patterns

### Script Building with Block Stack

`AppleScriptBuilder` maintains block stack for AppleScript syntax:

- **Block types**: `tell`, `if`, `repeat`, `considering`, `ignoring`, `using`, `with`, `try`, `on`
- **Stack management**: Opening methods push blocks, `end()` pops and validates
- **Nesting validation**: Ensures block hierarchy
- **Context awareness**: `then()` and `else()` validate inside `if`
- **Build validation**: `build()` ensures all blocks closed

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

Script execution follows pattern through `ScriptExecutor`:

1. **Flag building**: Convert options to `osascript` flags
2. **Script escaping**: Escape single quotes and special characters
3. **Command construction**: Build `osascript` command
4. **Execution**: Use `child_process.exec` with promisified interface
5. **Result processing**: Parse stdout/stderr into result
6. **Error handling**: Capture exit codes and error messages

### Type Safety Architecture

Type safety through layers:

- **Generic return types**: `runScript<T>()` for typed output
- **Method chaining**: Builder methods return `ScriptBuilder`
- **Options interfaces**: Typed configuration objects
- **Union types**: For modifiers, window arrangements, languages
- **AppleScript value types**: Proper typing for data structures
- **Error types**: Structured error information

## API Design Philosophy

### Fluent Builder Pattern

Fluent builder pattern:

- **Method chaining**: Each method returns builder
- **Contextual methods**: Grouped by functionality
- **Progressive disclosure**: Simple methods for common tasks
- **Discoverability**: IntelliSense suggestions

### Error Handling Strategy

Error handling:

- **Execution errors**: Captured from `osascript` stderr
- **Validation errors**: Block stack validation
- **Type errors**: TypeScript compile-time prevention
- **Runtime errors**: Graceful handling of failures
- **Error context**: Error messages

### Performance Considerations

Optimized:

- **Lazy evaluation**: Scripts built when `build()` called
- **Efficient execution**: Direct `osascript` spawning
- **Memory management**: Minimal object creation
- **Caching**: Language information and capabilities cached
- **Streaming**: Large outputs handled efficiently

## Common Use Cases and Patterns

### Application Automation

```typescript
// Launch and control apps
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
// Window operations
const script = createScript()
  .tell('Finder')
  .getWindowInfo('Finder', 'Downloads')
  .moveWindow('Finder', 'Downloads', 100, 100)
  .resizeWindow('Finder', 'Downloads', 800, 600)
  .end();
```

### System Integration

```typescript
// System operations
const script = createScript()
  .tell('System Events')
  .getRunningApplications()
  .doShellScript('ls -la', true) // With admin privileges
  .end();
```

### Error Recovery

```typescript
// Error handling
const result = await runScript(script);
if (!result.success) {
  console.error('Script failed:', result.error);
  // Implement fallback logic
}
```

### Building Records from Variables (Shorthand Methods)

Shorthand methods eliminate boilerplate when extracting properties:

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

- `setEndRecord()` reduces boilerplate by ~31% vs manual variables
- Form 1 accepts Record with full expressions
- Form 2 accepts source object name, constructs "property of source"
- Both forms generate records and append to lists
- Type-safe with TypeScript support
- Validates propertyMap when using source object form

### Explicit Paired Endings

Explicit block endings improve clarity with nested blocks:

```typescript
// Explicit endings
const script = createScript()
  .tell('Finder')
  .if('count of windows > 0')
  .raw('activate front window')
  .endif() // Explicit: ends the if block
  .endtell() // Explicit: ends the tell block
  .build();

// Validates block types - errors if mismatched
builder.if('x > 5').endif(); // ✓ Correct
builder.repeat(5).endrepeat(); // ✓ Correct
builder.try().endtry(); // ✓ Correct
builder.tell('App').endtell(); // ✓ Correct

// Type-safe - throws error if mismatched
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
- Self-documenting code

### Convenience Helper Methods

Convenience helpers simplify patterns and manage block closing:

#### ifThen and ifThenElse

```typescript
// OLD WAY: Manual
const script = createScript().if('counter > 10').then().raw('log "greater"').endif();

// NEW WAY: Helper
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
// OLD WAY: Manual try-catch
const script = createScript().try().raw('activate').onError().raw('log "failed"').endtry();

// NEW WAY: Helper
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

- Blocks automatically closed - no forgotten `endif()`
- Callback parameters clearly show scope
- JavaScript indentation matches block hierarchy
- Callbacks can use TypeScript features

### Conditional Assignment with setIfExists

The `setIfExists()` and `setEndIfExists()` methods handle optional properties with type conversion and defaults.

```typescript
// Check if property exists, convert type, or default
const script = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  // Check if birth date exists, convert to string, or default
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .endrepeat()
  .endtell();
```

**Comparison:**

```typescript
// OLD WAY: setTernary
.setTernary(
  'personBirthday',
  (e) => e.exists(e.property('aPerson', 'birth date')),
  (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
  'missing value',
)

// NEW WAY: setIfExists
.setIfExists(
  'personBirthday',
  (e) => e.property('aPerson', 'birth date'),
  'missing value',
  'string',
)
```

**Implementation Details:**

- Generates if-then-else blocks (AppleScript doesn't support inline conditionals)
- Built-in type conversion via `asType`
- Default value optional (defaults to `'missing value'`)
- Both string-based and ExprBuilder expressions supported
- Type-safe with TypeScript support

**Usage Patterns:**

```typescript
// Basic existence check
.setIfExists('personEmail', (e) => e.property('aPerson', 'email'), 'missing value')

// Type conversion
.setIfExists('createdDate', (e) => e.property('note', 'creation date'), 'missing value', 'string')

// String property
.setIfExists('personPhone', 'phone of aPerson', '""')

// Append to list
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

- More semantic than `setTernary` - shows intent
- Cleaner API - no manual existence check
- Self-documenting
- Consistent default value handling
- Built-in type conversion
- Integrates with other builder methods

### Enhanced mapToJson() with PropertyExtractor

The `mapToJson()` method supports field-level transformations using `PropertyExtractor` objects. This eliminates manual extraction loops and simplifies mapping code.

**PropertyExtractor:**

```typescript
interface PropertyExtractor {
  property: string | ((e: ExprBuilder) => string);
  firstOf?: boolean; // Get first item or default
  ifExists?: boolean; // Check if property exists
  asType?: string; // Convert to type
  default?: string | ((e: ExprBuilder) => string); // Default value
}
```

**Basic Usage:**

```typescript
// Simple string properties
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

**Advanced Usage - PropertyExtractor:**

```typescript
// Extract contacts
const script = createScript()
  .tell('Contacts')
  .mapToJson(
    'aPerson',
    'every person',
    {
      // Simple properties
      id: 'id',
      name: 'name',
      firstName: 'first name',
      lastName: 'last name',
      organization: 'organization',

      // Get first email
      email: {
        property: (e) => e.property('aPerson', 'emails'),
        firstOf: true,
        default: 'missing value',
      },

      // String property
      phone: {
        property: 'phones',
        firstOf: true,
      },

      // Optional field with type conversion
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

1. Generates temporary variable
2. Calls `setFirstOf()` if `firstOf: true`
3. Calls `setIfExists()` if `ifExists: true`
4. Stores transformed value
5. Uses temp variable in record construction

**Comparison:**

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
            // Manual ifExists
            .setIfExists(
              'personBirthday',
              (e) => e.property('aPerson', 'birth date'),
              'missing value',
              'string',
            )
            // Build record
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

// AFTER: PropertyExtractor (~15 lines)
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
  - Perfect for multi-value fields
- **ifExists**: Checks if property exists before accessing
  - Generates: `if exists <property> then ... else ...`
  - Optional type conversion via `asType`
  - Perfect for optional fields
- **asType**: Converts to specified AppleScript type
  - Example: `asType: 'string'` generates `as string`
  - Works with both firstOf and ifExists
- **default**: Default value if property missing or collection empty
  - Can be string literal or ExprBuilder callback
  - Defaults to `'missing value'` if not specified

**Generated AppleScript Example:**

For the contacts example, mapToJson() generates approximately:

```applescript
tell application "Contacts"
  set __collected_items to {}
  set __counter to 0
  repeat with aPerson in every person
    if __counter >= 50 then
      exit repeat
    end if
    set __counter to __counter + 1

    -- firstOf for email
    if count of emails of aPerson > 0 then
      set __temp_email to value of item 1 of emails of aPerson
    else
      set __temp_email to missing value
    end if

    -- firstOf for phone
    if count of phones > 0 then
      set __temp_phone to value of item 1 of phones
    else
      set __temp_phone to missing value
    end if

    -- ifExists for birthday
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

- **62.5% code reduction**: From ~40 to ~15 lines
- **Declarative syntax**: Describes what you want
- **Type-safe**: TypeScript support
- **Backward compatible**: Simple string properties work
- **Self-documenting**: Transformations inline
- **Leverages existing methods**: Uses `setFirstOf()` and `setIfExists()` internally
- **Consistent behavior**: Same transformation logic
- **Reduces bugs**: Less manual code

**Real-World Example - See `examples/contacts-automation.ts`:**

The contacts example demonstrates extracting contact data with required fields, multi-value fields, and optional fields. PropertyExtractor reduces code from ~40 to ~15 lines while maintaining clarity and type safety.

### Type-Safe Expressions with ExprBuilder

`ExprBuilder` provides type-safe expression building:

```typescript
import { ExprBuilder } from 'applescript-node';

// OLD WAY: String-based conditions
.if('counter > 10')  // Typo: no error until runtime!

// NEW WAY: Type-safe
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
- IDE autocomplete
- Self-documenting: `e.gt()` is clearer than `>`
- Composable expressions with `and()`, `or()`, `not()`
- Prevents property name typos

## Development Guidelines

### Adding New Features

When extending:

1. **Type definitions first**: Add types to `types.ts` before implementation
2. **Builder methods**: Add methods to `AppleScriptBuilder` class
3. **Tests required**: Unit tests for new functionality
4. **Documentation**: Update README and examples
5. **Backward compatibility**: Ensure existing APIs remain stable

### Testing New Code

Testing requirements:

- **Unit tests**: Test methods and classes
- **Integration tests**: Test with real `osascript`
- **Error cases**: Test failure scenarios
- **Type safety**: Ensure TypeScript types correct
- **Coverage**: Maintain 80%+

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

- **macOS only**: Tests require `osascript`
- **Real execution**: Integration tests use actual `osascript`
- **Mocking strategy**: Unit tests mock `child_process.exec`
- **Error simulation**: Test success and failure scenarios

### Test Categories

- **Unit tests**: Method and class testing with mocks
- **Integration tests**: Full workflow testing with real `osascript`
- **Error handling**: Test script failures, syntax errors, system errors
- **Type safety**: Validate TypeScript type checking
- **Block validation**: Test builder block stack validation

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

Path aliasing for development:

- **`applescript-node`** maps to `./src/index.ts` for internal imports
- **External package simulation**: Internal imports mimic external package usage
- **TypeScript resolution**: Module resolution
- **IDE support**: IntelliSense and navigation

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

- **Direct process spawning**: Uses `child_process.exec`
- **Minimal overhead**: Lightweight wrapper
- **Memory efficiency**: Lazy building
- **Concurrent execution**: Supports parallel execution

### Build Performance

- **Incremental builds**: tsup supports incremental compilation
- **Type-only builds**: Separate TypeScript compilation
- **Parallel processing**: Multiple build steps
- **Caching**: Language information and capabilities cached

### Development Experience

- **Fast feedback**: Watch mode
- **Type checking**: Real-time TypeScript errors
- **Hot reloading**: Automatic rebuild
- **Comprehensive tooling**: IDE support

## Security Considerations

### Script Execution Safety

- **Input validation**: Escaping script strings
- **Error isolation**: Script failures don't crash process
- **Permission handling**: Respects macOS permissions
- **Sandboxing**: Scripts run in isolated processes

### Code Quality Security

- **Type safety**: Prevents runtime errors
- **Static analysis**: ESLint catches security issues
- **Dependency management**: Regular updates
- **Audit tools**: Vulnerability scanning

## Troubleshooting Common Issues

### Build Issues

- **TypeScript errors**: Run `pnpm typecheck` to identify issues
- **Import errors**: Ensure `.js` extensions
- **Module resolution**: Check tsconfig.json mappings

### Runtime Issues

- **Script execution failures**: Check `osascript` availability
- **Block validation errors**: Ensure `end()` calls
- **Type errors**: Verify generic type parameters

### Development Issues

- **Test failures**: Ensure tests run on macOS with `osascript`
- **Linting errors**: Run `pnpm format:fix` to auto-fix
- **Coverage failures**: Add tests for uncovered paths

## Contributing Workflow

### Getting Started

1. Fork and clone
2. Install dependencies
3. Run tests
4. Create feature branch

### Development Process

1. Make changes following standards
2. Add tests
3. Run quality checks
4. Update documentation
5. Submit pull request

### Release Process

1. Version bump
2. Update changelog
3. Run verification
4. Publish to npm
5. Create GitHub release

## CI/CD and PR Merge Guidelines

### CRITICAL: Never Bypass CI

**Branch protection and CI checks exist for good reasons. Never attempt to circumvent them.**

#### Absolute Rules

1. **NEVER use `--admin` flag** to bypass branch protection or required status checks
2. **NEVER attempt to force-merge** when CI is still running
3. **CI running is the NORMAL state** - it is supposed to run and complete before merging
4. **Be patient** - wait for all checks to pass naturally

#### Correct PR Merge Workflow

```bash
# 1. Set up auto-merge (correct approach)
gh pr merge <PR_NUMBER> --squash --auto

# 2. Monitor checks if needed
gh pr checks <PR_NUMBER>

# 3. Wait for checks to complete - DO NOT try to force it
# The --auto flag will merge automatically when all checks pass

# 4. Verify merge completed
gh pr view <PR_NUMBER> --json state
```

#### What NOT To Do

```bash
# WRONG: Trying to merge while checks are pending
gh pr merge <PR_NUMBER> --squash  # Will fail - this is expected!

# WRONG: Bypassing with admin privileges
gh pr merge <PR_NUMBER> --squash --admin  # NEVER DO THIS

# WRONG: Being impatient when auto-merge is already set
# Just wait - the merge will happen automatically when checks pass
```

#### Why This Matters

- **CI protects code quality**: Required checks catch bugs before they reach main
- **Branch protection is intentional**: It exists to enforce review and quality standards
- **Bypassing undermines trust**: The team relies on CI to validate changes
- **"Completing tasks quickly" is not an excuse**: Quality > speed

#### When Checks Are Pending

If `gh pr merge --squash --auto` is set and checks are pending:

1. **Wait** - this is normal
2. **Monitor** with `gh pr checks <PR_NUMBER>` if needed
3. **Do not escalate** to `--admin` or other bypass methods
4. **If checks fail**, investigate and fix the issue - don't bypass

#### Summary

The correct mental model: CI checks are gatekeepers, not obstacles. When they're running, the system is working as designed. Patience and respect for the process is required.
