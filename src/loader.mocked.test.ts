import { describe, expect, it, vi } from 'vitest';
import { loadScript } from './loader.js';

// Mock fs/promises so we can simulate non-Error throws without touching real files
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';

const mockReadFile = vi.mocked(readFile);

describe('loadScript (mocked fs)', () => {
  describe('non-Error throw path', () => {
    it('should rethrow non-Error objects unchanged from readFile', async () => {
      // Exercises the `throw error` branch in loader.ts:36-37
      // when the thrown value is not an instanceof Error.
      // Use mockRejectedValueOnce (not throw) to avoid only-throw-error lint rule.
      mockReadFile.mockRejectedValueOnce('disk-read-failed-string');

      await expect(loadScript('/some/path.applescript')).rejects.toBe('disk-read-failed-string');
    });

    it('should wrap Error instances with helpful message', async () => {
      mockReadFile.mockImplementation(() => {
        throw new Error('ENOENT: no such file');
      });

      await expect(loadScript('/missing.applescript')).rejects.toThrow(
        'Failed to load script from /missing.applescript',
      );
    });
  });
});
