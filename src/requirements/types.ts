// packages/core/src/requirements/types.ts
import { type Static, type TSchema, Type } from '@sinclair/typebox';
import { type ACDCCredential, ACDCCredentialSchema } from '../acdc/types.js';
import type { AID, SAID } from '../common/types.js';
import { type CESREvent, CESREventSchema } from '../kel/types.js';
import { ACDCSchemaSchema } from '../schema/types.js';
import { type CredentialEvent, CredentialEventSchema, type RegistryEvent, RegistryEventSchema } from '../tel/types.js';
import { FieldPredicateSchema } from './field-predicate.js';

export const MAX_REQUIREMENT_DEPTH = 16;

const AidSchema = Type.Unsafe<AID>(Type.String({ minLength: 1 }));
const SaidSchema = Type.Unsafe<SAID>(Type.String({ minLength: 1 }));
const MaxDepthSchema = Type.Optional(Type.Integer({ minimum: 1, maximum: MAX_REQUIREMENT_DEPTH }));

// ── Sources (resolution directive) ──

/**
 * A resolution channel for one artifact: `expected` (the validator already holds it or has a configured source;
 * supplied material is ignored), `oobi` (the supplied OOBI, allow-list checked), `in-line` (the supplied events).
 * A leaf's listed channels are tried in list order; the first that resolves is used.
 * An absent `sources` (or absent key) means ANY channel: no restriction and no preference. The resolver's
 * fallback order expected → oobi → in-line is an implementation choice, not a policy preference.
 * A validator bound to a profile also ingests that profile's own known KEL when it equals or extends the candidate (the
 * fork check), whatever the directive: it is the validator's knowledge, never holder-supplied material.
 */
export type Source = 'expected' | 'oobi' | 'in-line';
export type CredentialArtifact =
  | 'issuerKel'
  | 'delegatorKels'
  | 'registryTel'
  | 'credentialTel'
  | 'acdc'
  | 'lineageKels';

const SourcesListSchema = Type.Optional(
  Type.Array(Type.Union([Type.Literal('expected'), Type.Literal('oobi'), Type.Literal('in-line')]), {
    minItems: 1,
    uniqueItems: true,
  }),
);

// ── Requirement ──

export const IsMemberSchema = Type.Object(
  {
    type: Type.Literal('is-member'),
    parentAID: AidSchema,
    maxDepth: MaxDepthSchema,
    sources: Type.Optional(Type.Object({ lineageKels: SourcesListSchema }, { additionalProperties: false })),
  },
  { additionalProperties: false },
);

export const HolderSchema = Type.Union([
  Type.Object({ type: Type.Literal('subject') }, { additionalProperties: false }),
  Type.Object(
    { type: Type.Literal('holder-is-member'), parentAID: AidSchema, maxDepth: MaxDepthSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { type: Type.Literal('member-of-holder'), parentAID: AidSchema, maxDepth: MaxDepthSchema },
    { additionalProperties: false },
  ),
]);

/** Who must have issued the credential. `any` accepts any issuer; an empty `any-of` is never "anyone". */
export const IssuerSchema = Type.Union([
  Type.Object(
    { type: Type.Literal('any-of'), aids: Type.Array(AidSchema, { minItems: 1 }) },
    { additionalProperties: false },
  ),
  Type.Object({ type: Type.Literal('any') }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('self-asserted') }, { additionalProperties: false }),
]);

// ── Disclosure (per credential; projection into JWT, not verify) ──

