import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * HKDF-SHA256 key derivation (expand step for recovery key schedule).
 */
export function hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Uint8Array {
  return hkdf(sha256, ikm, salt, info, length);
}
