# CLAUDE.md

## Project Overview

**applescript-node** — production-ready Node.js library for type-safe AppleScript/JavaScript execution via macOS `osascript`. ESM-first, Promise-based, fluent builder API.

**Platform**: macOS-only, requires `osascript` (macOS 10.10+).

## Build and Development Commands

- `pnpm build` — Full build (JS + types)
- `pnpm build:js` — Build JS with tsup
- `pnpm build:types` — Generate .d.ts (includes `--force` flag)
- `pnpm dev` — Watch mode
- `pnpm test` — Run all tests (Vitest)
- `pnpm test:coverage` — Coverage report (80% minimum)
- `pnpm lint` — Type check + ESLint
- `pnpm format:fix` — Format and auto-fix
- `pnpm typecheck` — Type check without emitting
- `pnpm verify` — Lint, test, and build
- `pnpm examples` — Run all examples

**DON'T** remove `rm -f tsconfig.build.tsbuildinfo` from `build:types`. Without it, tsc skips emitting .d.ts after tsup cleans dist/.

**DON'T** add ultracite to lint-staged — deprecated biome rules cause failures. ESLint handles linting.

## Architecture

### Core Modules

1. **executor.ts** — Primary execution engine. Uses `child_process.exec`, `extractErrorInfo()` for stderr/exit codes, escapes single quotes.
2. **builder.ts** — Fluent API with block stack management, syntax validation, auto-indentation, method chaining.
3. **compiler.ts** — Compilation to `.scpt`/`.scptd` via `osacompile`. Stay-open apps, bundles, execute-only.
4. **decompiler.ts** — Reverse compilation via `osadecompile`.
5. **languages.ts** — OSA language discovery via `osalang`. Fallback AppleScript object when no languages installed.
6. **types.ts** — Central type system. Key: `ScriptBuilder`, `ScriptExecutionResult`, `OsaScriptOptions`, `AppleScriptValue`, `CompileOptions`. **Note**: `WindowInfo` in types.ts (per-app) differs from `sources/windows.ts` (system-wide, includes `app` field).

### Build System

tsup for JS bundling, TypeScript for declarations, NodeNext modules, `dist/` with dual package exports, source maps.

### Testing

Vitest, 80% coverage minimum, co-located `.test.ts` files, single-threaded randomized. Unit tests mock `child_process.exec`, integration tests use real `osascript`.

### Code Quality

ESLint v9 flat config, TypeScript strict, Prettier. Key rules:

- `??` not `||` for defaults (`@typescript-eslint/prefer-nullish-coalescing`)
- No `String()` on objects — check `typeof` first (`@typescript-eslint/no-base-to-string`)
- `includes()` over regex for substrings (`@typescript-eslint/prefer-includes`)
- `_` prefix for unused vars — but verify they're truly unused
- Interfaces over type aliases, consistent type imports, max line 100

### Pre-commit (husky + lint-staged)

ESLint+Prettier on TS files, `tsc --noEmit --skipLibCheck`, Vitest on test files, type declaration build verification.

## Key Implementation Patterns

### Block Stack

Block types: `tell`, `if`, `repeat`, `considering`, `ignoring`, `using`, `with`, `try`, `on`. Opening methods push, `end()` pops and validates, `build()` ensures all closed.

**Inline detection** in `loadFromScript()`:

- Inline tell: `tell app "X" to activate` (has `to` NOT followed by `tell`) — no push
- Nested tell: `tell app "X" to tell process "Y"` (has ` to tell`) — pushes
- Inline if: `if x then return y` (has `then` + content) — no push

### Explicit Endings

`endif()`, `endrepeat()`, `endtry()`, `endtell()`, `endon()`, `endconsidering()`, `endignoring()`, `endusing()`, `endwith()` — validate block type match at runtime.

### Convenience Helpers

- `ifThen(condition, callback)` / `ifThenElse(condition, thenCb, elseCb)` — auto-close blocks
- `tryCatch(tryCb, catchCb)` / `tryCatchError(tryCb, errorVar, catchCb)` — auto-close with optional error variable

### setEndRecord

Combines property extraction and record creation. Form 1: direct expressions. Form 2: source object shorthand (appends "of source").

