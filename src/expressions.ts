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
   * Greater than or equal: left ≥ right
   */
  gte(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} ≥ ${rightValue}`;
  }

  /**
   * Less than or equal: left ≤ right
   */
  lte(left: string, right: string | number): string {
    const rightValue = typeof right === 'number' ? right.toString() : `"${right}"`;
    return `${left} ≤ ${rightValue}`;
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
   * Inequality comparison: left ≠ right
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
    return `${left} ≠ ${rightValue}`;
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
  compare(left: string, operator: '>' | '<' | '≥' | '≤' | '=' | '≠', right: string): string {
    return `${left} ${operator} ${right}`;
  }
}

/**
 * Factory function for creating an ExprBuilder
 * Usage: if(e => e.gt('counter', 10))
 */
export function expr(): ExprBuilder {
  return new ExprBuilder();
}
