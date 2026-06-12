// packages/core/src/crypto/envelope/jwe.ts
//
// JWE General JSON implementation of envelope encryption.
// Uses jose library for the heavy lifting — this file translates between
// our domain types (PublicKeyRef, EncryptedEnvelope) and jose's JWE API.
// Consumers import from envelope/index.ts, never from this file directly.

import { x25519 } from '@noble/curves/ed25519.js';
import type { GeneralJWE, JWK } from 'jose';
import { GeneralEncrypt, generalDecrypt, importJWK } from 'jose';
import { encodeBase64Url } from '../../common/base64url.js';
import { buildAAD } from './aad.js';
import type { EncryptedEnvelope, EnvelopeAAD, PublicKeyRef, UnlockProvider } from './types.js';

/** Narrow the opaque jwe field to jose's GeneralJWE for internal use. */
function asJwe(envelope: EncryptedEnvelope): GeneralJWE {
  return envelope.jwe as unknown as GeneralJWE;
}

/** Convert a raw 32-byte X25519 public key to a JWK for jose consumption. */
function x25519PublicToJwk(publicKey: Uint8Array, kid: string): JWK {
  return {
    kty: 'OKP',
    crv: 'X25519',
    x: encodeBase64Url(publicKey),
    kid,
  };
}

/** Convert a raw 32-byte X25519 private key + public key to a JWK. */
function x25519PrivateToJwk(privateKey: Uint8Array, publicKey: Uint8Array, kid: string): JWK {
  return {
    kty: 'OKP',
    crv: 'X25519',
    x: encodeBase64Url(publicKey),
    d: encodeBase64Url(privateKey),
    kid,
  };
}

/**
 * Encrypt plaintext for one or more X25519 recipients.
 *
 * Internally uses JWE General JSON Serialization:
 * - Generates a random CEK (A256GCM content encryption key)
 * - Encrypts plaintext with the CEK + AAD
 * - Wraps the CEK for each recipient via ECDH-ES+A256KW
 * - Stores each recipient's keyId in the per-recipient JWE header as `kid`
 *
 * The AAD is integrity-protected but not encrypted — it prevents ciphertext
 * from being moved between storage paths or owner contexts.
 */
export async function encryptEnvelope(
  plaintext: Uint8Array,
  recipients: readonly PublicKeyRef[],
  aad: EnvelopeAAD,
): Promise<EncryptedEnvelope> {
  if (recipients.length === 0) {
    throw new Error('encryptEnvelope: recipients must not be empty');
  }
  if (!aad.contentType) {
    throw new Error('encryptEnvelope: contentType must not be empty');
  }
  for (const r of recipients) {
    if (r.publicKey.length !== 32) {
      throw new Error(`encryptEnvelope: publicKey for ${r.keyId} must be 32 bytes, got ${r.publicKey.length}`);
    }
  }

  const aadBytes = buildAAD(aad);

  const enc = new GeneralEncrypt(plaintext)
    .setProtectedHeader({ enc: 'A256GCM' })
    .setAdditionalAuthenticatedData(aadBytes);

  for (const recipient of recipients) {
    const jwk = x25519PublicToJwk(recipient.publicKey, recipient.keyId);
    const key = (await importJWK(jwk, 'ECDH-ES+A256KW')) as CryptoKey;
    // kid is in the unprotected per-recipient header because JWE General JSON
    // does not support per-recipient protected headers. A tampered kid would only
    // cause key lookup/decryption failure, not a security breach — the AEAD tag
    // protects the actual ciphertext + AAD integrity.
    enc.addRecipient(key).setUnprotectedHeader({ kid: recipient.keyId, alg: 'ECDH-ES+A256KW' });
  }

  const jwe = await enc.encrypt();
  return { _tag: 'EncryptedEnvelope', jwe: jwe as unknown as Record<string, unknown> };
}

/**
 * Decrypt an envelope using the provided unlock provider.
 *
 * 1. Compares buildAAD(expectedAad) against the AAD embedded in the JWE.
 *    If they differ, throws — the envelope was not created for this context.
 *    AAD is mandatory — missing AAD is invalid, not just mismatched.
 * 2. Iterates over per-recipient headers, reading `kid`.
 * 3. When unlock returns a key, decrypts via jose's generalDecrypt.
 * 4. jose verifies AAD integrity against the ciphertext via the AEAD tag.
 */
export async function decryptEnvelope(
  envelope: EncryptedEnvelope,
  unlock: UnlockProvider,
  expectedAad: EnvelopeAAD,
): Promise<Uint8Array> {
  const jwe = asJwe(envelope);

  // Verify expected AAD matches embedded AAD before attempting decryption.
  // AAD is mandatory in this design — missing AAD is invalid (not just mismatched).
  const expectedAadB64 = encodeBase64Url(buildAAD(expectedAad));
  if (jwe.aad !== expectedAadB64) {
    throw new Error('decryptEnvelope: AAD mismatch — envelope was not created for this path/owner/context');
  }

  // Find a recipient whose key we can unlock
  const jweRecipients = jwe.recipients ?? [];
  for (const recipient of jweRecipients) {
    const kid = recipient.header?.kid;
    if (!kid) continue;

    const privateKeyBytes = await unlock.unlock(kid);
    if (!privateKeyBytes) continue;

    if (privateKeyBytes.length !== 32) {
      throw new Error(`decryptEnvelope: unlock key for ${kid} must be 32 bytes, got ${privateKeyBytes.length}`);
    }

    // Copy private key so we can zero our copy without mutating the caller's buffer.
    const localKey = new Uint8Array(privateKeyBytes);
    try {
      const publicKeyBytes = x25519.getPublicKey(localKey);
      const jwk = x25519PrivateToJwk(localKey, publicKeyBytes, kid);
      const key = (await importJWK(jwk, 'ECDH-ES+A256KW')) as CryptoKey;

      const result = await generalDecrypt(jwe, key);
      return new Uint8Array(result.plaintext);
    } finally {
      // Defense in depth: zero private key material after use.
      localKey.fill(0);
    }
  }

  throw new Error('decryptEnvelope: no matching recipient key found');
}
