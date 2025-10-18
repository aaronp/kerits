/**
 * Schema types for KERI/ACDC
 *
 * Uses standard JSON Schema Draft 2020-12 types from @types/json-schema
 * Extended with KERI-specific requirements (SAID-based $id)
 */

import type { JSONSchema7 } from 'json-schema';

/**
 * KERI Schema - JSON Schema 2020-12 with SAID $id
 *
 * Key differences from regular JSON Schema:
 * - $id MUST be the SAID of the schema document (not a URL)
 * - Communities (vLEI, etc.) use this convention for verifiable schemas
 */
export interface KeriSchema extends Omit<JSONSchema7, '$id' | '$schema'> {
  /**
   * Schema identifier - MUST be the SAID of this schema document
   *
   * Format: Base64URL-encoded Blake3-256 hash with CESR prefix 'E'
   * Example: "EBdXt3gIXOf2BBWNHdSXCJnFJL5OuQPyM5K0neuniccM"
   */
  $id: string;

  /**
   * JSON Schema version - typically "https://json-schema.org/draft/2020-12/schema"
   */
  $schema?: string;

  /**
   * Top-level definitions (for reusable components)
   */
  $defs?: {
    [key: string]: JSONSchema7;
  };
}

/**
 * ACDC Schema Wrapper
 *
 * Wraps a JSON Schema in ACDC format for credential schemas.
 * The inner schema (in field 'a') is a standard KeriSchema.
 *
 * @see https://trustoverip.github.io/tswg-acdc-specification/
 */
export interface AcdcSchema {
  /**
   * Version string (ACDC format)
   */
  v: string;

  /**
   * Schema SAID (same as inner schema's $id)
   */
  d: string;

  /**
   * Issuer AID (who created/published this schema)
   */
  i: string;

  /**
   * Schema type identifier
   */
  s?: string;

  /**
   * The actual JSON Schema
   */
  a: KeriSchema;
}

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors?: Array<{
    path: string;
    message: string;
    keyword?: string;
  }>;
}

/**
 * Schema metadata for storage and discovery
 */
export interface SchemaMetadata {
  /**
   * Schema SAID (used as primary key)
   */
  said: string;

  /**
   * Human-readable name/alias
   */
  alias?: string;

  /**
   * Schema title (from JSON Schema)
   */
  title?: string;

  /**
   * Schema description
   */
  description?: string;

  /**
   * Issuer AID (who published this schema)
   */
  issuer?: string;

  /**
   * Schema type/category
   */
  type?: string;

  /**
   * Creation timestamp
   */
  createdAt?: number;

  /**
   * Tags for categorization
   */
  tags?: string[];
}
