import { Counter, CtrDex } from 'cesr-ts/src/counter';
import { IdrDex } from 'cesr-ts/src/indexer';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { Siger } from 'cesr-ts/src/siger';
import { SequenceNumber } from '../common/types.js';
import type { CesrAttachment } from '../kel/types.js';

const textEncoder = new TextEncoder();

/**
 * Encode CESR attachment groups to wire bytes (qb64 text domain).
 *
 * Supported: controller indexed signatures (counter code -A; indexer codes A/2A both lists, B/2B current only).
 * Throws on unsupported attachment types -- a wire codec must not silently drop material.
 */
export function encodeAttachmentGroups(attachments: readonly CesrAttachment[]): Uint8Array {
  if (attachments.length === 0) return new Uint8Array(0);

  // Group attachments by kind for counter-based encoding
  const indexedSigs: Array<Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>> = [];
  const receiptCouples: Array<Extract<CesrAttachment, { kind: 'rct' }>> = [];
  const transReceiptQuads: Array<Extract<CesrAttachment, { kind: 'vrc' }>> = [];
  const sealSourceCouples: Array<Extract<CesrAttachment, { kind: 'delegator-seal-source' }>> = [];

  for (const att of attachments) {
    if (att.kind === 'sig' && att.form === 'indexed') {
      indexedSigs.push(att as Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>);
    } else if (att.kind === 'wig') {
      throw new Error('wig attachments are not encoded; convert to rct');
    } else if (att.kind === 'rct') {
      receiptCouples.push(att as Extract<CesrAttachment, { kind: 'rct' }>);
    } else if (att.kind === 'vrc') {
      transReceiptQuads.push(att as Extract<CesrAttachment, { kind: 'vrc' }>);
    } else if (att.kind === 'delegator-seal-source') {
      sealSourceCouples.push(att as Extract<CesrAttachment, { kind: 'delegator-seal-source' }>);
    } else {
      throw new Error(
        `Unsupported attachment type for encoding: kind=${att.kind}${'form' in att ? `, form=${att.form}` : ''}`,
      );
    }
  }

  let result = '';

  if (indexedSigs.length > 0) {
    const counter = new Counter({
      code: CtrDex.ControllerIdxSigs,
      count: indexedSigs.length,
    });
    result += counter.qb64;
    for (const att of indexedSigs) {
      result += encodeIndexedSig(att);
    }
  }

  if (receiptCouples.length > 0) {
    const counter = new Counter({
      code: CtrDex.NonTransReceiptCouples,
      count: receiptCouples.length,
    });
    result += counter.qb64;
    for (const att of receiptCouples) {
      result += encodeReceiptCouple(att);
    }
  }

  if (transReceiptQuads.length > 0) {
    const counter = new Counter({
      code: CtrDex.TransReceiptQuadruples,
      count: transReceiptQuads.length,
    });
    result += counter.qb64;
    for (const att of transReceiptQuads) {
      result += encodeTransReceiptQuadruple(att);
    }
  }

  if (sealSourceCouples.length > 0) {
    const counter = new Counter({
      code: CtrDex.SealSourceCouples,
      count: sealSourceCouples.length,
    });
    result += counter.qb64;
    for (const att of sealSourceCouples) {
      result += encodeSealSourceCouple(att);
    }
  }

  return textEncoder.encode(result);
}

/** One char per byte (latin1-style), so string positions are byte offsets; attachments are ASCII qb64. */
const byteChars = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return out;
};
const OPEN_BRACE = 0x7b;

/**
 * Stream-aware CESR attachment group decoder.
 *
 * Repeatedly parses complete CESR groups (counter + announced items).
 * Stops when the remaining bytes cannot begin a valid CESR counter.
 * Throws if a counter has been parsed but the announced group is
 * truncated or malformed.
 *
 * All CESR counter codes start with '-'. If remaining text doesn't
 * start with '-', this is a clean stop (not a counter).
 * If it does start with '-' but Counter parse fails, that's a
 * truncation error — a counter was started but couldn't be completed.
 */
