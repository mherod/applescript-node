import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';

describe('AppleScriptBuilder - Enhanced mapToJson()', () => {
  describe('Simple string properties (backward compatibility)', () => {
    it('should work with simple string properties as before', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', {
          id: 'id',
          name: 'name',
          content: 'plaintext',
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('tell application "Notes"');
      expect(script).toContain('set __collected_items to {}');
      expect(script).toContain('repeat with aNote in every note');
      expect(script).toContain('set end of __collected_items to');
      expect(script).toContain('id:id of aNote');
      expect(script).toContain('name:name of aNote');
      expect(script).toContain('content:plaintext of aNote');
    });

    it('should handle limit option with simple properties', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Notes').mapToJson('aNote', 'every note', { id: 'id' }, { limit: 10 }).endtell();

      const script = builder.build();

      expect(script).toContain('set __counter to 0');
      expect(script).toContain('if __counter >= 10 then');
      expect(script).toContain('exit repeat');
      expect(script).toContain('set __counter to __counter + 1');
    });

    it('should handle skipErrors option with simple properties', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', { id: 'id' }, { skipErrors: true })
        .endtell();

      const script = builder.build();

      expect(script).toContain('try');
      expect(script).toContain('on error');
      expect(script).toContain('-- Skip items with errors');
      expect(script).toContain('end try');
    });
  });

  describe('PropertyExtractor with firstOf', () => {
    it('should handle firstOf extractor with ExprBuilder callback', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          name: 'name',
          email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('tell application "Contacts"');
      expect(script).toContain('repeat with aPerson in every person');
      // Should use setFirstOf internally
      expect(script).toContain('if count of emails of aPerson > 0 then');
      expect(script).toContain('set __temp_email to value of item 1 of emails of aPerson');
      expect(script).toContain('set __temp_email to missing value');
      // Record should use temp variable (no "of aPerson" suffix)
      expect(script).toContain('email:__temp_email}');
      expect(script).not.toContain('email:__temp_email of aPerson');
    });

    it('should handle firstOf with string property', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          email: { property: 'emails', firstOf: true },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if count of emails > 0 then');
      expect(script).toContain('set __temp_email to value of item 1 of emails');
    });

    it('should handle firstOf with custom default value', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          email: { property: 'emails', firstOf: true, default: '""' },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('set __temp_email to ""');
    });
  });

  describe('PropertyExtractor with ifExists', () => {
    it('should handle ifExists extractor with type conversion', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          birthday: { property: 'birth date', ifExists: true, asType: 'string' },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if exists birth date then');
      expect(script).toContain('set __temp_birthday to birth date as string');
      expect(script).toContain('set __temp_birthday to missing value');
    });

    it('should handle ifExists without type conversion', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', {
          created: { property: 'creation date', ifExists: true },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if exists creation date then');
      expect(script).toContain('set __temp_created to creation date');
      expect(script).not.toContain('as string');
    });

    it('should handle ifExists with ExprBuilder callback', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          birthday: {
            property: (e) => e.property('aPerson', 'birth date'),
            ifExists: true,
            asType: 'string',
          },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if exists birth date of aPerson then');
      expect(script).toContain('set __temp_birthday to birth date of aPerson as string');
    });

    it('should handle ifExists with custom default', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', {
          note: { property: 'note', ifExists: true, default: '"No note"' },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('set __temp_note to "No note"');
    });
  });

  describe('Mixed property types', () => {
    it('should handle mix of simple strings and PropertyExtractors', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          id: 'id',
          name: 'name',
          email: { property: 'emails', firstOf: true },
          birthday: { property: 'birth date', ifExists: true, asType: 'string' },
          organization: 'organization',
        })
        .endtell();

      const script = builder.build();

      // Simple properties used directly
      expect(script).toContain('id:id of aPerson');
      expect(script).toContain('name:name of aPerson');
      expect(script).toContain('organization:organization of aPerson');

      // firstOf transformation
      expect(script).toContain('if count of emails > 0 then');
      expect(script).toContain('set __temp_email to value of item 1 of emails');

      // ifExists transformation
      expect(script).toContain('if exists birth date then');
      expect(script).toContain('set __temp_birthday to birth date as string');

      // Record uses temp variables for transformed fields (no "of aPerson" suffix)
      expect(script).toContain('email:__temp_email,');
      expect(script).toContain('birthday:__temp_birthday,');
      expect(script).not.toContain('email:__temp_email of aPerson');
      expect(script).not.toContain('birthday:__temp_birthday of aPerson');
    });

    it('should handle all extractors in realistic contact example', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson(
          'aPerson',
          'every person',
          {
            id: 'id',
            name: 'name',
            firstName: 'first name',
            lastName: 'last name',
            email: { property: (e) => e.property('aPerson', 'emails'), firstOf: true },
            phone: { property: 'phones', firstOf: true },
            birthday: { property: 'birth date', ifExists: true, asType: 'string' },
            organization: 'organization',
          },
          { limit: 50, skipErrors: true },
        )
        .endtell();

      const script = builder.build();

      // Limit handling
      expect(script).toContain('set __counter to 0');
      expect(script).toContain('if __counter >= 50 then');

      // Error handling
      expect(script).toContain('try');
      expect(script).toContain('on error');

      // firstOf transformations
      expect(script).toContain('if count of emails of aPerson > 0 then');
      expect(script).toContain('set __temp_email to value of item 1 of emails of aPerson');
      expect(script).toContain('if count of phones > 0 then');
      expect(script).toContain('set __temp_phone to value of item 1 of phones');

      // ifExists transformation
      expect(script).toContain('if exists birth date then');
      expect(script).toContain('set __temp_birthday to birth date as string');

      // JSON conversion
      expect(script).toContain('return jsonArray');
    });
  });

  describe('PropertyExtractor with default callbacks', () => {
    it('should handle default as ExprBuilder callback', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          email: { property: 'emails', firstOf: true, default: (e) => e.asType('""', 'text') },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('set __temp_email to "" as text');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty property map', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Notes').mapToJson('aNote', 'every note', {}).endtell();

      const script = builder.build();

      expect(script).toContain('repeat with aNote in every note');
      expect(script).toContain('return jsonArray');
    });

    it('should handle only PropertyExtractors (no simple strings)', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          email: { property: 'emails', firstOf: true },
          birthday: { property: 'birth date', ifExists: true, asType: 'string' },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('set __temp_email');
      expect(script).toContain('set __temp_birthday');
      // Temp variables used directly (no "of aPerson" suffix)
      expect(script).toContain('email:__temp_email,');
      expect(script).toContain('birthday:__temp_birthday}');
      expect(script).not.toContain('email:__temp_email of aPerson');
      expect(script).not.toContain('birthday:__temp_birthday of aPerson');
    });

    it('should work with until condition', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', { id: 'id' }, { until: (e) => e.gt('counter', 100) })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if counter > 100 then');
      expect(script).toContain('exit repeat');
    });

    it('should work with while condition', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note', { id: 'id' }, { while: 'hasMore = true' })
        .endtell();

      const script = builder.build();

      expect(script).toContain('if not hasMore = true then');
      expect(script).toContain('exit repeat');
    });
  });

  describe('Type inference', () => {
    it('should infer return type from property map', () => {
      const builder = new AppleScriptBuilder();
      const result = builder
        .tell('Contacts')
        .mapToJson('aPerson', 'every person', {
          id: 'id',
          name: 'name',
          email: { property: 'emails', firstOf: true },
        })
        .endtell();

      // Verify the builder is still chainable
      expect(result).toBeInstanceOf(AppleScriptBuilder);
      expect(result.build()).toContain('tell application "Contacts"');
    });
  });

  describe('Integration with existing options', () => {
    it('should combine limit and skipErrors with PropertyExtractors', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Contacts')
        .mapToJson(
          'aPerson',
          'every person',
          {
            id: 'id',
            email: { property: 'emails', firstOf: true },
            birthday: { property: 'birth date', ifExists: true, asType: 'string' },
          },
          { limit: 25, skipErrors: true },
        )
        .endtell();

      const script = builder.build();

      // Limit
      expect(script).toContain('if __counter >= 25 then');
      // Error handling
      expect(script).toContain('try');
      // Transformations still work
      expect(script).toContain('if count of emails > 0 then');
      expect(script).toContain('if exists birth date then');
    });

    it('should work with complex collection expressions', () => {
      const builder = new AppleScriptBuilder();
      builder
        .tell('Notes')
        .mapToJson('aNote', 'every note where name contains "Important"', {
          name: 'name',
          created: { property: 'creation date', ifExists: true, asType: 'string' },
        })
        .endtell();

      const script = builder.build();

      expect(script).toContain('repeat with aNote in every note where name contains "Important"');
    });
  });
});
