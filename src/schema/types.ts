import { type Static, Type } from '@sinclair/typebox';
import type { SAID } from '../common/types.js';
import { CesrDigestSchema, TimestampSchema } from '../common/types.js';

// ── ACDC Version ────────────────────────────────────────────────────
// Keripy format: {proto}{major:x}{minor:x}{kind}{size:06x}_
// Hex digits for major/minor/size.
export const ACDCVersionPattern = '^ACDC[0-9a-f]{2}[A-Z]{4}[0-9a-f]{6}_$';
export const ACDCVersionSchema = Type.String({
  title: 'ACDC Version',
  pattern: ACDCVersionPattern,
});

// ── JSON Schema (validation helper) ─────────────────────────────────
export const JSONSchemaSchema = Type.Object(
  {
    $schema: Type.String(),
    $id: Type.Optional(Type.String()),
    title: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    type: Type.String(),
    properties: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    required: Type.Optional(Type.Array(Type.String())),
    additionalProperties: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: true },
);
export type JSONSchema = Static<typeof JSONSchemaSchema>;

// ── Schema Edge (utility type for flattenSchemaFields) ──────────────
export const SchemaEdgeSchema = Type.Object(
  {
    name: Type.String(),
    type: Type.Literal('ref'),
    target: CesrDigestSchema,
    path: Type.Optional(Type.String()),
    meaning: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
export type SchemaEdge = Static<typeof SchemaEdgeSchema>;

// ── ACDC Schema Envelope ────────────────────────────────────────────
// Keripy canonical order: ['v', 't', 'd', 's']
// s holds the JSON Schema content directly (not a SAID reference).
export const ACDCSchemaSchema = Type.Object(
  {
    v: ACDCVersionSchema,
    t: Type.Literal('sch'),
    d: CesrDigestSchema,
    s: Type.Record(Type.String(), Type.Unknown()),
  },
  { additionalProperties: false },
);
export type ACDCSchema = Static<typeof ACDCSchemaSchema>;

// ── Schema Info ─────────────────────────────────────────────────────
export const SchemaInfoSchema = Type.Object(
  {
    said: CesrDigestSchema,
    title: Type.Optional(Type.String()),
    createdAt: Type.Optional(TimestampSchema),
  },
  { additionalProperties: false },
);
export type SchemaInfo = Static<typeof SchemaInfoSchema>;

// ── Validation types (prefixed to avoid KEL collision) ──────────────
export type SchemaValidationError = {
  path: string;
  message: string;
  keyword: string;
};

export type SchemaValidationResult = {
  valid: boolean;
  errors?: SchemaValidationError[];
};

// ── FlatField (union type per spec) ─────────────────────────────────
export type FlatField = { path: string; type: string } | { path: string; type: 'ref'; target: SAID };
