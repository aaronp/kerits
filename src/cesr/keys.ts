import { Matter, MtrDex } from 'cesr-ts/src/matter';
import type { EncodedKey, Qb64 } from './types.js';

/**
 * Encode an Ed25519 public key (32 bytes) to qb64 with the correct CESR prefix.
 */
export function encodeKey(publicKey: Uint8Array, transferable: boolean = true): EncodedKey {
  const code = transferable ? MtrDex.Ed25519 : MtrDex.Ed25519N;
  const matter = new Matter({ raw: publicKey, code });
  return { algo: 'ed25519', qb64: matter.qb64, raw: publicKey };
}

/**
 * Decode a CESR qb64 public key into bytes + algo.
 */
export function decodeKey(qb64: Qb64): EncodedKey {
  const matter = new Matter({ qb64 });

  // Check if it's an Ed25519 key
  if (matter.code === MtrDex.Ed25519 || matter.code === MtrDex.Ed25519N) {
    return { algo: 'ed25519', qb64, raw: matter.raw };
  }

  throw new Error(`Unsupported key code: ${matter.code}`);
}
