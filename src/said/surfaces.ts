/**
 * Canonical DerivationSurface descriptors for all KERI/ACDC artifact families.
 *
 * Field orders are derived from keripy source (src/keri/core/serdering.py,
 * src/keri/vdr/eventing.py). Each surface defines:
 * - Which fields participate in SAID derivation
 * - The canonical insertion order for serialization
 * - Protocol identifier for version string ('KERI' or 'ACDC')
 *
 * Optional fields (e.g. VCP 'n' nonce) are omitted from surfaces — they are
 * excluded from SAID computation when absent on the artifact. The deriveSaid
 * helper silently omits missing optional fields during projection.
 *
 * Note: deriveSaid requires ALL listed fields to be present. For artifacts
 * with optional fields, callers must build a surface that matches the fields
 * actually present, or provide default values for optional fields.
 */

import type { DerivationSurface } from '../common/derivation-surface.js';

// ── KEL Surfaces ────────────────────────────────────────────────────

export const KEL_ICP_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'kt', 'k', 'nt', 'n', 'bt', 'b', 'c', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** ROT (Rotation): keripy v1 — no 'c' field. */
export const KEL_ROT_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'p', 'kt', 'k', 'nt', 'n', 'bt', 'br', 'ba', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** IXN (Interaction): ['v','t','d','i','s','p','a'] */
export const KEL_IXN_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'p', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** DIP (Delegated Inception): ICP fields + 'di' at end. Both d and i are SAIDified. */
export const KEL_DIP_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'kt', 'k', 'nt', 'n', 'bt', 'b', 'c', 'a', 'di'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** DRT (Delegated Rotation): same field order as ROT in keripy v1. */
export const KEL_DRT_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'p', 'kt', 'k', 'nt', 'n', 'bt', 'br', 'ba', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

// ── TEL Surfaces ────────────────────────────────────────────────────

/** VCP (Registry Inception): ['v','t','d','i','ii','s','c','bt','b','n'] */
export const TEL_VCP_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 'ii', 's', 'c', 'bt', 'b'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** VCP with nonce — use when the artifact includes an 'n' field. */
export const TEL_VCP_WITH_NONCE_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 'ii', 's', 'c', 'bt', 'b', 'n'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** VRT (Registry Rotation): ['v','t','d','i','p','s','bt','br','ba'] */
export const TEL_VRT_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 'p', 's', 'bt', 'br', 'ba'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** ISS (Simple Credential Issuance): ['v','t','d','i','s','ri','dt'] */
export const TEL_ISS_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'ri', 'dt'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** REV (Simple Credential Revocation): ['v','t','d','i','s','ri','p','dt'] */
export const TEL_REV_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'ri', 'p', 'dt'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** BIS (Backer Credential Issuance): ['v','t','d','i','ii','s','ra','dt'] */
export const TEL_BIS_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 'ii', 's', 'ra', 'dt'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

/** BRV (Backer Credential Revocation): ['v','t','d','i','s','p','ra','dt'] */
export const TEL_BRV_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 'i', 's', 'p', 'ra', 'dt'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'KERI',
} as const;

// ── ACDC Surfaces ───────────────────────────────────────────────────

/** ACDC Schema Envelope: ['v','t','d','s'] */
export const ACDC_SCHEMA_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 't', 'd', 's'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'ACDC',
} as const;

/**
 * ACDC Credential (v1, minimal — inline attributes, no nonce/edges/rules).
 * For credentials with optional fields (u, ri, e, r), build a surface
 * that includes only the fields actually present on the artifact,
 * maintaining keripy canonical order: ['v','d','u','i','ri','s','a','A','e','r'].
 */
export const ACDC_CREDENTIAL_SURFACE: DerivationSurface = {
  saidField: 'd',
  derivedFieldsInOrder: ['v', 'd', 'i', 's', 'a'],
  hasVersionString: true,
  versionStringField: 'v',
  protocol: 'ACDC',
} as const;

/**
 * Build a credential surface from the fields actually present on an artifact.
 * Maintains keripy canonical order: ['v','d','u','i','ri','rd','s','a','A','e','r'].
 * The 'rd' (Registry Digest) field is a v2 addition that replaces 'ri' for
 * linking credentials to their TEL registry via SAID digest.
 */
export function buildACDCCredentialSurface(artifact: Record<string, unknown>): DerivationSurface {
  const canonicalOrder = ['v', 'd', 'u', 'i', 'ri', 'rd', 's', 'a', 'A', 'e', 'r'] as const;
  const present = canonicalOrder.filter((f) => f in artifact);
  if (present.length === 0) throw new Error('buildACDCCredentialSurface: no fields present');
  return {
    saidField: 'd',
    derivedFieldsInOrder: present as unknown as [string, ...string[]],
    hasVersionString: true,
    versionStringField: 'v',
    protocol: 'ACDC',
  };
}
