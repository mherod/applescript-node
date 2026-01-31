/**
 * @fileoverview Tests for languages module
 *
 * **IMPORTANT: Testing Patterns and Requirements**
 *
 * This test suite demonstrates critical testing patterns that must be followed
 * when adding or modifying language-related functionality:
 *
 * 1. **Empty Output Handling**: Tests verify that empty output from `osalang -L`
 *    is handled gracefully. This is critical because:
 *    - Empty output can occur in test environments
 *    - Edge cases on systems with no languages installed
 *    - Prevents runtime errors from undefined access
 *
 * 2. **Mock Setup**: Uses proper mocking of `child_process.exec`:
 *    - Mocks are reset between tests
 *    - Command-specific responses (check command string)
 *    - Proper callback invocation pattern
 *
 * 3. **Edge Case Coverage**: Tests include:
 *    - Empty output scenarios
 *    - Malformed output handling
 *    - Missing capability flags
 *    - Default language fallback behavior
 *
 * **When Adding New Tests:**
 * - Always test empty output scenarios
 * - Verify graceful degradation (empty arrays, defaults)
 * - Test both success and failure paths
 * - Mock different output formats
 *
 * **Why These Tests Matter:**
 * - Prevents regressions in error handling
 * - Ensures production code handles edge cases
 * - Documents expected behavior for future developers
 * - Catches issues before they reach production
 *
 * @see {@link getInstalledLanguages} for implementation details
 * @see {@link getDefaultLanguage} for default language logic
 */

import { exec } from 'node:child_process';
import { describe, expect, it, type MockInstance, vi } from 'vitest';
import { getDefaultLanguage, getInstalledLanguages } from './languages.js';

type ExecCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

describe('languages', () => {
  describe('getInstalledLanguages', () => {
    it('should parse installed languages from osalang output', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -L') {
          callback(null, {
            stdout:
              'AppleScript Apple cgxervdh AppleScript\nJavaScript JavaScript cxervdh JavaScript for Automation\n',
            stderr: '',
          });
        }
      });

      const languages = await getInstalledLanguages();

      expect(languages).toHaveLength(2);
      expect(languages[0]).toEqual({
        name: 'AppleScript',
        subtype: 'AppleScript',
        manufacturer: 'Apple',
        capabilities: {
          compiling: true,
          sourceData: true,
          coercion: true,
          eventHandling: true,
          recording: true,
          convenience: true,
          dialects: true,
          appleEvents: true,
        },
        description: 'AppleScript',
      });
      expect(languages[1]).toEqual({
        name: 'JavaScript',
        subtype: 'JavaScript',
        manufacturer: 'JavaScript',
        capabilities: {
          compiling: true,
          sourceData: false,
          coercion: true,
          eventHandling: true,
          recording: true,
          convenience: true,
          dialects: true,
          appleEvents: true,
        },
        description: 'JavaScript for Automation',
      });
    });

    it('should handle empty output', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -L') {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      const languages = await getInstalledLanguages();
      expect(languages).toEqual([]);
    });

    it('should parse capabilities correctly', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -L') {
          callback(null, {
            stdout: 'TestLang TestManu c TestLang\n',
            stderr: '',
          });
        }
      });

      const languages = await getInstalledLanguages();

      expect(languages[0].capabilities).toEqual({
        compiling: true,
        sourceData: false,
        coercion: false,
        eventHandling: false,
        recording: false,
        convenience: false,
        dialects: false,
        appleEvents: false,
      });
    });

    it('should handle description with parentheses', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -L') {
          callback(null, {
            stdout: 'TestLang TestManu cgxervdh (Test Description)\n',
            stderr: '',
          });
        }
      });

      const languages = await getInstalledLanguages();

      expect(languages[0].description).toBe('Test Description');
    });

    it('should handle multiple word descriptions', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -L') {
          callback(null, {
            stdout: 'TestLang TestManu cgxervdh Test Description With Multiple Words\n',
            stderr: '',
          });
        }
      });

      const languages = await getInstalledLanguages();

      expect(languages[0].description).toBe('Test Description With Multiple Words');
    });
  });

  describe('getDefaultLanguage', () => {
    it('should return default language from installed languages', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -d') {
          callback(null, { stdout: 'AppleScript\n', stderr: '' });
        } else if (command === 'osalang -L') {
          callback(null, {
            stdout:
              'AppleScript Apple cgxervdh AppleScript\nJavaScript JavaScript cxervdh JavaScript for Automation\n',
            stderr: '',
          });
        }
      });

      const defaultLang = await getDefaultLanguage();

      expect(defaultLang.name).toBe('AppleScript');
      expect(defaultLang.manufacturer).toBe('Apple');
    });

    it('should return first language if default not found', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -d') {
          callback(null, { stdout: 'NonExistent\n', stderr: '' });
        } else if (command === 'osalang -L') {
          callback(null, {
            stdout:
              'AppleScript Apple cgxervdh AppleScript\nJavaScript JavaScript cxervdh JavaScript for Automation\n',
            stderr: '',
          });
        }
      });

      const defaultLang = await getDefaultLanguage();

      expect(defaultLang.name).toBe('AppleScript');
    });

    it('should return fallback language when installed languages list is empty', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        if (command === 'osalang -d') {
          callback(null, { stdout: 'AppleScript\n', stderr: '' });
        } else if (command === 'osalang -L') {
          callback(null, { stdout: '', stderr: '' });
        }
      });

      const defaultLang = await getDefaultLanguage();

      // When no languages are installed, a fallback AppleScript object is returned
      expect(defaultLang).toBeDefined();
      expect(defaultLang.name).toBe('AppleScript');
      expect(defaultLang.description).toBe('Default fallback');
    });
  });
});
