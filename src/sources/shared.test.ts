import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptExecutor } from '../executor.js';
import { executeJsonScript, executeScriptOrThrow } from './shared.js';

vi.mock('../executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
  },
}));

const mockExecute = vi.mocked(ScriptExecutor.execute);

describe('sources/shared', () => {
  beforeEach(() => {
    mockExecute.mockClear();
  });

  describe('executeScriptOrThrow', () => {
    it('should resolve when the script succeeds', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await expect(
        executeScriptOrThrow('return 1', 'Failed to run script'),
      ).resolves.toBeUndefined();
    });

    it('should throw a contextual error when the script fails', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        output: null,
        exitCode: 1,
      });

      await expect(executeScriptOrThrow('return 1', 'Failed to run script')).rejects.toThrow(
        'Failed to run script: Script execution failed',
      );
    });
  });

  describe('executeJsonScript', () => {
    it('should parse JSON output', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '{"name":"Finder"}',
        exitCode: 0,
      });

      await expect(
        executeJsonScript<{ name: string }>('return "{}"', {
          errorPrefix: 'Failed to get app',
          fallbackJson: '{}',
        }),
      ).resolves.toEqual({ name: 'Finder' });
    });

    it('should use fallback JSON when output is null', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: null,
        exitCode: 0,
      });

      await expect(
        executeJsonScript<unknown[]>('return ""', {
          errorPrefix: 'Failed to get items',
          fallbackJson: '[]',
        }),
      ).resolves.toEqual([]);
    });

    it('should throw a contextual error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        output: null,
        exitCode: 1,
      });

      await expect(
        executeJsonScript('return "{}"', {
          errorPrefix: 'Failed to get app',
          fallbackJson: '{}',
        }),
      ).rejects.toThrow('Failed to get app: Script execution failed');
    });
  });
});
