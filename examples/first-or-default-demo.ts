import { createScript, runScript } from '../src/index.js';

/**
 * Demonstrates the first-or-default shorthand methods (setFirstOf and setEndFirstOf).
 * Shows how these methods dramatically simplify the common pattern of getting the first
 * item from a collection with a fallback value.
 */

console.log('=== First-or-Default Pattern Demo ===\n');

// Example 1: Simple first-or-default with missing value
console.log('1. Basic first-or-default (defaults to missing value):');
const basicScript = createScript()
  .set('myList', [10, 20, 30])
  .set('emptyList', [])
  .setFirstOf('firstValue', 'myList')
  .setFirstOf('defaultValue', 'emptyList')
  .returnRaw('{firstValue:firstValue, defaultValue:defaultValue}')
  .build();

console.log('Generated AppleScript:');
console.log(basicScript);
console.log();

const basicResult = await runScript(basicScript);
console.log('Result:', basicResult.output);
console.log();

// Example 2: First-or-default with custom default value
console.log('2. First-or-default with custom default:');
const customDefaultScript = createScript()
  .set('numbers', [])
  .setFirstOf('value', 'numbers', '999')
  .returnRaw('value')
  .build();

console.log('Generated AppleScript:');
console.log(customDefaultScript);
console.log();

const customDefaultResult = await runScript(customDefaultScript);
console.log('Result:', customDefaultResult.output);
console.log();

// Example 3: Building lists with setEndFirstOf
console.log('3. Building lists with first-or-default pattern:');
const listBuildingScript = createScript()
  .set('results', [])
  .set('data', [
    { emails: ['alice@example.com', 'alice2@example.com'], phones: [] },
    { emails: [], phones: ['555-1234'] },
    { emails: ['bob@example.com'], phones: ['555-5678', '555-9999'] },
  ])
  .forEach('item', 'data', (loop) =>
    loop
      .setEndFirstOf('results', 'emails of item', '"no-email"')
      .setEndFirstOf('results', 'phones of item', '"no-phone"'),
  )
  .returnRaw('results')
  .build();

console.log('Generated AppleScript:');
console.log(listBuildingScript);
console.log();

const listBuildingResult = await runScript(listBuildingScript);
console.log('Result:', listBuildingResult.output);
console.log();

// Example 4: Comparison - OLD vs NEW approach
console.log('4. Comparison - Verbose Ternary vs First-or-Default:\n');
console.log('--- OLD WAY (verbose ternary, 4 lines) ---');
const oldWay = createScript()
  .set('items', ['apple', 'banana', 'cherry'])
  .setTernary(
    'firstItem',
    (e) => e.gt(e.count('items'), 0),
    (e) => e.valueOfItem(1, 'items'),
    'missing value',
  )
  .returnRaw('firstItem')
  .build();
console.log(oldWay);

console.log('\n--- NEW WAY (first-or-default, 1 line) ---');
const newWay = createScript()
  .set('items', ['apple', 'banana', 'cherry'])
  .setFirstOf('firstItem', 'items')
  .returnRaw('firstItem')
  .build();
console.log(newWay);

console.log('\n✨ 75% less code! Much more readable!\n');

// Example 5: Real-world usage with ExprBuilder
console.log('5. Real-world usage with property access:');
const realWorldScript = createScript().tellApp('Contacts', (contacts) =>
  contacts
    .setExpression('aPerson', 'first person')
    // OLD WAY - 4 lines
    .comment('OLD: setTernary with explicit condition, true expression, false expression')
    .setTernary(
      'oldEmail',
      (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
      (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
      'missing value',
    )
    // NEW WAY - 1 line
    .comment('NEW: setFirstOf with just the collection')
    .setFirstOf('newEmail', (e) => e.property('aPerson', 'emails'))
    .returnRaw('{old:oldEmail, new:newEmail}'),
);

console.log('Generated AppleScript:');
console.log(realWorldScript.build());
console.log();

// Example 6: Practical demonstration with multiple fields
console.log('6. Practical example - Extract contact details:');
const practicalScript = createScript().tellApp('Contacts', (contacts) =>
  contacts
    .set('results', [])
    .setExpression('people', 'people 1 thru (count of people min 3)')
    .forEach('aPerson', 'people', (loop) =>
      loop
        .setFirstOf('email', (e) => e.property('aPerson', 'emails'))
        .setFirstOf('phone', (e) => e.property('aPerson', 'phones'))
        .setEndRecord('results', {
          name: 'name of aPerson',
          email: 'email',
          phone: 'phone',
        }),
    )
    .returnAsJson('results', {
      name: 'name',
      email: 'email',
      phone: 'phone',
    }),
);

console.log('Generated AppleScript:');
console.log(practicalScript.build());
console.log('\n(Run this to see actual contact data extracted)\n');

// Summary
console.log('=== Summary ===');
console.log('✅ setFirstOf(variable, collection, [default])');
console.log('   - Sets variable to first item OR default');
console.log('   - Automatically checks count and extracts value');
console.log('   - Defaults to "missing value" if not specified');
console.log('');
console.log('✅ setEndFirstOf(listVariable, collection, [default])');
console.log('   - Appends first item OR default to list');
console.log('   - Perfect for building lists with first-or-default pattern');
console.log('   - Same automatic behavior as setFirstOf');
console.log('');
console.log('🎯 Benefits:');
console.log('   • 75% less code compared to setTernary');
console.log('   • More readable and intuitive');
console.log('   • Eliminates repetitive count/value extraction logic');
console.log('   • Supports both string expressions and ExprBuilder callbacks');
console.log('');
