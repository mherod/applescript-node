import { ExprBuilder } from './expressions.js';

/**
 * Resolves an expression that can be either a string or a function that takes an ExprBuilder.
 * This is a common pattern throughout the builder for accepting flexible expression inputs.
 *
 * @template TScope - Union of variable names available in the current scope (for type-safe ExprBuilder)
 * @param expression - Either a string expression or a function that builds an expression using ExprBuilder
 * @returns The resolved string expression
 *
 * @example
 * ```typescript
 * // String expression
 * resolveExpression('counter > 10') // => 'counter > 10'
 *
 * // Function expression
 * resolveExpression((e) => e.gt('counter', 10)) // => 'counter > 10'
 * ```
 */
export function resolveExpression<TScope extends string = never>(
  expression: string | ((expr: ExprBuilder<TScope>) => string),
): string {
  return typeof expression === 'function' ? expression(new ExprBuilder<TScope>()) : expression;
}
