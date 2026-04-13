import { describe, expect, it } from 'bun:test';
import { encodeKey } from './keys.js';
import { decodeSig, encodeSig } from './sigs.js';

describe('cesr/sigs', () => {
  it('encodeSig returns an EncodedSig with algo ed25519', () => {
    const rawSig = new Uint8Array(64).fill(7);
    const result = encodeSig(rawSig);
    expect(result.algo).toBe('ed25519');
    expect(typeof result.qb64).toBe('string');
    expect(result.qb64.length).toBeGreaterThan(0);
    expect(result.raw).toBe(rawSig);
  });

  it('encodeSig transferable vs non-transferable differ', () => {
    const rawSig = new Uint8Array(64).fill(8);
    const transferable = encodeSig(rawSig, true);
    const nonTransferable = encodeSig(rawSig, false);
    expect(transferable.qb64).not.toBe(nonTransferable.qb64);
  });

  it('decodeSig round-trips a transferable signature', () => {
    const rawSig = new Uint8Array(64).fill(9);
    const encoded = encodeSig(rawSig, true);
    const decoded = decodeSig(encoded.qb64);
    expect(decoded.algo).toBe('ed25519');
    expect(decoded.qb64).toBe(encoded.qb64);
    expect(decoded.raw).toEqual(rawSig);
  });

  it('decodeSig round-trips a non-transferable signature (algo check)', () => {
    const rawSig = new Uint8Array(64).fill(10);
    const encoded = encodeSig(rawSig, false);
    const decoded = decodeSig(encoded.qb64);
    expect(decoded.algo).toBe('ed25519');
    expect(decoded.qb64).toBe(encoded.qb64);
  });

  it('decodeSig throws on unsupported code', () => {
    // A key qb64 is not a valid sig
    const keyQb64 = encodeKey(new Uint8Array(32).fill(1)).qb64;
    expect(() => decodeSig(keyQb64)).toThrow();
  });
});
