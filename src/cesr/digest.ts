import { blake2b, blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { sha3_256, sha3_512 } from '@noble/hashes/sha3.js';
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
 * Next-key commitment digest (an `n` entry) of a CESR-encoded verifier (public key).
 *
 * Rule (https://trustoverip.github.io/kswg-keri-specification/#general-pre-rotation):
 * the commitment is the digest of the key's fully qualified qb64 text, not its raw bytes,
 * as keripy commits `Diger(ser=verfer.qb64b)`.
 */
export function digestVerfer(verferQb64: string, algorithm: string = MtrDex.Blake3_256): string {
  decodeKey(verferQb64); // reject anything that isn't a qb64 key
  const digester = DIGESTERS[algorithm];
  if (digester === undefined) {
    throw new Error(`Unsupported digest code for a next-key commitment: ${algorithm}`);
  } else {
    return new Matter({ raw: digester(new TextEncoder().encode(verferQb64)), code: algorithm }).qb64;
  }
}

/**
 * The digest algorithms keripy's `Diger` supports, by CESR code. The vendored cesr-ts `Diger` only implements
 * Blake3-256, so commitments made with any other code (crypto agility) are computed here.
 */
export const DigestCodes = {
  Blake3_256: 'E',
  Blake2b_256: 'F',
  Blake2s_256: 'G',
  SHA3_256: 'H',
  SHA2_256: 'I',
  Blake3_512: '0D',
  Blake2b_512: '0E',
  SHA3_512: '0F',
  SHA2_512: '0G',
} as const;

const DIGESTERS: Readonly<Record<string, (ser: Uint8Array) => Uint8Array>> = {
  [DigestCodes.Blake3_256]: (ser) => blake3(ser, { dkLen: 32 }),
  [DigestCodes.Blake3_512]: (ser) => blake3(ser, { dkLen: 64 }),
  [DigestCodes.Blake2b_256]: (ser) => blake2b(ser, { dkLen: 32 }),
  [DigestCodes.Blake2b_512]: (ser) => blake2b(ser, { dkLen: 64 }),
  [DigestCodes.Blake2s_256]: (ser) => blake2s(ser, { dkLen: 32 }),
  [DigestCodes.SHA3_256]: (ser) => sha3_256(ser),
  [DigestCodes.SHA3_512]: (ser) => sha3_512(ser),
  [DigestCodes.SHA2_256]: (ser) => sha256(ser),
  [DigestCodes.SHA2_512]: (ser) => sha512(ser),
};

/**
 * Whether a verifier is the pre-image of a next-key commitment, hashing with the commitment's own
 * digest code (crypto agility, as keripy). False for an unparseable or unsupported digest.
 */
export function verferMatchesDigest(verferQb64: string, digestQb64: string): boolean {
  try {
    return digestVerfer(verferQb64, decode(digestQb64).code) === digestQb64;
  } catch {
    return false;
  }
}
