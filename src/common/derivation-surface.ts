/**
 * Pure, family-agnostic KERI-oriented SAID derivation.
 *
 * A DerivationSurface declares how an artifact family (KEL event, TEL event,
 * ACDC envelope, etc.) projects itself onto a SAID preimage. The helper
 * performs placeholder substitution, optional version-string size
 * convergence, insertion-order serialization, digest, and sealing — and
 * never decides policy about which fields a family chooses.
 *
 * See docs/superpowers/specs/2026-04-16-keri-said-derivation-design.md.
 *
 * Serialization: This file uses insertion-order JSON serialization
 * (serializeInsertionOrder) for KERI SAID derivation. Non-KERI SAID paths
 * (Data.saidify, canonical()) remain on RFC-8785. See
 * docs/superpowers/specs/2026-04-22-keri-insertion-order-said-design.md.
 */

import { Data, SAID_PLACEHOLDER } from './data.js';
import { type JsonValue, serializeInsertionOrder } from './serialize-insertion-order.js';

// -------- DerivationSurface (discriminated union) --------

type BaseDerivationSurface = {
  readonly saidField: string;
  readonly derivedFieldsInOrder: readonly [string, ...string[]];
};

type VersionedDerivationSurface = BaseDerivationSurface & {
  readonly hasVersionString: true;
  readonly versionStringField: string;
  /** Protocol identifier for the version string, e.g. 'KERI' or 'ACDC'. */
  readonly protocol: string;
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

function digestInsertionOrderJson(obj: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(serializeInsertionOrder(obj as JsonValue));
  return Data.digest(bytes);
}

/**
 * Compute a KERI version string using insertion-order serialization for byte measurement.
 *
 * Same convergence semantics as Data.computeVersionString() (insert SAID placeholder,
 * serialize, measure byte length, update size, repeat until stable) but uses
 * serializeInsertionOrder() instead of RFC-8785. File-internal; not exported.
 *
 * IMPORTANT: This function takes the full preimage (including the version-string field)
 * and rebuilds it key-by-key to preserve Object.keys() order. Using spread to re-insert
 * the version field would place it at the end, corrupting insertion order.
 */
function computeKeriVersionString(
  preimage: Record<string, unknown>,
  versionStringField: string,
  kind: string,
  protocol: string,
  saidFieldName: string,
): string {
  let version = `${protocol}10${kind}000000_`;
  let previousSize = 0;

  // 10 iterations mirrors Data.computeVersionString(). A 6-digit size field can only
  // change the serialized length by a few bytes per iteration, so convergence is
  // typically reached in 1–2 iterations for realistic KERI artifacts.
  for (let iteration = 0; iteration < 10; iteration++) {
    // Rebuild key-by-key to preserve the original key order from project().
    const measured: Record<string, unknown> = {};
    for (const key of Object.keys(preimage)) {
      if (key === versionStringField) {
        measured[key] = version;
      } else if (key === saidFieldName) {
        measured[key] = SAID_PLACEHOLDER;
      } else {
        measured[key] = preimage[key];
      }
    }

    const bytes = new TextEncoder().encode(serializeInsertionOrder(measured as JsonValue));
    const size = bytes.length;

    if (size === previousSize) {
      return version;
    }

    previousSize = size;
    const sizeHex = size.toString(16).padStart(6, '0');
    version = `${protocol}10${kind}${sizeHex}_`;
  }

  throw new Error('KERI version string calculation did not converge');
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
    const version = computeKeriVersionString(
      preimage,
      surface.versionStringField,
      'JSON',
      surface.protocol,
      surface.saidField,
    );
    preimage[surface.versionStringField] = version;
  }

  // Step 4: digest the preimage.
  const said = digestInsertionOrderJson(preimage);

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

  const recomputed = digestInsertionOrderJson(preimage);
  return {
    matches: declared !== undefined && declared === recomputed,
    declared,
    recomputed,
  };
}

/**
 * Serialize a sealed artifact in surface field order for signing.
 *
 * Projects the artifact onto the surface's derivedFieldsInOrder and serializes
 * using insertion-order JSON. The result is the canonical bytes that should be
 * signed — identical field order to the SAID preimage, but with the actual SAID
 * filled in (not the placeholder).
 */
export function serializeForSigning(
  artifact: Record<string, unknown>,
  surface: DerivationSurface,
): { raw: Uint8Array; text: string } {
  const projected = project(artifact, surface.derivedFieldsInOrder);
  const text = serializeInsertionOrder(projected as JsonValue);
  const raw = new TextEncoder().encode(text);
  return { raw, text };
}
