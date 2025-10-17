import { createScript, runScript } from '../src/index.js';

/**
 * Demonstrates the ternary operator shortcuts for conditional assignments.
 * Shows how setTernary and setEndTernary reduce verbose if-then-else blocks.
 */

console.log('=== Ternary Operator Demo ===\n');

// Example 1: Simple conditional assignment
console.log('1. Simple conditional assignment:');
const simpleScript = createScript()
  .set('temperature', 75)
  .setTernary('status', (e) => e.gt('temperature', 80), '"hot"', '"comfortable"')
  .returnRaw('status')
  .build();

console.log('Generated AppleScript:');
console.log(simpleScript);
console.log(
  "Note: setTernary generates an if-then-else block (AppleScript doesn't support inline conditionals)",
);
console.log();

const simpleResult = await runScript(simpleScript);
console.log('Result:', simpleResult.output);
console.log();

// Example 2: Complex expression with property access
console.log('2. Conditional with property access:');
const emailScript = createScript().tellApp('Contacts', (contacts) =>
  contacts
    .setExpression('aPerson', 'first person')
    .setTernary(
      'personEmail',
      (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
      (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
      'missing value',
    )
    .returnRaw('personEmail'),
);

console.log('Generated AppleScript:');
console.log(emailScript.build());
console.log();

// Example 3: Using setEndTernary to build conditional lists
console.log('3. Building list with conditional values:');
const listScript = createScript()
  .set('results', [])
  .set('items', [100, 500, 1500, 2000, 50])
  .forEach('item', 'items', (loop) =>
    loop.setEndTernary('results', (e) => e.gte('item', 1000), '"large"', '"small"'),
  )
  .returnRaw('results')
  .build();

console.log('Generated AppleScript:');
console.log(listScript);
console.log();

const listResult = await runScript(listScript);
console.log('Result:', listResult.output);
console.log();

// Example 4: Comparison - OLD vs NEW approach
console.log('4. Comparison - Verbose vs Ternary:');
console.log('\n--- OLD WAY (verbose if-then-else) ---');
const oldWay = createScript()
  .set('x', 15)
  .ifThenElse(
    (e) => e.gt('x', 10),
    (then_) => then_.set('result', 'high'),
    (else_) => else_.set('result', 'low'),
  )
  .build();
console.log(oldWay);

console.log('\n--- NEW WAY (ternary) ---');
const newWay = createScript()
  .set('x', 15)
  .setTernary('result', (e) => e.gt('x', 10), '"high"', '"low"')
  .build();
console.log(newWay);

console.log('\n✨ Much more concise!');
