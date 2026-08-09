/**
 * AppleScript literal formatting — the single implementation of "turn a
 * JavaScript value into AppleScript source text".
 *
 * This lives on its own rather than in `helpers.ts` because `helpers.ts` imports
 * the builder (for `tell`), so the builder cannot import back without recreating
 * the cycle removed in #87. Everything that needs to escape a value — the
 * builder, the `sources/*` modules, and the top-level helpers — imports from
 * here, so the escaping rules cannot drift between them.
 *
 * @module literals
 */

import type { AppleScriptValue } from './types.js';

/**
 * Escape a JavaScript string for safe embedding inside an AppleScript string literal.
 *
 * Backslashes are escaped first, then quotes, so an input backslash never
 * combines with a following quote to produce an unterminated literal. Escaping
 * quotes first is the classic bug: `a\"b` would become `a\\"b`, whose `\\` is a
 * literal backslash, leaving the `"` to terminate the string.
 *
 * @example
 * escapeAppleScriptString('say "hi"\\now'); // 'say \\"hi\\"\\\\now'
 */
export function escapeAppleScriptString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Convert a JavaScript value into its AppleScript literal form.
 *
 * Strings become quoted literals, arrays become AppleScript lists, and plain
 * objects become records. Both `null` and `undefined` become `missing value` —
 * `undefined` is outside `AppleScriptValue`, but it reaches this function from
 * plain-JS callers and from optional properties that are absent at runtime, and
 * `missing value` is what AppleScript calls the same idea. Without the guard
 * those cases fall through to the record branch and throw from
 * `Object.entries(undefined)`.
 *
 * @example
 * toAppleScriptLiteral(['a', 1, true]); // '{"a", 1, true}'
 * toAppleScriptLiteral({ name: 'Finder' }); // '{name:"Finder"}'
 * toAppleScriptLiteral({ name: 'Finder', note: undefined }); // '{name:"Finder", note:missing value}'
 */
export function toAppleScriptLiteral(value: AppleScriptValue | undefined): string {
  if (value === null || value === undefined) return 'missing value';
  if (typeof value === 'string') return `"${escapeAppleScriptString(value)}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `{${value.map((v) => toAppleScriptLiteral(v)).join(', ')}}`;

  const entries = Object.entries(value as Record<string, AppleScriptValue>)
    .map(([key, val]) => `${key}:${toAppleScriptLiteral(val)}`)
    .join(', ');
  return `{${entries}}`;
}
