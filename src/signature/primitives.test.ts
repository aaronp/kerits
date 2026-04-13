import { describe, expect, it } from 'bun:test';
import {
  bytesToHex,
  canonicalize,
  canonicalizeToBytes,
  decodeBase64Url,
  encodeBase64Url,
  generateKeyPair,
  getPublicKey,
  hexToBytes,
  randomBytes,
  sha256,
  sha256Hex,
  sha512,
  sha512Hex,
  sign,
  verify,
} from './primitives.js';

describe('Ed25519 key operations', () => {
  it('generates a keypair with 32-byte keys', () => {
    const kp = generateKeyPair();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.privateKey).toBeInstanceOf(Uint8Array);
    expect(kp.privateKey.length).toBe(32);
    expect(kp.publicKey.length).toBe(32);
  });

  it('derives public key from private key', () => {
    const kp = generateKeyPair();
    const derived = getPublicKey(kp.privateKey);
    expect(derived).toEqual(kp.publicKey);
  });

  it('signs and verifies data', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sig = sign(data, kp.privateKey);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBe(64); // Ed25519 signature is 64 bytes
    expect(verify(sig, data, kp.publicKey)).toBe(true);
  });

  it('rejects invalid signature', () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode('hello world');
    const sig = sign(data, kp.privateKey);
    // Corrupt the signature
    const bad = new Uint8Array(sig);
    bad[0] ^= 0xff;
    expect(verify(bad, data, kp.publicKey)).toBe(false);
  });
});

describe('Hashing', () => {
  it('sha256 returns 32 bytes', () => {
    const data = new TextEncoder().encode('test');
    const h = sha256(data);
    expect(h).toBeInstanceOf(Uint8Array);
    expect(h.length).toBe(32);
  });

  it('sha256Hex returns 64-char hex string', () => {
    const data = new TextEncoder().encode('test');
    const hex = sha256Hex(data);
    expect(hex.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
  });

  it('sha512 returns 64 bytes', () => {
    const data = new TextEncoder().encode('test');
    const h = sha512(data);
    expect(h).toBeInstanceOf(Uint8Array);
    expect(h.length).toBe(64);
  });

  it('sha512Hex returns 128-char hex string', () => {
    const data = new TextEncoder().encode('test');
    const hex = sha512Hex(data);
    expect(hex.length).toBe(128);
    expect(/^[0-9a-f]+$/.test(hex)).toBe(true);
  });
});

describe('Canonicalization', () => {
  it('canonicalize produces deterministic JSON', () => {
    const a = canonicalize({ b: 2, a: 1 });
    const b = canonicalize({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":1,"b":2}');
  });

  it('canonicalizeToBytes returns UTF-8 encoded bytes', () => {
    const bytes = canonicalizeToBytes({ a: 1 });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(bytes)).toBe('{"a":1}');
  });
});

describe('randomBytes', () => {
  it('returns requested length', () => {
    const bytes = randomBytes(16);
    expect(bytes.length).toBe(16);
  });
});

describe('Hex utilities', () => {
  it('hexToBytes and bytesToHex round-trip', () => {
    const hex = 'deadbeef';
    const bytes = hexToBytes(hex);
    expect(bytesToHex(bytes)).toBe(hex);
  });

  it('hexToBytes rejects odd-length string', () => {
    expect(() => hexToBytes('abc')).toThrow();
  });
});

describe('base64url re-exports', () => {
  it('encodeBase64Url and decodeBase64Url round-trip', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeBase64Url(original);
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toEqual(original);
  });
});