### setIfExists / setEndIfExists

Handle optional properties with existence check, type conversion (`asType`), and defaults. Generates if-then-else blocks.

### mapToJson with PropertyExtractor

`mapToJson(iterVar, collection, fieldMap, options)` supports `PropertyExtractor` objects per field:

```typescript
interface PropertyExtractor {
  property: string | ((e: ExprBuilder) => string);
  firstOf?: boolean; // Get first item or default
  ifExists?: boolean; // Check existence before access
  asType?: string; // Type conversion
  default?: string | ((e: ExprBuilder) => string);
}
```

Simple strings for direct properties, `PropertyExtractor` for transformations. Uses `setFirstOf()`/`setIfExists()` internally. See `examples/contacts-automation.ts`.

### ExprBuilder

Type-safe expressions: `e.gt()`, `e.lt()`, `e.eq()`, `e.ne()`, `e.gte()`, `e.lte()`, `e.and()`, `e.or()`, `e.not()`, `e.length()`, `e.contains()`, `e.startsWith()`, `e.endsWith()`, `e.property()`, `e.count()`, `e.exists()`. Composable, IDE-autocomplete-friendly.

## Development Guidelines

1. Type definitions in `types.ts` first
2. Tests required for new functionality
3. Maintain 80%+ coverage
4. Backward compatibility for existing APIs

**Import alias**: `applescript-node` maps to `./src/index.ts` for internal imports.

## Security

**String escaping order**: Escape backslashes FIRST, THEN quotes. See `setClipboard()` in `sources/system.ts`.

**DON'T** use multi-line `${...}` in README code examples — CI `gh pr diff` bash parser expands them. Extract to single-line variable first.

## Troubleshooting

- **Missing .d.ts in dist/**: Delete `tsconfig.build.tsbuildinfo` and rebuild
- **IDE "Cannot find name 'Promise'"**: Language server noise. Run `pnpm typecheck` to verify — if it passes, ignore
- **Import errors**: Ensure `.js` extensions

## npm Release Workflow

**Pre-release**: Clean git, `pnpm test`, `pnpm lint`, `pnpm audit`, `pnpm build`, verify .d.ts in dist/.

**Version bump**: `unset npm_config_prefix && pnpm version patch|minor|major` (use `pnpm version` not `npm version`). Creates commit + tag. Requires clean git state.

**Publish**:

```bash
OTP=$(op item get "Npmjs" --otp) && unset npm_config_prefix && pnpm publish --otp=$OTP
```

From non-main branches add `--no-git-checks`. Always `pnpm publish --dry-run` first.

**Re-auth** if token expired:

```bash
PASSWORD=$(op item get "Npmjs" --fields password --reveal)
OTP=$(op item get "Npmjs" --otp)
TOKEN=$(curl -s -X PUT "https://registry.npmjs.org/-/user/org.couchdb.user:mherod" \
  -H "Content-Type: application/json" -H "npm-otp: $OTP" \
  -d "{\"name\":\"mherod\",\"password\":\"$PASSWORD\",\"type\":\"user\"}" \
  | jq -r '.token // empty')
sed -i '' '/registry.npmjs.org\/:_authToken/d' ~/.npmrc
echo "//registry.npmjs.org/:_authToken=$TOKEN" >> ~/.npmrc
```

**Branch protection**: Direct push to main blocked. Create release branch + PR, use `gh pr merge --squash --auto`. Tags can be pushed directly.

**Exports field required** — `types` must come first:

```json
"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", "require": "./dist/index.js" } }
```

**Smoke tests**: Use isolated temp dir with `.npmrc` sentinel to prevent workspace contamination.

**API shape**: `result.output`, `result.success`, `result.exitCode`. Language discovery: `getInstalledLanguages()`.

## CI/CD Rules

- **NEVER** use `--admin` to bypass branch protection
- **NEVER** force-merge while CI runs
- Use `gh pr merge --squash --auto` and wait
- If CI doesn't trigger after push, check for merge conflicts: `gh api "repos/$REPO/pulls/<PR>" --jq '{mergeable, mergeable_state}'`. Fix: rebase onto main, force-push with lease.
