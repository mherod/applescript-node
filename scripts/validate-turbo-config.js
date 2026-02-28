#!/usr/bin/env node
/**
 * validate-turbo-config.js — intentional no-op for tooling compatibility.
 *
 * Purpose in a Turborepo project: parse and validate turbo.json to catch
 * misconfigured pipelines, missing task declarations, or invalid options
 * before they cause silent CI failures.
 *
 * Why this is a no-op here: applescript-node is a single-package repository
 * with no turbo.json and no Turborepo dependency. The stub exists so that
 * pre-commit tooling expecting this file does not error on a missing path.
 *
 * Replace with a real implementation when:
 *   - Turborepo is added to the project (pnpm add -D turbo)
 *   - A turbo.json pipeline is created at the repo root
 */
process.exit(0);
