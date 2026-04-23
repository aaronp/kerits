/**
 * Data operations - SAID generation, canonicalization
 *
 * Pure functions for self-addressing identifier (SAID) generation
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { encodeBase64Url } from './base64url.js';
import { canonical } from './canonical.js';

/**
 * SAID placeholder for pre-hashing.
 * Must be exactly 44 characters to match final SAID length ('E' + 43 base64url chars).
 */
export const SAID_PLACEHOLDER = '#'.repeat(44);

/**
 * Data class for SAID generation and canonicalization
 */
export class Data {
  private data: any;

  private constructor(data: any) {
    this.data = data;
  }

  /**
   * Compute version string with correct size field.
   *
   * @deprecated Use {@link deriveSaid} from `common/derivation-surface.ts` instead.
   * This legacy path uses RFC-8785 (sorted keys) and **decimal** size encoding,
   * which does NOT match KERIpy. The new `deriveSaid` path uses insertion-order
   * serialization and hex size encoding for keripy compatibility.
   *
   * @param eventWithoutVersion - The event/envelope object without version field
   * @param kind - Encoding kind (default: 'JSON')
   * @param protocol - Protocol prefix (default: 'KERI', can be 'ACDC' for credentials)
   * @param saidFieldName - Field name for SAID placeholder (default: 'd').
   */
  static computeVersionString(
    eventWithoutVersion: any,
    kind: string = 'JSON',
    protocol: string = 'KERI',
    saidFieldName: string = 'd',
  ): string {
    let version = `${protocol}10${kind}000000_`;
    let previousSize = 0;

    // Iterate until size converges (usually 1-2 iterations)
    for (let iteration = 0; iteration < 10; iteration++) {
      const eventWithVersion = { ...eventWithoutVersion, v: version };

      // If the event has a SAID field, use placeholder for size computation
      if (saidFieldName in eventWithVersion) {
        eventWithVersion[saidFieldName] = SAID_PLACEHOLDER;
      }

      const { raw } = Data.fromJson(eventWithVersion).canonicalize();
      const size = raw.length; // Byte length, not character count

      if (size === previousSize) {
        return version; // Converged!
      }

      previousSize = size;
      const sizeDecimal = size.toString(10).padStart(6, '0');
      version = `${protocol}10${kind}${sizeDecimal}_`;
    }

    throw new Error('Version string calculation did not converge');
  }
  /**
   * Create Data from JSON object
   */
  static fromJson(obj: any): Data {
    return new Data(structuredClone(obj));
  }

  /**
   * Get the underlying JSON data
   */
  toJson(): any {
    return structuredClone(this.data);
  }

  /**
   * Generate SAID and add it to the data.
   *
   * @deprecated Use {@link deriveSaid} from `common/derivation-surface.ts` instead.
   * This legacy path uses RFC-8785 canonicalization (sorted keys), which does NOT
   * match KERIpy's insertion-order serialization. SAIDs produced by this method
   * will differ from those produced by KERIpy for the same input.
   *
   * @param fieldName - Field name for SAID (default: 'd')
   * @returns Object with SAID and updated data
   */
  saidify(fieldName: string = 'd'): { said: string; data: any } {
    // Clone data and add placeholder
    const dataWithPlaceholder = structuredClone(this.data);
    dataWithPlaceholder[fieldName] = SAID_PLACEHOLDER;

    // Canonicalize and hash
    const canonicalText = canonical(dataWithPlaceholder);
    const canonicalBytes = new TextEncoder().encode(canonicalText);
    const hash = blake3(canonicalBytes, { dkLen: 32 });

    // Encode as CESR Blake3-256 (code 'E')
    const said = encodeCESRDigest(hash, 'E');

    // Replace placeholder with actual SAID
    const finalData = structuredClone(this.data);
    finalData[fieldName] = said;

    return { said, data: finalData };
  }

  /**
   * Canonicalize data to deterministic bytes and text representation
   *
   * Unlike saidify(), this does NOT inject a SAID field - it's for snapshots and testing
   *
   * @returns Object with canonical bytes and text representation
   */
  canonicalize(): { raw: Uint8Array; text: string } {
    const text = canonical(this.data);
    const raw = new TextEncoder().encode(text);
    return { raw, text };
  }

  /**
   * Compute Blake3 digest of canonical bytes
   *
   * @param raw - Canonical bytes to hash
   * @returns CESR-encoded digest (Blake3-256 with 'E' prefix)
   */
  static digest(raw: Uint8Array): string {
    const hash = blake3(raw, { dkLen: 32 });
    return encodeCESRDigest(hash, 'E');
  }

