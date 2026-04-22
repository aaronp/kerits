import { ed25519, x25519 } from '@noble/curves/ed25519.js';

/**
 * Convert an Ed25519 private key (32 bytes) to an X25519 private key.
 * Used for Diffie-Hellman key exchange / decryption.
 */
export function ed25519ToX25519Private(ed25519PrivateKey: Uint8Array): Uint8Array {
  if (ed25519PrivateKey.length !== 32) {
    throw new Error(`Invalid Ed25519 private key length: expected 32 bytes, got ${ed25519PrivateKey.length}`);
  }
  return ed25519.utils.toMontgomerySecret(ed25519PrivateKey);
}

/**
 * Convert an Ed25519 public key (32 bytes) to an X25519 public key.
 * Used for encryption / delivery key derivation.
 */
export function ed25519ToX25519Public(ed25519PublicKey: Uint8Array): Uint8Array {
  if (ed25519PublicKey.length !== 32) {
    throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${ed25519PublicKey.length}`);
  }
  return ed25519.utils.toMontgomery(ed25519PublicKey);
}

/**
 * Derive a shared secret via X25519 ECDH.
 */
export function deriveSharedSecret(ourX25519PrivateKey: Uint8Array, theirX25519PublicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(ourX25519PrivateKey, theirX25519PublicKey);
}
