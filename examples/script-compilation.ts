import { compileScript, compileScriptFile, runScriptFile } from 'applescript-node';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureExamplesOutputDir } from './utils/output.js';

async function main() {
  console.log('\nCompiling scripts...\n');

  await ensureExamplesOutputDir();

  // Compile a script string to a .scpt file
  const script = `tell application "Finder"
	set current_folder to desktop as text
	display dialog "Current folder: " & current_folder
end tell`;

  const compileResult = await compileScript(script, {
    outputPath: 'examples/output/finder-dialog.scpt',
  });

  if (compileResult.success) {
    console.log('✅ Script compiled successfully');
    console.log('   Output:', compileResult.outputPath);

    // Run the compiled script
    const runResult = await runScriptFile(compileResult.outputPath);
    if (runResult.success) {
      console.log('✅ Script executed successfully');
      console.log('   Result:', runResult.output);
    } else {
      console.error('❌ Script execution failed:', runResult.error);
    }
  } else {
    console.error('❌ Compilation failed:', compileResult.error);
  }

  // Create and compile a bundled script (.scptd)
  const stayOpenScript = `on run
	display dialog "Script is running..."
end run

on idle
	display notification "Still alive!" with title "Stay-Open Script"
	return 60 -- Run idle handler every 60 seconds
end idle`;

  console.log('\nCreating stay-open script...\n');

  // Save source first
  const sourcePath = 'examples/output/stay-open.applescript';
  await writeFile(sourcePath, stayOpenScript, 'utf8');

  // Compile as stay-open application
  const bundleResult = await compileScriptFile(sourcePath, {
    outputPath: join('examples/output/StayOpen.app'),
    stayOpen: true,
    useStartupScreen: true,
  });

  if (bundleResult.success) {
    console.log('✅ Stay-open script compiled successfully');
    console.log('   Output:', bundleResult.outputPath);
  } else {
    console.error('❌ Bundle compilation failed:', bundleResult.error);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
