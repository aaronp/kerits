/**
 * KEL Rotation - key revelation and rotation planning.
 *
 * Spec: https://trustoverip.github.io/kswg-keri-specification/#general-pre-rotation
 *
 * Rules:
 * - No persistent key slots: a rotation's k and n are fresh lists and compact.
 *   A current key carries over only if listed explicitly (`keep`).
 * - Partial rotation: revealed prior-next keys need only meet the prior nt;
 *   unrevealed commitments may be carried forward into the new n (`carryNext`).
 * - Augmented rotation: new keys (`add`) sign immediately but never count toward the prior nt.
 * - Signatures satisfy thresholds, not presence in k: the prior nt counts signatures by
 *   revealed keys (digest + ondex); the new kt counts signatures by any key in k.
 *
 * @module kel/rotation
 */

import { digestVerfer, verferMatchesDigest } from '../cesr/digest.js';
import { type PublicKey, Threshold } from '../common/types.js';
import { err, ok, type Result } from '../result.js';

/**
 * Resolve the current signing keys for a rotation event by looking up the
 * public keys that match the prior event's next key digest commitments.
 *
 * The KERI key revelation rule requires that each key in the rotation event's
 * k[] array is the pre-image of the corresponding digest in the prior event's
 * n[] array. The threshold (kt) is simply carried forward from the prior
 * event's nt.
 *
 * @param priorKsn - The prior event's next key commitments
 * @param priorKsn.n - Array of blake3 CESR qb64 digests of the next public keys
 * @param priorKsn.nt - The next signing threshold committed in the prior event
 * @param lookupKey - Async function that resolves a digest to its public key
 * @returns The resolved signing keys and threshold for the rotation event
 * @throws Error if any committed digest cannot be resolved to a public key
 */
export async function resolveCurrentKeys(
  priorKsn: { n: string[]; nt: Threshold },
  lookupKey: (digest: string) => Promise<string | undefined>,
): Promise<{ k: string[]; kt: Threshold }> {
  const k: string[] = [];

  for (const digest of priorKsn.n) {
    const publicKey = await lookupKey(digest);
    if (publicKey === undefined) {
      throw new Error(
        `Cannot resolve next key digest: ${digest}. The public key for this committed digest was not found.`,
      );
    }
    k.push(publicKey);
  }

  return { k, kt: priorKsn.nt };
}

// ---------------------------------------------------------------------------
// Subset-based key revelation matching
// ---------------------------------------------------------------------------

export interface MatchKeyRevelationInput {
  priorN: string[];
  priorNt: Threshold;
  proposedK: string[];
}

export interface MatchKeyRevelationResult {
  revealed: { kIndex: number; nIndex: number }[];
  augmented: number[];
  priorNtSatisfied: boolean;
  errors: string[];
}

/**
 * Match proposed signing keys against the prior event's next key digest
 * commitments, supporting subset revelation and key augmentation.
 *
 * Unlike `assertKeyRevelation` (which requires a 1:1 positional match),
 * this function allows:
 * - Revealing only a subset of committed keys (must still meet nt threshold)
 * - Augmenting the key set with fresh keys that were not pre-committed
 *
 * Keys whose digest matches an entry in priorN are classified as "revealed".
 * Keys with no matching digest are classified as "augmented".
 * Only revealed keys count toward satisfying priorNt.
 */
