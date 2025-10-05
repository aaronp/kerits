import { describe, test, expect } from 'bun:test';
import { interaction, type Seal } from './interaction';

describe('interaction', () => {
  describe('basic interaction event creation', () => {
    test('creates valid interaction event with seal', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals: [{
          i: 'ELRegistry1234567890abcdefghijklmnopqrs',
          d: 'ERegistryVCP1234567890abcdefghijklmnop'
        }]
      });

      expect(event).toBeDefined();
      expect(event.ked).toBeDefined();
      expect(event.raw).toBeDefined();
      expect(event.said).toBeDefined();
    });

    test('creates interaction with correct event type', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.t).toBe('ixn');
    });

    test('sets correct identifier', () => {
      const pre = 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj';
      const event = interaction({
        pre,
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.i).toBe(pre);
    });

    test('sets correct sequence number in hex', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.s).toBe('1');
    });

    test('converts sequence number to hex', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 15,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.s).toBe('f');
    });

    test('sets prior event digest', () => {
      const dig = 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM';
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig,
      });

      expect(event.ked.p).toBe(dig);
    });
  });

  describe('seals and anchored data', () => {
    test('includes seals in anchored data array', () => {
      const seal: Seal = {
        i: 'ELRegistry1234567890abcdefghijklmnopqrs',
        d: 'ERegistryVCP1234567890abcdefghijklmnop'
      };

      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals: [seal]
      });

      expect(event.ked.a).toBeDefined();
      expect(Array.isArray(event.ked.a)).toBe(true);
      expect(event.ked.a.length).toBe(1);
      expect(event.ked.a[0]).toEqual(seal);
    });

    test('includes multiple seals', () => {
      const seals: Seal[] = [
        { i: 'EReg1', d: 'EVCP1' },
        { i: 'EReg2', d: 'EVCP2' },
        { i: 'EReg3', d: 'EVCP3' },
      ];

      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals
      });

      expect(event.ked.a.length).toBe(3);
      expect(event.ked.a).toEqual(seals);
    });

    test('seal can include optional sequence number', () => {
      const seal: Seal = {
        i: 'ELRegistry1234567890abcdefghijklmnopqrs',
        s: '0',
        d: 'ERegistryVCP1234567890abcdefghijklmnop'
      };

      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals: [seal]
      });

      expect(event.ked.a[0].s).toBe('0');
    });

    test('supports additional data alongside seals', () => {
      const seal: Seal = {
        i: 'EReg1',
        d: 'EVCP1'
      };
      const additionalData = { custom: 'data', value: 123 };

      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals: [seal],
        data: [additionalData]
      });

      expect(event.ked.a.length).toBe(2);
      expect(event.ked.a[0]).toEqual(seal);
      expect(event.ked.a[1]).toEqual(additionalData);
    });

    test('defaults to empty array when no seals or data provided', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.a).toEqual([]);
    });
  });

  describe('SAID computation', () => {
    test('computes 44-character SAID', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.d).toHaveLength(44);
      expect(event.said).toHaveLength(44);
      expect(event.ked.d).toBe(event.said);
    });

    test('SAID starts with derivation code', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.d).toMatch(/^[A-Z]/);
    });

    test('different events produce different SAIDs', () => {
      const event1 = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      const event2 = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 2,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event1.said).not.toBe(event2.said);
    });

    test('identical inputs produce identical SAIDs', () => {
      const options = {
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        seals: [{ i: 'EReg', d: 'EVCP' }]
      };

      const event1 = interaction(options);
      const event2 = interaction(options);

      expect(event1.said).toBe(event2.said);
    });
  });

  describe('version string', () => {
    test('includes KERI version', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.v).toMatch(/^KERI10JSON/);
    });

    test('version includes correct size', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      const actualSize = event.raw.length;
      const versionMatch = event.ked.v.match(/KERI10JSON([0-9a-f]{6})_/);
      expect(versionMatch).toBeTruthy();

      const declaredSize = parseInt(versionMatch![1], 16);
      expect(declaredSize).toBe(actualSize);
    });
  });

  describe('serialization', () => {
    test('raw is valid JSON', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(() => JSON.parse(event.raw)).not.toThrow();
    });

    test('parsed raw matches ked', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
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
          dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        });
      }).toThrow('Prefix (pre) is required');
    });

    test('throws error when sequence number is less than 1', () => {
      expect(() => {
        interaction({
          pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
          sn: 0,
          dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        });
      }).toThrow('Sequence number (sn) must be >= 1');
    });

    test('throws error when prior digest is missing', () => {
      expect(() => {
        interaction({
          pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
          sn: 1,
          dig: '',
        });
      }).toThrow('Prior event digest (dig) is required');
    });

    test('throws error when sequence number is undefined', () => {
      expect(() => {
        interaction({
          pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
          sn: undefined as any,
          dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
        });
      }).toThrow('Sequence number (sn) must be >= 1');
    });
  });

  describe('TEL registry anchoring use case', () => {
    test('creates event to anchor TEL registry inception', () => {
      // Simulating anchoring a TEL registry inception in the issuer's KEL
      const issuerAID = 'EDahaOcKRguRMAR3WXXjq26BFTdj3m7CXHSdPU9yyOOM';
      const registryAID = 'ELRegistry_vcp_SAID_000000000000000000';
      const vcpSAID = 'EVCP_inception_SAID_00000000000000000000';
      
      const event = interaction({
        pre: issuerAID,
        sn: 1,
        dig: 'EPriorEventDigest00000000000000000000000',
        seals: [{
          i: registryAID,
          d: vcpSAID,
        }]
      });

      expect(event.ked.i).toBe(issuerAID);
      expect(event.ked.a[0].i).toBe(registryAID);
      expect(event.ked.a[0].d).toBe(vcpSAID);
    });

    test('supports multiple registry anchors in single event', () => {
      const event = interaction({
        pre: 'EDahaOcKRguRMAR3WXXjq26BFTdj3m7CXHSdPU9yyOOM',
        sn: 5,
        dig: 'EPriorEventDigest00000000000000000000000',
        seals: [
          { i: 'EReg1', d: 'EVCP1' },
          { i: 'EReg2', d: 'EVCP2' },
        ]
      });

      expect(event.ked.a.length).toBe(2);
      expect(event.ked.s).toBe('5');
    });
  });

  describe('event structure compliance', () => {
    test('has all required KERI event fields', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
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

    test('does not have rotation-specific fields', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 1,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      const ked = event.ked;
      expect(ked).not.toHaveProperty('k');   // keys
      expect(ked).not.toHaveProperty('kt');  // key threshold
      expect(ked).not.toHaveProperty('n');   // next key digests
      expect(ked).not.toHaveProperty('nt');  // next threshold
    });
  });

  describe('large sequence numbers', () => {
    test('handles sequence number 256', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 256,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.s).toBe('100');
    });

    test('handles sequence number 4095', () => {
      const event = interaction({
        pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
        sn: 4095,
        dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
      });

      expect(event.ked.s).toBe('fff');
    });
  });
});
