import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppleScriptBuilder } from 'applescript-node';
import { loadScript, runScript } from 'applescript-node';

async function main() {
  console.log('=== Load and Edit Script Example ===\n');

  // Example 1: Load an existing script and rebuild it
  console.log('Example 1: Loading and rebuilding calculator-addition.applescript');
  const calculatorScriptPath = join(__dirname, 'output', 'calculator-addition.applescript');

  const builder1: AppleScriptBuilder = await loadScript(calculatorScriptPath);
  const rebuiltScript = builder1.build();

  console.log('Original script loaded and rebuilt successfully!');
  console.log('First few lines:');
  console.log(rebuiltScript.split('\n').slice(0, 5).join('\n'));
  console.log('...\n');

  // Example 2: Load a script and append new commands
  console.log('Example 2: Loading and extending a script');

  const builder2: AppleScriptBuilder = await loadScript(calculatorScriptPath);

  // Append new commands to the existing script
  builder2
    .raw('-- Extended by loadScript example')
    .tell('System Events')
    .displayDialog('Calculator script completed!', {
      buttons: ['OK'],
      defaultButton: 'OK',
    })
    .endtell();

  const extendedScript = builder2.build();

  console.log('Script extended with new commands!');
  console.log('\nExtended script (last 10 lines):');
  const lines = extendedScript.split('\n');
  console.log(lines.slice(Math.max(0, lines.length - 10)).join('\n'));
  console.log();

  // Save the extended script
  const outputPath = join(__dirname, 'output', 'calculator-extended.applescript');
  await writeFile(outputPath, extendedScript, 'utf-8');
  console.log(`Extended script saved to: ${outputPath}\n`);

  // Example 3: Load a complex script with handlers
  console.log('Example 3: Loading complex script with handlers');
  const contactsScriptPath = join(__dirname, 'output', 'contacts-list.applescript');

  const builder3: AppleScriptBuilder = await loadScript(contactsScriptPath);

  // Append a comment
  builder3.comment('Loaded and verified via loadScript');

  const complexScript = builder3.build();

  console.log('Complex script with handlers loaded successfully!');
  console.log('Handler names found:');
  const handlerMatches = complexScript.match(/^on \w+/gm);
  if (handlerMatches) {
    handlerMatches.forEach((handler) => console.log(`  - ${handler}`));
  }
  console.log();

  // Example 4: Load, modify, and execute a simple script
  console.log('Example 4: Load, modify, and execute');

  // Create a simple script to load
  const simpleScriptPath = join(__dirname, 'output', 'simple-test.applescript');
  const simpleScriptContent = `tell application "Finder"
  set diskNames to name of every disk
end tell`;

  await writeFile(simpleScriptPath, simpleScriptContent, 'utf-8');

  // Load the script
  const builder4: AppleScriptBuilder = await loadScript(simpleScriptPath);

  // Add a return statement
  builder4.returnRaw('diskNames');

  // Execute the modified script
  console.log('Executing modified script...');
  const result = await runScript(builder4);

  if (result.success) {
    console.log('Disk names:', result.output);
  } else {
    console.error('Error:', result.error);
  }
  console.log();

  // Example 5: Demonstrate load-modify-save-load cycle
  console.log('Example 5: Load-modify-save-load cycle');

  const cycleScriptPath = join(__dirname, 'output', 'cycle-test.applescript');

  // Initial script
  const initialScript = `set counter to 0
log "Initial script"`;

  await writeFile(cycleScriptPath, initialScript, 'utf-8');

  // First load and modify
  const builder5a: AppleScriptBuilder = await loadScript(cycleScriptPath);
  builder5a.raw('set counter to counter + 1').raw('log "First modification"');

  const modifiedOnce = builder5a.build();
  await writeFile(cycleScriptPath, modifiedOnce, 'utf-8');

  console.log('After first modification:');
  console.log(modifiedOnce);
  console.log();

  // Second load and modify
  const builder5b: AppleScriptBuilder = await loadScript(cycleScriptPath);
  builder5b.raw('set counter to counter + 1').raw('log "Second modification"');

  const modifiedTwice = builder5b.build();

  console.log('After second modification:');
  console.log(modifiedTwice);
  console.log();

  console.log('=== All examples completed! ===');
}

main().catch(console.error);
