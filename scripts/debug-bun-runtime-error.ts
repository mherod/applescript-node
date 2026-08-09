/**
 * Does a failed run look the same under the Bun runtime as under Node's?
 *
 * The Node runtime goes through promisify(child_process.exec), which prefixes
 * the thrown message with `Command failed: <cmd>`. The Bun runtime throws the
 * raw stderr instead. Anything parsing that text has to cope with both, so this
 * probe prints exactly what each shape is.
 *
 * Run: bun scripts/debug-bun-runtime-error.ts
 */

import { runScript } from '../src/index.bun.js';
import { parseAppleScriptError } from '../src/helpers.js';

console.log('=== live run under the Bun runtime ===');
const result = await runScript('tell application "NoSuchApp" to activate');
console.log('success:', result.success, ' exitCode:', result.exitCode);

if (!result.success) {
  const lines = result.error.split('\n');
  console.log('error lines:', lines.length);
  lines.forEach((line, index) => {
    console.log(`  [${index}] ${JSON.stringify(line)}`);
  });
  console.log('has "Command failed:" preamble:', result.error.startsWith('Command failed:'));
  console.log('parsed:', parseAppleScriptError(result.error), '  <-- expected a diagnostic');
}

console.log('\n=== both shapes through the parser ===');
const diagnostic = '32:40: execution error: Can’t get application "NoSuchApp". (-1728)';

const nodeShape = `Command failed: osascript -s h -e 'x'\n${diagnostic}\n`;
console.log('node shape  ->', parseAppleScriptError(nodeShape)?.errorNumber, ' <-- expected -1728');

const bunShape = `${diagnostic}\n`;
console.log('bun shape   ->', parseAppleScriptError(bunShape)?.errorNumber, ' <-- expected -1728');
