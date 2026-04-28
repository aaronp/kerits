import { describe, expect, test } from 'bun:test';
import { KELOps } from '../ops.js';
import { KSNs } from '../types.js';
import type { CESREvent, KSN } from '../types.js';

// -- Minimal fixtures: only the fields comparison touches --

function cesrEvent(said: string): CESREvent {
  return { event: { d: said } } as unknown as CESREvent;
}

function ksn(d: string): KSN {
  return { d } as unknown as KSN;
}

describe('KELOps.eventsEqual', () => {
  test('same SAID → equal', () => {
    expect(KELOps.eventsEqual(cesrEvent('EAbc'), cesrEvent('EAbc'))).toBe(true);
  });

  test('different SAID → not equal', () => {
    expect(KELOps.eventsEqual(cesrEvent('EAbc'), cesrEvent('EDef'))).toBe(false);
  });
});

describe('KELOps.kelEqual', () => {
  test('same length, matching SAIDs → equal', () => {
    const a = [cesrEvent('E1'), cesrEvent('E2')];
    const b = [cesrEvent('E1'), cesrEvent('E2')];
    expect(KELOps.kelEqual(a, b)).toBe(true);
  });

  test('different length → not equal', () => {
    expect(KELOps.kelEqual([cesrEvent('E1')], [cesrEvent('E1'), cesrEvent('E2')])).toBe(false);
  });

  test('same length, different order → not equal', () => {
    const a = [cesrEvent('E1'), cesrEvent('E2')];
    const b = [cesrEvent('E2'), cesrEvent('E1')];
    expect(KELOps.kelEqual(a, b)).toBe(false);
  });

  test('both empty → equal', () => {
    expect(KELOps.kelEqual([], [])).toBe(true);
  });
});

describe('KSNs.equal', () => {
  test('same d → equal', () => {
    expect(KSNs.equal(ksn('EAbc'), ksn('EAbc'))).toBe(true);
  });

  test('different d → not equal', () => {
    expect(KSNs.equal(ksn('EAbc'), ksn('EDef'))).toBe(false);
  });
});
