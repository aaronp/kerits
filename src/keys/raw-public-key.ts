import { decodeKey, encodeKey } from '../cesr/keys.js';
import type { Ed25519PublicRaw, PublicKey } from '../common/types.js';
import type { RawPublicKey } from './types.js';

/**
 * Decode a CESR qb64-encoded public key to raw bytes.
 * @deprecated Use PublicKeys.toRaw() instead.
 */
export function toRawPublicKey(cesr: PublicKey): RawPublicKey {
  return decodeKey(cesr).raw as RawPublicKey;
}

/**
 * Encode raw public key bytes to CESR qb64. Supports ed25519 (32 bytes) and secp256k1 (33 bytes).
 * @deprecated Use PublicKeys.fromRaw() instead.
 */
export function toCESRPublicKey(raw: RawPublicKey): PublicKey {
  const bytes = raw as Uint8Array;
  if (bytes.length === 32) {
    return encodeKey(bytes, true, 'ed25519').qb64 as PublicKey;
  }
  if (bytes.length === 33) {
    return encodeKey(bytes, true, 'secp256k1').qb64 as PublicKey;
  }
  throw new Error(`toCESRPublicKey: unsupported key length ${bytes.length}`);
}

/** Brand raw bytes as RawPublicKey with length validation. */
export function asRawPublicKey(bytes: Uint8Array): RawPublicKey {
  if (bytes.length !== 32 && bytes.length !== 33) {
    throw new Error(`Invalid public key length: expected 32 (ed25519) or 33 (secp256k1), got ${bytes.length}`);
  }
  return bytes as RawPublicKey;
}

/** Hex-encode a RawPublicKey for use as a Map key. Shared utility. */
export function publicKeyHex(pk: RawPublicKey): string {
  return Array.from(pk as Uint8Array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Convert existing Ed25519PublicRaw to RawPublicKey. */
export function fromEd25519PublicRaw(raw: Ed25519PublicRaw): RawPublicKey {
  return raw as Uint8Array as RawPublicKey;
}

/** Convert RawPublicKey to Ed25519PublicRaw (validates 32-byte length). */
export function toEd25519PublicRaw(raw: RawPublicKey): Ed25519PublicRaw {
  if ((raw as Uint8Array).length !== 32) {
    throw new Error(`Expected 32-byte ed25519 key, got ${(raw as Uint8Array).length}`);
  }
  return raw as Uint8Array as Ed25519PublicRaw;
}
