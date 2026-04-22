import { Counter, CtrDex } from 'cesr-ts/src/counter';
import { IdrDex } from 'cesr-ts/src/indexer';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { Siger } from 'cesr-ts/src/siger';
import type { CesrAttachment } from '../kel/types.js';

const textEncoder = new TextEncoder();

/**
 * Encode CESR attachment groups to wire bytes (qb64 text domain).
 *
 * Supported: controller indexed signatures (counter code -A, indexer code A).
 * Throws on unsupported attachment types -- a wire codec must not silently drop material.
 */
export function encodeAttachmentGroups(attachments: readonly CesrAttachment[]): Uint8Array {
  if (attachments.length === 0) return new Uint8Array(0);

  const indexedSigs: Array<Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>> = [];

  for (const att of attachments) {
    if (att.kind === 'sig' && att.form === 'indexed') {
      indexedSigs.push(att as Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>);
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

  return textEncoder.encode(result);
}

const textDecoder = new TextDecoder();

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

  const text = textDecoder.decode(data);
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

    if (counter.code === CtrDex.ControllerIdxSigs) {
      for (let i = 0; i < counter.count; i++) {
        if (pos >= text.length) {
          throw new Error(`Truncated: expected ${counter.count} indexed sigs, got ${i}`);
        }
        const { attachment, consumed } = decodeIndexedSig(text, pos);
        attachments.push(attachment);
        pos += consumed;
      }
    } else {
      throw new Error(`Unsupported counter code: ${counter.code}`);
    }
  }

  const bytesConsumed = textEncoder.encode(text.slice(0, pos)).length;
  return { attachments, bytesConsumed };
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

function decodeIndexedSig(text: string, pos: number): { attachment: CesrAttachment; consumed: number } {
  let siger: InstanceType<typeof Siger>;
  try {
    siger = new Siger({ qb64: text.slice(pos) });
  } catch (e) {
    throw new Error(
      `Failed to parse indexed signature at position ${pos}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (siger.code !== IdrDex.Ed25519_Sig && siger.code !== IdrDex.Ed25519_Big_Sig) {
    throw new Error(`Unsupported indexer code: ${siger.code}. Only Ed25519 indexed signatures are supported.`);
  }

  const sigMatter = new Matter({ raw: siger.raw, code: MtrDex.Ed25519_Sig });

  const sizage = Siger.Sizes.get(siger.code);
  if (!sizage || sizage.fs === undefined) {
    throw new Error(`Cannot determine size for indexer code: ${siger.code}`);
  }

  return {
    attachment: {
      kind: 'sig',
      form: 'indexed',
      keyIndex: siger.index,
      sig: sigMatter.qb64,
    },
    consumed: sizage.fs,
  };
}

function encodeIndexedSig(att: Extract<CesrAttachment, { kind: 'sig'; form: 'indexed' }>): string {
  const { keyIndex, sig } = att;

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

  const indexerCode = keyIndex < 64 ? IdrDex.Ed25519_Sig : IdrDex.Ed25519_Big_Sig;
  const siger = new Siger({
    raw: matter.raw,
    code: indexerCode,
    index: keyIndex,
    ondex: keyIndex,
  });
  return siger.qb64;
}
