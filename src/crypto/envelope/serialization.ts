// packages/core/src/crypto/envelope/serialization.ts
//
// JSON serialization for EncryptedEnvelope. The JWE General JSON format is
// already JSON-safe (base64url strings), so serialization is mostly structural
// validation and branding.

import type { EncryptedEnvelope } from './types.js';

/**
 * Serialize an EncryptedEnvelope to a JSON-safe object for storage.
 * The output can be passed to JSON.stringify directly.
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): Record<string, unknown> {
  return {
    _tag: envelope._tag,
    jwe: envelope.jwe,
  };
}

/**
 * Deserialize a stored object back to an EncryptedEnvelope.
 * Validates required JWE General JSON fields — catches corrupt objects early
 * with descriptive errors rather than letting them fail deep in jose.
 */
export function deserializeEnvelope(data: Record<string, unknown>): EncryptedEnvelope {
  if (data._tag !== 'EncryptedEnvelope') {
    throw new Error(`deserializeEnvelope: expected _tag 'EncryptedEnvelope', got '${String(data._tag)}'`);
  }
  const jwe = data.jwe;
  if (!jwe || typeof jwe !== 'object') {
    throw new Error('deserializeEnvelope: missing or invalid jwe field');
  }
  const j = jwe as Record<string, unknown>;
  // Validate required JWE General JSON Serialization fields
  for (const field of ['protected', 'iv', 'ciphertext', 'tag']) {
    if (typeof j[field] !== 'string') {
      throw new Error(`deserializeEnvelope: missing or invalid jwe.${field}`);
    }
  }
  if (!Array.isArray(j.recipients)) {
    throw new Error('deserializeEnvelope: missing or invalid jwe.recipients array');
  }
  if (typeof j.aad !== 'string') {
    throw new Error('deserializeEnvelope: missing or invalid jwe.aad');
  }
  return { _tag: 'EncryptedEnvelope', jwe: jwe as Record<string, unknown> };
}
