/**
 * Pure, family-agnostic KERI-oriented SAID derivation.
 *
 * A DerivationSurface declares how an artifact family (KEL event, TEL event,
 * ACDC envelope, etc.) projects itself onto a SAID preimage. The helper
 * performs placeholder substitution, optional version-string size
 * convergence, canonicalization, digest, and sealing — and never decides
 * policy about which fields a family chooses.
 *
 * See docs/superpowers/specs/2026-04-16-keri-said-derivation-design.md.
 *
 * PB-012 touch-point: this file canonicalizes via the existing RFC-8785
 * canonicalizer (Data.fromJson(...).canonicalize()). KERI-compliant
 * insertion-order serialization is a separate plan; when it lands, only
 * the canonicalizer changes and scenarios 5 and 9 flip from todo to
 * passing.
 */

import { Data, SAID_PLACEHOLDER } from './data.js';

// -------- DerivationSurface (discriminated union) --------

type BaseDerivationSurface = {
  readonly saidField: string;
  readonly derivedFieldsInOrder: readonly [string, ...string[]];
};

type VersionedDerivationSurface = BaseDerivationSurface & {
  readonly hasVersionString: true;
  readonly versionStringField: string;
};

type UnversionedDerivationSurface = BaseDerivationSurface & {
  readonly hasVersionString: false;
  readonly versionStringField?: never;
};

export type DerivationSurface = VersionedDerivationSurface | UnversionedDerivationSurface;

// -------- Internal validator --------

function assertValidSurface(s: DerivationSurface): void {
  const fields = s.derivedFieldsInOrder;
  if (!fields.includes(s.saidField))
    throw new Error(`DerivationSurface: saidField '${s.saidField}' missing from derivedFieldsInOrder`);
  if (new Set(fields).size !== fields.length)
    throw new Error(`DerivationSurface: derivedFieldsInOrder contains duplicates`);
  if (s.hasVersionString && !fields.includes(s.versionStringField))
    throw new Error(
      `DerivationSurface: versionStringField '${s.versionStringField}' missing from derivedFieldsInOrder`,
    );
  if (s.hasVersionString && s.saidField === s.versionStringField)
    throw new Error(`DerivationSurface: saidField and versionStringField must differ`);
}

// -------- Internal helpers --------

/**
 * Project an artifact onto a declared field list. Silently omits missing fields
 * from the projection — callers that require strict presence (e.g. deriveSaid)
 * must pre-check. This forgiving semantics is load-bearing for recomputeSaid,
 * where a missing included field flows through to a mismatched recompute rather
 * than a thrown error (see spec § "Error contract" for recomputeSaid).
 */
function project<A extends Record<string, unknown>>(artifact: A, fields: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f in artifact) out[f] = (artifact as Record<string, unknown>)[f];
  }
  return out;
}

function digestCanonical(obj: Record<string, unknown>): string {
  const { raw } = Data.fromJson(obj).canonicalize();
  return Data.digest(raw);
}

// -------- API --------

export function deriveSaid<A extends Record<string, unknown>>(
  artifact: A,
  surface: DerivationSurface,
): { sealed: A; said: string } {
  assertValidSurface(surface);

  // Per spec § "Error contract" for deriveSaid: absent field listed in
  // derivedFieldsInOrder is a programmer error — throw rather than silently skip.
  for (const f of surface.derivedFieldsInOrder) {
    if (!(f in artifact)) {
      throw new Error(`deriveSaid: artifact missing field '${f}' required by derivedFieldsInOrder`);
    }
  }
  if (surface.hasVersionString && !(surface.versionStringField in artifact)) {
    throw new Error(`deriveSaid: artifact missing versionStringField '${surface.versionStringField}'`);
  }

  // Step 1: project.
  const preimage = project(artifact, surface.derivedFieldsInOrder);
  // Step 2: placeholder at said field.
  preimage[surface.saidField] = SAID_PLACEHOLDER;

  // Step 3: version-string convergence (versioned path).
  if (surface.hasVersionString) {
    // Compute the converged version string over the projection (with said-field placeholder).
    const { [surface.versionStringField]: _ignored, ...preimageWithoutVersion } = preimage;
    const version = Data.computeVersionString(preimageWithoutVersion, 'JSON', 'KERI', surface.saidField);
    preimage[surface.versionStringField] = version;
  }

  // Step 4: digest the preimage.
  const said = digestCanonical(preimage);

  // Step 5: seal — copy original artifact, overwrite said field.
  const sealed = surface.hasVersionString
    ? ({
        ...artifact,
        [surface.versionStringField]: preimage[surface.versionStringField],
        [surface.saidField]: said,
      } as A)
    : ({ ...artifact, [surface.saidField]: said } as A);
  return { sealed, said };
}

export function recomputeSaid(
  artifact: Record<string, unknown>,
  surface: DerivationSurface,
): { matches: boolean; declared: string | undefined; recomputed: string } {
  assertValidSurface(surface);

  // Extract the declared SAID.
  const declaredRaw = artifact[surface.saidField];
  const declared = typeof declaredRaw === 'string' ? declaredRaw : undefined;

  // Versioned surfaces without a version-string field on the artifact cannot be
  // recomputed; treat as mismatch, don't throw.
  if (surface.hasVersionString && !(surface.versionStringField in artifact)) {
    return { matches: false, declared: undefined, recomputed: '' };
  }

  // Project onto the derivation surface and substitute the placeholder. No
  // re-convergence — the version string as present on the artifact is used.
  const preimage = project(artifact, surface.derivedFieldsInOrder);
  preimage[surface.saidField] = SAID_PLACEHOLDER;

  const recomputed = digestCanonical(preimage);
  return {
    matches: declared !== undefined && declared === recomputed,
    declared,
    recomputed,
  };
}
