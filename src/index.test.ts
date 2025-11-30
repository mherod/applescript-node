import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptExecutor } from './executor.js';
import { createScript, runScript, runScriptFile } from './index.js';

// Mock the ScriptExecutor
vi.mock('./executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
    executeFile: vi.fn(),
  },
}));

describe('index exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createScript', () => {
    it('should create a new AppleScriptBuilder instance', () => {
      const script = createScript();
      expect(script).toBeDefined();
      expect(typeof script.build).toBe('function');
      expect(typeof script.tell).toBe('function');
    });
  });

  describe('runScript', () => {
    it('should execute a string script', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: 'hello world',
        exitCode: 0,
      });

      const result = await runScript('display dialog "Hello"');

      expect(ScriptExecutor.execute).toHaveBeenCalledWith('display dialog "Hello"', undefined);
      expect(result.success).toBe(true);
      expect(result.output).toBe('hello world');
    });

    it('should execute a ScriptBuilder script', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: 'result',
        exitCode: 0,
      });

      const script = createScript().tell('Finder').activate().end();
      const result = await runScript(script);

      expect(ScriptExecutor.execute).toHaveBeenCalledWith(script.build(), undefined);
      expect(result.success).toBe(true);
    });

    it('should pass options to executor', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: 'test',
        exitCode: 0,
      });

      await runScript('test', { language: 'JavaScript' });

      expect(ScriptExecutor.execute).toHaveBeenCalledWith('test', { language: 'JavaScript' });
    });

    it('should auto-parse JSON array output', async () => {
      const jsonArray = '[{"id":1,"name":"test"},{"id":2,"name":"test2"}]';
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: jsonArray,
        exitCode: 0,
      });

      const result = await runScript('get data');

      expect(result.output).toEqual([
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ]);
    });

    it('should auto-parse JSON object output', async () => {
      const jsonObject = '{"name":"John","age":30}';
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: jsonObject,
        exitCode: 0,
      });

      const result = await runScript('get data');

      expect(result.output).toEqual({ name: 'John', age: 30 });
    });

    it('should handle JSON output with whitespace', async () => {
      const jsonArray = '  [{"id":1}]  ';
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: jsonArray,
        exitCode: 0,
      });

      const result = await runScript('get data');

      expect(result.output).toEqual([{ id: 1 }]);
    });

    it('should return string as-is when JSON parsing fails', async () => {
      // String starts with [ but is not valid JSON
      const invalidJson = '[not valid json';
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: invalidJson,
        exitCode: 0,
      });

      const result = await runScript('get data');

      expect(result.output).toBe(invalidJson);
    });

    it('should return string as-is when output does not start with JSON characters', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: 'hello world',
        exitCode: 0,
      });

      const result = await runScript('get data');

      expect(result.output).toBe('hello world');
    });

    it('should not parse JSON when result is not successful', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: false,
        output: '{"error": "test"}',
        error: 'Script execution failed',
        exitCode: 1,
      });

      const result = await runScript('bad script');

      expect(result.success).toBe(false);
      // Output should remain as string when not successful
      expect(result.output).toBe('{"error": "test"}');
    });

    it('should handle empty output', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      const result = await runScript('test');

      expect(result.output).toBe('');
    });

    it('should handle null/undefined output', async () => {
      vi.mocked(ScriptExecutor.execute).mockResolvedValueOnce({
        success: true,
        output: undefined as unknown as string,
        exitCode: 0,
      });

      const result = await runScript('test');

      expect(result.output).toBeUndefined();
    });
  });

  describe('runScriptFile', () => {
    it('should execute a script file', async () => {
      vi.mocked(ScriptExecutor.executeFile).mockResolvedValueOnce({
        success: true,
        output: 'file result',
        exitCode: 0,
      });

      const result = await runScriptFile('/path/to/script.scpt');

      expect(ScriptExecutor.executeFile).toHaveBeenCalledWith('/path/to/script.scpt', undefined);
      expect(result.success).toBe(true);
      expect(result.output).toBe('file result');
    });

    it('should pass options to executeFile', async () => {
      vi.mocked(ScriptExecutor.executeFile).mockResolvedValueOnce({
        success: true,
        output: 'test',
        exitCode: 0,
      });

      await runScriptFile('/path/to/script.scpt', { humanReadable: true });

      expect(ScriptExecutor.executeFile).toHaveBeenCalledWith('/path/to/script.scpt', {
        humanReadable: true,
      });
    });
  });
});
