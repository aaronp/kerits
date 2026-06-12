// packages/core/src/crypto/envelope/aad.ts
//
// Canonical AAD serialization for envelope encryption.
// Both encrypt and decrypt paths use buildAAD to ensure byte-identical output
// for the same logical AAD — preventing subtle mismatches that would cause
// decryption failures or allow ciphertext relocation attacks.

import { canonical } from '../../common/canonical.js';
import type { EnvelopeAAD } from './types.js';

/**
 * Canonical serialization of AAD for use as the JWE AAD parameter.
 * Uses RFC8785 canonical JSON via canonical() — deterministic key ordering
 * comes from the canonicalization, not from the object construction here.
 * Undefined values are stripped so { version: undefined } and omitting version
 * produce the same output.
 */
export function buildAAD(aad: EnvelopeAAD): Uint8Array {
  const clean: Record<string, string> = {
    contentType: aad.contentType,
    ownerAid: aad.ownerAid,
    path: aad.path,
  };
  if (aad.version !== undefined) {
    clean.version = aad.version;
  }
  return new TextEncoder().encode(canonical(clean));
}
