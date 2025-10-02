/**
 * Diger - Digest Generator for KERI
 *
 * Generates cryptographic digests (hashes) of serialized data,
 * encoded in CESR format.
 */

import { blake3 } from '@noble/hashes/blake3.js';

/**
 * CESR matter codes for digests
 */
export enum DigestCode {
  /** Blake3-256 digest (32 bytes) */
  Blake3_256 = 'E',
  /** Blake2b-256 digest (32 bytes) */
  Blake2b_256 = 'F',
  /** Blake2s-256 digest (32 bytes) */
  Blake2s_256 = 'G',
  /** SHA3-256 digest (32 bytes) */
  SHA3_256 = 'H',
  /** SHA2-256 digest (32 bytes) */
  SHA2_256 = 'I',
}

/**
 * Base64 URL-safe encoding table
 */
const BASE64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode bytes to base64url without padding
 */
function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : 0;
    const b3 = i < bytes.length ? bytes[i++] : 0;

    const hasB2 = i >= 2 && (i - 2) < bytes.length;
    const hasB3 = i >= 3 && (i - 3) < bytes.length;

    result += BASE64_URL[b1 >> 2];
    result += BASE64_URL[((b1 & 0x03) << 4) | (b2 >> 4)];

    if (hasB2) {
      result += BASE64_URL[((b2 & 0x0f) << 2) | (b3 >> 6)];
    }
    if (hasB3) {
      result += BASE64_URL[b3 & 0x3f];
    }
  }

  return result;
}

/**
 * Encode raw bytes as CESR with given code
 *
 * CESR encoding for fixed-size codes:
 * 1. Calculate pad size: ps = (3 - (raw.length % 3)) % 3
 * 2. Prepend ps zero bytes to raw
 * 3. Base64url encode the padded bytes
 * 4. Slice off first (code.length % 4) characters and prepend code
 *
 * @param raw - Raw bytes to encode
 * @param code - CESR code (e.g., 'E' for Blake3-256)
 * @returns CESR-encoded string
 */
function encodeCESR(raw: Uint8Array, code: string): string {
  // Calculate padding size
  const ps = (3 - (raw.length % 3)) % 3;

  // Create padded bytes: ps zero bytes + raw
  const padded = new Uint8Array(ps + raw.length);
  for (let i = 0; i < ps; i++) {
    padded[i] = 0;
  }
  for (let i = 0; i < raw.length; i++) {
    padded[ps + i] = raw[i];
  }

  // Base64 encode
  const b64 = encodeBase64Url(padded);

  // Slice and prepend code
  const cs = code.length;  // code size
  const sliceOffset = cs % 4;

  return code + b64.slice(sliceOffset);
}

/**
 * Generate a cryptographic digest
 *
 * @param ser - Serialized data to digest (bytes or string)
 * @param code - Digest algorithm code (default: Blake3-256)
 * @returns CESR-encoded digest string
 *
 * @example
 * // Digest a public key
 * const keyDigest = diger('DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA')
 * // Returns: 'EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA'
 */
export function diger(
  ser: Uint8Array | string,
  code: DigestCode = DigestCode.Blake3_256
): string {
  // Convert string to bytes if needed
  const bytes = typeof ser === 'string'
    ? new TextEncoder().encode(ser)
    : ser;

  // Compute digest based on code
  let digest: Uint8Array;

  switch (code) {
    case DigestCode.Blake3_256:
      digest = blake3(bytes, { dkLen: 32 });
      break;

    default:
      throw new Error(`Unsupported digest code: ${code}`);
  }

  // Encode as CESR
  return encodeCESR(digest, code);
}
