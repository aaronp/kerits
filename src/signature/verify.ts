import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { decodeKey } from '../cesr/keys.js';
import { decodeSig } from '../cesr/sigs.js';
import type { Algo } from '../common/algo.js';
import type { PublicKey, Signature } from '../common/types.js';

/**
 * Verify a signature against data using a public key.
 * Dispatches to the correct algorithm based on the CESR-encoded algo in both key and signature.
 * Returns false if key and signature algos do not match.
 *
 * @param publicKey - Public key in CESR qb64 format
 * @param signature - Signature in CESR qb64 format
 * @param data - Raw bytes that were signed
 * @returns true if signature is valid, false otherwise
 */
export function verify(publicKey: PublicKey, signature: Signature, data: Uint8Array): boolean {
  try {
    const pub = decodeKey(publicKey);
    const sig = decodeSig(signature);

    // Algo mismatch between key and signature → reject
    if (pub.algo !== sig.algo) return false;

    return verifyByAlgo(sig.algo, { sig: sig.raw, pub: pub.raw }, data);
  } catch {
    return false;
  }
}

/** Verify raw signature bytes for one algo. Each known algo is handled explicitly; an unknown algo is rejected (never assumed to be ed25519). */
export function verifyByAlgo(algo: Algo, raw: { sig: Uint8Array; pub: Uint8Array }, data: Uint8Array): boolean {
  if (algo === 'ed25519') return ed25519.verify(raw.sig, data, raw.pub);
  // secp256k1.verify defaults to prehash: true (internal sha256)
  if (algo === 'secp256k1') return secp256k1.verify(raw.sig, data, raw.pub);
  return false;
}
