import { describe, expect, it } from 'bun:test';
import type { EncodedKey, EncodedSig, KeyAlgo, Qb64, SaidAlgo, SigAlgo } from './types.js';

describe('cesr/types', () => {
  it('Qb64 is assignable from string', () => {
    const q: Qb64 = 'DHello';
    expect(typeof q).toBe('string');
  });

  it('SaidAlgo only allows blake3-256', () => {
    const algo: SaidAlgo = 'blake3-256';
    expect(algo).toBe('blake3-256');
  });

  it('KeyAlgo only allows ed25519', () => {
    const algo: KeyAlgo = 'ed25519';
    expect(algo).toBe('ed25519');
  });

  it('SigAlgo only allows ed25519', () => {
    const algo: SigAlgo = 'ed25519';
    expect(algo).toBe('ed25519');
  });

  it('EncodedKey has algo, qb64, raw', () => {
    const raw = new Uint8Array(32);
    const key: EncodedKey = { algo: 'ed25519', qb64: 'DHello', raw };
    expect(key.algo).toBe('ed25519');
    expect(key.qb64).toBe('DHello');
    expect(key.raw).toBe(raw);
  });

  it('EncodedSig has algo, qb64, raw', () => {
    const raw = new Uint8Array(64);
    const sig: EncodedSig = { algo: 'ed25519', qb64: '0BHello', raw };
    expect(sig.algo).toBe('ed25519');
    expect(sig.qb64).toBe('0BHello');
    expect(sig.raw).toBe(raw);
  });
});
