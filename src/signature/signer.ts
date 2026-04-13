import type { AID, PublicKey, SAID, Signature } from '../common/types.js';

/**
 * Represents the controller of a keypair and the ability to sign data
 *
 * Notice: The device is in full control of these keys. Depending on the nature
 * of the application, some 'Signers' will just sign events.
 *
 * Typically, however, the Signer will prompt the user for acknowledgement,
 * or require a passphrase to access the underlying key material
 */
export interface Signer {
  /**
   * The AID of the controller
   */
  aid: AID;

  publicKey: PublicKey;

  /**
   * X25519 public key derived from the signing key (for ECDH/AEAD).
   */
  getX25519PublicKey(): Promise<Uint8Array>;

  /**
   * Does this signer have this public key?
   * @param publicKey - The public key to check
   */
  exists(publicKey: PublicKey): Promise<boolean>;

  /**
   * @param data the data to sign
   * @returns Ed25519 signature in CESR/QB64 format
   */
  signBytes(data: Uint8Array): Promise<Signature>;

  /**
   * Sign a SAID (Self-Addressing Identifier)
   * @param said the SAID to sign
   * @returns Ed25519 signature in CESR/QB64 format
   */
  signSaid(said: SAID): Promise<Signature>;
}
