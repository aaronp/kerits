import { describe, expect, test } from 'bun:test';
import { isDip, isDrt, isEstablishment, isIcp, isIxn, isRot } from './predicates.js';
import type { DipEvent, DrtEvent, IcpEvent, IxnEvent, RotEvent } from './types.js';

// Minimal stub events for type guard testing
const icpEvent = { t: 'icp' } as IcpEvent;
const rotEvent = { t: 'rot' } as RotEvent;
const ixnEvent = { t: 'ixn' } as IxnEvent;
const dipEvent = { t: 'dip' } as DipEvent;
const drtEvent = { t: 'drt' } as DrtEvent;

describe('KEL predicates', () => {
  test('isIcp identifies inception events', () => {
    expect(isIcp(icpEvent)).toBe(true);
    expect(isIcp(rotEvent)).toBe(false);
    expect(isIcp(ixnEvent)).toBe(false);
    expect(isIcp(dipEvent)).toBe(false);
    expect(isIcp(drtEvent)).toBe(false);
  });

  test('isRot identifies rotation events', () => {
    expect(isRot(rotEvent)).toBe(true);
    expect(isRot(icpEvent)).toBe(false);
  });

  test('isIxn identifies interaction events', () => {
    expect(isIxn(ixnEvent)).toBe(true);
    expect(isIxn(icpEvent)).toBe(false);
  });

  test('isDip identifies delegated inception events', () => {
    expect(isDip(dipEvent)).toBe(true);
    expect(isDip(icpEvent)).toBe(false);
  });

  test('isDrt identifies delegated rotation events', () => {
    expect(isDrt(drtEvent)).toBe(true);
    expect(isDrt(rotEvent)).toBe(false);
  });

  test('isEstablishment identifies all establishment events', () => {
    expect(isEstablishment(icpEvent)).toBe(true);
    expect(isEstablishment(rotEvent)).toBe(true);
    expect(isEstablishment(dipEvent)).toBe(true);
    expect(isEstablishment(drtEvent)).toBe(true);
    expect(isEstablishment(ixnEvent)).toBe(false);
  });
});
