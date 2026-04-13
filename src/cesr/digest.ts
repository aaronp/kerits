import { Diger } from 'cesr-ts/src/diger';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { decodeKey } from './keys.js';

/**
 * CESR code metadata
 */
export interface CESRCodeMeta {
  code: string;
  family: string;
  algorithm: string;
  rawSize: number;
  codeLen: number;
}

/**
 * Decoded CESR primitive
 */
export interface CESRDecoded {
  code: string;
  raw: Uint8Array;
  meta: CESRCodeMeta;
}

/**
 * Get metadata for a CESR code
 */
export function getCodeMeta(code: string): CESRCodeMeta {
  const sizage = Matter.Sizes.get(code);
  if (!sizage) {
    throw new Error(`Unknown CESR code: ${code}`);
  }

  // Map code to algorithm name
  const algorithmMap: Record<string, string> = {
    B: 'Ed25519_NonTransferable',
    D: 'Ed25519',
    E: 'Blake3_256',
    H: 'SHA3_256',
    I: 'SHA2_256',
    '0A': 'Salt_128',
    '0B': 'Ed25519_Sig',
  };

  let family = 'matter';
  if (code === '0B' || code === '0A') {
    family = 'siger';
  }

  return {
    code,
    family,
    algorithm: algorithmMap[code] || code,
    rawSize: sizage.fs ? Math.floor(((sizage.fs - sizage.hs - sizage.ss) * 3) / 4) - (sizage.ls || 0) : -1,
    codeLen: sizage.hs,
  };
}

/**
 * Generic encode function
 */
export function encode(raw: Uint8Array, code: string): string {
  const matter = new Matter({ raw, code });
  return matter.qb64;
}

/**
 * Generic decode function
 */
export function decode(cesr: string): CESRDecoded {
  if (cesr.length === 0) {
    throw new Error('Empty CESR string');
  }

  const matter = new Matter({ qb64: cesr });
  const meta = getCodeMeta(matter.code);

  return {
    code: matter.code,
    raw: matter.raw,
    meta,
  };
}

/**
 * Encode digest to CESR format
 */
export function encodeDigest(digest: Uint8Array, code: string = MtrDex.Blake3_256): string {
  return encode(digest, code);
}

/**
 * Decode CESR digest
 */
export function decodeDigest(cesr: string): CESRDecoded {
  const decoded = decode(cesr);
  const validDigestCodes = [
    MtrDex.Blake3_256, // E
    'F',
    'G', // Blake2b/s
    MtrDex.SHA3_256, // H
    MtrDex.SHA2_256, // I
    '0D',
    '0E',
    '0F',
    '0G', // 512-bit variants
  ];
  if (!validDigestCodes.includes(decoded.code)) {
    throw new Error(`Expected digest code, got ${decoded.code}`);
  }
  return decoded;
}

/**
 * Compute digest of a CESR-encoded verifier (public key)
 * Used for creating next key commitments (n field) in KERI events
 */
export function digestVerfer(verferQb64: string, algorithm: string = MtrDex.Blake3_256): string {
  const decoded = decodeKey(verferQb64);
  // Pass the raw bytes to be hashed as second parameter, and the digest algorithm code in options
  const diger = new Diger({ code: algorithm }, decoded.raw);
  return diger.qb64;
}
