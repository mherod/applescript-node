/**
 * ExprBuilder provides a type-safe DSL for building AppleScript expressions.
 * Instead of writing raw strings like: `if('counter > 10')`
 * You can write: `if(expr => expr.gt('counter', 10))`
 *
 * This enables:
 * - Type checking and autocomplete
 * - Prevention of common syntax errors
 * - Composable expressions
 * - Self-documenting code
 */

export class ExprBuilder {
  /**
   * Greater than comparison: left > right
   */
  gt(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} > ${rightValue}`;
  }

  /**
   * Less than comparison: left < right
   */
  lt(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} < ${rightValue}`;
  }

  /**
   * Greater than or equal: left >= right
   */
  gte(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} >= ${rightValue}`;
  }

  /**
   * Less than or equal: left <= right
   */
  lte(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} <= ${rightValue}`;
  }

  /**
   * Equality comparison: left = right
   */
  eq(left: string, right: string | number | boolean): string {
    let rightValue: string;
    if (typeof right === 'string') {
      rightValue = `"${right}"`;
    } else if (typeof right === 'boolean') {
      rightValue = right.toString();
    } else {
      rightValue = right.toString();
    }
    return `${left} = ${rightValue}`;
  }

  /**
   * Inequality comparison: left is not equal to right
   */
  ne(left: string, right: string | number | boolean): string {
    let rightValue: string;
    if (typeof right === 'string') {
      rightValue = `"${right}"`;
    } else if (typeof right === 'boolean') {
      rightValue = right.toString();
    } else {
      rightValue = right.toString();
    }
    return `${left} is not equal to ${rightValue}`;
  }

  /**
   * Logical AND: combines multiple conditions
   * Example: expr.and(expr.gt('x', 5), expr.lt('x', 10))
   */
  and(...conditions: string[]): string {
    return conditions.join(' and ');
  }

  /**
   * Logical OR: combines multiple conditions
   * Example: expr.or(expr.eq('status', 'done'), expr.eq('status', 'skipped'))
   */
  or(...conditions: string[]): string {
    return conditions.join(' or ');
  }

  /**
   * Logical NOT: negates a condition
   * Example: expr.not(expr.eq('status', 'pending'))
   */
  not(condition: string): string {
    return `not ${condition}`;
  }

  /**
   * String length: length of str
   * Often used in conditions like: expr.gt(expr.length('name'), 5)
   */
  length(str: string): string {
    return `length of ${str}`;
  }

  /**
   * Property access: prop of obj
   * Example: expr.property('aNote', 'name')
   */
  property(obj: string, prop: string): string {
    return `${prop} of ${obj}`;
  }

  /**
   * Count: count of items
   * Example: expr.gt(expr.count('notes'), 10)
   */
  count(items: string): string {
    return `count of ${items}`;
  }

  /**
   * Existence check: exists item
   * Example: expr.exists('window "Settings"')
   */
  exists(item: string): string {
    return `exists ${item}`;
  }

  /**
   * String contains: haystack contains needle
   * Example: expr.contains('name', '"test"')
   */
  contains(haystack: string, needle: string | number): string {
    const needleValue = typeof needle === 'number' ? needle.toString() : needle;
    return `${haystack} contains ${needleValue}`;
  }

  /**
   * String starts with: str begins with prefix
   * Example: expr.startsWith('name', '"John"')
   */
  startsWith(str: string, prefix: string): string {
    return `${str} begins with ${prefix}`;
  }

  /**
   * String ends with: str ends with suffix
   * Example: expr.endsWith('name', '"son"')
   */
  endsWith(str: string, suffix: string): string {
    return `${str} ends with ${suffix}`;
  }

  /**
   * Type checking: the type of item is typeName
   * Common types: 'text', 'number', 'list', 'record', 'boolean'
   */
  typeEquals(item: string, type: string): string {
    return `the type of ${item} is ${type}`;
  }

  /**
   * Matches wildcard pattern
   * Example: expr.matches('name', '"*Smith*"')
   */
  matches(str: string, pattern: string): string {
    return `${str} contains ${pattern}`;
  }

  /**
   * Parentheses for explicit grouping
   * Useful when combining complex boolean expressions
   * Example: expr.or(expr.paren(expr.and(...)), expr.eq(...))
   */
  paren(condition: string): string {
    return `(${condition})`;
  }

  /**
   * Create a comparison between two expressions
   * Useful for comparing two computed properties
   * Example: expr.compare('length of name1', '>', 'length of name2')
   */
  compare(left: string, operator: '>' | '<' | '>=' | '<=' | '=' | '!=', right: string): string {
    return `${left} ${operator} ${right}`;
  }

  /**
   * Collection accessor: every element of container
   * Example: expr.every('participant', 'aChat') => "every participant of aChat"
   * Example: expr.every('note', 'folder "Notes"') => "every note of folder \"Notes\""
   */
  every(element: string, container: string): string {
    return `every ${element} of ${container}`;
  }

  /**
   * Nested property accessor: chains multiple properties
   * Example: expr.nestedProperty('aChat', 'account', 'id') => "id of account of aChat"
   * Example: expr.nestedProperty('note', 'folder', 'name') => "name of folder of note"
   */
  nestedProperty(obj: string, ...properties: string[]): string {
    if (properties.length === 0) {
      return obj;
    }
    // Build from inside out: "id of account of aChat"
    return properties.reduce((acc, prop) => `${prop} of ${acc}`, obj);
  }

  /**
   * Type casting: expression as type
   * Example: expr.asType('creation date of aNote', 'string') => "creation date of aNote as string"
   * Example: expr.asType(expr.property('aNote', 'id'), 'text') => "id of aNote as text"
   */
  asType(expression: string, type: 'string' | 'text' | 'number' | 'integer' | 'list'): string {
    return `${expression} as ${type}`;
  }

  /**
   * Substring/range accessor: text start thru end of source
   * Example: expr.text(1, 100, 'notePlaintext') => "text 1 thru 100 of notePlaintext"
   * Example: expr.text(5, 10, 'myString') => "text 5 thru 10 of myString"
   */
  text(start: number, end: number, source: string): string {
    return `text ${start} thru ${end} of ${source}`;
  }

  /**
   * Character accessor: character n of source
   * Example: expr.character(1, 'myString') => "character 1 of myString"
   */
  character(index: number, source: string): string {
    return `character ${index} of ${source}`;
  }

  /**
   * Item accessor: item n of collection
   * Example: expr.item(1, 'myList') => "item 1 of myList"
   * Example: expr.item('i', 'notes') => "item i of notes"
   */
  item(index: number | string, collection: string): string {
    return `item ${index} of ${collection}`;
  }

  /**
   * Items range: items start thru end of collection
   * Example: expr.items(1, 5, 'myList') => "items 1 thru 5 of myList"
   */
  items(start: number, end: number, collection: string): string {
    return `items ${start} thru ${end} of ${collection}`;
  }

  /**
   * First item: first element of collection
   * Example: expr.first('note', 'notes') => "first note of notes"
   */
  first(element: string, collection: string): string {
    return `first ${element} of ${collection}`;
  }

  /**
   * Last item: last element of collection
   * Example: expr.last('note', 'notes') => "last note of notes"
   */
  last(element: string, collection: string): string {
    return `last ${element} of ${collection}`;
  }

  /**
   * Some: some element where condition
   * Example: expr.some('note', 'notes', 'name contains "test"')
   */
  some(element: string, collection: string, condition: string): string {
    return `some ${element} of ${collection} where ${condition}`;
  }

  /**
   * Filter: every element where condition
   * Example: expr.filter('note', 'notes', 'shared = true')
   */
  filter(element: string, collection: string, condition: string): string {
    return `every ${element} of ${collection} where ${condition}`;
  }

  /**
   * Concatenation: left & right
   * Example: expr.concat('text 1 thru 50 of body', '"..."') => 'text 1 thru 50 of body & "..."'
   */
  concat(...parts: string[]): string {
    return parts.join(' & ');
  }
}

/**
 * Factory function for creating an ExprBuilder
 * Usage: if(e => e.gt('counter', 10))
 */
export function expr(): ExprBuilder {
  return new ExprBuilder();
}
