#!/usr/bin/env node
/**
 * validate-dependencies.js — intentional no-op for tooling compatibility.
 *
 * Purpose in a monorepo: verify that dependencies declared across workspace
 * packages are consistent — e.g., that two packages depending on the same
 * library use the same version, and that cross-package references are
 * correctly listed as workspace:* rather than pinned semver ranges.
 *
 * Why this is a no-op here: applescript-node is a single-package repository
 * with no pnpm workspaces. There are no cross-package dependency graphs to
 * validate. The stub exists so that pre-commit tooling expecting this file
 * does not error on a missing path.
 *
 * Replace with a real implementation when:
 *   - The project adds a pnpm-workspace.yaml and splits into multiple packages
 *   - Shared dependency version drift becomes a risk worth automating
 */
process.exit(0);
