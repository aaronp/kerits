/**
 * SAID (Self-Addressing IDentifier) derivation for schemas
 *
 * Implements RFC 8785 (JSON Canonicalization Scheme) + KERI SAID spec
 *
 * @see https://datatracker.ietf.org/doc/html/draft-ssmith-said
 * @see https://www.rfc-editor.org/rfc/rfc8785.html
 */

import { canonicalize } from 'json-canonicalize';
import { Diger } from '../model/cesr/cesr';

/**
 * Compute SAID for a schema document
 *
 * Steps:
 * 1. Place a placeholder in the $id field
 * 2. Canonicalize using JCS (RFC 8785)
 * 3. Hash the canonical bytes (Blake3-256)
 * 4. Encode as CESR SAID (E prefix for Blake3-256)
 * 5. Return the SAID string
 */
export function deriveSchemaSaid(schema: any): string {
  // 1. Create a copy with placeholder $id
  const placeholder = { ...schema, $id: '' };

  // 2. Canonicalize using JCS (RFC 8785)
  const canonical = canonicalize(placeholder);

  // 3-4. Hash and encode using CESR Diger (Blake3-256 by default)
  const bytes = new TextEncoder().encode(canonical);
  const diger = new Diger({}, bytes);

  // 5. Return the qb64 SAID
  return diger.qb64;
}

/**
 * Embed SAID into schema's $id field (saidify)
 *
 * This is the final step after computing the SAID - it creates
 * a new schema object with the SAID embedded as the $id.
 */
export function saidifySchema<T extends Record<string, any>>(schema: T): T & { $id: string } {
  const said = deriveSchemaSaid(schema);
  return { ...schema, $id: said };
}

/**
 * Verify that a schema's $id matches its computed SAID
 *
 * Useful for validating schemas received from untrusted sources.
 */
export function verifySchemaSaid(schema: any): boolean {
  if (!schema.$id) {
    return false;
  }

  const expectedSaid = deriveSchemaSaid(schema);
  return schema.$id === expectedSaid;
}
