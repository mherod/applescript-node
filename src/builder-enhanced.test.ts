import { describe, expect, it } from 'vitest';
import { AppleScriptBuilder } from './builder.js';
import { ExprBuilder, expr } from './expressions.js';

describe('Builder - Explicit Paired Endings', () => {
  it('should end if blocks with endif()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder.if('x > 5').raw('log "greater"').endif().build();

    expect(script).toContain('if x > 5');
    expect(script).toContain('end if');
  });

  it('should end repeat blocks with endrepeat()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder.repeat(5).raw('log "loop"').endrepeat().build();

    expect(script).toContain('repeat 5 times');
    expect(script).toContain('end repeat');
  });

  it('should end try blocks with endtry()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder.try().raw('activate').onError().raw('log "error"').endtry().build();

    expect(script).toContain('try');
    expect(script).toContain('end try');
  });

  it('should end tell blocks with endtell()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder.tell('Finder').raw('activate').endtell().build();

    expect(script).toContain('tell application "Finder"');
    expect(script).toContain('end tell');
  });

  it('should throw error when ending wrong block type', () => {
    const builder = new AppleScriptBuilder();
    expect(() => {
      builder.if('x > 5').endrepeat();
    }).toThrow('Cannot end repeat block: currently inside if block');
  });

  it('should throw error when ending with no open blocks', () => {
    const builder = new AppleScriptBuilder();
    expect(() => {
      builder.endif();
    }).toThrow('Cannot end if block: no blocks are currently open');
  });
});

describe('Builder - Convenience Helpers', () => {
  it('should use ifThen to simplify if-then pattern', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThen('x > 5', (b) => {
        b.raw('log "greater"');
      })
      .build();

    expect(script).toContain('if x > 5');
    expect(script).toContain('then');
    expect(script).toContain('end if');
    // Verify no orphaned end statement
    expect(script.split('end if').length).toBe(2);
  });

  it('should use ifThenElse to simplify if-then-else pattern', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThenElse(
        'x > 5',
        (b) => {
          b.raw('log "greater"');
        },
        (b) => {
          b.raw('log "not greater"');
        },
      )
      .build();

    expect(script).toContain('if x > 5');
    expect(script).toContain('then');
    expect(script).toContain('else');
    expect(script).toContain('end if');
    expect(script.split('end if').length).toBe(2);
  });

  it('should use tryCatch to simplify try-catch pattern', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tryCatch(
        (b) => {
          b.raw('activate');
        },
        (b) => {
          b.raw('log "error"');
        },
      )
      .build();

    expect(script).toContain('try');
    expect(script).toContain('on error');
    expect(script).toContain('end try');
    expect(script.split('end try').length).toBe(2);
  });

  it('should use tryCatchError to capture error variable', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tryCatchError(
        (b) => {
          b.raw('activate');
        },
        'errorMsg',
        (b) => {
          b.raw('log errorMsg');
        },
      )
      .build();

    expect(script).toContain('try');
    expect(script).toContain('on error errorMsg');
    expect(script).toContain('end try');
  });

  it('should support nested convenience helpers', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Finder')
      .ifThenElse(
        'count of windows > 0',
        (b) => {
          b.raw('activate front window');
        },
        (b) => {
          b.raw('activate');
        },
      )
      .endtell()
      .build();

    // Verify structure
    expect(script).toContain('tell application "Finder"');
    expect(script).toContain('if count of windows > 0');
    expect(script).toContain('end if');
    expect(script).toContain('end tell');
  });
});

describe('ExprBuilder - Comparison Operators', () => {
  it('should build greater than expression', () => {
    const e = new ExprBuilder();
    expect(e.gt('x', 5)).toBe('x > 5');
    expect(e.gt('name', 'John')).toBe('name > "John"');
  });

  it('should build less than expression', () => {
    const e = new ExprBuilder();
    expect(e.lt('x', 5)).toBe('x < 5');
  });

  it('should build gte and lte expressions', () => {
    const e = new ExprBuilder();
    expect(e.gte('x', 5)).toBe('x >= 5');
    expect(e.lte('x', 5)).toBe('x <= 5');
  });

  it('should build equality expression', () => {
    const e = new ExprBuilder();
    expect(e.eq('status', 'done')).toBe('status = "done"');
    expect(e.eq('count', 0)).toBe('count = 0');
    expect(e.eq('enabled', true)).toBe('enabled = true');
  });

  it('should build inequality expression', () => {
    const e = new ExprBuilder();
    expect(e.ne('status', 'pending')).toBe('status is not equal to "pending"');
  });
});

describe('ExprBuilder - Logical Operators', () => {
  it('should combine conditions with and', () => {
    const e = new ExprBuilder();
    expect(e.and('x > 5', 'y < 10')).toBe('x > 5 and y < 10');
    expect(e.and('a = 1', 'b = 2', 'c = 3')).toBe('a = 1 and b = 2 and c = 3');
  });

  it('should combine conditions with or', () => {
    const e = new ExprBuilder();
    expect(e.or('x > 5', 'y < 10')).toBe('x > 5 or y < 10');
  });

  it('should negate conditions with not', () => {
    const e = new ExprBuilder();
    expect(e.not('exists window')).toBe('not exists window');
  });
});

