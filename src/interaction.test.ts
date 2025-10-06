import { describe, test, expect } from 'bun:test';
import { interaction, type Seal } from './interaction';
import { generateKeypairFromSeed } from './signer';
import { diger } from './diger';

/**
 * Test utilities for generating deterministic test data
 */

// Deterministic seeds for test keypairs
const TEST_SEED_1 = new Uint8Array(32).fill(1);

// Generate deterministic digest from string
function testDigest(data: string): string {
  return diger(data);
}

describe('interaction', () => {
  describe('basic interaction event creation', () => {
    test('creates valid interaction event with seal', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event-data');
      const registryAID = testDigest('registry-aid');
      const vcpSAID = testDigest('vcp-said');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [{
          i: registryAID,
          d: vcpSAID
        }]
      });

      expect(event).toBeDefined();
      expect(event.ked).toBeDefined();
      expect(event.raw).toBeDefined();
      expect(event.said).toBeDefined();
    });

    test('creates interaction with correct event type', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.t).toBe('ixn');
    });

    test('sets correct identifier', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.i).toBe(kp.verfer);
    });

    test('sets correct sequence number in hex', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.s).toBe('1');
    });

    test('converts sequence number to hex', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 15,
        dig: priorDigest,
      });

      expect(event.ked.s).toBe('f');
    });

    test('sets prior event digest', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.p).toBe(priorDigest);
    });
  });

  describe('seals and anchored data', () => {
    test('includes seals in anchored data array', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');
      const seal: Seal = {
        i: testDigest('registry-aid'),
        d: testDigest('vcp-said')
      };

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [seal]
      });

      expect(event.ked.a).toBeDefined();
      expect(Array.isArray(event.ked.a)).toBe(true);
      expect(event.ked.a.length).toBe(1);
      expect(event.ked.a[0]).toEqual(seal);
    });

    test('includes multiple seals', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');
      const seals: Seal[] = [
        { i: testDigest('reg1'), d: testDigest('vcp1') },
        { i: testDigest('reg2'), d: testDigest('vcp2') },
        { i: testDigest('reg3'), d: testDigest('vcp3') },
      ];

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals
      });

      expect(event.ked.a.length).toBe(3);
      expect(event.ked.a).toEqual(seals);
    });

    test('seal can include optional sequence number', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');
      const seal: Seal = {
        i: testDigest('registry-aid'),
        s: '0',
        d: testDigest('vcp-said')
      };

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [seal]
      });

      expect(event.ked.a[0].s).toBe('0');
    });

    test('supports additional data alongside seals', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');
      const seal: Seal = {
        i: testDigest('reg1'),
        d: testDigest('vcp1')
      };
      const additionalData = { custom: 'data', value: 123 };

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [seal],
        data: [additionalData]
      });

      expect(event.ked.a.length).toBe(2);
      expect(event.ked.a[0]).toEqual(seal);
      expect(event.ked.a[1]).toEqual(additionalData);
    });

    test('defaults to empty array when no seals or data provided', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.a).toEqual([]);
    });
  });

  describe('SAID computation', () => {
    test('computes 44-character SAID', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.d).toHaveLength(44);
      expect(event.said).toHaveLength(44);
      expect(event.ked.d).toBe(event.said);
    });

    test('SAID starts with derivation code', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.d).toMatch(/^[A-Z]/);
    });

    test('different events produce different SAIDs', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event1 = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      const event2 = interaction({
        pre: kp.verfer,
        sn: 2,
        dig: priorDigest,
      });

      expect(event1.said).not.toBe(event2.said);
    });

    test('identical inputs produce identical SAIDs', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');
      const options = {
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [{ i: testDigest('reg'), d: testDigest('vcp') }]
      };

      const event1 = interaction(options);
      const event2 = interaction(options);

      expect(event1.said).toBe(event2.said);
    });
  });

  describe('version string', () => {
    test('includes KERI version', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(event.ked.v).toMatch(/^KERI10JSON/);
    });

    test('version includes correct size', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      const actualSize = event.raw.length;
      const versionMatch = event.ked.v.match(/KERI10JSON([0-9a-f]{6})_/);
      expect(versionMatch).toBeTruthy();

      const declaredSize = parseInt(versionMatch![1], 16);
      expect(declaredSize).toBe(actualSize);
    });
  });

  describe('serialization', () => {
    test('raw is valid JSON', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      expect(() => JSON.parse(event.raw)).not.toThrow();
    });

    test('parsed raw matches ked', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      const parsed = JSON.parse(event.raw);
      expect(parsed).toEqual(event.ked);
    });
  });

  describe('validation', () => {
    test('throws error when prefix is missing', () => {
      expect(() => {
        interaction({
          pre: '',
          sn: 1,
          dig: testDigest('prior'),
        });
      }).toThrow('Prefix (pre) is required');
    });

    test('throws error when sequence number is less than 1', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      expect(() => {
        interaction({
          pre: kp.verfer,
          sn: 0,
          dig: priorDigest,
        });
      }).toThrow('Sequence number (sn) must be >= 1');
    });

    test('throws error when prior digest is missing', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);

      expect(() => {
        interaction({
          pre: kp.verfer,
          sn: 1,
          dig: '',
        });
      }).toThrow('Prior event digest (dig) is required');
    });

    test('throws error when sequence number is undefined', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      expect(() => {
        interaction({
          pre: kp.verfer,
          sn: undefined as any,
          dig: priorDigest,
        });
      }).toThrow('Sequence number (sn) must be >= 1');
    });
  });

  describe('TEL registry anchoring use case', () => {
    test('creates event to anchor TEL registry inception', async () => {
      // Generate deterministic keys for issuer
      const issuerKp = await generateKeypairFromSeed(TEST_SEED_1);
      const registryAID = testDigest('registry-identifier');
      const vcpSAID = testDigest('vcp-inception-event');
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: issuerKp.verfer,
        sn: 1,
        dig: priorDigest,
        seals: [{
          i: registryAID,
          d: vcpSAID,
        }]
      });

      expect(event.ked.i).toBe(issuerKp.verfer);
      expect(event.ked.a[0].i).toBe(registryAID);
      expect(event.ked.a[0].d).toBe(vcpSAID);
    });

    test('supports multiple registry anchors in single event', async () => {
      const issuerKp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: issuerKp.verfer,
        sn: 5,
        dig: priorDigest,
        seals: [
          { i: testDigest('reg1'), d: testDigest('vcp1') },
          { i: testDigest('reg2'), d: testDigest('vcp2') },
        ]
      });

      expect(event.ked.a.length).toBe(2);
      expect(event.ked.s).toBe('5');
    });
  });

  describe('event structure compliance', () => {
    test('has all required KERI event fields', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      const ked = event.ked;
      expect(ked).toHaveProperty('v');  // version
      expect(ked).toHaveProperty('t');  // type
      expect(ked).toHaveProperty('d');  // SAID
      expect(ked).toHaveProperty('i');  // identifier
      expect(ked).toHaveProperty('s');  // sequence number
      expect(ked).toHaveProperty('p');  // prior event digest
      expect(ked).toHaveProperty('a');  // anchored data
    });

    test('does not have rotation-specific fields', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 1,
        dig: priorDigest,
      });

      const ked = event.ked;
      expect(ked).not.toHaveProperty('k');   // keys
      expect(ked).not.toHaveProperty('kt');  // key threshold
      expect(ked).not.toHaveProperty('n');   // next key digests
      expect(ked).not.toHaveProperty('nt');  // next threshold
    });
  });

  describe('large sequence numbers', () => {
    test('handles sequence number 256', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 256,
        dig: priorDigest,
      });

      expect(event.ked.s).toBe('100');
    });

    test('handles sequence number 4095', async () => {
      const kp = await generateKeypairFromSeed(TEST_SEED_1);
      const priorDigest = testDigest('prior-event');

      const event = interaction({
        pre: kp.verfer,
        sn: 4095,
        dig: priorDigest,
      });

      expect(event.ked.s).toBe('fff');
    });
  });
});
