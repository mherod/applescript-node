import { compileScript, decompileScript } from 'applescript-node';
import { mkdir } from 'node:fs/promises';

async function ensureOutputDir() {
  await mkdir('examples/output', { recursive: true });
}

async function main() {
  console.log('\nDecompiling scripts...\n');

  await ensureOutputDir();

  // First compile a script
  const script = `tell application "Finder"
	set current_folder to desktop as text
	display dialog "Current folder: " & current_folder
end tell`;

  const compileResult = await compileScript(script, {
    outputPath: 'examples/output/decompile-test.scpt',
  });

  if (!compileResult.success) {
    console.error('❌ Failed to compile test script:', compileResult.error);
    return;
  }

  console.log('✅ Test script compiled successfully');
  console.log('   Output:', compileResult.outputPath);

  // Now decompile it
  const decompileResult = await decompileScript(compileResult.outputPath);

  if (decompileResult.success) {
    console.log('\n✅ Script decompiled successfully');
    console.log('Source code:\n');
    console.log(decompileResult.source);
  } else {
    console.error('\n❌ Failed to decompile script:', decompileResult.error);
  }

  // Try decompiling a non-existent script
  console.log('\nTrying to decompile non-existent script...');
  const badResult = await decompileScript('does-not-exist.scpt');

  if (!badResult.success) {
    console.log('✅ Error handled correctly:', badResult.error);
  }

  // Try decompiling an execute-only script
  console.log('\nTrying to decompile execute-only script...');
  const execOnlyResult = await compileScript(script, {
    outputPath: 'examples/output/execute-only.scpt',
    executeOnly: true,
  });

  if (execOnlyResult.success) {
    const decompileExecOnly = await decompileScript(execOnlyResult.outputPath);
    if (!decompileExecOnly.success) {
      console.log('✅ Execute-only error handled correctly:', decompileExecOnly.error);
    }
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
