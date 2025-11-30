/**
 * Additional tests to improve coverage for builder.ts
 * These tests cover methods that were not fully tested before.
 */
import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';

describe('AppleScriptBuilder Coverage Tests', () => {
  describe('Block validation edge cases', () => {
    it('should throw when calling popBlock with no blocks open', () => {
      const builder = new AppleScriptBuilder();
      // Access the private method via build() which validates the stack
      // No blocks opened, so building should work
      expect(builder.build()).toBe('');
    });

    it('should throw error for unclosed blocks on build', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder');
      // Don't close the block
      expect(() => builder.build()).toThrow('Unclosed blocks remain: tell');
    });

    it('should throw error for multiple unclosed blocks on build', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder').if('true').thenBlock();
      // Don't close either block
      expect(() => builder.build()).toThrow('Unclosed blocks remain: tell, if');
    });
  });

  describe('repeat without times', () => {
    it('should create repeat block without times (infinite loop)', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.repeat().raw('do something').exitRepeat().end().build();

      expect(script).toBe('repeat\n  do something\n  exit repeat\nend repeat');
    });
  });

  describe('Application control methods', () => {
    it('should generate reopen command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('Finder').reopen().end().build();

      expect(script).toContain('reopen');
    });

    it('should generate running command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('Finder').running().end().build();

      expect(script).toContain('running');
    });

    it('should generate closeWindow with specific window name', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('Finder').closeWindow('Downloads').end().build();

      expect(script).toContain('close window "Downloads"');
    });
  });

  describe('UI interaction methods', () => {
    it('should generate click command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.click('button 1').build();

      expect(script).toBe('click button 1');
    });

    it('should generate select command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.select('row 1').build();

      expect(script).toBe('select row 1');
    });
  });

  describe('List operations', () => {
    it('should generate first item command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.first('myList').build();

      expect(script).toBe('first item of myList');
    });

    it('should generate last item command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.last('myList').build();

      expect(script).toBe('last item of myList');
    });

    it('should generate rest command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.rest('myList').build();

      expect(script).toBe('rest of myList');
    });

    it('should generate reverse command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.reverse('myList').build();

      expect(script).toBe('reverse of myList');
    });

    it('should generate some command with test', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.some('myList', 'it > 5').build();

      expect(script).toBe('some item of myList where it > 5');
    });

    it('should generate every command with test', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.every('myList', 'it < 10').build();

      expect(script).toBe('every item of myList where it < 10');
    });

    it('should generate whose expression', () => {
      const builder = new AppleScriptBuilder();
      const result = builder.whose('files', 'name ends with ".txt"');

      expect(result).toBe('files whose name ends with ".txt"');
    });

    it('should generate getEvery with location', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getEvery('file', 'folder "Documents"').build();

      expect(script).toBe('get every file of folder "Documents"');
    });

    it('should generate getEveryWhere with location', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getEveryWhere('file', 'name contains "test"', 'desktop').build();

      expect(script).toBe('get every file of desktop where name contains "test"');
    });
  });

  describe('Text operations', () => {
    it('should generate offset command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.offset('"find"', 'myText').build();

      expect(script).toBe('offset of "find" in myText');
    });

    it('should generate contains command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.contains('"search"', 'myText').build();

      expect(script).toBe('myText contains "search"');
    });

    it('should generate beginsWith command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.beginsWith('myText', '"Hello"').build();

      expect(script).toBe('myText begins with "Hello"');
    });

    it('should generate endsWith command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.endsWith('myText', '"World"').build();

      expect(script).toBe('myText ends with "World"');
    });
  });

  describe('System operations', () => {
    it('should generate path command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.path('desktop').build();

      expect(script).toBe('path to desktop');
    });

    it('should generate info command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.info('myFile').build();

      expect(script).toBe('info for myFile');
    });

    it('should generate do script command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.do('ls -la').build();

      expect(script).toBe('do script "ls -la"');
    });

    it('should generate doShellScript with admin privileges', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.doShellScript('sudo rm -rf', true).build();

      expect(script).toBe('do shell script "sudo rm -rf" with administrator privileges');
    });
  });

  describe('Enhanced Application control', () => {
    it('should generate activateApplication command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.activateApplication('Safari').build();

      expect(script).toBe('tell application "Safari" to activate');
    });

    it('should generate hideApplication command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.hideApplication('Finder').build();

      expect(script).toBe(
        'tell application "System Events" to tell process "Finder" to set visible to false',
      );
    });

    it('should generate unhideApplication command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.unhideApplication('Finder').build();

      expect(script).toBe(
        'tell application "System Events" to tell process "Finder" to set visible to true',
      );
    });

    it('should generate quitApplication command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.quitApplication('Safari').build();

      expect(script).toBe('tell application "Safari" to quit');
    });

    it('should generate isApplicationRunning command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.isApplicationRunning('Safari').build();

      expect(script).toBe(
        'tell application "System Events" to return exists (processes where name is "Safari")',
      );
    });

    it('should generate getApplicationInfo command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getApplicationInfo('Finder').build();

      expect(script).toBe(
        'tell application "System Events" to tell process "Finder" to return properties',
      );
    });
  });

  describe('Enhanced Window management', () => {
    it('should generate getWindowInfo with window name', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getWindowInfo('Finder', 'Downloads').build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to return {name, id, bounds, miniaturized, zoomed}',
      );
    });

    it('should generate getWindowInfo without window name (front window)', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getWindowInfo('Finder').build();

      expect(script).toBe(
        'tell application "Finder" to tell front window to return {name, id, bounds, miniaturized, zoomed}',
      );
    });

    it('should generate getAllWindows command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getAllWindows('Safari').build();

      expect(script).toBe(
        'tell application "Safari" to return {name, id, bounds, miniaturized, zoomed} of every window',
      );
    });

    it('should generate getFrontmostWindow command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getFrontmostWindow('Safari').build();

      expect(script).toBe(
        'tell application "Safari" to tell front window to return {name, id, bounds, miniaturized, zoomed}',
      );
    });

    it('should generate setWindowBounds command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .setWindowBounds('Finder', 'Downloads', { x: 100, y: 100, width: 800, height: 600 })
        .build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to set bounds to {100, 100, 900, 700}',
      );
    });

    it('should generate moveWindow command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.moveWindow('Finder', 'Downloads', 200, 150).build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to set position to {200, 150}',
      );
    });

    it('should generate resizeWindow command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.resizeWindow('Finder', 'Downloads', 1024, 768).build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to set size to {1024, 768}',
      );
    });

    it('should generate arrangeWindows command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.arrangeWindows('cascade').build();

      expect(script).toBe(
        'tell application "System Events" to tell process "Finder" to cascade windows',
      );
    });

    it('should generate focusWindow command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.focusWindow('Safari', 'Google').build();

      expect(script).toContain('tell application "Safari" to activate');
      expect(script).toContain('tell window "Google" to set index to 1');
    });

    it('should generate switchToWindow command (alias for focusWindow)', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.switchToWindow('Safari', 'GitHub').build();

      expect(script).toContain('tell application "Safari" to activate');
      expect(script).toContain('tell window "GitHub" to set index to 1');
    });
  });

  describe('Enhanced UI interaction', () => {
    it('should generate pressKey command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.pressKey('36').build();

      expect(script).toBe('tell application "System Events" to key code 36');
    });

    it('should generate pressKey command with modifiers', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.pressKey('36', ['command', 'shift']).build();

      expect(script).toBe('tell application "System Events" to key code 36 using {command, shift}');
    });

    it('should generate pressKeyCode command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.pressKeyCode(36).build();

      expect(script).toBe('tell application "System Events" to key code 36');
    });

    it('should generate pressKeyCode command with modifiers', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.pressKeyCode(36, ['option', 'control']).build();

      expect(script).toBe(
        'tell application "System Events" to key code 36 using {option, control}',
      );
    });

    it('should generate typeText command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.typeText('Hello World').build();

      expect(script).toBe('tell application "System Events" to keystroke "Hello World"');
    });

    it('should generate clickButton command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.clickButton('OK').build();

      expect(script).toBe('tell application "System Events" to click button "OK"');
    });

    it('should generate clickMenuItem command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.clickMenuItem('File', 'New').build();

      expect(script).toContain('menu bar 1');
      expect(script).toContain('menu "File"');
      expect(script).toContain('menu item "New"');
    });
  });

  describe('mapToJson with PropertyExtractor edge cases', () => {
    it('should handle PropertyExtractor with just expression (no firstOf/ifExists)', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('Contacts')
        .mapToJson(
          'aPerson',
          'every person',
          {
            id: 'id',
            name: 'name',
          },
          { limit: 5 },
        )
        .endtell()
        .build();

      expect(script).toContain('repeat with aPerson in every person');
      expect(script).toContain('id:id of aPerson');
      expect(script).toContain('name:name of aPerson');
    });
  });

  describe('reset method', () => {
    it('should reset the builder state', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder').activate().end();
      const firstScript = builder.build();

      builder.reset();

      builder.tell('Safari').end();
      const secondScript = builder.build();

      expect(firstScript).toContain('Finder');
      expect(secondScript).not.toContain('Finder');
      expect(secondScript).toContain('Safari');
    });
  });

  describe('loadFromScript method', () => {
    it('should load and continue building from an existing script', () => {
      const builder = new AppleScriptBuilder();
      builder.loadFromScript('tell application "Finder"\nend tell');

      // Continue building
      builder.displayDialog('Hello');

      const script = builder.build();
      expect(script).toContain('tell application "Finder"');
      expect(script).toContain('display dialog "Hello"');
    });
  });
});
