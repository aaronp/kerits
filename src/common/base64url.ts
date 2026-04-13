/**
 * Base64URL Encoding Utilities (RFC 4648)
 *
 * Provides base64url encoding/decoding without padding.
 * Used throughout KERI for encoding binary data in JSON-safe format.
 */

/**
 * Encode bytes to base64url (RFC 4648) without padding
 *
 * Base64url is a URL-safe variant of base64 that:
 * - Uses '-' instead of '+'
 * - Uses '_' instead of '/'
 * - Omits padding ('=')
 *
 * @param bytes - Bytes to encode
 * @returns Base64url string (no padding)
 *
 * @example
 * ```typescript
 * const bytes = new Uint8Array([1, 2, 3, 4]);
 * const encoded = encodeBase64Url(bytes);
 * console.log(encoded); // "AQIDBA"
 * ```
 */
export function encodeBase64Url(bytes: Uint8Array): string {
  // Convert bytes to binary string
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }

  // Encode to standard base64
  const base64 = btoa(binary);

  // Convert to base64url (URL-safe, no padding)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode base64url to bytes
 *
 * Handles base64url strings with or without padding.
 *
 * @param base64url - Base64url string to decode
 * @returns Decoded bytes
 *
 * @example
 * ```typescript
 * const encoded = "AQIDBA";
 * const bytes = decodeBase64Url(encoded);
 * console.log(bytes); // Uint8Array [1, 2, 3, 4]
 * ```
 */
export function decodeBase64Url(base64url: string): Uint8Array {
  // Convert base64url to standard base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = base64 + padding;

  // Decode from base64
  const binaryString = atob(b64);

  // Convert binary string to bytes
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
