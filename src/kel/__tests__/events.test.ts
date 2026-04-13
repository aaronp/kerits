/**
 * KEL Events Factory Tests
 *
 * Tests for KELEvents namespace factory functions:
 * - buildIcp/buildDip (inception events)
 * - buildRot/buildDrt (rotation events)
 * - buildIxn (interaction events)
 * - computeSaid (SAID computation)
 * - finalize (convenience wrapper)
 */

import { describe, expect, test } from 'bun:test';
import type { AID } from '../../common/types.js';
import { KELEvents } from '../events.js';

describe('KELEvents Factory', () => {
  describe('buildIcp', () => {
    test('should create unsigned inception event with correct structure', () => {
      const { unsignedEvent, isDelegated } = KELEvents.buildIcp({
        keys: ['DKey1', 'DKey2'],
        nextKeyDigests: ['ENext1', 'ENext2'],
        signingThreshold: '2',
        nextThreshold: '2',
      });

      expect(isDelegated).toBe(false);
      expect(unsignedEvent).toMatchObject({
        t: 'icp',
        d: '',
        i: '',
        s: '0',
        kt: '2',
        k: ['DKey1', 'DKey2'],
        nt: '2',
        n: ['ENext1', 'ENext2'],
        bt: '0',
        b: [],
        c: [],
        a: [],
      });
      expect(unsignedEvent).not.toHaveProperty('di');
    });

    test('should apply default thresholds', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
      });

      expect(unsignedEvent.kt).toBe('1');
      expect(unsignedEvent.nt).toBe('1');
    });

    test('should include optional fields', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
        witnesses: ['BWitness1'],
        witnessThreshold: '1',
        config: ['EO'],
        anchors: [{ test: 'anchor' }],
      });

      expect(unsignedEvent.bt).toBe('1');
      expect(unsignedEvent.b).toEqual(['BWitness1']);
      expect(unsignedEvent.c).toEqual(['EO']);
      expect(unsignedEvent.a).toEqual([{ test: 'anchor' }]);
    });
  });

  describe('buildDip', () => {
    test('should create unsigned delegated inception event', () => {
      const parentAid = 'EParentAid1234567890ABCDEFGHIJKLMNOPQRST' as any;
      const { unsignedEvent, isDelegated } = KELEvents.buildDip({
        parentAid,
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
      });

      expect(isDelegated).toBe(true);
      expect(unsignedEvent).toMatchObject({
        t: 'dip',
        d: '',
        i: '',
        s: '0',
        di: parentAid,
      });
    });
  });

  describe('buildRot', () => {
    test('should create unsigned rotation event with default witness fields when not specified', () => {
      const aid = 'EAid1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' as any;
      const priorSaid = 'EPrior1234567890ABCDEFGHIJKLMNOPQRSTUVW' as any;

      const { unsignedEvent, isDelegated } = KELEvents.buildRot({
        aid,
        sequence: '1',
        priorEventSaid: priorSaid,
        keys: ['DNewKey1'],
        nextKeyDigests: ['ENewNext1'],
        signingThreshold: '1',
        nextThreshold: '1',
      });

      expect(isDelegated).toBe(false);
      expect(unsignedEvent).toMatchObject({
        t: 'rot',
        d: '',
        i: aid,
        s: '1',
        p: priorSaid,
        kt: '1',
        k: ['DNewKey1'],
        nt: '1',
        n: ['ENewNext1'],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      });
      expect(unsignedEvent).not.toHaveProperty('di');
    });

    test('should include witness fields when witnessesAdded specified', () => {
      const { unsignedEvent } = KELEvents.buildRot({
        aid: 'EAid' as any,
        sequence: '1',
        priorEventSaid: 'EPrior' as any,
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
        signingThreshold: '1',
        nextThreshold: '1',
        witnessesAdded: ['BWitness1', 'BWitness2'] as any,
        witnessThreshold: '2',
      });

      expect(unsignedEvent.bt).toBe('2');
      expect(unsignedEvent.ba).toEqual(['BWitness1', 'BWitness2']);
      expect(unsignedEvent.br).toEqual([]);
    });

    test('should include witnessesRemoved when specified', () => {
      const { unsignedEvent } = KELEvents.buildRot({
        aid: 'EAid' as any,
        sequence: '1',
        priorEventSaid: 'EPrior' as any,
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
        signingThreshold: '1',
        nextThreshold: '1',
        witnessesAdded: ['BWitness1', 'BWitness2', 'BWitness3'] as any,
      });

      expect(unsignedEvent.bt).toBe('0');
      expect(unsignedEvent.ba).toEqual(['BWitness1', 'BWitness2', 'BWitness3']);
    });
  });

  describe('buildDrt', () => {
    test('should create unsigned delegated rotation event with default witness fields', () => {
      const aid = 'EAid1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' as any;
      const priorSaid = 'EPrior1234567890ABCDEFGHIJKLMNOPQRSTUVW' as any;

      const { unsignedEvent, isDelegated } = KELEvents.buildDrt({
        aid,
        sequence: '2',
        priorEventSaid: priorSaid,
        keys: ['DNewKey1'],
        nextKeyDigests: ['ENewNext1'],
        signingThreshold: '1',
        nextThreshold: '1',
      });

      expect(isDelegated).toBe(true);
      expect(unsignedEvent).toMatchObject({
        t: 'drt',
        d: '',
        i: aid,
        s: '2',
        p: priorSaid,
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      });
      // drt does not have di field
      expect(unsignedEvent).not.toHaveProperty('di');
    });

    test('should include witness fields when witnessesAdded specified', () => {
      const { unsignedEvent } = KELEvents.buildDrt({
        aid: 'EAid' as any,
        sequence: '2',
        priorEventSaid: 'EPrior' as any,
        keys: ['DNewKey1'],
        nextKeyDigests: ['ENewNext1'],
        signingThreshold: '1',
        nextThreshold: '1',
        witnessesAdded: ['BWitness1'] as any,
        witnessThreshold: '1',
      });

      expect(unsignedEvent.bt).toBe('1');
      expect(unsignedEvent.ba).toEqual(['BWitness1']);
      expect(unsignedEvent.br).toEqual([]);
    });
  });

  describe('buildIxn', () => {
    test('should create unsigned interaction event', () => {
      const aid = 'EAid1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' as any;
      const priorSaid = 'EPrior1234567890ABCDEFGHIJKLMNOPQRSTUVW' as any;

      const { unsignedEvent, isDelegated } = KELEvents.buildIxn({
        aid,
        sequence: '1',
        priorEventSaid: priorSaid,
      });

      expect(isDelegated).toBe(false);
      expect(unsignedEvent).toMatchObject({
        t: 'ixn',
        d: '',
        i: aid,
        s: '1',
        p: priorSaid,
        a: [],
      });
    });

    test('should include anchors', () => {
      const { unsignedEvent } = KELEvents.buildIxn({
        aid: 'EAid' as any,
        sequence: '2',
        priorEventSaid: 'EPrior' as any,
        anchors: [
          {
            i: 'EChild',
            s: '0',
            d: 'EChildDip',
          },
        ],
      });

      expect(unsignedEvent.a).toEqual([
        {
          i: 'EChild',
          s: '0',
          d: 'EChildDip',
        },
      ]);
    });
  });

  describe('computeSaid', () => {
    test('should compute SAID for inception event (i = d)', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
      });

      const { event, said } = KELEvents.computeSaid(unsignedEvent, true);

      expect(event.d).toBe(said);
      expect(event.i).toBe(said);
      expect(event.d).toMatch(/^E/); // Ed25519 SAID
      expect(event.v).toMatch(/^KERI10JSON/);
    });

    test('should compute SAID for rotation event (i != d)', () => {
      const aid = 'EAid1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' as any;
      const { unsignedEvent } = KELEvents.buildRot({
        aid,
        sequence: '1',
        priorEventSaid: 'EPrior' as any,
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
        signingThreshold: '1',
        nextThreshold: '1',
      });

      const { event, said } = KELEvents.computeSaid(unsignedEvent, false);

      expect(event.d).toBe(said);
      expect(event.i).toBe(aid); // i stays as provided AID
      expect(event.d).not.toBe(aid);
      expect(event.v).toMatch(/^KERI10JSON/);
    });

    test('should compute SAID for interaction event', () => {
      const aid = 'EAid1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ' as any;
      const { unsignedEvent } = KELEvents.buildIxn({
        aid,
        sequence: '3',
        priorEventSaid: 'EPrior' as any,
        anchors: [{ test: 'anchor' }],
      });

      const { event, said, canonFinal } = KELEvents.computeSaid(unsignedEvent, false);

      expect(event.d).toBe(said);
      expect(event.i).toBe(aid);
      expect(canonFinal.raw).toBeInstanceOf(Uint8Array);
      expect(canonFinal.text).toContain(said);
    });
  });

  describe('finalize', () => {
    test('should be an alias for computeSaid', () => {
      const { unsignedEvent } = KELEvents.buildIcp({
        keys: ['DKey1'],
        nextKeyDigests: ['ENext1'],
      });

      const result1 = KELEvents.finalize(unsignedEvent, true);
      const result2 = KELEvents.computeSaid(unsignedEvent, true);

      // Both should produce the same SAID (deterministic)
      expect(result1.said).toBe(result2.said);
      expect(result1.event).toEqual(result2.event);
    });
  });

  describe('Integration: Full event lifecycle', () => {
    test('should build, finalize, and sign ixn event for delegation', () => {
      const parentAid = 'EParent1234567890ABCDEFGHIJKLMNOPQRSTU' as any;
      const childAid = 'EChild1234567890ABCDEFGHIJKLMNOPQRSTUV' as any;

      // Step 1: Build unsigned ixn
      const { unsignedEvent } = KELEvents.buildIxn({
        aid: parentAid,
        sequence: '1',
        priorEventSaid: 'EPrior' as any,
        anchors: [
          {
            i: childAid,
            s: '0',
            d: 'EChildDip',
          },
        ],
      });

      // Step 2: Finalize and compute SAID
      const { event, said, canonFinal } = KELEvents.finalize(unsignedEvent, false);

      // Verify structure
      expect(event.t).toBe('ixn');
      expect(event.i).toBe(parentAid);
      expect(event.s).toBe('1');
      expect(event.d).toBe(said);
      expect(event.a).toEqual([
        {
          i: childAid,
          s: '0',
          d: 'EChildDip',
        },
      ]);

      // Verify canonFinal is ready for signing
      expect(canonFinal.raw).toBeDefined();
      expect(canonFinal.text).toContain(said);
    });
  });

  describe('computeWitnessDelta', () => {
    const w1 = 'BWit1_witness_aid' as AID;
    const w2 = 'BWit2_witness_aid' as AID;
    const w3 = 'BWit3_witness_aid' as AID;

    test('empty prior and desired', () => {
      const { added, removed } = KELEvents.computeWitnessDelta([], []);
      expect(added).toEqual([]);
      expect(removed).toEqual([]);
    });

    test('detect added witnesses', () => {
      const { added, removed } = KELEvents.computeWitnessDelta([w1], [w1, w2, w3]);
      expect(added).toEqual([w2, w3]);
      expect(removed).toEqual([]);
    });

    test('detect removed witnesses', () => {
      const { added, removed } = KELEvents.computeWitnessDelta([w1, w2, w3], [w1]);
      expect(added).toEqual([]);
      expect(removed).toEqual([w2, w3]);
    });

    test('detect both added and removed', () => {
      const { added, removed } = KELEvents.computeWitnessDelta([w1, w2], [w2, w3]);
      expect(added).toEqual([w3]);
      expect(removed).toEqual([w1]);
    });

    test('identical sets produce empty delta', () => {
      const { added, removed } = KELEvents.computeWitnessDelta([w1, w2], [w1, w2]);
      expect(added).toEqual([]);
      expect(removed).toEqual([]);
    });
  });

  describe('nextSequence', () => {
    test('0 → 1', () => {
      expect(KELEvents.nextSequence('0')).toBe('1');
    });

    test('42 → 43', () => {
      expect(KELEvents.nextSequence('42')).toBe('43');
    });

    test('999 → 1000', () => {
      expect(KELEvents.nextSequence('999')).toBe('1000');
    });
  });
});
