/**
 * Standard Base64 Encoding (RFC 4648 Section 4)
 *
 * Uses standard alphabet (+/) with mandatory padding (=).
 * Rejects base64url variants and unpadded input.
 *
 * Implementation note: uses a runtime-safe lookup table approach (no btoa/atob)
 * so this works in Node, Bun, and browsers without polyfills.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(128);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

const STANDARD_BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

export function encodeBase64(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let result = '';
  const len = bytes.length;
  const remainder = len % 3;
  const mainLen = len - remainder;

  for (let i = 0; i < mainLen; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    result += CHARS[(n >> 18) & 0x3f]! + CHARS[(n >> 12) & 0x3f]! + CHARS[(n >> 6) & 0x3f]! + CHARS[n & 0x3f]!;
  }

  if (remainder === 1) {
    const n = bytes[mainLen]!;
    result += `${CHARS[(n >> 2) & 0x3f]!}${CHARS[(n << 4) & 0x3f]!}==`;
  } else if (remainder === 2) {
    const n = (bytes[mainLen]! << 8) | bytes[mainLen + 1]!;
    result += `${CHARS[(n >> 10) & 0x3f]!}${CHARS[(n >> 4) & 0x3f]!}${CHARS[(n << 2) & 0x3f]!}=`;
  }

  return result;
}

export function decodeBase64(encoded: string): Uint8Array {
  if (encoded === '') return new Uint8Array(0);

  // Reject base64url characters
  if (encoded.includes('-') || encoded.includes('_')) {
    throw new Error('decodeBase64: input contains base64url characters (- or _). Use standard base64.');
  }

  // Reject missing/incorrect padding
  if (encoded.length % 4 !== 0) {
    throw new Error('decodeBase64: input length is not a multiple of 4 (missing padding).');
  }

  if (!STANDARD_BASE64_RE.test(encoded)) {
    throw new Error('decodeBase64: input contains invalid characters.');
  }

  const padLen = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
  const byteLen = (encoded.length * 3) / 4 - padLen;
  const bytes = new Uint8Array(byteLen);
  const strLen = encoded.length - (padLen > 0 ? 4 : 0);

  let j = 0;
  let i = 0;
  for (; i < strLen; i += 4) {
    const n =
      (LOOKUP[encoded.charCodeAt(i)]! << 18) |
      (LOOKUP[encoded.charCodeAt(i + 1)]! << 12) |
      (LOOKUP[encoded.charCodeAt(i + 2)]! << 6) |
      LOOKUP[encoded.charCodeAt(i + 3)]!;
    bytes[j++] = (n >> 16) & 0xff;
    bytes[j++] = (n >> 8) & 0xff;
    bytes[j++] = n & 0xff;
  }

  if (padLen === 1) {
    const n =
      (LOOKUP[encoded.charCodeAt(i)]! << 18) |
      (LOOKUP[encoded.charCodeAt(i + 1)]! << 12) |
      (LOOKUP[encoded.charCodeAt(i + 2)]! << 6);
    bytes[j++] = (n >> 16) & 0xff;
    bytes[j++] = (n >> 8) & 0xff;
  } else if (padLen === 2) {
    const n = (LOOKUP[encoded.charCodeAt(i)]! << 18) | (LOOKUP[encoded.charCodeAt(i + 1)]! << 12);
    bytes[j++] = (n >> 16) & 0xff;
  }

  return bytes;
}
