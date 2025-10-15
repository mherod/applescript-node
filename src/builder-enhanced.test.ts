import { describe, it, expect } from 'vitest';
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
    expect(e.gte('x', 5)).toBe('x ≥ 5');
    expect(e.lte('x', 5)).toBe('x ≤ 5');
  });

  it('should build equality expression', () => {
    const e = new ExprBuilder();
    expect(e.eq('status', 'done')).toBe('status = "done"');
    expect(e.eq('count', 0)).toBe('count = 0');
    expect(e.eq('enabled', true)).toBe('enabled = true');
  });

  it('should build inequality expression', () => {
    const e = new ExprBuilder();
    expect(e.ne('status', 'pending')).toBe('status ≠ "pending"');
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
    expect(script).toContain('if not counter ≤ 50 then');
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
    expect(script).toContain('if not counter ≤ 100 and enabled = true then');
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
