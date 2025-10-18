/**
 * ACDC Schema utilities
 *
 * Create and work with ACDC-wrapped schemas for verifiable credentials.
 *
 * @see https://trustoverip.github.io/tswg-acdc-specification/
 */

import type { KeriSchema, AcdcSchema } from './types';
import { saidifySchema } from './said';

/**
 * Wrap a JSON Schema in ACDC format
 *
 * @param jsonSchema - The JSON Schema to wrap (will be saidified if no $id)
 * @param options - ACDC metadata
 * @returns ACDC schema wrapper
 */
export function wrapInAcdc(
  jsonSchema: KeriSchema,
  options: {
    issuerAid: string;
    schemaType?: string;
    version?: string;
  }
): AcdcSchema {
  const { issuerAid, schemaType = 'ESchemaDefTypeAAAAAAAAAAAAAAAAAA', version = 'ACDC10JSON00011c_' } = options;

  // Ensure schema has SAID
  const schema = jsonSchema.$id ? jsonSchema : saidifySchema(jsonSchema);

  return {
    v: version,
    d: schema.$id,
    i: issuerAid,
    s: schemaType,
    a: schema,
  };
}

/**
 * Extract the JSON Schema from an ACDC wrapper
 */
export function unwrapAcdc(acdcSchema: AcdcSchema): KeriSchema {
  return acdcSchema.a;
}

/**
 * Verify ACDC schema consistency
 *
 * Checks that:
 * - Inner schema's $id matches outer 'd' field
 * - Schema is properly structured
 */
export function verifyAcdcSchema(acdcSchema: AcdcSchema): boolean {
  if (!acdcSchema.a || !acdcSchema.a.$id) {
    return false;
  }

  // Inner schema SAID must match outer 'd' field
  if (acdcSchema.d !== acdcSchema.a.$id) {
    return false;
  }

  return true;
}

/**
 * Create a credential schema for common vLEI-style credentials
 *
 * Helper for creating schemas that follow vLEI patterns.
 */
export function createCredentialSchema(options: {
  title: string;
  description: string;
  properties: Record<string, any>;
  required?: string[];
  issuerAid: string;
}): AcdcSchema {
  const { title, description, properties, required = [], issuerAid } = options;

  // Build JSON Schema
  const jsonSchema: Omit<KeriSchema, '$id'> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    description,
    type: 'object',
    properties: {
      // Standard ACDC fields
      v: {
        type: 'string',
        description: 'ACDC version string',
      },
      d: {
        type: 'string',
        pattern: '^E[A-Za-z0-9_-]{43}$',
        description: 'Credential SAID',
      },
      i: {
        type: 'string',
        pattern: '^[A-Z][A-Za-z0-9_-]{43}$',
        description: 'Issuer AID',
      },
      s: {
        type: 'string',
        description: 'Schema SAID',
      },
      a: {
        type: 'object',
        description: 'Credential attributes',
        properties,
        required,
      },
    },
    required: ['v', 'd', 'i', 's', 'a'],
  };

  // Saidify and wrap
  const schema = saidifySchema(jsonSchema as KeriSchema);
  return wrapInAcdc(schema, { issuerAid });
}