describe('ExprBuilder - String Operations', () => {
  it('should get length of string', () => {
    const e = new ExprBuilder();
    expect(e.length('name')).toBe('length of name');
  });

  it('should check string contains', () => {
    const e = new ExprBuilder();
    expect(e.contains('name', '"John"')).toBe('name contains "John"');
  });

  it('should check string starts with', () => {
    const e = new ExprBuilder();
    expect(e.startsWith('name', '"J"')).toBe('name begins with "J"');
  });

  it('should check string ends with', () => {
    const e = new ExprBuilder();
    expect(e.endsWith('name', '"n"')).toBe('name ends with "n"');
  });
});

describe('ExprBuilder - Property and Count Operations', () => {
  it('should get property of object', () => {
    const e = new ExprBuilder();
    expect(e.property('note', 'name')).toBe('name of note');
    expect(e.property('window', 'bounds')).toBe('bounds of window');
  });

  it('should count items', () => {
    const e = new ExprBuilder();
    expect(e.count('notes')).toBe('count of notes');
  });

  it('should check existence', () => {
    const e = new ExprBuilder();
    expect(e.exists('window "Settings"')).toBe('exists window "Settings"');
  });

  it('should check type', () => {
    const e = new ExprBuilder();
    expect(e.typeEquals('value', 'text')).toBe('the type of value is text');
  });
});

describe('ExprBuilder - Complex Expressions', () => {
  it('should compose complex conditions', () => {
    const e = new ExprBuilder();
    const condition = e.and(e.gt(e.length('name'), 5), e.eq('status', 'active'));
    expect(condition).toBe('length of name > 5 and status = "active"');
  });

  it('should use parentheses for grouping', () => {
    const e = new ExprBuilder();
    const condition = e.or(e.paren(e.and('x > 5', 'y < 10')), e.eq('reset', true));
    expect(condition).toBe('(x > 5 and y < 10) or reset = true');
  });

  it('should compare two expressions', () => {
    const e = new ExprBuilder();
    expect(e.compare('length of name1', '>', 'length of name2')).toBe(
      'length of name1 > length of name2',
    );
  });
});

describe('ExprBuilder - Collection and Accessor Methods', () => {
  it('should create "every" collection accessor', () => {
    const e = new ExprBuilder();
    expect(e.every('participant', 'aChat')).toBe('every participant of aChat');
    expect(e.every('note', 'folder "Notes"')).toBe('every note of folder "Notes"');
  });

  it('should create nested property chains', () => {
    const e = new ExprBuilder();
    expect(e.nestedProperty('aChat', 'account', 'id')).toBe('id of account of aChat');
    expect(e.nestedProperty('note', 'folder', 'account', 'name')).toBe(
      'name of account of folder of note',
    );
    expect(e.nestedProperty('p', 'handle')).toBe('handle of p');
  });

  it('should handle type casting with asType', () => {
    const e = new ExprBuilder();
    expect(e.asType('creation date of aNote', 'string')).toBe('creation date of aNote as string');
    expect(e.asType(e.property('aNote', 'id'), 'text')).toBe('id of aNote as text');
    expect(e.asType('count of notes', 'integer')).toBe('count of notes as integer');
  });

  it('should create text range accessors', () => {
    const e = new ExprBuilder();
    expect(e.text(1, 100, 'notePlaintext')).toBe('text 1 thru 100 of notePlaintext');
    expect(e.text(5, 10, 'myString')).toBe('text 5 thru 10 of myString');
  });

  it('should create character accessors', () => {
    const e = new ExprBuilder();
    expect(e.character(1, 'myString')).toBe('character 1 of myString');
    expect(e.character(5, 'name')).toBe('character 5 of name');
  });

  it('should create item accessors', () => {
    const e = new ExprBuilder();
    expect(e.item(1, 'myList')).toBe('item 1 of myList');
    expect(e.item('i', 'notes')).toBe('item i of notes');
  });

  it('should create items range accessors', () => {
    const e = new ExprBuilder();
    expect(e.items(1, 5, 'myList')).toBe('items 1 thru 5 of myList');
    expect(e.items(10, 20, 'collection')).toBe('items 10 thru 20 of collection');
  });

  it('should create first and last accessors', () => {
    const e = new ExprBuilder();
    expect(e.first('note', 'notes')).toBe('first note of notes');
    expect(e.last('item', 'list')).toBe('last item of list');
  });

  it('should create some expressions with conditions', () => {
    const e = new ExprBuilder();
    expect(e.some('note', 'notes', 'name contains "test"')).toBe(
      'some note of notes where name contains "test"',
    );
  });

  it('should create filter expressions', () => {
    const e = new ExprBuilder();
    expect(e.filter('note', 'notes', 'shared = true')).toBe(
      'every note of notes where shared = true',
    );
  });

  it('should concatenate expressions', () => {
    const e = new ExprBuilder();
    expect(e.concat('text 1 thru 50 of body', '"..."')).toBe('text 1 thru 50 of body & "..."');
    expect(e.concat('firstName', '" "', 'lastName')).toBe('firstName & " " & lastName');
  });

  it('should compose complex real-world expressions', () => {
    const e = new ExprBuilder();

    // every participant of aChat
    expect(e.every('participant', 'aChat')).toBe('every participant of aChat');

    // id of account of aChat
    expect(e.nestedProperty('aChat', 'account', 'id')).toBe('id of account of aChat');

    // creation date of aNote as string
    const creationDate = e.asType(e.property('aNote', 'creation date'), 'string');
    expect(creationDate).toBe('creation date of aNote as string');

    // text 1 thru 100 of notePlaintext & "..."
    const preview = e.concat(e.text(1, 100, 'notePlaintext'), '"..."');
    expect(preview).toBe('text 1 thru 100 of notePlaintext & "..."');
  });

  it('should combine new methods with existing conditions', () => {
    const e = new ExprBuilder();

    // if length of (text 1 thru 100 of body) > 50
    const condition = e.gt(e.length(e.text(1, 100, 'body')), 50);
    expect(condition).toBe('length of text 1 thru 100 of body > 50');

    // count of (every note of folder) > 10
    const countCondition = e.gt(e.count(e.every('note', 'folder')), 10);
    expect(countCondition).toBe('count of every note of folder > 10');
  });
});

