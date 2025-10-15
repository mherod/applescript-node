import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { ScriptValidator, validateScript } from './validator.js';
import { parseSdef } from './sdef.js';
import type { ApplicationDictionary } from './types.js';

describe('Script Validator', () => {
  let messagesDictionary: ApplicationDictionary;
  let musicDictionary: ApplicationDictionary;
  let messagesValidator: ScriptValidator;
  let musicValidator: ScriptValidator;

  beforeEach(() => {
    // Load real sdef fixtures
    const messagesXml = readFileSync('src/__fixtures__/sdef/Messages.sdef', 'utf-8');
    messagesDictionary = parseSdef(messagesXml);
    messagesValidator = new ScriptValidator(messagesDictionary, 'Messages');

    const musicXml = readFileSync('src/__fixtures__/sdef/Music.sdef', 'utf-8');
    musicDictionary = parseSdef(musicXml);
    musicValidator = new ScriptValidator(musicDictionary, 'Music');
  });

  describe('Basic validation', () => {
    it('should validate a simple valid script', () => {
      const script = `
        tell application "Messages"
          send "Hello" to "+1234567890"
        end tell
      `;

      const result = messagesValidator.validate(script);
      expect(result.errors.length).toBe(0);
    });

    it('should detect unknown commands', () => {
      const script = `
        tell application "Messages"
          invalid_command "test"
        end tell
      `;

      const result = messagesValidator.validate(script);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toBe('unknown-command');
      expect(result.warnings[0].message).toContain('invalid_command');
    });

    it('should suggest similar commands', () => {
      const script = `
        tell application "Messages"
          sen "Hello"
        end tell
      `;

      const result = messagesValidator.validate(script, { provideSuggestions: true });
      const issue = result.warnings.find((w) => w.code === 'unknown-command');

      expect(issue).toBeDefined();
      expect(issue?.suggestion).toBeDefined();
      expect(issue?.suggestion).toContain('send');
    });

    it('should validate without suggestions when disabled', () => {
      const script = `
        tell application "Messages"
          sen "Hello"
        end tell
      `;

      const result = messagesValidator.validate(script, { provideSuggestions: false });
      const issue = result.warnings.find((w) => w.code === 'unknown-command');

      expect(issue).toBeDefined();
      expect(issue?.suggestion).toBeUndefined();
    });
  });

  describe('Property validation', () => {
    it('should detect read-only property assignments', () => {
      const script = `
        tell application "Messages"
          set id of chat "test" to "new-id"
        end tell
      `;

      const result = messagesValidator.validate(script);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('readonly-property');
      expect(result.errors[0].message).toContain('read-only');
    });

    it('should allow read-write property assignments', () => {
      const script = `
        tell application "Messages"
          set enabled of account "test" to true
        end tell
      `;

      const result = messagesValidator.validate(script);
      // Should not have errors about read-only properties
      const readOnlyErrors = result.errors.filter((e) => e.code === 'readonly-property');
      expect(readOnlyErrors.length).toBe(0);
    });
  });

  describe('Command validation', () => {
    it('should validate command parameters', () => {
      const issues = messagesValidator.validateCommand('send', { to: '+1234567890' });

      // 'send' command requires both direct parameter (message) and 'to' parameter
      // Direct parameter is not in parameters object, so this should pass
      expect(issues.filter((i) => i.severity === 'error').length).toBe(0);
    });

    it('should detect missing required parameters', () => {
      const issues = messagesValidator.validateCommand('send', {});

      // 'send' requires 'to' parameter
      const missingParam = issues.find(
        (i) => i.code === 'missing-parameter' && i.message.includes('to'),
      );
      expect(missingParam).toBeDefined();
    });

    it('should warn about unknown parameters', () => {
      const issues = messagesValidator.validateCommand('login', { fake_param: 'value' });

      const unknownParam = issues.find((i) => i.code === 'unknown-parameter');
      expect(unknownParam).toBeDefined();
    });

    it('should validate command with no parameters', () => {
      const issues = messagesValidator.validateCommand('login', {});

      // 'login' has no parameters, so this should pass
      expect(issues.filter((i) => i.severity === 'error').length).toBe(0);
    });
  });

  describe('Property access validation', () => {
    it('should validate read access to read-only property', () => {
      const issues = messagesValidator.validatePropertyAccess('chat', 'id', 'read');

      expect(issues.filter((i) => i.severity === 'error').length).toBe(0);
    });

    it('should reject write access to read-only property', () => {
      const issues = messagesValidator.validatePropertyAccess('chat', 'id', 'write');

      expect(issues.filter((i) => i.severity === 'error').length).toBeGreaterThan(0);
      expect(issues[0].code).toBe('readonly-property');
    });

    it('should allow write access to read-write property', () => {
      const issues = messagesValidator.validatePropertyAccess('account', 'enabled', 'write');

      expect(issues.filter((i) => i.severity === 'error').length).toBe(0);
    });

    it('should detect unknown class', () => {
      const issues = messagesValidator.validatePropertyAccess('unknown_class', 'property', 'read');

      expect(issues[0].code).toBe('unknown-class');
    });

    it('should detect unknown property', () => {
      const issues = messagesValidator.validatePropertyAccess('chat', 'unknown_property', 'read');

      expect(issues[0].code).toBe('unknown-property');
    });
  });

  describe('Strictness levels', () => {
    it('should treat warnings as errors in strict mode', () => {
      const script = `
        tell application "Messages"
          unknown_command
        end tell
      `;

      const result = messagesValidator.validate(script, { strictness: 'strict' });

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should allow warnings in normal mode', () => {
      const script = `
        tell application "Messages"
          login
        end tell
      `;

      const result = messagesValidator.validate(script, { strictness: 'normal' });

      expect(result.valid).toBe(true);
    });

    it('should only report errors in lenient mode', () => {
      const script = `
        tell application "Messages"
          set id of chat "test" to "new-id"
        end tell
      `;

      const result = messagesValidator.validate(script, { strictness: 'lenient' });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false);
    });
  });

  describe('Utility methods', () => {
    it('should get all available commands', () => {
      const commands = messagesValidator.getAvailableCommands();

      expect(commands.length).toBeGreaterThan(0);
      expect(commands.some((c) => c.name === 'send')).toBe(true);
      expect(commands.some((c) => c.name === 'login')).toBe(true);
    });

    it('should get all available classes', () => {
      const classes = messagesValidator.getAvailableClasses();

      expect(classes.length).toBeGreaterThan(0);
      expect(classes.some((c) => c.name === 'chat')).toBe(true);
      expect(classes.some((c) => c.name === 'participant')).toBe(true);
    });
  });

  describe('Multiple tell blocks', () => {
    it('should handle nested tell blocks', () => {
      const script = `
        tell application "System Events"
          tell process "Finder"
            click button "OK"
          end tell
        end tell
      `;

      // This should not throw errors
      const result = messagesValidator.validate(script);

      // We may get warnings about unknown commands, but no errors from parsing
      expect(result).toBeDefined();
    });
  });

  describe('String similarity', () => {
    it('should suggest send for sen', () => {
      const script = `
        tell application "Messages"
          sen "test"
        end tell
      `;

      const result = messagesValidator.validate(script, { provideSuggestions: true });
      const issue = result.warnings.find((w) => w.code === 'unknown-command');

      expect(issue?.suggestion).toContain('send');
    });

    it('should not suggest commands that are too different', () => {
      const script = `
        tell application "Messages"
          completely_different_command
        end tell
      `;

      const result = messagesValidator.validate(script, { provideSuggestions: true });
      const issue = result.warnings.find((w) => w.code === 'unknown-command');

      // Suggestion should be undefined for very different commands
      expect(issue?.suggestion).toBeUndefined();
    });
  });

  describe('Music app validation', () => {
    it('should validate play command', () => {
      const script = `
        tell application "Music"
          play
        end tell
      `;

      const result = musicValidator.validate(script);
      expect(result.errors.length).toBe(0);
    });

    it('should detect unknown Music commands', () => {
      const script = `
        tell application "Music"
          invalid_music_command
        end tell
      `;

      const result = musicValidator.validate(script);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-application validation', () => {
    it('should validate scripts with multiple applications', () => {
      const script = `
        tell application "Messages"
          send "Hello"
        end tell

        tell application "Music"
          play
        end tell
      `;

      // Validate against Messages (will warn about Music commands)
      const result = messagesValidator.validate(script);

      // Should have issues but not crash
      expect(result).toBeDefined();
    });
  });

  describe('Validation result structure', () => {
    it('should categorize issues correctly', () => {
      const script = `
        tell application "Messages"
          unknown_cmd
          set id of chat "test" to "new-id"
        end tell
      `;

      const result = messagesValidator.validate(script);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.errors).toEqual(result.issues.filter((i) => i.severity === 'error'));
      expect(result.warnings).toEqual(result.issues.filter((i) => i.severity === 'warning'));
      expect(result.info).toEqual(result.issues.filter((i) => i.severity === 'info'));
    });

    it('should mark script as invalid when errors present', () => {
      const script = `
        tell application "Messages"
          set id of chat "test" to "new-id"
        end tell
      `;

      const result = messagesValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should mark script as valid when no errors', () => {
      const script = `
        tell application "Messages"
          login
        end tell
      `;

      const result = messagesValidator.validate(script);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
