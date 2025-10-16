/**
 * ExprBuilder provides a type-safe DSL for building AppleScript expressions.
 * Instead of writing raw strings like: `if('counter > 10')`
 * You can write: `if(expr => expr.gt('counter', 10))`
 *
 * This enables:
 * - Type checking and autocomplete for variables in scope
 * - Prevention of common syntax errors
 * - Composable expressions
 * - Self-documenting code
 *
 * @template TScope - Union of variable names available in the current scope.
 *   When used within loop callbacks like `forEach`, this will include loop variables
 *   like 'aPerson', 'aNote', etc., enabling autocomplete for them.
 *
 * @example
 * // Basic usage with scoped variable
 * .forEach('aPerson', 'every person', (b) => {
 *   b.ifThen(
 *     (e) => e.gt(e.count(e.property('aPerson', 'emails')), 0),
 *     //                             ^^^^^^^^ 'aPerson' gets autocomplete!
 *     (then_) => then_.setExpression('email', (e) =>
 *       e.valueOfItem(1, e.property('aPerson', 'emails'))
 *     )
 *   );
 * })
 *
 * @example
 * // Nested loops with multiple scoped variables
 * .forEach('anAccount', 'every account', (outer) => {
 *   outer.forEach('aNote', 'notes of anAccount', (inner) => {
 *     // Both 'anAccount' and 'aNote' are in scope here
 *     inner.setExpression('accountName', (e) => e.property('anAccount', 'name'));
 *     inner.setExpression('noteName', (e) => e.property('aNote', 'name'));
 *   });
 * })
 */

export class ExprBuilder<TScope extends string = never> {
  /**
   * Greater than comparison: left > right
   * @param left - Variable or expression. Scoped variables (from loops) get autocomplete.
   *   The type `TScope | (string & Record<never, never>)` provides autocomplete for scoped
   *   variables while still accepting any string expression.
   * @param right - Value to compare against (string or number)
   * @returns AppleScript expression: "left > right"
   * @example
   * e.gt('counter', 10)  // => "counter > 10"
   * e.gt('aPerson', 5)   // => "aPerson > 5" (with autocomplete for 'aPerson' if in scope)
   */
  gt(left: TScope | (string & Record<never, never>), right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} > ${rightValue}`;
  }

  /**
   * Less than comparison: left < right
   * @param left - Variable or expression (scoped variables get autocomplete)
   */
  lt(left: TScope | (string & Record<never, never>), right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} < ${rightValue}`;
  }

  /**
   * Greater than or equal: left >= right
   * @param left - Variable or expression (scoped variables get autocomplete)
   */
  gte(left: TScope | (string & Record<never, never>), right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} >= ${rightValue}`;
  }

  /**
   * Less than or equal: left <= right
   * @param left - Variable or expression (scoped variables get autocomplete)
   */
  lte(left: TScope | (string & Record<never, never>), right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} <= ${rightValue}`;
  }

  /**
   * Equality comparison: left = right
   * @param left - Variable or expression (scoped variables get autocomplete)
   */
  eq(left: TScope | (string & Record<never, never>), right: string | number | boolean): string {
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
   * @param left - Variable or expression (scoped variables get autocomplete)
   */
  ne(left: TScope | (string & Record<never, never>), right: string | number | boolean): string {
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
   * @param obj - Variable name. Scoped variables (from loops) get autocomplete.
   *   The type allows both scoped variables and arbitrary string expressions.
   * @param prop - Property name to access
   * @returns AppleScript expression: "prop of obj"
   * @example
   * e.property('aNote', 'name')      // => "name of aNote"
   * e.property('aPerson', 'emails')  // => "emails of aPerson" (with autocomplete for 'aPerson')
   */
  property(obj: TScope | (string & Record<never, never>), prop: string): string {
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
   * @param obj - Variable name (scoped variables get autocomplete)
   */
  nestedProperty(obj: TScope | (string & Record<never, never>), ...properties: string[]): string {
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

  /**
   * Property of item accessor: property of item N of collection
   * Example: expr.propertyOfItem('value', 1, 'emails of aPerson') => "value of item 1 of emails of aPerson"
   * Example: expr.propertyOfItem('name', 1, 'contacts') => "name of item 1 of contacts"
   */
  propertyOfItem(property: string, index: number | string, collection: string): string {
    return `${property} of item ${index} of ${collection}`;
  }

  /**
   * Value of item accessor (common shorthand for propertyOfItem('value', ...))
   * Example: expr.valueOfItem(1, 'emails of aPerson') => "value of item 1 of emails of aPerson"
   * Example: expr.valueOfItem(1, 'phones of contact') => "value of item 1 of phones of contact"
   */
  valueOfItem(index: number | string, collection: string): string {
    return this.propertyOfItem('value', index, collection);
  }
}

/**
 * Factory function for creating an ExprBuilder with type-tracked scope.
 * This is typically not needed as callbacks receive an ExprBuilder instance automatically.
 *
 * @template TScope - Union of variable names available in the current scope.
 *   TypeScript will infer this from loop contexts automatically.
 * @returns ExprBuilder instance with scope tracking
 *
 * @example
 * // Usually you don't need to call this - use callbacks instead:
 * .forEach('aPerson', 'every person', (b) => {
 *   b.ifThen((e) => e.gt('counter', 10), ...) // 'e' provided automatically
 * })
 *
 * @example
 * // Manual usage (rare):
 * const e = expr<'myVar' | 'anotherVar'>();
 * e.property('myVar', 'name'); // 'myVar' gets autocomplete
 */
export function expr<TScope extends string = never>(): ExprBuilder<TScope> {
  return new ExprBuilder<TScope>();
}
