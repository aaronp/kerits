/**
 * SchemaDSL - Schema operations
 */

import type { KerStore } from '../../../storage/types';
import type { SchemaDSL, Schema, SchemaExport } from '../types';
import { saidify } from '../../../saidify';

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
      // Convert internal format (d) to KERI SAD format ($id, $schema)
      const { d, ...schemaContent } = schema.schema;

      // Recompute SAID based on schema content
      // This ensures $id matches the actual schema content
      const schemaWithId = {
        $id: '', // Start with empty $id
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...schemaContent,
      };

      // Compute the SAID using $id as the label field
      const saidified = saidify(schemaWithId, { label: '$id' });
      const computedSaid = saidified.$id;

      // Use computed SAID as both $id and said
      const sed = {
        ...saidified,
      };

      return {
        alias: schema.alias,
        sed,
        said: computedSaid,
      };
    },

    async delete(): Promise<void> {
      // Delete the schema alias mapping
      await store.delAlias('schema', schema.alias, true);
      // Note: The event itself remains in storage (immutable), but is no longer accessible by alias
    },
  };
}