export function decodeAttachmentGroupsFromStream(data: Uint8Array): {
  attachments: readonly CesrAttachment[];
  bytesConsumed: number;
} {
  if (data.length === 0) return { attachments: [], bytesConsumed: 0 };

  // qb64 never contains '{', so a following event body bounds the text we need to decode
  const nextBody = data.indexOf(OPEN_BRACE);
  const text = byteChars(nextBody === -1 ? data : data.subarray(0, nextBody));
  const attachments: CesrAttachment[] = [];
  let pos = 0;

  while (pos < text.length) {
    const remaining = text.slice(pos);
    if (remaining[0] !== '-') break;

    let counter: InstanceType<typeof Counter>;
    try {
      counter = new Counter({ qb64: remaining });
    } catch (e) {
      throw new Error(
        `Truncated or malformed CESR counter at position ${pos}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const counterSize = getCounterSize(counter.code);
    pos += counterSize;

    if (counter.code === CtrDex.ControllerIdxSigs || counter.code === CtrDex.WitnessIdxSigs) {
      const isWitness = counter.code === CtrDex.WitnessIdxSigs;
      for (let i = 0; i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} indexed sigs, got ${i}`);
        }
        const { attachment, consumed } = decodeIndexedSig(text, pos, isWitness);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.NonTransReceiptCouples) {
      for (let i = 0; i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} receipt couples, got ${i}`);
        }
        const { attachment, consumed } = decodeReceiptCouple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.TransReceiptQuadruples) {
      for (let i = 0; i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} receipt quadruples, got ${i}`);
        }
        const { attachment, consumed } = decodeTransReceiptQuadruple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else if (counter.code === CtrDex.SealSourceCouples) {
      for (let i = 0; i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} seal-source couples, got ${i}`);
        }
        const { attachment, consumed } = decodeSealSourceCouple(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else {
      throw new Error(`Unsupported counter code: ${counter.code}`);
    }
  }

  return { attachments, bytesConsumed: pos };
}

/**
 * Decode CESR attachment groups from wire bytes (qb64 text domain).
 *
 * Supported: controller indexed signatures (counter code -A, indexer code A).
 * Throws on: unsupported counter codes, truncated data, trailing bytes that
 * cannot begin a valid counter, or any bytes remaining after the last complete group.
 * The decoder never silently ignores undecodable input.
 */
export function decodeAttachmentGroups(data: Uint8Array): readonly CesrAttachment[] {
  const { attachments, bytesConsumed } = decodeAttachmentGroupsFromStream(data);
  if (bytesConsumed < data.length) {
    throw new Error(
      `Failed to parse counter at position ${bytesConsumed}: ` +
        `unexpected trailing bytes (${data.length - bytesConsumed} bytes remaining)`,
    );
  }
  return attachments;
}

function getCounterSize(code: string): number {
  const sizage = Counter.Sizes.get(code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Unknown counter code: ${code}`);
  }
  return sizage.fs;
}

