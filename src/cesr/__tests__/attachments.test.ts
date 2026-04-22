import { describe, expect, it } from 'bun:test';
import { encodeAttachmentGroups, decodeAttachmentGroups, decodeAttachmentGroupsFromStream } from '../attachments.js';
import type { CesrAttachment } from '../../kel/types.js';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { Counter, CtrDex } from 'cesr-ts/src/counter';
import { Siger } from 'cesr-ts/src/siger';
import { IdrDex } from 'cesr-ts/src/indexer';

function makeEd25519SigQb64(): string {
  const raw = new Uint8Array(64);
  const matter = new Matter({ raw, code: MtrDex.Ed25519_Sig });
  return matter.qb64;
}

const validSigQb64 = makeEd25519SigQb64();

describe('encodeAttachmentGroups', () => {
  it('returns empty bytes for empty attachments', () => {
    const result = encodeAttachmentGroups([]);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('encodes a single indexed sig', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const result = encodeAttachmentGroups([att]);
    expect(result).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(result);
    expect(text.startsWith('-A')).toBe(true);
  });

  it('encodes multiple indexed sigs with correct count', () => {
    const att1: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const att2: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 1, sig: validSigQb64 };
    const result = encodeAttachmentGroups([att1, att2]);
    const text = new TextDecoder().decode(result);
    expect(text.startsWith('-A')).toBe(true);
    // Counter is 4 chars, each Siger is 88 chars (Ed25519, code A, fs=88)
    expect(text.length).toBe(4 + 88 * 2);
  });

  it('throws for non-Ed25519 sig', () => {
    const wrongMatter = new Matter({ raw: new Uint8Array(32), code: MtrDex.Blake3_256 });
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: wrongMatter.qb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });

  it('throws for non-indexed sig (unsupported group family)', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'nonIndexed', sig: validSigQb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });

  it('encodes a receipt attachment (-C couple)', () => {
    const att = { kind: 'rct', by: 'BDg3H7Sr-eES0XWXiO8nvMxW6mD_1LIlbWMFYHBw3HQM', sig: validSigQb64 } as CesrAttachment;
    const result = encodeAttachmentGroups([att]);
    const text = new TextDecoder().decode(result);
    expect(text.startsWith('-C')).toBe(true);
  });

  it('throws for undefined keyIndex on indexed sig', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', sig: validSigQb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });

  it('throws for negative keyIndex', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: -1, sig: validSigQb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });

  it('throws for non-integer keyIndex', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 1.5, sig: validSigQb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });

  it('throws for string keyIndex', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 'AB' as unknown as number, sig: validSigQb64 };
    expect(() => encodeAttachmentGroups([att])).toThrow();
  });
});

function makeSigerQb64(keyIndex: number): string {
  const raw = new Uint8Array(64);
  const siger = new Siger({ raw, code: IdrDex.Ed25519_Sig, index: keyIndex, ondex: keyIndex });
  return siger.qb64;
}

function makeWireBytes(counterCode: string, count: number, sigerQb64s: string[]): Uint8Array {
  const counter = new Counter({ code: counterCode, count });
  let text = counter.qb64;
  for (const sq of sigerQb64s) {
    text += sq;
  }
  return new TextEncoder().encode(text);
}

describe('decodeAttachmentGroups', () => {
  it('empty bytes returns []', () => {
    const result = decodeAttachmentGroups(new Uint8Array(0));
    expect(result).toEqual([]);
  });

  it('valid -A group with one sig returns correct CesrAttachment shape', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const wire = encodeAttachmentGroups([att]);
    const result = decodeAttachmentGroups(wire);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('sig');
    expect(result[0].form).toBe('indexed');
    expect((result[0] as Extract<CesrAttachment, { form: 'indexed' }>).keyIndex).toBe(0);
    expect(result[0].sig).toBe(validSigQb64);
  });

  it('valid -B group with one witness sig returns correct CesrAttachment shape', () => {
    const wire = makeWireBytes(CtrDex.WitnessIdxSigs, 1, [makeSigerQb64(0)]);
    const result = decodeAttachmentGroups(wire);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('sig');
    expect(result[0].form).toBe('indexed');
    expect((result[0] as Extract<CesrAttachment, { form: 'indexed' }>).keyIndex).toBe(0);
  });

  it('truncated counter (only 2 bytes of 4) throws', () => {
    const wire = new TextEncoder().encode('-A');
    expect(() => decodeAttachmentGroups(wire)).toThrow();
  });

  it('truncated item within group throws', () => {
    // Counter says 1 sig but no sig bytes follow
    const counter = new Counter({ code: CtrDex.ControllerIdxSigs, count: 1 });
    const wire = new TextEncoder().encode(counter.qb64);
    expect(() => decodeAttachmentGroups(wire)).toThrow();
  });

  it('trailing garbage after valid group throws', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const wire = encodeAttachmentGroups([att]);
    const withGarbage = new Uint8Array(wire.length + 3);
    withGarbage.set(wire);
    withGarbage.set(new TextEncoder().encode('ZZZ'), wire.length);
    expect(() => decodeAttachmentGroups(withGarbage)).toThrow();
  });

  it('count-0 group returns []', () => {
    const counter = new Counter({ code: CtrDex.ControllerIdxSigs, count: 0 });
    const wire = new TextEncoder().encode(counter.qb64);
    const result = decodeAttachmentGroups(wire);
    expect(result).toEqual([]);
  });
});