describe('Builder - If with ExprBuilder', () => {
  it('should accept ExprBuilder callback in if()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .if((e) => e.gt('counter', 10))
      .raw('log "greater"')
      .endif()
      .build();

    expect(script).toContain('if counter > 10');
  });

  it('should accept ExprBuilder callback in ifThen()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThen(
        (e) => e.and(e.gt('x', 5), e.lt('x', 10)),
        (b) => {
          b.raw('log "in range"');
        },
      )
      .build();

    expect(script).toContain('if x > 5 and x < 10');
  });

  it('should accept ExprBuilder callback in ifThenElse()', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThenElse(
        (e) => e.eq('status', 'done'),
        (b) => {
          b.raw('log "complete"');
        },
        (b) => {
          b.raw('log "pending"');
        },
      )
      .build();

    expect(script).toContain('if status = "done"');
  });

  it('should support nested if with ExprBuilder', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .if((e) => e.gt('counter', 0))
      .then()
      .if((e) => e.lt('counter', 100))
      .raw('log "in range"')
      .endif()
      .endif()
      .build();

    expect(script).toContain('if counter > 0');
    expect(script).toContain('if counter < 100');
  });
});

describe('Real-world Example - Notes Script', () => {
  it('should build complex notes script with new API', () => {
    const builder = new AppleScriptBuilder();
    const notesToFetch = 50;

    const script = builder
      .tell('Notes')
      .set('notesList', [])
      .set('counter', 0)
      .repeatWith('aNote', 'every note')
      .increment('counter')
      .ifThen(
        (e) => e.gt('counter', notesToFetch),
        (b) => {
          b.exitRepeat();
        },
      )
      .tryCatch(
        (b) => {
          b.setExpression('notePlaintext', 'plaintext of aNote');
          b.ifThenElse(
            (e) => e.gt(e.length('notePlaintext'), 100),
            (tb) => {
              tb.setExpression('notePreview', 'text 1 thru 100 of notePlaintext & "..."');
            },
            (eb) => {
              eb.set('notePreview', 'notePlaintext');
            },
          );
          b.setEndRecord('notesList', {
            noteName: 'name of aNote',
            noteId: 'id of aNote',
            preview: 'notePreview',
          });
        },
        (c) => {
          c.comment('Skip notes with errors');
        },
      )
      .endrepeat()
      .returnRaw('notesList')
      .endtell()
      .build();

    // Verify structure
    expect(script).toContain('tell application "Notes"');
    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('if counter > 50');
    expect(script).toContain('exit repeat');
    expect(script).toContain('try');
    expect(script).toContain('if length of notePlaintext > 100');
    expect(script).toContain('set end of notesList to');
    expect(script).toContain('on error');
    expect(script).toContain('end try');
    expect(script).toContain('end repeat');
    expect(script).toContain('return notesList');
    expect(script).toContain('end tell');

    // Verify proper indentation (4 spaces for repeat + inner statement)
    const lines = script.split('\n');
    expect(lines.some((l) => l.startsWith('    if counter > 50'))).toBe(true);
  });
});

describe('Factory Function', () => {
  it('expr() should create ExprBuilder instance', () => {
    const e = expr();
    expect(e).toBeInstanceOf(ExprBuilder);
    expect(e.gt('x', 5)).toBe('x > 5');
  });
});

