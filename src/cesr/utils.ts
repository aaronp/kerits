/**
 * CESR Utility Functions
 *
 * Base64 encoding/decoding and conversion utilities for CESR primitives
 */

// Base64 URL-safe alphabet (RFC 4648)
export const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Lookup tables for Base64 conversion
const B64_IDX_BY_CHR: { [key: string]: number } = {};
const B64_CHR_BY_IDX: string[] = [];

// Initialize lookup tables
for (let i = 0; i < B64_CHARS.length; i++) {
  const char = B64_CHARS[i];
  B64_IDX_BY_CHR[char] = i;
  B64_CHR_BY_IDX[i] = char;
}

/**
 * Encode Uint8Array to URL-safe Base64 string (no padding)
 */
export function encodeB64(data: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;

    while (bits >= 6) {
      const index = (value >>> (bits - 6)) & 0x3F;
      result += B64_CHR_BY_IDX[index];
      bits -= 6;
    }
  }

  // Handle remaining bits
  if (bits > 0) {
    const index = (value << (6 - bits)) & 0x3F;
    result += B64_CHR_BY_IDX[index];
  }

  return result;
}

/**
 * Decode URL-safe Base64 string to Uint8Array (handles missing padding)
 */
export function decodeB64(text: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const result: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const index = B64_IDX_BY_CHR[char];

    if (index === undefined) {
      throw new Error(`Invalid Base64 character: ${char}`);
    }

    value = (value << 6) | index;
    bits += 6;

    if (bits >= 8) {
      result.push((value >>> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }

  return new Uint8Array(result);
}

/**
 * Convert integer to Base64 string with minimum length l
 */
export function intToB64(num: number, minLength: number = 1): string {
  if (num < 0) {
    throw new Error('Cannot encode negative integer');
  }

  let result = '';
  let n = num;

  // Convert to base64 digits
  do {
    result = B64_CHR_BY_IDX[n % 64] + result;
    n = Math.floor(n / 64);
  } while (n > 0);

  // Pad to minimum length
  while (result.length < minLength) {
    result = 'A' + result;
  }

  return result;
}

/**
 * Convert Base64 string to integer
 */
export function b64ToInt(text: string): number {
  let result = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const index = B64_IDX_BY_CHR[char];

    if (index === undefined) {
      throw new Error(`Invalid Base64 character: ${char}`);
    }

    result = result * 64 + index;
  }

  return result;
}

/**
 * Convert Base64 code string to binary bytes
 */
export function codeB64ToB2(code: string): Uint8Array {
  const num = b64ToInt(code);
  const bits = code.length * 6;
  const paddedBits = bits + (2 * (code.length % 4)); // Add padding bits
  const bytes = Math.ceil(paddedBits / 8);

  const result = new Uint8Array(bytes);
  let value = num << (2 * (code.length % 4));

  for (let i = bytes - 1; i >= 0; i--) {
    result[i] = value & 0xFF;
    value >>>= 8;
  }

  return result;
}

/**
 * Convert l sextets from binary to Base64
 */
export function codeB2ToB64(data: Uint8Array, length: number): string {
  const bytes = Math.ceil(length * 3 / 4);
  let value = 0;

  for (let i = 0; i < Math.min(bytes, data.length); i++) {
    value = (value << 8) | data[i];
  }

  // Remove trailing bits
  const trailingBits = 2 * (length % 4);
  value >>>= trailingBits;

  return intToB64(value, length);
}

/**
 * Extract n sextets from binary data
 */
export function nabSextets(data: Uint8Array, count: number): string {
  return codeB2ToB64(data, count);
}

/**
 * Ceiling division for positive integers
 */
export function sceil(value: number): number {
  return Math.ceil(value);
}

/**
 * Check if all bytes in array are zero
 */
export function isAllZeros(data: Uint8Array): boolean {
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== 0) {
      return false;
    }
  }
  return true;
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Convert string to Uint8Array (UTF-8)
 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Convert Uint8Array to string (UTF-8)
 */
export function bytesToText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

/**
 * Compare two Uint8Arrays for equality
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}
