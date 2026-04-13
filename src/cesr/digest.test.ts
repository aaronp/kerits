import { describe, expect, it } from 'bun:test';
import { decodeDigest, encodeDigest } from './digest.js';
import { encodeKey } from './keys.js';

describe('cesr/digest', () => {
  it('encodeDigest encodes 32-byte blake3 digest to qb64', () => {
    const raw = new Uint8Array(32).fill(11);
    const qb64 = encodeDigest(raw);
    expect(typeof qb64).toBe('string');
    expect(qb64.length).toBeGreaterThan(0);
    // Blake3-256 code is 'E', so qb64 starts with 'E'
    expect(qb64[0]).toBe('E');
  });

  it('decodeDigest round-trips an encoded digest', () => {
    const raw = new Uint8Array(32).fill(12);
    const qb64 = encodeDigest(raw);
    const decoded = decodeDigest(qb64);
    expect(decoded.code).toBe('E');
    expect(decoded.raw).toEqual(raw);
  });

  it('decodeDigest throws on non-digest qb64', () => {
    // A key qb64 is not a valid digest
    const keyQb64 = encodeKey(new Uint8Array(32).fill(1)).qb64;
    expect(() => decodeDigest(keyQb64)).toThrow();
  });
});
