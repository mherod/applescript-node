import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';
import { loadScript } from './loader.js';

const EXAMPLES_OUTPUT_DIR = join(process.cwd(), 'examples', 'output');

describe('loadScript', () => {
  describe('Load and build without breaking syntax', () => {
    it('should load and rebuild calculator-addition.applescript identically', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'calculator-addition.applescript');
      const originalContent = await readFile(scriptPath, 'utf-8');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      const rebuiltContent = builder.build();

      expect(rebuiltContent).toBe(originalContent);
    });

    it('should load and rebuild calculator-complex.applescript identically', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'calculator-complex.applescript');
      const originalContent = await readFile(scriptPath, 'utf-8');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      const rebuiltContent = builder.build();

      expect(rebuiltContent).toBe(originalContent);
    });

    it('should load and rebuild contacts-list.applescript with on handlers', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'contacts-list.applescript');
      const originalContent = await readFile(scriptPath, 'utf-8');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      const rebuiltContent = builder.build();

      expect(rebuiltContent).toBe(originalContent);
    });

    it('should load and rebuild contacts-search-advanced.applescript identically', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'contacts-search-advanced.applescript');
      const originalContent = await readFile(scriptPath, 'utf-8');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      const rebuiltContent = builder.build();

      expect(rebuiltContent).toBe(originalContent);
    });

    it('should load and rebuild notes-latest-json.applescript identically', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'notes-latest-json.applescript');
      const originalContent = await readFile(scriptPath, 'utf-8');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      const rebuiltContent = builder.build();

      expect(rebuiltContent).toBe(originalContent);
    });
  });

  describe('Loading and editing', () => {
    it('should allow appending commands after loading', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'calculator-addition.applescript');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      builder.tell('System Events').displayDialog('Script extended!').endtell();

      const result = builder.build();

      // Should contain original content
      expect(result).toContain('tell application "Calculator"');
      expect(result).toContain('activate');

      // Should contain appended content
      expect(result).toContain('tell application "System Events"');
      expect(result).toContain('display dialog "Script extended!"');
    });

    it('should maintain proper block stack for appending', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'calculator-addition.applescript');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);

      // This should not throw - all blocks should be properly closed
      expect(() => {
        builder.tell('Finder').activate().endtell().build();
      }).not.toThrow();
    });

    it('should allow appending to complex scripts with handlers', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'contacts-list.applescript');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);
      builder.comment('Script extended via loadScript');

      const result = builder.build();

      // Should contain original handlers
      expect(result).toContain('on escapeJsonString(str)');
      expect(result).toContain('on replaceText(theText, searchStr, replaceStr)');
      expect(result).toContain('on valueToJson(val)');

      // Should contain appended comment
      expect(result).toContain('-- Script extended via loadScript');
    });
  });

  describe('loadFromScript method', () => {
    it('should load script from string using loadFromScript', () => {
      const scriptContent = `tell application "Finder"
  activate
end tell`;

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toBe(scriptContent);
    });

    it('should allow chaining after loadFromScript', () => {
      const scriptContent = 'set x to 1';

      const builder = new AppleScriptBuilder();
      const result = builder.loadFromScript(scriptContent).set('y', 2).build();

      expect(result).toContain('set x to 1');
      expect(result).toContain('set y to 2');
    });

    it('should handle complex nested structures', () => {
      const scriptContent = `tell application "Finder"
  if (count of windows) > 0 then
    repeat with aWindow in every window
      try
        set the bounds of aWindow to {0, 0, 800, 600}
      on error
        -- Skip windows that cannot be resized
      end try
    end repeat
  end if
end tell`;

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toBe(scriptContent);
    });

    it('should handle scripts with on handlers', () => {
      const scriptContent = `on sayHello(name)
  display dialog "Hello " & name
end sayHello`;

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toBe(scriptContent);
    });

    it('should handle considering/ignoring blocks', () => {
      const scriptContent = `considering case
  if "ABC" = "abc" then
    display dialog "Match"
  end if
end considering`;

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toBe(scriptContent);
    });

    it('should handle empty scripts', () => {
      const scriptContent = '';

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toBe('');
    });

    it('should preserve comments', () => {
      const scriptContent = `-- This is a comment
tell application "Finder"
  activate -- Another comment
end tell`;

      const builder = new AppleScriptBuilder();
      builder.loadFromScript(scriptContent);
      const result = builder.build();

      expect(result).toContain('-- This is a comment');
      expect(result).toContain('-- Another comment');
    });
  });

  describe('Block detection', () => {
    it('should detect tell blocks with different formats', () => {
      const builder = new AppleScriptBuilder();

      builder.loadFromScript('tell application "Finder"\nend tell');
      expect(() => builder.build()).not.toThrow();

      builder.reset();
      builder.loadFromScript('tell application "System Events"\nend tell');
      expect(() => builder.build()).not.toThrow();
    });

    it('should detect if-then-else blocks', () => {
      const builder = new AppleScriptBuilder();

      builder.loadFromScript(`if true then
  set x to 1
else
  set x to 2
end if`);

      expect(() => builder.build()).not.toThrow();
    });

    it('should detect repeat blocks', () => {
      const builder = new AppleScriptBuilder();

      builder.loadFromScript('repeat 5 times\n  log "test"\nend repeat');
      expect(() => builder.build()).not.toThrow();

      builder.reset();
      builder.loadFromScript('repeat with i from 1 to 10\n  log i\nend repeat');
      expect(() => builder.build()).not.toThrow();
    });

    it('should detect try-catch blocks', () => {
      const builder = new AppleScriptBuilder();

      builder.loadFromScript(`try
  activate
on error
  log "error"
end try`);

      expect(() => builder.build()).not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should throw error for non-existent file', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'non-existent-file-12345.applescript');

      await expect(loadScript(scriptPath)).rejects.toThrow();
    });

    it('should provide helpful error message for missing files', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'missing.applescript');

      try {
        await loadScript(scriptPath);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to load script');
        expect((error as Error).message).toContain(scriptPath);
      }
    });
  });

  describe('Real-world usage patterns', () => {
    it('should load, modify, and rebuild without syntax errors', async () => {
      const scriptPath = join(EXAMPLES_OUTPUT_DIR, 'calculator-addition.applescript');

      const builder: AppleScriptBuilder = await loadScript(scriptPath);

      // Add logging
      builder.raw('log "Script loaded and extended"').tell('System Events').delay(0.5).endtell();

      const result = builder.build();

      // Should not throw when building
      expect(result).toBeTruthy();
      expect(result).toContain('log "Script loaded and extended"');
    });

    it('should handle loading multiple times', () => {
      const builder = new AppleScriptBuilder();

      builder.loadFromScript('set x to 1');
      builder.loadFromScript('set y to 2');

      const result = builder.build();

      expect(result).toContain('set x to 1');
      expect(result).toContain('set y to 2');
    });
  });
});
