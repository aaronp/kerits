import { digestVerfer } from '../cesr/digest.js';

/**
 * Compute the qb64 digest suitable for KERI `n[]` field from a qb64 public key.
 *
 * Uses digestVerfer from codex which properly decodes the qb64 key to raw bytes,
 * then hashes with Blake3-256 via the CESR Diger primitive. This ensures n[]
 * digests match what assertKeyRevelation and findKeyPairByDigest expect.
 */
export function nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64: string): string {
  return digestVerfer(pubKeyQb64);
}
