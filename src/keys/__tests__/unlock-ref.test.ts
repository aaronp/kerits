import { describe, expect, test } from 'bun:test';
import { UnlockRefs } from '../unlock-ref.js';

describe('UnlockRefs', () => {
  test('equals: same mechanism, different coordinates → false', () => {
    // setup: refs across mechanisms and coordinates
    const { passphrase, passkeyPrf, unused, equals } = UnlockRefs;

    // call out our method under test: equals
    // assertions: equal only when mechanism and coordinates both match
    expect(equals(passphrase('a'), passphrase('b'))).toBe(false);
    expect(equals(passkeyPrf('x'), passkeyPrf('x'))).toBe(true);
    expect(equals(passphrase('x'), passkeyPrf('x'))).toBe(false);
    expect(equals(unused(), unused())).toBe(true);
  });

  test('toJSON → fromJSON round-trips every variant', () => {
    // setup: one ref per mechanism
    const refs = [UnlockRefs.passkeyPrf('c1'), UnlockRefs.passphrase('p1'), UnlockRefs.unused()];

    for (const r of refs) {
      // call out our method under test: fromJSON(toJSON(r))
      const back = UnlockRefs.fromJSON(UnlockRefs.toJSON(r));

      // assertions: ok and equal to the original
      expect(back.ok).toBe(true);
      if (back.ok) expect(UnlockRefs.equals(back.value, r)).toBe(true);
    }
  });

  test('fromJSON rejects unknown or malformed input', () => {
    // setup: bad shapes
    const bad: unknown[] = [
      { mechanism: 'hsm' },
      { mechanism: 'passphrase' },
      { mechanism: 'passkey-prf', credentialId: '' },
      'passphrase:ui',
      null,
    ];

    for (const raw of bad) {
      // call out our method under test: fromJSON
      const r = UnlockRefs.fromJSON(raw);

      // assertions: typed error
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.kind).toBe('invalid-unlock-ref');
    }
  });

  test('passphraseIdFor is deterministic, distinct per secret, and does not contain the secret', () => {
    // setup: two secrets
    const enc = new TextEncoder();
    const a = enc.encode('hunter2');
    const b = enc.encode('hunter3');

    // call out our method under test: passphraseIdFor
    const id = UnlockRefs.passphraseIdFor(a);

    // assertions
    expect(UnlockRefs.passphraseIdFor(enc.encode('hunter2'))).toBe(id);
    expect(UnlockRefs.passphraseIdFor(b)).not.toBe(id);
    expect(id).not.toContain('hunter2');
    expect(id).toHaveLength(22);
  });
});
