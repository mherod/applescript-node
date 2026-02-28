/**
 * @fileoverview Tests for windows source module
 *
 * **IMPORTANT: Testing Patterns for Source Modules**
 *
 * This test suite follows the same critical patterns as other source module tests:
 *
 * 1. **Mock Clearing**: Uses `beforeEach()` to clear mocks between tests.
 *    Essential for test isolation and preventing call accumulation.
 *
 * 2. **Comprehensive Coverage**: Tests cover:
 *    - Window retrieval (all, by app, frontmost)
 *    - Window counting and statistics
 *    - Error handling and edge cases
 *    - Empty result handling
 *
 * **Testing Best Practices Demonstrated:**
 * - Mock management with beforeEach
 * - Both success and error path testing
 * - Edge case coverage (empty results, missing windows)
 * - Type-safe assertions
 *
 * **When Modifying Window Functionality:**
 * - Update tests to reflect new behavior
 * - Add tests for new edge cases
 * - Verify mock clearing is maintained
 * - Test error handling paths
 *
 * @see {@link windows} module for implementation
 * @see {@link applications.test.ts} for detailed mock management patterns
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptExecutor } from '../executor.js';
import { getAll, getByApp, getCountByApp, getFrontmost } from './windows.js';

vi.mock('../executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
  },
}));

const mockExecute = vi.mocked(ScriptExecutor.execute);

describe('windows', () => {
  // CRITICAL: Clear mocks between tests for isolation
  beforeEach(() => {
    mockExecute.mockClear();
  });
  describe('getAll', () => {
    it('should return parsed window info', async () => {
      const mockWindows = [
        {
          name: 'Window 1',
          app: 'Safari',
          id: 1,
          x: 100,
          y: 200,
          width: 800,
          height: 600,
          minimized: false,
          zoomed: false,
          visible: true,
        },
        {
          name: 'Window 2',
          app: 'Finder',
          id: 2,
          x: 0,
          y: 0,
          width: 1024,
          height: 768,
          minimized: true,
          zoomed: false,
          visible: true,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindows),
        exitCode: 0,
      });

      const result = await getAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Window 1',
        app: 'Safari',
        id: 1,
        bounds: {
          x: 100,
          y: 200,
          width: 800,
          height: 600,
        },
        minimized: false,
        zoomed: false,
        visible: true,
      });
    });

    it('should handle missing fields with defaults', async () => {
      const mockWindows = [
        {
          name: '',
          app: '',
          id: undefined,
          x: undefined,
          y: undefined,
          width: undefined,
          height: undefined,
          minimized: undefined,
          zoomed: undefined,
          visible: undefined,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindows),
        exitCode: 0,
      });

      const result = await getAll();

      expect(result[0]).toEqual({
        name: '',
        app: '',
        id: 0,
        bounds: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
        minimized: false,
        zoomed: false,
        visible: false,
      });
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getAll()).rejects.toThrow('Failed to get windows: Script execution failed');
    });

    it('should handle empty result', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const result = await getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getByApp', () => {
    it('should filter windows by app name', async () => {
      const mockWindows = [
        {
          name: 'Window 1',
          app: 'Safari',
          id: 1,
          x: 100,
          y: 200,
          width: 800,
          height: 600,
          minimized: false,
          zoomed: false,
          visible: true,
        },
        {
          name: 'Window 2',
          app: 'Finder',
          id: 2,
          x: 0,
          y: 0,
          width: 1024,
          height: 768,
          minimized: false,
          zoomed: false,
          visible: true,
        },
        {
          name: 'Window 3',
          app: 'Safari',
          id: 3,
          x: 200,
          y: 300,
          width: 900,
          height: 700,
          minimized: false,
          zoomed: false,
          visible: true,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindows),
        exitCode: 0,
      });

      const result = await getByApp('Safari');

      expect(result).toHaveLength(2);
      expect(result[0].app).toBe('Safari');
      expect(result[1].app).toBe('Safari');
    });

    it('should return empty array when no windows found for app', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const result = await getByApp('NonExistentApp');
      expect(result).toEqual([]);
    });
  });

  describe('getFrontmost', () => {
    it('should return frontmost window info', async () => {
      const mockWindow = {
        name: 'Active Window',
        app: 'Safari',
        x: 100,
        y: 200,
        width: 800,
        height: 600,
        minimized: false,
        zoomed: false,
        visible: true,
      };

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindow),
        exitCode: 0,
      });

      const result = await getFrontmost();

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Active Window');
      expect(result?.app).toBe('Safari');
      expect(result?.id).toBe(0); // Frontmost doesn't include ID
    });

    it('should return null when no frontmost window', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      const result = await getFrontmost();
      expect(result).toBeNull();
    });

    it('should return null on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        exitCode: 1,
      });

      const result = await getFrontmost();
      expect(result).toBeNull();
    });

    it('should return null on invalid JSON', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'invalid json',
        exitCode: 0,
      });

      const result = await getFrontmost();
      expect(result).toBeNull();
    });

    it('should handle missing fields with defaults', async () => {
      const mockWindow = {
        name: undefined,
        app: undefined,
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined,
        minimized: undefined,
        zoomed: undefined,
        visible: undefined,
      };

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindow),
        exitCode: 0,
      });

      const result = await getFrontmost();

      expect(result).not.toBeNull();
      expect(result?.name).toBe('');
      expect(result?.app).toBe('');
      expect(result?.bounds.x).toBe(0);
      expect(result?.bounds.y).toBe(0);
      expect(result?.bounds.width).toBe(0);
      expect(result?.bounds.height).toBe(0);
      expect(result?.minimized).toBe(false);
      expect(result?.zoomed).toBe(false);
      expect(result?.visible).toBe(false);
    });
  });

  describe('null output and null field fallback branches', () => {
    it('getAll: should return empty array when output is null', async () => {
      // Exercises windows.ts:93 — result.output ?? '[]'
      mockExecute.mockResolvedValueOnce({ success: true, output: null, exitCode: 0 });

      const result = await getAll();
      expect(result).toEqual([]);
    });

    it('getAll: should default name and app to empty string when null in JSON', async () => {
      // Exercises windows.ts:98-99 — (w.name as string|undefined) ?? '' and (w.app as string|undefined) ?? ''
      // JSON.stringify preserves null, so w.name === null → null ?? '' === ''
      const mockWindows = [{ name: null, app: null, id: 1, x: 0, y: 0, width: 0, height: 0 }];
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindows),
        exitCode: 0,
      });

      const result = await getAll();
      expect(result[0].name).toBe('');
      expect(result[0].app).toBe('');
    });
  });

  describe('getCountByApp', () => {
    it('should return window counts grouped by app', async () => {
      const mockWindows = [
        {
          name: 'Window 1',
          app: 'Safari',
          id: 1,
          x: 100,
          y: 200,
          width: 800,
          height: 600,
          minimized: false,
          zoomed: false,
          visible: true,
        },
        {
          name: 'Window 2',
          app: 'Safari',
          id: 2,
          x: 0,
          y: 0,
          width: 1024,
          height: 768,
          minimized: false,
          zoomed: false,
          visible: true,
        },
        {
          name: 'Window 3',
          app: 'Finder',
          id: 3,
          x: 200,
          y: 300,
          width: 900,
          height: 700,
          minimized: false,
          zoomed: false,
          visible: true,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockWindows),
        exitCode: 0,
      });

      const result = await getCountByApp();

      expect(result).toEqual({
        Safari: 2,
        Finder: 1,
      });
    });

    it('should return empty object when no windows', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const result = await getCountByApp();
      expect(result).toEqual({});
    });
  });
});
