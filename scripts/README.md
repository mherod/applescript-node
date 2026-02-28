# scripts/

Pre-commit hook compatibility stubs for tooling that expects these files to exist.

## Files

### `validate-turbo-config.js`

**Status: intentional no-op**

Would validate `turbo.json` configuration in a Turborepo monorepo. This project
is a single-package repository and does not use Turborepo, so no validation is
needed. The file exits 0 unconditionally.

**Replace with a real implementation when:** the project adopts Turborepo and
gains a `turbo.json` at the repo root.

---

### `validate-dependencies.js`

**Status: intentional no-op**

Would cross-check workspace dependency declarations for consistency across
packages in a monorepo. This project has a single `package.json` and no
workspaces, so there is nothing to validate. The file exits 0 unconditionally.

**Replace with a real implementation when:** the project splits into a pnpm
workspace with multiple packages that share dependencies.

---

### `validate-turbo-deps.ts`

**Status: intentional no-op**

Would walk the Turborepo task dependency graph and verify that pipeline inputs
and outputs are declared correctly. Without Turborepo this check is meaningless.
The file exits 0 unconditionally.

**Replace with a real implementation when:** Turborepo is adopted and the
pipeline in `turbo.json` grows complex enough to warrant graph validation.
