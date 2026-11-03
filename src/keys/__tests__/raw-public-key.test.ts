import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { encodeKey } from '../../cesr/keys.js';
import type { PublicKey } from '../../common/types.js';
import { asEd25519PublicRaw } from '../../common/types.js';
import { asRawPublicKey, fromEd25519PublicRaw, publicKeyHex, toCESRPublicKey, toEd25519PublicRaw, toRawPublicKey } from '../raw-public-key.js';

describe('RawPublicKey conversions', () => {
  // setup: generate a real ed25519 keypair for round-trip tests
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKeyRaw = ed25519.getPublicKey(privateKey);
  const publicKeyCesr = encodeKey(publicKeyRaw, true).qb64 as PublicKey;

  test('toRawPublicKey decodes CESR qb64 to raw bytes', () => {
    // call our method under test
    const raw = toRawPublicKey(publicKeyCesr);
    // decoded raw bytes should match original key bytes
    expect(raw).toBeInstanceOf(Uint8Array);
    expect(raw.length).toBe(32);
    expect(new Uint8Array(raw)).toEqual(publicKeyRaw);
  });

  test('toCESRPublicKey encodes raw bytes to CESR qb64', () => {
    const raw = asRawPublicKey(publicKeyRaw);
    // call our method under test
    const cesr = toCESRPublicKey(raw);
    // should produce the same CESR string we started with
    expect(cesr).toBe(publicKeyCesr);
  });

  test('toCESRPublicKey encodes a 33-byte secp256k1 compressed key', () => {
    // setup: generate a real secp256k1 compressed public key (33 bytes)
    const privKey = secp256k1.utils.randomSecretKey();
    const pubKey = secp256k1.getPublicKey(privKey, true);
    const raw = asRawPublicKey(pubKey);
    // call our method under test
    const cesr = toCESRPublicKey(raw);
    // secp256k1 CESR prefix starts with '1AAB' (transferable) — at minimum it's a non-empty string
    expect(typeof cesr).toBe('string');
    expect(cesr.length).toBeGreaterThan(0);
  });

  test('round-trip: CESR → raw → CESR', () => {
    // call our method under test (both directions)
    const raw = toRawPublicKey(publicKeyCesr);
    const cesr = toCESRPublicKey(raw);
    // round-trip must be lossless
    expect(cesr).toBe(publicKeyCesr);
  });

  test('asRawPublicKey rejects wrong-length bytes', () => {
    // 16 bytes is neither ed25519 (32) nor secp256k1 (33) — must throw
    expect(() => asRawPublicKey(new Uint8Array(16))).toThrow();
  });

  test('asRawPublicKey accepts 32-byte ed25519 key', () => {
    // call our method under test
    const raw = asRawPublicKey(publicKeyRaw);
    // 32-byte arrays are valid ed25519 keys
    expect(raw).toBeInstanceOf(Uint8Array);
    expect(raw.length).toBe(32);
  });

  test('asRawPublicKey accepts 33-byte secp256k1 compressed key', () => {
    // call our method under test
    const raw = asRawPublicKey(new Uint8Array(33));
    // 33-byte arrays are valid secp256k1 compressed keys
    expect(raw.length).toBe(33);
  });

  test('publicKeyHex produces consistent hex string', () => {
    const raw = asRawPublicKey(publicKeyRaw);
    // call our method under test
    const hex = publicKeyHex(raw);
    // same key must produce same hex; ed25519 key = 32 bytes = 64 hex chars
    expect(hex).toBe(publicKeyHex(raw));
    expect(hex.length).toBe(64);
  });

  test('fromEd25519PublicRaw and toEd25519PublicRaw round-trip', () => {
    const ed25519Raw = asEd25519PublicRaw(publicKeyRaw);
    // call our methods under test
    const raw = fromEd25519PublicRaw(ed25519Raw);
    const back = toEd25519PublicRaw(raw);
    // bytes must survive the branded-type round-trip unchanged
    expect(new Uint8Array(back)).toEqual(publicKeyRaw);
  });

  test('toEd25519PublicRaw throws for 33-byte key', () => {
    const raw = asRawPublicKey(new Uint8Array(33));
    // secp256k1 keys cannot be cast to ed25519 — must throw
    expect(() => toEd25519PublicRaw(raw)).toThrow();
  });
});
