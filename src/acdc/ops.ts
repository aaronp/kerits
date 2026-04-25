import { recomputeSaid, serializeForSigning } from '../common/derivation-surface.js';
import type { PublicKey, SAID, Signature } from '../common/types.js';
import { buildACDCCredentialSurface } from '../said/surfaces.js';
import { SchemaOps } from '../schema/ops.js';
import type { ACDCSchema, SchemaValidationResult } from '../schema/types.js';
import { verify } from '../signature/verify.js';
import type {
  ACDCCredential,
  ACDCProof,
  CredentialStatus,
  CredentialStatusEvidence,
  CredentialStatusSource,
} from './types.js';

// ── Status and evidence ─────────────────────────────────────────────

function extractSaids(sources: CredentialStatusSource[]): SAID[] {
  const seen = new Set<SAID>();
  for (const src of sources) seen.add(src.acdcSaid);
  return Array.from(seen);
}

function extractUniqueRids(sources: CredentialStatusSource[]): SAID[] {
  const seen = new Set<SAID>();
  for (const src of sources) {
    if (src.kind === 'tel-iss' || src.kind === 'tel-rev') {
      seen.add(src.rid);
    }
  }
  return Array.from(seen);
}

/** Derive credential status. Revoked wins over issued. */
function status(sources: CredentialStatusSource[]): CredentialStatus {
  let hasIss = false;
  for (const src of sources) {
    if (src.kind === 'tel-rev') return 'revoked';
    if (src.kind === 'tel-iss') hasIss = true;
  }
  return hasIss ? 'issued' : 'unknown';
}

function findIssSaidForRid(sources: CredentialStatusSource[], rid: SAID): SAID | undefined {
  for (const src of sources) {
    if (src.kind === 'tel-iss' && src.rid === rid) return src.eventSaid;
  }
  return undefined;
}

/** Map CredentialStatusSource[] to CredentialStatusEvidence[], correlating ISS+REV. */
function evidence(sources: CredentialStatusSource[]): CredentialStatusEvidence[] {
  const result: CredentialStatusEvidence[] = [];
  for (const src of sources) {
    if (src.kind === 'tel-iss') {
      result.push({
        source: 'tel',
        status: 'issued',
        rid: src.rid,
        issSaid: src.eventSaid,
        issIndex: src.index,
      });
    } else if (src.kind === 'tel-rev') {
      const issSaid = findIssSaidForRid(sources, src.rid);
      result.push({
        source: 'tel',
        status: 'revoked',
        rid: src.rid,
        issSaid: issSaid ?? ('' as SAID),
        revSaid: src.eventSaid,
        revIndex: src.index,
      });
    } else if (src.kind === 'kel-anchor') {
      result.push({
        source: 'kel-anchor',
        status: 'anchored',
        issuer: src.issuer,
        anchorEventSaid: src.eventSaid,
        anchorEventSeqNo: src.seqNo,
      });
    }
  }
  return result;
}

// ── Signature verification ──────────────────────────────────────────

type SignatureResult = { ok: true } | { ok: false; reason: 'signature_invalid'; message: string };

/**
 * Verify a proof's signature against the credential's canonical serialization.
 *
 * KERI signs the full canonical serialization (which contains the embedded SAID),
 * NOT just the SAID string bytes. This matches keripy's signing behavior where
 * serder.raw is signed.
 *
 * Proofs are external CESR attachments in KERI, passed separately.
 * Uses verify() from core/signature/verify.ts.
 * PublicKey resolution is the caller's responsibility.
 */
function verifySignature(credential: ACDCCredential, proof: ACDCProof, publicKey: PublicKey): SignatureResult {
  const signature = proof.s as Signature;
  const surface = buildACDCCredentialSurface(credential as unknown as Record<string, unknown>);
  const { raw } = serializeForSigning(credential as unknown as Record<string, unknown>, surface);

  const valid = verify(publicKey, signature, raw);
  if (!valid) {
    return { ok: false, reason: 'signature_invalid', message: 'Ed25519 signature verification failed' };
  }

  return { ok: true };
}

// ── Claims ──────────────────────────────────────────────────────────

/** Returns credential.a as-is. No normalization or field stripping. */
function subjectClaims(credential: ACDCCredential): Record<string, unknown> {
  return (credential.a ?? {}) as Record<string, unknown>;
}

/**
 * Top-level positive projection: returns only keys in credential.a
 * that are present in schema.s.properties. Nested objects preserved as-is.
 */
function projectClaims(credential: ACDCCredential, schema: ACDCSchema): Record<string, unknown> {
  const properties = (schema.s as Record<string, unknown>).properties as Record<string, unknown> | undefined;
  if (!properties) return {};
  const a = (credential.a ?? {}) as Record<string, unknown>;
  const claims: Record<string, unknown> = {};
  for (const key of Object.keys(properties)) {
    if (key in a) {
      claims[key] = a[key];
    }
  }
  return claims;
}

/** Composition of projectClaims + sync SchemaOps.validate. */
function projectAndValidateClaims(
  credential: ACDCCredential,
  schema: ACDCSchema,
): { claims: Record<string, unknown>; validation: SchemaValidationResult } {
  const claims = projectClaims(credential, schema);
  const validation = SchemaOps.validate(schema, claims);
  return { claims, validation };
}

// ── SAID validation ─────────────────────────────────────────────────

type SaidValidationResult = { valid: boolean; expected: string; actual: string };

/**
 * Verify that an ACDC credential's d field matches the recomputed SAID.
 * Dynamically builds the surface from the credential's actual fields.
 */
function validateSaid(credential: ACDCCredential): SaidValidationResult {
  const surface = buildACDCCredentialSurface(credential as unknown as Record<string, unknown>);
  const result = recomputeSaid(credential as unknown as Record<string, unknown>, surface);
  return {
    valid: result.matches,
    expected: result.recomputed,
    actual: (credential.d ?? '') as string,
  };
}

export type { SaidValidationResult, SignatureResult };

export const ACDCOps = {
  status,
  evidence,
  extractSaids,
  extractUniqueRids,
  verifySignature,
  subjectClaims,
  projectClaims,
  projectAndValidateClaims,
  validateSaid,
} as const;
