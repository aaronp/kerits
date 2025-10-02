import { saidify } from './saidify';

/**
 * JSON Schema with KERI SAID support
 *
 * A schema is a JSON Schema document with a self-addressing identifier ($id field).
 * The $id is computed as the SAID of the schema content.
 */

export interface SchemaDefinition {
  $id?: string;
  $schema: string;
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

export interface Schema {
  sed: SchemaDefinition;  // Schema Event Dict (JSON Schema + $id)
  raw: string;            // Serialized JSON
  said: string;           // Self-addressing identifier
}

/**
 * Create a KERI schema with self-addressing identifier
 *
 * Pure function that takes a JSON Schema definition and computes its SAID.
 * The $id field is set to the SAID of the schema content.
 *
 * @param sed - Schema definition (JSON Schema structure)
 * @returns Schema with computed SAID
 */
export function schema(sed: SchemaDefinition): Schema {
  // Validate required fields
  if (!sed.$schema) {
    throw new Error('Schema must have $schema field');
  }

  if (!sed.type) {
    throw new Error('Schema must have type field');
  }

  // Ensure $id field exists (will be replaced with SAID)
  if (!sed.$id) {
    sed.$id = '';
  }

  // Compute SAID for schema
  const saidified = saidify(sed, { label: '$id' });

  // Return schema with SAID
  return {
    sed: saidified as SchemaDefinition,
    raw: JSON.stringify(saidified),
    said: saidified.$id as string,
  };
}

/**
 * Parse a raw schema string and extract the SAID
 *
 * @param raw - Serialized JSON schema
 * @returns Parsed schema with SAID
 */
export function parseSchema(raw: string): Schema {
  const sed = JSON.parse(raw) as SchemaDefinition;

  if (!sed.$id) {
    throw new Error('Schema must have $id field');
  }

  // Verify the SAID matches
  const tempSed = { ...sed };
  const placeholder = '#'.repeat(44);
  tempSed.$id = placeholder;

  const saidified = saidify(tempSed, { label: '$id' });

  if (saidified.$id !== sed.$id) {
    throw new Error(`Schema SAID mismatch: expected ${saidified.$id}, got ${sed.$id}`);
  }

  return {
    sed,
    raw,
    said: sed.$id,
  };
}

/**
 * Create a simple object schema helper
 *
 * Convenience function to create a basic object schema with properties.
 *
 * @param properties - Object property definitions
 * @param options - Optional schema options
 * @returns Schema with computed SAID
 */
export function objectSchema(
  properties: Record<string, any>,
  options?: {
    required?: string[];
    additionalProperties?: boolean;
    title?: string;
    description?: string;
  }
): Schema {
  const sed: SchemaDefinition = {
    $id: '',
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties,
  };

  if (options?.required) {
    sed.required = options.required;
  }

  if (options?.additionalProperties !== undefined) {
    sed.additionalProperties = options.additionalProperties;
  }

  if (options?.title) {
    sed.title = options.title;
  }

  if (options?.description) {
    sed.description = options.description;
  }

  return schema(sed);
}
