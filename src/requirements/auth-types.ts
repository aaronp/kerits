import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { ChallengeResponseSchema } from '../challenge/types.js';
import type { AID, SAID } from '../common/types.js';
import { TimestampSchema } from '../common/types.js';
import { type Policy, PolicySchema, type ResolvedEvidence, SuppliedEvidenceSchema } from './types.js';

const AidSchema = Type.Unsafe<AID>(Type.String({ minLength: 1 }));
const SaidSchema = Type.Unsafe<SAID>(Type.String({ minLength: 1 }));
const ProofNonceSchema = Type.String({ minLength: 32, maxLength: 128 });

export const PolicyRefSchema = Type.Union([SaidSchema, PolicySchema]);
export type PolicyRef = SAID | Policy;

export function isPolicySaid(ref: PolicyRef): ref is SAID {
  return typeof ref === 'string';
}

export function isInlinePolicy(ref: PolicyRef): ref is Policy {
  return typeof ref === 'object' && ref !== null && 'd' in ref && 'requirement' in ref;
}

/** Site-chosen alias for an entry; keys its slot in the response and its claims in the token. */
export const ALIAS_PATTERN = '^[a-z][a-z0-9_-]{0,31}$';
const AliasSchema = Type.String({ pattern: ALIAS_PATTERN });

export const RequestEntrySchema = Type.Object(
  {
    policy: PolicyRefSchema,
    as: AliasSchema,
    need: Type.Union([Type.Literal('required'), Type.Literal('optional')]),
    purpose: Type.String(),
    /** Namespaced path (within this alias's disclosed object, e.g. `url` or `foo.url`) holding a resource URL. */
    audienceFrom: Type.Optional(Type.String({ minLength: 1 })),
    /** Fixed resource URL; this entry's alias (+ includes) go in that resource's access token. */
    audience: Type.Optional(Type.String({ minLength: 1 })),
    /** Other aliases also carried in this resource's access token (allow-list). */
    audienceIncludes: Type.Optional(Type.Array(AliasSchema)),
  },
  { additionalProperties: false },
);
export type RequestEntry = Static<typeof RequestEntrySchema>;

export const AuthRequestSchema = Type.Object(
  {
    entries: Type.Array(RequestEntrySchema, { minItems: 1 }),
    nonce: ProofNonceSchema,
    audience: Type.String({ minLength: 1 }),
    createdAt: TimestampSchema,
    expiresAt: TimestampSchema,
    allowTargetAid: Type.Boolean(),
    targetAidDescription: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);
export type AuthRequest = Static<typeof AuthRequestSchema>;

export const AuthResponseSlotSchema = Type.Object(
  {
    policySaid: SaidSchema,
    policy: Type.Optional(PolicySchema),
    subject: AidSchema,
    evidence: SuppliedEvidenceSchema,
  },
  { additionalProperties: false },
);
export type AuthResponseSlot = Static<typeof AuthResponseSlotSchema>;

export const AuthResponseSchema = Type.Object(
  {
    requestNonce: ProofNonceSchema,
    target: Type.Optional(AidSchema),
    /** Keyed by request entry alias (`as`). */
    slots: Type.Record(Type.String(), AuthResponseSlotSchema),
    /** One control proof per distinct AID (slot subjects and target), keyed by AID. */
    controls: Type.Record(Type.String(), ChallengeResponseSchema),
  },
  { additionalProperties: false },
);
export type AuthResponse = Static<typeof AuthResponseSchema>;

/** Evidence fully inlined — only form AuthOps.verify accepts. */
export type ResolvedAuthResponseSlot = Omit<AuthResponseSlot, 'evidence'> & {
  evidence: ResolvedEvidence;
};
export type ResolvedAuthResponse = Omit<AuthResponse, 'slots'> & {
  slots: Record<string, ResolvedAuthResponseSlot>;
};

/** Schema guards for untrusted (holder-supplied) request/response bodies. */
export const isAuthRequest = (value: unknown): value is AuthRequest => Value.Check(AuthRequestSchema, value);
export const isAuthResponse = (value: unknown): value is AuthResponse => Value.Check(AuthResponseSchema, value);
