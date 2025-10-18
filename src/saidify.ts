/**
 * KERI SAID (Self-Addressing IDentifier) implementation
 *
 * Generates a cryptographic self-addressing identifier for a JSON object
 * using Blake3-256 hash in CESR (Composable Event Streaming Representation) format.
 */

import { blake3 } from '@noble/hashes/blake3.js';

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
 * Encode raw bytes as CESR with given code
 *
 * CESR encoding for fixed-size codes:
 * 1. Calculate pad size: ps = (3 - (raw.length % 3)) % 3
 * 2. Prepend ps zero bytes to raw
 * 3. Base64url encode the padded bytes
 * 4. Slice off first (code.length % 4) characters and prepend code
 *
 * @param raw - Raw bytes to encode
 * @param code - CESR code (e.g., 'E' for Blake3-256)
 * @returns CESR-encoded string
 */
function encodeCESR(raw: Uint8Array, code: string): string {
  // Calculate padding size
  const ps = (3 - (raw.length % 3)) % 3;

  // Create padded bytes: ps zero bytes + raw
  const padded = new Uint8Array(ps + raw.length);
  for (let i = 0; i < ps; i++) {
    padded[i] = 0;
  }
  for (let i = 0; i < raw.length; i++) {
    padded[ps + i] = raw[i]!;
  }

  // Base64 encode
  const b64 = encodeBase64Url(padded);

  // Slice and prepend code
  const cs = code.length;  // code size
  const sliceOffset = cs % 4;

  return code + b64.slice(sliceOffset);
}

/**
 * Saidify options
 */
export interface SaidifyOptions {
  /** Field label for the SAID (default: "d") */
  label?: string;
  /** CESR code for Blake3-256 (default: "E") */
  code?: string;
  /** Additional labels to replace with placeholder (e.g., ["i"] for TEL inception) */
  labels?: string[];
}

/**
 * Generate SAID for a JSON object
 *
 * The SAID algorithm:
 * 1. Replace the SAID field with '#' * 44 (placeholder)
 * 2. Serialize to JSON (compact, sorted keys)
 * 3. Compute Blake3-256 hash
 * 4. Encode as CESR: code + base64url(hash)
 * 5. Replace placeholder with computed SAID
 *
 * @param obj - The JSON object to saidify
 * @param options - Saidify options
 * @returns The object with SAID field populated
 */
export function saidify<T extends Record<string, any>>(
  obj: T,
  options: SaidifyOptions = {}
): T {
  const label = options.label || 'd';
  const code = options.code || 'E'; // Blake3-256 code in CESR
  const additionalLabels = options.labels || [];

  // Check that primary field exists
  if (!(label in obj)) {
    throw new Error(`Missing id field labeled=${label} in sad.`);
  }

  // Create a copy with placeholder (44 '#' chars, matching CESR output length)
  const placeholder = '#'.repeat(44);
  const sad = { ...obj, [label]: placeholder };

  // Replace additional labels with placeholder too (e.g., 'i' for TEL inception)
  for (const additionalLabel of additionalLabels) {
    if (additionalLabel in obj) {
      (sad as any)[additionalLabel] = placeholder;
    }
  }

  // Serialize to JSON (compact, sorted keys)
  const serialized = serializeCanonical(sad);

  // Compute Blake3-256 hash
  const hash = blake3(new TextEncoder().encode(serialized), { dkLen: 32 });

  // Encode as CESR
  const said = encodeCESR(hash, code);

  // Return object with computed SAID (set both primary and additional labels to same SAID)
  const result = { ...obj, [label]: said } as T;
  for (const additionalLabel of additionalLabels) {
    if (additionalLabel in obj) {
      (result as any)[additionalLabel] = said;
    }
  }

  return result;
}

/**
 * Canonical JSON serialization (sorted keys, compact)
 */
function serializeCanonical(obj: any): string {
  if (obj === null) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }

  if (typeof obj === 'number') {
    return String(obj);
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => serializeCanonical(item));
    return '[' + items.join(',') + ']';
  }

  if (typeof obj === 'object') {
    // Preserve key order (no sorting) to match Python dict insertion order
    const keys = Object.keys(obj);
    const pairs = keys.map(key => {
      const value = serializeCanonical(obj[key]);
      return JSON.stringify(key) + ':' + value;
    });
    return '{' + pairs.join(',') + '}';
  }

  throw new Error(`Cannot serialize value of type ${typeof obj}`);
}