function decodeIndexedSig(
  text: string,
  pos: number,
  witness = false,
): { attachment: CesrAttachment; consumed: number } {
  let siger: InstanceType<typeof Siger>;
  try {
    siger = new Siger({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(
      `Failed to parse indexed signature at position ${pos}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!ED25519_SIGER_CODES.has(siger.code)) {
    throw new Error(`Unsupported indexer code: ${siger.code}. Only Ed25519 indexed signatures are supported.`);
  } else {
    /* Ed25519 both-lists or current-only code */
  }

  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });

  const sizage = Siger.Sizes.get(siger.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for indexer code: ${siger.code}`);
  }

  // -B (witness) indexed sigs are witness sigs, never controller sigs.
  // Controller sigs keep ondex (prior-n index); current-only codes have none.
  const ondex = siger.ondex;
  const attachment: CesrAttachment = witness
    ? { kind: 'wig', keyIndex: siger.index, sig: sigMatter.qb64 }
    : ondex === undefined
      ? { kind: 'sig', form: 'indexed', keyIndex: siger.index, sig: sigMatter.qb64 }
      : { kind: 'sig', form: 'indexed', keyIndex: siger.index, ondex, sig: sigMatter.qb64 };
  return {
    attachment,
    consumed: sizage.fs,
  };
}

const ED25519_SIGER_CODES = new Set<string>([
  IdrDex.Ed25519_Sig,
  IdrDex.Ed25519_Big_Sig,
  IdrDex.Ed25519_Crt_Sig,
  IdrDex.Ed25519_Big_Crt_Sig,
]);

/**
 * Ed25519 Siger qb64, choosing the indexer code as keripy does:
 * - ondex absent (current list only): Ed25519_Crt_Sig, or Ed25519_Big_Crt_Sig from index 64;
 * - ondex === index < 64 (same in both lists): Ed25519_Sig;
 * - otherwise (e.g. compaction, index != ondex): Ed25519_Big_Sig carrying both indices.
 */
function encodeEd25519Siger(raw: Uint8Array, index: number, ondex: number | undefined): string {
  if (ondex === undefined) {
    const code = index < 64 ? IdrDex.Ed25519_Crt_Sig : IdrDex.Ed25519_Big_Crt_Sig;
    return new Siger({ raw, code, index }).qb64;
  } else if (!Number.isInteger(ondex) || ondex < 0) {
    throw new Error(`Invalid ondex: must be a non-negative integer, got ${ondex}`);
  } else if (ondex === index && index < 64) {
    return new Siger({ raw, code: IdrDex.Ed25519_Sig, index, ondex }).qb64;
  } else {
    return new Siger({ raw, code: IdrDex.Ed25519_Big_Sig, index, ondex }).qb64;
  }
}

function encodeIndexedSig(att: Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>): string {
  const { keyIndex, ondex, sig } = att;

  if (keyIndex === undefined || keyIndex === null) {
    throw new Error('keyIndex is required for indexed signatures');
  }
  if (typeof keyIndex === 'string') {
    throw new Error('String keyIndex (qb64-encoded) is not supported in this implementation');
  }
  if (typeof keyIndex !== 'number' || !Number.isInteger(keyIndex) || keyIndex < 0) {
    throw new Error(`Invalid keyIndex: must be a non-negative integer, got ${keyIndex}`);
  }

  const matter = new Matter({ qb64: sig });
  if (matter.code !== MtrDex.Ed25519_Sig) {
    throw new Error(`Only Ed25519 signatures are supported, got Matter code: ${matter.code}`);
  }

  return encodeEd25519Siger(matter.raw, keyIndex, ondex);
}

function encodeReceiptCouple(att: Extract<CesrAttachment, { kind: 'rct' }>): string {
  // -C couple: prefix (Verfer qb64) + signature (Cigar qb64, which is Matter-based)
  return att.by + att.sig;
}

function encodeTransReceiptQuadruple(att: Extract<CesrAttachment, { kind: 'vrc' }>): string {
  const { seal, sig, keyIndex } = att;

  // Prefix (Verfer qb64)
  const prefixQb64 = seal.i;

  // Seqner: encode sequence number as code '0A' (Salt_128, 16 bytes)
  const snNum = SequenceNumber.of(seal.s);
  const raw = new Uint8Array(16);
  const view = new DataView(raw.buffer);
  view.setUint32(12, snNum, false); // big-endian in last 4 bytes
  const seqnerQb64 = new Matter({ raw, code: '0A' }).qb64;

  // Digest (Diger qb64)
  const digestQb64 = seal.d;

  // Signature as indexed Siger
  const sigMatter = new Matter({ qb64: sig });
  if (sigMatter.code !== MtrDex.Ed25519_Sig) {
    throw new Error(`Only Ed25519 signatures are supported for -D quadruples, got: ${sigMatter.code}`);
  }
  const idx = keyIndex ?? 0;
  // receipt signer's own establishment key: same index in both lists (keripy default)
  return prefixQb64 + seqnerQb64 + digestQb64 + encodeEd25519Siger(sigMatter.raw, idx, idx);
}

function decodeTransReceiptQuadruple(text: string, pos: number): { attachment: CesrAttachment; consumed: number } {
  let totalConsumed = 0;

  // 1. Prefix (Verfer — Matter subclass)
  const prefix = parseMatter(text, pos, 'receipt quadruple prefix');
  totalConsumed += prefix.consumed;

  // 2. Seqner (Matter with code '0A')
  const seqner = parseMatter(text, pos + totalConsumed, 'receipt quadruple seqner');
  totalConsumed += seqner.consumed;
  // Extract sequence number from Seqner raw bytes (big-endian)
  const seqnerRaw = seqner.matter.raw;
  let sn = 0;
  for (let b = 0; b < seqnerRaw.byteLength; b++) {
    sn = sn * 256 + (seqnerRaw[b] ?? 0);
  }

  // 3. Digest (Diger — Matter subclass)
  const digest = parseMatter(text, pos + totalConsumed, 'receipt quadruple digest');
  totalConsumed += digest.consumed;

  // 4. Indexed signature (Siger)
  const sigerSlice = text.slice(pos + totalConsumed);
  const siger = new Siger({ qb64: sigerSlice });
  const sigerSizage = Siger.Sizes.get(siger.code);
  if (!sigerSizage || sigerSizage.fs === undefined) {
    throw new Error(`Cannot determine size for siger code: ${siger.code}`);
  }
  totalConsumed += sigerSizage.fs;

  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });

  return {
    attachment: {
      kind: 'vrc',
      seal: {
        i: prefix.matter.qb64,
        s: SequenceNumber.encode(sn),
        d: digest.matter.qb64,
      },
      sig: sigMatter.qb64,
      keyIndex: siger.index,
    },
    consumed: totalConsumed,
  };
}

