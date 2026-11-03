import type { Algo } from '../common/algo.js';
import type { PublicKey, SAID, Signature } from '../common/types.js';
import type { KeyAgreementInput } from './key-agreement.js';

/**
 * Algorithm-agnostic CESR-native signing capability.
 * Both ed25519 and secp256k1 implement this — signBytes returns CESR qb64.
 */
export interface Signer {
  readonly publicKey: PublicKey;
  readonly algo: Algo;
  exists(publicKey: PublicKey): Promise<boolean>;
  signBytes(data: Uint8Array): Promise<Signature>;
  signSaid(said: SAID): Promise<Signature>;
}

/**
 * Ed25519-specific signer with X25519 key-agreement capability.
 */
export interface Ed25519Signer extends Signer {
  getX25519PublicKey(): Promise<Uint8Array>;
  deriveX25519HkdfBlake3Key(input: KeyAgreementInput): Promise<Uint8Array>;
}

/**
 * Secp256k1-specific signer for Ethereum-style transactions.
 * Extends Signer (CESR signBytes/signSaid) and adds raw digest signing.
 */
export interface Secp256k1Signer extends Signer {
  readonly compressedPublicKey: Uint8Array;
  signDigest(digest: Uint8Array): Promise<Uint8Array>;
}

/** Named error for algo mismatch in typed narrowing (e.g. withEd25519Signer). */
export type UnexpectedAlgoError = {
  readonly kind: 'unexpected-algo';
  readonly expected: Algo;
  readonly actual: Algo;
};

/** Runtime type guard — checks algo + X25519 key-agreement methods. */
export function isEd25519Signer(signer: Signer): signer is Ed25519Signer {
  return (
    signer.algo === 'ed25519' &&
    typeof (signer as Ed25519Signer).getX25519PublicKey === 'function' &&
    typeof (signer as Ed25519Signer).deriveX25519HkdfBlake3Key === 'function'
  );
}

/** Runtime type guard — checks algo + secp256k1-specific methods. */
export function isSecp256k1Signer(signer: Signer): signer is Secp256k1Signer {
  const s = signer as Secp256k1Signer;
  return s?.algo === 'secp256k1' && typeof s?.signDigest === 'function' && s?.compressedPublicKey instanceof Uint8Array;
}