describe('Builder - Repeat Convenience Helpers', () => {
  it('should use forEach to iterate with callback', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .forEach('item', 'every note', (b) => {
        b.setEndRaw('results', 'item');
      })
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('set end of results to item');
    expect(script).toContain('end repeat');
    expect(script.split('end repeat').length).toBe(2);
  });

  it('should use repeatTimes with callback', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .repeatTimes(5, (b) => {
        b.increment('counter');
      })
      .build();

    expect(script).toContain('repeat 5 times');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('end repeat');
  });

  it('should use repeatWhileBlock with callback', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .repeatWhileBlock('counter < 10', (b) => {
        b.increment('counter');
      })
      .build();

    expect(script).toContain('repeat while counter < 10');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('end repeat');
  });

  it('should use repeatUntilBlock with callback', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .repeatUntilBlock('counter >= 10', (b) => {
        b.increment('counter');
      })
      .build();

    expect(script).toContain('repeat until counter >= 10');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('end repeat');
  });

  it('should support fluent chaining within forEach callback', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .forEach('item', 'sourceList', (b) =>
        b
          .setExpression('processed', 'transform(item)')
          .comment('Add to results')
          .setEndRaw('results', 'processed'),
      )
      .build();

    expect(script).toContain('repeat with item in sourceList');
    expect(script).toContain('set processed to transform(item)');
    expect(script).toContain('-- Add to results');
    expect(script).toContain('set end of results to processed');
    expect(script).toContain('end repeat');
  });

  it('should support nested repeat helpers', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .forEach('outer', 'every folder', (b1) => {
        b1.forEach('inner', 'every note', (b2) => {
          b2.raw('log inner');
        });
      })
      .build();

    expect(script).toContain('repeat with outer in every folder');
    expect(script).toContain('repeat with inner in every note');
    expect(script).toContain('log inner');
    const endRepeats = script.split('end repeat');
    expect(endRepeats.length).toBe(3); // 2 end repeats + 1 remainder
  });

  it('should use forEachWhile for iteration with continue condition', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .forEachWhile(
        'item',
        'every note',
        (e) => e.lte('counter', 50),
        (b) => b.increment('counter').raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if not counter <= 50 then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('process item');
    expect(script).toContain('end repeat');
  });

  it('should use forEachUntil for iteration with break condition', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .forEachUntil(
        'item',
        'every note',
        (e) => e.gt('counter', 50),
        (b) => b.increment('counter').raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if counter > 50 then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('set counter to counter + 1');
    expect(script).toContain('process item');
    expect(script).toContain('end repeat');
  });

  it('should use forEachUntil with string condition', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('found', false)
      .forEachUntil('item', 'every note', 'found = true', (b) =>
        b.raw('if item matches search then set found to true'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if found = true then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('end if');
    expect(script).toContain('end repeat');
  });
});