function parseMatter(
  text: string,
  pos: number,
  label: string,
): { matter: InstanceType<typeof Matter>; consumed: number } {
  let matter: InstanceType<typeof Matter>;
  try {
    matter = new Matter({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(`Failed to parse ${label} at position ${pos}: ${e instanceof Error ? e.message : String(e)}`);
  }
  const sizage = Matter.Sizes.get(matter.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for ${label} code: ${matter.code}`);
  }
  return { matter, consumed: sizage.fs };
}

function decodeReceiptCouple(text: string, pos: number): { attachment: CesrAttachment; consumed: number } {
  const prefix = parseMatter(text, pos, 'receipt couple prefix');
  const sig = parseMatter(text, pos + prefix.consumed, 'receipt couple signature');

  return {
    attachment: {
      kind: 'rct',
      by: prefix.matter.qb64,
      sig: sig.matter.qb64,
    },
    consumed: prefix.consumed + sig.consumed,
  };
}

function encodeSealSourceCouple(att: Extract<CesrAttachment, { kind: 'delegator-seal-source' }>): string {
  const snNum = SequenceNumber.of(att.s);
  const raw = new Uint8Array(16);
  const view = new DataView(raw.buffer);
  view.setUint32(12, snNum, false); // big-endian in last 4 bytes
  const seqnerQb64 = new Matter({ raw, code: '0A' }).qb64;
  return seqnerQb64 + att.d;
}

function decodeSealSourceCouple(text: string, pos: number): { attachment: CesrAttachment; consumed: number } {
  const seqner = parseMatter(text, pos, 'seal-source couple seqner');
  const seqnerRaw = seqner.matter.raw;
  let sn = 0;
  for (let b = 0; b < seqnerRaw.byteLength; b++) {
    sn = sn * 256 + (seqnerRaw[b] ?? 0);
  }

  const digest = parseMatter(text, pos + seqner.consumed, 'seal-source couple digest');

  return {
    attachment: {
      kind: 'delegator-seal-source',
      s: SequenceNumber.encode(sn),
      d: digest.matter.qb64,
    },
    consumed: seqner.consumed + digest.consumed,
  };
}
