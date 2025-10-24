import { describe, expect, it } from 'vitest';
import { ExprBuilder, expr } from './expressions.js';

describe('ExprBuilder', () => {
  describe('Comparison operators', () => {
    it('should create greater than comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.gt('counter', 10)).toBe('counter > 10');
    });

    it('should create greater than comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.gt('name', 'test')).toBe('name > "test"');
    });

    it('should create less than comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.lt('counter', 5)).toBe('counter < 5');
    });

    it('should create less than comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.lt('status', 'done')).toBe('status < "done"');
    });

    it('should create greater than or equal comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.gte('age', 18)).toBe('age >= 18');
    });

    it('should create greater than or equal comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.gte('level', 'intermediate')).toBe('level >= "intermediate"');
    });

    it('should create less than or equal comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.lte('score', 100)).toBe('score <= 100');
    });

    it('should create less than or equal comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.lte('priority', 'high')).toBe('priority <= "high"');
    });

    it('should create equality comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.eq('status', 'active')).toBe('status = "active"');
    });

    it('should create equality comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.eq('count', 42)).toBe('count = 42');
    });

    it('should create equality comparison with boolean', () => {
      const e = new ExprBuilder();
      expect(e.eq('isActive', true)).toBe('isActive = true');
      expect(e.eq('isActive', false)).toBe('isActive = false');
    });

    it('should create inequality comparison with string', () => {
      const e = new ExprBuilder();
      expect(e.ne('status', 'pending')).toBe('status is not equal to "pending"');
    });

    it('should create inequality comparison with number', () => {
      const e = new ExprBuilder();
      expect(e.ne('count', 0)).toBe('count is not equal to 0');
    });

    it('should create inequality comparison with boolean', () => {
      const e = new ExprBuilder();
      expect(e.ne('flag', true)).toBe('flag is not equal to true');
    });
  });

  describe('Logical operators', () => {
    it('should combine conditions with AND', () => {
      const e = new ExprBuilder();
      expect(e.and('x > 5', 'y < 10')).toBe('x > 5 and y < 10');
    });

    it('should combine multiple conditions with AND', () => {
      const e = new ExprBuilder();
      expect(e.and('a = 1', 'b = 2', 'c = 3')).toBe('a = 1 and b = 2 and c = 3');
    });

    it('should combine conditions with OR', () => {
      const e = new ExprBuilder();
      expect(e.or('status = "done"', 'status = "skipped"')).toBe(
        'status = "done" or status = "skipped"',
      );
    });

    it('should combine multiple conditions with OR', () => {
      const e = new ExprBuilder();
      expect(e.or('x = 1', 'x = 2', 'x = 3')).toBe('x = 1 or x = 2 or x = 3');
    });

    it('should negate a condition with NOT', () => {
      const e = new ExprBuilder();
      expect(e.not('exists window')).toBe('not exists window');
    });

    it('should combine NOT with other operators', () => {
      const e = new ExprBuilder();
      expect(e.not(e.eq('status', 'pending'))).toBe('not status = "pending"');
    });
  });

  describe('String operations', () => {
    it('should get string length', () => {
      const e = new ExprBuilder();
      expect(e.length('name')).toBe('length of name');
    });

    it('should check if string contains substring', () => {
      const e = new ExprBuilder();
      expect(e.contains('name', '"test"')).toBe('name contains "test"');
    });

    it('should check if string contains number', () => {
      const e = new ExprBuilder();
      expect(e.contains('value', 42)).toBe('value contains 42');
    });

    it('should check if string starts with prefix', () => {
      const e = new ExprBuilder();
      expect(e.startsWith('name', '"John"')).toBe('name begins with "John"');
    });

    it('should check if string ends with suffix', () => {
      const e = new ExprBuilder();
      expect(e.endsWith('filename', '".txt"')).toBe('filename ends with ".txt"');
    });

    it('should check wildcard pattern matching', () => {
      const e = new ExprBuilder();
      expect(e.matches('name', '"*Smith*"')).toBe('name contains "*Smith*"');
    });

    it('should concatenate multiple strings', () => {
      const e = new ExprBuilder();
      expect(e.concat('"Hello"', '", "', '"World"')).toBe('"Hello" & ", " & "World"');
    });

    it('should get substring with text range', () => {
      const e = new ExprBuilder();
      expect(e.text(1, 100, 'notePlaintext')).toBe('text 1 thru 100 of notePlaintext');
    });

    it('should get character at index', () => {
      const e = new ExprBuilder();
      expect(e.character(1, 'myString')).toBe('character 1 of myString');
    });
  });

  describe('Property and object operations', () => {
    it('should access object property', () => {
      const e = new ExprBuilder();
      expect(e.property('aNote', 'name')).toBe('name of aNote');
    });

    it('should access nested properties', () => {
      const e = new ExprBuilder();
      expect(e.nestedProperty('aChat', 'account', 'id')).toBe('id of account of aChat');
    });

    it('should access deeply nested properties', () => {
      const e = new ExprBuilder();
      expect(e.nestedProperty('item', 'parent', 'folder', 'name')).toBe(
        'name of folder of parent of item',
      );
    });

    it('should handle nestedProperty with no properties (edge case)', () => {
      const e = new ExprBuilder();
      expect(e.nestedProperty('obj')).toBe('obj');
    });

    it('should check if property exists', () => {
      const e = new ExprBuilder();
      expect(e.exists('window "Settings"')).toBe('exists window "Settings"');
    });

    it('should check type equality', () => {
      const e = new ExprBuilder();
      expect(e.typeEquals('value', 'text')).toBe('the type of value is text');
    });

    it('should cast to type', () => {
      const e = new ExprBuilder();
      expect(e.asType('creation date', 'string')).toBe('creation date as string');
    });

    it('should cast to different types', () => {
      const e = new ExprBuilder();
      expect(e.asType('value', 'text')).toBe('value as text');
      expect(e.asType('value', 'number')).toBe('value as number');
      expect(e.asType('value', 'integer')).toBe('value as integer');
      expect(e.asType('value', 'list')).toBe('value as list');
    });
  });

  describe('Collection operations', () => {
    it('should count items in collection', () => {
      const e = new ExprBuilder();
      expect(e.count('notes')).toBe('count of notes');
    });

    it('should access item by index', () => {
      const e = new ExprBuilder();
      expect(e.item(1, 'myList')).toBe('item 1 of myList');
    });

    it('should access item by variable index', () => {
      const e = new ExprBuilder();
      expect(e.item('i', 'notes')).toBe('item i of notes');
    });

    it('should access items range', () => {
      const e = new ExprBuilder();
      expect(e.items(1, 5, 'myList')).toBe('items 1 thru 5 of myList');
    });

    it('should get first item', () => {
      const e = new ExprBuilder();
      expect(e.first('note', 'notes')).toBe('first note of notes');
    });

    it('should get last item', () => {
      const e = new ExprBuilder();
      expect(e.last('note', 'notes')).toBe('last note of notes');
    });

    it('should get every element', () => {
      const e = new ExprBuilder();
      expect(e.every('participant', 'aChat')).toBe('every participant of aChat');
    });

    it('should check some element matches condition', () => {
      const e = new ExprBuilder();
      expect(e.some('note', 'notes', 'name contains "test"')).toBe(
        'some note of notes where name contains "test"',
      );
    });

    it('should filter elements by condition', () => {
      const e = new ExprBuilder();
      expect(e.filter('note', 'notes', 'shared = true')).toBe(
        'every note of notes where shared = true',
      );
    });

    it('should access property of item', () => {
      const e = new ExprBuilder();
      expect(e.propertyOfItem('name', 1, 'contacts')).toBe('name of item 1 of contacts');
    });

    it('should access value of item', () => {
      const e = new ExprBuilder();
      expect(e.valueOfItem(1, 'emails of aPerson')).toBe('value of item 1 of emails of aPerson');
    });

    it('should access value of item by variable index', () => {
      const e = new ExprBuilder();
      expect(e.valueOfItem('index', 'items')).toBe('value of item index of items');
    });
  });

  describe('Expression utilities', () => {
    it('should add parentheses for grouping', () => {
      const e = new ExprBuilder();
      expect(e.paren('x > 5 and y < 10')).toBe('(x > 5 and y < 10)');
    });

    it('should create custom comparison', () => {
      const e = new ExprBuilder();
      expect(e.compare('length of name1', '>', 'length of name2')).toBe(
        'length of name1 > length of name2',
      );
    });

    it('should create comparison with different operators', () => {
      const e = new ExprBuilder();
      expect(e.compare('a', '<', 'b')).toBe('a < b');
      expect(e.compare('a', '>=', 'b')).toBe('a >= b');
      expect(e.compare('a', '<=', 'b')).toBe('a <= b');
      expect(e.compare('a', '=', 'b')).toBe('a = b');
      expect(e.compare('a', '!=', 'b')).toBe('a != b');
    });
  });

  describe('Complex expressions', () => {
    it('should build complex nested conditions', () => {
      const e = new ExprBuilder();
      const condition = e.and(
        e.gt(e.count('notes'), 0),
        e.or(e.eq('status', 'active'), e.eq('status', 'pending')),
      );
      expect(condition).toBe('count of notes > 0 and status = "active" or status = "pending"');
    });

    it('should combine property access with comparisons', () => {
      const e = new ExprBuilder();
      const condition = e.gt(e.count(e.property('aPerson', 'emails')), 0);
      expect(condition).toBe('count of emails of aPerson > 0');
    });

    it('should build complex string operations', () => {
      const e = new ExprBuilder();
      const expr = e.concat(e.text(1, 50, 'body'), '"..."');
      expect(expr).toBe('text 1 thru 50 of body & "..."');
    });

    it('should combine type checking with logic', () => {
      const e = new ExprBuilder();
      const condition = e.and(e.exists('value'), e.typeEquals('value', 'text'));
      expect(condition).toBe('exists value and the type of value is text');
    });

    it('should use nested properties in conditions', () => {
      const e = new ExprBuilder();
      const condition = e.gt(e.length(e.nestedProperty('note', 'folder', 'name')), 10);
      expect(condition).toBe('length of name of folder of note > 10');
    });
  });

  describe('expr factory function', () => {
    it('should create ExprBuilder instance', () => {
      const e = expr();
      expect(e).toBeInstanceOf(ExprBuilder);
    });

    it('should create functional ExprBuilder', () => {
      const e = expr();
      expect(e.gt('counter', 5)).toBe('counter > 5');
      expect(e.property('item', 'name')).toBe('name of item');
    });

    it('should support type parameter (compile-time check)', () => {
      const e = expr<'myVar' | 'anotherVar'>();
      expect(e.property('myVar', 'name')).toBe('name of myVar');
    });
  });

  describe('Real-world usage patterns', () => {
    it('should build email existence check', () => {
      const e = new ExprBuilder();
      const condition = e.and(
        e.gt(e.count(e.property('aPerson', 'emails')), 0),
        e.ne(e.valueOfItem(1, e.property('aPerson', 'emails')), ''),
      );
      expect(condition).toBe(
        'count of emails of aPerson > 0 and value of item 1 of emails of aPerson is not equal to ""',
      );
    });

    it('should build text truncation with ellipsis', () => {
      const e = new ExprBuilder();
      const truncateCondition = e.gt(e.length('notePlaintext'), 100);
      expect(truncateCondition).toBe('length of notePlaintext > 100');

      const truncatedText = e.concat(e.text(1, 100, 'notePlaintext'), '"..."');
      expect(truncatedText).toBe('text 1 thru 100 of notePlaintext & "..."');
    });

    it('should build record filtering condition', () => {
      const e = new ExprBuilder();
      const condition = e.and(
        e.exists(e.property('record', 'name')),
        e.not(e.eq(e.property('record', 'status'), 'deleted')),
      );
      expect(condition).toBe('exists name of record and not status of record = "deleted"');
    });

    it('should build collection size check', () => {
      const e = new ExprBuilder();
      const condition = e.or(
        e.eq(e.count('items'), 0),
        e.gt(e.count(e.filter('item', 'items', 'active = true')), 5),
      );
      expect(condition).toBe(
        'count of items = 0 or count of every item of items where active = true > 5',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty AND conditions', () => {
      const e = new ExprBuilder();
      expect(e.and()).toBe('');
    });

    it('should handle single AND condition', () => {
      const e = new ExprBuilder();
      expect(e.and('x > 5')).toBe('x > 5');
    });

    it('should handle empty OR conditions', () => {
      const e = new ExprBuilder();
      expect(e.or()).toBe('');
    });

    it('should handle single OR condition', () => {
      const e = new ExprBuilder();
      expect(e.or('status = "done"')).toBe('status = "done"');
    });

    it('should handle empty concat', () => {
      const e = new ExprBuilder();
      expect(e.concat()).toBe('');
    });

    it('should handle single concat part', () => {
      const e = new ExprBuilder();
      expect(e.concat('"Hello"')).toBe('"Hello"');
    });

    it('should handle zero as number in comparisons', () => {
      const e = new ExprBuilder();
      expect(e.gt('count', 0)).toBe('count > 0');
      expect(e.eq('index', 0)).toBe('index = 0');
    });

    it('should handle negative numbers in comparisons', () => {
      const e = new ExprBuilder();
      expect(e.lt('temperature', -10)).toBe('temperature < -10');
      expect(e.gte('balance', -100)).toBe('balance >= -100');
    });

    it('should handle very large numbers', () => {
      const e = new ExprBuilder();
      expect(e.gt('fileSize', 1000000000)).toBe('fileSize > 1000000000');
    });

    it('should handle decimal numbers', () => {
      const e = new ExprBuilder();
      expect(e.lte('percentage', 99.99)).toBe('percentage <= 99.99');
    });
  });
});
