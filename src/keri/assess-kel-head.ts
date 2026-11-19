/**
 * A service's assessment of a published KEL head: an `rpy /ksa` signed by a non-transferable (`B`) Ed25519 key.
 * Pure: the caller supplies the KEL, its delegator's KEL, the seed and the time.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { encodeKey } from '../cesr/keys.js';
import { type AID, SequenceNumber } from '../common/types.js';
import { validateDelegation } from '../kel/delegation-validation.js';
import { type CESREvent, KSNs } from '../kel/types.js';
import { validateKelChain } from '../kel/validation.js';
import { err, ok, type Result } from '../result.js';
import { type KeyStateAssessment, RpyKsa } from './rpy-ksa.js';

export type AttestRefusal = { kind: 'not-published' } | { kind: 'invalid-kel'; reason: string };

type Outstanding = Extract<KeyStateAssessment['validation'], { status: 'pending' }>['outstanding'][number];

/** Delegation failures that only mean the delegator has not (yet) published its anchor; any other failure is invalid. */
const ANCHOR_MISSING = new Set<string>(['missing-parent-kel', 'missing-seal-source', 'parent-event-not-found']);

/** The service's identifier: the seed's Ed25519 public key, non-transferable qb64 (`B` prefix). */
export function serviceAidOf(seed: Uint8Array): string {
  return encodeKey(ed25519.getPublicKey(seed), false).qb64;
}

/**
 * Sign an `rpy /ksa` assessing the head of `kel`: `valid` when every check passes, `pending` when the only failures are
 * delegator anchors missing from `delegatorKel`; any other failure is refused as `invalid-kel`.
 */
export function assessKelHead(input: {
  aid: string;
  kel: readonly CESREvent[];
  delegatorKel?: readonly CESREvent[];
  seed: Uint8Array;
  now: Date;
}): Result<{ rpy: Uint8Array; assessment: KeyStateAssessment }, AttestRefusal> {
  const { aid, kel, delegatorKel, seed, now } = input;
  if (kel.length === 0) return err({ kind: 'not-published' });

  const inception = kel[0]!.event;
  if (inception.i !== aid) return err({ kind: 'invalid-kel', reason: 'KEL is not for aid' });

  // every check but the delegator's anchors (SAIDs, chain, signatures, thresholds, commitments): without the
  // delegator's KEL the only tolerated failure is MISSING_PARENT_KEL, as in the store's KEL rules
  for (const detail of validateKelChain([...kel]).eventDetails) {
    const failure = detail.errors.find((e) => e.code !== 'MISSING_PARENT_KEL');
    if (failure) return err({ kind: 'invalid-kel', reason: failure.code });
    // a dropped signature is junk (invalid, or naming no key), except an ondex-mismatch
    if ((detail.checks.signaturesValid.dropped ?? []).some((x) => x.reason !== 'ondex-mismatch')) {
      return err({ kind: 'invalid-kel', reason: 'invalid signature' });
    }
  }

  const delegatorAid = inception.t === 'dip' ? inception.di : undefined;
  const outstanding: Outstanding[] = [];
  let validatedCount = 0; // events kel[0..validatedCount) are fully valid
  for (const childEvent of kel) {
    const { t, d } = childEvent.event;
    if (t === 'dip' || t === 'drt') {
      // an unparseable seal-source sn would read as "parent event not found" (pending): refuse it instead
      const source = childEvent.attachments.find((a) => a.kind === 'delegator-seal-source');
      if (source?.kind === 'delegator-seal-source' && !SequenceNumber.parse(source.s).ok) {
        return err({ kind: 'invalid-kel', reason: 'malformed seal source' });
      }
      const approved = validateDelegation({
        childEvent,
        parentKel: delegatorKel,
        delegatorAid,
      });
      if (!approved.passed) {
        if (!ANCHOR_MISSING.has(approved.reason) || approved.parentAid === undefined) {
          return err({ kind: 'invalid-kel', reason: approved.reason });
        }
        outstanding.push({ type: 'delegation-approval', eventSaid: d, delegatorAid: approved.parentAid });
      }
    }
    if (outstanding.length === 0) validatedCount++;
  }

  const ksn = KSNs.fromKEL(aid as AID, [...kel]);
  if (!ksn) return err({ kind: 'invalid-kel', reason: 'no key state' });
  // the signing keys and threshold in force at the newest fully valid event
  const atValidated = validatedCount === 0 ? undefined : KSNs.fromKEL(aid as AID, kel.slice(0, validatedCount));
  const validatedKt = atValidated?.kt;
  if (atValidated !== undefined && typeof validatedKt !== 'string') {
    return err({ kind: 'invalid-kel', reason: 'key state not attestable' });
  }
  const validatedHead: KeyStateAssessment['validatedHead'] =
    atValidated === undefined || typeof validatedKt !== 'string'
      ? null
      : { s: atValidated.s, d: atValidated.d, k: atValidated.k, kt: validatedKt };
  const assessment: KeyStateAssessment = {
    ksn,
    validation: outstanding.length === 0 ? { status: 'valid' } : { status: 'pending', outstanding },
    validatedHead,
    assessedAt: now.toISOString(),
  };
  const { body } = RpyKsa.build(assessment, now);
  const rpy = RpyKsa.attach(body, serviceAidOf(seed), ed25519.sign(body, seed));
  // the parser is the format's gate: e.g. a weighted kt is not attestable
  if (!RpyKsa.parse(rpy).ok) return err({ kind: 'invalid-kel', reason: 'key state not attestable' });
  return ok({ rpy, assessment });
}
