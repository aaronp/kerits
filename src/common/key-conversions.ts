import type { CesrKeyTransferable, PublicKey } from './types.js';

/**
 * Convert a CesrKeyTransferable (from KSN key state) to a PublicKey (vault-compatible).
 * Both are qb64-encoded ED25519 public keys — same wire format, different branded types.
 *
 * This exists as a named function (not inline cast) so the type relationship
 * is documented in one place rather than scattered as `as unknown as` casts.
 */
export function transferableKeyToPublicKey(key: CesrKeyTransferable): PublicKey {
  return key as unknown as PublicKey;
}
