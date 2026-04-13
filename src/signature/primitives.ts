/**
 * Crypto Primitives
 *
 * Direct imports from @noble libraries for cryptographic operations.
 * All operations are runtime-agnostic (work in browser, Node.js, Bun, Cloudflare Workers).
 *
 * Used by @kerits/merits and @kerits/messaging packages.
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 as sha256Fn, sha512 as sha512Fn } from '@noble/hashes/sha2.js';
import { canonicalize } from 'json-canonicalize';
import { decodeBase64Url, encodeBase64Url } from '../common/base64url.js';

// Re-export for backwards compatibility — these were duplicated in this file
// pre-extraction. The canonical implementation lives in ../common/base64url.ts.
// The duplicate copies (which used String.fromCharCode(...bytes), unsafe for
// large arrays) are now removed.
export { decodeBase64Url, encodeBase64Url };

// ============================================================================
// Ed25519 key operations
// ============================================================================

/**
 * Generate an Ed25519 keypair
 * @returns KeyPair with publicKey and privateKey (32 bytes each)
 */
export function generateKeyPair(): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  const privateKey = randomBytes(32); // Ed25519 private keys are 32 bytes
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/**
 * Get public key from secret seed
 */
export function getPublicKey(secretSeed: Uint8Array): Uint8Array {
  return ed25519.getPublicKey(secretSeed);
}

/**
 * Sign data with Ed25519
 */
export function sign(data: Uint8Array, secretSeed: Uint8Array): Uint8Array {
  return ed25519.sign(data, secretSeed);
}

/**
 * Verify Ed25519 signature
 */
export function verify(signature: Uint8Array, data: Uint8Array, publicKey: Uint8Array): boolean {
  return ed25519.verify(signature, data, publicKey);
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * SHA-256 hash (returns bytes)
 */
export function sha256(data: Uint8Array): Uint8Array {
  return sha256Fn(data);
}

/**
 * SHA-256 hash (returns hex string)
 */
export function sha256Hex(data: Uint8Array): string {
  return bytesToHex(sha256Fn(data));
}

/**
 * SHA-512 hash (returns bytes)
 */
export function sha512(data: Uint8Array): Uint8Array {
  return sha512Fn(data);
}

/**
 * SHA-512 hash (returns hex string)
 */
export function sha512Hex(data: Uint8Array): string {
  return bytesToHex(sha512Fn(data));
}

// ============================================================================
// Canonicalization (RFC8785)
// ============================================================================

/**
 * Canonicalize JSON object per RFC8785
 * @returns Canonical JSON string
 */
export { canonicalize };

/**
 * Canonicalize JSON object and return as bytes
 */
export function canonicalizeToBytes(obj: unknown): Uint8Array {
  const text = canonicalize(obj);
  return new TextEncoder().encode(text);
}

// ============================================================================
// Random bytes (runtime-agnostic)
// ============================================================================

/**
 * Generate cryptographically secure random bytes
 * Uses Web Crypto API (browser/Node.js/Cloudflare Workers/Bun)
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    throw new Error('crypto.getRandomValues not available');
  }
  return bytes;
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
