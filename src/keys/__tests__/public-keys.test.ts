import { describe, expect, it } from 'bun:test';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { PublicKeys } from '../public-keys.js';

describe('PublicKeys', () => {
  // setup: create a real keypair to get a valid qb64 public key for all tests
  const pair = KeriKeyPairs.create();
  const cesrKey = PublicKeys.parse(pair.publicKey);
  const rawKey = PublicKeys.toRaw(cesrKey);

  describe('fromRaw', () => {
    it('converts ed25519 raw bytes to qb64 PublicKey', () => {
      // call our method under test
      const result = PublicKeys.fromRaw(rawKey);
      // fromRaw(toRaw(key)) must reproduce the original qb64
      expect(result).toBe(cesrKey);
    });
  });

  describe('toRaw', () => {
    it('converts qb64 PublicKey back to raw bytes', () => {
      // call our method under test
      const raw = PublicKeys.toRaw(cesrKey);
      // raw bytes must match the bytes we started with
      expect(raw).toEqual(rawKey);
    });
  });

  describe('round-trip', () => {
    it('fromRaw(toRaw(key)) === key', () => {
      // call our methods under test in sequence
      // encoding and decoding must be lossless
      expect(PublicKeys.fromRaw(PublicKeys.toRaw(cesrKey))).toBe(cesrKey);
    });
  });

  describe('parse', () => {
    it('brands a valid qb64 key string as PublicKey', () => {
      // call our method under test with a valid qb64 string
      const result = PublicKeys.parse(cesrKey as string);
      // valid input must be returned as-is (branded)
      expect(result).toBe(cesrKey);
    });

    it('throws on malformed string', () => {
      // call our method under test with an invalid string
      // parse must reject input that is not valid CESR
      expect(() => PublicKeys.parse('not-a-key')).toThrow();
    });

    it('throws on empty string', () => {
      // call our method under test with an empty string
      // parse must reject empty input
      expect(() => PublicKeys.parse('')).toThrow();
    });
  });

  describe('algo', () => {
    it('detects ed25519 from CESR prefix', () => {
      // call our method under test
      // KeriKeyPairs.create() produces ed25519 keys — algo must return 'ed25519'
      expect(PublicKeys.algo(cesrKey)).toBe('ed25519');
    });
  });

  describe('digest', () => {
    it('computes a Blake3 next-key digest', () => {
      // call our method under test
      const d = PublicKeys.digest(cesrKey);
      // Blake3-256 digests are 'E'-prefixed 44-char qb64 strings
      expect(typeof d).toBe('string');
      expect(d.length).toBeGreaterThan(0);
      expect(d.startsWith('E')).toBe(true);
    });

    it('is deterministic', () => {
      // call our method under test twice with the same input
      // digest must be pure — same key always yields same digest
      expect(PublicKeys.digest(cesrKey)).toBe(PublicKeys.digest(cesrKey));
    });

    it('differs for different keys', () => {
      // setup: create a second keypair
      const pair2 = KeriKeyPairs.create();
      const key2 = PublicKeys.parse(pair2.publicKey);
      // call our method under test on both keys
      // distinct keys must produce distinct digests
      expect(PublicKeys.digest(cesrKey)).not.toBe(PublicKeys.digest(key2));
    });
  });
});
