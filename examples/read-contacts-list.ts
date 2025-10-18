import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScript } from 'applescript-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('=== Reading contacts-list.applescript Example ===\n');

  const scriptPath = join(__dirname, 'output', 'contacts-list.applescript');

  // Read the file content
  const scriptContent = await readFile(scriptPath, 'utf-8');

  console.log('Script Information:');
  console.log(`File: ${scriptPath}`);
  console.log(`Size: ${scriptContent.length} characters`);
  console.log(`Lines: ${scriptContent.split('\n').length}`);
  console.log();

  // Use loadFromScript to parse it into a builder
  const builder = createScript();
  builder.loadFromScript(scriptContent);

  console.log('Script Structure Analysis:');
  console.log('-------------------------');

  // Analyze the script content
  const lines = scriptContent.split('\n');

  // Count handler definitions
  const handlers = lines.filter((line) => line.trim().startsWith('on ')).length;
  console.log(`Handler Functions: ${handlers}`);

  // Find handler names
  const handlerNames = lines
    .filter((line) => line.trim().startsWith('on '))
    .map((line) => {
      const match = /on (\w+)/.exec(line);
      return match ? match[1] : '';
    })
    .filter((name) => name);

  console.log(`Handler Names: ${handlerNames.join(', ')}`);
  console.log();

  // Count tell blocks
  const tellBlocks = lines.filter((line) => line.trim().toLowerCase().startsWith('tell ')).length;
  console.log(`Tell Blocks: ${tellBlocks}`);

  // Count repeat blocks
  const repeatBlocks = lines.filter((line) => line.trim().startsWith('repeat ')).length;
  console.log(`Repeat Blocks: ${repeatBlocks}`);

  // Count try blocks
  const tryBlocks = lines.filter((line) => line.trim() === 'try').length;
  console.log(`Try Blocks: ${tryBlocks}`);
  console.log();

  // Show first few lines
  console.log('Script Preview (first 20 lines):');
  console.log('--------------------------------');
  const preview = lines.slice(0, 20).join('\n');
  console.log(preview);
  console.log('...\n');

  // Now rebuild the script to verify it was parsed correctly
  const rebuiltScript = builder.build();

  console.log('Verification:');
  console.log('------------');
  console.log(`Original length: ${scriptContent.length} characters`);
  console.log(`Rebuilt length:  ${rebuiltScript.length} characters`);
  console.log(
    `Match: ${scriptContent === rebuiltScript ? '✓ Identical' : '✗ Different (expected for loaded scripts)'}`,
  );
  console.log();

  // Demonstrate extending the loaded script
  console.log('Extending the Script:');
  console.log('--------------------');

  // Create a new builder and load the script
  const extendedBuilder = createScript();
  extendedBuilder.loadFromScript(scriptContent);

  // Add a comment at the end
  extendedBuilder.comment('Script loaded and analyzed via loadFromScript');

  const extendedScript = extendedBuilder.build();
  console.log('Added comment to end of script');
  console.log(`New length: ${extendedScript.length} characters`);
  console.log();

  console.log('=== Analysis Complete ===');
}

main().catch(console.error);