export function matchKeyRevelation(input: MatchKeyRevelationInput): MatchKeyRevelationResult {
  const { priorN, priorNt, proposedK } = input;
  const errors: string[] = [];

  // Reject duplicate digests in priorN
  const digestSet = new Set<string>();
  for (const digest of priorN) {
    if (digestSet.has(digest)) {
      errors.push(`Ambiguous prior n[]: duplicate digest ${digest}`);
      return { revealed: [], augmented: [], priorNtSatisfied: false, errors };
    }
    digestSet.add(digest);
  }

  const revealed: { kIndex: number; nIndex: number }[] = [];
  const augmented: number[] = [];
  const matchedNIndices = new Set<number>();

  for (let kIdx = 0; kIdx < proposedK.length; kIdx++) {
    // each commitment is hashed with its own digest code (as keripy)
    const found = priorN.findIndex((d) => verferMatchesDigest(proposedK[kIdx]!, d));
    const nIdx = found === -1 ? undefined : found;

    if (nIdx !== undefined && !matchedNIndices.has(nIdx)) {
      revealed.push({ kIndex: kIdx, nIndex: nIdx });
      matchedNIndices.add(nIdx);
    } else if (nIdx !== undefined && matchedNIndices.has(nIdx)) {
      errors.push(`Key at k[${kIdx}] matches n[${nIdx}] which was already matched by another key`);
    } else {
      augmented.push(kIdx);
    }
  }

  if (errors.length > 0) {
    return { revealed, augmented, priorNtSatisfied: false, errors };
  }

  // Check threshold satisfaction using matched nIndex values against priorN.length
  const matchedIndices = revealed.map((r) => r.nIndex);
  const priorNtSatisfied = meetsThreshold(priorNt, matchedIndices, priorN.length);

  return { revealed, augmented, priorNtSatisfied, errors };
}

/**
 * Assert that a set of proposed signing keys satisfies the prior event's
 * next key digest commitments (n[]/nt) using subset-based matching.
 *
 * Delegates to `matchKeyRevelation()` and throws if:
 * - There are errors (e.g. duplicate digests in priorN)
 * - The prior next threshold (nt) is not satisfied by revealed keys
 */
export function assertKeyRevelation(priorKsn: { n: string[]; nt: Threshold }, proposedK: string[]): void {
  const result = matchKeyRevelation({
    priorN: priorKsn.n,
    priorNt: priorKsn.nt,
    proposedK,
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.join('; '));
  }

  if (!result.priorNtSatisfied) {
    throw new Error(
      `Prior-next threshold not satisfied: nt=${JSON.stringify(priorKsn.nt)}, revealed ${result.revealed.length} of ${priorKsn.n.length} committed keys`,
    );
  }
}

/**
 * Hash next public keys into their blake3 CESR qb64 digests to form
 * the next key commitment for an establishment event.
 *
 * @param nextPublicKeys - The public keys to commit to
 * @param nextThreshold - The signing threshold for the next key set
 * @returns The n[] digests and nt threshold for inclusion in an establishment event
 */
export function buildNextCommitment(
  nextPublicKeys: string[],
  nextThreshold: Threshold,
): { n: string[]; nt: Threshold } {
  const n = nextPublicKeys.map((key) => digestVerfer(key));
  return { n, nt: nextThreshold };
}

// ---------------------------------------------------------------------------
// Rotation planner
// ---------------------------------------------------------------------------

export type RotationChange = {
  readonly keep?: readonly PublicKey[]; // current keys carried over explicitly
  readonly reveal: readonly PublicKey[]; // pre-images of prior n entries, revealed now
  readonly add?: readonly PublicKey[]; // augmented keys (no prior commitment)
  readonly carryNext?: readonly string[]; // prior n digests carried forward unrevealed
  readonly nextDigests: readonly string[]; // new next-key digests
  readonly kt: Threshold;
  readonly nt: Threshold;
};
/** ondex: prior-n index (revealed keys only). */
export type RotationSigner = { readonly kIndex: number; readonly ondex?: number };
export type RotationPlan = {
  readonly k: PublicKey[];
  readonly kt: Threshold;
  readonly n: string[];
  readonly nt: Threshold;
  /** The keys in `available` that sign, with their indices. */
  readonly signers: RotationSigner[];
};
export type RotationPlanError =
  | { kind: 'not-committed'; key: PublicKey }
  | { kind: 'prior-nt-unsatisfiable'; nt: Threshold; revealed: number }
  | { kind: 'kt-unsatisfiable-by'; kt: Threshold; available: number }
  | { kind: 'duplicate-key'; key: PublicKey }
  | { kind: 'invalid-threshold'; field: 'kt' | 'nt'; message: string };

