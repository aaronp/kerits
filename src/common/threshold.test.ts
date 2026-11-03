/**
 * Threshold namespace: behaviour beyond the keripy vectors (kel/fixtures/threshold-cross-validation.test.ts).
 */
import { describe, expect, test } from 'bun:test';
import { Threshold } from './types.js';

describe('Threshold writers', () => {
  test('numeric emits hex', () => {
    // call our method under test
    const encoded = [1, 9, 10, 16, 255].map(Threshold.numeric);

    // keripy f"{m:x}"
    expect(encoded).toEqual(['1', '9', 'a', '10', 'ff']);
  });

  test('numeric rejects a negative or fractional count (programmer error)', () => {
    // call our method under test, with values no caller may pass
    expect(() => Threshold.numeric(-1)).toThrow('Threshold.numeric: -1 is not a non-negative integer');
    expect(() => Threshold.numeric(1.5)).toThrow('Threshold.numeric: 1.5 is not a non-negative integer');
  });

  test('weighted emits one clause flat and several nested', () => {
    // call our method under test
    const one = Threshold.weighted([['1/2', '1/2']]);
    const two = Threshold.weighted([['1/2', '1/2'], ['1']]);

    // keripy Tholder.sith form
    expect(one).toEqual(['1/2', '1/2']);
    expect(two).toEqual([['1/2', '1/2'], ['1']]);
  });

  test('canonical leaves an unparseable threshold unchanged, for validation to reject', () => {
    // call our method under test
    const bare = Threshold.canonical('1/2', 2);
    const tooHigh = Threshold.canonical('3', 2);

    // not adjusted
    expect(bare).toBe('1/2');
    expect(tooHigh).toBe('3');
  });
});

describe('Threshold.parse untrusted shapes', () => {
  test('a non-string, non-list threshold is malformed', () => {
    // setup: a wire value of the wrong type (e.g. a JSON number)
    const raw = JSON.parse('2') as Threshold;

    // call our method under test
    const parsed = Threshold.parse(raw, 3);

    // typed error, no throw
    expect(parsed).toEqual({
      ok: false,
      error: { kind: 'malformed', message: 'threshold 2 is neither a hex string nor a weighted list' },
    });
  });

  test('a non-string weight is malformed', () => {
    // setup: a weight that is a number
    const raw = JSON.parse('[0.5, "1/2"]') as Threshold;

    // call our method under test
    const parsed = Threshold.parse(raw, 2);

    // typed error, no throw
    expect(parsed).toEqual({ ok: false, error: { kind: 'malformed', message: 'weight 0.5 is not a string' } });
  });
});

describe('Threshold.satisfied', () => {
  test('each index counts once (documented divergence: keripy counts a duplicate twice)', () => {
    // setup: 2-of-3
    const parsed: Threshold.Parsed = { kind: 'numeric', m: 2 };

    // call our method under test, with key 0 signing twice
    const duplicate = Threshold.satisfied(parsed, [0, 0]);
    const distinct = Threshold.satisfied(parsed, [0, 1]);

    // kerits strict
    expect(duplicate).toBe(false);
    expect(distinct).toBe(true);
  });

  test('weights sum exactly (rational arithmetic, no float rounding)', () => {
    // setup: thirds and sevenths, which float sums get wrong
    const thirds = Threshold.parse(['1/3', '1/3', '1/3'], 3);
    const sevenths = Threshold.parse(['1/7', '2/7', '4/7'], 3);
    if (!thirds.ok || !sevenths.ok) throw new Error('setup: thresholds must parse');

    // call our method under test
    const all = [Threshold.satisfied(thirds.value, [0, 1, 2]), Threshold.satisfied(sevenths.value, [0, 1, 2])];
    const short = [Threshold.satisfied(thirds.value, [0, 1]), Threshold.satisfied(sevenths.value, [1, 2])];

    // exactly 1 is met; 2/3 and 6/7 are not
    expect(all).toEqual([true, true]);
    expect(short).toEqual([false, false]);
  });

  test('a negative or non-integer index never satisfies a weighted threshold', () => {
    // setup: one clause of two halves
    const parsed = Threshold.parse(['1/2', '1/2'], 2);
    if (!parsed.ok) throw new Error('setup: threshold must parse');

    // call our method under test
    const results = [Threshold.satisfied(parsed.value, [0, 1, -1]), Threshold.satisfied(parsed.value, [0, 1.5])];

    // kerits strict: any index outside [0, size) fails the whole check. An index past the weights also fails
    // in keripy (IndexError); a negative one does not (Python indexes from the end: documented divergence,
    // vector `lenient-negative-index`)
    expect(results).toEqual([false, false]);
  });
});

describe('Threshold.witness (bt)', () => {
  test('bt is hex, 1..witnesses with witnesses and 0 without (keripy bounds)', () => {
    // call our method under test
    const results = [
      Threshold.witness('0', 0),
      Threshold.witness('1', 0),
      Threshold.witness('0', 2),
      Threshold.witness('2', 2),
      Threshold.witness('a', 10),
      Threshold.witness('10', 10),
      Threshold.witness('', 1),
      Threshold.witness('1/2', 2),
      Threshold.witness(['1'], 1),
    ];

    // "a" is 10; "10" is 16, more than 10 witnesses; "0" only without witnesses
    expect(results).toEqual([
      { ok: true, value: 0 },
      { ok: false, error: { kind: 'out-of-range', message: 'witness threshold 1 with no witnesses (must be 0)' } },
      { ok: false, error: { kind: 'out-of-range', message: 'witness threshold 0 is not within [1, 2] witnesses' } },
      { ok: true, value: 2 },
      { ok: true, value: 10 },
      { ok: false, error: { kind: 'out-of-range', message: 'witness threshold 16 is not within [1, 10] witnesses' } },
      { ok: false, error: { kind: 'empty', message: 'bt: empty threshold' } },
      {
        ok: false,
        error: { kind: 'bare-fraction', message: 'bt: "1/2" is a bare fraction; fractions belong only in weighted lists' },
      },
      { ok: false, error: { kind: 'malformed', message: 'bt ["1"] is not a hex string' } },
    ]);
  });
});
