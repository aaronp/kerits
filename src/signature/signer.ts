import type { PublicKey, SAID, Signature } from '../common/types.js';
import type { KeyAgreementInput } from './key-agreement.js';

/**
 * Algorithm-agnostic signing capability.
 *
 * Any key type (ed25519, secp256k1, etc.) can implement this interface.
 * The `signBytes` method returns a CESR-encoded signature appropriate
 * for the key's algorithm.
 */
export interface Signer {
  publicKey: PublicKey;

  /**
   * Does this signer have this public key?
   */
  exists(publicKey: PublicKey): Promise<boolean>;

  /**
   * @param data the data to sign
   * @returns Signature in CESR/QB64 format
   */
  signBytes(data: Uint8Array): Promise<Signature>;

  /**
   * Sign a SAID (Self-Addressing Identifier)
   * @returns Signature in CESR/QB64 format
   */
  signSaid(said: SAID): Promise<Signature>;
}

/**
 * Ed25519-specific signer with X25519 key-agreement capability.
 *
 * Used by messaging/encryption code that needs ECDH key derivation
 * via the ed25519-to-X25519 conversion.
 */
export interface Ed25519Signer extends Signer {
  /**
   * X25519 public key derived from the ed25519 signing key (for ECDH/AEAD).
   */
  getX25519PublicKey(): Promise<Uint8Array>;

  /**
   * Perform X25519 ECDH + HKDF-Blake3 key derivation internally.
   * Private key bytes never leave the Signer boundary.
   */
  deriveX25519HkdfBlake3Key(input: KeyAgreementInput): Promise<Uint8Array>;
}

/** Runtime type guard — checks for the X25519 key-agreement methods. */
export function isEd25519Signer(signer: Signer): signer is Ed25519Signer {
  return (
    typeof (signer as Ed25519Signer).getX25519PublicKey === 'function' &&
    typeof (signer as Ed25519Signer).deriveX25519HkdfBlake3Key === 'function'
  );
}

/**
 * Secp256k1 signing capability for Ethereum-style transactions.
 *
 * Produces raw recoverable signatures (65 bytes: r‖s‖v) from pre-hashed
 * digests. Does not produce CESR-encoded signatures.
 */
export interface Secp256k1Signer {
  /** Public key identifier string (e.g. '1' + base64 for secp256k1). */
  readonly publicKey: PublicKey;
  /** Compressed secp256k1 public key (33 bytes). */
  readonly compressedPublicKey: Uint8Array;
  /** Sign a pre-hashed digest → 65-byte recoverable signature (r‖s‖v). */
  signDigest(digest: Uint8Array): Promise<Uint8Array>;
  /** Does this signer hold the given public key? */
  exists(publicKey: PublicKey): Promise<boolean>;
}

/** Runtime type guard — checks for secp256k1-specific `signDigest` + `compressedPublicKey`. */
export function isSecp256k1Signer(signer: unknown): signer is Secp256k1Signer {
  return (
    typeof (signer as Secp256k1Signer)?.signDigest === 'function' &&
    (signer as Secp256k1Signer)?.compressedPublicKey instanceof Uint8Array
  );
}
