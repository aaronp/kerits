import { describe, expect, test } from 'bun:test';
import { KeriKeyPairs } from '../../crypto/index.js';
import { digestVerfer } from '../../cesr/digest.js';
import { KELEvents } from '../events.js';
import { reduceKelState } from '../kel-state.js';
import type { AID, SAID } from '../../common/types.js';
import type { CESREvent } from '../types.js';

// Deterministic keys
const ALICE = KeriKeyPairs.fromSeedNumber(1);
const ALICE_NEXT = KeriKeyPairs.fromSeedNumber(2);
const ALICE_ROT_NEXT = KeriKeyPairs.fromSeedNumber(3);

function wrapEvent(event: any): CESREvent {
  return { event, attachments: [], enc: 'JSON' };
}

function buildIcp(keys = [ALICE], nextKeys = [ALICE_NEXT]) {
  const nextDigests = nextKeys.map((k) => digestVerfer(k.publicKey));
  const { unsignedEvent } = KELEvents.buildIcp({
    keys: keys.map((k) => k.publicKey),
    nextKeyDigests: nextDigests,
    signingThreshold: '1',
    nextThreshold: '1',
  });
  const { event } = KELEvents.finalize(unsignedEvent, true);
  return event;
}

const WITNESS_A = KeriKeyPairs.fromSeedNumber(200);
const WITNESS_B = KeriKeyPairs.fromSeedNumber(201);

function buildRot(
  icpEvent: any,
  priorSaid: string,
  newKeys = [ALICE_NEXT],
  nextKeys = [ALICE_ROT_NEXT],
  opts: { witnesses?: { br?: string[]; ba?: string[] }; bt?: string; config?: string[] } = {},
) {
  const nextDigests = nextKeys.map((k) => digestVerfer(k.publicKey));
  const { unsignedEvent } = KELEvents.buildRot({
    aid: icpEvent.i,
    sequence: '1',
    priorEventSaid: priorSaid,
    keys: newKeys.map((k) => k.publicKey),
    nextKeyDigests: nextDigests,
    signingThreshold: '1',
    nextThreshold: '1',
    witnessThreshold: opts.bt,
    witnessesRemoved: opts.witnesses?.br as AID[],
    witnessesAdded: opts.witnesses?.ba as AID[],
    config: opts.config,
  });
  const { event } = KELEvents.finalize(unsignedEvent, false);
  return event;
}

function buildIxn(icpEvent: any, priorSaid: string, seq = '1') {
  const { unsignedEvent } = KELEvents.buildIxn({
    aid: icpEvent.i,
    sequence: seq,
    priorEventSaid: priorSaid,
  });
  const { event } = KELEvents.finalize(unsignedEvent, false);
  return event;
}

function buildDip(
  keys = [ALICE],
  nextKeys = [ALICE_NEXT],
  parentAid = 'Eparent_placeholder' as AID,
) {
  const nextDigests = nextKeys.map((k) => digestVerfer(k.publicKey));
  const { unsignedEvent } = KELEvents.buildDip({
    keys: keys.map((k) => k.publicKey),
    nextKeyDigests: nextDigests,
    signingThreshold: '1',
    nextThreshold: '1',
    parentAid,
  });
  const { event } = KELEvents.finalize(unsignedEvent, true);
  return event;
}

