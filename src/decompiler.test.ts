import { describe, it, expect, vi } from 'vitest';
import { decompileScript } from './decompiler';
import { exec } from 'node:child_process';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

describe('Decompiler', () => {
  describe('decompileScript', () => {
    it('should decompile a script successfully', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(null, {
          stdout: 'tell application "Finder" to get name\n',
          stderr: '',
        }),
      );

      const result = await decompileScript('test.scpt');
      expect(result.success).toBe(true);
      expect(result.source).toBe('tell application "Finder" to get name');
    });

    it('should handle decompilation errors', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(new Error('decompilation error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await decompileScript('invalid.scpt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('decompilation error');
    });

    it('should handle stderr output', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(null, { stdout: '', stderr: 'warning message' }),
      );

      const result = await decompileScript('test.scpt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('warning message');
    });

    it('should handle file paths with spaces', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((command, callback) => {
        expect(command).toContain('"test file.scpt"');
        callback(null, { stdout: 'script content\n', stderr: '' });
      });

      await decompileScript('test file.scpt');
    });

    it('should handle execute-only scripts', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(new Error('execute only'), { stdout: '', stderr: 'Script is execute-only' }),
      );

      const result = await decompileScript('execute-only.scpt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('execute only');
    });
  });
});
