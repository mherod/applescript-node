import { exec } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { compileScript, compileScriptFile } from './compiler.js';

type ExecCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

describe('Compiler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compileScript', () => {
    it('should compile a script successfully', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(null, { stdout: '', stderr: '' }),
      );

      const result = await compileScript('tell application "Finder" to get name', {
        outputPath: 'test.scpt',
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('test.scpt');
      expect(writeFile).toHaveBeenCalled();
    });

    it('should handle compilation errors', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(new Error('compilation error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await compileScript('invalid script');
      expect(result.success).toBe(false);
      expect(result.error).toBe('compilation error');
    });

    it('should handle language option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-l JavaScript');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScript('console.log("test")', {
        language: 'JavaScript',
        outputPath: 'test.scpt',
      });
    });

    it('should handle execute-only option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-x');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScript('test script', {
        executeOnly: true,
        outputPath: 'test.scpt',
      });
    });

    it('should handle stay-open option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-s');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScript('test script', {
        stayOpen: true,
        outputPath: 'test.scpt',
      });
    });

    it('should handle startup screen option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('-u');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScript('test script', {
        useStartupScreen: true,
        outputPath: 'test.scpt',
      });
    });

    it('should handle bundle script option', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('.scptd"');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScript('test script', {
        bundleScript: true,
        outputPath: 'test',
      });
    });
  });

  describe('compileScriptFile', () => {
    it('should compile a script file successfully', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(null, { stdout: '', stderr: '' }),
      );

      const result = await compileScriptFile('source.applescript', {
        outputPath: 'test.scpt',
      });

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('test.scpt');
    });

    it('should handle compilation errors', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((_command: string, callback: ExecCallback) =>
        callback(new Error('compilation error'), { stdout: '', stderr: 'error output' }),
      );

      const result = await compileScriptFile('invalid.applescript');
      expect(result.success).toBe(false);
      expect(result.error).toBe('compilation error');
    });

    it('should handle file paths with spaces', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('"source file.applescript"');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScriptFile('source file.applescript');
    });

    it('should use default output path when not specified', async () => {
      const mockExec = exec as unknown as MockInstance;
      mockExec.mockImplementation((command: string, callback: ExecCallback) => {
        expect(command).toContain('source.scpt');
        callback(null, { stdout: '', stderr: '' });
      });

      await compileScriptFile('source.applescript');
    });
  });
});
