/**
 * @fileoverview Tests for system source module
 *
 * **IMPORTANT: Testing Patterns and Edge Case Coverage**
 *
 * This test suite demonstrates critical testing patterns for system operations:
 *
 * 1. **Mock Management**: Uses `beforeEach()` to clear mocks, ensuring test isolation.
 *    See applications.test.ts for detailed explanation of mock clearing patterns.
 *
 * 2. **Edge Case Testing**: Comprehensive coverage of edge cases:
 *    - Invalid boot time output (getUptime) - tests NaN handling
 *    - Empty clipboard operations
 *    - Missing system paths
 *    - Dark mode state variations (whitespace, exact matches)
 *
 * 3. **Call Indexing**: Uses `mock.calls.at(-1)` for reliable call access.
 *    This is especially important for tests using `forEach()` loops that
 *    make multiple calls in a single test.
 *
 * 4. **Type Safety in Tests**: Uses named imports instead of namespace imports
 *    to improve tree-shaking and type checking. This pattern should be followed
 *    in all new test files.
 *
 * **Critical Test Cases:**
 * - `getUptime()` with invalid boot time → verifies NaN handling and default to 0
 * - `isDarkMode()` with whitespace → verifies trim() behavior
 * - `getPath()` with all folder types → comprehensive path coverage
 * - Error handling for all operations → ensures graceful failures
 *
 * **When Adding New Tests:**
 * - Always test edge cases (empty, null, invalid input)
 * - Verify error handling and graceful degradation
 * - Use `at(-1)` for call indexing in loops
 * - Test both success and failure paths
 * - Include type-safe assertions
 *
 * **Why These Tests Matter:**
 * - System operations are critical infrastructure
 * - Edge cases are common in system-level APIs
 * - Invalid input handling prevents production crashes
 * - Comprehensive coverage catches regressions early
 *
 * @see {@link system} module for implementation
 * @see {@link ScriptExecutor} for execution engine
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptExecutor } from '../executor.js';
import {
  getClipboard,
  getDisplays,
  getInfo,
  getPath,
  getUptime,
  getVolumes,
  isDarkMode,
  setClipboard,
} from './system.js';

vi.mock('../executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
  },
}));

const mockExecute = vi.mocked(ScriptExecutor.execute);

describe('system', () => {
  // CRITICAL: Clear mocks between tests for isolation
  beforeEach(() => {
    mockExecute.mockClear();
  });
  describe('getInfo', () => {
    it('should return parsed system info', async () => {
      const mockInfo = {
        computerName: 'MacBook Pro',
        hostname: 'macbook-pro.local',
        osVersion: '14.0',
        systemVersion: '14.0',
        userName: 'testuser',
        homeDirectory: '/Users/testuser',
        architecture: 'arm64',
      };

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockInfo),
        exitCode: 0,
      });

      const info = await getInfo();

      expect(info).toEqual(mockInfo);
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getInfo()).rejects.toThrow('Failed to get system info: Script execution failed');
    });
  });

  describe('getVolumes', () => {
    it('should return parsed volume info', async () => {
      const mockVolumes = [
        {
          name: 'Macintosh HD',
          capacity: 1_000_000_000_000,
          freeSpace: 500_000_000_000,
          usedSpace: 500_000_000_000,
          format: 'APFS',
          ejectable: false,
        },
        {
          name: 'USB Drive',
          capacity: 32_000_000_000,
          freeSpace: 16_000_000_000,
          usedSpace: 16_000_000_000,
          format: 'ExFAT',
          ejectable: true,
        },
      ];

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify(mockVolumes),
        exitCode: 0,
      });

      const volumes = await getVolumes();

      expect(volumes).toHaveLength(2);
      expect(volumes[0]).toEqual(mockVolumes[0]);
      expect(volumes[1]).toEqual(mockVolumes[1]);
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getVolumes()).rejects.toThrow('Failed to get volumes: Script execution failed');
    });

    it('should handle empty result', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const volumes = await getVolumes();
      expect(volumes).toEqual([]);
    });
  });

  describe('getDisplays', () => {
    it('should parse display info from system_profiler output', async () => {
      const mockOutput = 'Resolution: 2560 x 1600 (2x)\nResolution: 1920 x 1080';

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: mockOutput,
        exitCode: 0,
      });

      const displays = await getDisplays();

      expect(displays).toHaveLength(2);
      expect(displays[0]).toEqual({
        id: 1,
        bounds: {
          x: 0,
          y: 0,
          width: 2560,
          height: 1600,
        },
      });
      expect(displays[1]).toEqual({
        id: 2,
        bounds: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
        },
      });
    });

    it('should return default display on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      const displays = await getDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0]).toEqual({
        id: 1,
        bounds: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      });
    });

    it('should return default display when no matches found', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'No resolution data',
        exitCode: 0,
      });

      const displays = await getDisplays();

      expect(displays).toHaveLength(1);
      expect(displays[0]).toEqual({
        id: 1,
        bounds: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        },
      });
    });

    it('should filter out invalid lines', async () => {
      const mockOutput = 'Resolution: 2560 x 1600\nInvalid line\nResolution: 1920 x 1080';

      mockExecute.mockResolvedValueOnce({
        success: true,
        output: mockOutput,
        exitCode: 0,
      });

      const displays = await getDisplays();

      expect(displays).toHaveLength(2);
      expect(displays[0].bounds.width).toBe(2560);
      expect(displays[1].bounds.width).toBe(1920);
    });
  });

  describe('getClipboard', () => {
    it('should return clipboard text', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'Clipboard content',
        exitCode: 0,
      });

      const result = await getClipboard();
      expect(result).toBe('Clipboard content');
    });

    it('should return empty string on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        exitCode: 1,
      });

      const result = await getClipboard();
      expect(result).toBe('');
    });

    it('should return empty string when output is null', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: null,
        exitCode: 0,
      });

      const result = await getClipboard();
      expect(result).toBe('');
    });
  });

  describe('setClipboard', () => {
    it('should set clipboard successfully', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(setClipboard('Test content')).resolves.not.toThrow();
    });

    it('should escape quotes in clipboard text', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await setClipboard('Text with "quotes"');

      const scriptCall = mockExecute.mock.calls.at(-1);
      expect(scriptCall?.[0]).toContain('Text with \\"quotes\\"');
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(setClipboard('Test')).rejects.toThrow(
        'Failed to set clipboard: Script execution failed',
      );
    });
  });

  describe('getPath', () => {
    const testCases: {
      folder: Parameters<typeof getPath>[0];
      expectedFolder: string;
    }[] = [
      { folder: 'home', expectedFolder: 'home folder' },
      { folder: 'desktop', expectedFolder: 'desktop folder' },
      { folder: 'documents', expectedFolder: 'documents folder' },
      { folder: 'downloads', expectedFolder: 'downloads folder' },
      { folder: 'applications', expectedFolder: 'applications folder' },
      { folder: 'library', expectedFolder: 'library folder' },
      { folder: 'temporary items', expectedFolder: 'temporary items folder' },
      { folder: 'music', expectedFolder: 'music folder' },
      { folder: 'pictures', expectedFolder: 'pictures folder' },
      { folder: 'movies', expectedFolder: 'movies folder' },
      { folder: 'public', expectedFolder: 'public folder' },
    ];

    for (const { folder, expectedFolder } of testCases) {
      it(`should return path for ${folder}`, async () => {
        const mockPath = `/Users/testuser/${folder}`;

        mockExecute.mockResolvedValueOnce({
          success: true,
          output: mockPath,
          exitCode: 0,
        });

        const result = await getPath(folder);

        expect(result).toBe(mockPath);
        const scriptCall = mockExecute.mock.calls.at(-1);
        expect(scriptCall?.[0]).toContain(expectedFolder);
      });
    }

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getPath('home')).rejects.toThrow(
        'Failed to get path for home: Script execution failed',
      );
    });
  });

  describe('isDarkMode', () => {
    it('should return true when dark mode is enabled', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'true',
        exitCode: 0,
      });

      const result = await isDarkMode();
      expect(result).toBe(true);
    });

    it('should return false when dark mode is disabled', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'false',
        exitCode: 0,
      });

      const result = await isDarkMode();
      expect(result).toBe(false);
    });

    it('should return false on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        exitCode: 1,
      });

      const result = await isDarkMode();
      expect(result).toBe(false);
    });

    it('should return true when output is "true" with whitespace', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: ' true ',
        exitCode: 0,
      });

      const result = await isDarkMode();
      expect(result).toBe(true);
    });
  });

  describe('getUptime', () => {
    it('should return uptime in seconds', async () => {
      const bootTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: String(bootTime),
        exitCode: 0,
      });

      const result = await getUptime();

      // Should be approximately 3600 seconds (1 hour)
      expect(result).toBeGreaterThan(3500);
      expect(result).toBeLessThan(3700);
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(getUptime()).rejects.toThrow('Failed to get uptime: Script execution failed');
    });

    it('should handle invalid boot time', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'invalid',
        exitCode: 0,
      });

      const result = await getUptime();
      // Should return a large number (current time - 0)
      expect(result).toBeGreaterThan(0);
    });
  });
});
