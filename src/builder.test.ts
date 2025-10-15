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
      const script = builder.if('true').then().set('x', 1).end().build();

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
        .then()
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
      const script = builder.tell('Finder').if('true').then().end().end().build();

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
          .then()
          .set('result', 'one')
          .elseIf('x = 2')
          .then()
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
        const script = builder.repeat(5).if('x = 3').then().exitRepeat().end().end().build();

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
        const script = builder.repeat(5).if('x = 3').then().continueRepeat().end().end().build();

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
              app.if('count of windows > 0').then();
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
    });
  });
});
