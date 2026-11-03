import { describe, expect, test } from 'bun:test';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { digestVerfer } from '../../cesr/digest.js';
import { sign } from '../../signature/primitives.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';
import type { Signature } from '../../common/types.js';

describe('KELEvents.assembleSignedEvent', () => {
  test('assembles a CESREvent from event + signatures', () => {
    const pair = KeriKeyPairs.create();
    const nextPair = KeriKeyPairs.create();
    const nextDigest = digestVerfer(nextPair.publicKey);

    const { unsignedEvent } = KELEvents.buildIcp({
      keys: [pair.publicKey],
      nextKeyDigests: [nextDigest],
    });
    const finalized = KELEvents.computeSaid(unsignedEvent, true);

    const privRaw = decodeKey(pair.privateKey).raw;
    const sigRaw = sign(finalized.canonFinal.raw, privRaw);
    const sig = encodeSig(sigRaw, true).qb64 as Signature;

    const cesrEvent = KELEvents.assembleSignedEvent({
      event: finalized.event,
      signatures: [{ keyIndex: 0, sig }],
    });

    expect(cesrEvent.event).toBe(finalized.event);
    expect(cesrEvent.attachments).toHaveLength(1);
    expect(cesrEvent.enc).toBe('JSON');
    expect(cesrEvent.attachments[0].kind).toBe('sig');
  });

  test('supports multiple signatures', () => {
    const pair1 = KeriKeyPairs.create();
    const pair2 = KeriKeyPairs.create();
    const nextPair = KeriKeyPairs.create();
    const nextDigest = digestVerfer(nextPair.publicKey);

    const { unsignedEvent } = KELEvents.buildIcp({
      keys: [pair1.publicKey, pair2.publicKey],
      nextKeyDigests: [nextDigest],
      signingThreshold: '2',
    });
    const finalized = KELEvents.computeSaid(unsignedEvent, true);

    const sig1 = encodeSig(sign(finalized.canonFinal.raw, decodeKey(pair1.privateKey).raw), true).qb64 as Signature;
    const sig2 = encodeSig(sign(finalized.canonFinal.raw, decodeKey(pair2.privateKey).raw), true).qb64 as Signature;

    const cesrEvent = KELEvents.assembleSignedEvent({
      event: finalized.event,
      signatures: [
        { keyIndex: 0, sig: sig1 },
        { keyIndex: 1, sig: sig2 },
      ],
    });

    expect(cesrEvent.attachments).toHaveLength(2);
  });
});

describe('KELEvents.signatureOndex', () => {
  test('non-rotation events default ondex to index; rotations only carry an explicit ondex', () => {
    // setup: an icp and a rot body (only the ilk matters)
    const pair = KeriKeyPairs.create();
    const icp = KELEvents.computeSaid(
      KELEvents.buildIcp({ keys: [pair.publicKey], nextKeyDigests: [digestVerfer(pair.publicKey)] }).unsignedEvent,
      true,
    ).event;
    const rot = KELEvents.computeSaid(
      KELEvents.buildRot({
        aid: icp.i,
        sequence: 1,
        priorEventSaid: icp.d,
        keys: [pair.publicKey],
        nextKeyDigests: [digestVerfer(pair.publicKey)],
        signingThreshold: '1',
        nextThreshold: '1',
      }).unsignedEvent,
      false,
    ).event;

    // call our method under test
    const ondices = [
      KELEvents.signatureOndex(icp, 1, undefined),
      KELEvents.signatureOndex(rot, 1, undefined),
      KELEvents.signatureOndex(rot, 1, 2),
    ];

    // assertions: icp both lists (keripy default), rot current-only unless planned
    expect(ondices).toEqual([1, undefined, 2]);
  });
});