describe('round-trip encode/decode', () => {
  it('single sig round-trips with exact domain equality', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const wire = encodeAttachmentGroups([att]);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(att);
  });

  it('round-trips multiple sigs with different indexes (0, 5, 63)', () => {
    const makeSig = (idx: number): CesrAttachment => {
      const raw = new Uint8Array(64);
      raw[0] = idx; // make each sig unique
      const matter = new Matter({ raw, code: MtrDex.Ed25519_Sig });
      return { kind: 'sig', form: 'indexed', keyIndex: idx, sig: matter.qb64 };
    };
    const atts = [makeSig(0), makeSig(5), makeSig(63)];
    const wire = encodeAttachmentGroups(atts);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(3);
    expect(decoded).toEqual(atts);
  });

  it('round-trips keyIndex at boundary 64', () => {
    const raw = new Uint8Array(64);
    raw[0] = 64;
    const matter = new Matter({ raw, code: MtrDex.Ed25519_Sig });
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 64, sig: matter.qb64 };
    const wire = encodeAttachmentGroups([att]);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(att);
  });
});

describe('decodeAttachmentGroupsFromStream', () => {
  it('returns empty attachments and 0 bytesConsumed for empty data', () => {
    const result = decodeAttachmentGroupsFromStream(new Uint8Array(0));
    expect(result.attachments).toEqual([]);
    expect(result.bytesConsumed).toBe(0);
  });

  it('decodes a single group and reports bytesConsumed', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const encoded = encodeAttachmentGroups([att]);
    const result = decodeAttachmentGroupsFromStream(encoded);
    expect(result.attachments).toEqual([att]);
    expect(result.bytesConsumed).toBe(encoded.length);
  });

  it('stops cleanly when trailing bytes cannot begin a valid counter', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const encoded = encodeAttachmentGroups([att]);
    const trailing = new TextEncoder().encode('{"v":"KERI10JSON"}');
    const combined = new Uint8Array(encoded.length + trailing.length);
    combined.set(encoded);
    combined.set(trailing, encoded.length);

    const result = decodeAttachmentGroupsFromStream(combined);
    expect(result.attachments).toEqual([att]);
    expect(result.bytesConsumed).toBe(encoded.length);
  });

  it('stops cleanly when trailing bytes are arbitrary non-counter data', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const encoded = encodeAttachmentGroups([att]);
    const trailing = new TextEncoder().encode('ZZZZZ');
    const combined = new Uint8Array(encoded.length + trailing.length);
    combined.set(encoded);
    combined.set(trailing, encoded.length);

    const result = decodeAttachmentGroupsFromStream(combined);
    expect(result.attachments).toEqual([att]);
    expect(result.bytesConsumed).toBe(encoded.length);
  });

  it('throws when a counter starts but group is truncated', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const encoded = encodeAttachmentGroups([att]);
    const text = new TextDecoder().decode(encoded);
    const partial = new TextEncoder().encode(text.slice(0, 10));
    expect(() => decodeAttachmentGroupsFromStream(partial)).toThrow();
  });

  it('throws on truncated counter prefix (e.g. just "-A")', () => {
    const data = new TextEncoder().encode('-A');
    expect(() => decodeAttachmentGroupsFromStream(data)).toThrow();
  });

  it('returns 0 bytesConsumed when first bytes are not a valid counter', () => {
    const data = new TextEncoder().encode('{"event":"data"}');
    const result = decodeAttachmentGroupsFromStream(data);
    expect(result.attachments).toEqual([]);
    expect(result.bytesConsumed).toBe(0);
  });
});

