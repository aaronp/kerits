/**
 * Tests for Threshold Logic
 *
 * Comprehensive test coverage for:
 * - Simple and weighted threshold checking (from kv4 packages/core/src/threshold-check.test.ts)
 * - Threshold parsing and validation (from kv4 packages/kerits/src/threshold.ts)
 */

import { describe, expect, test } from 'bun:test';
import {
  checkThreshold,
  parseSimpleThreshold,
  resolveThresholdValue,
  validateThreshold,
  validateThresholdSpec,
  validateWeightedThreshold,
} from './threshold.js';

// =====================================================================
// Tests from kv4 packages/core/src/threshold-check.test.ts
// =====================================================================

describe('checkThreshold - Simple Integer Thresholds', () => {
  test('2-of-3 threshold: satisfied with 2 signatures', () => {
    const result = checkThreshold(2, [0, 1], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(2);
    expect(result.collected).toBe(2);
    expect(result.type).toBe('simple');
  });

  test('2-of-3 threshold: not satisfied with 1 signature', () => {
    const result = checkThreshold(2, [0], 3);

    expect(result.satisfied).toBe(false);
    expect(result.required).toBe(2);
    expect(result.collected).toBe(1);
    expect(result.type).toBe('simple');
  });

  test('2-of-3 threshold: satisfied with 3 signatures', () => {
    const result = checkThreshold(2, [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(2);
    expect(result.collected).toBe(3);
    expect(result.type).toBe('simple');
  });

  test('unanimous 3-of-3: satisfied with all signatures', () => {
    const result = checkThreshold(3, [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(3);
    expect(result.collected).toBe(3);
  });

  test('unanimous 3-of-3: not satisfied with 2 signatures', () => {
    const result = checkThreshold(3, [0, 1], 3);

    expect(result.satisfied).toBe(false);
    expect(result.required).toBe(3);
    expect(result.collected).toBe(2);
  });

  test('1-of-5 threshold: satisfied with 1 signature', () => {
    const result = checkThreshold(1, [2], 5);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(1);
    expect(result.collected).toBe(1);
  });

  test('0-of-3 threshold (always satisfied)', () => {
    const result = checkThreshold(0, [], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(0);
    expect(result.collected).toBe(0);
  });

  test('single key 1-of-1: satisfied', () => {
    const result = checkThreshold(1, [0], 1);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(1);
    expect(result.collected).toBe(1);
  });

  test('accepts Set of signed indices', () => {
    const result = checkThreshold(2, new Set([0, 1]), 3);

    expect(result.satisfied).toBe(true);
    expect(result.collected).toBe(2);
  });
});

describe('checkThreshold - String Threshold Parsing', () => {
  test('parses "2" as integer threshold', () => {
    const result = checkThreshold('2', [0, 1], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(2);
    expect(result.collected).toBe(2);
    expect(result.type).toBe('simple');
  });

  test('parses "3" as unanimous threshold', () => {
    const result = checkThreshold('3', [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.required).toBe(3);
  });

  test('throws on invalid string threshold', () => {
    expect(() => checkThreshold('abc', [0], 3)).toThrow(/Invalid threshold string/);
  });

  test('throws on empty string threshold', () => {
    expect(() => checkThreshold('', [0], 3)).toThrow(/Invalid threshold string/);
  });
});

describe('checkThreshold - Weighted Thresholds (Single Clause)', () => {
  test('equal weights 1/2 + 1/2 = 1.0: satisfied', () => {
    const result = checkThreshold([['1/2', '1/2']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.type).toBe('weighted');
    expect(result.required).toBe('1.0 per clause');
    expect(result.clauseDetails).toHaveLength(1);
    expect(result.clauseDetails[0]?.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('equal weights 1/2: not satisfied with single signature', () => {
    const result = checkThreshold([['1/2', '1/2']], [0], 2);

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.collected).toBe(0.5);
  });

  test('weighted 1/2 + 1/4 + 1/4 = 1.0: satisfied with all three', () => {
    const result = checkThreshold([['1/2', '1/4', '1/4']], [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('weighted 1/2 + 1/4 = 0.75: not satisfied with only two', () => {
    const result = checkThreshold([['1/2', '1/4', '1/4']], [0, 1], 3);

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.collected).toBe(0.75);
  });

  test('weighted 2/3 + 1/3 = 1.0: satisfied with both', () => {
    const result = checkThreshold([['2/3', '1/3']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBeCloseTo(1.0, 10);
  });

  test('weighted 3/4 + 1/4 = 1.0: satisfied with both', () => {
    const result = checkThreshold([['3/4', '1/4']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('weighted 1/3 + 1/3 + 1/3 = 1.0: satisfied with all three', () => {
    const result = checkThreshold([['1/3', '1/3', '1/3']], [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBeCloseTo(1.0, 10);
  });

  test('weighted 1/3 + 1/3 = 0.666: not satisfied', () => {
    const result = checkThreshold([['1/3', '1/3', '1/3']], [0, 1], 3);

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.collected).toBeCloseTo(0.666, 2);
  });

  test('over-threshold: 1/2 + 1/2 + 1/2 = 1.5: satisfied', () => {
    const result = checkThreshold([['1/2', '1/2', '1/2']], [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.5);
  });
});

describe('checkThreshold - Weighted Thresholds (Multi-Clause)', () => {
  test('two clauses: both satisfied', () => {
    const result = checkThreshold(
      [
        ['1/2', '1/2'],
        ['1/2', '1/2'],
      ],
      [0, 1],
      2,
    );

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails).toHaveLength(2);
    expect(result.clauseDetails[0]?.satisfied).toBe(true);
    expect(result.clauseDetails[1]?.satisfied).toBe(true);
  });

  test('two clauses: first satisfied, second not satisfied', () => {
    const result = checkThreshold(
      [
        ['1/2', '1/2'],
        ['1/3', '2/3'],
      ],
      [0],
      2,
    );

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.satisfied).toBe(false);
    expect(result.clauseDetails[1]?.satisfied).toBe(false);
  });

  test('three clauses: all must be satisfied (AND logic)', () => {
    const result = checkThreshold(
      [
        ['1/2', '1/2', '1/2'],
        ['1/3', '1/3', '1/3'],
        ['1/4', '1/4', '1/2'],
      ],
      [0, 1, 2],
      3,
    );

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails).toHaveLength(3);
    expect(result.clauseDetails.every((c) => c.satisfied)).toBe(true);
  });

  test('reserve rotation pattern: 1/2 + 1/2 + 1/4 + 1/4', () => {
    const result = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [0, 1], 4);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('reserve rotation: primary + reserve = satisfied', () => {
    const result = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [0, 2, 3], 4);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('reserve rotation: only reserves = not satisfied', () => {
    const result = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [2, 3], 4);

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.collected).toBe(0.5);
  });
});

describe('checkThreshold - Edge Cases', () => {
  test('empty signed indices with 0 threshold: satisfied', () => {
    const result = checkThreshold(0, [], 3);

    expect(result.satisfied).toBe(true);
    expect(result.collected).toBe(0);
  });

  test('empty signed indices with non-zero threshold: not satisfied', () => {
    const result = checkThreshold(2, [], 3);

    expect(result.satisfied).toBe(false);
    expect(result.collected).toBe(0);
  });

  test('duplicate indices in array are deduplicated', () => {
    const result = checkThreshold(2, [0, 0, 1, 1], 3);

    expect(result.satisfied).toBe(true);
    expect(result.collected).toBe(2);
  });

  test('weighted threshold with zero weight: 0/1', () => {
    const result = checkThreshold([['0/1', '1/1']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('all zero weights: not satisfied', () => {
    const result = checkThreshold([['0/1', '0/1', '0/1']], [0, 1, 2], 3);

    expect(result.satisfied).toBe(false);
    expect(result.clauseDetails[0]?.collected).toBe(0);
  });
});

describe('checkThreshold - Error Cases', () => {
  test('throws on negative threshold', () => {
    expect(() => checkThreshold(-1, [0], 3)).toThrow(/Invalid threshold: -1/);
  });

  test('throws on threshold exceeding total keys', () => {
    expect(() => checkThreshold(5, [0, 1], 3)).toThrow(/exceeds total keys/);
  });

  test('throws on negative total keys', () => {
    expect(() => checkThreshold(2, [0], -1)).toThrow(/Invalid totalKeys/);
  });

  test('throws on zero total keys', () => {
    expect(() => checkThreshold(2, [0], 0)).toThrow(/Invalid totalKeys/);
  });

  test('throws on invalid key index (negative)', () => {
    expect(() => checkThreshold(2, [-1, 0], 3)).toThrow(/Invalid key index: -1/);
  });

  test('throws on invalid key index (out of bounds)', () => {
    expect(() => checkThreshold(2, [0, 3], 3)).toThrow(/Invalid key index: 3/);
  });

  test('throws on empty weighted clause array', () => {
    expect(() => checkThreshold([], [0], 2)).toThrow(/must have at least one clause/);
  });

  test('throws on clause length mismatch', () => {
    expect(() => checkThreshold([['1/2', '1/2']], [0], 3)).toThrow(/Clause 0 has 2 weights but there are 3 keys/);
  });

  test('throws on invalid fraction format (no slash)', () => {
    expect(() => checkThreshold([['1', '1/2']], [0], 2)).toThrow(/Invalid fraction format/);
  });

  test('throws on invalid fraction format (multiple slashes)', () => {
    expect(() => checkThreshold([['1/2/3', '1/2']], [0], 2)).toThrow(/Invalid fraction format/);
  });

  test('throws on non-numeric fraction', () => {
    expect(() => checkThreshold([['a/b', '1/2']], [0], 2)).toThrow(/Numerator and denominator must be integers/);
  });

  test('throws on zero denominator', () => {
    expect(() => checkThreshold([['1/0', '1/2']], [0], 2)).toThrow(/Denominator cannot be zero/);
  });

  test('throws on negative numerator', () => {
    expect(() => checkThreshold([['-1/2', '1/2']], [0], 2)).toThrow(/must be non-negative/);
  });

  test('throws on negative denominator', () => {
    expect(() => checkThreshold([['1/-2', '1/2']], [0], 2)).toThrow(/must be non-negative/);
  });

  test('throws on invalid threshold type', () => {
    expect(() => checkThreshold({} as any, [0], 2)).toThrow(/Invalid threshold type/);
  });
});

describe('checkThreshold - Result Type Validation', () => {
  test('simple threshold result has correct structure', () => {
    const result = checkThreshold(2, [0, 1], 3);

    expect(result).toHaveProperty('satisfied');
    expect(result).toHaveProperty('required');
    expect(result).toHaveProperty('collected');
    expect(result).toHaveProperty('type');
    expect(typeof result.satisfied).toBe('boolean');
    expect(typeof result.required).toBe('number');
    expect(typeof result.collected).toBe('number');
    expect(result.type).toBe('simple');
    expect(result.clauseDetails).toBeUndefined();
  });

  test('weighted threshold result has correct structure', () => {
    const result = checkThreshold([['1/2', '1/2']], [0], 2);

    expect(result).toHaveProperty('satisfied');
    expect(result).toHaveProperty('required');
    expect(result).toHaveProperty('collected');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('clauseDetails');
    expect(typeof result.satisfied).toBe('boolean');
    expect(typeof result.required).toBe('string');
    expect(typeof result.collected).toBe('string');
    expect(result.type).toBe('weighted');
    expect(Array.isArray(result.clauseDetails)).toBe(true);
  });

  test('weighted threshold clauseDetails has correct structure', () => {
    const result = checkThreshold([['1/2', '1/2']], [0], 2);

    const clause = result.clauseDetails?.[0];
    expect(clause).toHaveProperty('clauseIndex');
    expect(clause).toHaveProperty('required');
    expect(clause).toHaveProperty('collected');
    expect(clause).toHaveProperty('satisfied');
    expect(typeof clause.clauseIndex).toBe('number');
    expect(typeof clause.required).toBe('number');
    expect(typeof clause.collected).toBe('number');
    expect(typeof clause.satisfied).toBe('boolean');
  });

  test('multi-clause result has all clause details', () => {
    const result = checkThreshold(
      [
        ['1/2', '1/2'],
        ['1/3', '2/3'],
      ],
      [0, 1],
      2,
    );

    expect(result.clauseDetails).toHaveLength(2);
    expect(result.clauseDetails[0]?.clauseIndex).toBe(0);
    expect(result.clauseDetails[1]?.clauseIndex).toBe(1);
  });
});

describe('checkThreshold - Fraction Arithmetic Precision', () => {
  test('1/3 + 1/3 + 1/3 equals exactly 1.0', () => {
    const result = checkThreshold([['1/3', '1/3', '1/3']], [0, 1, 2], 3);

    expect(result.clauseDetails[0]?.collected).toBeCloseTo(1.0, 10);
  });

  test('1/7 + 2/7 + 4/7 = 7/7 = 1.0', () => {
    const result = checkThreshold([['1/7', '2/7', '4/7']], [0, 1, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBeCloseTo(1.0, 10);
  });

  test('large denominators: 1/100 + 99/100 = 1.0', () => {
    const result = checkThreshold([['1/100', '99/100']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });

  test('complex fractions: 5/12 + 7/12 = 1.0', () => {
    const result = checkThreshold([['5/12', '7/12']], [0, 1], 2);

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.collected).toBe(1.0);
  });
});

describe('checkThreshold - KERI Specification Examples', () => {
  test('KERI example: 2-of-3 multisig', () => {
    const result = checkThreshold(2, [0, 2], 3);

    expect(result.satisfied).toBe(true);
    expect(result.type).toBe('simple');
  });

  test('KERI example: weighted 1/2, 1/2, 1/4, 1/4 for reserve keys', () => {
    const result1 = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [0, 1], 4);
    expect(result1.satisfied).toBe(true);

    const result2 = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [0, 2, 3], 4);
    expect(result2.satisfied).toBe(true);

    const result3 = checkThreshold([['1/2', '1/2', '1/4', '1/4']], [2, 3], 4);
    expect(result3.satisfied).toBe(false);
  });

  test('KERI example: multi-clause threshold (all clauses must pass)', () => {
    const result = checkThreshold(
      [
        ['1/2', '1/2'],
        ['2/3', '1/3'],
      ],
      [0, 1],
      2,
    );

    expect(result.satisfied).toBe(true);
    expect(result.clauseDetails[0]?.satisfied).toBe(true);
    expect(result.clauseDetails[1]?.satisfied).toBe(true);
  });
});

// =====================================================================
// Tests for parseSimpleThreshold / validateThreshold (from kerits/src/threshold.ts)
// =====================================================================

describe('parseSimpleThreshold', () => {
  test('returns 1 for undefined', () => {
    expect(parseSimpleThreshold(undefined, 3)).toBe(1);
  });

  test('parses simple integer', () => {
    expect(parseSimpleThreshold('2', 3)).toBe(2);
  });

  test('parses fraction', () => {
    expect(parseSimpleThreshold('2/3', 3)).toBe(2);
  });

  test('throws on fraction denominator mismatch', () => {
    expect(() => parseSimpleThreshold('2/5', 3)).toThrow(/denominator must equal cardinality/);
  });

  test('throws on out of range', () => {
    expect(() => parseSimpleThreshold('5', 3)).toThrow(/must be between 1 and 3/);
  });
});

describe('validateThreshold', () => {
  test('validates simple threshold', () => {
    expect(() => validateThreshold('2', 3, 'kt')).not.toThrow();
  });

  test('validates weighted threshold', () => {
    expect(() => validateThreshold([['1/2', '1/2']], 2, 'kt')).not.toThrow();
  });

  test('throws on empty weighted threshold', () => {
    expect(() => validateThreshold([], 2, 'kt')).toThrow(/must have at least one clause/);
  });
});

describe('validateWeightedThreshold', () => {
  test('validates correct weighted threshold', () => {
    expect(() => validateWeightedThreshold([['1/2', '1/2']], 2, 'kt')).not.toThrow();
  });

  test('throws on clause length mismatch', () => {
    expect(() => validateWeightedThreshold([['1/2']], 2, 'kt')).toThrow(/has 1 weights but there are 2 keys/);
  });
});

describe('validateThresholdSpec', () => {
  test('validates string spec', () => {
    expect(() => validateThresholdSpec('1', 3, 'kt')).not.toThrow();
  });

  test('validates weighted spec', () => {
    expect(() => validateThresholdSpec([['1/2', '1/2']], 2, 'kt')).not.toThrow();
  });
});

describe('resolveThresholdValue', () => {
  test('returns 1 for undefined', () => {
    expect(resolveThresholdValue(undefined, 3)).toBe(1);
  });

  test('returns number for simple threshold', () => {
    expect(resolveThresholdValue('2', 3)).toBe(2);
  });

  test('returns array for weighted threshold', () => {
    const result = resolveThresholdValue([['1/2', '1/2']], 2);
    expect(result).toEqual([['1/2', '1/2']]);
  });
});
