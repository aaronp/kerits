import { describe, expect, test } from 'bun:test';
import { ChainFreshness, TelFreshness } from '../../index.js';
import { incept, issue, revoke } from './fixtures.js';

// setup: chains as SAID lists; the rule only looks at each element's SAID
const said = (s: string) => s;
const reason = (r: ReturnType<typeof ChainFreshness.choose<string>>) => (r.ok ? r.value : r.error);

describe('ChainFreshness.choose', () => {
  test('store present: equal or absent supplied → store; supplied extends → supplied', () => {
    // setup: a store chain and copies of it
    const store = ['a', 'b'];

    // call out our method under test
    const equal = ChainFreshness.choose(['a', 'b'], store, said);
    const absent = ChainFreshness.choose(undefined, store, said);
    const empty = ChainFreshness.choose([], store, said);
    const extended = ['a', 'b', 'c'];
    const extends_ = ChainFreshness.choose(extended, store, said);

    // assertions: the store's own chain wins unless supplied is strictly newer
    expect(equal.ok && equal.value).toBe(store);
    expect(absent.ok && absent.value).toBe(store);
    expect(empty.ok && empty.value).toBe(store);
    expect(extends_.ok && extends_.value).toBe(extended);
  });

  test('supplied is a strict prefix → stale; diverges → forked', () => {
    // call out our method under test
    const stale = ChainFreshness.choose(['a'], ['a', 'b'], said);
    const forked = ChainFreshness.choose(['a', 'x'], ['a', 'b'], said);
    const forkedLonger = ChainFreshness.choose(['a', 'x', 'y'], ['a', 'b'], said);

    // assertions
    expect(reason(stale)).toBe('stale');
    expect(reason(forked)).toBe('forked');
    expect(reason(forkedLonger)).toBe('forked');
  });

  test('store absent → supplied; neither → missing; malformed supplied → forked, never throws', () => {
    // setup: a supplied chain whose elements make `said` throw
    const supplied = ['a'];
    const throwing = (s: string) => {
      if (s === 'bad') throw new Error('malformed');
      return s;
    };

    // call out our method under test
    const storeAbsent = ChainFreshness.choose(supplied, undefined, said);
    const missing = ChainFreshness.choose(undefined, [], said);
    const malformed = ChainFreshness.choose(['bad'], ['a'], throwing);

    // assertions
    expect(storeAbsent.ok && storeAbsent.value).toBe(supplied);
    expect(reason(missing)).toBe('missing');
    expect(reason(malformed)).toBe('forked');
  });
});

describe('TelFreshness.choose', () => {
  test('credential TEL keyed on event d: [iss] behind the store [iss, rev] → stale', () => {
    // setup: a credential issued, then revoked
    const c = issue(incept(900), incept(100).aid, { name: 'A' });
    const { rev } = revoke(c.issuer, c.acdc, c.iss);

    // call out our method under test
    const r = TelFreshness.choose([c.iss], [c.iss, rev]);

    // assertions
    expect(r.ok ? 'ok' : r.error).toBe('stale');
  });
});

describe('ChainFreshness.diff', () => {
  // setup: elements are 'r:<said>' (rotation) or 'i:<said>' (interaction); others are neither
  const isRot = (s: string) => s.startsWith('r:');
  const isIxn = (s: string) => s.startsWith('i:');
  const diff = (mine: string[], other: string[], s: (x: string) => string = said) =>
    ChainFreshness.diff(mine, other, s, isRot, isIxn);

  test('equal → identical; one longer → extends at the shorter head', () => {
    // call our method under test
    const identical = diff(['a', 'i:b'], ['a', 'i:b']);
    const otherLonger = diff(['a'], ['a', 'i:b']);
    const mineLonger = diff(['a', 'i:b', 'i:c'], ['a']);
    const empty = diff([], []);

    // assertions
    expect(identical).toEqual({ kind: 'identical' });
    expect(otherLonger).toEqual({ kind: 'extends', longer: 'other', sn: 0 });
    expect(mineLonger).toEqual({ kind: 'extends', longer: 'mine', sn: 0 });
    expect(empty).toEqual({ kind: 'identical' });
  });

  test('ixn vs rot at the same sn → superseded by the rot side; ixn vs ixn → forked', () => {
    // call our method under test
    const byOther = diff(['a', 'i:x'], ['a', 'r:y']);
    const byMine = diff(['a', 'r:y', 'i:z'], ['a', 'i:x']);
    const forked = diff(['a', 'i:x'], ['a', 'i:y', 'i:z']);

    // assertions
    expect(byOther).toEqual({ kind: 'superseded', sn: 1, by: 'other', rotation: 'r:y', superseded: 'i:x' });
    expect(byMine).toEqual({ kind: 'superseded', sn: 1, by: 'mine', rotation: 'r:y', superseded: 'i:x' });
    expect(forked).toEqual({ kind: 'forked', sn: 1, mine: 'i:x', other: 'i:y' });
  });

  test('malformed → forked, never throws', () => {
    // setup: `said` throws on a malformed element
    const throwing = (s: string) => {
      if (s === 'bad') throw new Error('malformed');
      return s;
    };

    // call our method under test
    const r = diff(['a', 'bad'], ['a', 'i:b'], throwing);

    // assertions: the real sn; the malformed side's SAID is ''
    expect(r).toEqual({ kind: 'forked', sn: 1, mine: '', other: 'i:b' });
  });
});
