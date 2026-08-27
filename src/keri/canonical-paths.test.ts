import { describe, expect, test } from 'bun:test';
import type { SAID } from '../common/types.js';
import { CanonicalPaths } from './canonical-paths.js';
import type { ProfileAlias } from './profile-alias.js';

describe('CanonicalPaths.didDocument', () => {
  test('returns /<alias>/did.json', () => {
    const alias = 'alice' as ProfileAlias;
    expect(CanonicalPaths.didDocument(alias)).toBe('/alice/did.json');
  });

  test('works with dotted alias', () => {
    const alias = 'bob.org' as ProfileAlias;
    expect(CanonicalPaths.didDocument(alias)).toBe('/bob.org/did.json');
  });
});

describe('CanonicalPaths.credentialPass', () => {
  test('returns expected path', () => {
    // setup: a SAID for a credential
    const said = 'Ecred000000000000000000000000000000000000' as SAID;

    // method under test
    const result = CanonicalPaths.credentialPass(said);

    // assertion: path follows the /.well-known/keri/said/<said>/pass convention
    expect(result).toBe(
      '/.well-known/keri/said/Ecred000000000000000000000000000000000000/pass',
    );
  });
});
