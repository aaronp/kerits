import { describe, expect, test } from 'bun:test';
import { UnlockProviders } from '../unlock-providers.js';

describe('UnlockProviders', () => {
  describe('passphrase', () => {
    test('withGrant provides a grant with a 32-byte derived secret', async () => {
      const provider = UnlockProviders.passphrase('hunter2');
      const result = await provider.withGrant(async (grant) => {
        return { secret: grant.secret, providerId: grant.unlockProviderId };
      });
      expect(result.secret.length).toBe(32);
      expect(typeof (result.providerId as string)).toBe('string');
      expect((result.providerId as string).startsWith('passphrase:')).toBe(true);
    });

    test('same passphrase produces same secret', async () => {
      const p1 = UnlockProviders.passphrase('hunter2');
      const p2 = UnlockProviders.passphrase('hunter2');
      const s1 = await p1.withGrant(async (g) => g.secret);
      const s2 = await p2.withGrant(async (g) => g.secret);
      expect(s1).toEqual(s2);
    });

    test('different passphrases produce different secrets but same default id', async () => {
      // setup: id is a stable handle, not a secret fingerprint
      const p1 = UnlockProviders.passphrase('hunter2');
      const p2 = UnlockProviders.passphrase('wrong');

      // call out our method under test
      const s1 = await p1.withGrant(async (g) => ({ secret: g.secret, id: g.unlockProviderId }));
      const s2 = await p2.withGrant(async (g) => ({ secret: g.secret, id: g.unlockProviderId }));

      // assertions: secrets differ; default id is stable across phrases
      expect(s1.secret).not.toEqual(s2.secret);
      expect(s1.id).toBe(s2.id);
      expect(s1.id).toBe('passphrase:default');
    });

    test('optional id overrides the default passphrase provider id', () => {
      // setup / method under test
      const provider = UnlockProviders.passphrase('hunter2', 'passphrase:alice');

      // assertions
      expect(provider.id).toBe('passphrase:alice');
    });

    test('withGrant returns the callback result', async () => {
      const provider = UnlockProviders.passphrase('test');
      const result = await provider.withGrant(async () => 42);
      expect(result).toBe(42);
    });
  });

  describe('fixed', () => {
    test('withGrant provides the exact secret bytes', async () => {
      const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const provider = UnlockProviders.fixed(secret);
      const result = await provider.withGrant(async (grant) => grant.secret);
      expect(result).toEqual(secret);
    });

    test('id starts with fixed: prefix', () => {
      const secret = new Uint8Array([0xab, 0xcd, 0xef, 0x01, 0x99]);
      const provider = UnlockProviders.fixed(secret);
      expect((provider.id as string).startsWith('fixed:')).toBe(true);
      expect((provider.id as string)).toBe('fixed:abcdef01');
    });
  });

  describe('unused', () => {
    test('rejects withGrant', async () => {
      // setup
      const provider = UnlockProviders.unused('test-unused');

      // method under test / assertions
      await expect(provider.withGrant(async () => 1)).rejects.toThrow('test-unused');
      expect(provider.id).toBe('unused:must-set-explicit');
    });
  });
});
