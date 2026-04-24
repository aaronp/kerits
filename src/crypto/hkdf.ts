import { blake3 } from '@noble/hashes/blake3.js';
import { hkdf } from '@noble/hashes/hkdf.js';

/**
 * HKDF-Blake3 key derivation.
 *
 * @param ikm - Input keying material
 * @param salt - Salt value
 * @param info - Context/application info
 * @param length - Output length in bytes
 */
export function hkdfBlake3(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Uint8Array {
  return hkdf(blake3, ikm, salt, info, length);
}
