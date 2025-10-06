/**
 * SchemaDSL - Schema operations
 */

import type { SchemaDSL, Schema } from '../types';

/**
 * Create a SchemaDSL for a specific schema
 */
export function createSchemaDSL(schema: Schema): SchemaDSL {
  return {
    schema,

    validate(data: any): boolean {
      // Basic validation - check required fields
      if (schema.schema.required) {
        for (const field of schema.schema.required) {
          if (!(field in data)) {
            return false;
          }
        }
      }

      // Check property types (basic)
      for (const [key, value] of Object.entries(data)) {
        if (key in schema.schema.properties) {
          const propDef = schema.schema.properties[key];
          const expectedType = propDef.type;

          if (expectedType === 'string' && typeof value !== 'string') {
            return false;
          }
          if (expectedType === 'number' && typeof value !== 'number') {
            return false;
          }
          if (expectedType === 'boolean' && typeof value !== 'boolean') {
            return false;
          }
        }
      }

      return true;
    },

    getSchema(): any {
      return schema.schema;
    },
  };
}
