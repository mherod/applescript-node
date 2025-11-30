import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as applications from './applications.js';
import { ScriptExecutor } from '../executor.js';

vi.mock('../executor.js', () => ({
  ScriptExecutor: {
    execute: vi.fn(),
  },
}));

const mockExecute = vi.mocked(ScriptExecutor.execute);

describe('applications', () => {
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

      const apps = await applications.getAll();

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

      await applications.getAll();

      const scriptCall = mockExecute.mock.calls.at(-1);
      expect(scriptCall?.[0]).toContain('whose background only is false');
    });

    it('should include background apps when requested', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      await applications.getAll(true);

      const scriptCall = mockExecute.mock.calls[0];
      expect(scriptCall[0]).not.toContain('whose background only is false');
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Script execution failed',
        exitCode: 1,
      });

      await expect(applications.getAll()).rejects.toThrow(
        'Failed to get applications: Script execution failed',
      );
    });

    it('should handle empty result', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const apps = await applications.getAll();
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

      const app = await applications.getFrontmost();

      expect(app).toEqual(mockApp);
      expect(app.frontmost).toBe(true);
    });

    it('should throw error on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'No frontmost app',
        exitCode: 1,
      });

      await expect(applications.getFrontmost()).rejects.toThrow(
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

      const result = await applications.isRunning('Safari');
      expect(result).toBe(true);
    });

    it('should return false when app is not running', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'false',
        exitCode: 0,
      });

      const result = await applications.isRunning('NonExistentApp');
      expect(result).toBe(false);
    });

    it('should return false on execution failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Error',
        exitCode: 1,
      });

      const result = await applications.isRunning('Safari');
      expect(result).toBe(false);
    });

    it('should escape quotes in app name', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: 'true',
        exitCode: 0,
      });

      await applications.isRunning('App with "quotes"');

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

      const app = await applications.getByName('Safari');

      expect(app).not.toBeNull();
      expect(app?.name).toBe('Safari');
    });

    it('should return null when not found', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '[]',
        exitCode: 0,
      });

      const app = await applications.getByName('NonExistentApp');
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

      await expect(applications.activate('Safari')).resolves.not.toThrow();
    });

    it('should throw error on activation failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(applications.activate('NonExistentApp')).rejects.toThrow(
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

      await expect(applications.launch('Calendar')).resolves.not.toThrow();
    });

    it('should throw error on launch failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(applications.launch('NonExistentApp')).rejects.toThrow(
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

      await expect(applications.quit('TextEdit')).resolves.not.toThrow();
    });

    it('should throw error on quit failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not running',
        exitCode: 1,
      });

      await expect(applications.quit('NonExistentApp')).rejects.toThrow(
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

      await expect(applications.hide('Safari')).resolves.not.toThrow();
    });

    it('should throw error on hide failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(applications.hide('NonExistentApp')).rejects.toThrow(
        'Failed to hide NonExistentApp: Application not found',
      );
    });

    it('should escape quotes in app name', async () => {
      mockExecute.mockResolvedValueOnce({
        success: true,
        output: '',
        exitCode: 0,
      });

      await applications.hide('App with "quotes"');

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

      await expect(applications.show('Safari')).resolves.not.toThrow();
    });

    it('should throw error on show failure', async () => {
      mockExecute.mockResolvedValueOnce({
        success: false,
        error: 'Application not found',
        exitCode: 1,
      });

      await expect(applications.show('NonExistentApp')).rejects.toThrow(
        'Failed to show NonExistentApp: Application not found',
      );
    });
  });
});
