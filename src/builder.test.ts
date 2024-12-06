import { describe, it, expect } from 'vitest';
import { AppleScriptBuilder } from './builder.js';

describe('AppleScriptBuilder', () => {
  describe('Core language constructs', () => {
    it('should create a tell block', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('System Events').end().build();

      expect(script).toBe('tell application "System Events"\nend tell');
    });

    it('should handle nested tell blocks', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('System Events').tell('process "Finder"').end().end().build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  tell application "process "Finder""\n' +
          '  end tell\n' +
          'end tell',
      );
    });

    it('should handle if statements', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.if('true').then().set('x', 1).end().build();

      expect(script).toBe('if true\n' + '  then\n' + '  set x to 1\n' + 'end if');
    });
  });

  describe('Application control', () => {
    it('should generate script to get running applications', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getRunningApplications().build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  tell application "System Events" to return {name, bundle identifier, visible, frontmost} of every process where background only is false\n' +
          'end tell',
      );
    });

    it('should generate script to get frontmost application', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getFrontmostApplication().build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  tell application "System Events" to return name of first process where frontmost is true\n' +
          'end tell',
      );
    });
  });

  describe('Window management', () => {
    it('should generate script to get window info', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getWindowInfo('Finder', 'Downloads').build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  tell window "Downloads" to return {name, id, bounds, miniaturized, zoomed}\n' +
          'end tell',
      );
    });

    it('should generate script to move and resize windows', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .moveWindow('Finder', 'Downloads', 100, 200)
        .resizeWindow('Finder', 'Downloads', 800, 600)
        .build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  tell window "Downloads" to set position to {100, 200}\n' +
          'end tell\n' +
          'tell application "Finder"\n' +
          '  tell window "Downloads" to set size to {800, 600}\n' +
          'end tell',
      );
    });
  });

  describe('Value formatting', () => {
    it('should format string values with quotes', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('myString', 'hello world').build();

      expect(script).toBe('set myString to "hello world"');
    });

    it('should format number values without quotes', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('myNumber', 42).build();

      expect(script).toBe('set myNumber to 42');
    });

    it('should format boolean values as true/false', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('myBool', true).build();

      expect(script).toBe('set myBool to true');
    });

    it('should format array values as lists', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('myList', [1, 'two', true]).build();

      expect(script).toBe('set myList to {1, "two", true}');
    });

    it('should format null as missing value', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('myNull', null).build();

      expect(script).toBe('set myNull to missing value');
    });
  });

  describe('Complex control structures', () => {
    it('should handle nested if-then-else blocks', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .if('x > 10')
        .then()
        .if('y > 20')
        .then()
        .set('result', 'both conditions met')
        .else()
        .set('result', 'only x > 10')
        .end()
        .else()
        .set('result', 'no conditions met')
        .end()
        .build();

      expect(script).toBe(
        'if x > 10\n' +
          '  then\n' +
          '  if y > 20\n' +
          '    then\n' +
          '    set result to "both conditions met"\n' +
          '  else\n' +
          '    set result to "only x > 10"\n' +
          '  end if\n' +
          'else\n' +
          '  set result to "no conditions met"\n' +
          'end if',
      );
    });

    it('should handle repeat with complex conditions', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('System Events')
        .set('counter', 1)
        .repeatWhile('counter < 5 and application "Finder" is running')
        .raw('set counter to counter + 1')
        .end()
        .end()
        .build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  set counter to 1\n' +
          '  repeat while counter < 5 and application "Finder" is running\n' +
          '    set counter to counter + 1\n' +
          '  end repeat\n' +
          'end tell',
      );
    });

    it('should handle considering/ignoring blocks', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .considering(['case', 'punctuation'])
        .if('someText contains "Hello!"')
        .then()
        .set('exactMatch', true)
        .end()
        .end()
        .build();

      expect(script).toBe(
        'considering case, punctuation\n' +
          '  if someText contains "Hello!"\n' +
          '    then\n' +
          '    set exactMatch to true\n' +
          '  end if\n' +
          'end considering',
      );
    });
  });

  describe('Complex window management', () => {
    it('should handle window bounds with calculations', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('Finder')
        .raw('tell window "Downloads" to set bounds to {100, 200, 900, 800}')
        .end()
        .build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  tell window "Downloads" to set bounds to {100, 200, 900, 800}\n' +
          'end tell',
      );
    });

    it('should handle multiple window operations in sequence', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('Finder')
        .minimizeWindow('Downloads')
        .delay(0.5)
        .zoomWindow('Downloads')
        .raw('tell window "Downloads" to set position to {100, 200}')
        .end()
        .build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  set miniaturized of window "Downloads" to true\n' +
          '  delay 0.5\n' +
          '  set zoomed of window "Downloads" to true\n' +
          '  tell window "Downloads" to set position to {100, 200}\n' +
          'end tell',
      );
    });
  });

  describe('Complex UI interactions', () => {
    it('should handle keystroke with multiple modifiers', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('System Events')
        .keystroke('s', ['command', 'shift', 'option'])
        .end()
        .build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  keystroke "s" using {command, shift, option}\n' +
          'end tell',
      );
    });

    it('should handle complex menu navigation', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('System Events')
        .raw('click menu item "Export As" of menu "File" of menu bar 1')
        .delay(0.5)
        .raw('click button "Save"')
        .end()
        .build();

      expect(script).toBe(
        'tell application "System Events"\n' +
          '  click menu item "Export As" of menu "File" of menu bar 1\n' +
          '  delay 0.5\n' +
          '  click button "Save"\n' +
          'end tell',
      );
    });
  });

  describe('Complex value formatting', () => {
    it('should handle nested object structures', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .set('complexObj', {
          name: 'test',
          numbers: [1, 2, 3],
          nested: {
            flag: true,
            text: 'nested value',
          },
        })
        .build();

      expect(script).toBe(
        'set complexObj to {name:"test", numbers:{1, 2, 3}, nested:{flag:true, text:"nested value"}}',
      );
    });

    it('should handle arrays of objects', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .set('items', [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' },
          { id: 3, name: 'third' },
        ])
        .build();

      expect(script).toBe(
        'set items to {{id:1, name:"first"}, {id:2, name:"second"}, {id:3, name:"third"}}',
      );
    });

    it('should handle mixed arrays with null values', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.set('mixedList', [1, 'text', true, null, { key: 'value' }]).build();

      expect(script).toBe('set mixedList to {1, "text", true, missing value, {key:"value"}}');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty blocks correctly', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tell('Finder').if('true').then().end().end().build();

      expect(script).toBe(
        'tell application "Finder"\n' + '  if true\n' + '    then\n' + '  end if\n' + 'end tell',
      );
    });

    it('should throw when trying to end too many blocks', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder').end();
      expect(() => builder.end()).toThrow('Cannot call end(): no blocks are currently open');
    });

    it('should throw when trying to build with unclosed blocks', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder');
      expect(() => builder.build()).toThrow('Unclosed blocks remain: tell');
    });
  });

  describe('Block validation', () => {
    it('should throw when ending a non-existent block', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.end()).toThrow('Cannot call end(): no blocks are currently open');
    });

    it('should throw when building with unclosed blocks', () => {
      const builder = new AppleScriptBuilder();
      builder.tell('Finder');
      expect(() => builder.build()).toThrow('Unclosed blocks remain: tell');
    });

    it('should throw when calling then() without an if block', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.then()).toThrow('Cannot call then(): no if block is currently open');
    });

    it('should throw when calling else() without an if block', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.else()).toThrow('Cannot call else(): no if block is currently open');
    });

    it('should throw when using repeat with invalid times', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.repeat(0)).toThrow('Repeat times must be a positive integer');
      expect(() => builder.repeat(-1)).toThrow('Repeat times must be a positive integer');
      expect(() => builder.repeat(1.5)).toThrow('Repeat times must be a positive integer');
    });

    it('should throw when using repeatWith without required parameters', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.repeatWith('', 'list')).toThrow(
        'Both variable and list must be provided for repeatWith',
      );
      expect(() => builder.repeatWith('var', '')).toThrow(
        'Both variable and list must be provided for repeatWith',
      );
    });

    it('should throw when using repeatUntil without a condition', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.repeatUntil('')).toThrow('Condition must be provided for repeatUntil');
    });

    it('should throw when using repeatWhile without a condition', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.repeatWhile('')).toThrow('Condition must be provided for repeatWhile');
    });

    it('should throw when using considering without attributes', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.considering([])).toThrow(
        'At least one attribute must be provided for considering',
      );
    });

    it('should throw when using ignoring without attributes', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.ignoring([])).toThrow(
        'At least one attribute must be provided for ignoring',
      );
    });

    it('should properly close nested blocks with correct end statements', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tell('Finder')
        .if('true')
        .then()
        .considering(['case'])
        .end()
        .end()
        .end()
        .build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  if true\n' +
          '    then\n' +
          '    considering case\n' +
          '    end considering\n' +
          '  end if\n' +
          'end tell',
      );
    });
  });
});
