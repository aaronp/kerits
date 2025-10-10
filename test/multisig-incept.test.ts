/**
 * Multi-Signature Inception Tests
 *
 * Tests multi-key inception against keripy-generated test cases
 */

import { describe, it, expect } from 'bun:test';
import { incept } from '../src/incept';
import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Signature Inception', () => {
  // Load test cases from testgen
  const testCasesDir = path.join(__dirname, '../../testgen/test-cases');
  const testFiles = fs.readdirSync(testCasesDir)
    .filter(f => f.startsWith('test_multisig_incept_') && f.endsWith('.json'))
    .sort();

  for (const testFile of testFiles) {
    it(`should match keripy output for ${testFile}`, () => {
      const testCase = JSON.parse(
        fs.readFileSync(path.join(testCasesDir, testFile), 'utf-8')
      );

      const { input, expected, description } = testCase;

      // Run kerits implementation
      const result = incept({
        keys: input.keys,
        ndigs: input.ndigs || [],
        isith: input.isith,
        nsith: input.nsith,
      });

      // Compare results
      expect(result.pre).toBe(expected.pre);
      expect(result.said).toBe(expected.said);

      // Compare KED fields
      expect(result.ked.v).toBe(expected.ked.v);
      expect(result.ked.t).toBe(expected.ked.t);
      expect(result.ked.d).toBe(expected.ked.d);
      expect(result.ked.i).toBe(expected.ked.i);
      expect(result.ked.s).toBe(expected.ked.s);
      expect(result.ked.kt).toEqual(expected.ked.kt);  // Can be string or array
      expect(result.ked.k).toEqual(expected.ked.k);
      expect(result.ked.nt).toEqual(expected.ked.nt);  // Can be string or array
      expect(result.ked.n).toEqual(expected.ked.n);
      expect(result.ked.bt).toBe(expected.ked.bt);
      expect(result.ked.b).toEqual(expected.ked.b);
      expect(result.ked.c).toEqual(expected.ked.c);
      expect(result.ked.a).toEqual(expected.ked.a);

      // Compare raw serialization
      expect(result.raw).toBe(expected.raw);
    });
  }

  // Additional unit tests
  describe('Multi-key inception (unit tests)', () => {
    it('should create 2-of-3 multi-sig identifier', () => {
      const result = incept({
        keys: [
          'DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA',
          'DVcuJOOJF1IE8svqEtrSuyQjGTd2HhfAkt9y2QkUtFJI',
          'DT1iAhBWCkvChxNWsby2J0pJyxBIxbAtbLA0Ljx-Grh8',
        ],
        ndigs: [
          'EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA',
          'EEWokaXZWR13-fc3GWDyLSp7vLAhEDSIJC-YilQWh6Lc',
          'EAukxUYmGlrSLW1V-aLAhRL4V9WomuI8e3nI_7rPbAEk',
        ],
        isith: '2',
        nsith: '2',
      });

      // Prefix should be self-addressing (not first key) for multi-key
      expect(result.pre).not.toBe(result.ked.k[0]);
      expect(result.pre).toBe(result.said);  // Self-addressing

      // Threshold should be numeric string
      expect(result.ked.kt).toBe('2');
      expect(result.ked.nt).toBe('2');

      // Keys should all be present
      expect(result.ked.k).toHaveLength(3);
      expect(result.ked.n).toHaveLength(3);
    });

    it('should create weighted threshold multi-sig identifier', () => {
      const result = incept({
        keys: [
          'DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA',
          'DVcuJOOJF1IE8svqEtrSuyQjGTd2HhfAkt9y2QkUtFJI',
          'DT1iAhBWCkvChxNWsby2J0pJyxBIxbAtbLA0Ljx-Grh8',
        ],
        ndigs: [
          'EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA',
          'EEWokaXZWR13-fc3GWDyLSp7vLAhEDSIJC-YilQWh6Lc',
          'EAukxUYmGlrSLW1V-aLAhRL4V9WomuI8e3nI_7rPbAEk',
        ],
        isith: ['1/2', '1/2', '1/2'],
        nsith: ['1/2', '1/2', '1/2'],
      });

      // Threshold should be array of fractional weights
      expect(Array.isArray(result.ked.kt)).toBe(true);
      expect(result.ked.kt).toEqual(['1/2', '1/2', '1/2']);
      expect(result.ked.nt).toEqual(['1/2', '1/2', '1/2']);

      // Prefix should be self-addressing
      expect(result.pre).toBe(result.said);
    });

    it('should create non-transferable multi-sig identifier (no next keys)', () => {
      const result = incept({
        keys: [
          'DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA',
          'DVcuJOOJF1IE8svqEtrSuyQjGTd2HhfAkt9y2QkUtFJI',
          'DT1iAhBWCkvChxNWsby2J0pJyxBIxbAtbLA0Ljx-Grh8',
        ],
        ndigs: [],
        isith: 2,
      });

      // Should have no next keys
      expect(result.ked.n).toEqual([]);
      expect(result.ked.nt).toBe('0');

      // Prefix should still be self-addressing
      expect(result.pre).toBe(result.said);
    });

    it('should support both basic and self-addressing for single-key', () => {
      // Without explicit thresholds: basic derivation (prefix = key)
      const basicResult = incept({
        keys: ['DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA'],
        ndigs: ['EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA'],
      });

      expect(basicResult.pre).toBe(basicResult.ked.k[0]);  // prefix = key
      expect(basicResult.pre).not.toBe(basicResult.said);   // prefix ≠ SAID
      expect(basicResult.ked.kt).toBe('1');

      // With explicit thresholds (even if undefined): self-addressing (prefix = SAID)
      const selfResult = incept({
        keys: ['DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA'],
        ndigs: ['EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA'],
        isith: undefined,  // Explicitly provided (even if undefined)
        nsith: undefined,
      });

      expect(selfResult.pre).toBe(selfResult.said);          // prefix = SAID
      expect(selfResult.pre).not.toBe(selfResult.ked.k[0]);  // prefix ≠ key
      expect(selfResult.ked.kt).toBe('1');
    });
  });
});
