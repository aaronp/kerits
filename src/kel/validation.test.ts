/**
 * Tests for KEL Validation
 *
 * Minimal tests for the ported validation module. Full integration tests
 * are at the SDK level in kv4.
 */

import { describe, expect, test } from 'bun:test';
import { digestVerfer, encodeSignature, KELData, KELEvents, sign, TestKeys } from '../index.js';
import type { CESREvent, KELEvent } from './types.js';
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

describe('signaturesVerified', () => {
  const key = (n: number) => TestKeys.iterator('sigver').at(n);
  // a well-formed signature that would not verify against the event bytes
  const garbage = (n: number) => encodeSignature(sign(new TextEncoder().encode('other'), key(n).privateKey), true).qb64;
  const { event } = KELData.prepareIcp({
    keys: [key(0).cesr, key(1).cesr],
    nextKeyDigests: [digestVerfer(key(10).cesr)],
    signingThreshold: '2',
    nextThreshold: '1',
  });
  const withSigs = (count: number): CESREvent =>
    KELEvents.assembleSignedEvent({
      event,
      signatures: Array.from({ length: count }, (_, keyIndex) => ({ keyIndex, sig: garbage(keyIndex) })),
    });

  test('signaturesVerified skips verification but not thresholds', () => {
    // setup: kt=2 icp carrying one, then two, unverifiable signatures

    // call our method under test
    const one = validateKelChain([withSigs(1)], { signaturesVerified: true });
    const two = validateKelChain([withSigs(2)], { signaturesVerified: true });
    const unflagged = validateKelChain([withSigs(2)]);

    // assertions: one present signature is still under kt=2; two meet it; without the flag they are verified and dropped
    expect(KELOps.isAwaitingSignatures(one.eventDetails[0]!)).toBe(true);
    expect(two.valid).toBe(true);
    expect(unflagged.valid).toBe(false);
    expect(unflagged.eventDetails[0]!.checks.signaturesValid.dropped?.map((d) => d.reason)).toEqual([
      'signature-invalid',
      'signature-invalid',
    ]);
  });

  test('validateAppend passes signaturesVerified through', () => {
    // setup: the same kt=2 icp with two unverifiable signatures

    // call our method under test
    const result = KELOps.validateAppend([], withSigs(2), { signaturesVerified: true });

    // assertions: treated as verified, the threshold is met
    expect(result.ok).toBe(true);
  });
});
