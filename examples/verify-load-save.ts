import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScript } from 'applescript-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('=== Verify Load → Save Cycle ===\n');

  const testFiles = [
    'calculator-addition.applescript',
    'calculator-complex.applescript',
    'contacts-list.applescript',
    'notes-latest-json.applescript',
  ];

  for (const filename of testFiles) {
    console.log(`Testing: ${filename}`);
    console.log('─'.repeat(60));

    // 1. Read original file
    const originalPath = join(__dirname, 'output', filename);
    const originalContent = await readFile(originalPath, 'utf-8');

    // 2. Load into builder
    const builder = await loadScript(originalPath);

    // 3. Build (without any modifications)
    const rebuiltContent = builder.build();

    // 4. Save to temporary file
    const tempPath = join(__dirname, 'output', `temp-${filename}`);
    await writeFile(tempPath, rebuiltContent, 'utf-8');

    // 5. Read back the saved file
    const savedContent = await readFile(tempPath, 'utf-8');

    // 6. Compare
    const originalLines = originalContent.split('\n');
    const savedLines = savedContent.split('\n');

    console.log(`Original: ${originalLines.length} lines, ${originalContent.length} chars`);
    console.log(`Saved:    ${savedLines.length} lines, ${savedContent.length} chars`);

    const isIdentical = originalContent === savedContent;
    console.log(`Match:    ${isIdentical ? '✓ IDENTICAL' : '✗ DIFFERENT'}`);

    if (!isIdentical) {
      console.log('\nDifferences found:');

      // Show first difference
      for (let i = 0; i < Math.max(originalLines.length, savedLines.length); i++) {
        if (originalLines[i] !== savedLines[i]) {
          console.log(`  Line ${i + 1}:`);
          console.log(`    Original: "${originalLines[i] || '(missing)'}"`);
          console.log(`    Saved:    "${savedLines[i] || '(missing)'}"`);
          break;
        }
      }
    }

    console.log();
  }

  console.log('=== Verification Complete ===');
}

main().catch(console.error);
