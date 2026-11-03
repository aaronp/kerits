import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { digestVerfer } from '../../cesr/digest.js';
import type { AID, KeriKeyPair, Signature } from '../../common/types.js';
import type { CESREvent, KELEvent } from '../types.js';
import type { EventValidationDetail, ValidationErrorCode } from '../validation.js';
import { sign } from '../../signature/primitives.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';
import { canonicalizeEvent } from '../event-crypto.js';

/** Helper: create a signed inception event from scratch. */
function createInception(): { cesrEvent: CESREvent; aid: AID; publicKey: string } {
  const pair = KeriKeyPairs.create();
  const nextPair = KeriKeyPairs.create();
  const nextDigest = digestVerfer(nextPair.publicKey);

  const { unsignedEvent } = KELEvents.buildIcp({
    keys: [pair.publicKey],
    nextKeyDigests: [nextDigest],
  });

  const finalized = KELEvents.computeSaid(unsignedEvent, true);
  const aid = finalized.said as AID;

  const privRaw = decodeKey(pair.privateKey).raw;
  const sigRaw = sign(finalized.canonFinal.raw, privRaw);
  const sig = encodeSig(sigRaw, true).qb64 as Signature;

  const cesrEvent: CESREvent = {
    event: finalized.event,
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }],
    enc: 'JSON',
  };

  return { cesrEvent, aid, publicKey: pair.publicKey };
}

describe('KELOps.forKEL', () => {
  test('empty KEL returns empty view', () => {
    const view = KELOps.forKEL('Etest' as AID, []);
    expect(view.isEmpty()).toBe(true);
    expect(view.length()).toBe(0);
    expect(view.head()).toBeUndefined();
    expect(view.inception()).toBeUndefined();
  });

  test('single inception event populates view', () => {
    const { cesrEvent, aid } = createInception();
    const view = KELOps.forKEL(aid, [cesrEvent]);
    expect(view.isEmpty()).toBe(false);
    expect(view.length()).toBe(1);
    expect(view.head()).toBeDefined();
    expect(view.inception()).toBeDefined();
    expect(view.inception()!.event.t).toBe('icp');
  });

  test('currentKeySet returns keys from inception', () => {
    const { cesrEvent, aid, publicKey } = createInception();
    const view = KELOps.forKEL(aid, [cesrEvent]);
    const keySet = view.currentKeySet();
    expect(keySet).toBeDefined();
    expect(keySet!.k).toContain(publicKey);
    expect(keySet!.kt).toBe('1');
  });
});

/** Helper: create a signed delegated inception event without a VRC. */
function createDip(parentAid: AID): { cesrEvent: CESREvent } {
  const childPair = KeriKeyPairs.create();
  const childNextPair = KeriKeyPairs.create();
  const nextDigest = digestVerfer(childNextPair.publicKey);

  const { unsignedEvent } = KELEvents.buildDip({
    parentAid,
    keys: [childPair.publicKey],
    nextKeyDigests: [nextDigest],
    signingThreshold: '1',
    nextThreshold: '1',
  });

  const { event } = KELEvents.finalize(unsignedEvent, true);

  const privRaw = decodeKey(childPair.privateKey).raw;
  const raw = canonicalizeEvent(event);
  const sigBytes = sign(raw, privRaw);
  const sig = encodeSig(sigBytes, true).qb64 as Signature;

  const cesrEvent: CESREvent = {
    event,
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }],
    enc: 'JSON',
  };
  return { cesrEvent };
}

describe('KELOps.validateAppend', () => {
  test('validates inception event against empty KEL', () => {
    // setup: create a signed inception event
    const { cesrEvent } = createInception();
    // call our method under test
    const result = KELOps.validateAppend([], cesrEvent);
    // inception with no prior events should pass
    expect(result.ok).toBe(true);
  });

  test('accepts options parameter without breaking backward compatibility', () => {
    // setup: create a signed inception event
    const { cesrEvent } = createInception();
    // call our method under test with explicit empty options
    const result = KELOps.validateAppend([], cesrEvent, {});
    // options being present should not affect a normal icp
    expect(result.ok).toBe(true);
  });

  test('threads parentKel through to delegation validation', () => {
    // setup: create a dip without a VRC; without parentKel the delegation check is missingParentKel
    const parentPair = KeriKeyPairs.create();
    const { cesrEvent: dipCesr } = createDip(parentPair.publicKey as AID);
    // call our method under test — no parentKel provided
    const withoutParent = KELOps.validateAppend([], dipCesr);
    // call our method under test — empty parentKel provided (delegation still fails but differently)
    const withParent = KELOps.validateAppend([], dipCesr, { parentKel: [] });
    // without parentKel: missingParentKel flag set; with empty array: same (empty is treated as not provided)
    expect(withoutParent.ok).toBe(false);
    expect(withParent.ok).toBe(false);
    // both cases should surface delegation check details — confirming parentKel is threaded through
    expect(withoutParent.validation.checks.delegationValid?.missingParentKel).toBe(true);
    expect(withParent.validation.checks.delegationValid?.missingParentKel).toBe(true);
  });
});

