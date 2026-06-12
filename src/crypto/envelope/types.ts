// packages/core/src/crypto/envelope/types.ts
//
// Domain types for envelope encryption. The envelope module encrypts data for
// one or more X25519 recipients using JWE internally. These types define the
// public contract — consumers never see JWE structures directly.

import type { AID } from '../../common/types.js';

/**
 * An X25519 public key for envelope encryption, identified by owner AID and
 * key id. These are encryption keys, not Ed25519 signing keys.
 *
 * PublicKeyRef must contain an X25519 key. It may be anchored by an AID/KEL,
 * but is modelled as a distinct encryption key — not a derived view of a
 * signing key.
 */
export type PublicKeyRef = {
  readonly aid: AID;
  readonly keyId: string;
  readonly publicKey: Uint8Array; // 32-byte X25519
};

/**
 * An encrypted payload with per-recipient wrapped keys.
 * Opaque to consumers — the internal structure is a JWE General JSON object,
 * but callers must not depend on it. Use serializeEnvelope/deserializeEnvelope
 * for persistence and encryptEnvelope/decryptEnvelope for crypto operations.
 */
export type EncryptedEnvelope = {
  readonly _tag: 'EncryptedEnvelope';
  /** @internal JWE General JSON — do not access directly. */
  readonly jwe: Record<string, unknown>;
};

/**
 * Resolves a recipient's X25519 private key for decryption.
 * The envelope module calls this for each recipient in the envelope until one
 * succeeds. Returns undefined if this provider does not own the given keyId,
 * allowing the module to try the next recipient without try/catch control flow.
 */
export type UnlockProvider = {
  unlock(recipientKeyId: string): Promise<Uint8Array | undefined>;
};

/**
 * AAD fields bound to every encrypted value. Verified on decryption —
 * prevents ciphertext from being copied between paths, owners, or contexts.
 *
 * The `version` field supports optimistic locking: bind ciphertext to the
 * expected version/SAID so that stale writes are detectable.
 */
export type EnvelopeAAD = {
  readonly path: string;
  readonly ownerAid: AID;
  readonly contentType: string;
  readonly version?: string;
};
