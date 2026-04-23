import { type Static, Type } from '@sinclair/typebox';
import type { AID, SAID } from '../common/types.js';
import { CesrAidSchema, CesrDigestSchema, NonEmpty, TimestampSchema } from '../common/types.js';
import { ACDCVersionSchema } from '../schema/types.js';

// ── ACDC Credential ─────────────────────────────────────────────────
// Keripy v1 canonical order: ['v', 'd', 'u', 'i', 'ri', 's', 'a', 'A', 'e', 'r']
// No ilk/type field. Protocol 'ACDC' in version string identifies it.
// a and A are mutually exclusive (inline attributes vs attribute SAIDs).
// rd (Registry Digest) is a v2 field that replaces ri (Registry Identifier)
// for linking credentials to their TEL registry via SAID digest.
export const ACDCCredentialSchema = Type.Object(
  {
    v: ACDCVersionSchema,
    d: CesrDigestSchema,
    u: Type.Optional(Type.String()),
    i: CesrAidSchema,
    ri: Type.Optional(CesrDigestSchema),
    rd: Type.Optional(CesrDigestSchema),
    s: CesrDigestSchema,
    a: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    A: Type.Optional(Type.Array(CesrDigestSchema)),
    e: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    r: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  },
  { additionalProperties: false },
);
export type ACDCCredential = Static<typeof ACDCCredentialSchema>;

// ── ACDC Proof (kerits utility — not part of keripy credential envelope) ──
// In KERI, proofs are external CESR attachments. This type is a kerits-specific
// helper for managing proof metadata outside the credential envelope.
export const ACDCProofSchema = Type.Object(
  {
    t: NonEmpty('Proof Type'),
    i: CesrAidSchema,
    s: NonEmpty('Signature'),
    k: Type.Optional(NonEmpty('Key Reference')),
    dt: Type.Optional(TimestampSchema),
  },
  { additionalProperties: false },
);
export type ACDCProof = Static<typeof ACDCProofSchema>;

// ── Credential Status ───────────────────────────────────────────────
export type CredentialStatus = 'unknown' | 'staged' | 'issued' | 'revoked';

// ── Credential Status Source ────────────────────────────────────────
export type CredentialStatusSource =
  | { acdcSaid: SAID; kind: 'tel-iss'; rid: SAID; eventSaid: SAID; index: number }
  | { acdcSaid: SAID; kind: 'tel-rev'; rid: SAID; eventSaid: SAID; index: number }
  | { acdcSaid: SAID; kind: 'kel-anchor'; issuer: AID; eventSaid: SAID; seqNo: number };

// ── Credential Status Evidence ──────────────────────────────────────
export type CredentialStatusEvidence =
  | { source: 'tel'; status: 'issued'; rid: SAID; issSaid: SAID; issIndex: number }
  | { source: 'tel'; status: 'revoked'; rid: SAID; issSaid: SAID; revSaid: SAID; revIndex: number }
  | { source: 'kel-anchor'; status: 'anchored'; issuer: AID; anchorEventSaid: SAID; anchorEventSeqNo: number }
  | { source: 'kel-anchor'; status: 'unverifiable'; issuer?: AID; reason: string };

// ── Credential Policy contract ──────────────────────────────────────
export type CredentialJudgment =
  | { accepted: true; confidence: 'tel-backed' | 'kel-anchor-only' }
  | { accepted: false; reason: string };

export type CredentialPolicy = (
  evidence: CredentialStatusEvidence[],
  credential?: ACDCCredential,
) => CredentialJudgment;
