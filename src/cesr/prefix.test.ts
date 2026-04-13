import { describe, expect, it } from 'bun:test';
import { encodeKey } from './keys.js';
import { inspect } from './prefix.js';
import { encodeSig } from './sigs.js';

describe('cesr/prefix', () => {
  it('classifies an Ed25519 transferable key as "key"', () => {
    const encoded = encodeKey(new Uint8Array(32).fill(1), true);
    const info = inspect(encoded.qb64);
    expect(info.kind).toBe('key');
    expect(typeof info.code).toBe('string');
    expect(info.length).toBeGreaterThan(0);
  });

  it('classifies an Ed25519 non-transferable key as "key"', () => {
    const encoded = encodeKey(new Uint8Array(32).fill(2), false);
    const info = inspect(encoded.qb64);
    expect(info.kind).toBe('key');
  });

  it('classifies an Ed25519 signature as "sig"', () => {
    const encoded = encodeSig(new Uint8Array(64).fill(5), true);
    const info = inspect(encoded.qb64);
    expect(info.kind).toBe('sig');
  });

  it('returns "other" kind for unknown/invalid qb64', () => {
    // short invalid qb64 should not throw, returns "other"
    const info = inspect('????');
    expect(info.kind).toBe('other');
  });
});
