/**
 * Signer - Ed25519 key generation and signing for KERI
 *
 * Generates Ed25519 keypairs and encodes public keys in CESR format.
 */

import * as ed from '@noble/ed25519';

/**
 * CESR matter codes for Ed25519 keys
 */
export enum KeyCode {
  /** Ed25519 verification key, transferable derivation */
  Ed25519 = 'D',
  /** Ed25519 verification key, non-transferable derivation */
  Ed25519N = 'B',
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
 * @param raw - Raw bytes to encode
 * @param code - CESR code
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
  const cs = code.length;
  const sliceOffset = cs % 4;

  return code + b64.slice(sliceOffset);
}

/**
 * Ed25519 keypair for signing
 */
export interface Keypair {
  /** Private key (32 bytes) */
  privateKey: Uint8Array;
  /** Public key (32 bytes) */
  publicKey: Uint8Array;
  /** Public key in CESR qb64 format */
  verfer: string;
}

/**
 * Generate a random Ed25519 keypair
 *
 * @param transferable - If true, uses code 'D' (transferable), otherwise 'B' (non-transferable)
 * @returns Keypair with private key, public key, and CESR-encoded verfer
 *
 * @example
 * const kp = await generateKeypair(true)
 * console.log('Public key:', kp.verfer) // 'DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA'
 */
export async function generateKeypair(transferable: boolean = true): Promise<Keypair> {
  // Generate random private key (32 bytes)
  const privateKey = crypto.getRandomValues(new Uint8Array(32));

  // Derive public key
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  // Encode public key in CESR format
  const code = transferable ? KeyCode.Ed25519 : KeyCode.Ed25519N;
  const verfer = encodeCESR(publicKey, code);

  return {
    privateKey,
    publicKey,
    verfer,
  };
}

/**
 * Generate keypair from seed (deterministic)
 *
 * @param seed - 32-byte seed for deterministic key generation
 * @param transferable - If true, uses code 'D' (transferable), otherwise 'B' (non-transferable)
 * @returns Keypair with private key, public key, and CESR-encoded verfer
 *
 * @example
 * const seed = new Uint8Array(32).fill(1)
 * const kp = await generateKeypairFromSeed(seed, true)
 */
export async function generateKeypairFromSeed(
  seed: Uint8Array,
  transferable: boolean = true
): Promise<Keypair> {
  if (seed.length !== 32) {
    throw new Error('Seed must be exactly 32 bytes');
  }

  // Use seed as private key
  const privateKey = seed;

  // Derive public key
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  // Encode public key in CESR format
  const code = transferable ? KeyCode.Ed25519 : KeyCode.Ed25519N;
  const verfer = encodeCESR(publicKey, code);

  return {
    privateKey,
    publicKey,
    verfer,
  };
}
