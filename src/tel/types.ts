import { type Static, Type } from '@sinclair/typebox';
import {
  CesrAidSchema,
  CesrDigestSchema,
  NonEmpty,
  ThresholdSchema,
  TimestampSchema,
  VersionSchema,
} from '../common/types.js';
import { CesrSealSchema } from '../kel/types.js';

// ── VCP Event (Registry Inception) ──────────────────────────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 'ii', 's', 'c', 'bt', 'b', 'n']
// Saids: d and i are both SAIDified (registry AID === its SAID)
export const VcpEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('vcp'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    ii: CesrAidSchema,
    s: Type.Literal('0'),
    c: Type.Array(Type.String(), { default: [] }),
    bt: ThresholdSchema,
    b: Type.Array(CesrAidSchema),
    n: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
export type VcpEvent = Static<typeof VcpEventSchema>;

// ── VRT Event (Registry Rotation) ───────────────────────────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 'p', 's', 'bt', 'br', 'ba']
export const VrtEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('vrt'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    p: CesrDigestSchema,
    s: NonEmpty('Sequence Number'),
    bt: ThresholdSchema,
    br: Type.Array(CesrAidSchema),
    ba: Type.Array(CesrAidSchema),
  },
  { additionalProperties: false },
);
export type VrtEvent = Static<typeof VrtEventSchema>;

// ── ISS Event (Simple Credential Issuance, backerless) ──────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 's', 'ri', 'dt']
export const IssEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('iss'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    s: NonEmpty('Sequence Number'),
    ri: CesrDigestSchema,
    dt: TimestampSchema,
  },
  { additionalProperties: false },
);
export type IssEvent = Static<typeof IssEventSchema>;

// ── REV Event (Simple Credential Revocation, backerless) ────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 's', 'ri', 'p', 'dt']
export const RevEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('rev'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    s: NonEmpty('Sequence Number'),
    ri: CesrDigestSchema,
    p: CesrDigestSchema,
    dt: TimestampSchema,
  },
  { additionalProperties: false },
);
export type RevEvent = Static<typeof RevEventSchema>;

// ── BIS Event (Backer Credential Issuance) ──────────────────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 'ii', 's', 'ra', 'dt']
export const BisEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('bis'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    ii: CesrAidSchema,
    s: NonEmpty('Sequence Number'),
    ra: CesrSealSchema,
    dt: TimestampSchema,
  },
  { additionalProperties: false },
);
export type BisEvent = Static<typeof BisEventSchema>;

// ── BRV Event (Backer Credential Revocation) ────────────────────────
// Keripy canonical order: ['v', 't', 'd', 'i', 's', 'p', 'ra', 'dt']
export const BrvEventSchema = Type.Object(
  {
    v: VersionSchema,
    t: Type.Literal('brv'),
    d: CesrDigestSchema,
    i: CesrDigestSchema,
    s: NonEmpty('Sequence Number'),
    p: CesrDigestSchema,
    ra: CesrSealSchema,
    dt: TimestampSchema,
  },
  { additionalProperties: false },
);
export type BrvEvent = Static<typeof BrvEventSchema>;

// ── Unions ──────────────────────────────────────────────────────────
export const TelEventSchema = Type.Union([
  VcpEventSchema,
  VrtEventSchema,
  IssEventSchema,
  RevEventSchema,
  BisEventSchema,
  BrvEventSchema,
]);
export type TelEvent = Static<typeof TelEventSchema>;

export type EstablishmentTelEvent = VcpEvent | VrtEvent;

// ── RSN (Registry State Notice) ─────────────────────────────────────
export const RSNSchema = Type.Object(
  {
    v: VersionSchema,
    i: CesrDigestSchema,
    s: NonEmpty('Sequence Number'),
    d: CesrDigestSchema,
    et: Type.Union([
      Type.Literal('vcp'),
      Type.Literal('vrt'),
      Type.Literal('iss'),
      Type.Literal('rev'),
      Type.Literal('bis'),
      Type.Literal('brv'),
    ]),
    bt: ThresholdSchema,
    b: Type.Array(CesrAidSchema),
    c: Type.Array(Type.String(), { default: [] }),
  },
  { additionalProperties: false },
);
export type RSN = Static<typeof RSNSchema>;
