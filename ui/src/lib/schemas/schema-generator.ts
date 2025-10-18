/**
 * Schema Generator - Generate KERI schemas from JSON objects
 *
 * Automatically infers types, formats, and structure from example data.
 */

interface JsonSchemaProperty {
  type: string;
  format?: string;
  enum?: any[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  pattern?: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

interface JsonSchema {
  $id?: string;
  $schema: string;
  title: string;
  description?: string;
  type: string;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

export interface SchemaGeneratorOptions {
  title: string;
  description?: string;
  $id?: string;
  markAllRequired?: boolean;
  inferEnums?: boolean;
  inferFormats?: boolean;
}

/**
 * Generate a JSON Schema from an example JSON object
 */
export function generateSchemaFromJson(
  data: any,
  options: SchemaGeneratorOptions
): JsonSchema {
  const {
    title,
    description,
    $id,
    markAllRequired = true,
    inferEnums = true,
    inferFormats = true,
  } = options;

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Root data must be an object');
  }

  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    properties[key] = inferProperty(value, { inferEnums, inferFormats });

    if (markAllRequired && value !== undefined && value !== null) {
      required.push(key);
    }
  }

  const schema: JsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title,
    type: 'object',
    properties,
    required,
  };

  if (description) {
    schema.description = description;
  }

  if ($id) {
    schema.$id = $id;
  }

  return schema;
}

/**
 * Infer schema property from a value
 */
function inferProperty(
  value: any,
  options: { inferEnums: boolean; inferFormats: boolean }
): JsonSchemaProperty {
  // Null
  if (value === null) {
    return { type: 'null' };
  }

  // Boolean
  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }

  // Number
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
  }

  // String
  if (typeof value === 'string') {
    const prop: JsonSchemaProperty = { type: 'string' };

    // Infer formats
    if (options.inferFormats) {
      const format = inferStringFormat(value);
      if (format) {
        prop.format = format;
      }
    }

    // Add pattern for SAID-like strings
    if (/^E[A-Za-z0-9_-]{20,}$/.test(value)) {
      prop.pattern = '^E[A-Za-z0-9_-]{20,}$';
      prop.description = 'KERI SAID';
    }

    return prop;
  }

  // Array
  if (Array.isArray(value)) {
    const prop: JsonSchemaProperty = { type: 'array' };

    if (value.length > 0) {
      // Infer items type from first element
      prop.items = inferProperty(value[0], options);

      // Check if all items are the same type
      const allSameType = value.every((item) => {
        const itemType = inferProperty(item, options).type;
        return itemType === prop.items!.type;
      });

      if (!allSameType) {
        // Mixed types - use generic object
        prop.items = { type: 'object' };
      }

      // Infer enum if all items are primitive and unique
      if (options.inferEnums && value.length <= 10) {
        const uniqueValues = Array.from(new Set(value));
        const allPrimitive = uniqueValues.every(
          (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );

        if (allPrimitive && uniqueValues.length === value.length) {
          // Could be an enum, but it's an array so just note it
          // (enums are typically for single values, not arrays)
        }
      }
    } else {
      // Empty array - can't infer type
      prop.items = { type: 'string' }; // Default to string
    }

    return prop;
  }

  // Object
  if (typeof value === 'object') {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [key, val] of Object.entries(value)) {
      properties[key] = inferProperty(val, options);
      if (val !== undefined && val !== null) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  }

  // Fallback
  return { type: 'string' };
}

/**
 * Infer string format from value
 */
function inferStringFormat(value: string): string | undefined {
  // Date-time (ISO 8601 with time)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
    return 'date-time';
  }

  // Date (ISO 8601 date only)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'date';
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'email';
  }

  // URI
  if (/^https?:\/\/.+/.test(value)) {
    return 'uri';
  }

  // UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return 'uuid';
  }

  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return 'ipv4';
  }

  return undefined;
}

/**
 * Infer enum values from an array of examples
 *
 * Useful when you have multiple example objects and want to detect
 * which fields are enums based on limited unique values.
 */
