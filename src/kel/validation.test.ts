/**
 * Tests for KEL Validation
 *
 * Minimal tests for the ported validation module. Full integration tests
 * are at the SDK level in kv4.
 */

import { describe, expect, test } from 'bun:test';
import type { KELEvent } from './types.js';
import { KELOps } from './ops.js';
import type { ValidationErrorCode } from './validation.js';

const { isValidKeriEvent, validateKelChain, validateRequiredFields } = KELOps;

describe('isValidKeriEvent', () => {
  test('returns true for valid event types', () => {
    expect(isValidKeriEvent({ t: 'icp' })).toBe(true);
    expect(isValidKeriEvent({ t: 'rot' })).toBe(true);
    expect(isValidKeriEvent({ t: 'ixn' })).toBe(true);
    expect(isValidKeriEvent({ t: 'dip' })).toBe(true);
    expect(isValidKeriEvent({ t: 'drt' })).toBe(true);
  });

  test('returns false for invalid event types', () => {
    expect(isValidKeriEvent({ t: 'xyz' })).toBe(false);
    expect(isValidKeriEvent(null)).toBe(false);
    expect(isValidKeriEvent(undefined)).toBe(false);
    expect(isValidKeriEvent(42)).toBe(false);
    expect(isValidKeriEvent({})).toBe(false);
  });
});

describe('validateRequiredFields', () => {
  test('validates icp event with all fields', () => {
    const event = {
      v: 'KERI10JSON000156_',
      t: 'icp',
      d: 'Etest...',
      i: 'Etest...',
      s: '0',
      kt: '1',
      k: ['DA...'],
      nt: '1',
      n: ['E...'],
      bt: '0',
      b: [],
      c: [],
      a: [],
    } as unknown as KELEvent;

    const result = validateRequiredFields(event);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  test('detects missing fields in icp event', () => {
    const event = {
      v: 'KERI10JSON000156_',
      t: 'icp',
      d: 'Etest...',
      i: 'Etest...',
      s: '0',
    } as unknown as KELEvent;

    const result = validateRequiredFields(event);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing).toContain('kt');
    expect(result.missing).toContain('k');
  });
});

describe('validateKelChain', () => {
  test('returns valid for empty chain', () => {
    const result = validateKelChain([]);
    expect(result.valid).toBe(true);
    expect(result.eventDetails).toEqual([]);
  });
});

describe('ValidationErrorCode type', () => {
  test('error codes are string literals', () => {
    const code: ValidationErrorCode = 'SAID_MISMATCH';
    expect(code).toBe('SAID_MISMATCH');
  });
});
