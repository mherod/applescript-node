import { exec } from 'node:child_process';
import { describe, expect, it, type MockInstance, vi } from 'vitest';
import { ScriptExecutor } from './executor.js';

type ExecCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

describe('ScriptExecutor', () => {
  describe('execute', () => {
    it('should execute a script successfully', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(null, { stdout: 'test output\n', stderr: '' }),
      );

      const result = await ScriptExecutor.execute('tell application "Finder" to get name');
      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
      expect(result.exitCode).toBe(0);
    });

    it('should handle script execution errors', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(new Error('execution error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await ScriptExecutor.execute('invalid script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('execution error');
      expect(result.exitCode).toBe(1);
    });

    it('should extract exit code from error with string code property', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) => {
        const error = new Error('script syntax error') as Error & { code: string };
        error.code = '2';
        callback(error, { stdout: '', stderr: 'syntax error' });
      });

      const result = await ScriptExecutor.execute('invalid { syntax');
      expect(result.success).toBe(false);
      expect(result.error).toBe('script syntax error');
      expect(result.exitCode).toBe(2);
    });

    it('should extract exit code from error with numeric code property', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) => {
        const error = new Error('permission denied') as Error & { code: number };
        error.code = 126;
        callback(error, { stdout: '', stderr: 'permission denied' });
      });

      const result = await ScriptExecutor.execute('restricted script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('permission denied');
      expect(result.exitCode).toBe(126);
    });

    it('should default exit code to 1 when code is invalid string', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) => {
        const error = new Error('unknown error') as Error & { code: string };
        error.code = 'ENOENT'; // Non-numeric string code
        callback(error, { stdout: '', stderr: 'unknown error' });
      });

      const result = await ScriptExecutor.execute('script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('unknown error');
      expect(result.exitCode).toBe(1); // Defaults to 1 when parseInt fails
    });

    it('should handle non-Error objects as errors', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) => {
        callback('string error' as unknown as Error, { stdout: '', stderr: '' });
      });

      const result = await ScriptExecutor.execute('script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('string error');
      expect(result.exitCode).toBe(1);
    });

    it('should handle language option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-l JavaScript');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute('console.log("test")', { language: 'JavaScript' });
    });

    it('should handle output flags', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-s ho');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute('test script', {
        humanReadable: true,
        errorToStdout: true,
      });
    });

    it('should properly escape single quotes in scripts', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain("'test'\"'\"'script'");
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.execute("test'script");
    });
  });

  describe('executeFile', () => {
    it('should execute a script file successfully', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(null, { stdout: 'test output\n', stderr: '' }),
      );

      const result = await ScriptExecutor.executeFile('test.scpt');
      expect(result.success).toBe(true);
      expect(result.output).toBe('test output');
      expect(result.exitCode).toBe(0);
    });

    it('should handle script file execution errors', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(new Error('file error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await ScriptExecutor.executeFile('nonexistent.scpt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('file error');
      expect(result.exitCode).toBe(1);
    });

    it('should handle file paths with spaces', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('"test file.scpt"');
        callback(null, { stdout: 'test output\n', stderr: '' });
      });

      await ScriptExecutor.executeFile('test file.scpt');
    });
  });
});
