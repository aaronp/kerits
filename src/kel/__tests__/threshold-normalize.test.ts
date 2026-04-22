import { describe, expect, test } from 'bun:test';
import {
  normalizeThreshold,
  checkNormalizedThreshold,
  type NormalizedThreshold,
} from '../threshold-normalize.js';

describe('normalizeThreshold', () => {
  test('simple integer string "1" with 1 key', () => {
    const result = normalizeThreshold('1', 1);
    expect(result).toEqual({ type: 'simple', m: 1, n: 1 });
  });

  test('simple integer string "2" with 3 keys', () => {
    const result = normalizeThreshold('2', 3);
    expect(result).toEqual({ type: 'simple', m: 2, n: 3 });
  });

  test('fractional string "2/3" with 3 keys', () => {
    const result = normalizeThreshold('2/3', 3);
    expect(result).toEqual({ type: 'simple', m: 2, n: 3 });
  });

  test('fractional string denominator must match key count', () => {
    expect(() => normalizeThreshold('2/5', 3)).toThrow();
  });

  test('weighted threshold single clause', () => {
    const result = normalizeThreshold([['1/2', '1/2']], 2);
    expect(result.type).toBe('weighted');
    if (result.type === 'weighted') {
      expect(result.clauses).toHaveLength(1);
      expect(result.clauses[0]!.weights).toHaveLength(2);
      expect(result.clauses[0]!.weights[0]).toEqual({ numerator: 1, denominator: 2 });
    }
  });

  test('weighted threshold multi-clause', () => {
    const result = normalizeThreshold([['1/2', '1/2'], ['1/3', '2/3']], 2);
    expect(result.type).toBe('weighted');
    if (result.type === 'weighted') {
      expect(result.clauses).toHaveLength(2);
    }
  });

  test('m > keyCount throws', () => {
    expect(() => normalizeThreshold('5', 3)).toThrow();
  });

  test('malformed string throws', () => {
    expect(() => normalizeThreshold('abc', 2)).toThrow();
  });
});

describe('checkNormalizedThreshold', () => {
  test('simple: 1-of-1 with 1 sig passes', () => {
    const t: NormalizedThreshold = { type: 'simple', m: 1, n: 1 };
    const result = checkNormalizedThreshold(t, new Set([0]));
    expect(result.satisfied).toBe(true);
  });

  test('simple: 2-of-3 with 2 sigs passes', () => {
    const t: NormalizedThreshold = { type: 'simple', m: 2, n: 3 };
    const result = checkNormalizedThreshold(t, new Set([0, 2]));
    expect(result.satisfied).toBe(true);
  });

  test('simple: 2-of-3 with 1 sig fails', () => {
    const t: NormalizedThreshold = { type: 'simple', m: 2, n: 3 };
    const result = checkNormalizedThreshold(t, new Set([0]));
    expect(result.satisfied).toBe(false);
  });

  test('weighted: clause satisfied when weights sum >= 1.0', () => {
    const t: NormalizedThreshold = {
      type: 'weighted',
      clauses: [{ weights: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] }],
    };
    const result = checkNormalizedThreshold(t, new Set([0, 1]));
    expect(result.satisfied).toBe(true);
  });

  test('weighted: clause not satisfied when weights sum < 1.0', () => {
    const t: NormalizedThreshold = {
      type: 'weighted',
      clauses: [{ weights: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] }],
    };
    const result = checkNormalizedThreshold(t, new Set([2]));
    expect(result.satisfied).toBe(false);
  });

  test('weighted: all clauses must be satisfied (AND)', () => {
    const t: NormalizedThreshold = {
      type: 'weighted',
      clauses: [
        { weights: [{ numerator: 1, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { weights: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 1 }] },
      ],
    };
    const result = checkNormalizedThreshold(t, new Set([0]));
    expect(result.satisfied).toBe(false);
    const result2 = checkNormalizedThreshold(t, new Set([0, 1]));
    expect(result2.satisfied).toBe(true);
  });
});
