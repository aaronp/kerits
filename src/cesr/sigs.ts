import { Matter, MtrDex } from 'cesr-ts/src/matter';
import type { EncodedSig, Qb64 } from './types.js';

/**
 * Encode a raw signature into qb64 CESR form.
 */
export function encodeSig(sig: Uint8Array, transferable: boolean = true): EncodedSig {
  const code = transferable ? MtrDex.Ed25519_Sig : '0A';
  const matter = new Matter({ raw: sig, code });
  return { algo: 'ed25519', qb64: matter.qb64, raw: sig };
}

/**
 * Decode qb64 signature to raw bytes + algo.
 */
export function decodeSig(qb64: Qb64): EncodedSig {
  const matter = new Matter({ qb64 });

  // Check if it's an Ed25519 signature
  if (matter.code === MtrDex.Ed25519_Sig || matter.code === '0A') {
    return { algo: 'ed25519', qb64, raw: matter.raw };
  }

  throw new Error(`Unsupported sig code: ${matter.code}`);
}
