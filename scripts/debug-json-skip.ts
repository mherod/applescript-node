/**
 * Probe: does returnAsJson() silently drop records that fail to serialize?
 *
 * Builds a list where one record is missing a mapped property, then serializes it
 * twice: once with the default (errors propagate) and once with skipErrors: true
 * (legacy lenient behaviour). Compares what each returns.
 *
 * Run: bun scripts/debug-json-skip.ts
 */
import { AppleScriptBuilder, ScriptExecutor } from '../src/index.js';

function build(skipErrors: boolean): string {
  return new AppleScriptBuilder()
    .raw('set rows to {}')
    .raw('set end of rows to {id:1, label:"ok"}')
    .raw('set end of rows to {id:2}') // no `label` -> serialization fails on this record
    .raw('set end of rows to {id:3, label:"also ok"}')
    .returnAsJson('rows', { id: 'id', label: 'label' }, { skipErrors })
    .build();
}

for (const skipErrors of [false, true]) {
  console.log(`--- skipErrors: ${skipErrors} ---`);
  const result = await ScriptExecutor.execute(build(skipErrors));
  console.log('success:', result.success, 'exitCode:', result.exitCode);
  console.log('output:', result.output);
  if (!result.success) console.log('error:', result.error);
  console.log('');
}
