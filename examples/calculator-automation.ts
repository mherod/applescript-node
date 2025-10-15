import { writeFileSync } from 'node:fs';
import { createScript, runScript } from 'applescript-node';

async function main() {
  console.log('🧮 Calculator Automation Example\n');
  console.log('This example demonstrates UI automation with the Calculator app.');
  console.log('Watch your screen as the Calculator performs various calculations!\n');

  // Example 1: Simple Addition (5 + 3 = 8)
  console.log('Example 1: Simple Addition (5 + 3)');
  const additionScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    // Clear calculator and perform calculation
    .keystroke('c')
    .delay(0.2)
    .keystrokes('5+3')
    .keystroke('\r')
    .delay(0.5)
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .build();

  writeFileSync('examples/output/calculator-addition.applescript', additionScript);

  const addResult = await runScript(additionScript);
  if (addResult.success) {
    console.log('  ✓ Calculation performed (5 + 3 = 8)\n');
  } else {
    console.error(`  Error: ${addResult.error}\n`);
  }

  // Example 2: Multiplication (12 * 4 = 48)
  console.log('Example 2: Multiplication (12 × 4)');
  const multiplicationScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    // Clear calculator and perform calculation
    .keystroke('c')
    .delay(0.2)
    .keystrokes('12*4')
    .keystroke('\r')
    .delay(0.5)
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .build();

  writeFileSync('examples/output/calculator-multiplication.applescript', multiplicationScript);

  const multiplyResult = await runScript(multiplicationScript);
  if (multiplyResult.success) {
    console.log('  ✓ Calculation performed (12 × 4 = 48)\n');
  } else {
    console.error(`  Error: ${multiplyResult.error}\n`);
  }

  // Example 3: Complex Calculation (25 / 5 + 10 = 15)
  console.log('Example 3: Complex Calculation (25 ÷ 5 + 10)');
  const complexScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    // Clear calculator and perform calculation
    .keystroke('c')
    .delay(0.2)
    .keystrokes('25/5')
    .keystroke('\r')
    .delay(0.3)
    .keystrokes('+10')
    .keystroke('\r')
    .delay(0.5)
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .build();

  writeFileSync('examples/output/calculator-complex.applescript', complexScript);

  const complexResult = await runScript(complexScript);
  if (complexResult.success) {
    console.log('  ✓ Calculation performed (25 ÷ 5 + 10 = 15)\n');
  } else {
    console.error(`  Error: ${complexResult.error}\n`);
  }

  // Example 4: Subtraction (7 - 2 = 5)
  console.log('Example 4: Subtraction (7 - 2)');
  const subtractionScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    // Clear calculator and perform calculation
    .keystroke('c')
    .delay(0.2)
    .keystrokes('7-2')
    .keystroke('\r')
    .delay(0.5)
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .build();

  writeFileSync('examples/output/calculator-subtraction.applescript', subtractionScript);

  const subtractionResult = await runScript(subtractionScript);
  if (subtractionResult.success) {
    console.log('  ✓ Calculation performed (7 - 2 = 5)\n');
  } else {
    console.error(`  Error: ${subtractionResult.error}\n`);
  }

  // Example 5: Get Calculator window properties (as JSON)
  console.log('Example 5: Get Calculator Window Info (JSON output)');
  const windowInfoScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    .setExpression('winName', 'name of window 1')
    .setExpression('winPosition', 'position of window 1 as text')
    .setExpression('winSize', 'size of window 1 as text')
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .returnJsonObject({
      name: 'winName',
      position: 'winPosition',
      size: 'winSize',
    })
    .build();

  writeFileSync('examples/output/calculator-window-info.applescript', windowInfoScript);

  const windowInfo = await runScript<string>(windowInfoScript);
  if (windowInfo.success) {
    const data = JSON.parse(windowInfo.output) as {
      name: string;
      position: string;
      size: string;
    };
    console.log('  Window data (JSON):', data);
    console.log(`  - Name: ${data.name}`);
    console.log(`  - Position: ${data.position}`);
    console.log(`  - Size: ${data.size}\n`);
  } else {
    console.error(`  Error: ${windowInfo.error}\n`);
  }

  console.log('✅ Calculator automation examples completed!');
}

main().catch(console.error);
