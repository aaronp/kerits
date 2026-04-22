import { describe, expect, it } from 'bun:test';
import { captureSource, parseStackLine } from './capture-source.js';

describe('parseStackLine', () => {
  it('parses V8-style stack frames with file:line:col', () => {
    const line = '    at Module.scenario (/abs/packages/core/src/said/said.test.ts:42:7)';
    expect(parseStackLine(line)).toEqual({
      sourceFile: '/abs/packages/core/src/said/said.test.ts',
      sourceLine: 42,
    });
  });

  it('parses bare file:line:col frames (no function name)', () => {
    const line = '    at /abs/packages/core/src/said/said.test.ts:42:7';
    expect(parseStackLine(line)).toEqual({
      sourceFile: '/abs/packages/core/src/said/said.test.ts',
      sourceLine: 42,
    });
  });

  it('returns undefined for lines without a file:line:col', () => {
    expect(parseStackLine('    at <anonymous>')).toBeUndefined();
    expect(parseStackLine('Error: something')).toBeUndefined();
    expect(parseStackLine('')).toBeUndefined();
  });

  it('parses frames inside architecture/scenario.ts — parseStackLine itself does not filter', () => {
    // The filter is captureSource's job; parseStackLine is pure parsing.
    const line = '    at scenario (/abs/packages/core/src/architecture/scenario.ts:12:3)';
    expect(parseStackLine(line)).toEqual({
      sourceFile: '/abs/packages/core/src/architecture/scenario.ts',
      sourceLine: 12,
    });
  });
});

describe('captureSource', () => {
  it('returns the first frame outside the internal architecture implementation files', () => {
    const stack = [
      'Error',
      '    at captureSource (/abs/packages/core/src/architecture/capture-source.ts:8:15)',
      '    at scenario (/abs/packages/core/src/architecture/scenario.ts:21:22)',
      '    at /abs/packages/core/src/said/said.test.ts:10:5',
      '    at Module.run (/abs/packages/core/node_modules/bun/test.js:99:7)',
    ].join('\n');

    expect(captureSource(stack)).toEqual({
      sourceFile: '/abs/packages/core/src/said/said.test.ts',
      sourceLine: 10,
    });
  });

  it('returns frames in architecture TEST files (they are call-sites, not implementation)', () => {
    // A scenario() call inside src/architecture/scenario.test.ts is itself
    // a legitimate call-site and MUST resolve to that test file, not be
    // filtered as internal.
    const stack = [
      'Error',
      '    at captureSource (/abs/packages/core/src/architecture/capture-source.ts:8:15)',
      '    at scenario (/abs/packages/core/src/architecture/scenario.ts:21:22)',
      '    at /abs/packages/core/src/architecture/scenario.test.ts:42:3',
    ].join('\n');

    expect(captureSource(stack)).toEqual({
      sourceFile: '/abs/packages/core/src/architecture/scenario.test.ts',
      sourceLine: 42,
    });
  });

  it('returns an empty object if no frames outside the internal implementation exist', () => {
    const stack = [
      'Error',
      '    at captureSource (/abs/packages/core/src/architecture/capture-source.ts:8:15)',
      '    at scenario (/abs/packages/core/src/architecture/scenario.ts:21:22)',
    ].join('\n');

    expect(captureSource(stack)).toEqual({});
  });

  it('returns an empty object for an undefined stack', () => {
    expect(captureSource(undefined)).toEqual({});
  });

  it('strips the repoRoot prefix when sourceFile is inside it', () => {
    const stack = [
      'Error',
      '    at captureSource (/repo/packages/core/src/architecture/capture-source.ts:8:15)',
      '    at scenario (/repo/packages/core/src/architecture/scenario.ts:21:22)',
      '    at /repo/packages/core/src/said/said.test.ts:10:5',
    ].join('\n');

    expect(captureSource(stack, '/repo')).toEqual({
      sourceFile: 'packages/core/src/said/said.test.ts',
      sourceLine: 10,
    });
  });

  it('returns sourceFile unchanged when it is outside repoRoot', () => {
    const stack = [
      'Error',
      '    at /somewhere-else/x.test.ts:5:1',
    ].join('\n');

    expect(captureSource(stack, '/repo')).toEqual({
      sourceFile: '/somewhere-else/x.test.ts',
      sourceLine: 5,
    });
  });
});
