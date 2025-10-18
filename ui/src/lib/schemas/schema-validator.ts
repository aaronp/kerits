/**
 * Schema Validator - Validate ACDC payloads against KERI schemas
 *
 * Validates JSON data against JSON Schema with KERI-specific extensions.
 */

interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate an ACDC payload against a schema
 */
export function validateAcdcPayload(payload: any, schema: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Extract JSON Schema from ACDC schema wrapper
  const jsonSchema = schema.a || schema;

  // Validate the payload's 'a' field (attributes)
  const data = payload.a || payload;

  validateValue(data, jsonSchema, '', errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a value against a schema property
 */
function validateValue(
  value: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  // Type validation
  if (schema.type) {
    if (!validateType(value, schema.type)) {
      errors.push({
        path,
        message: `Expected type ${schema.type}, got ${getType(value)}`,
        value,
      });
      return; // Stop validation if type is wrong
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      path,
      message: `Value must be one of: ${schema.enum.join(', ')}`,
      value,
    });
  }

  // Format validation
  if (schema.format && typeof value === 'string') {
    if (!validateFormat(value, schema.format)) {
      errors.push({
        path,
        message: `Invalid ${schema.format} format`,
        value,
      });
    }
  }

  // Pattern validation
  if (schema.pattern && typeof value === 'string') {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      errors.push({
        path,
        message: `Value does not match pattern: ${schema.pattern}`,
        value,
      });
    }
  }

  // Number constraints
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Value must be >= ${schema.minimum}`,
        value,
      });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Value must be <= ${schema.maximum}`,
        value,
      });
    }
  }

  // String constraints
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String must be at least ${schema.minLength} characters`,
        value,
      });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${schema.maxLength} characters`,
        value,
      });
    }
  }

  // Object validation
  if (schema.type === 'object' && typeof value === 'object' && value !== null) {
    validateObject(value, schema, path, errors);
  }

  // Array validation
  if (schema.type === 'array' && Array.isArray(value)) {
    validateArray(value, schema, path, errors);
  }
}

/**
 * Validate an object against a schema
 */
function validateObject(
  obj: any,
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  // Required properties
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in obj) || obj[key] === undefined) {
        errors.push({
          path: path ? `${path}.${key}` : key,
          message: 'Required property is missing',
        });
      }
    }
  }

  // Validate each property
  if (schema.properties) {
    for (const [key, value] of Object.entries(obj)) {
      const propSchema = schema.properties[key];
      if (propSchema) {
        const propPath = path ? `${path}.${key}` : key;
        validateValue(value, propSchema, propPath, errors);
      } else if (schema.additionalProperties === false) {
        errors.push({
          path: path ? `${path}.${key}` : key,
          message: 'Additional property not allowed',
          value,
        });
      }
    }
  }
}

/**
 * Validate an array against a schema
 */
function validateArray(
  arr: any[],
  schema: any,
  path: string,
  errors: ValidationError[]
): void {
  // Array length constraints
  if (schema.minItems !== undefined && arr.length < schema.minItems) {
    errors.push({
      path,
      message: `Array must have at least ${schema.minItems} items`,
      value: arr,
    });
  }

  if (schema.maxItems !== undefined && arr.length > schema.maxItems) {
    errors.push({
      path,
      message: `Array must have at most ${schema.maxItems} items`,
      value: arr,
    });
  }

  // Validate each item
  if (schema.items) {
    arr.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      validateValue(item, schema.items, itemPath, errors);
    });
  }

  // Unique items
  if (schema.uniqueItems) {
    const seen = new Set();
    arr.forEach((item, index) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        errors.push({
          path: `${path}[${index}]`,
          message: 'Array items must be unique',
          value: item,
        });
      }
      seen.add(key);
    });
  }
}

/**
 * Validate that a value matches the expected type
 */
function validateType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

/**
 * Get the type name of a value
 */
function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  return typeof value;
}

/**
 * Validate string formats
 */
function validateFormat(value: string, format: string): boolean {
  switch (format) {
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));

    case 'date-time':
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value) &&
        !isNaN(Date.parse(value));

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    case 'uri':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }

    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    case 'ipv4':
      const ipv4Parts = value.split('.');
      if (ipv4Parts.length !== 4) return false;
      return ipv4Parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });

    case 'ipv6':
      // Simplified IPv6 validation
      return /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i.test(value) ||
        /^::/.test(value) ||
        /::$/.test(value);

    default:
      // Unknown format - assume valid
      return true;
  }
}

/**
 * Validate that an ACDC schema itself is well-formed
 */
export function validateSchema(schema: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check ACDC wrapper
  if (schema.v && !schema.v.startsWith('ACDC')) {
    errors.push({
      path: 'v',
      message: 'Invalid ACDC version string',
      value: schema.v,
    });
  }

  if (schema.d && typeof schema.d !== 'string') {
    errors.push({
      path: 'd',
      message: 'Schema SAID must be a string',
      value: schema.d,
    });
  }

  if (schema.i && typeof schema.i !== 'string') {
    errors.push({
      path: 'i',
      message: 'Issuer AID must be a string',
      value: schema.i,
    });
  }

  // Check JSON Schema
  const jsonSchema = schema.a || schema;

  if (!jsonSchema.$schema) {
    errors.push({
      path: '$schema',
      message: 'Missing $schema property',
    });
  }

  if (!jsonSchema.type) {
    errors.push({
      path: 'type',
      message: 'Missing type property',
    });
  }

  if (jsonSchema.type === 'object' && !jsonSchema.properties) {
    errors.push({
      path: 'properties',
      message: 'Object type must have properties',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get a human-readable validation error message
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return 'Validation passed';
  }

  return result.errors
    .map((err) => `${err.path}: ${err.message}`)
    .join('\n');
}
