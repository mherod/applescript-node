import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScript } from 'applescript-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('=== Load → Edit → Save Example ===\n');

  // 1. LOAD: Read an existing script
  const inputPath = join(__dirname, 'output', 'calculator-addition.applescript');
  console.log(`Loading script from: ${inputPath}`);

  const builder = await loadScript(inputPath);
  console.log('✓ Script loaded successfully\n');

  // 2. EDIT: Modify the script using the builder API
  console.log('Editing script...');
  builder
    .raw('-- Script modified by load-edit-save example')
    .raw('log "Script execution started"')
    .tell('System Events')
    .displayDialog('Calculator script completed!', {
      buttons: ['OK'],
      defaultButton: 'OK',
    })
    .endtell();

  console.log('✓ Added comments and notification dialog\n');

  // 3. SAVE: Write the modified script to a new file
  const outputPath = join(__dirname, 'output', 'calculator-addition-modified.applescript');
  const modifiedScript = builder.build();

  await writeFile(outputPath, modifiedScript, 'utf-8');
  console.log(`✓ Saved modified script to: ${outputPath}`);
  console.log(`  Size: ${modifiedScript.length} characters\n`);

  // Show the modifications
  console.log('Modifications added:');
  console.log('-------------------');
  const lines = modifiedScript.split('\n');
  const lastLines = lines.slice(-8);
  console.log(lastLines.join('\n'));
  console.log('\n=== Complete! ===');
}

main().catch(console.error);
