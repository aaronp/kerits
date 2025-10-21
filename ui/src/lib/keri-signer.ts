/**
 * KERI Signer - Signing utilities for MERITS using KERITS signing
 *
 * Provides signing functions compatible with Convex backend expectations
 * using browser-compatible @noble/ed25519 signing infrastructure.
 */

import { Signer } from '../../../src/model/cesr/cesr';

/**
 * Sign a payload using KERITS Signer or raw private key
 *
 * @param payload - Object to sign (will be canonicalized)
 * @param signerOrKey - KERITS Signer instance or 32-byte Ed25519 seed
 * @param keyIndex - Index of the key in the key list (default: 0)
 * @returns Array of indexed signatures in format ["0-<base64url>"]
 */
export async function signPayload(
  payload: any,
  signerOrKey: any | Uint8Array,
  keyIndex: number = 0
): Promise<string[]> {
  // Canonicalize payload (sort keys for deterministic JSON - MUST match backend)
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  let signature: Uint8Array;

  // Check if it's a Signer (has .sign method and .verfer property)
  if (signerOrKey && typeof signerOrKey.sign === 'function' && signerOrKey.verfer) {
    // Use KERITS Signer
    const cigar = signerOrKey.sign(data);
    signature = cigar.raw; // Get raw signature bytes from Cigar
  } else if (signerOrKey instanceof Uint8Array) {
    // Fallback: create temporary Signer from seed
    const tempSigner = new Signer({ raw: signerOrKey, transferable: true });
    const cigar = tempSigner.sign(data);
    signature = cigar.raw;
  } else {
    throw new Error('Invalid signer: expected KERITS Signer or Uint8Array seed');
  }

  // Encode as base64url
  const sigBase64 = encodeBase64Url(signature);

  // Return indexed signature format: "<index>-<base64url_signature>"
  return [`${keyIndex}-${sigBase64}`];
}

/**
 * Encode bytes to base64url (URL-safe, no padding)
 */
function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
