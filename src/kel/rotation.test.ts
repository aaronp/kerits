/**
 * Tests for KEL Rotation - Key Revelation Resolution
 *
 * Ported from kv4 packages/kerits/src/kel/rotation.ts behavior.
 * These tests exercise the pure rotation logic.
 */

import { describe, expect, test } from 'bun:test';
import { digestVerfer } from '../cesr/digest.js';
import {
  assertCurrentThresholdSatisfiable,
  assertKeyRevelation,
  buildNextCommitment,
  matchKeyRevelation,
  resolveCurrentKeys,
} from './rotation.js';

// Valid Ed25519 CESR qb64 keys (from existing passing tests)
const key1 = 'DGApkA68ECWhLmEVn3iVdSBvJEKINLeTHiqI_IBru1Dy';
const key2 = 'DHr0-I-mMN7h6cLMOTRJkkfPuMd0vgQPrOk4Y3edaHjr';

describe('resolveCurrentKeys', () => {
  test('resolves all keys from digests', async () => {
    const digest1 = digestVerfer(key1);

    const result = await resolveCurrentKeys({ n: [digest1], nt: '1' }, async (digest) =>
      digest === digest1 ? key1 : undefined,
    );

    expect(result.k).toEqual([key1]);
    expect(result.kt).toBe('1');
  });

  test('throws when digest cannot be resolved', async () => {
    await expect(resolveCurrentKeys({ n: ['Eunknown...'], nt: '1' }, async () => undefined)).rejects.toThrow(
      /Cannot resolve next key digest/,
    );
  });
});

describe('matchKeyRevelation', () => {
  test('matches revealed keys against prior digests', () => {
    const digest1 = digestVerfer(key1);

    const result = matchKeyRevelation({
      priorN: [digest1],
      priorNt: '1',
      proposedK: [key1],
    });

    expect(result.revealed).toEqual([{ kIndex: 0, nIndex: 0 }]);
    expect(result.augmented).toEqual([]);
    expect(result.priorNtSatisfied).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('detects augmented (new) keys', () => {
    const digest1 = digestVerfer(key1);

    const result = matchKeyRevelation({
      priorN: [digest1],
      priorNt: '1',
      proposedK: [key1, key2],
    });

    expect(result.revealed).toEqual([{ kIndex: 0, nIndex: 0 }]);
    expect(result.augmented).toEqual([1]);
    expect(result.priorNtSatisfied).toBe(true);
  });

  test('detects duplicate digests in priorN', () => {
    const digest = digestVerfer(key1);
    const result = matchKeyRevelation({
      priorN: [digest, digest],
      priorNt: '1',
      proposedK: [key1],
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('duplicate digest');
  });
});

describe('assertKeyRevelation', () => {
  test('passes for valid revelation', () => {
    const digest1 = digestVerfer(key1);

    expect(() => assertKeyRevelation({ n: [digest1], nt: '1' }, [key1])).not.toThrow();
  });

  test('throws when threshold not met', () => {
    const digest1 = digestVerfer(key1);
    const digest2 = digestVerfer(key2);

    expect(() => assertKeyRevelation({ n: [digest1, digest2], nt: '2' }, [key1])).toThrow(
      /Prior-next threshold not satisfied/,
    );
  });
});

describe('assertCurrentThresholdSatisfiable', () => {
  test('passes when threshold <= key count', () => {
    expect(() => assertCurrentThresholdSatisfiable('2', 3)).not.toThrow();
  });

  test('throws when threshold exceeds key count', () => {
    expect(() => assertCurrentThresholdSatisfiable('5', 3)).toThrow(/Current threshold not satisfiable/);
  });

  test('passes for weighted threshold (non-numeric)', () => {
    expect(() => assertCurrentThresholdSatisfiable([['1/2', '1/2']], 2)).not.toThrow();
  });
});

describe('buildNextCommitment', () => {
  test('hashes keys to digests', () => {
    const result = buildNextCommitment([key1], '1');

    expect(result.n).toHaveLength(1);
    expect(result.n[0]).toBe(digestVerfer(key1));
    expect(result.nt).toBe('1');
  });
});
