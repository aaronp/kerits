import { recomputeSaid } from '../common/derivation-surface.js';
import type { SAID } from '../common/types.js';
import { ACDC_SCHEMA_SURFACE } from '../said/surfaces.js';
import { SchemaData } from './schema-data.js';
import type { ACDCSchema, FlatField, JSONSchema, SchemaValidationError, SchemaValidationResult } from './types.js';

type SchemaVerifyResult = { ok: true; schema: ACDCSchema } | { ok: false; reason: string };

function said(schema: ACDCSchema): SAID {
  return schema.d as SAID;
}

function verifySaid(schema: ACDCSchema): boolean {
  return validateSaid(schema).valid;
}

/**
 * Validate the SAID of an ACDC schema envelope.
 *
 * SAID is derived from the envelope body (v, t, d, s) with $id stripped
 * from s, matching the behavior of `SchemaData.create`.
 */
function validateSaid(schema: ACDCSchema): {
  valid: boolean;
  expected: string;
  actual: string;
} {
  const cleanS = { ...schema.s };
  delete cleanS.$id;

  const envelope = {
    v: schema.v,
    t: schema.t,
    d: schema.d,
    s: cleanS,
  };

  const result = recomputeSaid(envelope, ACDC_SCHEMA_SURFACE);

  return {
    valid: result.matches,
    expected: result.recomputed,
    actual: schema.d,
  };
}

function parseAndVerifySaid(data: unknown): SchemaVerifyResult {
  const parseResult = SchemaData.parse(data);
  if (!parseResult.ok) return parseResult;

  const validation = validateSaid(parseResult.schema);
  if (!validation.valid) {
    return {
      ok: false,
      reason: `schema SAID mismatch: claimed ${validation.actual}, computed ${validation.expected}`,
    };
  }

  return { ok: true, schema: parseResult.schema };
}

function validate(schema: ACDCSchema, data: unknown): SchemaValidationResult {
  const jsonSchema = schema.s as JSONSchema;
  const errors = validateJsonSchema(jsonSchema, data, '');
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function validateJsonSchema(schema: JSONSchema, data: unknown, path: string): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push({ path: path || '/', message: 'Expected object', keyword: 'type' });
      return errors;
    }

    const obj = data as Record<string, unknown>;

    for (const field of schema.required ?? []) {
      if (!(field in obj)) {
        errors.push({
          path: `${path}/${field}`,
          message: `Missing required field: ${field}`,
          keyword: 'required',
        });
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj && propSchema && typeof propSchema === 'object') {
          errors.push(...validateJsonSchema(propSchema as JSONSchema, obj[key], `${path}/${key}`));
        }
      }
    }
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      errors.push({ path: path || '/', message: 'Expected string', keyword: 'type' });
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      errors.push({ path: path || '/', message: 'Expected number', keyword: 'type' });
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      errors.push({ path: path || '/', message: 'Expected boolean', keyword: 'type' });
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      errors.push({ path: path || '/', message: 'Expected array', keyword: 'type' });
    }
  }

  return errors;
}

/**
 * Flatten schema properties into path/type pairs (sync-only).
 *
 * Traverses: nested objects (dot-paths), arrays (bracket-paths), local $defs via $ref.
 * Does NOT: resolve external schemaSaid references (returned as { type: 'ref', target }),
 *           expand combinators (oneOf/anyOf/allOf — treated as opaque).
 * Starts from s.properties (excludes ACDC envelope fields).
 */
function flattenSchemaFields(schema: ACDCSchema): FlatField[] {
  const jsonSchema = schema.s as JSONSchema;
  if (!jsonSchema.properties) return [];

  // Extract $defs for local $ref resolution
  const defs = (jsonSchema as Record<string, unknown>).$defs as Record<string, unknown> | undefined;

  const fields: FlatField[] = [];
  for (const [key, propSchema] of Object.entries(jsonSchema.properties)) {
    if (!propSchema || typeof propSchema !== 'object') continue;
    flattenProperty(propSchema as Record<string, unknown>, `/${key}`, fields, defs);
  }
  return fields;
}

function flattenProperty(
  prop: Record<string, unknown>,
  path: string,
  fields: FlatField[],
  defs?: Record<string, unknown>,
): void {
  // Local $ref resolution: #/$defs/<name>
  if (typeof prop.$ref === 'string') {
    const match = prop.$ref.match(/^#\/\$defs\/(.+)$/);
    const defName = match?.[1];
    if (defName !== undefined && defs && defName in defs) {
      const resolved = defs[defName] as Record<string, unknown>;
      flattenProperty(resolved, path, fields, defs);
      return;
    }
    // Unresolvable $ref — treat as opaque leaf
    fields.push({ path, type: 'unknown' });
    return;
  }

  // External schema reference — opaque leaf
  if (prop.type === 'schemaSaid' && typeof prop.schemaSaid === 'string') {
    fields.push({ path, type: 'ref', target: prop.schemaSaid as SAID });
    return;
  }

  // Array: traverse items
  if (prop.type === 'array' && prop.items && typeof prop.items === 'object') {
    const items = prop.items as Record<string, unknown>;
    if (items.type === 'schemaSaid' && typeof items.schemaSaid === 'string') {
      fields.push({ path: `${path}/items`, type: 'ref', target: items.schemaSaid as SAID });
    } else if (items.type === 'object' && items.properties) {
      for (const [subKey, subProp] of Object.entries(items.properties as Record<string, unknown>)) {
        if (subProp && typeof subProp === 'object') {
          flattenProperty(subProp as Record<string, unknown>, `${path}/items/${subKey}`, fields, defs);
        }
      }
    } else {
      fields.push({ path: `${path}/items`, type: String(items.type ?? 'unknown') });
    }
    return;
  }

  // Nested object: recurse into properties
  if (prop.type === 'object' && prop.properties) {
    for (const [subKey, subProp] of Object.entries(prop.properties as Record<string, unknown>)) {
      if (subProp && typeof subProp === 'object') {
        flattenProperty(subProp as Record<string, unknown>, `${path}/${subKey}`, fields, defs);
      }
    }
    return;
  }

  // Leaf property
  fields.push({ path, type: String(prop.type ?? 'unknown') });
}

export type { SchemaVerifyResult };

export const SchemaOps = {
  said,
  verifySaid,
  validateSaid,
  parseAndVerifySaid,
  validate,
  flattenSchemaFields,
} as const;
