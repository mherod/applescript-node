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

  // Example 5: Get Calculator window properties
  console.log('Example 5: Get Calculator Window Info');
  const windowInfoScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    .setExpression('windowName', 'name of window 1')
    .setExpression('windowPosition', 'position of window 1')
    .setExpression('windowSize', 'size of window 1')
    .setExpression(
      'info',
      '"Window: " & windowName & ", Position: " & (item 1 of windowPosition) & "," & (item 2 of windowPosition) & ", Size: " & (item 1 of windowSize) & "x" & (item 2 of windowSize)',
    )
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .returnRaw('info')
    .build();

  writeFileSync('examples/output/calculator-window-info.applescript', windowInfoScript);

  const windowInfo = await runScript<string>(windowInfoScript);
  if (windowInfo.success) {
    console.log(`  ${windowInfo.output}\n`);
  } else {
    console.error(`  Error: ${windowInfo.error}\n`);
  }

  console.log('✅ Calculator automation examples completed!');
}

main().catch(console.error);