  /**
   * Compute blake3 digest of canonical JSON representation
   *
   * Convenience for: Data.digest(Data.fromJson(obj).canonicalize().raw)
   *
   * @param obj - JSON object to digest
   * @returns CESR-encoded digest (Blake3-256 with 'E' prefix)
   */
  static digestFor(obj: any): string {
    const { raw } = Data.fromJson(obj).canonicalize();
    return Data.digest(raw);
  }
}

/**
 * Encode digest as CESR (simplified qb64-like encoding)
 *
 * Note: This is a simplified encoding for internal use. For strict KERI/CESR
 * interoperability, use the full CESR derivation code system.
 */
function encodeCESRDigest(digest: Uint8Array, code: string): string {
  const b64 = encodeBase64Url(digest);
  return code + b64;
}

/**
 * Convenience function: Generate SAID for an object without Data wrapper.
 *
 * @deprecated Use {@link deriveSaid} from `common/derivation-surface.ts` instead.
 * See `Data.saidify` deprecation notice for details.
 *
 * @param obj - Object to generate SAID for
 * @param fieldName - Field name for SAID (default: 'd')
 * @returns SAID string
 */
export function saidOf(obj: any, fieldName: string = 'd'): string {
  const data = Data.fromJson(obj);
  const { said } = data.saidify(fieldName);
  return said;
}

/**
 * Infer a TypeBox schema from a JSON value
 *
 * This creates a structural TypeBox schema that matches the shape of the input.
 * The schema can be used for validation and its SAID can be used as a message type.
 *
 * @param value - JSON value to infer schema from
 * @returns TypeBox schema object
 *
 * @example
 * ```typescript
 * const schema = await inferSchema({ name: 'Alice', age: 30 });
 * // Returns: Type.Object({ name: Type.String(), age: Type.Number() })
 * ```
 */
export async function inferSchema(value: any): Promise<any> {
  // Import TypeBox dynamically to avoid circular dependencies
  const { Type } = await import('@sinclair/typebox');

  function infer(v: any): any {
    if (v === null) {
      return Type.Null();
    }

    if (Array.isArray(v)) {
      if (v.length === 0) {
        return Type.Array(Type.Unknown());
      }
      return Type.Array(infer(v[0]));
    }

    switch (typeof v) {
      case 'string':
        return Type.String();
      case 'number':
        return Type.Number();
      case 'boolean':
        return Type.Boolean();
      case 'object': {
        const properties: Record<string, any> = {};
        for (const [key, val] of Object.entries(v)) {
          properties[key] = infer(val);
        }
        return Type.Object(properties);
      }
      default:
        return Type.Unknown();
    }
  }

  return infer(value);
}

/**
 * Generate a SAID for a TypeBox schema
 *
 * The schema SAID can be used as a content-addressable message type identifier.
 * Messages with type 'SAID:<said>' indicate their payload conforms to the schema
 * with that SAID.
 *
 * @param schema - TypeBox schema object
 * @returns SAID string
 *
 * @example
 * ```typescript
 * const schema = Type.Object({
 *   name: Type.String(),
 *   age: Type.Number()
 * });
 * const schemaSaid = schemaSaidOf(schema);
 * // Use as message type: `SAID:${schemaSaid}`
 * ```
 */
export function schemaSaidOf(schema: any): string {
  // Canonicalize the schema (TypeBox schemas are just JSON)
  const canonicalText = canonical(schema);
  const canonicalBytes = new TextEncoder().encode(canonicalText);
  const hash = blake3(canonicalBytes, { dkLen: 32 });

  // Encode as CESR Blake3-256 (code 'E')
  return encodeCESRDigest(hash, 'E');
}

/**
 * Create a SAID-based message type from a JSON example
 *
 * This is a convenience function that:
 * 1. Infers a schema from the example JSON
 * 2. Generates a SAID for that schema
 * 3. Returns the message type string 'SAID:<said>'
 *
 * @param example - Example JSON object
 * @returns Message type string 'SAID:<said>'
 *
 * @example
 * ```typescript
 * const msgType = await createSaidMessageType({ name: 'Alice', age: 30 });
 * // Returns: 'SAID:E...' (where E... is the schema SAID)
 *
 * // Use with messaging DSL:
 * await messaging.send({
 *   contactAidOrAlias: 'bob',
 *   type: msgType,
 *   payload: { name: 'Bob', age: 25 }
 * });
 * ```
 */
export async function createSaidMessageType(example: any): Promise<string> {
  const schema = await inferSchema(example);
  const schemaSaid = schemaSaidOf(schema);
  return `SAID:${schemaSaid}`;
}
