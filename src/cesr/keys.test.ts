import { describe, expect, it } from 'bun:test';
import { decodeKey, encodeKey } from './keys.js';

describe('cesr/keys', () => {
  it('encodeKey returns an EncodedKey with algo ed25519', () => {
    const publicKey = new Uint8Array(32).fill(1);
    const result = encodeKey(publicKey);
    expect(result.algo).toBe('ed25519');
    expect(typeof result.qb64).toBe('string');
    expect(result.qb64.length).toBeGreaterThan(0);
    expect(result.raw).toBe(publicKey);
  });

  it('encodeKey transferable vs non-transferable produce different codes', () => {
    const publicKey = new Uint8Array(32).fill(2);
    const transferable = encodeKey(publicKey, true);
    const nonTransferable = encodeKey(publicKey, false);
    expect(transferable.qb64).not.toBe(nonTransferable.qb64);
  });

  it('decodeKey round-trips an encoded transferable key', () => {
    const publicKey = new Uint8Array(32).fill(3);
    const encoded = encodeKey(publicKey, true);
    const decoded = decodeKey(encoded.qb64);
    expect(decoded.algo).toBe('ed25519');
    expect(decoded.qb64).toBe(encoded.qb64);
    expect(decoded.raw).toEqual(publicKey);
  });

  it('decodeKey round-trips a non-transferable key', () => {
    const publicKey = new Uint8Array(32).fill(4);
    const encoded = encodeKey(publicKey, false);
    const decoded = decodeKey(encoded.qb64);
    expect(decoded.algo).toBe('ed25519');
    expect(decoded.raw).toEqual(publicKey);
  });

  it('decodeKey throws on unsupported code', () => {
    // Encode a digest-type qb64 (not a key code) and expect throw
    expect(() => decodeKey('EHello___world______________')).toThrow();
  });
});
