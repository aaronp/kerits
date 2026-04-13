import { describe, expect, test } from 'bun:test';
import {
  CESREventSchema,
  CesrAttachmentSchema,
  DipEventSchema,
  DrtEventSchema,
  IcpEventSchema,
  IxnEventSchema,
  type KELEvent,
  KELEventSchema,
  KelAppends,
  KSNSchema,
  KSNs,
  RotEventSchema,
} from './types.js';

describe('KEL types - schemas exist', () => {
  test('all event schemas are defined', () => {
    expect(IcpEventSchema).toBeDefined();
    expect(RotEventSchema).toBeDefined();
    expect(IxnEventSchema).toBeDefined();
    expect(DipEventSchema).toBeDefined();
    expect(DrtEventSchema).toBeDefined();
    expect(KELEventSchema).toBeDefined();
  });

  test('KSN schema is defined', () => {
    expect(KSNSchema).toBeDefined();
  });

  test('CESR event and attachment schemas are defined', () => {
    expect(CESREventSchema).toBeDefined();
    expect(CesrAttachmentSchema).toBeDefined();
  });
});

describe('KSNs namespace', () => {
  test('fromPublicKey creates minimal KSN', () => {
    const ksn = KSNs.fromPublicKey('DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA');
    expect(ksn.s).toBe('0');
    expect(ksn.et).toBe('icp');
    expect(ksn.k).toEqual(['DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA']);
    expect(ksn.kt).toBe('1');
  });

  test('fromKEL returns undefined for empty events', () => {
    const ksn = KSNs.fromKEL('EicpSaid...' as unknown as Parameters<typeof KSNs.fromKEL>[0], []);
    expect(ksn).toBeUndefined();
  });
});

describe('KelAppends namespace', () => {
  test('validate throws on SAID mismatch', () => {
    const append = {
      artifactId: 'test',
      said: 'WRONG',
      kind: 'kel/icp' as const,
      event: { d: 'CORRECT', t: 'icp' } as unknown as KELEvent,
      attachments: [],
      cesr: 'base64bytes',
    };
    expect(() => KelAppends.validate(append)).toThrow(/SAID mismatch/);
  });

  test('validate throws on kind mismatch', () => {
    const append = {
      artifactId: 'test',
      said: 'CORRECT',
      kind: 'kel/rot' as const,
      event: { d: 'CORRECT', t: 'icp' } as unknown as KELEvent,
      attachments: [],
      cesr: 'base64bytes',
    };
    expect(() => KelAppends.validate(append)).toThrow(/Kind mismatch/);
  });
});
