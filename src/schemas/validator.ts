/**
 * Schema validation using AJV
 *
 * Validates data against KERI/ACDC schemas using industry-standard AJV validator.
 */

import Ajv from 'ajv';
import type { JSONSchema7 } from 'json-schema';
import type { KeriSchema, SchemaValidationResult } from './types';
import { verifySchemaSaid } from './said';

/**
 * Create an AJV validator instance configured for KERI schemas
 */
export function createSchemaValidator() {
  return new Ajv({
    strict: false, // Allow unknown keywords (more flexible for 2020-12 features)
    allErrors: true,
    verbose: true,
    validateSchema: false, // Don't validate schema against meta-schema (we verify SAID instead)
  });
}

/**
 * Validate data against a KERI schema
 *
 * @param schema - The KERI schema to validate against
 * @param data - The data to validate
 * @param options - Validation options
 * @returns Validation result with errors if any
 */
export function validateAgainstSchema(
  schema: KeriSchema | JSONSchema7,
  data: any,
  options: {
    verifySaid?: boolean; // Verify schema's SAID before validating
    ajv?: Ajv; // Provide custom AJV instance
  } = {}
): SchemaValidationResult {
  const { verifySaid: checkSaid = true, ajv = createSchemaValidator() } = options;

  // Verify schema's SAID if requested
  if (checkSaid && '$id' in schema && schema.$id) {
    if (!verifySchemaSaid(schema)) {
      return {
        valid: false,
        errors: [
          {
            path: '$id',
            message: 'Schema $id does not match computed SAID',
            keyword: 'said-verification',
          },
        ],
      };
    }
  }

  // Validate using AJV
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map((err) => ({
        path: err.instancePath || err.schemaPath || '',
        message: err.message || 'Validation error',
        keyword: err.keyword,
      })),
    };
  }

  return { valid: true };
}

/**
 * Add a schema to the AJV instance for $ref resolution
 *
 * Useful when you have multiple schemas that reference each other.
 */
export function addSchemaToValidator(ajv: Ajv, schema: KeriSchema): void {
  if (schema.$id) {
    ajv.addSchema(schema, schema.$id);
  } else {
    throw new Error('Schema must have a $id to be added to validator');
  }
}

/**
 * Validate multiple data items against a schema
 */
export function validateBatch(
  schema: KeriSchema,
  data: any[],
  options?: { verifySaid?: boolean; ajv?: Ajv }
): SchemaValidationResult[] {
  const ajv = options?.ajv || createSchemaValidator();
  return data.map((item) => validateAgainstSchema(schema, item, { ...options, ajv }));
}