describe('non-transferable receipt couples (-C)', () => {
  const prefixQb64 = 'BDg3H7Sr-eES0XWXiO8nvMxW6mD_1LIlbWMFYHBw3HQM';

  it('decodes a single -C receipt couple', () => {
    // Build wire: counter + prefix + sig (Cigar is a Matter with Ed25519_Sig code)
    const sigMatter = new Matter({ raw: new Uint8Array(64), code: MtrDex.Ed25519_Sig });
    const counter = new Counter({ code: CtrDex.NonTransReceiptCouples, count: 1 });
    const wire = new TextEncoder().encode(counter.qb64 + prefixQb64 + sigMatter.qb64);
    const result = decodeAttachmentGroups(wire);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('rct');
    if (result[0].kind === 'rct') {
      expect(result[0].by).toBe(prefixQb64);
      expect(result[0].sig).toBe(sigMatter.qb64);
    }
  });

  it('round-trips a -C receipt couple', () => {
    const sigMatter = new Matter({ raw: new Uint8Array(64), code: MtrDex.Ed25519_Sig });
    const att: CesrAttachment = { kind: 'rct', by: prefixQb64, sig: sigMatter.qb64 };
    const wire = encodeAttachmentGroups([att]);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(att);
  });
});

describe('transferable receipt quadruples (-D)', () => {
  const prefixQb64 = 'BDg3H7Sr-eES0XWXiO8nvMxW6mD_1LIlbWMFYHBw3HQM';
  const digestQb64 = 'ELC5L3iBVD77d_MYbYGGCUQhqM2J7HOkDGhk3rFiSCY0';

  function makeSeqnerQb64(sn: number): string {
    // Seqner uses code '0A' (Salt_128), 16 bytes raw, big-endian sn
    const raw = new Uint8Array(16);
    const view = new DataView(raw.buffer);
    // Store sn in the last 4 bytes (big-endian) to match keripy
    view.setUint32(12, sn, false);
    return new Matter({ raw, code: '0A' }).qb64;
  }

  it('decodes a single -D transferable receipt quadruple', () => {
    const sigRaw = new Uint8Array(64);
    const siger = new Siger({ raw: sigRaw, code: IdrDex.Ed25519_Sig, index: 0, ondex: 0 });
    const seqnerQb64 = makeSeqnerQb64(0);
    const counter = new Counter({ code: CtrDex.TransReceiptQuadruples, count: 1 });
    const wire = new TextEncoder().encode(
      counter.qb64 + prefixQb64 + seqnerQb64 + digestQb64 + siger.qb64,
    );
    const result = decodeAttachmentGroups(wire);
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('vrc');
    if (result[0].kind === 'vrc') {
      expect(result[0].seal.i).toBe(prefixQb64);
      expect(result[0].seal.s).toBe('0');
      expect(result[0].seal.d).toBe(digestQb64);
      expect(result[0].keyIndex).toBe(0);
    }
  });

  it('round-trips a -D transferable receipt quadruple', () => {
    const sigMatter = new Matter({ raw: new Uint8Array(64), code: MtrDex.Ed25519_Sig });
    const att: CesrAttachment = {
      kind: 'vrc',
      seal: { i: prefixQb64, s: '0', d: digestQb64 },
      sig: sigMatter.qb64,
      keyIndex: 0,
    };
    const wire = encodeAttachmentGroups([att]);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(1);
    expect(decoded[0]).toEqual(att);
  });
});

describe('count boundaries (decode)', () => {
  it('count 1', () => {
    const att: CesrAttachment = { kind: 'sig', form: 'indexed', keyIndex: 0, sig: validSigQb64 };
    const wire = encodeAttachmentGroups([att]);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(1);
  });

  it('count 63 (boundary for single base64 digit)', () => {
    const atts: CesrAttachment[] = Array.from({ length: 63 }, (_, i) => ({
      kind: 'sig' as const,
      form: 'indexed' as const,
      keyIndex: i % 64,
      sig: validSigQb64,
    }));
    const wire = encodeAttachmentGroups(atts);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(63);
  });

  it('count 64 (requires second base64 digit)', () => {
    const atts: CesrAttachment[] = Array.from({ length: 64 }, (_, i) => ({
      kind: 'sig' as const,
      form: 'indexed' as const,
      keyIndex: i % 64,
      sig: validSigQb64,
    }));
    const wire = encodeAttachmentGroups(atts);
    const decoded = decodeAttachmentGroups(wire);
    expect(decoded).toHaveLength(64);
  });

  it('count 4095 as Counter primitive test (Counter round-trips count)', () => {
    const counter = new Counter({ code: CtrDex.ControllerIdxSigs, count: 4095 });
    const restored = new Counter({ qb64: counter.qb64 });
    expect(restored.count).toBe(4095);
    expect(restored.code).toBe(CtrDex.ControllerIdxSigs);
  });
});
