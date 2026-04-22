import { describe, expect, it } from 'bun:test';
import { rollupStatus } from './rollup.js';

describe('rollupStatus', () => {
  it('returns NOT-STARTED when all counts are zero', () => {
    expect(rollupStatus({ passed: 0, failed: 0, skipped: 0, todo: 0, notRun: 0 }))
      .toBe('NOT-STARTED');
  });

  it('returns PLANNED when only todo is present', () => {
    expect(rollupStatus({ passed: 0, failed: 0, skipped: 0, todo: 3, notRun: 0 }))
      .toBe('PLANNED');
  });

  it('returns PLANNED when only skipped is present', () => {
    expect(rollupStatus({ passed: 0, failed: 0, skipped: 2, todo: 0, notRun: 0 }))
      .toBe('PLANNED');
  });

  it('returns PLANNED when only notRun is present', () => {
    expect(rollupStatus({ passed: 0, failed: 0, skipped: 0, todo: 0, notRun: 4 }))
      .toBe('PLANNED');
  });

  it('returns PLANNED when todo + skipped + notRun mix is present (no passed, no failed)', () => {
    expect(rollupStatus({ passed: 0, failed: 0, skipped: 1, todo: 1, notRun: 1 }))
      .toBe('PLANNED');
  });

  it('returns VERIFIED when only passed is present', () => {
    expect(rollupStatus({ passed: 5, failed: 0, skipped: 0, todo: 0, notRun: 0 }))
      .toBe('VERIFIED');
  });

  it('returns PARTIAL when passed and notRun are both present', () => {
    expect(rollupStatus({ passed: 3, failed: 0, skipped: 0, todo: 0, notRun: 2 }))
      .toBe('PARTIAL');
  });

  it('returns PARTIAL when passed and todo are both present', () => {
    expect(rollupStatus({ passed: 2, failed: 0, skipped: 0, todo: 1, notRun: 0 }))
      .toBe('PARTIAL');
  });

  it('returns PARTIAL when passed and skipped are both present', () => {
    expect(rollupStatus({ passed: 2, failed: 0, skipped: 1, todo: 0, notRun: 0 }))
      .toBe('PARTIAL');
  });

  it('returns FAILING when any failed is present (even with passed)', () => {
    expect(rollupStatus({ passed: 10, failed: 1, skipped: 0, todo: 0, notRun: 0 }))
      .toBe('FAILING');
  });

  it('returns FAILING when only failed is present', () => {
    expect(rollupStatus({ passed: 0, failed: 2, skipped: 0, todo: 0, notRun: 0 }))
      .toBe('FAILING');
  });

  it('returns FAILING when all buckets are non-zero — failed dominates', () => {
    expect(rollupStatus({ passed: 1, failed: 1, skipped: 1, todo: 1, notRun: 1 }))
      .toBe('FAILING');
  });
});
