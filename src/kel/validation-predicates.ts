/**
 * KEL Validation Predicates
 *
 * Pure functions for validating KEL attachments and anchors.
 * These are independently testable building blocks used by validation.ts
 * and available to SDK consumers.
 *
 * NOTE: Witness receipt verification assumes non-transferable basic witness identifiers:
 * the identifier prefix directly encodes the current verification key.
 * If transferable witnesses or non-basic identifier types enter scope,
 * verifyWitnessReceipt must be replaced with witness key state resolution.
 */

import type { AID, PublicKey, Signature, Threshold } from '../common/types.js';
import { verifyEventSignature } from './event-crypto.js';
import { checkNormalizedThreshold, normalizeThreshold } from './threshold-normalize.js';
import type { KELEvent } from './types.js';

/**
 * Verify a witness receipt signature against an event's canonical bytes.
 *
 * Decodes the witness identifier prefix as the public verification key
 * under the non-transferable basic identifier model, then verifies the
 * signature against the event's canonical (RFC8785) JSON bytes.
 *
 * Fails closed: if the identifier prefix is not decodable as a basic
 * non-transferable public key, returns false. Model-incompatible identifiers
 * are not distinguished from invalid signatures — intentional simplicity.
 * The caller is responsible for only passing receipts whose `by` is a basic
 * non-transferable identifier.
 *
 * @param receipt - Witness receipt with AID and signature
 * @param event - The KEL event the receipt should cover
 * @returns true if the signature verifies
 */
export function verifyWitnessReceipt(receipt: { by: AID; sig: Signature }, event: KELEvent): boolean {
  return verifyEventSignature(event, receipt.by as unknown as PublicKey, receipt.sig);
}

/**
 * Result of VRC aggregate verification.
 * Discriminated union with typed reason codes.
 */
export type VrcVerificationResult =
  | { passed: true; validKeyIndices: number[] }
  | {
      passed: false;
      reason: 'cid-mismatch' | 'signature-invalid' | 'key-index-out-of-range' | 'threshold-not-met';
      validKeyIndices: number[];
    };

// Failure precedence levels (higher = dominates)
const FAILURE_PRECEDENCE: Record<string, number> = {
  'key-index-out-of-range': 3,
  'cid-mismatch': 2,
  'signature-invalid': 1,
  'threshold-not-met': 0,
};

/**
 * Aggregate VRC verification: validates attachment structure, verifies each
 * signature individually, and evaluates the aggregate threshold.
 *
 * All attachments are always processed. Precedence only determines the
 * surfaced failure reason when multiple failures coexist:
 * key-index-out-of-range > cid-mismatch > signature-invalid > threshold-not-met
 *
 * @param vrcAttachments - VRC attachments to verify
 * @param event - The child event the VRCs should endorse
 * @param parentEstablishment - Parent's establishment event key list and threshold
 * @returns Structured result with typed reason on failure
 */
export function verifyVrcAgainstThreshold(
  vrcAttachments: Array<{ cid: string; seal: { s: string; d: string }; sig: Signature; keyIndex?: number }>,
  event: KELEvent,
  parentEstablishment: { k: PublicKey[]; kt: Threshold },
): VrcVerificationResult {
  const validKeyIndices = new Set<number>();
  type FailureReason = 'cid-mismatch' | 'signature-invalid' | 'key-index-out-of-range';
  let highestFailure: { reason: FailureReason; precedence: number } | undefined;

  function recordFailure(reason: 'cid-mismatch' | 'signature-invalid' | 'key-index-out-of-range') {
    const precedence = FAILURE_PRECEDENCE[reason]!;
    if (!highestFailure || precedence > highestFailure.precedence) {
      highestFailure = { reason, precedence };
    }
  }

  for (const vrc of vrcAttachments) {
    const keyIndex = vrc.keyIndex ?? 0;

    // Check key index bounds first — higher precedence than CID mismatch
    if (keyIndex < 0 || keyIndex >= parentEstablishment.k.length) {
      recordFailure('key-index-out-of-range');
      continue;
    }

    // Check CID binding
    if (vrc.cid !== event.d) {
      recordFailure('cid-mismatch');
      continue;
    }

    // Verify signature
    const publicKey = parentEstablishment.k[keyIndex]!;
    const isValid = verifyEventSignature(event, publicKey, vrc.sig);

    if (isValid) {
      validKeyIndices.add(keyIndex); // Set ensures no double-counting
    } else {
      recordFailure('signature-invalid');
    }
  }

  const sortedIndices = Array.from(validKeyIndices).sort((a, b) => a - b);

  // Check threshold — normalize raw threshold first, then check against valid indices
  let thresholdMet = false;
  try {
    const normalized = normalizeThreshold(parentEstablishment.kt, parentEstablishment.k.length);
    const thresholdResult = checkNormalizedThreshold(normalized, validKeyIndices);
    thresholdMet = thresholdResult.satisfied;
  } catch {
    thresholdMet = false;
  }

  if (thresholdMet) {
    return { passed: true, validKeyIndices: sortedIndices };
  }

  // Determine failure reason: highest-precedence per-attachment failure, or threshold-not-met
  const reason = highestFailure?.reason ?? 'threshold-not-met';
  return { passed: false, reason, validKeyIndices: sortedIndices };
}

/**
 * SAID-only anchor check: does any entry in the event's `a[]` array have
 * a `d` field matching `sealedSAID`?
 *
 * This is a convenience predicate for delegation anchoring, NOT a full
 * generic seal matcher. It matches SAID only — ignores seal type, sequence
 * number, and other seal fields. Not suitable for generic seal validation.
 *
 * @param event - Any KEL event (checks `a` field if present)
 * @param sealedSAID - The SAID to look for in anchor entries
 * @returns true if any anchor entry's `d` matches sealedSAID
 */
export function eventContainsAnchorForSaid(event: KELEvent, sealedSAID: string): boolean {
  const anchors = (event as Record<string, unknown>).a;
  if (!Array.isArray(anchors)) return false;

  return anchors.some(
    (entry) => typeof entry === 'object' && entry !== null && 'd' in entry && (entry as { d: string }).d === sealedSAID,
  );
}

/**
 * Is a specific parent event a delegation anchor for the given delegated event SAID?
 *
 * Checks that the parent event type can carry delegation seals (ixn, rot, drt)
 * and that its `a[]` contains a matching SAID.
 *
 * This is a convenience pre-check, not sufficient proof of delegation anchoring
 * on its own. Complete verification also requires: finding the sealing event in
 * the parent KEL, and verifying the sealing event itself is valid in its own
 * KEL context.
 *
 * @param parentEvent - A parent KEL event to check
 * @param delegatedEventSAID - The SAID of the delegated event
 * @returns true if parentEvent is a valid anchor for the delegated event
 */
export function isDelegationAnchor(parentEvent: KELEvent, delegatedEventSAID: string): boolean {
  // Only ixn, rot, and drt can carry delegation seals
  if (parentEvent.t !== 'ixn' && parentEvent.t !== 'rot' && parentEvent.t !== 'drt') {
    return false;
  }
  return eventContainsAnchorForSaid(parentEvent, delegatedEventSAID);
}