describe('Builder - Comprehensive Robustness Tests', () => {
  it('should handle 3+ levels of nested blocks with proper indentation', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .forEach('account', 'every account', (b1) =>
        b1.forEach('folder', 'every folder', (b2) =>
          b2.forEach('note', 'every note', (b3) => b3.raw('log name of note')),
        ),
      )
      .endtell()
      .build();

    expect(script).toContain('tell application "Notes"');
    expect(script).toContain('repeat with account in every account');
    expect(script).toContain('repeat with folder in every folder');
    expect(script).toContain('repeat with note in every note');
    expect(script).toContain('log name of note');
    expect(script.split('end repeat').length).toBe(4); // 3 end repeats + 1 remainder
    expect(script).toContain('end tell');

    // Verify proper indentation at different levels
    const lines = script.split('\n');
    expect(lines.some((l) => l.startsWith('  repeat with account'))).toBe(true);
    expect(lines.some((l) => l.startsWith('    repeat with folder'))).toBe(true);
    expect(lines.some((l) => l.startsWith('      repeat with note'))).toBe(true);
    expect(lines.some((l) => l.startsWith('        log name of note'))).toBe(true);
  });

  it('should handle multiple forEachUntil in sequence', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('count1', 0)
      .forEachUntil(
        'item1',
        'list1',
        (e) => e.gt('count1', 10),
        (b) => b.increment('count1'),
      )
      .set('count2', 0)
      .forEachUntil(
        'item2',
        'list2',
        (e) => e.gt('count2', 20),
        (b) => b.increment('count2'),
      )
      .build();

    expect(script).toContain('repeat with item1 in list1');
    expect(script).toContain('if count1 > 10 then');
    expect(script).toContain('repeat with item2 in list2');
    expect(script).toContain('if count2 > 20 then');
    expect(script.split('end repeat').length).toBe(3); // 2 end repeats + 1 remainder
  });

  it('should handle forEachWhile with complex ExprBuilder conditions', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .set('enabled', true)
      .forEachWhile(
        'item',
        'every note',
        (e) => e.and(e.lte('counter', 100), e.eq('enabled', true)),
        (b) => b.increment('counter').raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if not counter <= 100 and enabled = true then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('end repeat');
  });

  it('should handle nested tryCatch inside forEachUntil', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .forEachUntil(
        'item',
        'every note',
        (e) => e.gt('counter', 50),
        (b) =>
          b.increment('counter').tryCatch(
            (tryBlock) => tryBlock.raw('set x to name of item'),
            (catchBlock) => catchBlock.raw('log "error"'),
          ),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if counter > 50 then');
    expect(script).toContain('try');
    expect(script).toContain('set x to name of item');
    expect(script).toContain('on error');
    expect(script).toContain('end try');
    expect(script).toContain('end repeat');
  });

  it('should handle forEach inside ifThenElse branches', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('mode', 'full')
      .ifThenElse(
        (e) => e.eq('mode', 'full'),
        (thenBlock) => thenBlock.forEach('item', 'every note', (b) => b.raw('process fully item')),
        (elseBlock) =>
          elseBlock.forEach('item', 'every note', (b) => b.raw('process partially item')),
      )
      .build();

    expect(script).toContain('if mode = "full" then');
    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('process fully item');
    expect(script).toContain('else');
    expect(script).toContain('process partially item');
    expect(script.split('end repeat').length).toBe(3); // 2 end repeats + 1 remainder
  });

  it('should handle continueRepeat in loops', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .forEach('item', 'every note', (b) =>
        b
          .ifThen(
            (e) => e.eq('item', 'skip'),
            (skipBlock) => skipBlock.continueRepeat(),
          )
          .raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if item = "skip" then');
    // continueRepeat should be represented in the script
    expect(script).toContain('end if');
    expect(script).toContain('process item');
    expect(script).toContain('end repeat');
  });

  it('should handle complex setEndRecord with source object form', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .repeatWith('acc', 'every account')
      .setEndRecord('results', 'acc', {
        accountName: 'name',
        accountId: 'id',
        noteCount: 'count of notes',
      })
      .endrepeat()
      .build();

    expect(script).toContain('repeat with acc in every account');
    expect(script).toContain('set end of results to');
    expect(script).toContain('accountName:name of acc');
    expect(script).toContain('accountId:id of acc');
    expect(script).toContain('noteCount:count of notes of acc');
  });

  it('should handle setEndRecord with direct expressions form', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .repeatWith('note', 'every note')
      .setEndRecord('results', {
        noteName: 'name of note',
        noteId: 'id of note',
        noteBody: 'body of note',
      })
      .endrepeat()
      .build();

    expect(script).toContain('repeat with note in every note');
    expect(script).toContain('set end of results to');
    expect(script).toContain('noteName:name of note');
    expect(script).toContain('noteId:id of note');
    expect(script).toContain('noteBody:body of note');
  });

  it('should handle setExpression with record objects', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .setExpression('userName', 'name of user')
      .setExpression('userId', 'id of user')
      .setExpression('record', {
        name: 'userName',
        id: 'userId',
      })
      .build();

    expect(script).toContain('set userName to name of user');
    expect(script).toContain('set userId to id of user');
    expect(script).toContain('set record to {name:userName, id:userId}');
  });

  it('should handle nested tells with proper scoping', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Finder')
      .raw('activate')
      .tell('System Events')
      .raw('keystroke "n"')
      .endtell()
      .raw('count windows')
      .endtell()
      .build();

    expect(script).toContain('tell application "Finder"');
    expect(script).toContain('tell application "System Events"');
    expect(script).toContain('keystroke "n"');
    expect(script.split('end tell').length).toBe(3); // 2 end tells + 1 remainder
  });

  it('should handle ExprBuilder parentheses for complex logic', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThen(
        (e) => e.or(e.paren(e.and(e.gt('x', 5), e.lt('x', 10))), e.eq('override', true)),
        (b) => b.raw('execute'),
      )
      .build();

    expect(script).toContain('if (x > 5 and x < 10) or override = true then');
    expect(script).toContain('execute');
  });

  it('should handle deeply nested ifThenElse with ExprBuilder', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .ifThenElse(
        (e) => e.gt('level', 0),
        (b1) =>
          b1.ifThenElse(
            (e) => e.gt('level', 1),
            (b2) =>
              b2.ifThenElse(
                (e) => e.gt('level', 2),
                (b3) => b3.raw('log "level 3"'),
                (b3) => b3.raw('log "level 2"'),
              ),
            (b2) => b2.raw('log "level 1"'),
          ),
        (b1) => b1.raw('log "level 0"'),
      )
      .build();

    expect(script).toContain('if level > 0 then');
    expect(script).toContain('if level > 1 then');
    expect(script).toContain('if level > 2 then');
    expect(script.split('end if').length).toBe(4); // 3 end ifs + 1 remainder
  });

  it('should handle forEachWhile with string condition', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('running', true)
      .forEachWhile('item', 'every note', 'running = true', (b) =>
        b.raw('if should_stop(item) then set running to false').raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if not running = true then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('end repeat');
  });

  it('should handle mixed repeat types in complex scenario', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .repeatTimes(3, (b1) =>
        b1
          .forEach('folder', 'every folder', (b2) =>
            b2.forEachUntil(
              'note',
              'every note',
              (e) => e.gt('counter', 10),
              (b3) => b3.increment('counter'),
            ),
          )
          .raw('log "batch complete"'),
      )
      .build();

    expect(script).toContain('repeat 3 times');
    expect(script).toContain('repeat with folder in every folder');
    expect(script).toContain('repeat with note in every note');
    expect(script.split('end repeat').length).toBe(4); // 3 end repeats + 1 remainder
  });

  it('should handle tryCatchError with complex nested operations', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .forEach('item', 'every note', (b) =>
        b.tryCatchError(
          (tryBlock) =>
            tryBlock.setExpression('data', 'body of item').ifThen(
              (e) => e.gt(e.length('data'), 0),
              (ifBlock) => ifBlock.raw('process data'),
            ),
          'errorMsg',
          (catchBlock) => catchBlock.raw('log errorMsg'),
        ),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('try');
    expect(script).toContain('set data to body of item');
    expect(script).toContain('if length of data > 0 then');
    expect(script).toContain('on error errorMsg');
    expect(script).toContain('log errorMsg');
    expect(script).toContain('end try');
  });

  it('should maintain proper indentation through complex nesting', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .ifThen(
        (e) => e.gt(e.count('notes'), 0),
        (b1) =>
          b1.forEach('note', 'every note', (b2) =>
            b2.tryCatch(
              (b3) => b3.raw('log name of note'),
              (b3) => b3.raw('log "error"'),
            ),
          ),
      )
      .endtell()
      .build();

    const lines = script.split('\n');
    // Verify indentation at each level
    expect(lines.some((l) => l.startsWith('  if count of notes > 0 then'))).toBe(true);
    expect(lines.some((l) => l.startsWith('    repeat with note'))).toBe(true);
    expect(lines.some((l) => l.startsWith('      try'))).toBe(true);
    expect(lines.some((l) => l.startsWith('        log name of note'))).toBe(true);
  });

  it('should handle forEachUntil with complex ExprBuilder combining multiple operations', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('counter', 0)
      .forEachUntil(
        'item',
        'every note',
        (e) => e.or(e.gt('counter', 100), e.eq('shouldStop', true)),
        (b) => b.increment('counter').raw('process item'),
      )
      .build();

    expect(script).toContain('repeat with item in every note');
    expect(script).toContain('if counter > 100 or shouldStop = true then');
    expect(script).toContain('exit repeat');
  });

  it('should handle real-world scenario with all features combined', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .set('results', [])
      .set('counter', 0)
      .set('enabled', true)
      .forEachWhile(
        'account',
        'every account',
        (e) => e.and(e.lt('counter', 3), e.eq('enabled', true)),
        (b1) =>
          b1.increment('counter').forEach('note', 'notes of account', (b2) =>
            b2.tryCatchError(
              (tryBlock) =>
                tryBlock.setExpression('noteData', 'plaintext of note').ifThenElse(
                  (e) => e.gt(e.length('noteData'), 50),
                  (thenBlock) =>
                    thenBlock.setEndRecord('results', 'note', {
                      name: 'name',
                      preview: 'text 1 thru 50 of noteData',
                    }),
                  (elseBlock) =>
                    elseBlock.setEndRecord('results', {
                      name: 'name of note',
                      preview: 'noteData',
                    }),
                ),
              'err',
              (catchBlock) => catchBlock.comment('Skip failed notes'),
            ),
          ),
      )
      .returnRaw('results')
      .endtell()
      .build();

    // Verify all structural elements
    expect(script).toContain('tell application "Notes"');
    expect(script).toContain('repeat with account in every account');
    expect(script).toContain('if not counter < 3 and enabled = true then');
    expect(script).toContain('repeat with note in notes of account');
    expect(script).toContain('try');
    expect(script).toContain('if length of noteData > 50 then');
    expect(script).toContain('on error err');
    expect(script).toContain('return results');
    expect(script).toContain('end tell');
  });

  it('should handle block validation for mismatched convenience helpers', () => {
    const builder = new AppleScriptBuilder();
    // This should work - forEach properly closes its repeat block
    const script = builder
      .forEach('item', 'list', (b) => b.raw('log item'))
      .raw('after loop')
      .build();

    expect(script).toContain('repeat with item in list');
    expect(script).toContain('end repeat');
    expect(script).toContain('after loop');
  });

  it('should handle increment and decrement in various contexts', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('x', 10)
      .increment('x', 5)
      .decrement('x', 2)
      .forEach('item', 'list', (b) => b.increment('x'))
      .build();

    expect(script).toContain('set x to 10');
    expect(script).toContain('set x to x + 5');
    expect(script).toContain('set x to x - 2');
    expect(script).toContain('set x to x + 1');
  });
});

