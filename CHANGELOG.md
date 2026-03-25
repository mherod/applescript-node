# Changelog

All notable changes to applescript-node are documented in this file.

## [Unreleased]

### 25 March 2026

#### New Features

- Added Bun runtime support with dedicated `applescript-node/bun`
  subpath export. The default import continues to use Node.js, and
  a new `applescript-node/node` explicit entry is also available.
  Both runtimes satisfy the same interface. (#67, #69, #72)
- Added iTerm2 scripting methods to the builder API: create
  windows, tabs, split panes, write text, manage sessions, and
  control hotkey windows — all with full method chaining. (#70)
- Added `withApplicationActivated` closure method to the builder
  API, which activates a target app, runs a block, then restores
  focus to the previously active app. (#68)

#### Maintenance

- Updated dependencies: fast-xml-parser 5.4.1 → 5.5.7, rollup
  4.28.0 → 4.59.0, next 16.0.7 → 16.1.7. (#25, #57, #59, #62)

### 15 March 2026

#### Maintenance

- Internal improvements and maintenance. No user-facing changes in this
  period — updates were limited to code organisation, shared helper
  extraction, and developer documentation. (#49, #50)

### 28 February 2026

#### Maintenance

- Internal improvements and maintenance. No user-facing changes in this
  period — updates were limited to CI hardening, branch protection
  configuration, build tooling, release documentation, and developer
  guidance. (#21, #30, #31, #32, #33, #34, #35, #36, #37, #38, #39,
  #40)

### 27 February 2026

#### Maintenance

- Internal improvements and maintenance. No user-facing changes in this
  period — updates were limited to CI workflow configuration,
  build tooling, and code documentation. (#12, #28, #29)

### 31 January 2026

#### Bug Fixes

- Fixed TypeScript type definitions failing to regenerate after build,
  ensuring `.d.ts` files are always included in published npm
  packages (#19)
- Updated `fast-xml-parser` to resolve a security vulnerability
  (GHSA-37qj-frw5-hhjh) (#19)

### 30 November 2025

#### Documentation

- Added documentation website with Getting Started, Builder API,
  Data Extraction, and API Reference sections (#11)
- Rewrote README for improved clarity and scannability (#11)

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
