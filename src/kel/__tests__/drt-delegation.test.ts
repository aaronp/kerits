import { describe, expect, test } from 'bun:test';
import {
  canonicalizeEvent, decodeKey, digestVerfer, encodeSignature, KELEvents, KELOps, KeriKeyPairs, sign,
} from '../../index.js';
import type { CESREvent, KELEvent, KeriKeyPair } from '../../index.js';

const sig = (ev: KELEvent, kp: KeriKeyPair) =>
  encodeSignature(sign(canonicalizeEvent(ev), decodeKey(kp.privateKey).raw), true).qb64;
const signed = (ev: KELEvent, kps: KeriKeyPair[]): CESREvent =>
  KELEvents.assembleSignedEvent({ event: ev, signatures: kps.map((k, i) => ({ keyIndex: i, ondex: i, sig: sig(ev, k) })) });

describe('validateKelChain — drt delegation', () => {
  test('delegated KEL with dip + drt validates against sealing parent', () => {
    // setup: parent icp, child dip sealed by parent ixn, child drt sealed by second parent ixn
    const [P0, P1, C0, C1, C2] = [200, 201, 1, 2, 3].map(KeriKeyPairs.fromSeedNumber);
    const picp = KELEvents.finalize(KELEvents.buildIcp({ keys: [P0.publicKey], nextKeyDigests: [digestVerfer(P1.publicKey)] }).unsignedEvent, true).event;
    const dip = KELEvents.finalize(KELEvents.buildDip({ parentAid: picp.i, keys: [C0.publicKey], nextKeyDigests: [digestVerfer(C1.publicKey)] }).unsignedEvent, true).event;
    const pixn = KELEvents.finalize(KELEvents.buildIxn({ aid: picp.i, sequence: 1, priorEventSaid: picp.d, anchors: [{ i: dip.i, s: '0', d: dip.d }] }).unsignedEvent).event;
    const drt = KELEvents.finalize(KELEvents.buildDrt({ aid: dip.i, sequence: 1, priorEventSaid: dip.d, keys: [C1.publicKey], nextKeyDigests: [digestVerfer(C2.publicKey)], signingThreshold: '1', nextThreshold: '1' }).unsignedEvent).event;
    const pixn2 = KELEvents.finalize(KELEvents.buildIxn({ aid: picp.i, sequence: 2, priorEventSaid: pixn.d, anchors: [{ i: drt.i, s: '1', d: drt.d }] }).unsignedEvent).event;
    const parentKel = [signed(picp, [P0]), signed(pixn, [P0]), signed(pixn2, [P0])];
    const dipC = signed(dip, [C0]);
    dipC.attachments.push({ kind: 'delegator-seal-source', s: '1', d: pixn.d });
    const drtC = signed(drt, [C1]);
    drtC.attachments.push({ kind: 'delegator-seal-source', s: '2', d: pixn2.d });

    // method under test: validate the full delegated chain
    const result = KELOps.validateKelChain([dipC, drtC], { parentKel });

    // assertions: both dip and drt pass delegation
    expect(result.firstError).toBeUndefined();
    expect(result.valid).toBe(true);
  });
});
