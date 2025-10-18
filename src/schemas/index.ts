/**
 * KERI/ACDC Schema Module
 *
 * Provides battle-tested schema management for KERI credentials:
 * - JSON Schema 2020-12 support (via AJV)
 * - SAID-based schema identifiers (RFC 8785 JCS canonicalization)
 * - ACDC schema wrappers for verifiable credentials
 * - Schema validation and verification
 *
 * @example
 * ```ts
 * import { saidifySchema, validateAgainstSchema, wrapInAcdc } from './schemas';
 *
 * // Create a schema
 * const schema = {
 *   $schema: 'https://json-schema.org/draft/2020-12/schema',
 *   title: 'Person',
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   },
 *   required: ['name']
 * };
 *
 * // Add SAID
 * const keriSchema = saidifySchema(schema);
 * console.log(keriSchema.$id); // "EBdXt3gIXOf2BBWNHdSXCJnFJL5OuQPyM5K0neuniccM"
 *
 * // Validate data
 * const result = validateAgainstSchema(keriSchema, { name: 'Alice', age: 30 });
 * console.log(result.valid); // true
 *
 * // Wrap in ACDC
 * const acdcSchema = wrapInAcdc(keriSchema, { issuerAid: 'EABc...' });
 * ```
 */

// Types
export type {
  KeriSchema,
  AcdcSchema,
  SchemaValidationResult,
  SchemaMetadata,
} from './types';

// SAID operations
export { deriveSchemaSaid, saidifySchema, verifySchemaSaid } from './said';

// Validation
export {
  createSchemaValidator,
  validateAgainstSchema,
  validateBatch,
  addSchemaToValidator,
} from './validator';

// ACDC utilities
export {
  wrapInAcdc,
  unwrapAcdc,
  verifyAcdcSchema,
  createCredentialSchema,
} from './acdc';
