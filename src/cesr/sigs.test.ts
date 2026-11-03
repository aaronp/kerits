import { secp256k1 } from '@noble/curves/secp256k1.js';

import { describe, expect, it, test } from 'bun:test';
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

describe('encodeSig / decodeSig secp256k1', () => {
  test('secp256k1 round-trip: encode → decode preserves raw bytes and algo', () => {
    // setup: generate a real secp256k1 signature over test data
    const privateKey = secp256k1.utils.randomSecretKey();
    const data = new TextEncoder().encode('test data');
    const sig = secp256k1.sign(data, privateKey); // prehash: true (default) — returns 64-byte compact

    // method under test: encodeSig with explicit 'secp256k1' algo, then decodeSig
    const encoded = encodeSig(sig, 'secp256k1');
    expect(encoded.algo).toBe('secp256k1');
    expect(typeof encoded.qb64).toBe('string');
    expect(encoded.raw).toEqual(sig);

    const decoded = decodeSig(encoded.qb64);

    // assertions: algo and raw bytes preserved through encode → decode round-trip
    expect(decoded.algo).toBe('secp256k1');
    expect(decoded.raw).toEqual(sig);
  });

  test('ed25519 round-trip still works (backward compat)', () => {
    // setup: a fixed-byte ed25519-style sig (64 bytes)
    const sig = new Uint8Array(64).fill(0x42);

    // method under test: encodeSig without algo arg (defaults to ed25519), then decodeSig
    const encoded = encodeSig(sig);

    // assertions: algo is ed25519 and round-trip is lossless
    expect(encoded.algo).toBe('ed25519');
    const decoded = decodeSig(encoded.qb64);
    expect(decoded.algo).toBe('ed25519');
    expect(decoded.raw).toEqual(sig);
  });
});