export function inferEnumsFromExamples(
  examples: any[],
  maxUniqueValues: number = 10
): Record<string, any[]> {
  if (examples.length === 0) return {};

  const fieldValues: Record<string, Set<any>> = {};

  // Collect all values for each field
  function collectFieldValues(obj: any, path: string = '') {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = path ? `${path}.${key}` : key;

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        if (!fieldValues[fieldPath]) {
          fieldValues[fieldPath] = new Set();
        }
        fieldValues[fieldPath].add(value);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        collectFieldValues(value, fieldPath);
      }
    }
  }

  examples.forEach((example) => collectFieldValues(example));

  // Find fields with limited unique values (likely enums)
  const enums: Record<string, any[]> = {};
  for (const [field, values] of Object.entries(fieldValues)) {
    if (values.size > 1 && values.size <= maxUniqueValues) {
      enums[field] = Array.from(values).sort();
    }
  }

  return enums;
}

/**
 * Merge multiple schemas generated from different examples
 *
 * Useful for creating a schema that covers all variations in your data.
 */
export function mergeSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 0) {
    throw new Error('No schemas to merge');
  }

  if (schemas.length === 1) {
    return schemas[0];
  }

  const merged: JsonSchema = {
    $schema: schemas[0].$schema,
    title: schemas[0].title,
    description: schemas[0].description,
    type: 'object',
    properties: {},
    required: [],
  };

  // Collect all property keys
  const allKeys = new Set<string>();
  schemas.forEach((schema) => {
    Object.keys(schema.properties).forEach((key) => allKeys.add(key));
  });

  // Merge properties
  for (const key of allKeys) {
    const props = schemas
      .map((s) => s.properties[key])
      .filter((p) => p !== undefined);

    if (props.length === 1) {
      merged.properties[key] = props[0];
    } else {
      // Multiple definitions - try to merge
      merged.properties[key] = mergeProperties(props);
    }

    // Field is required if it's required in ALL schemas
    const requiredInAll = schemas.every((s) => s.required.includes(key));
    if (requiredInAll) {
      merged.required.push(key);
    }
  }

  return merged;
}

/**
 * Merge multiple property definitions
 */
function mergeProperties(props: JsonSchemaProperty[]): JsonSchemaProperty {
  // If all have same type, use that type
  const types = new Set(props.map((p) => p.type));

  if (types.size === 1) {
    const type = props[0].type;

    if (type === 'object') {
      // Merge nested objects
      const allPropKeys = new Set<string>();
      props.forEach((p) => {
        if (p.properties) {
          Object.keys(p.properties).forEach((k) => allPropKeys.add(k));
        }
      });

      const mergedProps: Record<string, JsonSchemaProperty> = {};
      const required: string[] = [];

      for (const key of allPropKeys) {
        const nestedProps = props
          .map((p) => p.properties?.[key])
          .filter((p) => p !== undefined) as JsonSchemaProperty[];

        if (nestedProps.length > 0) {
          mergedProps[key] = nestedProps.length === 1
            ? nestedProps[0]
            : mergeProperties(nestedProps);
        }

        const requiredInAll = props.every((p) => p.required?.includes(key));
        if (requiredInAll) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties: mergedProps,
        required,
      };
    }

    // Same primitive type - combine constraints
    return props[0];
  }

  // Different types - use first one (or could use oneOf)
  return props[0];
}

/**
 * Wrap a JSON Schema in KERI ACDC schema format
 */
export function wrapInAcdcSchema(
  jsonSchema: JsonSchema,
  options: {
    schemaId: string;
    issuerId: string;
    schemaType?: string;
  }
): any {
  const { schemaId, issuerId, schemaType = 'ESchemaDefTypeAAAAAAAAAAAAAAAAAA' } = options;

  return {
    v: 'ACDC10JSON00011c_',
    d: schemaId,
    i: issuerId,
    s: schemaType,
    a: jsonSchema,
  };
}
