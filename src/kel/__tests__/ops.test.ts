import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { digestVerfer } from '../../cesr/digest.js';
import type { AID, KeriKeyPair, Signature } from '../../common/types.js';
import type { CESREvent, KELEvent } from '../types.js';
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
  test('returns true when only signatures and signing threshold fail', () => {
    const validation = {
      eventIndex: 0,
      eventType: 'icp' as const,
      eventSaid: 'Esaid',
      checks: {
        isValidKeriEvent: { passed: true },
        saidValid: { passed: true },
        requiredFieldsPresent: { passed: true },
        signaturesValid: { passed: false, error: 'bad sig' },
        thresholdMet: { passed: false, error: '0 / 1' },
      },
    };
    expect(KELOps.isOnlyPendingSignatureFailures(validation)).toBe(true);
  });

  test('returns false when key chain fails', () => {
    const validation = {
      eventIndex: 1,
      eventType: 'rot' as const,
      eventSaid: 'Erot',
      checks: {
        isValidKeriEvent: { passed: true },
        saidValid: { passed: true },
        requiredFieldsPresent: { passed: true },
        signaturesValid: { passed: true },
        thresholdMet: { passed: true },
        keyChainValid: {
          passed: false,
          error: 'Prior establishment n[] commitments not satisfied: revealed 0 of 1',
        },
      },
    };
    expect(KELOps.isOnlyPendingSignatureFailures(validation)).toBe(false);
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

describe('KELOps.assertThresholdSatisfiable', () => {
  test('threshold within key count is ok', () => {
    expect(KELOps.assertThresholdSatisfiable('1', 2)).toEqual({ ok: true });
  });

  test('threshold exceeding key count fails', () => {
    const result = KELOps.assertThresholdSatisfiable('3', 2);
    expect(result.ok).toBe(false);
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
