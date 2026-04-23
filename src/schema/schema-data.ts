import { deriveSaid } from '../common/derivation-surface.js';
import { ACDC_SCHEMA_SURFACE } from '../said/surfaces.js';
import type { ACDCSchema, JSONSchema } from './types.js';

const PERMITTED_SCHEMA_FIELDS = new Set(['v', 't', 'd', 's']);

type SchemaParseResult = { ok: true; schema: ACDCSchema } | { ok: false; reason: string };

function create(jsonSchema: JSONSchema): ACDCSchema {
  const cleanJsonSchema = { ...jsonSchema };
  delete cleanJsonSchema.$id;

  const envelope = {
    v: '',
    t: 'sch' as const,
    d: '',
    s: cleanJsonSchema,
  };

  const { sealed, said } = deriveSaid(envelope, ACDC_SCHEMA_SURFACE);

  return {
    ...sealed,
    s: { ...cleanJsonSchema, $id: `did:keri:${said}` },
  } as ACDCSchema;
}

function extractJsonSchema(schema: ACDCSchema): JSONSchema {
  return schema.s as JSONSchema;
}

function parse(data: unknown): SchemaParseResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'schema must be a non-null, non-array object' };
  }

  const obj = data as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!PERMITTED_SCHEMA_FIELDS.has(key)) {
      return { ok: false, reason: `schema has unknown top-level field: '${key}'` };
    }
  }

  if (typeof obj.v !== 'string') {
    return { ok: false, reason: 'schema missing or invalid required field: v (expected string)' };
  }
  if (obj.t !== 'sch') {
    return { ok: false, reason: `schema type field must be 'sch', got '${String(obj.t)}'` };
  }
  if (typeof obj.d !== 'string') {
    return { ok: false, reason: 'schema missing or invalid required field: d (expected string)' };
  }
  if (!obj.s || typeof obj.s !== 'object' || Array.isArray(obj.s)) {
    return { ok: false, reason: 'schema missing or invalid required field: s (expected non-null object)' };
  }

  const schema: ACDCSchema = {
    v: obj.v,
    t: 'sch',
    d: obj.d as string,
    s: obj.s as Record<string, unknown>,
  };

  return { ok: true, schema };
}

function isValid(obj: unknown): obj is ACDCSchema {
  return parse(obj).ok;
}

export type { SchemaParseResult };

export const SchemaData = {
  create,
  extractJsonSchema,
  parse,
  isValid,
} as const;
