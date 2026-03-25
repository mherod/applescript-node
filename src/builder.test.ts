import { describe, expect, it } from 'vitest';
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
          '  tell application "process \\"Finder\\""\n' +
          '  end tell\n' +
          'end tell',
      );
    });

    it('should handle if statements', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.if('true').thenBlock().set('x', 1).end().build();

      expect(script).toBe('if true then\n  set x to 1\nend if');
    });
  });

  describe('Application control', () => {
    it('should generate script to get running applications', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getRunningApplications().build();

      expect(script).toBe(
        'tell application "System Events" to return {name, bundle identifier, visible, frontmost} of every process where background only is false',
      );
    });

    it('should generate script to get frontmost application', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getFrontmostApplication().build();

      expect(script).toBe(
        'tell application "System Events" to return name of first process where frontmost is true',
      );
    });
  });

  describe('Window management', () => {
    it('should generate script to get window info', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.getWindowInfo('Finder', 'Downloads').build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to return {name, id, bounds, miniaturized, zoomed}',
      );
    });

    it('should generate script to move and resize windows', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .moveWindow('Finder', 'Downloads', 100, 200)
        .resizeWindow('Finder', 'Downloads', 800, 600)
        .build();

      expect(script).toBe(
        'tell application "Finder" to tell window "Downloads" to set position to {100, 200}\n' +
          'tell application "Finder" to tell window "Downloads" to set size to {800, 600}',
      );
    });
  });

  describe('iTerm2 scripting', () => {
    it('should wrap tellITerm2 with default application name', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tellITerm2((b) => b.activate()).build();

      expect(script).toBe('tell application "iTerm2"\n  activate\nend tell');
    });

    it('should allow tellITerm2 applicationName override', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.tellITerm2((b) => b.activate(), { applicationName: 'iTerm' }).build();

      expect(script).toBe('tell application "iTerm"\n  activate\nend tell');
    });

    it('should nest itermTellCurrentWindow and itermTellCurrentSession', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tellITerm2((b) => {
          b.itermTellCurrentWindow((w) => {
            w.itermCreateTabWithDefaultProfile();
            w.itermTellCurrentSession((s) => {
              s.itermWriteText('date');
            });
          });
        })
        .build();

      expect(script).toBe(
        [
          'tell application "iTerm2"',
          '  tell current window',
          '    create tab with default profile',
          '    tell current session of current window',
          '      write text "date"',
          '    end tell',
          '  end tell',
          'end tell',
        ].join('\n'),
      );
    });

    it('should emit itermWriteText with newline NO', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.itermWriteText('pwd', { newline: false }).build();

      expect(script).toBe('write text "pwd" newline NO');
    });

    it('should escape quotes in itermWriteText', () => {
      const builder = new AppleScriptBuilder();
      const script = builder.itermWriteText('say "hi"').build();

      expect(script).toBe('write text "say \\"hi\\""');
    });

    it('should emit window and tab create helpers with optional command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .itermCreateWindowWithDefaultProfile()
        .itermCreateWindowWithDefaultProfile({ command: 'ls' })
        .itermCreateWindowWithProfile('Prod', { command: 'top' })
        .itermCreateHotkeyWindowWithProfile('Hotkey Window')
        .itermCreateTabWithDefaultProfile({ command: 'whoami' })
        .itermCreateTabWithProfile('Default', { command: 'uptime' })
        .build();

      expect(script).toBe(
        [
          'create window with default profile',
          'create window with default profile command "ls"',
          'create window with profile "Prod" command "top"',
          'create hotkey window with profile "Hotkey Window"',
          'create tab with default profile command "whoami"',
          'create tab with profile "Default" command "uptime"',
        ].join('\n'),
      );
    });

    it('should emit split helpers with and without command', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .itermSplitHorizontallyWithDefaultProfile()
        .itermSplitVerticallyWithProfile('Logs')
        .itermSplitHorizontallyWithSameProfile({ command: 'bash' })
        .itermSplitVerticallyWithSameProfile()
        .build();

      expect(script).toBe(
        [
          'split horizontally with default profile',
          'split vertically with profile "Logs"',
          'split horizontally with same profile command "bash"',
          'split vertically with same profile',
        ].join('\n'),
      );
    });

    it('should wrap itermTellSession for arbitrary session references', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .tellITerm2((b) => {
          b.itermTellSession('rightPane', (s) => {
            s.itermWriteText('echo right');
          });
        })
        .build();

      expect(script).toBe(
        [
          'tell application "iTerm2"',
          '  tell rightPane',
          '    write text "echo right"',
          '  end tell',
          'end tell',
        ].join('\n'),
      );
    });

    it('should emit itermWriteContentsOfFile and itermSetSessionVariable', () => {
      const builder = new AppleScriptBuilder();
      const script = builder
        .itermWriteContentsOfFile('/tmp/commands.txt')
        .itermSetSessionVariable('user.badge', 'build ok')
        .build();

      expect(script).toBe(
        'write contents of file "/tmp/commands.txt"\n' +
          'set variable named "user.badge" to "build ok"',
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
        .thenBlock()
        .if('y > 20')
        .thenBlock()
        .set('result', 'both conditions met')
        .else()
        .set('result', 'only x > 10')
        .end()
        .else()
        .set('result', 'no conditions met')
        .end()
        .build();

      expect(script).toBe(
        'if x > 10 then\n' +
          '  if y > 20 then\n' +
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
        .thenBlock()
        .set('exactMatch', true)
        .end()
        .end()
        .build();

      expect(script).toBe(
        'considering case, punctuation\n' +
          '  if someText contains "Hello!" then\n' +
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
      const script = builder.tell('Finder').if('true').thenBlock().end().end().build();

      expect(script).toBe('tell application "Finder"\n  if true then\n  end if\nend tell');
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

    it('should throw when calling thenBlock() without an if block', () => {
      const builder = new AppleScriptBuilder();
      expect(() => builder.thenBlock()).toThrow(
        'Cannot call thenBlock(): no if block is currently open',
      );
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
        .thenBlock()
        .considering(['case'])
        .end()
        .end()
        .end()
        .build();

      expect(script).toBe(
        'tell application "Finder"\n' +
          '  if true then\n' +
          '    considering case\n' +
          '    end considering\n' +
          '  end if\n' +
          'end tell',
      );
    });
  });

  describe('New features', () => {
    describe('Block stack tracking fixes', () => {
      it('should properly track using() blocks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.using(['terms from application "Finder"']).end().build();

        expect(script).toBe('using terms from terms from application "Finder"\nend using');
      });

      it('should properly track with() blocks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.with(30).end().build();

        expect(script).toBe('with timeout of 30\nend with');
      });

      it('should properly track try() blocks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.try().set('x', 1).end().build();

        expect(script).toBe('try\n  set x to 1\nend try');
      });
    });

    describe('String escaping', () => {
      it('should escape quotes in string values', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('myString', 'Say "Hello"').build();

        expect(script).toBe('set myString to "Say \\"Hello\\""');
      });

      it('should escape backslashes in string values', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('myPath', 'C:\\Users\\Test').build();

        expect(script).toBe('set myPath to "C:\\\\Users\\\\Test"');
      });

      it('should escape quotes in displayDialog', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.displayDialog('Say "Hello"').build();

        expect(script).toBe('display dialog "Say \\"Hello\\""');
      });

      it('should escape quotes in tell application', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('App "Test"').end().build();

        expect(script).toBe('tell application "App \\"Test\\""\nend tell');
      });
    });

    describe('reset() method', () => {
      it('should reset builder state', () => {
        const builder = new AppleScriptBuilder();
        builder.tell('Finder').end();
        const firstScript = builder.build();

        builder.reset();
        builder.tell('Safari').end();
        const secondScript = builder.build();

        expect(firstScript).toBe('tell application "Finder"\nend tell');
        expect(secondScript).toBe('tell application "Safari"\nend tell');
      });

      it('should clear block stack', () => {
        const builder = new AppleScriptBuilder();
        builder.tell('Finder');

        builder.reset();
        const script = builder.tell('Safari').end().build();

        expect(script).toBe('tell application "Safari"\nend tell');
      });
    });

    describe('elseIf() method', () => {
      it('should handle elseIf chains', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .if('x = 1')
          .thenBlock()
          .set('result', 'one')
          .elseIf('x = 2')
          .thenBlock()
          .set('result', 'two')
          .else()
          .set('result', 'other')
          .end()
          .build();

        expect(script).toBe(
          'if x = 1 then\n' +
            '  set result to "one"\n' +
            'else if x = 2 then\n' +
            '  set result to "two"\n' +
            'else\n' +
            '  set result to "other"\n' +
            'end if',
        );
      });

      it('should throw when calling elseIf() without an if block', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.elseIf('x = 2')).toThrow(
          'Cannot call elseIf(): no if block is currently open',
        );
      });
    });

    describe('onError() handler', () => {
      it('should handle try-onError blocks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .try()
          .set('x', 1)
          .onError('errorMessage')
          .displayDialog('Error occurred')
          .end()
          .build();

        expect(script).toBe(
          'try\n' +
            '  set x to 1\n' +
            'on error errorMessage\n' +
            '  display dialog "Error occurred"\n' +
            'end try',
        );
      });

      it('should handle onError without variable', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.try().set('x', 1).onError().displayDialog('Error').end().build();

        expect(script).toBe('try\n  set x to 1\non error\n  display dialog "Error"\nend try');
      });

      it('should throw when calling onError() without a try block', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.onError()).toThrow(
          'Cannot call onError(): no try block is currently open',
        );
      });
    });

    describe('Loop control methods', () => {
      it('should add exitRepeat statement', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.repeat(5).if('x = 3').thenBlock().exitRepeat().end().end().build();

        expect(script).toBe(
          'repeat 5 times\n' +
            '  if x = 3 then\n' +
            '    exit repeat\n' +
            '  end if\n' +
            'end repeat',
        );
      });

      it('should add continueRepeat statement', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .repeat(5)
          .if('x = 3')
          .thenBlock()
          .continueRepeat()
          .end()
          .end()
          .build();

        expect(script).toBe(
          'repeat 5 times\n' +
            '  if x = 3 then\n' +
            '    continue repeat\n' +
            '  end if\n' +
            'end repeat',
        );
      });

      it('should throw when calling exitRepeat() without a repeat block', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.exitRepeat()).toThrow(
          'Cannot call exitRepeat(): no repeat block is currently open',
        );
      });

      it('should throw when calling continueRepeat() without a repeat block', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.continueRepeat()).toThrow(
          'Cannot call continueRepeat(): no repeat block is currently open',
        );
      });
    });

    describe('tellProcess() method', () => {
      it('should create a tell process block', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tellProcess('Finder').raw('set visible to false').end().build();

        expect(script).toBe(
          'tell application "System Events" to tell process "Finder"\n' +
            '  set visible to false\n' +
            'end tell',
        );
      });

      it('should escape quotes in process names', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tellProcess('App "Test"').end().build();

        expect(script).toBe(
          'tell application "System Events" to tell process "App \\"Test\\""\nend tell',
        );
      });
    });

    describe('Logging and comments', () => {
      it('should add log statements', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.log('Debug message').build();

        expect(script).toBe('log "Debug message"');
      });

      it('should escape quotes in log messages', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.log('Message with "quotes"').build();

        expect(script).toBe('log "Message with \\"quotes\\""');
      });

      it('should add comments', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.comment('This is a comment').set('x', 1).build();

        expect(script).toBe('-- This is a comment\nset x to 1');
      });
    });

    describe('Enhanced string escaping', () => {
      it('should escape newlines', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('text', 'Line 1\nLine 2').build();

        expect(script).toBe('set text to "Line 1\\nLine 2"');
      });

      it('should escape tabs', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('text', 'Col1\tCol2').build();

        expect(script).toBe('set text to "Col1\\tCol2"');
      });

      it('should escape carriage returns', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('text', 'Line 1\rLine 2').build();

        expect(script).toBe('set text to "Line 1\\rLine 2"');
      });

      it('should escape all special characters together', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('text', 'Test "quoted"\nNew line\tTab').build();

        expect(script).toBe('set text to "Test \\"quoted\\"\\nNew line\\tTab"');
      });
    });

    describe('List operations', () => {
      it('should add setEnd for appending to lists', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.setEnd('myList', 'newItem').build();

        expect(script).toBe('set end of myList to "newItem"');
      });

      it('should add setProperty', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.setProperty('myObject', 'name', 'Test').build();

        expect(script).toBe('set name of myObject to "Test"');
      });

      it('should create whose clause', () => {
        const builder = new AppleScriptBuilder();
        const filtered = builder.whose('every chat', 'unread count > 0');

        expect(filtered).toBe('every chat whose unread count > 0');
      });

      it('should add getEvery method', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.getEvery('chat').build();

        expect(script).toBe('get every chat');
      });

      it('should add getEvery with location', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.getEvery('message', 'first chat').build();

        expect(script).toBe('get every message of first chat');
      });

      it('should add getEveryWhere method', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.getEveryWhere('chat', 'unread count > 0').build();

        expect(script).toBe('get every chat where unread count > 0');
      });

      it('should add getEveryWhere with location', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .getEveryWhere('message', 'direction = incoming', 'first chat')
          .build();

        expect(script).toBe('get every message of first chat where direction = incoming');
      });

      it('should set a variable to count of items', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.setCountOf('totalChats', 'every chat').build();

        expect(script).toBe('set totalChats to count of (every chat)');
      });

      it('should set a variable to count of filtered items', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setCountOf('iMessageChats', 'every chat whose service type = iMessage')
          .build();

        expect(script).toBe(
          'set iMessageChats to count of (every chat whose service type = iMessage)',
        );
      });

      it('should work in a tell block', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .tell('Messages')
          .setCountOf('unreadCount', 'every chat whose unread count > 0')
          .end()
          .build();

        expect(script).toBe(
          'tell application "Messages"\n' +
            '  set unreadCount to count of (every chat whose unread count > 0)\n' +
            'end tell',
        );
      });
    });

    describe('Expression and variable operations', () => {
      it('should set variable to raw expression with setExpression', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.setExpression('chatId', 'id of aChat').build();

        expect(script).toBe('set chatId to id of aChat');
      });

      it('should increment variable', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('counter', 0).increment('counter').build();

        expect(script).toBe('set counter to 0\nset counter to counter + 1');
      });

      it('should increment variable by custom amount', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.increment('counter', 5).build();

        expect(script).toBe('set counter to counter + 5');
      });

      it('should decrement variable', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('counter', 10).decrement('counter').build();

        expect(script).toBe('set counter to 10\nset counter to counter - 1');
      });

      it('should decrement variable by custom amount', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.decrement('counter', 3).build();

        expect(script).toBe('set counter to counter - 3');
      });

      it('should append to string variable', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('report', '""').appendTo('report', '"Hello"').build();

        expect(script).toBe('set report to "\\"\\""\nset report to report & "Hello"');
      });

      it('should append to string variable with ExprBuilder', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('report', '""')
          .appendTo('report', (e) => e.property('item', 'name'))
          .build();

        expect(script).toBe('set report to "\\"\\""\nset report to report & name of item');
      });

      it('should append with prependLinefeed option', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('report', '"Start"')
          .appendTo('report', '"Line 2"', { prependLinefeed: true })
          .build();

        expect(script).toBe(
          'set report to "\\"Start\\""\nset report to report & linefeed & "Line 2"',
        );
      });

      it('should append with appendLinefeed option', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('report', '""')
          .appendTo('report', '"Line 1"', { appendLinefeed: true })
          .build();

        expect(script).toBe('set report to "\\"\\""\nset report to report & "Line 1" & linefeed');
      });

      it('should append with both prependLinefeed and appendLinefeed options', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('report', '"Start"')
          .appendTo('report', '"Middle"', { prependLinefeed: true, appendLinefeed: true })
          .build();

        expect(script).toBe(
          'set report to "\\"Start\\""\nset report to report & linefeed & "Middle" & linefeed',
        );
      });

      it('should append with options and ExprBuilder', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('report', '""')
          .appendTo('report', (e) => e.property('row', 'value'), { appendLinefeed: true })
          .build();

        expect(script).toBe(
          'set report to "\\"\\""\nset report to report & value of row & linefeed',
        );
      });

      it('should return raw expression with returnRaw', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.returnRaw('myVariable').build();

        expect(script).toBe('return myVariable');
      });

      it('should return complex expression', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.returnRaw('count of every chat').build();

        expect(script).toBe('return count of every chat');
      });

      it('should append raw variable to list with setEndRaw', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.setEndRaw('myList', 'newItem').build();

        expect(script).toBe('set end of myList to newItem');
      });

      it('should work in loop context', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('result', [])
          .repeatWith('item', 'sourceList')
          .setExpression('processed', 'transform(item)')
          .setEndRaw('result', 'processed')
          .end()
          .returnRaw('result')
          .build();

        expect(script).toBe(
          'set result to {}\n' +
            'repeat with item in sourceList\n' +
            '  set processed to transform(item)\n' +
            '  set end of result to processed\n' +
            'end repeat\n' +
            'return result',
        );
      });
    });

    describe('Record creation from variables', () => {
      it('should create record from variable names', () => {
        const builder = new AppleScriptBuilder();
        const record = builder.makeRecordFrom({
          chatId: 'chatId',
          chatName: 'chatName',
        });

        expect(record).toBe('{chatId:chatId, chatName:chatName}');
      });

      it('should use makeRecordFrom in setExpression', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setExpression(
            'chatInfo',
            builder.makeRecordFrom({
              id: 'chatId',
              name: 'chatName',
              count: 'messageCount',
            }),
          )
          .build();

        expect(script).toBe('set chatInfo to {id:chatId, name:chatName, count:messageCount}');
      });

      it('should accept Record directly in setExpression', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setExpression('chatInfo', {
            id: 'chatId',
            name: 'chatName',
            count: 'messageCount',
          })
          .build();

        expect(script).toBe('set chatInfo to {id:chatId, name:chatName, count:messageCount}');
      });

      it('should accept Record directly in setEndRaw', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .setEndRaw('results', {
            itemId: 'id',
            itemValue: 'value',
          })
          .build();

        expect(script).toBe(
          'set results to {}\nset end of results to {itemId:id, itemValue:value}',
        );
      });

      it('should simplify record creation in loops', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('accountInfo', [])
          .repeatWith('acc', 'every account')
          .setExpression('accName', 'name of acc')
          .setExpression('accId', 'id of acc')
          .setEndRaw('accountInfo', {
            accountName: 'accName',
            accountId: 'accId',
          })
          .end()
          .build();

        expect(script).toBe(
          'set accountInfo to {}\n' +
            'repeat with acc in every account\n' +
            '  set accName to name of acc\n' +
            '  set accId to id of acc\n' +
            '  set end of accountInfo to {accountName:accName, accountId:accId}\n' +
            'end repeat',
        );
      });

      it('should support setEndRecord with source object (shorthand)', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('accountInfo', [])
          .repeatWith('acc', 'every account')
          .setEndRecord('accountInfo', 'acc', {
            accountName: 'name',
            accountId: 'id',
          })
          .end()
          .build();

        expect(script).toBe(
          'set accountInfo to {}\n' +
            'repeat with acc in every account\n' +
            '  set end of accountInfo to {accountName:name of acc, accountId:id of acc}\n' +
            'end repeat',
        );
      });

      it('should support setEndRecord with full expressions', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('notesList', [])
          .repeatWith('aNote', 'every note')
          .setEndRecord('notesList', {
            noteName: 'name of aNote',
            noteId: 'id of aNote',
            noteCount: 'count of attachments in aNote',
          })
          .end()
          .build();

        expect(script).toBe(
          'set notesList to {}\n' +
            'repeat with aNote in every note\n' +
            '  set end of notesList to {noteName:name of aNote, noteId:id of aNote, noteCount:count of attachments in aNote}\n' +
            'end repeat',
        );
      });

      it('should throw error when using source form without propertyMap', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.setEndRecord('list', 'source')).toThrow(
          'propertyMap is required when sourceOrExpressions is a source object name',
        );
      });

      it('should handle complex property expressions with source object', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .setEndRecord('results', 'item', {
            fullName: 'name',
            itemType: 'class',
            hasChildren: 'exists children',
          })
          .build();

        expect(script).toBe(
          'set results to {}\n' +
            'set end of results to {fullName:name of item, itemType:class of item, hasChildren:exists children of item}',
        );
      });

      it('should work in complex workflow', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .repeatWith('item', 'dataList')
          .setExpression('id', 'id of item')
          .setExpression('value', 'value of item')
          .setExpression(
            'record',
            builder.makeRecordFrom({
              itemId: 'id',
              itemValue: 'value',
            }),
          )
          .setEndRaw('results', 'record')
          .end()
          .returnRaw('results')
          .build();

        expect(script).toBe(
          'set results to {}\n' +
            'repeat with item in dataList\n' +
            '  set id to id of item\n' +
            '  set value to value of item\n' +
            '  set record to {itemId:id, itemValue:value}\n' +
            '  set end of results to record\n' +
            'end repeat\n' +
            'return results',
        );
      });
    });

    describe('keystrokes() shorthand', () => {
      it('should generate multiple keystroke calls for each character', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('123').build();

        expect(script).toBe('keystroke "1"\ndelay 0.1\nkeystroke "2"\ndelay 0.1\nkeystroke "3"');
      });

      it('should use custom delay between keystrokes', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('abc', 0.2).build();

        expect(script).toBe('keystroke "a"\ndelay 0.2\nkeystroke "b"\ndelay 0.2\nkeystroke "c"');
      });

      it('should not add delay after the last keystroke', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('xy', 0.15).build();

        expect(script).toBe('keystroke "x"\ndelay 0.15\nkeystroke "y"');
      });

      it('should handle single character without delay', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('a').build();

        expect(script).toBe('keystroke "a"');
      });

      it('should work inside tell blocks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tellProcess('Calculator').keystrokes('25').end().build();

        expect(script).toBe(
          'tell application "System Events" to tell process "Calculator"\n' +
            '  keystroke "2"\n' +
            '  delay 0.1\n' +
            '  keystroke "5"\n' +
            'end tell',
        );
      });

      it('should handle special characters', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('+-*/').build();

        expect(script).toBe(
          'keystroke "+"\ndelay 0.1\nkeystroke "-"\ndelay 0.1\nkeystroke "*"\ndelay 0.1\nkeystroke "/"',
        );
      });

      it('should properly escape quotes in keystrokes', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.keystrokes('a"b').build();

        expect(script).toBe('keystroke "a"\ndelay 0.1\nkeystroke "\\""\ndelay 0.1\nkeystroke "b"');
      });
    });

    describe('Convenience helpers', () => {
      describe('tellApp() helper', () => {
        it('should create tell application block with automatic closing', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Calculator', (app) => {
              app.activate();
            })
            .build();

          expect(script).toBe('tell application "Calculator"\n  activate\nend tell');
        });

        it('should handle multiple commands in callback', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Finder', (app) => {
              app.activate();
              app.closeWindow();
              app.delay(0.5);
            })
            .build();

          expect(script).toBe(
            'tell application "Finder"\n' +
              '  activate\n' +
              '  close front window\n' +
              '  delay 0.5\n' +
              'end tell',
          );
        });

        it('should work with nested blocks inside callback', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Finder', (app) => {
              app.if('count of windows > 0').thenBlock();
              app.closeWindow();
              app.endif();
            })
            .build();

          expect(script).toBe(
            'tell application "Finder"\n' +
              '  if count of windows > 0 then\n' +
              '    close front window\n' +
              '  end if\n' +
              'end tell',
          );
        });

        it('should allow chaining after tellApp', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Calculator', (app) => {
              app.activate();
            })
            .delay(1)
            .tellApp('Finder', (app) => {
              app.activate();
            })
            .build();

          expect(script).toBe(
            'tell application "Calculator"\n' +
              '  activate\n' +
              'end tell\n' +
              'delay 1\n' +
              'tell application "Finder"\n' +
              '  activate\n' +
              'end tell',
          );
        });

        it('should escape quotes in application names', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('App "Test"', (app) => {
              app.activate();
            })
            .build();

          expect(script).toBe('tell application "App \\"Test\\""\n  activate\nend tell');
        });

        it('should work with empty callback', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Finder', () => {
              // Empty callback
            })
            .build();

          expect(script).toBe('tell application "Finder"\nend tell');
        });

        it('should handle complex nested structure', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Notes', (app) => {
              app.set('notesList', []);
              app.repeatWith('aNote', 'every note');
              app.setEndRecord('notesList', 'aNote', {
                noteName: 'name',
                noteId: 'id',
              });
              app.endrepeat();
              app.returnRaw('notesList');
            })
            .build();

          expect(script).toBe(
            'tell application "Notes"\n' +
              '  set notesList to {}\n' +
              '  repeat with aNote in every note\n' +
              '    set end of notesList to {noteName:name of aNote, noteId:id of aNote}\n' +
              '  end repeat\n' +
              '  return notesList\n' +
              'end tell',
          );
        });

        it('should work with convenience helper methods inside', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Finder', (app) => {
              app.ifThen('count of windows > 5', (then_) => {
                then_.displayDialog('Too many windows!');
              });
            })
            .build();

          expect(script).toBe(
            'tell application "Finder"\n' +
              '  if count of windows > 5 then\n' +
              '    display dialog "Too many windows!"\n' +
              '  end if\n' +
              'end tell',
          );
        });
      });

      describe('buildJsonObject() and returnJsonObject()', () => {
        it('should build JSON expression from variable map', () => {
          const builder = new AppleScriptBuilder();
          const jsonExpr = builder.buildJsonObject({
            name: 'winName',
            position: 'winPosition',
            size: 'winSize',
          });

          expect(jsonExpr).toBe(
            '"{" & "\\"name\\":\\"" & winName & "\\"" & ",\\"position\\":\\"" & winPosition & "\\"" & ",\\"size\\":\\"" & winSize & "\\"" & "}"',
          );
        });

        it('should build JSON with single property', () => {
          const builder = new AppleScriptBuilder();
          const jsonExpr = builder.buildJsonObject({
            id: 'itemId',
          });

          expect(jsonExpr).toBe('"{" & "\\"id\\":\\"" & itemId & "\\"" & "}"');
        });

        it('should handle multiple properties in correct order', () => {
          const builder = new AppleScriptBuilder();
          const jsonExpr = builder.buildJsonObject({
            first: 'var1',
            second: 'var2',
            third: 'var3',
          });

          expect(jsonExpr).toBe(
            '"{" & "\\"first\\":\\"" & var1 & "\\"" & ",\\"second\\":\\"" & var2 & "\\"" & ",\\"third\\":\\"" & var3 & "\\"" & "}"',
          );
        });

        it('should generate returnJsonObject script', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .setExpression('winName', 'name of window 1')
            .setExpression('winPosition', 'position of window 1 as text')
            .returnJsonObject({
              name: 'winName',
              position: 'winPosition',
            })
            .build();

          expect(script).toBe(
            'set winName to name of window 1\n' +
              'set winPosition to position of window 1 as text\n' +
              'return "{" & "\\"name\\":\\"" & winName & "\\"" & ",\\"position\\":\\"" & winPosition & "\\"" & "}"',
          );
        });

        it('should work with tellApp and returnJsonObject', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .tellApp('Calculator', (app) => {
              app.activate();
            })
            .delay(0.5)
            .tellProcess('Calculator')
            .setExpression('winName', 'name of window 1')
            .setExpression('winSize', 'size of window 1 as text')
            .end()
            .tellApp('Calculator', (app) => {
              app.quit();
            })
            .returnJsonObject({
              name: 'winName',
              size: 'winSize',
            })
            .build();

          expect(script).toBe(
            'tell application "Calculator"\n' +
              '  activate\n' +
              'end tell\n' +
              'delay 0.5\n' +
              'tell application "System Events" to tell process "Calculator"\n' +
              '  set winName to name of window 1\n' +
              '  set winSize to size of window 1 as text\n' +
              'end tell\n' +
              'tell application "Calculator"\n' +
              '  quit\n' +
              'end tell\n' +
              'return "{" & "\\"name\\":\\"" & winName & "\\"" & ",\\"size\\":\\"" & winSize & "\\"" & "}"',
          );
        });

        it('should work with setExpression using buildJsonObject', () => {
          const builder = new AppleScriptBuilder();
          const script = builder
            .setExpression('var1', 'value1')
            .setExpression('var2', 'value2')
            .setExpression('jsonString', builder.buildJsonObject({ key1: 'var1', key2: 'var2' }))
            .returnRaw('jsonString')
            .build();

          expect(script).toBe(
            'set var1 to value1\n' +
              'set var2 to value2\n' +
              'set jsonString to "{" & "\\"key1\\":\\"" & var1 & "\\"" & ",\\"key2\\":\\"" & var2 & "\\"" & "}"\n' +
              'return jsonString',
          );
        });
      });
    });

    describe('Handler definitions and calls', () => {
      it('should define handler with on syntax', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.on('sayHello', ['name']).displayDialog('Hello').endon().build();

        expect(script).toBe('on sayHello name\n  display dialog "Hello"\nend sayHello');
      });

      it('should define handler with to syntax', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .to('processFile', ['filePath'])
          .log('Processing file')
          .endto()
          .build();

        expect(script).toBe('to processFile filePath\n  log "Processing file"\nend processFile');
      });

      it('should define handler with labeled parameters using onLabeled', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .onLabeled('displayError', { message: 'theMessage', level: 'theSeverity' })
          .displayDialog('Error!')
          .endon()
          .build();

        expect(script).toBe(
          'on displayError message theMessage, level theSeverity\n  display dialog "Error!"\nend displayError',
        );
      });

      it('should define handler with labeled parameters using toLabeled', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .toLabeled('computeSum', { first: 'a', second: 'b' })
          .returnRaw('a + b')
          .endto()
          .build();

        expect(script).toBe('to computeSum first a, second b\n  return a + b\nend computeSum');
      });

      it('should call handler with callHandler', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.callHandler('processFile', ['"test.txt"', 'true']).build();

        expect(script).toBe('processFile "test.txt", true');
      });

      it('should call handler without parameters', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.callHandler('initialize').build();

        expect(script).toBe('initialize');
      });

      it('should call handler using my keyword', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').my('processFile', ['theFile']).endtell().build();

        expect(script).toBe('tell application "Finder"\n  my processFile theFile\nend tell');
      });

      it('should call handler using ofMe syntax', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').ofMe('getCustomData', ['item']).endtell().build();

        expect(script).toBe('tell application "Finder"\n  getCustomData item of me\nend tell');
      });

      it('should define explicit run handler', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.runHandler(true).displayDialog('Running').endrun().build();

        expect(script).toBe('on run\n  display dialog "Running"\nend run');
      });

      it('should define quit handler', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.quitHandler().log('Quitting').endquit().build();

        expect(script).toBe('on quit\n  log "Quitting"\nend quit');
      });

      it('should define open handler with default parameter', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.openHandler().log('Files dropped').endopen().build();

        expect(script).toBe('on open theDroppedItems\n  log "Files dropped"\nend open');
      });

      it('should define open handler with custom parameter', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.openHandler('theFiles').log('Processing files').endopen().build();

        expect(script).toBe('on open theFiles\n  log "Processing files"\nend open');
      });

      it('should define idle handler', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.idleHandler().log('Idle check').endidle().build();

        expect(script).toBe('on idle\n  log "Idle check"\nend idle');
      });
    });

    describe('Additional control flow', () => {
      it('should create if block with ExprBuilder callback', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .if((e) => e.gt('counter', 10))
          .thenBlock()
          .set('result', 'high')
          .endif()
          .build();

        expect(script).toBe('if counter > 10 then\n  set result to "high"\nend if');
      });

      it('should create repeatWhile loop', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.set('x', 0).repeatWhile('x < 5').increment('x').endrepeat().build();

        expect(script).toBe('set x to 0\nrepeat while x < 5\n  set x to x + 1\nend repeat');
      });

      it('should create repeatUntil loop', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('y', 0)
          .repeatUntil('y >= 10')
          .increment('y')
          .endrepeat()
          .build();

        expect(script).toBe('set y to 0\nrepeat until y >= 10\n  set y to y + 1\nend repeat');
      });

      it('should validate exitRepeatIf without repeat block', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.exitRepeatIf('x > 5')).toThrow(
          'Cannot call exitRepeatIf(): no repeat block is currently open',
        );
      });

      it('should create exitRepeatIf with ExprBuilder', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .repeat(10)
          .exitRepeatIf((e) => e.gt('counter', 5))
          .endrepeat()
          .build();

        expect(script).toBe(
          'repeat 10 times\n  if counter > 5 then\n    exit repeat\n  end if\nend repeat',
        );
      });

      it('should create ignoring block', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .ignoring(['case', 'punctuation'])
          .if('"hello" = "HELLO"')
          .thenBlock()
          .set('match', true)
          .endif()
          .endignoring()
          .build();

        expect(script).toBe(
          'ignoring case, punctuation\n  if "hello" = "HELLO" then\n    set match to true\n  end if\nend ignoring',
        );
      });
    });

    describe('Return statements', () => {
      it('should return boolean value', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.return(true).build();

        expect(script).toBe('return true');
      });

      it('should return null as missing value', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.return(null).build();

        expect(script).toBe('return missing value');
      });

      it('should return array', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.return([1, 2, 3]).build();

        expect(script).toBe('return {1, 2, 3}');
      });
    });

    describe('Window operations', () => {
      it('should close all windows', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').closeAllWindows().endtell().build();

        expect(script).toBe('tell application "Finder"\n  close every window\nend tell');
      });

      it('should minimize window by name', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').minimizeWindow('Downloads').endtell().build();

        expect(script).toBe(
          'tell application "Finder"\n  set miniaturized of window "Downloads" to true\nend tell',
        );
      });

      it('should minimize front window', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').minimizeWindow().endtell().build();

        expect(script).toBe(
          'tell application "Finder"\n  set miniaturized of front window to true\nend tell',
        );
      });

      it('should zoom window by name', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').zoomWindow('Downloads').endtell().build();

        expect(script).toBe(
          'tell application "Finder"\n  set zoomed of window "Downloads" to true\nend tell',
        );
      });

      it('should zoom front window', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tell('Finder').zoomWindow().endtell().build();

        expect(script).toBe(
          'tell application "Finder"\n  set zoomed of front window to true\nend tell',
        );
      });
    });

    describe('UI interaction methods', () => {
      it('should select UI element', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tellProcess('Finder').select('row 1 of table 1').endtell().build();

        expect(script).toBe(
          'tell application "System Events" to tell process "Finder"\n  select row 1 of table 1\nend tell',
        );
      });

      it('should display dialog with givingUpAfter option', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.displayDialog('Auto-close dialog', { givingUpAfter: 5 }).build();

        expect(script).toBe('display dialog "Auto-close dialog" giving up after 5');
      });

      it('should display dialog with all options', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .displayDialog('Choose one', {
            buttons: ['OK', 'Cancel'],
            defaultButton: 'OK',
            withIcon: 'caution',
            givingUpAfter: 10,
          })
          .build();

        expect(script).toBe(
          'display dialog "Choose one" buttons {"OK", "Cancel"} default button "OK" with icon caution giving up after 10',
        );
      });

      it('should display notification with title', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.displayNotification('Task complete', { title: 'Success' }).build();

        expect(script).toBe('display notification "Task complete" with title "Success"');
      });

      it('should display notification with subtitle', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.displayNotification('Message', { subtitle: 'Details' }).build();

        expect(script).toBe('display notification "Message" subtitle "Details"');
      });

      it('should display notification with sound', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.displayNotification('Alert', { sound: 'Basso' }).build();

        expect(script).toBe('display notification "Alert" sound name "Basso"');
      });

      it('should display notification with all options', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .displayNotification('Complete', {
            title: 'Build',
            subtitle: 'Finished successfully',
            sound: 'Glass',
          })
          .build();

        expect(script).toBe(
          'display notification "Complete" with title "Build" subtitle "Finished successfully" sound name "Glass"',
        );
      });

      it('should press key with modifiers using pressKey', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.pressKey('s', ['command', 'shift']).build();

        expect(script).toBe(
          'tell application "System Events" to key code s using {command, shift}',
        );
      });

      it('should press key code with modifiers using pressKeyCode', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.pressKeyCode(53, ['command']).build();

        expect(script).toBe('tell application "System Events" to key code 53 using {command}');
      });

      it('should type text using typeText', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.typeText('Hello World').build();

        expect(script).toBe('tell application "System Events" to keystroke "Hello World"');
      });

      it('should click button using clickButton', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.clickButton('OK').build();

        expect(script).toBe('tell application "System Events" to click button "OK"');
      });

      it('should click menu item using clickMenuItem', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.clickMenuItem('File', 'Save').build();

        expect(script).toBe(
          'tell application "System Events" to click menu item "Save" of menu "File" of menu bar 1',
        );
      });
    });

    describe('Error handling methods', () => {
      it('should throw error with message only', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.error('Something went wrong').build();

        expect(script).toBe('error "Something went wrong"');
      });

      it('should throw error with message and number', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.error('File not found', -43).build();

        expect(script).toBe('error "File not found" number -43');
      });
    });

    describe('tellTarget method', () => {
      it('should create tell block for UI element', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.tellTarget('window 1').set('x', 100).endtell().build();

        expect(script).toBe('tell window 1\n  set x to 100\nend tell');
      });

      it('should work with nested targets', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .tellTarget('tab group 1 of window 1')
          .tellTarget('scroll area 1')
          .set('visible', true)
          .endtell()
          .endtell()
          .build();

        expect(script).toBe(
          'tell tab group 1 of window 1\n  tell scroll area 1\n    set visible to true\n  end tell\nend tell',
        );
      });
    });

    describe('setExpressions bulk assignment', () => {
      it('should set multiple expressions at once', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setExpressions({
            name: 'name of item',
            count: 'count of items',
            status: '"active"',
          })
          .build();

        expect(script).toBe(
          'set name to name of item\nset count to count of items\nset status to "active"',
        );
      });

      it('should work with ExprBuilder callbacks', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setExpressions({
            total: (e) => e.count('items'),
            hasItems: (e) => e.gt(e.count('items'), 0),
          })
          .build();

        expect(script).toBe('set total to count of items\nset hasItems to count of items > 0');
      });
    });

    describe('loadFromScript method', () => {
      it('should load script with using block', () => {
        const builder = new AppleScriptBuilder();
        const existingScript = 'using terms from application "Finder"\n  activate\nend using';
        const script = builder.loadFromScript(existingScript).build();

        expect(script).toBe(existingScript);
      });

      it('should load script with with block', () => {
        const builder = new AppleScriptBuilder();
        const existingScript = 'with timeout of 60\n  delay 10\nend with';
        const script = builder.loadFromScript(existingScript).build();

        expect(script).toBe(existingScript);
      });

      it('should maintain block stack for loaded script', () => {
        const builder = new AppleScriptBuilder();
        const existingScript = 'tell application "Finder"\n  activate';
        builder.loadFromScript(existingScript);
        const script = builder.endtell().build();

        expect(script).toBe('tell application "Finder"\n  activate\nend tell');
      });

      it('should handle complex nested loaded script', () => {
        const builder = new AppleScriptBuilder();
        const existingScript =
          'tell application "Finder"\n  if true then\n    repeat 5 times\n      activate\n    end repeat\n  end if\nend tell';
        const script = builder.loadFromScript(existingScript).build();

        expect(script).toBe(existingScript);
      });
    });

    describe('Conditional assignment helpers', () => {
      it('should use setTernary for simple conditional assignment', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setTernary('status', (e) => e.gt('count', 0), '"active"', '"empty"')
          .build();

        expect(script).toBe(
          'if count > 0 then\n  set status to "active"\nelse\n  set status to "empty"\nend if',
        );
      });

      it('should use setEndTernary for conditional list append', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .setEndTernary('results', (e) => e.gt('size', 1000), '"large"', '"small"')
          .build();

        expect(script).toBe(
          'set results to {}\nif size > 1000 then\n  set end of results to "large"\nelse\n  set end of results to "small"\nend if',
        );
      });

      it('should use setFirstOf for first-or-default pattern', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setFirstOf('email', (e) => e.property('person', 'emails'), '""')
          .build();

        expect(script).toBe(
          'if count of emails of person > 0 then\n  set email to value of item 1 of emails of person\nelse\n  set email to ""\nend if',
        );
      });

      it('should use setEndFirstOf for first-or-default in list building', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('emailList', [])
          .setEndFirstOf('emailList', 'emails of person', 'missing value')
          .build();

        expect(script).toBe(
          'set emailList to {}\nif count of emails of person > 0 then\n  set end of emailList to value of item 1 of emails of person\nelse\n  set end of emailList to missing value\nend if',
        );
      });

      it('should use setIfExists with type conversion', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .setIfExists('birthday', 'birth date of person', 'missing value', 'string')
          .build();

        expect(script).toBe(
          'if exists birth date of person then\n  set birthday to birth date of person as string\nelse\n  set birthday to missing value\nend if',
        );
      });

      it('should use setEndIfExists for conditional list append with existence check', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('dates', [])
          .setEndIfExists('dates', 'birth date of person', '""', 'string')
          .build();

        expect(script).toBe(
          'set dates to {}\nif exists birth date of person then\n  set end of dates to birth date of person as string\nelse\n  set end of dates to ""\nend if',
        );
      });
    });

    describe('pickEndRecord shorthand', () => {
      it('should detect simple properties and append "of source"', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .pickEndRecord('results', 'item', {
            itemName: 'name',
            itemId: 'id',
          })
          .build();

        expect(script).toBe(
          'set results to {}\nset end of results to {itemName:name of item, itemId:id of item}',
        );
      });

      it('should detect full expressions and use as-is', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .pickEndRecord('results', 'note', {
            noteName: 'name',
            noteDate: 'creation date as string',
          })
          .build();

        expect(script).toBe(
          'set results to {}\nset end of results to {noteName:name of note, noteDate:creation date as string}',
        );
      });

      it('should handle temp variables from PropertyExtractor', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('__temp_email', '"test@example.com"')
          .set('results', [])
          .pickEndRecord('results', 'person', {
            email: '__temp_email',
            name: 'name',
          })
          .build();

        expect(script).toBe(
          'set __temp_email to "\\"test@example.com\\""\nset results to {}\nset end of results to {email:__temp_email, name:name of person}',
        );
      });
    });

    describe('Advanced loop helpers', () => {
      it('should use forEach with callback', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('results', [])
          .forEach('item', 'every file', (loop) => {
            loop.setEndRaw('results', 'name of item');
          })
          .build();

        expect(script).toBe(
          'set results to {}\nrepeat with item in every file\n  set end of results to name of item\nend repeat',
        );
      });

      it('should use forEachWhile with condition', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('counter', 0)
          .forEachWhile(
            'item',
            'items',
            (e) => e.lt('counter', 10),
            (loop) => {
              loop.increment('counter');
            },
          )
          .build();

        expect(script).toBe(
          'set counter to 0\nrepeat with item in items\n  if not counter < 10 then\n    exit repeat\n  end if\n  set counter to counter + 1\nend repeat',
        );
      });

      it('should use forEachUntil with condition', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('counter', 0)
          .forEachUntil(
            'item',
            'items',
            (e) => e.gte('counter', 5),
            (loop) => {
              loop.increment('counter');
            },
          )
          .build();

        expect(script).toBe(
          'set counter to 0\nrepeat with item in items\n  if counter >= 5 then\n    exit repeat\n  end if\n  set counter to counter + 1\nend repeat',
        );
      });

      it('should use repeatTimes with callback', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .repeatTimes(3, (loop) => {
            loop.log('Iteration');
          })
          .build();

        expect(script).toBe('repeat 3 times\n  log "Iteration"\nend repeat');
      });

      it('should use repeatWhileBlock with callback', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('x', 0)
          .repeatWhileBlock('x < 5', (loop) => {
            loop.increment('x');
          })
          .build();

        expect(script).toBe('set x to 0\nrepeat while x < 5\n  set x to x + 1\nend repeat');
      });

      it('should use repeatUntilBlock with callback', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .set('y', 0)
          .repeatUntilBlock('y >= 10', (loop) => {
            loop.increment('y');
          })
          .build();

        expect(script).toBe('set y to 0\nrepeat until y >= 10\n  set y to y + 1\nend repeat');
      });
    });

    describe('repeatWithRange shorthand', () => {
      it('should create numeric range loop with numbers', () => {
        const builder = new AppleScriptBuilder();
        const script = builder.repeatWithRange('i', 1, 10).log('Iteration').endrepeat().build();

        expect(script).toBe('repeat with i from 1 to 10\n  log "Iteration"\nend repeat');
      });

      it('should create numeric range loop with expressions', () => {
        const builder = new AppleScriptBuilder();
        const script = builder
          .repeatWithRange('j', 'startIndex', 'endIndex')
          .increment('counter')
          .endrepeat()
          .build();

        expect(script).toBe(
          'repeat with j from startIndex to endIndex\n  set counter to counter + 1\nend repeat',
        );
      });

      it('should throw when missing parameters in repeatWithRange', () => {
        const builder = new AppleScriptBuilder();
        expect(() => builder.repeatWithRange('', 1, 10)).toThrow(
          'Variable, start, and end must be provided for repeatWithRange',
        );
      });
    });

    describe('Explicit block ending methods', () => {
      it('should validate endif block type', () => {
        const builder = new AppleScriptBuilder();
        builder.repeat(5);
        expect(() => builder.endif()).toThrow('Cannot end if block: currently inside repeat block');
      });

      it('should validate endrepeat block type', () => {
        const builder = new AppleScriptBuilder();
        builder.if('true').thenBlock();
        expect(() => builder.endrepeat()).toThrow(
          'Cannot end repeat block: currently inside if block',
        );
      });

      it('should validate endtry block type', () => {
        const builder = new AppleScriptBuilder();
        builder.tell('Finder');
        expect(() => builder.endtry()).toThrow('Cannot end try block: currently inside tell block');
      });

      it('should validate endtell block type', () => {
        const builder = new AppleScriptBuilder();
        builder.if('x > 5').thenBlock();
        expect(() => builder.endtell()).toThrow('Cannot end tell block: currently inside if block');
      });

      it('should validate endon block type', () => {
        const builder = new AppleScriptBuilder();
        builder.repeat(3);
        expect(() => builder.endon()).toThrow('Cannot end on block: currently inside repeat block');
      });

      it('should validate endconsidering block type', () => {
        const builder = new AppleScriptBuilder();
        builder.try();
        expect(() => builder.endconsidering()).toThrow(
          'Cannot end considering block: currently inside try block',
        );
      });

      it('should validate endignoring block type', () => {
        const builder = new AppleScriptBuilder();
        builder.tell('Finder');
        expect(() => builder.endignoring()).toThrow(
          'Cannot end ignoring block: currently inside tell block',
        );
      });

      it('should validate endusing block type', () => {
        const builder = new AppleScriptBuilder();
        builder.considering(['case']);
        expect(() => builder.endusing()).toThrow(
          'Cannot end using block: currently inside considering block',
        );
      });

      it('should validate endwith block type', () => {
        const builder = new AppleScriptBuilder();
        builder.repeat(5);
        expect(() => builder.endwith()).toThrow(
          'Cannot end with block: currently inside repeat block',
        );
      });
    });

    describe('mapToJson with PropertyExtractor error handling', () => {
      it('should throw error when PropertyExtractor missing property field', () => {
        const builder = new AppleScriptBuilder();
        expect(() =>
          builder
            .tell('Contacts')
            .mapToJson(
              'person',
              'every person',
              {
                name: 'name',
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore Testing invalid PropertyExtractor
                email: { firstOf: true }, // Missing property field
              },
              { limit: 10 },
            )
            .endtell()
            .build(),
        ).toThrow('PropertyExtractor for "email" must have a "property" field');
      });
    });
  });
});
