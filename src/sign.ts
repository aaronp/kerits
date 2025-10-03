/**
 * KERI signing and verification functions
 * Implements Ed25519 digital signatures with CESR encoding
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Set the SHA-512 hash function for ed25519
ed.hashes.sha512 = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Base64 URL-safe encoding table
 */
const BASE64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode bytes to base64url without padding
 */
function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : 0;
    const b3 = i < bytes.length ? bytes[i++] : 0;

    const hasB2 = i >= 2 && (i - 2) < bytes.length;
    const hasB3 = i >= 3 && (i - 3) < bytes.length;

    result += BASE64_URL[b1 >> 2];
    result += BASE64_URL[((b1 & 0x03) << 4) | (b2 >> 4)];

    if (hasB2) {
      result += BASE64_URL[((b2 & 0x0f) << 2) | (b3 >> 6)];
    }
    if (hasB3) {
      result += BASE64_URL[b3 & 0x3f];
    }
  }

  return result;
}

/**
 * Decode base64url string to bytes
 */
function decodeBase64Url(str: string): Uint8Array {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE64_URL.length; i++) {
    lookup[BASE64_URL[i]] = i;
  }

  const len = str.length;
  const bytes: number[] = [];
  let i = 0;

  while (i < len) {
    const enc1 = lookup[str[i++]] || 0;
    const enc2 = lookup[str[i++]] || 0;
    const enc3 = lookup[str[i++]] || 0;
    const enc4 = lookup[str[i++]] || 0;

    bytes.push((enc1 << 2) | (enc2 >> 4));
    if (i - 2 < len && str[i - 2] !== '=') {
      bytes.push(((enc2 & 15) << 4) | (enc3 >> 2));
    }
    if (i - 1 < len && str[i - 1] !== '=') {
      bytes.push(((enc3 & 3) << 6) | enc4);
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Decode CESR-encoded string to raw bytes
 * Removes CESR prefix and decodes the base64url portion
 */
function decodeCESR(cesr: string): Uint8Array {
  // Get code length (for single char codes like 'D', 'E', '0B')
  let code = '';
  let base64Part = '';

  if (cesr.startsWith('0B') || cesr.startsWith('0C')) {
    // Two character code
    code = cesr.slice(0, 2);
    base64Part = cesr.slice(2);
  } else {
    // Single character code
    code = cesr.slice(0, 1);
    base64Part = cesr.slice(1);
  }

  const cs = code.length;
  const sliceOffset = cs % 4;

  // Recreate the base64 string with leading 'A' characters (which decode to 0) based on code length
  const paddedB64 = 'A'.repeat(sliceOffset) + base64Part;

  // Decode base64
  const decoded = decodeBase64Url(paddedB64);

  // The number of padding bytes is equal to sliceOffset for properly encoded CESR
  // (because sliceOffset chars were removed during encoding, representing ps padding bytes)
  const ps = sliceOffset;

  // Remove padding bytes
  return decoded.slice(ps);
}

/**
 * Sign a message with a private key
 * @param message - The message to sign (string)
 * @param privateKey - The private key in CESR format (64-byte seed as qb64)
 * @returns The signature in CESR format (0B prefix for Ed25519 signature)
 */
export async function sign(message: string, privateKey: string): Promise<string> {
  // Decode private key from CESR
  const privateKeyBytes = decodeCESR(privateKey);

  // Message to bytes
  const messageBytes = new TextEncoder().encode(message);

  // Sign the message
  const signature = await ed.sign(messageBytes, privateKeyBytes);

  // Encode signature with CESR Ed25519 signature prefix '0B'
  // Calculate padding size
  const ps = (3 - (signature.length % 3)) % 3;

  // Create padded bytes: ps zero bytes + signature
  const padded = new Uint8Array(ps + signature.length);
  for (let i = 0; i < ps; i++) {
    padded[i] = 0;
  }
  for (let i = 0; i < signature.length; i++) {
    padded[ps + i] = signature[i];
  }

  // Base64 encode
  const b64 = encodeBase64Url(padded);

  // Slice and prepend code '0B'
  const code = '0B';
  const cs = code.length;
  const sliceOffset = cs % 4;

  return code + b64.slice(sliceOffset);
}

/**
 * Verify a signature
 * @param message - The original message (string)
 * @param signature - The signature in CESR format
 * @param publicKey - The public key in CESR format
 * @returns True if the signature is valid
 */
export async function verify(message: string, signature: string, publicKey: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!signature || !publicKey || message === undefined) {
      console.error('Invalid input: signature, publicKey, or message is missing');
      return false;
    }

    // Decode CESR signature and public key
    const sigBytes = decodeCESR(signature);
    const pubKeyBytes = decodeCESR(publicKey);

    // Message to bytes
    const messageBytes = new TextEncoder().encode(message);

    // Verify signature
    return await ed.verify(sigBytes, messageBytes, pubKeyBytes);
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}
