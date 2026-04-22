import { describe, expect, it } from 'bun:test';
import { decodeKey } from '../../cesr/keys.js';
import { KeriKeyPairs } from '../keypairs.js';

describe('KeriKeyPairs', () => {
  describe('create', () => {
    it('returns a valid KeriKeyPair', () => {
      const kp = KeriKeyPairs.create();
      expect(kp.publicKey).toBeTruthy();
      expect(kp.privateKey).toBeTruthy();
      expect(kp.transferable).toBe(true);
      expect(kp.algo).toBe('ed25519');
    });

    it('produces unique keypairs on successive calls', () => {
      const a = KeriKeyPairs.create();
      const b = KeriKeyPairs.create();
      expect(a.publicKey).not.toBe(b.publicKey);
      expect(a.privateKey).not.toBe(b.privateKey);
    });
  });

  describe('forPrivateKey', () => {
    it('round-trips: create → decode private key → reconstruct', () => {
      const original = KeriKeyPairs.create();
      const decoded = decodeKey(original.privateKey);
      const reconstructed = KeriKeyPairs.forPrivateKey(decoded.raw);
      expect(reconstructed.publicKey).toBe(original.publicKey);
      expect(reconstructed.privateKey).toBe(original.privateKey);
      expect(reconstructed.transferable).toBe(original.transferable);
      expect(reconstructed.algo).toBe(original.algo);
    });
  });

  describe('fromSeed (Uint8Array)', () => {
    it('is deterministic — same seed produces the same key pair', () => {
      const seed = new Uint8Array(32);
      seed[0] = 42;
      const a = KeriKeyPairs.fromSeed(seed);
      const b = KeriKeyPairs.fromSeed(seed);
      expect(a.publicKey).toBe(b.publicKey);
      expect(a.privateKey).toBe(b.privateKey);
    });

    it('throws on wrong-length seed', () => {
      expect(() => KeriKeyPairs.fromSeed(new Uint8Array(16))).toThrow('Expected 32-byte seed');
      expect(() => KeriKeyPairs.fromSeed(new Uint8Array(64))).toThrow('Expected 32-byte seed');
    });
  });

  describe('fromSeedNumber', () => {
    it('is deterministic — same number produces the same key pair', () => {
      const a = KeriKeyPairs.fromSeedNumber(123);
      const b = KeriKeyPairs.fromSeedNumber(123);
      expect(a.publicKey).toBe(b.publicKey);
      expect(a.privateKey).toBe(b.privateKey);
    });

    it('different seeds produce different keys', () => {
      const a = KeriKeyPairs.fromSeedNumber(1);
      const b = KeriKeyPairs.fromSeedNumber(2);
      expect(a.publicKey).not.toBe(b.publicKey);
    });
  });

  describe('randomMnemonic', () => {
    it('returns a 24-word mnemonic by default', () => {
      const mnemonic = KeriKeyPairs.randomMnemonic();
      const words = mnemonic.split(' ');
      expect(words.length).toBe(24);
    });
  });

  describe('fromMnemonic', () => {
    it('is deterministic — same mnemonic produces the same key pair', () => {
      const mnemonic = KeriKeyPairs.randomMnemonic();
      const a = KeriKeyPairs.fromMnemonic(mnemonic);
      const b = KeriKeyPairs.fromMnemonic(mnemonic);
      expect(a.publicKey).toBe(b.publicKey);
      expect(a.privateKey).toBe(b.privateKey);
    });

    it('rejects an invalid mnemonic', () => {
      expect(() => KeriKeyPairs.fromMnemonic('not a valid mnemonic phrase')).toThrow('Invalid BIP39 mnemonic');
    });
  });
});
