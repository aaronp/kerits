/**
 * Polyfill for Node crypto module in browser environment
 * Uses Web Crypto API
 */

export function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export const webcrypto = crypto;

export default {
  randomBytes,
  webcrypto,
};
