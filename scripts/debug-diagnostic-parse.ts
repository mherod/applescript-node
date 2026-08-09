/**
 * Does parseAppleScriptError handle every shape debug-script-error-shape.ts found?
 *
 * Runs the same failing scripts for real and prints what the parser extracted, so
 * the parser is checked against live osascript output rather than fixtures copied
 * by hand.
 *
 * Run: bun scripts/debug-diagnostic-parse.ts
 */

import { parseAppleScriptError, runScriptOrThrow, ScriptExecutionError } from '../src/helpers.js';
import type { OsaScriptOptions } from '../src/types.js';

const cases: { label: string; script: string; options?: OsaScriptOptions }[] = [
  { label: 'syntax error', script: 'this is not valid applescript at all' },
  { label: 'runtime error', script: 'tell application "NoSuchApp" to activate' },
  { label: 'explicit error with number', script: 'error "deliberate failure" number 42' },
  { label: 'explicit error without number', script: 'error "plain failure"' },
  { label: 'message containing parentheses', script: 'error "failed (twice) (already)" number 7' },
  { label: 'message containing a newline', script: 'error "line one" & return & "line two"' },
  {
    label: 'jxa thrown error (no offsets)',
    script: 'throw new Error("jxa boom")',
    options: { language: 'JavaScript' },
  },
  {
    label: 'jxa syntax error',
    script: 'this is not ( valid javascript',
    options: { language: 'JavaScript' },
  },
];

for (const { label, script, options } of cases) {
  console.log(`\n=== ${label} ===`);
  try {
    await runScriptOrThrow(script, options);
    console.log('  !! expected a failure, got success');
  } catch (error) {
    if (!(error instanceof ScriptExecutionError)) throw error;

    console.log('  message:    ', JSON.stringify(error.message));
    console.log('  errorNumber:', error.errorNumber);
    console.log('  kind:       ', error.diagnostic?.kind);
    console.log('  offsets:    ', error.diagnostic?.start, '->', error.diagnostic?.end);
    console.log('  raw:        ', JSON.stringify(error.diagnostic?.raw));
  }
}

console.log('\n=== no diagnostic present ===');
const noDiagnostic = parseAppleScriptError(
  'Command failed: osascript -s h "/tmp/nope.scpt"\nosascript: /tmp/nope.scpt: No such file or directory\n',
);
console.log('  parsed:', noDiagnostic, ' <-- expected undefined');

console.log('\n=== empty input ===');
console.log('  parsed:', parseAppleScriptError(''), ' <-- expected undefined');
