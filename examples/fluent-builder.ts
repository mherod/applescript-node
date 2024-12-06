import { createScript, runScript } from 'applescript-node';

async function main() {
  // Create a new text file and write some text
  const script = createScript()
    .tell('System Events')
    // Press Cmd+N for new document
    .keystroke('n', ['command'])
    // Wait for window to open
    .delay(1)
    // Type some text
    .keystroke('Hello from applescript-node!')
    // Press Cmd+S to save
    .keystroke('s', ['command'])
    .delay(0.5)
    // Type filename
    .keystroke('example.txt')
    // Press return to save
    .keystroke('\r')
    .end();

  const result = await runScript(script);

  if (result.success) {
    console.log('Script executed successfully');
  } else {
    console.error('Error:', result.error);
  }

  // Multiple tell blocks example
  const multiScript = createScript()
    .tell('Finder')
    .raw('set desktop_path to desktop as text')
    .end()
    .tell('System Events')
    .raw('display dialog "Desktop path: " & desktop_path')
    .end();

  await runScript(multiScript);
}

main().catch(console.error);
