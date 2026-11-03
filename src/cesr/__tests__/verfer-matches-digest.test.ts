import { describe, expect, test } from 'bun:test';
import { TestKeys } from '../../keys/test-keys.js';
import { DigestCodes, digestVerfer, verferMatchesDigest } from '../digest.js';

const alice = TestKeys.iterator('alice').at(1).cesr;
const bob = TestKeys.iterator('bob').at(1).cesr;

describe('verferMatchesDigest (commitment hashed with its own digest code, as keripy)', () => {
  for (const [label, code] of [
    ['Blake3_256', DigestCodes.Blake3_256],
    ['Blake3_512', DigestCodes.Blake3_512],
    ['Blake2b_512', DigestCodes.Blake2b_512],
    ['Blake2s_256', DigestCodes.Blake2s_256],
    ['SHA3_512', DigestCodes.SHA3_512],
    ['SHA2_512', DigestCodes.SHA2_512],
    ['Blake2b_256', DigestCodes.Blake2b_256],
    ['SHA3_256', DigestCodes.SHA3_256],
    ['SHA2_256', DigestCodes.SHA2_256],
  ] as const) {
    test(`${label}: matches its own key, not another key`, () => {
      // setup: alice's commitment under this digest code
      const commitment = digestVerfer(alice, code);
      // call our method under test
      const own = verferMatchesDigest(alice, commitment);
      const other = verferMatchesDigest(bob, commitment);
      // assertions: the code prefix is kept, own key matches, another key does not
      expect(commitment.startsWith(code)).toBe(true);
      expect(own).toBe(true);
      expect(other).toBe(false);
    });
  }

  test('an unparseable digest is false, not a throw', () => {
    // call our method under test with garbage
    // assertions: false
    expect(verferMatchesDigest(alice, 'not-a-digest')).toBe(false);
  });

  // keripy 1.3.4 `Diger(ser=b"<alice[1] qb64>", code=DigDex.<name>).qb64`, computed 2026-10-09
  const KERIPY: Record<keyof typeof DigestCodes, string> = {
    Blake3_256: 'EGbgzK09e_katitXWHkL_iWViYKaA1WAyYQHFBdTTHfG',
    Blake2b_256: 'FDwdbDDUwPjEcWvXAwOB0MwbrQi6VrJPRlG-DQ2s4A-a',
    Blake2s_256: 'GA04fcUMiwdZaPckQQ_KUz6xo-ed3koKUlNlyutRJuyb',
    SHA3_256: 'HBqe0fyjJXs3tG8dOWX6t2kK6DjNjXanPOvVfgZieUwd',
    SHA2_256: 'IFTzjcwINYN8nUlhfX7U-9zyN7-TB0-JCWSYINBKmTWs',
    Blake3_512: '0DBm4MytPXv5GrYrV1h5C_4llYmCmgNVgMmEBxQXU0x3xkfLwaEG9sAkT-QOK6bumIln5sDOfGl3_JfwMIZveNQ4',
    Blake2b_512: '0EC6qPDxlWWVrpX356GrnuR0ud38iZMjhuIuQgxzM3xp-q78fCCL4sSapuFyU9Rv1Ohc8FkrG60E8PH4cXvOE8-W',
    SHA3_512: '0FBTIaJQ2I0vIVeskljr-AeN12F1i8E2SbRGW-DN4vS0rok4zBgsq6ZEOoJ7UPSIueQcJ0s3UZQ8u0gSElkz0UYe',
    SHA2_512: '0GAR6l9C_frIDjhlSU2nIpwQ4DScxCUzWPNZCseH62nb_afJyl5F4NlPUZlnhZmyEgMUGL1a0Auj5fhBjRJoctFo',
  };

  test('every digest code equals keripy byte for byte', () => {
    // call our method under test for each code
    const ours = Object.fromEntries(Object.entries(DigestCodes).map(([name, code]) => [name, digestVerfer(alice, code)]));
    // assertions: identical to keripy's Diger output
    expect(ours).toEqual(KERIPY);
  });

  test('an unsupported digest code is rejected, not hashed with a default', () => {
    // call our method under test with a non-digest code (Ed25519 verifier code)
    // assertions: throws naming the code
    expect(() => digestVerfer(alice, 'D')).toThrow('Unsupported digest code for a next-key commitment: D');
  });
});