describe('reduceKelState', () => {
  describe('well-formed input', () => {
    test('empty events returns empty states', () => {
      expect(reduceKelState([])).toEqual([]);
    });

    test('inception produces correct initial state', () => {
      const icp = buildIcp();
      const states = reduceKelState([wrapEvent(icp)]);
      expect(states).toHaveLength(1);
      const s = states[0]!;
      expect(s.index).toBe(0);
      expect(s.expectedSequence).toBe('0');
      expect(s.kelAid).toBe(icp.i);
      expect(s.signingKeys).toEqual(icp.k);
      expect(s.nonTransferable).toBe(false);
      expect(s.notes).toEqual([]);
    });

    test('rotation updates signing keys and next-key commitments', () => {
      const icp = buildIcp();
      const rot = buildRot(icp, icp.d);
      const states = reduceKelState([wrapEvent(icp), wrapEvent(rot)]);
      expect(states).toHaveLength(2);
      expect(states[1]!.signingKeys).toEqual(rot.k);
      expect(states[1]!.lastEstablishment).toBe(rot);
    });

    test('interaction does not change establishment state', () => {
      const icp = buildIcp();
      const ixn = buildIxn(icp, icp.d);
      const states = reduceKelState([wrapEvent(icp), wrapEvent(ixn)]);
      expect(states[1]!.signingKeys).toEqual(icp.k);
      expect(states[1]!.lastEstablishment).toBe(icp);
    });

    test('non-transferable flag set when n=[]', () => {
      const nextDigests: string[] = [];
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: nextDigests,
        signingThreshold: '1',
        nextThreshold: '1',
      });
      const { event } = KELEvents.finalize(unsignedEvent, true);
      const states = reduceKelState([wrapEvent(event)]);
      expect(states[0]!.nonTransferable).toBe(true);
    });

    test('delegator AID carried from dip', () => {
      const parentAid = 'Eparent123' as AID;
      const dip = buildDip([ALICE], [ALICE_NEXT], parentAid);
      const states = reduceKelState([wrapEvent(dip)]);
      expect(states[0]!.delegatorAid).toBe(parentAid);
    });

    test('config traits set from inception c[]', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: [digestVerfer(ALICE_NEXT.publicKey)],
        signingThreshold: '1',
        nextThreshold: '1',
        config: ['EO', 'DND'],
      });
      const { event } = KELEvents.finalize(unsignedEvent, true);
      const states = reduceKelState([wrapEvent(event)]);
      expect(states[0]!.inceptionTraits).toEqual(new Set(['EO', 'DND']));
    });

    test('rotation updates witnesses via ba/br deltas', () => {
      const { unsignedEvent: icpUnsigned } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: [digestVerfer(ALICE_NEXT.publicKey)],
        signingThreshold: '1',
        nextThreshold: '1',
        witnesses: [WITNESS_A.publicKey],
        witnessThreshold: '1',
      });
      const { event: icp } = KELEvents.finalize(icpUnsigned, true);
      const rot = buildRot(icp, icp.d, [ALICE_NEXT], [ALICE_ROT_NEXT], {
        witnesses: { br: [], ba: [WITNESS_B.publicKey] },
        bt: '2',
      });
      const states = reduceKelState([wrapEvent(icp), wrapEvent(rot)]);
      expect(states[0]!.witnesses).toEqual(new Set([WITNESS_A.publicKey]));
      expect(states[1]!.witnesses).toEqual(new Set([WITNESS_A.publicKey, WITNESS_B.publicKey]));
      expect(states[1]!.witnessThreshold).toBe('2');
    });

    test('delegator AID persists through subsequent events', () => {
      const parentAid = 'Eparent456' as AID;
      const dip = buildDip([ALICE], [ALICE_NEXT], parentAid);
      const ixn = buildIxn(dip, dip.d);
      const states = reduceKelState([wrapEvent(dip), wrapEvent(ixn)]);
      expect(states[1]!.delegatorAid).toBe(parentAid);
    });

    test('expectedSequence increments per event', () => {
      const icp = buildIcp();
      const ixn1 = buildIxn(icp, icp.d, '1');
      const ixn2 = buildIxn(icp, ixn1.d, '2');
      const states = reduceKelState([wrapEvent(icp), wrapEvent(ixn1), wrapEvent(ixn2)]);
      expect(states[0]!.expectedSequence).toBe('0');
      expect(states[1]!.expectedSequence).toBe('1');
      expect(states[2]!.expectedSequence).toBe('2');
    });

    test('previousSaid tracks prior event d field', () => {
      const icp = buildIcp();
      const ixn = buildIxn(icp, icp.d);
      const states = reduceKelState([wrapEvent(icp), wrapEvent(ixn)]);
      expect(states[0]!.previousSaid).toBeUndefined();
      expect(states[1]!.previousSaid).toBe(icp.d);
    });
  });

  describe('malformed input', () => {
    test('first event is ixn — emits unexpected-event-type note', () => {
      const { unsignedEvent } = KELEvents.buildIxn({
        aid: 'Efake' as AID,
        sequence: '0',
        priorEventSaid: 'Efake' as SAID,
      });
      const { event } = KELEvents.finalize(unsignedEvent, false);
      const states = reduceKelState([wrapEvent(event)]);
      expect(states[0]!.notes).toContainEqual(
        expect.objectContaining({ code: 'unexpected-event-type' }),
      );
    });

    test('dip missing di — emits missing-field note', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: [digestVerfer(ALICE_NEXT.publicKey)],
        signingThreshold: '1',
        nextThreshold: '1',
      });
      unsignedEvent.t = 'dip'; // Force type to dip without di
      const { event } = KELEvents.finalize(unsignedEvent, true);
      const states = reduceKelState([wrapEvent(event)]);
      expect(states[0]!.notes).toContainEqual(
        expect.objectContaining({ code: 'missing-field' }),
      );
      expect(states[0]!.delegatorAid).toBeUndefined();
    });

    test('unparseable threshold — defaults to simple m=1, emits note', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: [digestVerfer(ALICE_NEXT.publicKey)],
        signingThreshold: 'bad' as any,
        nextThreshold: '1',
      });
      const { event } = KELEvents.finalize(unsignedEvent, true);
      const states = reduceKelState([wrapEvent(event)]);
      expect(states[0]!.notes).toContainEqual(
        expect.objectContaining({ code: 'unparseable-threshold' }),
      );
      expect(states[0]!.signingThreshold).toEqual({ type: 'simple', m: 1, n: 1 });
    });

    test('br references non-existent witness — emits malformed-witnesses note', () => {
      const { unsignedEvent: icpUnsigned } = KELEvents.buildIcp({
        keys: [ALICE.publicKey],
        nextKeyDigests: [digestVerfer(ALICE_NEXT.publicKey)],
        signingThreshold: '1',
        nextThreshold: '1',
        witnesses: [WITNESS_A.publicKey],
      });
      const { event: icp } = KELEvents.finalize(icpUnsigned, true);
      const rot = buildRot(icp, icp.d, [ALICE_NEXT], [ALICE_ROT_NEXT], {
        witnesses: { br: ['Enonexistent' as AID], ba: [] },
      });
      const states = reduceKelState([wrapEvent(icp), wrapEvent(rot)]);
      expect(states[1]!.notes).toContainEqual(
        expect.objectContaining({ code: 'malformed-witnesses' }),
      );
    });
  });
});
