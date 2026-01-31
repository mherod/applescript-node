import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApplicationDictionary } from './types.js';

// Mock the sdef module before importing validator
vi.mock('./sdef.js', () => ({
  getApplicationDictionary: vi.fn(),
  findCommand: vi.fn(),
  findClass: vi.fn(),
  getAllClasses: vi.fn(() => []),
}));

// Import after mocking
import { getApplicationDictionary } from './sdef.js';
import { ScriptValidator, validateScript } from './validator.js';

describe('ScriptValidator with mocked sdef', () => {
  const mockDictionary: ApplicationDictionary = {
    suites: [
      {
        name: 'Test Suite',
        code: 'test',
        description: 'Test suite',
        commands: [
          {
            name: 'testCommand',
            code: 'test',
            description: 'Test command',
            parameters: [],
          },
        ],
        classes: [],
        enumerations: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApplicationDictionary).mockResolvedValue(mockDictionary);
  });

  describe('forApplication static method', () => {
    it('should create validator from application path', async () => {
      const validator = await ScriptValidator.forApplication('/Applications/TestApp.app');

      expect(validator).toBeInstanceOf(ScriptValidator);
      expect(getApplicationDictionary).toHaveBeenCalledWith('/Applications/TestApp.app');
    });

    it('should extract app name from path with .app extension', async () => {
      const validator = await ScriptValidator.forApplication('/Applications/MyApp.app');

      // Validate that the validator was created and can be used
      const result = validator.validate('tell application "MyApp"\nend tell');
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should extract app name from complex path', async () => {
      const validator = await ScriptValidator.forApplication(
        '/Users/test/Applications/Custom App.app',
      );

      expect(validator).toBeInstanceOf(ScriptValidator);
    });

    it('should handle path without .app extension', async () => {
      const validator = await ScriptValidator.forApplication('/usr/bin/someutil');

      expect(validator).toBeInstanceOf(ScriptValidator);
    });

    it('should handle empty path gracefully', async () => {
      const validator = await ScriptValidator.forApplication('');

      expect(validator).toBeInstanceOf(ScriptValidator);
    });
  });

  describe('validateScript helper function', () => {
    it('should validate script using helper function', async () => {
      const result = await validateScript(
        'tell application "TestApp"\ntestCommand\nend tell',
        '/Applications/TestApp.app',
      );

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should pass options to validator', async () => {
      const result = await validateScript(
        'tell application "TestApp"\nunknownCmd\nend tell',
        '/Applications/TestApp.app',
        { strictness: 'strict', provideSuggestions: false },
      );

      expect(result).toBeDefined();
      // In strict mode, warnings count as invalid
      if (result.warnings.length > 0) {
        expect(result.valid).toBe(false);
      }
    });

    it('should work with lenient mode', async () => {
      const result = await validateScript(
        'tell application "TestApp"\ntestCommand\nend tell',
        '/Applications/TestApp.app',
        { strictness: 'lenient' },
      );

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should handle empty script', async () => {
      const result = await validateScript('', '/Applications/TestApp.app');

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });
  });
});
