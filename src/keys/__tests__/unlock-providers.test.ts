import { describe, expect, test } from 'bun:test';
import { UnlockProviders } from '../unlock-providers.js';
import { UnlockRefs } from '../unlock-ref.js';

describe('UnlockProviders', () => {
  describe('passphrase', () => {
    test('withGrant provides a grant with a 32-byte derived secret stamped with the provider ref', async () => {
      // setup
      const provider = UnlockProviders.passphrase('hunter2');

      // call out our method under test
      const result = await provider.withGrant(async (grant) => ({ secret: grant.secret, ref: grant.ref }));

      // assertions: 32-byte secret; grant carries the provider's passphrase ref
      expect(result.secret.length).toBe(32);
      expect(result.ref.mechanism).toBe('passphrase');
      expect(UnlockRefs.equals(result.ref, provider.ref)).toBe(true);
    });

    test('same passphrase produces same secret', async () => {
      // setup
      const p1 = UnlockProviders.passphrase('hunter2');
      const p2 = UnlockProviders.passphrase('hunter2');

      // call out our method under test
      const s1 = await p1.withGrant(async (g) => g.secret);
      const s2 = await p2.withGrant(async (g) => g.secret);

      // assertions
      expect(s1).toEqual(s2);
    });

    test('passphrase built twice has equal refs; different phrases differ', async () => {
      // setup
      const a1 = UnlockProviders.passphrase('hunter2');
      const a2 = UnlockProviders.passphrase('hunter2');
      const b = UnlockProviders.passphrase('wrong');

      // call out our method under test
      const sameRef = UnlockRefs.equals(a1.ref, a2.ref);
      const otherRef = UnlockRefs.equals(a1.ref, b.ref);

      // assertions: the ref is derived from the secret, so it identifies the phrase
      expect(sameRef).toBe(true);
      expect(otherRef).toBe(false);
      expect(a1.ref).toEqual(UnlockRefs.passphrase(UnlockRefs.passphraseIdFor(await a1.withGrant(async (g) => g.secret))));
    });

    test('withGrant returns the callback result', async () => {
      // setup
      const provider = UnlockProviders.passphrase('test');

      // call out our method under test
      const result = await provider.withGrant(async () => 42);

      // assertions
      expect(result).toBe(42);
    });
  });

  describe('fixed', () => {
    test('withGrant provides the exact secret bytes', async () => {
      // setup
      const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const provider = UnlockProviders.fixed(secret);

      // call out our method under test
      const result = await provider.withGrant(async (grant) => grant.secret);

      // assertions
      expect(result).toEqual(secret);
    });

    test('fixed(secret) is a passphrase ref', () => {
      // setup
      const secret = new Uint8Array([0xab, 0xcd, 0xef, 0x01, 0x99]);

      // call out our method under test
      const provider = UnlockProviders.fixed(secret);

      // assertions: ref is the passphrase ref derived from the secret
      expect(provider.ref).toEqual(UnlockRefs.passphrase(UnlockRefs.passphraseIdFor(secret)));
    });
  });

  describe('unused', () => {
    test('rejects withGrant', async () => {
      // setup
      const provider = UnlockProviders.unused('test-unused');

      // call out our method under test
      const attempt = provider.withGrant(async () => 1);

      // assertions
      await expect(attempt).rejects.toThrow('test-unused');
      expect(provider.ref).toEqual(UnlockRefs.unused());
    });
  });
});
