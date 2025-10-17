/**
 * Simple Crypto Helpers
 *
 * Mock encryption/decryption for MVP.
 * TODO: Replace with proper KERI-based encryption when integrating with KERITS
 */

/**
 * Mock encrypt - just base64 encode for now
 * In production, use proper E2EE (e.g., X25519 key exchange + ChaCha20-Poly1305)
 */
export function mockEncrypt(plaintext: string): string {
  return btoa(plaintext);
}

/**
 * Mock decrypt - just base64 decode for now
 */
export function mockDecrypt(ciphertext: string): string {
  return atob(ciphertext);
}

/**
 * Decode base64url to Uint8Array
 */
export function decodeBase64Url(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '==='.slice((base64.length + 3) % 4);
  const binary = atob(padded);
  return new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)));
}

/**
 * Encode Uint8Array to base64url
 */
export function encodeBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
