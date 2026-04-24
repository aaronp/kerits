import type { PublicKey } from '../common/types.js';

/**
 * Input for X25519 ECDH + HKDF-Blake3 key derivation.
 * Shared across Signer, KeyAgreementCapability, and MeritsIdentity
 * to avoid repeating the shape.
 */
export type KeyAgreementInput = {
  peerPublicKey: Uint8Array;
  salt: Uint8Array;
  info: Uint8Array;
  length: number;
};

/**
 * HKDF-Blake3 maximum output length.
 * Blake3 XOF can produce up to 255 * HashLen, but we cap at 64 bytes
 * because no current or foreseeable key-derivation use case needs more
 * (AES-256 = 32 bytes, XChaCha20-Poly1305 = 32 bytes). A conservative
 * limit prevents misuse as a general-purpose KDF.
 */
export const MAX_HKDF_DERIVE_LENGTH = 64;

/**
 * A key-agreement capability that performs X25519 ECDH + HKDF-Blake3
 * derivation internally, so private key bytes never leave the Vault/Signer
 * boundary.
 *
 * The returned derived key is sensitive and caller-owned. It is a
 * purpose-derived key, not the long-lived private key or raw ECDH secret.
 * Callers should treat it with care (zeroize when possible).
 */
export type KeyAgreementCapability = {
  /** KERI signing public key identifier (qb64 PublicKey). */
  readonly keyId: PublicKey;
  /** X25519 delivery public key bytes (32 bytes), NOT the KERI signing key. */
  readonly publicKey: Uint8Array;

  /**
   * Perform X25519 ECDH with `peerPublicKey`, then derive a key via
   * HKDF-Blake3 using the provided salt, info, and length.
   *
   * The Signer performs both steps internally:
   *   1. sharedSecret = x25519(ownPrivateKey, peerPublicKey)
   *   2. result = hkdfBlake3(sharedSecret, salt, info, length)
   *
   * Neither the private key nor the raw shared secret is returned.
   *
   * @throws if peerPublicKey.length !== 32
   * @throws if length < 1 or length > MAX_HKDF_DERIVE_LENGTH (64)
   */
  deriveX25519HkdfBlake3Key(input: KeyAgreementInput): Promise<Uint8Array>;
};
