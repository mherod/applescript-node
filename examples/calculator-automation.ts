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
    });

  const builtScript = additionScript.build();
  writeFileSync('examples/output/calculator-addition.applescript', builtScript);

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
    });

  const builtMultiplicationScript = multiplicationScript.build();
  writeFileSync('examples/output/calculator-multiplication.applescript', builtMultiplicationScript);

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
    });

  const builtComplexScript = complexScript.build();

  writeFileSync('examples/output/calculator-complex.applescript', builtComplexScript);

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
    });

  const builtSubtractionScript = subtractionScript.build();

  writeFileSync('examples/output/calculator-subtraction.applescript', builtSubtractionScript);

  const subtractionResult = await runScript(subtractionScript);
  if (subtractionResult.success) {
    console.log('  ✓ Calculation performed (7 - 2 = 5)\n');
  } else {
    console.error(`  Error: ${subtractionResult.error}\n`);
  }

  // Example 5: Get Calculator window properties (as JSON) - using ExprBuilder
  console.log('Example 5: Get Calculator Window Info (JSON output) - Type-Safe Expressions');
  const windowInfoScript = createScript()
    .tellApp('Calculator', (app) => {
      app.activate();
    })
    .delay(0.5)
    .tellProcess('Calculator')
    // Use ExprBuilder for type-safe expressions
    .setExpression('winName', (e) => e.property('window 1', 'name'))
    .setExpression('positionList', (e) => e.property('window 1', 'position'))
    .setExpression('sizeList', (e) => e.property('window 1', 'size'))
    .setExpression('positionX', (e) => e.item(1, 'positionList'))
    .setExpression('positionY', (e) => e.item(2, 'positionList'))
    .setExpression('sizeWidth', (e) => e.item(1, 'sizeList'))
    .setExpression('sizeHeight', (e) => e.item(2, 'sizeList'))
    .end()
    .tellApp('Calculator', (app) => {
      app.quit();
    })
    .returnJsonObject({
      name: 'winName',
      positionX: 'positionX',
      positionY: 'positionY',
      sizeWidth: 'sizeWidth',
      sizeHeight: 'sizeHeight',
    });

  const builtWindowInfoScript = windowInfoScript.build();

  writeFileSync('examples/output/calculator-window-info.applescript', builtWindowInfoScript);

  const windowInfo = await runScript(windowInfoScript);
  if (!(windowInfo.success && windowInfo.output)) {
    console.error(`  Error: ${windowInfo.error}\n`);
    return;
  }

  const windowInfoData = windowInfo.output;
  console.log('  Window data (JSON):', JSON.stringify(windowInfoData, null, 2));
  console.log(`  - Name: ${windowInfoData.name}`);
  console.log(`  - Position: (${windowInfoData.positionX}, ${windowInfoData.positionY})`);
  console.log(`  - Size: ${windowInfoData.sizeWidth} × ${windowInfoData.sizeHeight}`);
  console.log();

  console.log();
  console.log('✅ Calculator automation examples completed!');
  console.log('📝 Note: Example 5 demonstrates ExprBuilder for type-safe expressions');
}

main().catch(console.error);
