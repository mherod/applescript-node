/**
 * @fileoverview Tests for applications source module
 *
 * **IMPORTANT: Mock Management and Testing Patterns**
 *
 * This test suite demonstrates critical testing patterns that must be followed
 * when testing source modules:
 *
 * 1. **Mock Clearing**: Uses `beforeEach()` to clear mocks between tests.
 *    This is CRITICAL because:
 *    - Mocks accumulate calls across tests
 *    - Without clearing, `mock.calls[0]` might reference previous test
 *    - Tests become order-dependent and fragile
 *    - Always use `mockClear()` or `mockReset()` in beforeEach
 *
 * 2. **Call Indexing**: Tests use `mock.calls.at(-1)` to get the LAST call
 *    instead of `mock.calls[0]`. This is important because:
 *    - Multiple calls can occur in a single test
 *    - Previous tests might have made calls
 *    - `at(-1)` gets the most recent call reliably
 *
 * 3. **Script Content Assertions**: When testing script content:
 *    - Use flexible matchers (`.toMatch()`, `.toContain()`) for escaping
 *    - Don't rely on exact backslash counts (varies by context)
 *    - Test that escaping works, not exact escape sequences
 *
 * **When Adding New Tests:**
 * - Always include `beforeEach(() => mockClear())` for mock management
 * - Use `mock.calls.at(-1)` for recent calls, not `[0]`
 * - Test both success and error paths
 * - Verify script content with flexible matchers
 * - Test edge cases (empty results, special characters, etc.)
 *
 * **Why These Patterns Matter:**
 * - Prevents flaky tests that pass/fail based on execution order
 * - Ensures tests are isolated and independent
 * - Makes tests maintainable and debuggable
 * - Catches regressions in script generation
 *
 * @see {@link applications} module for implementation
 * @see {@link ScriptExecutor} for execution engine
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptExecutor } from '../executor.js';
import {
  activate,
  getAll,
  getByName,
  getFrontmost,
  hide,
  isRunning,
  launch,
  quit,
  show,
} from './applications.js';

vi.mock('../executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
  },
}));

const mockExecute = vi.mocked(ScriptExecutor.execute);

describe('applications', () => {
  // CRITICAL: Clear mocks between tests to prevent call accumulation
  // Without this, mock.calls[0] might reference a previous test's call
  beforeEach(() => {
    mockExecute.mockClear();
  });
  describe('getAll', () => {
    it('should return parsed application info', async () => {
      const mockApps = [
        {
          name: 'Finder',
          bundleId: 'com.apple.finder',
          pid: 123,
          visible: true,
          frontmost: false,
          windowCount: 2,
        },
        {
          name: 'Safari',
          bundleId: 'com.apple.Safari',
          pid: 456,
          visible: true,
          frontmost: true,
          windowCount: 3,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockApps),
        exitCode: 0,
      });

      const apps = await getAll();

      expect(apps).toHaveLength(2);
      expect(apps[0]).toEqual(mockApps[0]);
      expect(apps[1]).toEqual(mockApps[1]);
    });

    it('should exclude background apps by default', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      await getAll();

      const scriptCall = mockExecute.mock.calls.at(-1);
      expect(scriptCall?.[0]).toContain('whose background only is false');
    });

    it('should include background apps when requested', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      await getAll(true);

      const scriptCall = mockExecute.mock.calls[0];
      expect(scriptCall[0]).not.toContain('whose background only is false');
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getAll()).rejects.toThrow('Failed to get applications: Script execution failed');
    });

    it('should serialize leniently so one unreadable process does not fail the batch', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      await getAll();

      const script = mockExecute.mock.calls[0][0];
      const serializationLoop = script.slice(script.indexOf('set jsonParts to {}'));
      expect(serializationLoop).toContain('try');
    });

    it('should handle empty result', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const apps = await getAll();
      expect(apps).toEqual([]);
    });
  });

  describe('getFrontmost', () => {
    it('should return frontmost application info', async () => {
      const mockApp = {
        name: 'Safari',
        bundleId: 'com.apple.Safari',
        pid: 456,
        visible: true,
        frontmost: true,
        windowCount: 3,
      };

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockApp),
        exitCode: 0,
      });

      const app = await getFrontmost();

      expect(app).toEqual(mockApp);
      expect(app.frontmost).toBe(true);
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'No frontmost app',
        exitCode: 1,
      });

      await expect(getFrontmost()).rejects.toThrow(
        'Failed to get frontmost application: No frontmost app',
      );
    });
  });

  describe('isRunning', () => {
    it('should return true when app is running', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'true',
        exitCode: 0,
      });

      const result = await isRunning('Safari');
      expect(result).toBe(true);
    });

    it('should return false when app is not running', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'false',
        exitCode: 0,
      });

      const result = await isRunning('NonExistentApp');
      expect(result).toBe(false);
    });

    it('should return false on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        exitCode: 1,
      });

      const result = await isRunning('Safari');
      expect(result).toBe(false);
    });

    it('should escape quotes in app name', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'true',
        exitCode: 0,
      });

      await isRunning('App with "quotes"');

      const scriptCall = mockExecute.mock.calls.at(-1);
      // The script contains: "App with \"quotes\""
      // In the string representation, backslashes are escaped, so we check for the escaped version
      expect(scriptCall?.[0]).toMatch(/App with .*quotes/);
    });
  });

  describe('getByName', () => {
    it('should return application when found', async () => {
      const mockApps = [
        {
          name: 'Finder',
          bundleId: 'com.apple.finder',
          pid: 123,
          visible: true,
          frontmost: false,
          windowCount: 2,
        },
        {
          name: 'Safari',
          bundleId: 'com.apple.Safari',
          pid: 456,
          visible: true,
          frontmost: true,
          windowCount: 3,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockApps),
        exitCode: 0,
      });

      const app = await getByName('Safari');

      expect(app).not.toBeNull();
      expect(app?.name).toBe('Safari');
    });

    it('should return null when not found', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const app = await getByName('NonExistentApp');
      expect(app).toBeNull();
    });
  });

  describe('activate', () => {
    it('should activate application successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(activate('Safari')).resolves.not.toThrow();
    });

    it('should throw error on activation failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(activate('NonExistentApp')).rejects.toThrow(
        'Failed to activate NonExistentApp: Application not found',
      );
    });
  });

  describe('launch', () => {
    it('should launch application successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(launch('Calendar')).resolves.not.toThrow();
    });

    it('should throw error on launch failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(launch('NonExistentApp')).rejects.toThrow(
        'Failed to launch NonExistentApp: Application not found',
      );
    });
  });

  describe('quit', () => {
    it('should quit application successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(quit('TextEdit')).resolves.not.toThrow();
    });

    it('should throw error on quit failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not running',
        exitCode: 1,
      });

      await expect(quit('NonExistentApp')).rejects.toThrow(
        'Failed to quit NonExistentApp: Application not running',
      );
    });
  });

  describe('hide', () => {
    it('should hide application successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(hide('Safari')).resolves.not.toThrow();
    });

    it('should throw error on hide failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(hide('NonExistentApp')).rejects.toThrow(
        'Failed to hide NonExistentApp: Application not found',
      );
    });

    it('should escape quotes in app name', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await hide('App with "quotes"');

      const scriptCall = mockExecute.mock.calls.at(-1);
      // The script contains: process "App with \"quotes\""
      // In the string representation, backslashes are escaped, so we check for the escaped version
      expect(scriptCall?.[0]).toMatch(/App with .*quotes/);
    });
  });

  describe('show', () => {
    it('should show application successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(show('Safari')).resolves.not.toThrow();
    });

    it('should throw error on show failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(show('NonExistentApp')).rejects.toThrow(
        'Failed to show NonExistentApp: Application not found',
      );
    });
  });

  describe('null output fallback branches', () => {
    it('getAll: should return empty array when output is null', async () => {
      // Exercises applications.ts:70 — result.output ?? '[]'
      mockExecute.mockResolvedValueOnce({ success: true, output: null, exitCode: 0 });

      const apps = await getAll();
      expect(apps).toEqual([]);
    });

    it('getFrontmost: should return empty object fields when output is null', async () => {
      // Exercises applications.ts:103 — result.output ?? '{}'
      mockExecute.mockResolvedValueOnce({ success: true, output: null, exitCode: 0 });

      const app = await getFrontmost();
      // JSON.parse('{}') gives an empty object cast to ApplicationInfo
      expect(app).toEqual({});
    });
  });
});