describe('Builder - pickEndRecord() Smart Property Picking', () => {
  it('should append "of source" to simple property names', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'aNote', {
        noteId: 'id',
        noteName: 'name',
        noteContent: 'plaintext',
      })
      .build();

    expect(script).toContain(
      'set end of results to {noteId:id of aNote, noteName:name of aNote, noteContent:plaintext of aNote}',
    );
  });

  it('should detect and preserve full expressions with "of"', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'aNote', {
        noteId: 'id',
        accountId: 'id of account of aNote',
      })
      .build();

    expect(script).toContain('noteId:id of aNote');
    expect(script).toContain('accountId:id of account of aNote');
    // Should NOT double-append "of aNote"
    expect(script).not.toContain('id of account of aNote of aNote');
  });

  it('should detect and preserve expressions with "as" type casting', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'aNote', {
        noteId: 'id',
        noteCreated: 'creation date of aNote as string',
        noteModified: 'modification date as string',
      })
      .build();

    expect(script).toContain('noteId:id of aNote');
    expect(script).toContain('noteCreated:creation date of aNote as string');
    // "modification date as string" has "as" so should NOT get "of aNote"
    expect(script).toContain('noteModified:modification date as string');
  });

  it('should detect expressions with "where" clauses', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'folder', {
        name: 'name',
        activeNotes: 'notes where shared = true',
      })
      .build();

    expect(script).toContain('name:name of folder');
    expect(script).toContain('activeNotes:notes where shared = true');
  });

  it('should detect expressions with "thru" range operators', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'note', {
        name: 'name',
        preview: 'text 1 thru 100 of body',
      })
      .build();

    expect(script).toContain('name:name of note');
    expect(script).toContain('preview:text 1 thru 100 of body');
  });

  it('should detect collection expressions (every, some, first, last)', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'chat', {
        chatId: 'id',
        allParticipants: 'every participant',
        firstParticipant: 'first participant',
        lastParticipant: 'last participant',
        activeParticipants: 'some participant where active = true',
      })
      .build();

    expect(script).toContain('chatId:id of chat');
    expect(script).toContain('allParticipants:every participant');
    expect(script).toContain('firstParticipant:first participant');
    expect(script).toContain('lastParticipant:last participant');
    expect(script).toContain('activeParticipants:some participant where active = true');
  });

  it('should detect function calls (count, length)', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'folder', {
        name: 'name',
        noteCount: 'count of notes',
        nameLength: 'length of name',
      })
      .build();

    expect(script).toContain('name:name of folder');
    expect(script).toContain('noteCount:count of notes');
    expect(script).toContain('nameLength:length of name');
  });

  it('should detect string comparison operators (contains, begins with, ends with)', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'note', {
        name: 'name',
        hasTest: 'name contains "test"',
        startsWithA: 'name begins with "A"',
        endsWithZ: 'name ends with "Z"',
      })
      .build();

    expect(script).toContain('name:name of note');
    expect(script).toContain('hasTest:name contains "test"');
    expect(script).toContain('startsWithA:name begins with "A"');
    expect(script).toContain('endsWithZ:name ends with "Z"');
  });

  it('should handle mixed simple and complex properties in one call', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .pickEndRecord('results', 'aNote', {
        // Simple properties - will get "of aNote"
        noteId: 'id',
        noteName: 'name',
        noteShared: 'shared',
        // Complex expressions - used as-is
        noteCreated: 'creation date of aNote as string',
        notePreview: 'text 1 thru 50 of body',
        noteParticipantCount: 'count of participants',
      })
      .build();

    const recordLine = script.split('\n').find((line) => line.includes('set end of results'));
    expect(recordLine).toContain('noteId:id of aNote');
    expect(recordLine).toContain('noteName:name of aNote');
    expect(recordLine).toContain('noteShared:shared of aNote');
    expect(recordLine).toContain('noteCreated:creation date of aNote as string');
    expect(recordLine).toContain('notePreview:text 1 thru 50 of body');
    expect(recordLine).toContain('noteParticipantCount:count of participants');
  });

  it('should work inside repeat loops', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .forEach('aNote', 'every note', (b) => {
        b.pickEndRecord('results', 'aNote', {
          id: 'id',
          name: 'name',
        });
      })
      .build();

    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('set end of results to {id:id of aNote, name:name of aNote}');
    expect(script).toContain('end repeat');
  });

  it('should work inside try-catch blocks', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .set('results', [])
      .forEach('aNote', 'every note', (b) => {
        b.tryCatch(
          (tryBlock) =>
            tryBlock.pickEndRecord('results', 'aNote', {
              id: 'id',
              name: 'name',
            }),
          (catchBlock) => catchBlock.comment('Skip errors'),
        );
      })
      .build();

    expect(script).toContain('try');
    expect(script).toContain('set end of results to {id:id of aNote, name:name of aNote}');
    expect(script).toContain('on error');
    expect(script).toContain('end try');
  });
});

