import { describe, expect, test } from 'bun:test';
import type { AID } from '../common/types.js';
import {
  type CESREvent,
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

/* ------------------------------------------------------------------------------------------------
 * Test helpers
 * ----------------------------------------------------------------------------------------------*/

const cesrEvent = (event: unknown): CESREvent => ({
  event: event as KELEvent,
  attachments: [],
  enc: 'JSON',
});

// Placeholder SAIDs — 44 CESR-character strings
const AID1 = 'EicpSaid12345678901234567890123456789012345' as AID;
const SAID_ICP = 'EicpSaid12345678901234567890123456789012345';
const SAID_IXN = 'EixnSaid12345678901234567890123456789012345';
const SAID_ROT = 'ErotSaid12345678901234567890123456789012345';
const KEY1 = 'DAliceKey1234567890123456789012345678901234';
const KEY2 = 'DBobKey12345678901234567890123456789012345_';
const KEY3 = 'DCarolKey123456789012345678901234567890123_';
const NEXT1 = 'ENextDigest1234567890123456789012345678901_';
const NEXT2 = 'ENextDigest2234567890123456789012345678901_';
const NEXT3 = 'ENextDigest3234567890123456789012345678901_';
const WIT1 = 'BwitAid1234567890123456789012345678901234_5' as AID;
const WIT2 = 'BwitAid2234567890123456789012345678901234_5' as AID;
const WIT3 = 'BwitAid3234567890123456789012345678901234_5' as AID;
const VERSION = 'KERI10JSON000156_';

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

describe('KSNs.fromKEL', () => {
  describe('ICP-only KEL', () => {
    test('populates all KSN fields from inception event', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent)]);

      expect(ksn).toBeDefined();
      expect(ksn!.v).toBe(VERSION);
      expect(ksn!.i).toBe(AID1);
      expect(ksn!.s).toBe('0');
      expect(ksn!.d).toBe(SAID_ICP);
      // For icp-only, p = lastEvent.d (the icp SAID itself)
      expect(ksn!.p).toBe(SAID_ICP);
      expect(ksn!.et).toBe('icp');
      expect(ksn!.kt).toBe('1');
      expect(ksn!.k).toEqual([KEY1]);
      expect(ksn!.nt).toBe('1');
      expect(ksn!.n).toEqual([NEXT1]);
      expect(ksn!.bt).toBe('0');
      expect(ksn!.b).toEqual([]);
      expect(ksn!.c).toBeUndefined(); // empty c → not set
    });

    test('multi-key inception sets kt/k correctly', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '2',
        k: [KEY1, KEY2],
        nt: '2',
        n: [NEXT1, NEXT2],
        bt: '1',
        b: [WIT1],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent)]);

      expect(ksn!.kt).toBe('2');
      expect(ksn!.k).toEqual([KEY1, KEY2]);
      expect(ksn!.nt).toBe('2');
      expect(ksn!.n).toEqual([NEXT1, NEXT2]);
      expect(ksn!.bt).toBe('1');
      expect(ksn!.b).toEqual([WIT1]);
    });
  });

  describe('ICP + IXN KEL', () => {
    test('ixn advances sequence/SAID but preserves key/witness state from icp', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '1',
        b: [WIT1],
        c: [],
        a: [],
      };
      const ixnEvent = {
        v: VERSION,
        t: 'ixn',
        d: SAID_IXN,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(ixnEvent)]);

      expect(ksn).toBeDefined();
      // Head points to ixn
      expect(ksn!.s).toBe('1');
      expect(ksn!.d).toBe(SAID_IXN);
      expect(ksn!.et).toBe('ixn');
      // Prior is the previous event (icp)
      expect(ksn!.p).toBe(SAID_ICP);
      // Key state unchanged from icp
      expect(ksn!.kt).toBe('1');
      expect(ksn!.k).toEqual([KEY1]);
      expect(ksn!.nt).toBe('1');
      expect(ksn!.n).toEqual([NEXT1]);
      expect(ksn!.bt).toBe('1');
      expect(ksn!.b).toEqual([WIT1]);
    });
  });

  describe('ICP + ROT KEL', () => {
    test('rot updates keys, next digests, thresholds from rotation event', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent)]);

      expect(ksn).toBeDefined();
      expect(ksn!.s).toBe('1');
      expect(ksn!.d).toBe(SAID_ROT);
      expect(ksn!.et).toBe('rot');
      expect(ksn!.p).toBe(SAID_ICP);
      // Rotated keys
      expect(ksn!.kt).toBe('1');
      expect(ksn!.k).toEqual([KEY2]);
      expect(ksn!.nt).toBe('1');
      expect(ksn!.n).toEqual([NEXT2]);
    });
  });

  describe('Witness delta via rotation', () => {
    test('rot with br/ba applies delta correctly to witness set', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '2',
        b: [WIT1, WIT2],
        c: [],
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '2',
        br: [WIT1],   // remove WIT1
        ba: [WIT3],   // add WIT3
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent)]);

      expect(ksn).toBeDefined();
      expect(ksn!.bt).toBe('2');
      // WIT1 removed, WIT3 added → [WIT2, WIT3]
      expect(ksn!.b).toEqual([WIT2, WIT3]);
    });

    test('rot removing all witnesses results in empty b array', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '1',
        b: [WIT1],
        c: [],
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [WIT1],
        ba: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent)]);

      expect(ksn!.b).toEqual([]);
      expect(ksn!.bt).toBe('0');
    });
  });

  describe('Config propagation', () => {
    test('icp with c: [EO] sets c on KSN', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: ['EO'],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent)]);

      expect(ksn!.c).toEqual(['EO']);
    });

    test('rot with updated c overrides icp config', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: ['EO'],
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [],
        ba: [],
        c: ['EO', 'DND'],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent)]);

      expect(ksn!.c).toEqual(['EO', 'DND']);
    });

    test('empty c array does not set c on KSN', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent)]);

      expect(ksn!.c).toBeUndefined();
    });
  });

  describe('p (prior) field linkage', () => {
    test('icp-only: p equals the icp SAID itself', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent)]);

      expect(ksn!.p).toBe(SAID_ICP);
    });

    test('icp + rot: p equals prior event (icp) SAID', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent)]);

      expect(ksn!.p).toBe(SAID_ICP);
    });

    test('icp + ixn + rot: p equals ixn SAID (the second-to-last event)', () => {
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };
      const ixnEvent = {
        v: VERSION,
        t: 'ixn',
        d: SAID_IXN,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        a: [],
      };
      const rotEvent = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '2',
        p: SAID_IXN,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(ixnEvent), cesrEvent(rotEvent)]);

      expect(ksn!.s).toBe('2');
      expect(ksn!.p).toBe(SAID_IXN);
      expect(ksn!.d).toBe(SAID_ROT);
      // Key state from rot
      expect(ksn!.k).toEqual([KEY2]);
    });
  });

  describe('Multi-event accumulation', () => {
    test('multiple rotations accumulate key state correctly', () => {
      const SAID_ROT2 = 'ErotSaid22345678901234567890123456789012345';
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '0',
        b: [],
        c: [],
        a: [],
      };
      const rotEvent1 = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      };
      const rotEvent2 = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT2,
        i: AID1,
        s: '2',
        p: SAID_ROT,
        kt: '1',
        k: [KEY3],
        nt: '1',
        n: [NEXT3],
        bt: '0',
        br: [],
        ba: [],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent1), cesrEvent(rotEvent2)]);

      expect(ksn!.s).toBe('2');
      expect(ksn!.d).toBe(SAID_ROT2);
      expect(ksn!.k).toEqual([KEY3]);
      expect(ksn!.n).toEqual([NEXT3]);
    });

    test('multiple rotations accumulate witness delta across events', () => {
      const SAID_ROT2 = 'ErotSaid22345678901234567890123456789012345';
      const icpEvent = {
        v: VERSION,
        t: 'icp',
        d: SAID_ICP,
        i: AID1,
        s: '0',
        kt: '1',
        k: [KEY1],
        nt: '1',
        n: [NEXT1],
        bt: '1',
        b: [WIT1],
        c: [],
        a: [],
      };
      // rot1: add WIT2
      const rotEvent1 = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT,
        i: AID1,
        s: '1',
        p: SAID_ICP,
        kt: '1',
        k: [KEY2],
        nt: '1',
        n: [NEXT2],
        bt: '2',
        br: [],
        ba: [WIT2],
        c: [],
        a: [],
      };
      // rot2: remove WIT1, add WIT3
      const rotEvent2 = {
        v: VERSION,
        t: 'rot',
        d: SAID_ROT2,
        i: AID1,
        s: '2',
        p: SAID_ROT,
        kt: '1',
        k: [KEY3],
        nt: '1',
        n: [NEXT3],
        bt: '2',
        br: [WIT1],
        ba: [WIT3],
        c: [],
        a: [],
      };

      const ksn = KSNs.fromKEL(AID1, [cesrEvent(icpEvent), cesrEvent(rotEvent1), cesrEvent(rotEvent2)]);

      // After all events: started [WIT1], added WIT2, then removed WIT1 added WIT3 → [WIT2, WIT3]
      expect(ksn!.b).toEqual([WIT2, WIT3]);
    });
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
