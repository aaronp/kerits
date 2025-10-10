/**
 * Multi-Signature Rotation Tests
 *
 * Tests multi-key rotation against keripy-generated test cases
 */

import { describe, it, expect } from 'bun:test';
import { rotate } from '../src/rotate';
import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Signature Rotation', () => {
  // Load test cases from testgen
  const testCasesDir = path.join(__dirname, '../../testgen/test-cases');
  const testFiles = fs.readdirSync(testCasesDir)
    .filter(f => f.startsWith('test_multisig_rotate_') && f.endsWith('.json'))
    .sort();

  for (const testFile of testFiles) {
    it(`should match keripy output for ${testFile}`, () => {
      const testCase = JSON.parse(
        fs.readFileSync(path.join(testCasesDir, testFile), 'utf-8')
      );

      const { input, expected, description } = testCase;

      // Run kerits implementation
      const result = rotate({
        pre: input.pre,
        keys: input.keys,
        dig: input.dig,
        sn: input.sn,
        ndigs: input.ndigs || [],
        isith: input.isith,
        nsith: input.nsith,
      });

      // Compare results
      expect(result.said).toBe(expected.said);

      // Compare KED fields
      expect(result.ked.v).toBe(expected.ked.v);
      expect(result.ked.t).toBe(expected.ked.t);
      expect(result.ked.d).toBe(expected.ked.d);
      expect(result.ked.i).toBe(expected.ked.i);
      expect(result.ked.s).toBe(expected.ked.s);
      expect(result.ked.p).toBe(expected.ked.p);
      expect(result.ked.kt).toEqual(expected.ked.kt);  // Can be string or array
      expect(result.ked.k).toEqual(expected.ked.k);
      expect(result.ked.nt).toEqual(expected.ked.nt);  // Can be string or array
      expect(result.ked.n).toEqual(expected.ked.n);
      expect(result.ked.bt).toBe(expected.ked.bt);
      expect(result.ked.br).toEqual(expected.ked.br);
      expect(result.ked.ba).toEqual(expected.ked.ba);
      expect(result.ked.a).toEqual(expected.ked.a);

      // Compare raw serialization
      expect(result.raw).toBe(expected.raw);
    });
  }

  // Additional unit tests
  describe('Multi-key rotation (unit tests)', () => {
    it('should create 2-of-3 multi-sig rotation', () => {
      const result = rotate({
        pre: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        keys: [
          'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
          'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
        ],
        dig: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        sn: 1,
        ndigs: [
          'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
          'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
          'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
        ],
        isith: '2',
        nsith: '2',
      });

      // Threshold should be numeric string
      expect(result.ked.kt).toBe('2');
      expect(result.ked.nt).toBe('2');

      // Keys should all be present
      expect(result.ked.k).toHaveLength(3);
      expect(result.ked.n).toHaveLength(3);

      // Should have rotation event type
      expect(result.ked.t).toBe('rot');
      expect(result.ked.s).toBe('1');
    });

    it('should create weighted threshold rotation', () => {
      const result = rotate({
        pre: 'EOasfoNfSKo1k5IMPZdUNySlm_0-FpALKohP2e7jS8r_',
        keys: [
          'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
          'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
        ],
        dig: 'EOasfoNfSKo1k5IMPZdUNySlm_0-FpALKohP2e7jS8r_',
        sn: 1,
        ndigs: [
          'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
          'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
          'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
        ],
        isith: ['1/2', '1/2', '1/2'],
        nsith: ['1/2', '1/2', '1/2'],
      });

      // Threshold should be array of fractional weights
      expect(Array.isArray(result.ked.kt)).toBe(true);
      expect(result.ked.kt).toEqual(['1/2', '1/2', '1/2']);
      expect(result.ked.nt).toEqual(['1/2', '1/2', '1/2']);
    });

    it('should support threshold change during rotation', () => {
      const result = rotate({
        pre: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        keys: [
          'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
          'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
        ],
        dig: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        sn: 1,
        ndigs: [
          'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
          'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
          'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
        ],
        isith: '3',  // Changed from 2 to 3 (unanimous)
        nsith: '3',
      });

      // Threshold should be updated
      expect(result.ked.kt).toBe('3');
      expect(result.ked.nt).toBe('3');

      // Should maintain 3 keys
      expect(result.ked.k).toHaveLength(3);
    });

    it('should create non-transferable rotation (no next keys)', () => {
      const result = rotate({
        pre: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        keys: [
          'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
          'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
        ],
        dig: 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy',
        sn: 1,
        ndigs: [],  // No next keys = non-transferable
        isith: 2,
      });

      // Should have no next keys
      expect(result.ked.n).toEqual([]);
      expect(result.ked.nt).toBe('0');
    });
  });
});