describe('Builder - mapToJson() Ultra-Shorthand', () => {
  it('should generate complete JSON mapping with limit', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { limit: 10, skipErrors: true },
      )
      .endtell()
      .build();

    // Should have JSON handlers at top
    expect(script).toContain('on escapeJsonString(str)');
    expect(script).toContain('on replaceText(theText, searchStr, replaceStr)');
    expect(script).toContain('on valueToJson(val)');

    // Should have collection logic
    expect(script).toContain('set __collected_items to {}');
    expect(script).toContain('set __counter to 0');
    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('if __counter >= 10 then');
    expect(script).toContain('exit repeat');
    expect(script).toContain('set __counter to __counter + 1');

    // Should have error handling
    expect(script).toContain('try');
    expect(script).toContain('on error');
    expect(script).toContain('-- Skip items with errors');

    // Should build records
    expect(script).toContain(
      'set end of __collected_items to {id:id of aNote, name:name of aNote}',
    );

    // Should have JSON conversion
    expect(script).toContain('set jsonParts to {}');
    expect(script).toContain('repeat with rec in __collected_items');
    expect(script).toContain('set itemJson to "{"');
    expect(script).toContain('\\"id\\":" & my valueToJson(id of rec)');
    expect(script).toContain(',\\"name\\":" & my valueToJson(name of rec)');
    expect(script).toContain('return jsonArray');
  });

  it('should work without limit (collect all items)', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson('aNote', 'every note', {
        id: 'id',
        name: 'name',
      })
      .endtell()
      .build();

    expect(script).toContain('set __collected_items to {}');
    expect(script).toContain('repeat with aNote in every note');
    // Should NOT have counter logic
    expect(script).not.toContain('set __counter to 0');
    expect(script).not.toContain('if __counter >=');
    expect(script).toContain(
      'set end of __collected_items to {id:id of aNote, name:name of aNote}',
    );
  });

  it('should support until condition with ExprBuilder', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { until: (e) => e.gt('length of name', 100) },
      )
      .endtell()
      .build();

    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('if length of name > 100 then');
    expect(script).toContain('exit repeat');
  });

  it('should support until condition with string', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { until: 'found = true' },
      )
      .endtell()
      .build();

    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('if found = true then');
    expect(script).toContain('exit repeat');
  });

  it('should support while condition with ExprBuilder', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { while: (e) => e.lt('counter', 50) },
      )
      .endtell()
      .build();

    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('if not counter < 50 then');
    expect(script).toContain('exit repeat');
  });

  it('should support while condition with string', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { while: 'running = true' },
      )
      .endtell()
      .build();

    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('if not running = true then');
    expect(script).toContain('exit repeat');
  });

  it('should skip error handling when skipErrors is false', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { limit: 5, skipErrors: false },
      )
      .endtell()
      .build();

    expect(script).toContain(
      'set end of __collected_items to {id:id of aNote, name:name of aNote}',
    );
    // Should NOT have try-catch around the record building
    const lines = script.split('\n');
    const recordLineIndex = lines.findIndex((line) =>
      line.includes('set end of __collected_items to {id:id of aNote'),
    );
    const tryLineIndex = lines.findIndex(
      (line, index) => index < recordLineIndex && line.trim() === 'try',
    );

    // If there's a try block, it should be for JSON conversion, not record building
    if (tryLineIndex !== -1) {
      // The try block should be far away from the record line (it's for JSON conversion later)
      expect(Math.abs(recordLineIndex - tryLineIndex)).toBeGreaterThan(3);
    }
  });

  it('should handle complex properties with smart expression detection', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
          created: 'creation date of aNote as string',
          preview: 'text 1 thru 100 of body',
          participantCount: 'count of participants',
        },
        { limit: 10 },
      )
      .endtell()
      .build();

    // Check that pickEndRecord properly detected expression types
    const recordLine = script
      .split('\n')
      .find((line) => line.includes('set end of __collected_items to {id:'));
    expect(recordLine).toContain('id:id of aNote');
    expect(recordLine).toContain('name:name of aNote');
    expect(recordLine).toContain('created:creation date of aNote as string');
    expect(recordLine).toContain('preview:text 1 thru 100 of body');
    expect(recordLine).toContain('participantCount:count of participants');
  });

  it('should properly map JSON keys to record property keys', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          noteId: 'id',
          noteName: 'name',
          noteContent: 'plaintext',
        },
        { limit: 5 },
      )
      .endtell()
      .build();

    // Record should have keys matching the JSON keys
    expect(script).toContain(
      'set end of __collected_items to {noteId:id of aNote, noteName:name of aNote, noteContent:plaintext of aNote}',
    );

    // JSON conversion should access these same keys
    expect(script).toContain('\\"noteId\\":" & my valueToJson(noteId of rec)');
    expect(script).toContain(',\\"noteName\\":" & my valueToJson(noteName of rec)');
    expect(script).toContain(',\\"noteContent\\":" & my valueToJson(noteContent of rec)');
  });

  it('should work with different collection expressions', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Finder')
      .mapToJson(
        'aFile',
        'files of folder "Documents"',
        {
          fileName: 'name',
          fileSize: 'size',
        },
        { limit: 20 },
      )
      .endtell()
      .build();

    expect(script).toContain('repeat with aFile in files of folder "Documents"');
    expect(script).toContain(
      'set end of __collected_items to {fileName:name of aFile, fileSize:size of aFile}',
    );
  });

  it('should handle empty property maps', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson('aNote', 'every note', {}, { limit: 5 })
      .endtell()
      .build();

    // Should still generate valid script with empty records
    expect(script).toContain('set __collected_items to {}');
    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain('set end of __collected_items to {}');
  });

  it('should combine limit with skipErrors', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
        },
        { limit: 10, skipErrors: true },
      )
      .endtell()
      .build();

    // Should have both counter and error handling
    expect(script).toContain('set __counter to 0');
    expect(script).toContain('if __counter >= 10 then');
    expect(script).toContain('set __counter to __counter + 1');
    expect(script).toContain('try');
    expect(script).toContain('on error');
    expect(script).toContain('-- Skip items with errors');
  });

  it('should work without any options (defaults)', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson('aNote', 'every note', {
        id: 'id',
        name: 'name',
      })
      .endtell()
      .build();

    // Should work with defaults: no limit, no conditions, no error skipping
    expect(script).toContain('repeat with aNote in every note');
    expect(script).toContain(
      'set end of __collected_items to {id:id of aNote, name:name of aNote}',
    );
    expect(script).not.toContain('if __counter >=');
    expect(script).not.toContain('if not');
    // Should not have try-catch in the collection loop
    expect(script).toContain('return jsonArray');
  });

  it('should properly nest inside tell blocks', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .set('accountName', 'Work')
      .mapToJson(
        'aNote',
        'notes of account accountName',
        {
          id: 'id',
          name: 'name',
        },
        { limit: 5 },
      )
      .endtell()
      .build();

    expect(script).toContain('tell application "Notes"');
    expect(script).toContain('set accountName to "Work"');
    expect(script).toContain('repeat with aNote in notes of account accountName');
    expect(script).toContain('end tell');
  });

  it('should generate valid JSON structure', () => {
    const builder = new AppleScriptBuilder();
    const script = builder
      .tell('Notes')
      .mapToJson(
        'aNote',
        'every note',
        {
          id: 'id',
          name: 'name',
          shared: 'shared',
        },
        { limit: 2 },
      )
      .endtell()
      .build();

    // Verify JSON structure building
    expect(script).toContain('set jsonParts to {}');
    expect(script).toContain('set itemJson to "{"');
    expect(script).toContain('\\"id\\":" & my valueToJson(id of rec)');
    expect(script).toContain(',\\"name\\":" & my valueToJson(name of rec)');
    expect(script).toContain(',\\"shared\\":" & my valueToJson(shared of rec)');
    expect(script).toContain('set itemJson to itemJson & "}"');
    expect(script).toContain('set end of jsonParts to itemJson');
    expect(script).toContain('set jsonArray to "[" & (jsonParts as text) & "]"');
    expect(script).toContain('return jsonArray');
  });
});
