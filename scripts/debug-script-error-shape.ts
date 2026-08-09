/**
 * What does a failed osascript run actually give us?
 *
 * `ScriptExecutionError.message` is whatever `child_process.exec` threw, and its
 * first line is only the shell command. This probe prints the whole message, line
 * by line, across AppleScript, JXA, and the file entry point, so any parser we
 * build is built against real formats rather than assumed ones.
 *
 * Run: bun scripts/debug-script-error-shape.ts
 */

import { runScript, runScriptFile } from '../src/index.js';
import type { OsaScriptOptions, ScriptExecutionResult } from '../src/types.js';

interface Case {
  label: string;
  script: string;
  options?: OsaScriptOptions;
  /** Use the file entry point instead of -e, to see if the shape differs. */
  viaFile?: boolean;
}

const cases: Case[] = [
  { label: 'syntax error', script: 'this is not valid applescript at all' },
  { label: 'runtime error', script: 'tell application "NoSuchApp" to activate' },
  { label: 'explicit error with number', script: 'error "deliberate failure" number 42' },
  { label: 'explicit error without number', script: 'error "plain failure"' },
  { label: 'message containing parentheses', script: 'error "failed (twice) (already)" number 7' },
  { label: 'message containing a newline', script: 'error "line one" & return & "line two"' },
  {
    label: 'jxa thrown error',
    script: 'throw new Error("jxa boom")',
    options: { language: 'JavaScript' },
  },
  {
    label: 'jxa syntax error',
    script: 'this is not ( valid javascript',
    options: { language: 'JavaScript' },
  },
  { label: 'missing file', script: '/tmp/definitely-not-a-real-script.scpt', viaFile: true },
];

for (const { label, script, options, viaFile } of cases) {
  console.log(`\n=== ${label} ===`);
  console.log('input:', JSON.stringify(script), viaFile ? '(via runScriptFile)' : '');

  const result: ScriptExecutionResult<string> = viaFile
    ? await runScriptFile(script, options)
    : await runScript(script, options);

  console.log('success:', result.success, ' exitCode:', result.exitCode);

  if (result.success) {
    console.log('output:', JSON.stringify(result.output));
    continue;
  }

  const lines = result.error.split('\n');
  console.log('error lines:', lines.length);
  lines.forEach((line, index) => {
    console.log(`  [${index}] ${JSON.stringify(line)}`);
  });
}
