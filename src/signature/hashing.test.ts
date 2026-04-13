import { describe, expect, it } from 'bun:test';
import { hash, hashBase64Url, hashHex, hashObject } from './hashing.js';

describe('hash (blake3)', () => {
  it('returns 32-byte digest', () => {
    const data = new TextEncoder().encode('hello world');
    const digest = hash(data);
    expect(digest).toBeInstanceOf(Uint8Array);
    expect(digest.length).toBe(32);
  });

  it('is deterministic', () => {
    const data = new TextEncoder().encode('hello world');
    expect(hash(data)).toEqual(hash(data));
  });

  it('explicit blake3 algorithm matches default', () => {
    const data = new TextEncoder().encode('test');
    expect(hash(data, 'blake3')).toEqual(hash(data));
  });
});

describe('hashHex', () => {
  it('returns 64-char hex string for 32-byte hash', () => {
    const data = new TextEncoder().encode('hello world');
    const hex = hashHex(data);
    expect(hex.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
  });
});

describe('hashBase64Url', () => {
  it('returns 43-char base64url string for 32-byte hash', () => {
    const data = new TextEncoder().encode('hello world');
    const b64 = hashBase64Url(data);
    expect(b64.length).toBe(43); // 32 bytes = 43 base64url chars (no padding)
    expect(b64).not.toContain('=');
    expect(b64).not.toContain('+');
    expect(b64).not.toContain('/');
  });
});

describe('hashObject', () => {
  it('produces deterministic hash regardless of key order', () => {
    const a = hashObject({ b: 2, a: 1 });
    const b = hashObject({ a: 1, b: 2 });
    expect(a).toBe(b);
  });

  it('returns a base64url string', () => {
    const result = hashObject({ test: true });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain('=');
  });
});
