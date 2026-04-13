/**
 * KEL Rotation - Key Revelation Resolution
 *
 * In KERI, when you rotate keys, your NEW signing keys must exactly match
 * what the PRIOR event committed to in its next key digests (n[]) and
 * next threshold (nt). This module provides a pure function to resolve
 * committed digests back to their public keys.
 *
 * @module kel/rotation
 */

import { digestVerfer } from '../cesr/digest.js';
import type { Threshold } from '../common/types.js';
import { checkThreshold } from './threshold.js';

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

  // Build digest->nIndex map for O(1) lookup
  const digestToNIndex = new Map<string, number>();
  for (let i = 0; i < priorN.length; i++) {
    digestToNIndex.set(priorN[i]!, i);
  }

  const revealed: { kIndex: number; nIndex: number }[] = [];
  const augmented: number[] = [];
  const matchedNIndices = new Set<number>();

  for (let kIdx = 0; kIdx < proposedK.length; kIdx++) {
    const keyDigest = digestVerfer(proposedK[kIdx]!);
    const nIdx = digestToNIndex.get(keyDigest);

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
  let priorNtSatisfied = false;
  if (matchedIndices.length > 0) {
    const thresholdResult = checkThreshold(priorNt, matchedIndices, priorN.length);
    priorNtSatisfied = thresholdResult.satisfied;
  }

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
 * Assert that a simple numeric threshold kt is satisfiable given the
 * number of signing keys. Throws if kt exceeds kLength.
 */
export function assertCurrentThresholdSatisfiable(kt: Threshold, kLength: number): void {
  const numericKt = typeof kt === 'string' ? Number.parseInt(kt, 10) : Number.NaN;
  if (!Number.isNaN(numericKt) && numericKt > kLength) {
    throw new Error(`Current threshold not satisfiable: kt=${kt} but only ${kLength} signing keys provided`);
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
