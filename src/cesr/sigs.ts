import { Matter, MtrDex } from 'cesr-ts/src/matter';
import type { EncodedSig, Qb64, SigAlgo } from './types.js';

/**
 * Encode a raw signature into qb64 CESR form.
 * Accepts SigAlgo (new callers) or boolean (backward compat for transferable flag).
 */
export function encodeSig(sig: Uint8Array, algoOrTransferable: SigAlgo | boolean = 'ed25519'): EncodedSig {
  if (typeof algoOrTransferable === 'boolean') {
    const code = algoOrTransferable ? MtrDex.Ed25519_Sig : '0A';
    const matter = new Matter({ raw: sig, code });
    return { algo: 'ed25519', qb64: matter.qb64, raw: sig };
  }

  const algo = algoOrTransferable;
  const code = algo === 'secp256k1' ? MtrDex.ECDSA_256k1_Sig : MtrDex.Ed25519_Sig;
  const matter = new Matter({ raw: sig, code });
  return { algo, qb64: matter.qb64, raw: sig };
}

/**
 * Decode qb64 signature to raw bytes + algo.
 */
export function decodeSig(qb64: Qb64): EncodedSig {
  const matter = new Matter({ qb64 });

  if (matter.code === MtrDex.ECDSA_256k1_Sig) {
    return { algo: 'secp256k1', qb64, raw: matter.raw };
  }

  if (matter.code === MtrDex.Ed25519_Sig || matter.code === '0A') {
    return { algo: 'ed25519', qb64, raw: matter.raw };
  }

  throw new Error(`Unsupported sig code: ${matter.code}`);
}
