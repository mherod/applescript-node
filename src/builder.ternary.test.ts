import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';

describe('AppleScriptBuilder - Ternary Operators', () => {
  describe('setTernary', () => {
    it('should generate if-then-else block with string expressions', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('temperature', 75)
        .setTernary('status', 'temperature > 80', '"hot"', '"comfortable"');

      const script = builder.build();
      expect(script).toContain('set temperature to 75');
      expect(script).toContain('if temperature > 80 then');
      expect(script).toContain('set status to "hot"');
      expect(script).toContain('else');
      expect(script).toContain('set status to "comfortable"');
      expect(script).toContain('end if');
    });

    it('should generate if-then-else block with ExprBuilder callbacks', () => {
      const builder = new AppleScriptBuilder();
      builder.set('x', 10).setTernary('result', (e) => e.gt('x', 5), '"high"', '"low"');

      const script = builder.build();
      expect(script).toContain('set x to 10');
      expect(script).toContain('if x > 5 then');
      expect(script).toContain('set result to "high"');
      expect(script).toContain('else');
      expect(script).toContain('set result to "low"');
      expect(script).toContain('end if');
    });

    it('should support complex ExprBuilder expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary(
        'personEmail',
        (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
        (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
        'missing value',
      );

      const script = builder.build();
      expect(script).toContain('if count of emails of aPerson > 0 then');
      expect(script).toContain('set personEmail to value of item 1 of emails of aPerson');
      expect(script).toContain('else');
      expect(script).toContain('set personEmail to missing value');
      expect(script).toContain('end if');
    });

    it('should handle nested property access in condition', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary(
        'hasPhone',
        (e) => e.exists(e.property('contact', 'phone')),
        'true',
        'false',
      );

      const script = builder.build();
      expect(script).toContain('if exists phone of contact then');
      expect(script).toContain('set hasPhone to true');
      expect(script).toContain('else');
      expect(script).toContain('set hasPhone to false');
      expect(script).toContain('end if');
    });

    it('should work with forEach for scoped variables', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('results', [])
        .forEach('item', '{1, 2, 3, 4, 5}', (loop) =>
          loop.setTernary('category', (e) => e.gte('item', 3), '"high"', '"low"'),
        );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with item in {1, 2, 3, 4, 5}');
      expect(script).toContain('if item >= 3 then');
      expect(script).toContain('set category to "high"');
      expect(script).toContain('else');
      expect(script).toContain('set category to "low"');
      expect(script).toContain('end if');
      expect(script).toContain('end repeat');
    });

    it('should support string type coercion in expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary(
        'birthday',
        (e) => e.exists(e.property('person', 'birth date')),
        (e) => e.asType(e.property('person', 'birth date'), 'string'),
        '""',
      );

      const script = builder.build();
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set birthday to birth date of person as string');
      expect(script).toContain('else');
      expect(script).toContain('set birthday to ""');
      expect(script).toContain('end if');
    });

    it('should handle logical operators in condition', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary(
        'valid',
        (e) => e.and(e.gt('age', 18), e.lt('age', 65)),
        '"eligible"',
        '"not eligible"',
      );

      const script = builder.build();
      expect(script).toContain('if age > 18 and age < 65 then');
      expect(script).toContain('set valid to "eligible"');
      expect(script).toContain('else');
      expect(script).toContain('set valid to "not eligible"');
      expect(script).toContain('end if');
    });

    it('should properly escape strings in expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary('message', 'x > 0', '"It\'s positive"', '"It\'s not positive"');

      const script = builder.build();
      expect(script).toContain('if x > 0 then');
      expect(script).toContain('set message to "It\'s positive"');
      expect(script).toContain('else');
      expect(script).toContain('set message to "It\'s not positive"');
      expect(script).toContain('end if');
    });

    it('should work with comparison operators', () => {
      const builder = new AppleScriptBuilder();
      builder
        .setTernary('result1', 'status = "done"', '1', '0')
        .setTernary('result2', 'status ≠ "pending"', '1', '0')
        .setTernary('result3', (e) => e.lte('count', 10), '"few"', '"many"');

      const script = builder.build();
      // First ternary
      expect(script).toContain('if status = "done" then');
      expect(script).toContain('set result1 to 1');
      // Second ternary
      expect(script).toContain('if status ≠ "pending" then');
      expect(script).toContain('set result2 to 1');
      // Third ternary
      expect(script).toContain('if count <= 10 then');
      expect(script).toContain('set result3 to "few"');
    });

    it('should support string operations in condition', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary('hasJ', (e) => e.contains('name', '"J"'), '"starts with J"', '"no J"');

      const script = builder.build();
      expect(script).toContain('if name contains "J" then');
      expect(script).toContain('set hasJ to "starts with J"');
      expect(script).toContain('else');
      expect(script).toContain('set hasJ to "no J"');
      expect(script).toContain('end if');
    });
  });

  describe('setEndTernary', () => {
    it('should append conditional value to list with string expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.set('results', []).setEndTernary('results', 'x > 10', '"large"', '"small"');

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('if x > 10 then');
      expect(script).toContain('set end of results to "large"');
      expect(script).toContain('else');
      expect(script).toContain('set end of results to "small"');
      expect(script).toContain('end if');
    });

    it('should append conditional value with ExprBuilder callbacks', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('categories', [])
        .setEndTernary('categories', (e) => e.gte('value', 1000), '"premium"', '"standard"');

      const script = builder.build();
      expect(script).toContain('set categories to {}');
      expect(script).toContain('if value >= 1000 then');
      expect(script).toContain('set end of categories to "premium"');
      expect(script).toContain('else');
      expect(script).toContain('set end of categories to "standard"');
      expect(script).toContain('end if');
    });

    it('should work within forEach loops', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('results', [])
        .forEach('item', '{100, 500, 1500, 2000, 50}', (loop) =>
          loop.setEndTernary('results', (e) => e.gte('item', 1000), '"large"', '"small"'),
        );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with item in {100, 500, 1500, 2000, 50}');
      expect(script).toContain('if item >= 1000 then');
      expect(script).toContain('set end of results to "large"');
      expect(script).toContain('else');
      expect(script).toContain('set end of results to "small"');
      expect(script).toContain('end if');
      expect(script).toContain('end repeat');
    });

    it('should support complex property expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.set('sizes', []).forEach('file', 'every file of desktop', (loop) =>
        loop.setEndTernary(
          'sizes',
          (e) => e.gt(e.property('file', 'size'), 1000000),
          (e) => e.property('file', 'size'),
          '0',
        ),
      );

      const script = builder.build();
      expect(script).toContain('set sizes to {}');
      expect(script).toContain('repeat with file in every file of desktop');
      expect(script).toContain('if size of file > 1000000 then');
      expect(script).toContain('set end of sizes to size of file');
      expect(script).toContain('else');
      expect(script).toContain('set end of sizes to 0');
      expect(script).toContain('end if');
    });

    it('should handle multiple conditional appends in sequence', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('list1', [])
        .setEndTernary('list1', 'a > 5', '10', '5')
        .setEndTernary('list1', 'b < 3', '1', '0')
        .setEndTernary('list1', 'c = 0', '"-1"', '"1"');

      const script = builder.build();
      expect(script).toContain('set list1 to {}');
      // First ternary
      expect(script).toContain('if a > 5 then');
      expect(script).toContain('set end of list1 to 10');
      // Second ternary
      expect(script).toContain('if b < 3 then');
      expect(script).toContain('set end of list1 to 1');
      // Third ternary
      expect(script).toContain('if c = 0 then');
      expect(script).toContain('set end of list1 to "-1"');
    });

    it('should work with forEachUntil for conditional iteration', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('filtered', [])
        .set('counter', 0)
        .forEachUntil(
          'item',
          'every file of desktop',
          (e) => e.gte('counter', 10),
          (loop) =>
            loop
              .increment('counter')
              .setEndTernary(
                'filtered',
                (e) => e.gt(e.property('item', 'size'), 1000000),
                '"large"',
                '"small"',
              ),
        );

      const script = builder.build();
      expect(script).toContain('set filtered to {}');
      expect(script).toContain('set counter to 0');
      expect(script).toContain('repeat with item in every file of desktop');
      expect(script).toContain('if counter >= 10 then');
      expect(script).toContain('exit repeat');
      expect(script).toContain('set counter to counter + 1');
      expect(script).toContain('if size of item > 1000000 then');
      expect(script).toContain('set end of filtered to "large"');
    });

    it('should combine with tryCatch for error handling', () => {
      const builder = new AppleScriptBuilder();
      builder.set('results', []).forEach('item', 'collection', (loop) =>
        loop.tryCatch(
          (tryBlock) =>
            tryBlock.setEndTernary(
              'results',
              (e) => e.exists(e.property('item', 'value')),
              (e) => e.property('item', 'value'),
              'missing value',
            ),
          (catchBlock) => catchBlock.comment('Skip errors'),
        ),
      );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with item in collection');
      expect(script).toContain('try');
      expect(script).toContain('if exists value of item then');
      expect(script).toContain('set end of results to value of item');
      expect(script).toContain('else');
      expect(script).toContain('set end of results to missing value');
      expect(script).toContain('end if');
      expect(script).toContain('on error');
      expect(script).toContain('-- Skip errors');
      expect(script).toContain('end try');
    });

    it('should support type coercion in expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.set('dates', []).forEach('person', 'every person', (loop) =>
        loop.setEndTernary(
          'dates',
          (e) => e.exists(e.property('person', 'birth date')),
          (e) => e.asType(e.property('person', 'birth date'), 'string'),
          '""',
        ),
      );

      const script = builder.build();
      expect(script).toContain('set dates to {}');
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set end of dates to birth date of person as string');
      expect(script).toContain('else');
      expect(script).toContain('set end of dates to ""');
      expect(script).toContain('end if');
    });
  });

  describe('Integration Tests', () => {
    it('should combine setTernary with setEndRecord', () => {
      const builder = new AppleScriptBuilder();
      builder.set('contacts', []).forEach('person', 'every person', (loop) =>
        loop
          .setTernary(
            'email',
            (e) => e.gt(e.count(e.property('person', 'emails')), 0),
            (e) => e.valueOfItem(1, e.property('person', 'emails')),
            'missing value',
          )
          .setEndRecord('contacts', {
            name: 'name of person',
            email: 'email',
          }),
      );

      const script = builder.build();
      expect(script).toContain('set contacts to {}');
      expect(script).toContain('repeat with person in every person');
      expect(script).toContain('if count of emails of person > 0 then');
      expect(script).toContain('set email to value of item 1 of emails of person');
      expect(script).toContain('else');
      expect(script).toContain('set email to missing value');
      expect(script).toContain('end if');
      expect(script).toContain('set end of contacts to {name:name of person, email:email}');
    });

    it('should work in nested forEach loops', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('results', [])
        .forEach('account', 'every account', (outer) =>
          outer.forEach('note', 'notes of account', (inner) =>
            inner.setTernary(
              'content',
              (e) => e.gt(e.length('plaintext of note'), 100),
              'text 1 thru 100 of plaintext of note & "..."',
              'plaintext of note',
            ),
          ),
        );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with account in every account');
      expect(script).toContain('repeat with note in notes of account');
      expect(script).toContain('if length of plaintext of note > 100 then');
      expect(script).toContain('set content to text 1 thru 100 of plaintext of note & "..."');
      expect(script).toContain('else');
      expect(script).toContain('set content to plaintext of note');
      expect(script).toContain('end if');
      expect(script).toContain('end repeat'); // Should have two of these
    });

    it('should work with ifThenElse for complex conditional logic', () => {
      const builder = new AppleScriptBuilder();
      builder.set('value', 50).ifThenElse(
        (e) => e.gt('value', 100),
        (then_) => then_.setTernary('category', 'value > 200', '"very high"', '"high"'),
        (else_) => else_.setTernary('category', 'value > 25', '"medium"', '"low"'),
      );

      const script = builder.build();
      expect(script).toContain('set value to 50');
      expect(script).toContain('if value > 100 then');
      // Nested ternary in then branch
      expect(script).toContain('if value > 200 then');
      expect(script).toContain('set category to "very high"');
      expect(script).toContain('set category to "high"');
      expect(script).toContain('else');
      // Nested ternary in else branch
      expect(script).toContain('if value > 25 then');
      expect(script).toContain('set category to "medium"');
      expect(script).toContain('set category to "low"');
      expect(script).toContain('end if');
    });

    it('should maintain proper indentation in nested structures', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .forEach('person', 'every person', (loop) =>
          loop
            .setTernary(
              'email',
              'count of emails of person > 0',
              'value of item 1 of emails of person',
              'missing value',
            )
            .ifThen(
              (e) => e.ne('email', 'missing value'),
              (then_) => then_.setEndTernary('validEmails', 'true', 'email', '""'),
            ),
        )
        .endtell();

      const script = builder.build();
      const lines = script.split('\n');

      // Check indentation levels
      expect(lines[0]).toBe('tell application "Contacts"');
      expect(lines[1]).toMatch(/^ {2}repeat with person/);
      // Ternary block
      expect(lines[2]).toMatch(/^ {4}if count of emails/);
      expect(lines[3]).toMatch(/^ {6}set email to value of item 1/);
      expect(lines[4]).toMatch(/^ {4}else/);
      expect(lines[5]).toMatch(/^ {6}set email to missing value/);
      expect(lines[6]).toMatch(/^ {4}end if/);
    });

    it('should support real-world contact extraction pattern', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .set('contactsList', [])
        .forEach('aPerson', 'every person', (loop) =>
          loop.tryCatch(
            (tryBlock) =>
              tryBlock
                .setTernary(
                  'personEmail',
                  (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
                  (e) => e.valueOfItem(1, e.property('aPerson', 'emails')),
                  'missing value',
                )
                .setTernary(
                  'personPhone',
                  (e) => e.gt(e.count(e.property('aPerson', 'phones')), 0),
                  (e) => e.valueOfItem(1, e.property('aPerson', 'phones')),
                  'missing value',
                )
                .setEndRecord('contactsList', {
                  name: 'name of aPerson',
                  email: 'personEmail',
                  phone: 'personPhone',
                }),
            (catchBlock) => catchBlock.comment('Skip contacts with errors'),
          ),
        )
        .endtell();

      const script = builder.build();
      expect(script).toContain('tell application "Contacts"');
      expect(script).toContain('set contactsList to {}');
      expect(script).toContain('repeat with aPerson in every person');
      expect(script).toContain('try');
      // Email ternary
      expect(script).toContain('if count of emails of aPerson > 0 then');
      expect(script).toContain('set personEmail to value of item 1 of emails of aPerson');
      expect(script).toContain('else');
      expect(script).toContain('set personEmail to missing value');
      // Phone ternary
      expect(script).toContain('if count of phones of aPerson > 0 then');
      expect(script).toContain('set personPhone to value of item 1 of phones of aPerson');
      expect(script).toContain('set personPhone to missing value');
      // Record
      expect(script).toContain(
        'set end of contactsList to {name:name of aPerson, email:personEmail, phone:personPhone}',
      );
      expect(script).toContain('on error');
      expect(script).toContain('-- Skip contacts with errors');
      expect(script).toContain('end try');
      expect(script).toContain('end repeat');
      expect(script).toContain('end tell');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing value in both branches', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary('result', 'exists item', 'missing value', 'missing value');

      const script = builder.build();
      expect(script).toContain('if exists item then');
      expect(script).toContain('set result to missing value');
      expect(script).toContain('else');
      expect(script).toContain('end if');
    });

    it('should handle numeric expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary('value', (e) => e.gt('x', 0), 'x * 2', 'x / 2');

      const script = builder.build();
      expect(script).toContain('if x > 0 then');
      expect(script).toContain('set value to x * 2');
      expect(script).toContain('else');
      expect(script).toContain('set value to x / 2');
      expect(script).toContain('end if');
    });

    it('should handle boolean literals', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary('flag', 'count > 0', 'true', 'false');

      const script = builder.build();
      expect(script).toContain('if count > 0 then');
      expect(script).toContain('set flag to true');
      expect(script).toContain('else');
      expect(script).toContain('set flag to false');
      expect(script).toContain('end if');
    });

    it('should handle complex nested property paths', () => {
      const builder = new AppleScriptBuilder();
      builder.setTernary(
        'value',
        (e) => e.exists(e.property('record', 'nested property')),
        (e) => e.property(e.property('record', 'nested property'), 'value'),
        '0',
      );

      const script = builder.build();
      expect(script).toContain('if exists nested property of record then');
      expect(script).toContain('set value to value of nested property of record');
      expect(script).toContain('else');
      expect(script).toContain('set value to 0');
      expect(script).toContain('end if');
    });
  });
});
