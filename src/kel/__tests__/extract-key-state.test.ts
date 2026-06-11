import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { digestVerfer } from '../../cesr/digest.js';
import type { AID, Signature, PublicKey } from '../../common/types.js';
import type { CESREvent } from '../types.js';
import { sign } from '../../signature/primitives.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';

// helper: create a signed inception event (same pattern as ops.test.ts)
function createSignedInception(): { cesrEvent: CESREvent; aid: AID; publicKey: PublicKey } {
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

  return { cesrEvent, aid, publicKey: pair.publicKey as PublicKey };
}

describe('KELOps.extractKeyState', () => {
  test('valid KEL returns key state with correct AID and keys', () => {
    // setup: create a valid signed inception event
    const { cesrEvent, aid, publicKey } = createSignedInception();

    // method under test: extractKeyState on a valid single-event KEL
    const result = KELOps.extractKeyState([cesrEvent]);

    // assertions: key state should reflect the inception event
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.keyState.aid).toBe(aid);
      expect(result.keyState.currentKeys).toContain(publicKey);
      expect(result.keyState.seqNo).toBe(0);
      expect(result.keyState.threshold).toBe('1');
    }
  });

  test('empty events returns missing-inception', () => {
    // setup: no events

    // method under test: extractKeyState with empty array
    const result = KELOps.extractKeyState([]);

    // assertions: should fail with missing-inception
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('missing-inception');
    }
  });

  test('broken chain returns broken-chain', () => {
    // setup: create a valid inception then tamper its SAID
    const { cesrEvent } = createSignedInception();
    const tampered: CESREvent = {
      ...cesrEvent,
      event: { ...cesrEvent.event, d: 'Etampered_said___________________________________' },
    };

    // method under test: extractKeyState with a tampered event
    const result = KELOps.extractKeyState([tampered]);

    // assertions: should fail with broken-chain
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('broken-chain');
    }
  });
});
