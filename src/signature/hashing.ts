/**
 * Cryptographic Hashing Module
 *
 * Provides Blake3-256 hashing for KERI compliance.
 * Extensible design allows for additional algorithms if needed in the future.
 *
 * Blake3-256 is the KERI standard hash algorithm:
 * - Fast, secure, parallelizable
 * - Pure JavaScript implementation (@noble/hashes)
 * - Works in Node.js, browsers, and Cloudflare Workers
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { canonical } from '../common/canonical.js';

/**
 * Supported hash algorithms
 * Currently only Blake3-256 (KERI standard)
 */
export type HashAlgorithm = 'blake3';

/**
 * Hash data using specified algorithm
 *
 * @param data - Data to hash
 * @param algorithm - Hash algorithm (default: 'blake3')
 * @returns 32-byte hash digest
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode('hello world');
 * const digest = hash(data);
 * console.log(digest.length); // 32
 * ```
 */
export function hash(data: Uint8Array, algorithm: HashAlgorithm = 'blake3'): Uint8Array {
  switch (algorithm) {
    case 'blake3':
      return blake3(data, { dkLen: 32 });
    default: {
      const exhaustiveCheck: never = algorithm;
      throw new Error(`Unknown hash algorithm: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Hash data and return hex string
 *
 * @param data - Data to hash
 * @param algorithm - Hash algorithm (default: 'blake3')
 * @returns Hex-encoded hash digest (64 characters for 32-byte hash)
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode('hello world');
 * const hex = hashHex(data);
 * console.log(hex); // "d74981efa70a0c8...92aa"
 * ```
 */
export function hashHex(data: Uint8Array, algorithm: HashAlgorithm = 'blake3'): string {
  const hashBytes = hash(data, algorithm);
  return Array.from(hashBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash data and return base64url string (no padding)
 *
 * @param data - Data to hash
 * @param algorithm - Hash algorithm (default: 'blake3')
 * @returns Base64url-encoded hash digest (43 characters for 32-byte hash)
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode('hello world');
 * const b64 = hashBase64Url(data);
 * console.log(b64.length); // 43 (32 bytes encoded)
 * ```
 */
export function hashBase64Url(data: Uint8Array, algorithm: HashAlgorithm = 'blake3'): string {
  const hashBytes = hash(data, algorithm);
  return encodeBase64Url(hashBytes);
}

/**
 * Encode bytes to base64url (RFC 4648) without padding
 *
 * @param bytes - Bytes to encode
 * @returns Base64url string (no padding)
 */
function encodeBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Hash an object using canonical JSON + Blake3
 *
 * Uses RFC8785 canonical JSON serialization for deterministic hashing.
 * This is the standard way to hash JSON objects in KERI.
 *
 * @param obj - Object to hash
 * @param algorithm - Hash algorithm (default: 'blake3')
 * @returns Base64url-encoded hash digest
 *
 * @example
 * ```typescript
 * const obj = { foo: 'bar', baz: 42 };
 * const hash1 = hashObject(obj);
 * const hash2 = hashObject({ baz: 42, foo: 'bar' }); // Same hash (deterministic)
 * console.log(hash1 === hash2); // true
 * ```
 */
export function hashObject(obj: any, algorithm: HashAlgorithm = 'blake3'): string {
  const canonicalText = canonical(obj);
  const canonicalBytes = new TextEncoder().encode(canonicalText);
  return hashBase64Url(canonicalBytes, algorithm);
}
