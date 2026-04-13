import { ed25519 } from '@noble/curves/ed25519.js';
import { decodeKey } from '../cesr/keys.js';
import { decodeSig } from '../cesr/sigs.js';
import type { PublicKey, Signature } from '../common/types.js';

/**
 * Verify a signature against data using a public key
 *
 * @param publicKey - Public key in CESR qb64 format
 * @param signature - Signature in CESR qb64 format
 * @param data - Raw bytes that were signed
 * @returns true if signature is valid, false otherwise
 */
export function verify(publicKey: PublicKey, signature: Signature, data: Uint8Array): boolean {
  try {
    const pubKeyBytes = decodeKey(publicKey).raw;
    const sigBytes = decodeSig(signature).raw;
    return ed25519.verify(sigBytes, data, pubKeyBytes);
  } catch {
    return false;
  }
}
