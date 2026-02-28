#!/usr/bin/env tsx
/**
 * validate-turbo-deps.ts — intentional no-op for tooling compatibility.
 *
 * Purpose in a Turborepo project: walk the task dependency graph defined in
 * turbo.json and assert that every task's inputs, outputs, and dependsOn
 * entries are valid — catching graph cycles, orphaned tasks, or missing
 * pipeline declarations before they break incremental builds.
 *
 * Why this is a no-op here: applescript-node is a single-package repository
 * with no Turborepo pipeline. The stub exists so that pre-commit tooling
 * expecting this file does not error on a missing path.
 *
 * Replace with a real implementation when:
 *   - Turborepo is adopted and turbo.json defines a non-trivial pipeline
 *   - The dependency graph grows complex enough that silent misconfiguration
 *     becomes a realistic risk
 */
process.exit(0);
