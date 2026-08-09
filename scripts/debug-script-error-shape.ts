/**
 * What does a failed osascript run actually give us?
 *
 * `ScriptExecutionError.message` is whatever `child_process.exec` threw, and its
 * first line is only the shell command. This probe prints the whole message, line
 * by line, so we know which line carries the AppleScript diagnostic and whether
 * the exit code is meaningful.
 *
 * Run: bun scripts/debug-script-error-shape.ts
 */

import { runScript } from '../src/index.js';

const cases: { label: string; script: string }[] = [
  { label: 'syntax error', script: 'this is not valid applescript at all' },
  { label: 'runtime error', script: 'tell application "NoSuchApp" to activate' },
  { label: 'explicit error', script: 'error "deliberate failure" number 42' },
];

for (const { label, script } of cases) {
  console.log(`\n=== ${label} ===`);
  console.log('script:', script);

  const result = await runScript(script);
  console.log('success:', result.success, ' exitCode:', result.exitCode);

  if (result.success) {
    console.log('output:', result.output);
    continue;
  }

  const lines = result.error.split('\n');
  console.log('error lines:', lines.length);
  lines.forEach((line, index) => {
    console.log(`  [${index}] ${JSON.stringify(line)}`);
  });
}
