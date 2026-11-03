import { digestVerfer } from '../cesr/digest.js';

/**
 * Compute the qb64 digest suitable for KERI `n[]` field from a qb64 public key.
 *
 * Delegates to digestVerfer: Blake3-256 of the key's qb64 text (keripy's
 * Diger(ser=verfer.qb64b)).
 *
 * @deprecated Use PublicKeys.digest() instead.
 */
export function nextKeyDigestQb64FromPublicKeyQb64(pubKeyQb64: string): string {
  return digestVerfer(pubKeyQb64);
}