export const DisclosureFieldSchema = Type.Object(
  {
    path: Type.String({ minLength: 1 }),
    required: Type.Boolean(),
    purpose: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export type CredentialMetadataField = 'issuerAID' | 'holderAID' | 'credentialOOBI' | 'telOOBI' | 'acdcSAID';
/** Metadata only an ACDC can supply; `holderAID` is suppliable by every source. */
export const ACDC_ONLY_METADATA: readonly CredentialMetadataField[] = [
  'issuerAID',
  'credentialOOBI',
  'telOOBI',
  'acdcSAID',
];

export const MetadataDisclosureSchema = Type.Object(
  {
    field: Type.Union([
      Type.Literal('issuerAID'),
      Type.Literal('holderAID'),
      Type.Literal('credentialOOBI'),
      Type.Literal('telOOBI'),
      Type.Literal('acdcSAID'),
    ]),
    required: Type.Boolean(),
    purpose: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const CredentialDisclosureSchema = Type.Object(
  { fields: Type.Array(DisclosureFieldSchema), metadata: Type.Array(MetadataDisclosureSchema) },
  { additionalProperties: false },
);

export type DisclosureField = Static<typeof DisclosureFieldSchema>;
export type MetadataDisclosure = Static<typeof MetadataDisclosureSchema>;
export type CredentialDisclosure = Static<typeof CredentialDisclosureSchema>;
export type Disclosure = CredentialDisclosure;

export const HasCredentialSchema = Type.Object(
  {
    type: Type.Literal('has-credential'),
    issuer: IssuerSchema,
    holder: HolderSchema,
    credential: Type.Object(
      { schema: ACDCSchemaSchema, predicates: Type.Array(FieldPredicateSchema) },
      { additionalProperties: false },
    ),
    sources: Type.Optional(
      Type.Object(
        {
          issuerKel: SourcesListSchema,
          delegatorKels: SourcesListSchema,
          registryTel: SourcesListSchema,
          credentialTel: SourcesListSchema,
          acdc: SourcesListSchema,
          lineageKels: SourcesListSchema,
        },
        { additionalProperties: false },
      ),
    ),
    disclosure: CredentialDisclosureSchema,
  },
  { additionalProperties: false },
);

export const RequirementSchema = Type.Recursive(
  (Self) =>
    Type.Union([
      IsMemberSchema,
      HasCredentialSchema,
      Type.Object(
        { type: Type.Union([Type.Literal('and'), Type.Literal('or')]), requirements: Type.Record(Type.String(), Self) },
        { additionalProperties: false },
      ),
    ]),
  { $id: 'Requirement' },
);

export type IsMember = Static<typeof IsMemberSchema>;
export type Holder = Static<typeof HolderSchema>;
export type Issuer = Static<typeof IssuerSchema>;
export type HasCredential = Static<typeof HasCredentialSchema>;
export type Requirement = Static<typeof RequirementSchema>;
export type Expression = Extract<Requirement, { type: 'and' | 'or' }>;

// ── Policy ──

/** Where someone goes to obtain what this policy asks for. Part of the policy id. */
export const OnboardingResourceSchema = Type.Union([
  Type.Object({ type: Type.Literal('url'), url: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('email'), email: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('kerits'), aid: AidSchema }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal('kerits'), user: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
]);
export type OnboardingResource = Static<typeof OnboardingResourceSchema>;

export const PolicySchema = Type.Object(
  {
    d: SaidSchema,
    purpose: Type.Optional(Type.String()),
    /** Absent when there are none. An empty list is not a valid policy. */
    onboarding: Type.Optional(Type.Array(OnboardingResourceSchema, { minItems: 1 })),
    requirement: RequirementSchema,
  },
  { additionalProperties: false },
);
export type Policy = Static<typeof PolicySchema>;

// ── Refs ──

export type OobiRef = { oobi: string };
export type RequiredRef<T> = { oobi: string; value: T };
export type Ref<T> = T | OobiRef | RequiredRef<T>;

export function isOobiRef(x: unknown): x is OobiRef {
  return typeof x === 'object' && x !== null && !Array.isArray(x) && 'oobi' in x && !('value' in x);
}
export function isRequiredRef<T>(x: Ref<T>): x is RequiredRef<T> {
  return typeof x === 'object' && x !== null && !Array.isArray(x) && 'oobi' in x && 'value' in x;
}

const refOf = <T extends TSchema>(s: T) =>
  Type.Union([
    s,
    Type.Object({ oobi: Type.String({ minLength: 1 }) }, { additionalProperties: false }),
    Type.Object({ oobi: Type.String({ minLength: 1 }), value: s }, { additionalProperties: false }),
  ]);

// ── Resolved evidence (what core verifies; mutable arrays so it is assignable to SuppliedEvidence) ──

export type IsMemberEvidence = { type: 'is-member'; lineage: AID[]; kels: Record<string, CESREvent[]> };
export type HasCredentialEvidence = {
  type: 'has-credential';
  acdc: ACDCCredential;
  /** vcp, then 0..n vrt — ordered */
  registryTel: RegistryEvent[];
  /** iss|bis, then 0..n rev|brv — ordered */
  credentialTel: CredentialEvent[];
  kels: Record<string, CESREvent[]>;
  membership?: IsMemberEvidence;
};
/** Wallet-supplied attribute values for a `self-asserted` issuer (no ACDC, nothing to verify but shape). */
export type SelfAssertedEvidence = { type: 'self-asserted'; attributes: Record<string, unknown> };
export type ExpressionEvidence = { type: 'and' | 'or'; evidence: Record<string, ResolvedEvidence> };
export type ResolvedEvidence = IsMemberEvidence | HasCredentialEvidence | SelfAssertedEvidence | ExpressionEvidence;

// ── Supplied evidence (wire form; every data field is a Ref) ──

const KelRefSchema = refOf(Type.Array(CESREventSchema));

export const SuppliedIsMemberEvidenceSchema = Type.Object(
  {
    type: Type.Literal('is-member'),
    lineage: Type.Array(AidSchema, { minItems: 1 }),
    kels: Type.Record(Type.String(), KelRefSchema),
  },
  { additionalProperties: false },
);

export const SuppliedEvidenceSchema = Type.Recursive(
  (Self) =>
    Type.Union([
      SuppliedIsMemberEvidenceSchema,
      Type.Object(
        {
          type: Type.Literal('has-credential'),
          acdc: refOf(ACDCCredentialSchema),
          registryTel: refOf(Type.Array(RegistryEventSchema)),
          credentialTel: refOf(Type.Array(CredentialEventSchema)),
          kels: Type.Record(Type.String(), KelRefSchema),
          membership: Type.Optional(SuppliedIsMemberEvidenceSchema),
        },
        { additionalProperties: false },
      ),
      Type.Object(
        { type: Type.Literal('self-asserted'), attributes: Type.Record(Type.String(), Type.Unknown()) },
        { additionalProperties: false },
      ),
      Type.Object(
        { type: Type.Union([Type.Literal('and'), Type.Literal('or')]), evidence: Type.Record(Type.String(), Self) },
        { additionalProperties: false },
      ),
    ]),
  { $id: 'SuppliedEvidence' },
);

export type SuppliedIsMemberEvidence = Static<typeof SuppliedIsMemberEvidenceSchema>;
export type SuppliedEvidence = Static<typeof SuppliedEvidenceSchema>;
export type SuppliedHasCredentialEvidence = Extract<SuppliedEvidence, { type: 'has-credential' }>;

// ── Bundles ──

export type ProofBundle = { policy: Policy; subject: AID; evidence: SuppliedEvidence };
export type ResolvedProofBundle = { policy: Policy; subject: AID; evidence: ResolvedEvidence };

// ── Failures ──

export type RequirementErrorKind =
  | 'invalid-shape'
  | 'said-mismatch'
  | 'empty-expression'
  | 'too-deep'
  | 'schema-said-invalid'
  | 'predicate-invalid'
  | 'reserved-name'
  | 'metadata-unsatisfiable'
  | 'duplicate-path';
export type RequirementError = { kind: RequirementErrorKind; path: string[]; detail?: string };

export type EvidenceFailureKind =
  | 'type-mismatch'
  | 'lineage-mismatch'
  | 'subject-mismatch'
  | 'max-depth-exceeded'
  | 'kel-missing'
  | 'kel-invalid'
  | 'delegation-unsealed'
  | 'issuer-not-allowed'
  | 'self-asserted-not-allowed'
  | 'acdc-said-invalid'
  | 'schema-mismatch'
  | 'claims-invalid'
  | 'predicate-failed'
  | 'tel-mismatch'
  | 'tel-unanchored'
  | 'holder-mismatch'
  | 'membership-missing'
  | 'and-incomplete'
  | 'or-empty'
  | 'said-mismatch'
  | 'unexpected-evidence'
  | 'no-candidates'
  | 'revoked'
  | 'backers-unsupported'
  | 'metadata-unavailable';
export type EvidenceFailure = { path: string[]; kind: EvidenceFailureKind; detail?: string };
