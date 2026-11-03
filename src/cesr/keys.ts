import { Matter, MtrDex } from 'cesr-ts/src/matter';
import type { EncodedKey, KeyAlgo, Qb64 } from './types.js';

/**
 * Encode a public key (32-byte ed25519 or 33-byte secp256k1) to qb64 with the correct CESR prefix.
 */
export function encodeKey(publicKey: Uint8Array, transferable: boolean = true, algo: KeyAlgo = 'ed25519'): EncodedKey {
  let code: string;
  if (algo === 'secp256k1') {
    code = transferable ? MtrDex.ECDSA_256k1 : MtrDex.ECDSA_256k1N;
  } else {
    code = transferable ? MtrDex.Ed25519 : MtrDex.Ed25519N;
  }
  const matter = new Matter({ raw: publicKey, code });
  return { algo, qb64: matter.qb64, raw: publicKey };
}

/**
 * Decode a CESR qb64 public key into bytes + algo.
 */
export function decodeKey(qb64: Qb64): EncodedKey {
  const matter = new Matter({ qb64 });

  if (matter.code === MtrDex.Ed25519 || matter.code === MtrDex.Ed25519N) {
    return { algo: 'ed25519', qb64, raw: matter.raw };
  }

  if (matter.code === MtrDex.ECDSA_256k1 || matter.code === MtrDex.ECDSA_256k1N) {
    return { algo: 'secp256k1', qb64, raw: matter.raw };
  }

  throw new Error(`Unsupported key code: ${matter.code}`);
}
