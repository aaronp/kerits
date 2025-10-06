/**
 * SchemaDSL - Schema operations
 */

import type { KerStore } from '../../../storage/types';
import type { SchemaDSL, Schema, SchemaExport } from '../types';

/**
 * Create a SchemaDSL for a specific schema
 */
export function createSchemaDSL(schema: Schema, store: KerStore): SchemaDSL {
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

    export(): SchemaExport {
      // Export in KERI SAD format with alias
      const sed = {
        $id: schema.schemaId,
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: schema.schema.title,
        type: 'object' as const,
        properties: schema.schema.properties,
        ...(schema.schema.description && { description: schema.schema.description }),
        ...(schema.schema.required && { required: schema.schema.required }),
      };

      return {
        alias: schema.alias,
        sed,
        said: schema.schemaId,
      };
    },

    async delete(): Promise<void> {
      // Delete the schema alias mapping
      await store.delAlias('schema', schema.alias, true);
      // Note: The event itself remains in storage (immutable), but is no longer accessible by alias
    },
  };
}
