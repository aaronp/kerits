/**
 * Delegated Inception Regression Tests
 *
 * Verifies that kerits generates delegated inception (dip) events with the same format as keripy.
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../src/incept';
import * as fs from 'fs';
import * as path from 'path';

const TEST_CASES_DIR = path.join(__dirname, '../../testgen/test-cases');

interface DelegatedInceptTestCase {
  description: string;
  test_type: string;
  input: {
    keys: string[];
    ndigs?: string[];
    isith?: string | string[];
    nsith?: string | string[];
    delpre: string;
  };
  expected: {
    ked: any;
    pre: string;
    said: string;
    raw: string;
  };
}

describe('Delegated Inception (dip)', () => {
  const testFiles = fs
    .readdirSync(TEST_CASES_DIR)
    .filter((f) => f.startsWith('test_delegated_incept_') && f.endsWith('.json'))
    .sort();

  for (const filename of testFiles) {
    test(`${filename}`, () => {
      const testCase: DelegatedInceptTestCase = JSON.parse(
        fs.readFileSync(path.join(TEST_CASES_DIR, filename), 'utf-8')
      );

      const { input, expected } = testCase;

      // Create delegated inception event using kerits
      const event = incept({
        keys: input.keys,
        ndigs: input.ndigs,
        isith: input.isith,
        nsith: input.nsith,
        delpre: input.delpre,  // This makes it a delegated inception
      });

      // Verify event type is 'dip' (delegated inception)
      expect(event.ked.t).toBe('dip');

      // Verify delegator identifier is included
      expect(event.ked.di).toBe(input.delpre);

      // Verify event matches keripy output
      expect(event.ked.v).toBe(expected.ked.v);
      expect(event.ked.d).toBe(expected.ked.d);
      expect(event.ked.i).toBe(expected.ked.i);
      expect(event.ked.s).toBe(expected.ked.s);
      expect(event.ked.kt).toEqual(expected.ked.kt);
      expect(event.ked.k).toEqual(expected.ked.k);
      expect(event.ked.nt).toEqual(expected.ked.nt);
      expect(event.ked.n).toEqual(expected.ked.n);
      expect(event.ked.bt).toBe(expected.ked.bt);
      expect(event.ked.b).toEqual(expected.ked.b);
      expect(event.ked.c).toEqual(expected.ked.c);
      expect(event.ked.a).toEqual(expected.ked.a);
      expect(event.ked.di).toBe(expected.ked.di);

      // Verify prefix and SAID
      expect(event.pre).toBe(expected.pre);
      expect(event.said).toBe(expected.said);

      // Verify serialization
      expect(event.raw).toBe(expected.raw);
    });
  }

  test('delegated inception test count', () => {
    expect(testFiles.length).toBeGreaterThanOrEqual(3);
  });
});
