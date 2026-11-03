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

/**
 * TEL event types — two separate histories (git analogy: lanes with cross-refs).
 *
 * Registry (management) TEL: configuration only (`vcp` / `vrt`). Does not advance on issue/revoke.
 * Credential TEL: status for one credential SAID (`iss` / `rev`, or backed `bis` / `brv`).
 *
 * Field pointers (NB profile):
 * - vcp.ii → issuer AID; vcp.i / vcp.d → registry inception SAID
 * - iss.ri / rev.ri → registry inception SAID; iss.i / rev.i → credential SAID
 * - iss.d / rev.d → this event SAID; rev.p → prior credential event SAID
 * - bis/brv.ra → { i, s, d } of applicable registry state (vcp or later vrt)
 */

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

// ── Scope ────────────────────────────────────────────────────────────
// registry: management TEL — VCP genesis, VRT allowed
// credential: credential status TEL — ISS genesis, REV terminal
export type TELScope = 'registry' | 'credential';

// ── Unions (lane ADTs) ───────────────────────────────────────────────
/** Management TEL events — registry configuration history. */
export const RegistryEventSchema = Type.Union([VcpEventSchema, VrtEventSchema]);
export type RegistryEvent = Static<typeof RegistryEventSchema>;

/** Credential TEL events — status history for one credential SAID. */
export const CredentialEventSchema = Type.Union([IssEventSchema, RevEventSchema, BisEventSchema, BrvEventSchema]);
export type CredentialEvent = Static<typeof CredentialEventSchema>;

export const TelEventSchema = Type.Union([RegistryEventSchema, CredentialEventSchema]);
export type TelEvent = Static<typeof TelEventSchema>;

/** @deprecated Prefer {@link RegistryEvent} — same set (vcp | vrt). */
export type EstablishmentTelEvent = RegistryEvent;

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
