import { writeFileSync } from 'node:fs';
import chalk from 'chalk';
import { createScript } from '../src/index.js';

/**
 * Demonstrates the setIfExists and setEndIfExists convenience methods.
 *
 * These methods simplify the common pattern of:
 * 1. Check if a property exists
 * 2. If it exists, optionally convert it to a type
 * 3. If it doesn't exist, use a default value
 */

console.log(chalk.bold.blue('\n📦 If-Exists Pattern Demo\n'));
console.log(chalk.gray('Demonstrates setIfExists and setEndIfExists convenience methods.\n'));

// ========================================
// Example 1: Basic if-exists pattern
// ========================================
console.log(chalk.bold.yellow('Example 1: Basic Property Existence Check\n'));

const basicScript = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  // Check if birth date exists, convert to string, or use default
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .comment('personBirthday now contains either the birth date as string or "missing value"')
  .endrepeat()
  .endtell();

console.log(chalk.white('Basic if-exists pattern:'));
console.log(chalk.dim(basicScript.build()));

// Write to file
writeFileSync('examples/output/if-exists-basic.applescript', basicScript.build());
console.log(chalk.green('✓ Script written to examples/output/if-exists-basic.applescript\n'));

// ========================================
// Example 2: Comparison - Old Way vs New Way
// ========================================
console.log(chalk.bold.yellow('Example 2: Comparing Old and New Approaches\n'));

// OLD WAY: Using setTernary (verbose)
const oldWayScript = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  .setTernary(
    'personBirthday',
    (e) => e.exists(e.property('aPerson', 'birth date')),
    (e) => e.asType(e.property('aPerson', 'birth date'), 'string'),
    'missing value',
  )
  .endrepeat()
  .endtell();

console.log(chalk.white('OLD WAY (setTernary):'));
console.log(chalk.dim(oldWayScript.build()));

// NEW WAY: Using setIfExists (concise)
const newWayScript = createScript()
  .tell('Contacts')
  .repeatWith('aPerson', 'every person')
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .endrepeat()
  .endtell();

console.log(chalk.white('\nNEW WAY (setIfExists):'));
console.log(chalk.dim(newWayScript.build()));
console.log(chalk.green('\n✓ Produces identical AppleScript, but cleaner API\n'));

// ========================================
// Example 3: Multiple optional fields
// ========================================
console.log(chalk.bold.yellow('Example 3: Handling Multiple Optional Fields\n'));

const multipleFieldsScript = createScript()
  .tell('Contacts')
  .set('contactsList', [])
  .repeatWith('aPerson', 'every person')
  // Handle multiple optional fields
  .setIfExists('personEmail', (e) => e.property('aPerson', 'email'), 'missing value')
  .setIfExists('personPhone', (e) => e.property('aPerson', 'phone'), 'missing value')
  .setIfExists(
    'personBirthday',
    (e) => e.property('aPerson', 'birth date'),
    'missing value',
    'string',
  )
  .setIfExists('personNote', (e) => e.property('aPerson', 'note'), 'missing value')
  // Build record from the variables
  .setEndRecord('contactsList', {
    name: 'name of aPerson',
    email: 'personEmail',
    phone: 'personPhone',
    birthday: 'personBirthday',
    note: 'personNote',
  })
  .endrepeat()
  .returnAsJson('contactsList', {
    name: 'name',
    email: 'email',
    phone: 'phone',
    birthday: 'birthday',
    note: 'note',
  })
  .endtell();

console.log(chalk.white('Handling multiple optional fields:'));
console.log(chalk.dim(multipleFieldsScript.build()));

writeFileSync('examples/output/if-exists-multiple.applescript', multipleFieldsScript.build());
console.log(chalk.green('✓ Script written to examples/output/if-exists-multiple.applescript\n'));

// ========================================
// Example 4: setEndIfExists for list building
// ========================================
console.log(chalk.bold.yellow('Example 4: Building Lists with setEndIfExists\n'));

const listBuildingScript = createScript()
  .tell('Notes')
  .set('notesList', [])
  .repeatWith('aNote', 'every note')
  // Append to list only if property exists, with type conversion
  .setEndIfExists(
    'notesList',
    (e) => e.property('aNote', 'creation date'),
    'missing value',
    'string',
  )
  .endrepeat()
  .returnRaw('notesList')
  .endtell();

console.log(chalk.white('Building lists with conditional values:'));
console.log(chalk.dim(listBuildingScript.build()));

writeFileSync('examples/output/if-exists-list.applescript', listBuildingScript.build());
console.log(chalk.green('✓ Script written to examples/output/if-exists-list.applescript\n'));

// ========================================
// Example 5: Without type conversion
// ========================================
console.log(chalk.bold.yellow('Example 5: Without Type Conversion\n'));

const noTypeConversionScript = createScript()
  .tell('Finder')
  .repeatWith('aFile', 'every file of desktop')
  // Use property as-is without type conversion
  .setIfExists('fileComment', (e) => e.property('aFile', 'comment'), '""')
  .endrepeat()
  .endtell();

console.log(chalk.white('Using property without type conversion:'));
console.log(chalk.dim(noTypeConversionScript.build()));

writeFileSync('examples/output/if-exists-no-type.applescript', noTypeConversionScript.build());
console.log(chalk.green('✓ Script written to examples/output/if-exists-no-type.applescript\n'));

// ========================================
// Example 6: Integration with forEach and tryCatch
// ========================================
console.log(chalk.bold.yellow('Example 6: Integration with forEach and tryCatch\n'));

const integrationScript = createScript()
  .tell('Notes')
  .set('notesList', [])
  .forEach('aNote', 'every note', (b) =>
    b.tryCatch(
      (tryBlock) =>
        tryBlock
          // Handle optional fields within try-catch
          .setIfExists('notePlaintext', (e) => e.property('aNote', 'plaintext'), 'missing value')
          .setIfExists(
            'noteCreation',
            (e) => e.property('aNote', 'creation date'),
            'missing value',
            'string',
          )
          .setIfExists(
            'noteModification',
            (e) => e.property('aNote', 'modification date'),
            'missing value',
            'string',
          )
          .setEndRecord('notesList', {
            name: 'name of aNote',
            plaintext: 'notePlaintext',
            created: 'noteCreation',
            modified: 'noteModification',
          }),
      (catchBlock) => catchBlock.comment('Skip notes with errors'),
    ),
  )
  .returnAsJson('notesList', {
    name: 'name',
    plaintext: 'plaintext',
    created: 'created',
    modified: 'modified',
  })
  .endtell();

console.log(chalk.white('Integration with forEach and tryCatch:'));
console.log(chalk.dim(integrationScript.build()));

writeFileSync('examples/output/if-exists-integration.applescript', integrationScript.build());
console.log(chalk.green('✓ Script written to examples/output/if-exists-integration.applescript\n'));

// ========================================
// Summary
// ========================================
console.log(chalk.bold.cyan('💡 Key Benefits of setIfExists:\n'));
console.log(chalk.gray('✓ Reduces boilerplate code for existence checks'));
console.log(chalk.gray('✓ Self-documenting - method name clearly shows intent'));
console.log(chalk.gray('✓ Built-in type conversion support'));
console.log(chalk.gray('✓ Consistent default value handling'));
console.log(chalk.gray('✓ Integrates seamlessly with other builder methods'));
console.log(chalk.gray('✓ Type-safe with full TypeScript support\n'));

console.log(chalk.bold.green('✓ If-Exists pattern demo complete!\n'));
