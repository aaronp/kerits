import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { digestVerfer } from '../../cesr/digest.js';
import type { AID, Signature } from '../../common/types.js';
import type { CESREvent } from '../types.js';
import { sign } from '../../signature/primitives.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';

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

describe('KELOps.validateAppend', () => {
  test('validates inception event against empty KEL', () => {
    const { cesrEvent } = createInception();
    const result = KELOps.validateAppend([], cesrEvent);
    expect(result.ok).toBe(true);
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