/** Threshold met by these indices; a malformed or out-of-range threshold is simply not met. */
export function meetsThreshold(threshold: Threshold, indices: readonly number[], total: number): boolean {
  const parsed = Threshold.parse(threshold, total);
  return parsed.ok ? Threshold.satisfied(parsed.value, indices) : false;
}

/**
 * Plan a rotation. k is the kept keys, then the revealed keys, then the added keys.
 * n is the carried commitments, then the new digests. A removed key's commitment stays
 * in n when it is carried, so k and n need not stay paired.
 * Both thresholds must be satisfiable by the signatures of `available` alone
 * (the keys whose holder will sign this event).
 */
export function planRotation(
  prior: { k: PublicKey[]; kt: Threshold; n: string[]; nt: Threshold },
  change: RotationChange,
  available: readonly PublicKey[],
): Result<RotationPlan, RotationPlanError> {
  const match = matchKeyRevelation({ priorN: prior.n, priorNt: prior.nt, proposedK: [...change.reveal] });
  if (match.errors.length > 0) {
    throw new Error(`planRotation: invalid prior n: ${match.errors.join('; ')}`);
  } else if (match.augmented.length > 0) {
    return err({ kind: 'not-committed', key: change.reveal[match.augmented[0]!]! });
  } else {
    /* every revealed key is committed */
  }

  const k = [...(change.keep ?? []), ...change.reveal, ...(change.add ?? [])];
  const n = [...(change.carryNext ?? []), ...change.nextDigests];
  const revealOffset = change.keep?.length ?? 0;
  const ondexByKIndex = new Map(match.revealed.map((r) => [r.kIndex + revealOffset, r.nIndex]));

  // the new thresholds must be well formed for their lists (nt "0" with an empty n abandons the AID)
  const ktParsed = Threshold.parse(change.kt, k.length);
  const ntParsed = Threshold.parse(change.nt, n.length);
  if (!ktParsed.ok) {
    return err({ kind: 'invalid-threshold', field: 'kt', message: `kt: ${ktParsed.error.message}` });
  } else if (ktParsed.value.kind === 'numeric' && ktParsed.value.m < 1) {
    // keripy's builders reject a kt below 1 (nt "0" is allowed: abandonment)
    return err({ kind: 'invalid-threshold', field: 'kt', message: 'kt: threshold "0" is less than 1' });
  } else if (!ntParsed.ok) {
    return err({ kind: 'invalid-threshold', field: 'nt', message: `nt: ${ntParsed.error.message}` });
  } else {
    /* both thresholds well formed */
  }

  const seen = new Set<PublicKey>();
  for (const key of k) {
    if (seen.has(key)) {
      return err({ kind: 'duplicate-key', key });
    } else {
      seen.add(key);
    }
  }

  const availableSet = new Set(available);
  const signers: RotationSigner[] = [];
  k.forEach((key, kIndex) => {
    const ondex = ondexByKIndex.get(kIndex);
    if (!availableSet.has(key)) {
      /* holder not signing */
    } else if (ondex === undefined) {
      signers.push({ kIndex });
    } else {
      signers.push({ kIndex, ondex });
    }
  });

  // prior nt: only revealed keys that will sign, by ondex
  const ondices = signers.flatMap((s) => (s.ondex === undefined ? [] : [s.ondex]));
  if (!meetsThreshold(prior.nt, ondices, prior.n.length)) {
    return err({ kind: 'prior-nt-unsatisfiable', nt: prior.nt, revealed: ondices.length });
  } else if (
    !meetsThreshold(
      change.kt,
      signers.map((s) => s.kIndex),
      k.length,
    )
  ) {
    // new kt: any key that will sign
    return err({ kind: 'kt-unsatisfiable-by', kt: change.kt, available: signers.length });
  } else {
    return ok({ k, kt: change.kt, n, nt: change.nt, signers });
  }
}
