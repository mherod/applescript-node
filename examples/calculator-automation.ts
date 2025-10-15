import { writeFileSync } from 'node:fs';
import { createScript, runScript } from 'applescript-node';

async function main() {
  console.log('🧮 Calculator Automation Example\n');
  console.log('This example demonstrates UI automation with the Calculator app.');
  console.log('Watch your screen as the Calculator performs various calculations!\n');

  // Example 1: Simple Addition (5 + 3 = 8)
  console.log('Example 1: Simple Addition (5 + 3)');
  const additionScript = createScript()
    .tell('Calculator')
    .activate()
    .end()
    .delay(0.5)
    .tell('System Events')
    .tellProcess('Calculator')
    // Clear calculator first
    .keystroke('c')
    .delay(0.2)
    // Press 5
    .keystroke('5')
    .delay(0.2)
    // Press +
    .keystroke('+')
    .delay(0.2)
    // Press 3
    .keystroke('3')
    .delay(0.2)
    // Press = (return key)
    .keystroke('\r')
    .delay(0.5)
    .end()
    .end()
    .tell('Calculator')
    .quit()
    .end()
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
    .tell('Calculator')
    .activate()
    .end()
    .delay(0.5)
    .tell('System Events')
    .tellProcess('Calculator')
    // Clear calculator
    .keystroke('c')
    .delay(0.2)
    // Press 12
    .keystroke('1')
    .delay(0.1)
    .keystroke('2')
    .delay(0.2)
    // Press * (multiply)
    .keystroke('*')
    .delay(0.2)
    // Press 4
    .keystroke('4')
    .delay(0.2)
    // Press = (return key)
    .keystroke('\r')
    .delay(0.5)
    .end()
    .end()
    .tell('Calculator')
    .quit()
    .end()
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
    .tell('Calculator')
    .activate()
    .end()
    .delay(0.5)
    .tell('System Events')
    .tellProcess('Calculator')
    // Clear calculator
    .keystroke('c')
    .delay(0.2)
    // Press 25
    .keystroke('2')
    .delay(0.1)
    .keystroke('5')
    .delay(0.2)
    // Press / (divide)
    .keystroke('/')
    .delay(0.2)
    // Press 5
    .keystroke('5')
    .delay(0.2)
    // Press = to get intermediate result
    .keystroke('\r')
    .delay(0.3)
    // Press + (add)
    .keystroke('+')
    .delay(0.2)
    // Press 10
    .keystroke('1')
    .delay(0.1)
    .keystroke('0')
    .delay(0.2)
    // Press = for final result
    .keystroke('\r')
    .delay(0.5)
    .end()
    .end()
    .tell('Calculator')
    .quit()
    .end()
    .build();

  writeFileSync('examples/output/calculator-complex.applescript', complexScript);

  const complexResult = await runScript(complexScript);
  if (complexResult.success) {
    console.log('  ✓ Calculation performed (25 ÷ 5 + 10 = 15)\n');
  } else {
    console.error(`  Error: ${complexResult.error}\n`);
  }

  // Example 4: Using button clicks instead of keystrokes
  console.log('Example 4: Click Calculator Buttons (7 - 2)');
  const buttonClickScript = createScript()
    .tell('Calculator')
    .activate()
    .end()
    .delay(0.5)
    .tell('System Events')
    .tellProcess('Calculator')
    // Clear calculator
    .keystroke('c')
    .delay(0.2)
    // Enter 7 via keystroke (easier than finding button)
    .keystroke('7')
    .delay(0.2)
    // Press subtract
    .keystroke('-')
    .delay(0.2)
    // Enter 2
    .keystroke('2')
    .delay(0.2)
    // Press equals
    .keystroke('\r')
    .delay(0.5)
    .end()
    .end()
    .tell('Calculator')
    .quit()
    .end()
    .build();

  writeFileSync('examples/output/calculator-buttons.applescript', buttonClickScript);

  const buttonResult = await runScript(buttonClickScript);
  if (buttonResult.success) {
    console.log('  ✓ Calculation performed (7 - 2 = 5)\n');
  } else {
    console.error(`  Error: ${buttonResult.error}\n`);
  }

  // Example 5: Get Calculator window properties
  console.log('Example 5: Get Calculator Window Info');
  const windowInfoScript = createScript()
    .tell('Calculator')
    .activate()
    .end()
    .delay(0.5)
    .tell('System Events')
    .tellProcess('Calculator')
    .setExpression('windowName', 'name of window 1')
    .setExpression('windowPosition', 'position of window 1')
    .setExpression('windowSize', 'size of window 1')
    .setExpression(
      'info',
      '"Window: " & windowName & ", Position: " & (item 1 of windowPosition) & "," & (item 2 of windowPosition) & ", Size: " & (item 1 of windowSize) & "x" & (item 2 of windowSize)',
    )
    .end()
    .end()
    .tell('Calculator')
    .quit()
    .end()
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
