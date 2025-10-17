import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';

describe('AppleScriptBuilder - setIfExists and setEndIfExists', () => {
  describe('setIfExists', () => {
    it('should generate if-exists check with string property', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string');

      const script = builder.build();
      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set personBirthday to birth date of aPerson as string');
      expect(script).toContain('else');
      expect(script).toContain('set personBirthday to missing value');
      expect(script).toContain('end if');
    });

    it('should generate if-exists check with ExprBuilder property', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists(
        'personBirthday',
        (e) => e.property('aPerson', 'birth date'),
        'missing value',
        'string',
      );

      const script = builder.build();
      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set personBirthday to birth date of aPerson as string');
      expect(script).toContain('else');
      expect(script).toContain('set personBirthday to missing value');
      expect(script).toContain('end if');
    });

    it('should work without type conversion', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('personNote', 'note of aPerson', '""');

      const script = builder.build();
      expect(script).toContain('if exists note of aPerson then');
      expect(script).toContain('set personNote to note of aPerson');
      expect(script).toContain('else');
      expect(script).toContain('set personNote to ""');
      expect(script).toContain('end if');
    });

    it('should default to missing value if no default provided', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('personBirthday', 'birth date of aPerson');

      const script = builder.build();
      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set personBirthday to birth date of aPerson');
      expect(script).toContain('else');
      expect(script).toContain('set personBirthday to missing value');
      expect(script).toContain('end if');
    });

    it('should work in forEach loops', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('results', [])
        .forEach('aPerson', 'every person', (loop) =>
          loop.setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string'),
        );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with aPerson in every person');
      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set personBirthday to birth date of aPerson as string');
      expect(script).toContain('else');
      expect(script).toContain('set personBirthday to missing value');
      expect(script).toContain('end if');
      expect(script).toContain('end repeat');
    });

    it('should work with different type conversions', () => {
      const builder = new AppleScriptBuilder();
      builder
        .setIfExists('dateString', 'some date', '""', 'string')
        .setIfExists('countInt', 'some count', '0', 'integer')
        .setIfExists('priceReal', 'some price', '0.0', 'real');

      const script = builder.build();
      expect(script).toContain('set dateString to some date as string');
      expect(script).toContain('set countInt to some count as integer');
      expect(script).toContain('set priceReal to some price as real');
    });

    it('should work with complex property expressions', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists(
        'nestedValue',
        (e) => e.property(e.property('record', 'nested'), 'value'),
        '0',
      );

      const script = builder.build();
      expect(script).toContain('if exists value of nested of record then');
      expect(script).toContain('set nestedValue to value of nested of record');
      expect(script).toContain('else');
      expect(script).toContain('set nestedValue to 0');
      expect(script).toContain('end if');
    });

    it('should work with ExprBuilder default value', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('personEmail', 'email of person', (e) =>
        e.property('company', 'defaultEmail'),
      );

      const script = builder.build();
      expect(script).toContain('if exists email of person then');
      expect(script).toContain('set personEmail to email of person');
      expect(script).toContain('else');
      expect(script).toContain('set personEmail to defaultEmail of company');
      expect(script).toContain('end if');
    });

    it('should maintain proper indentation', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .forEach('aPerson', 'every person', (loop) =>
          loop.setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string'),
        )
        .endtell();

      const script = builder.build();
      const lines = script.split('\n');

      expect(lines[0]).toBe('tell application "Contacts"');
      expect(lines[1]).toMatch(/^ {2}repeat with aPerson/);
      expect(lines[2]).toMatch(/^ {4}if exists birth date/);
      expect(lines[3]).toMatch(/^ {6}set personBirthday/);
      expect(lines[4]).toMatch(/^ {4}else/);
      expect(lines[5]).toMatch(/^ {6}set personBirthday/);
      expect(lines[6]).toMatch(/^ {4}end if/);
      expect(lines[7]).toMatch(/^ {2}end repeat/);
      expect(lines[8]).toBe('end tell');
    });
  });

  describe('setEndIfExists', () => {
    it('should append property value to list with if-exists check', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('birthdayList', [])
        .setEndIfExists('birthdayList', 'birth date of person', '""', 'string');

      const script = builder.build();
      expect(script).toContain('set birthdayList to {}');
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set end of birthdayList to birth date of person as string');
      expect(script).toContain('else');
      expect(script).toContain('set end of birthdayList to ""');
      expect(script).toContain('end if');
    });

    it('should work with ExprBuilder property', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('notes', [])
        .setEndIfExists('notes', (e) => e.property('contact', 'note'), 'missing value');

      const script = builder.build();
      expect(script).toContain('set notes to {}');
      expect(script).toContain('if exists note of contact then');
      expect(script).toContain('set end of notes to note of contact');
      expect(script).toContain('else');
      expect(script).toContain('set end of notes to missing value');
      expect(script).toContain('end if');
    });

    it('should work without type conversion', () => {
      const builder = new AppleScriptBuilder();
      builder.set('values', []).setEndIfExists('values', 'optional value', '0');

      const script = builder.build();
      expect(script).toContain('set values to {}');
      expect(script).toContain('if exists optional value then');
      expect(script).toContain('set end of values to optional value');
      expect(script).toContain('else');
      expect(script).toContain('set end of values to 0');
      expect(script).toContain('end if');
    });

    it('should default to missing value if no default provided', () => {
      const builder = new AppleScriptBuilder();
      builder.set('items', []).setEndIfExists('items', 'some property');

      const script = builder.build();
      expect(script).toContain('if exists some property then');
      expect(script).toContain('set end of items to some property');
      expect(script).toContain('else');
      expect(script).toContain('set end of items to missing value');
      expect(script).toContain('end if');
    });

    it('should work in forEach loops', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('birthdayList', [])
        .forEach('person', 'every person', (loop) =>
          loop.setEndIfExists('birthdayList', 'birth date of person', '""', 'string'),
        );

      const script = builder.build();
      expect(script).toContain('set birthdayList to {}');
      expect(script).toContain('repeat with person in every person');
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set end of birthdayList to birth date of person as string');
      expect(script).toContain('else');
      expect(script).toContain('set end of birthdayList to ""');
      expect(script).toContain('end if');
      expect(script).toContain('end repeat');
    });

    it('should work with multiple properties in sequence', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('data', [])
        .forEach('person', 'every person', (loop) =>
          loop
            .setEndIfExists('data', 'name of person', '""')
            .setEndIfExists('data', 'email of person', '""')
            .setEndIfExists('data', 'phone of person', '""'),
        );

      const script = builder.build();
      expect(script).toContain('if exists name of person then');
      expect(script).toContain('set end of data to name of person');
      expect(script).toContain('if exists email of person then');
      expect(script).toContain('set end of data to email of person');
      expect(script).toContain('if exists phone of person then');
      expect(script).toContain('set end of data to phone of person');
    });

    it('should work with type conversions', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('dates', [])
        .setEndIfExists('dates', 'creation date', '""', 'string')
        .setEndIfExists('dates', 'modification date', '""', 'string');

      const script = builder.build();
      expect(script).toContain('set end of dates to creation date as string');
      expect(script).toContain('set end of dates to modification date as string');
    });

    it('should work with complex property expressions', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('values', [])
        .setEndIfExists('values', (e) => e.property(e.property('obj', 'nested'), 'value'), '0');

      const script = builder.build();
      expect(script).toContain('if exists value of nested of obj then');
      expect(script).toContain('set end of values to value of nested of obj');
      expect(script).toContain('else');
      expect(script).toContain('set end of values to 0');
      expect(script).toContain('end if');
    });
  });

  describe('Integration with other methods', () => {
    it('should work with tryCatch for error handling', () => {
      const builder = new AppleScriptBuilder();
      builder.set('results', []).forEach('person', 'every person', (loop) =>
        loop.tryCatch(
          (tryBlock) =>
            tryBlock.setIfExists('birthday', 'birth date of person', 'missing value', 'string'),
          (catchBlock) => catchBlock.comment('Skip errors'),
        ),
      );

      const script = builder.build();
      expect(script).toContain('set results to {}');
      expect(script).toContain('repeat with person in every person');
      expect(script).toContain('try');
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set birthday to birth date of person as string');
      expect(script).toContain('on error');
      expect(script).toContain('-- Skip errors');
      expect(script).toContain('end try');
      expect(script).toContain('end repeat');
    });

    it('should work with setEndRecord for building records', () => {
      const builder = new AppleScriptBuilder();
      builder.set('contacts', []).forEach('person', 'every person', (loop) =>
        loop
          .setIfExists('personBirthday', 'birth date of person', 'missing value', 'string')
          .setIfExists('personNote', 'note of person', '""')
          .setEndRecord('contacts', {
            name: 'name of person',
            birthday: 'personBirthday',
            note: 'personNote',
          }),
      );

      const script = builder.build();
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set personBirthday to birth date of person as string');
      expect(script).toContain('if exists note of person then');
      expect(script).toContain('set personNote to note of person');
      expect(script).toContain(
        'set end of contacts to {name:name of person, birthday:personBirthday, note:personNote}',
      );
    });

    it('should work in nested forEach loops', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('allData', [])
        .forEach('account', 'every account', (outer) =>
          outer.forEach('note', 'notes of account', (inner) =>
            inner.setEndIfExists('allData', 'content of note', '""', 'string'),
          ),
        );

      const script = builder.build();
      expect(script).toContain('repeat with account in every account');
      expect(script).toContain('repeat with note in notes of account');
      expect(script).toContain('if exists content of note then');
      expect(script).toContain('set end of allData to content of note as string');
      expect(script).toContain('end repeat'); // Two of these
    });

    it('should combine with forEachUntil for limited iteration', () => {
      const builder = new AppleScriptBuilder();
      builder
        .set('limited', [])
        .set('counter', 0)
        .forEachUntil(
          'person',
          'every person',
          (e) => e.gte('counter', 10),
          (loop) =>
            loop
              .increment('counter')
              .setEndIfExists('limited', 'birth date of person', '""', 'string'),
        );

      const script = builder.build();
      expect(script).toContain('set limited to {}');
      expect(script).toContain('set counter to 0');
      expect(script).toContain('repeat with person in every person');
      expect(script).toContain('if counter >= 10 then');
      expect(script).toContain('exit repeat');
      expect(script).toContain('set counter to counter + 1');
      expect(script).toContain('if exists birth date of person then');
      expect(script).toContain('set end of limited to birth date of person as string');
    });

    it('should work in real-world contacts extraction pattern', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .set('contactsList', [])
        .forEach('aPerson', 'every person', (loop) =>
          loop.tryCatch(
            (tryBlock) =>
              tryBlock
                .setIfExists('personBirthday', 'birth date of aPerson', 'missing value', 'string')
                .setIfExists('personNote', 'note of aPerson', '""')
                .setEndRecord('contactsList', {
                  name: 'name of aPerson',
                  birthday: 'personBirthday',
                  note: 'personNote',
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
      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set personBirthday to birth date of aPerson as string');
      expect(script).toContain('if exists note of aPerson then');
      expect(script).toContain('set personNote to note of aPerson');
      expect(script).toContain(
        'set end of contactsList to {name:name of aPerson, birthday:personBirthday, note:personNote}',
      );
      expect(script).toContain('on error');
      expect(script).toContain('-- Skip contacts with errors');
      expect(script).toContain('end try');
      expect(script).toContain('end repeat');
      expect(script).toContain('end tell');
    });
  });

  describe('Edge cases', () => {
    it('should handle property names with spaces', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('value', 'some property name', 'missing value');

      const script = builder.build();
      expect(script).toContain('if exists some property name then');
      expect(script).toContain('set value to some property name');
    });

    it('should handle empty string as default', () => {
      const builder = new AppleScriptBuilder();
      builder.setIfExists('text', 'some text', '""');

      const script = builder.build();
      expect(script).toContain('set text to ""');
    });

    it('should handle numeric defaults', () => {
      const builder = new AppleScriptBuilder();
      builder
        .setIfExists('count', 'some count', '0')
        .setIfExists('price', 'some price', '0.0')
        .setIfExists('index', 'some index', '-1');

      const script = builder.build();
      expect(script).toContain('set count to 0');
      expect(script).toContain('set price to 0.0');
      expect(script).toContain('set index to -1');
    });
  });
});
