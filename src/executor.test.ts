import { describe, it, expect, vi } from 'vitest';
import { ScriptExecutor } from './executor';
import { exec } from 'node:child_process';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

describe('ScriptExecutor', () => {
  describe('execute', () => {
    it('should execute a script successfully', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(null, { stdout: 'test output\n', stderr: '' }),
      );

      const result = await ScriptExecutor.execute('tell application "Finder" to get name');
      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
      expect(result.exitCode).toBe(0);
    });

    it('should handle script execution errors', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(new Error('execution error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await ScriptExecutor.execute('invalid script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('execution error');
      expect(result.exitCode).toBe(1);
    });

    it('should handle language option', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((command, callback) => {
        expect(command).toContain('-l JavaScript');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute('console.log("test")', { language: 'JavaScript' });
    });

    it('should handle output flags', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((command, callback) => {
        expect(command).toContain('-s ho');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute('test script', {
        humanReadable: true,
        errorToStdout: true,
      });
    });

    it('should properly escape single quotes in scripts', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((command, callback) => {
        expect(command).toContain("'test'\"'\"'script'");
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute("test'script");
    });
  });

  describe('executeFile', () => {
    it('should execute a script file successfully', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(null, { stdout: 'test output\n', stderr: '' }),
      );

      const result = await ScriptExecutor.executeFile('test.scpt');
      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
      expect(result.exitCode).toBe(0);
    });

    it('should handle script file execution errors', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((_, callback) =>
        callback(new Error('file error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await ScriptExecutor.executeFile('nonexistent.scpt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('file error');
      expect(result.exitCode).toBe(1);
    });

    it('should handle file paths with spaces', async () => {
      const mockExec = exec as any;
      mockExec.mockImplementation((command, callback) => {
        expect(command).toContain('"test file.scpt"');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.executeFile('test file.scpt');
    });
  });
});
