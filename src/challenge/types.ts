import { type Static, Type } from '@sinclair/typebox';
import type { AID, PublicKey, SAID, Signature } from '../common/types.js';
import { CESREventSchema } from '../kel/types.js';

export const ChallengeSchema = Type.Object(
  {
    nonce: Type.String({ minLength: 32, maxLength: 128 }),
    expiresAt: Type.Optional(Type.String()),
    subject: Type.Optional(Type.Unsafe<SAID>(Type.String({ minLength: 1 }))),
    /** Ask the responder to include its ordered KEL and its delegator lineage KELs. */
    includeKEL: Type.Optional(Type.Boolean()),
    /** Ask the responder to include known KEL manifest URLs for itself and its lineage. */
    includeRemotes: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);
export type Challenge = Static<typeof ChallengeSchema>;

export const ChallengeResponseSchema = Type.Object(
  {
    nonce: Type.String({ minLength: 32, maxLength: 128 }),
    /** Who the response is for (an AS origin, or the challenger AID). Signed, so a response cannot be replayed to another verifier. */
    audience: Type.String({ minLength: 1 }),
    aid: Type.Unsafe<AID>(Type.String({ minLength: 1 })),
    publicKey: Type.Unsafe<PublicKey>(Type.String({ minLength: 1 })),
    subject: Type.Optional(Type.Unsafe<SAID>(Type.String({ minLength: 1 }))),
    // Supporting data below is NOT signed: it is self-certifying (SAIDs, controller sigs, AID derivation,
    // delegation seals) and only used by the verifier when it validates. Untrusted until then.
    /** Responder's ordered KEL. */
    kel: Type.Optional(Type.Array(CESREventSchema, { maxItems: 1024 })),
    /** Responder's delegator chain, immediate delegator → root, each with its ordered KEL. */
    lineage: Type.Optional(
      Type.Array(
        Type.Object(
          {
            aid: Type.Unsafe<AID>(Type.String({ minLength: 1 })),
            kel: Type.Optional(Type.Array(CESREventSchema, { maxItems: 1024 })),
          },
          { additionalProperties: false },
        ),
        { maxItems: 16 },
      ),
    ),
    /** Known KEL URIs (where each KEL is published) for the responder and its lineage (informational; never fetched automatically). */
    remotes: Type.Optional(
      Type.Array(
        Type.Object(
          { aid: Type.Unsafe<AID>(Type.String({ minLength: 1 })), kelUri: Type.String({ minLength: 1 }) },
          { additionalProperties: false },
        ),
        { maxItems: 17 },
      ),
    ),
    signature: Type.Unsafe<Signature>(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);
export type ChallengeResponse = Static<typeof ChallengeResponseSchema>;

/**
 * `key-not-in-kel`: the response's publicKey is not among the current keys of the KEL the verifier holds.
 * `audience-mismatch`: the response was signed for another verifier.
 */
export type ChallengeFailure = {
  kind:
    | 'nonce-mismatch'
    | 'audience-mismatch'
    | 'subject-mismatch'
    | 'kel-invalid'
    | 'aid-mismatch'
    | 'key-not-in-kel'
    | 'signature-invalid';
};

/** A delegator in the responder's chain has no usable KEL (no valid local copy, no valid extending included copy). */
export type ChallengeLineageUnresolved = { kind: 'lineage-unresolved'; aid: AID };

/** The response's included KEL validly diverges from the verifier's local copy at `sn` (duplicity). */
export type ChallengeKelForked = { kind: 'kel-forked'; aid: AID; sn: number };
