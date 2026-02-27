# Changelog

All notable changes to applescript-node are documented in this file.

## [Unreleased]

### 27 February 2026

#### Maintenance

- Internal improvements and maintenance. No user-facing changes in this
  period — updates were limited to CI workflow configuration,
  build tooling, and code documentation. (#12, #28)

### 16 October 2025

#### JSON Output and Data Structuring

- Added `buildJsonObject()` method for generating clean JSON expressions from AppleScript variables, eliminating manual string concatenation
- Added `returnJsonObject()` convenience method combining JSON building with script return statements
- Improved Calculator automation example with structured window position and size data, providing properly formatted coordinate output

#### Application Automation

- Added `tellApp()` convenience helper providing cleaner syntax for application-scoped operations
- Added Calculator automation example demonstrating UI interaction, keystroke sequences, and window property extraction
- Added `keystrokes()` shorthand for typing character sequences with automatic delays between keystrokes

#### Collection Processing and Data Extraction

- Added `mapToJson()` ultra-concise helper for converting collections to JSON with optional filtering and error handling
- Added `pickEndRecord()` for intuitive property extraction with smart expression detection
- Added `returnAsJson()` method for native JSON serialisation of AppleScript records

#### Expression Building

- Extended `ExprBuilder` with type-safe collection and accessor methods
- Added `forEachWhile()` and `forEachUntil()` iteration helpers for conditional loop patterns
- Added callback-based repeat helpers for cleaner repetition patterns

#### Examples and Documentation

- Added comprehensive Notes.app automation example with note creation and querying
- Added comprehensive script validation example using sdef introspection
- Added notes-latest-json example exporting recent notes as JSON

### 15 October 2025

#### API Enhancements

- Added enhanced builder API with explicit block endings (`endif()`, `endrepeat()`, `endtry()`, etc.) for improved code clarity
- Added `setEndRecord()` shorthand for ultra-clean record building
- Simplified record creation in builder API with automatic expression handling

#### Improvements

- Corrected AppleScript 'then' keyword syntax generation for improved script correctness
- Fixed Unicode operator encoding issues in `ExprBuilder` using ASCII equivalents
- Removed redundant System Events nesting in automation examples
- Configured Biome/Ultracite tooling with Prettier standards
- Enabled TypeScript strict null checking for enhanced type safety