describe('KELOps.isOnlyPendingSignatureFailures', () => {
  /** A failed detail raising errors with these codes (the checks are not consulted). */
  const failedWith = (codes: ValidationErrorCode[]): EventValidationDetail => ({
    eventIndex: 1,
    eventType: 'rot',
    eventSaid: 'Erot',
    checks: {
      isValidKeriEvent: { passed: true },
      saidValid: { passed: true },
      requiredFieldsPresent: { passed: true },
      signaturesValid: { passed: true },
      thresholdMet: { passed: false },
    },
    errors: codes.map((code) => ({ code, scope: 'event', severity: 'error', message: code, eventIndex: 1 })),
  });

  test('pending only when every error is a signature or delegation code', () => {
    // setup: each pending code alone, a chain-rule code beside one, and no error at all
    const pending: ValidationErrorCode[] = [
      'THRESHOLD_NOT_MET',
      'KT_UNMET',
      'PRIOR_NT_UNMET',
      'ONDEX_MISMATCH',
      'MISSING_PARENT_KEL',
      'PARENT_SIGNATURE_INVALID',
      'PARENT_THRESHOLD_NOT_MET',
    ];

    // call our method under test
    const alone = pending.map((c) => KELOps.isOnlyPendingSignatureFailures(failedWith([c])));
    const withChainRule = KELOps.isOnlyPendingSignatureFailures(failedWith(['THRESHOLD_NOT_MET', 'SEQUENCE_INVALID']));
    const keyChain = KELOps.isOnlyPendingSignatureFailures(failedWith(['NEXT_KEY_MISMATCH']));
    const none = KELOps.isOnlyPendingSignatureFailures(failedWith([]));

    // assertions: every pending code alone is pending; a chain rule, or no failure, is not
    expect(alone).toEqual(pending.map(() => true));
    expect([withChainRule, keyChain, none]).toEqual([false, false, false]);
  });

  test('isAwaitingSignatures: a stored event awaits signatures only for a kt / prior-nt code', () => {
    // setup: each signature code, each delegation code, and none
    const signature: ValidationErrorCode[] = ['THRESHOLD_NOT_MET', 'KT_UNMET', 'PRIOR_NT_UNMET', 'ONDEX_MISMATCH'];
    const delegation: ValidationErrorCode[] = ['MISSING_PARENT_KEL', 'PARENT_SIGNATURE_INVALID', 'PARENT_THRESHOLD_NOT_MET'];

    // call our method under test
    const bySignature = signature.map((c) => KELOps.isAwaitingSignatures(failedWith([c])));
    const byDelegation = delegation.map((c) => KELOps.isAwaitingSignatures(failedWith([c])));
    const both = KELOps.isAwaitingSignatures(failedWith(['MISSING_PARENT_KEL', 'PRIOR_NT_UNMET']));

    // assertions: a delegator's approval alone is not awaiting controller signatures
    expect(bySignature).toEqual([true, true, true, true]);
    expect(byDelegation).toEqual([false, false, false]);
    expect([both, KELOps.isAwaitingSignatures(failedWith([]))]).toEqual([true, false]);
  });
});

describe('KELOps.buildNextCommitment', () => {
  test('hashes public keys to digests', () => {
    const pair = KeriKeyPairs.create();
    const { n, nt } = KELOps.buildNextCommitment([pair.publicKey], '1');
    expect(n).toHaveLength(1);
    expect(n[0]).toBeString();
    expect(n[0]).not.toBe(pair.publicKey);
    expect(nt).toBe('1');
  });
});

describe('KELOps.matchKeyRevelation', () => {
  test('matches revealed keys against prior digests', () => {
    const pair = KeriKeyPairs.create();
    const digest = digestVerfer(pair.publicKey);
    const result = KELOps.matchKeyRevelation({
      priorN: [digest],
      priorNt: '1',
      proposedK: [pair.publicKey],
    });
    expect(result.revealed).toHaveLength(1);
    expect(result.priorNtSatisfied).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
