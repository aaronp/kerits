/**
 * RFC8785 Canonical JSON implementation
 *
 * Provides deterministic JSON serialization using json-canonicalize library
 */

import { canonicalize } from 'json-canonicalize';

/**
 * Canonicalize JSON per RFC8785
 *
 * @param obj - JavaScript object to canonicalize
 * @returns Canonical JSON string (no trailing newline)
 *
 * Requirements:
 * - Deterministic property ordering (lexicographic by UTF-16 code units)
 * - Minimal whitespace (no extra spaces/newlines)
 * - Unicode escaping where required
 * - Handles nested objects, arrays, primitives
 * - Throws on non-serializable values (functions, undefined, symbols)
 */
export function canonical(obj: unknown): string {
  // json-canonicalize already implements RFC8785 correctly
  // It handles:
  // - Lexicographic property ordering
  // - Numeric normalization
  // - Unicode escaping
  // - No trailing newline
  return canonicalize(obj);
}
