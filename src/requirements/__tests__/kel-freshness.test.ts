import { describe, expect, test } from 'bun:test';
import { type AID, type KelDiff, KelFreshness, type SAID } from '../../index.js';
import { anchor, delegate, incept, rotate, rotateDelegated } from './fixtures.js';

// setup: one AID with an inception-only KEL, the same KEL after a rotation, and a fork at sn 1
const alice = incept(100);
const rotated = rotate(alice);
const forked = anchor(alice, [{ i: alice.aid, s: '0', d: String(alice.kel[0]!.event.d) }]);
const reason = (r: ReturnType<typeof KelFreshness.choose>) => (r.ok ? 'ok' : r.error);

describe('KelFreshness.choose — store present', () => {
  test('supplied equal to store, or absent → store KEL', () => {
    // call out our method under test
    const equal = KelFreshness.choose(alice.aid, [...rotated.kel], rotated.kel, {});
    const absent = KelFreshness.choose(alice.aid, undefined, rotated.kel, {});

    // assertions: the AS's own read wins
    expect(equal.ok && equal.value).toBe(rotated.kel);
    expect(absent.ok && absent.value).toBe(rotated.kel);
  });

  test('supplied is a strict prefix of store (pre-rotation) → kel-stale', () => {
    // call out our method under test
    const r = KelFreshness.choose(alice.aid, alice.kel, rotated.kel, {});

    // assertions
    expect(reason(r)).toBe('kel-stale');
  });

  test('supplied extends store by a rotation (not yet published) → supplied KEL', () => {
    // call out our method under test
    const r = KelFreshness.choose(alice.aid, rotated.kel, alice.kel, {});

    // assertions
    expect(r.ok && r.value).toBe(rotated.kel);
  });

  test('supplied diverges from store at the same sn → kel-forked', () => {
    // call out our method under test
    // (store holds a different ixn at sn 1; a store rot at sn 1 would make the supplied ixn kel-superseded)
    const r = KelFreshness.choose(alice.aid, forked.kel, anchor(alice, []).kel, {});

    // assertions
    expect(reason(r)).toBe('kel-forked');
  });

  test('supplied extends store by SAID prefix but fails validation → kel-invalid', () => {
    // setup: rotation event with its signatures stripped
    const tail = { ...rotated.kel[1]!, attachments: [] };

    // call out our method under test
    const r = KelFreshness.choose(alice.aid, [alice.kel[0]!, tail], alice.kel, {});

    // assertions
    expect(reason(r)).toBe('kel-invalid');
  });
});

describe('KelFreshness.choose — store absent (AID unknown to the store)', () => {
  test('valid supplied KEL → supplied', () => {
    // call out our method under test
    const r = KelFreshness.choose(alice.aid, rotated.kel, undefined, {});

    // assertions
    expect(r.ok && r.value).toBe(rotated.kel);
  });

  test('supplied KEL failing validation → kel-invalid; none → kel-missing', () => {
    // setup: another controller's valid KEL filed under alice's AID
    const other = incept(700);

    // call out our method under test
    const invalid = KelFreshness.choose(alice.aid, other.kel, undefined, {});
    const missing = KelFreshness.choose(alice.aid, undefined, undefined, {});

    // assertions
    expect(reason(invalid)).toBe('kel-invalid');
    expect(reason(missing)).toBe('kel-missing');
  });
});

describe('KelFreshness.diff', () => {
  // setup: c1 = [icp, ixn@1]; branches at sn 2
  const c1 = anchor(incept(300), []);
  const seal = (d: string) => [{ i: c1.aid, s: '0', d }];
  const a = anchor(c1, seal('EA'));
  const b = anchor(c1, seal('EB'));
  const rot = rotate(c1);

  test('equal → identical; other longer → extends', () => {
    // call our method under test
    const identical = KelFreshness.diff(a.kel, [...a.kel]);
    const extends_ = KelFreshness.diff(c1.kel, a.kel);

    // assertions
    expect(identical).toEqual({ kind: 'identical' });
    expect(extends_).toEqual({ kind: 'extends', longer: 'other', sn: 1 });
  });

  test('anchor(c1, A) vs anchor(c1, B) → forked at sn 2', () => {
    // call our method under test
    const r = KelFreshness.diff(a.kel, b.kel);

    // assertions
    expect(r).toEqual({ kind: 'forked', sn: 2, mine: String(a.kel[2]!.event.d), other: String(b.kel[2]!.event.d) });
  });

  test('mine [.., ixn@2], other [.., rot@2] → superseded by other; reversed → by mine', () => {
    // call our method under test
    const byOther = KelFreshness.diff(a.kel, rot.kel);
    const byMine = KelFreshness.diff(rot.kel, a.kel);

    // assertions
    const expected = { sn: 2, rotation: String(rot.kel[2]!.event.d), superseded: String(a.kel[2]!.event.d) };
    expect(byOther).toEqual({ kind: 'superseded', by: 'other', ...expected });
    expect(byMine).toEqual({ kind: 'superseded', by: 'mine', ...expected });
  });

  test('a rot not satisfying the prior next-key commitment → forked, not superseded', () => {
    // setup: a rot at sn 2 revealing (and signed by) the current key instead of the pre-committed next key
    const forged = rotate({ ...c1, next: c1.current });

    // call our method under test
    const r = KelFreshness.diff(a.kel, forged.kel);

    // assertions
    expect(r).toEqual({ kind: 'forked', sn: 2, mine: String(a.kel[2]!.event.d), other: String(forged.kel[2]!.event.d) });
  });

  test('delegated: ixn vs drt at the same sn → supersede-unsupported, never superseded or forked', () => {
    // setup: a delegate [dip]; one branch anchors ixn@1, the other rotates (drt@1)
    const { parent, child } = delegate(incept(500), 600);
    const ixn = anchor(child, []);
    const drt = rotateDelegated(child, parent).child;

    // call our method under test
    const r = KelFreshness.diff(ixn.kel, drt.kel);

    // assertions
    expect(r).toEqual({ kind: 'supersede-unsupported', sn: 1, by: 'other', case: 'delegated' });
  });

  test('malformed → forked, never throws', () => {
    // call our method under test
    const r = KelFreshness.diff(a.kel, [a.kel[0]!, { bad: true } as unknown as (typeof a.kel)[number]]);

    // assertions: the real sn; the malformed side's SAID is ''
    expect(r).toEqual({ kind: 'forked', sn: 1, mine: String(a.kel[1]!.event.d), other: '' });
  });
});

describe('KelFreshness.choose — supersede', () => {
  // setup: store and supplied branch at sn 2: ixn vs a valid recovery rot
  const c1 = anchor(incept(320), []);
  const ixn = anchor(c1, []);
  const rot = rotate(c1);

  test('supplied rotation recovers over the store ixn → supplied KEL; reversed → kel-superseded', () => {
    // call our method under test
    const recovers = KelFreshness.choose(c1.aid, rot.kel, ixn.kel, {});
    const superseded = KelFreshness.choose(c1.aid, ixn.kel, rot.kel, {});

    // assertions
    expect(recovers.ok && recovers.value).toBe(rot.kel);
    expect(reason(superseded)).toBe('kel-superseded');
  });
});

describe('KelFreshness.outcome (mine = known, other = candidate)', () => {
  // setup: a fixed AID and two SAIDs; outcome is a pure map over KelDiff
  const aid = 'Ealice' as AID;
  const K = 'Eknown' as SAID;
  const C = 'Ecandidate' as SAID;
  const ctx = { aid, used: 'in-line' as const, issuerTelImported: false };

  test('identical and known-longer → also-ingest-known; candidate-longer → use-candidate', () => {
    // call our method under test
    const identical = KelFreshness.outcome({ kind: 'identical' }, ctx);
    const mineLonger = KelFreshness.outcome({ kind: 'extends', longer: 'mine', sn: 1 }, ctx);
    const otherLonger = KelFreshness.outcome({ kind: 'extends', longer: 'other', sn: 1 }, ctx);

    // assertions
    expect(identical).toEqual({ kind: 'also-ingest-known' });
    expect(mineLonger).toEqual({ kind: 'also-ingest-known' });
    expect(otherLonger).toEqual({ kind: 'use-candidate' });
  });

  test('forked → kel-forked with sources [expected, used]', () => {
    // call our method under test
    const r = KelFreshness.outcome({ kind: 'forked', sn: 2, mine: K, other: C }, ctx);

    // assertions
    expect(r).toEqual({
      kind: 'forked',
      fork: { kind: 'kel-forked', aid, sn: 2, known: K, candidate: C, sources: ['expected', 'in-line'] },
    });
  });

  test('superseded by mine → kel-superseded (the candidate is the compromised branch)', () => {
    // call our method under test
    const r = KelFreshness.outcome({ kind: 'superseded', sn: 2, by: 'mine', rotation: K, superseded: C }, {
      ...ctx,
      used: 'oobi',
    });

    // assertions
    expect(r).toEqual({
      kind: 'forked',
      fork: { kind: 'kel-superseded', aid, sn: 2, known: K, candidate: C, sources: ['expected', 'oobi'] },
    });
  });

  test('superseded by other → use-candidate; not-yet-supported once the issuer TEL is imported', () => {
    // setup: the candidate carries a recovery rotation over the known ixn
    const d = { kind: 'superseded', sn: 2, by: 'other', rotation: C, superseded: K } as const;

    // call our method under test
    const fresh = KelFreshness.outcome(d, ctx);
    const imported = KelFreshness.outcome(d, { ...ctx, issuerTelImported: true });

    // assertions
    expect(fresh).toEqual({ kind: 'use-candidate' });
    expect(imported).toEqual({ kind: 'not-yet-supported', case: 'supersede-recovery-tel', aid, sn: 2 });
  });

  test('delegated supersede → not-yet-supported{supersede-recovery-delegated}, never forked', () => {
    // call our method under test
    const r = KelFreshness.outcome({ kind: 'supersede-unsupported', sn: 1, by: 'other', case: 'delegated' }, ctx);

    // assertions
    expect(r).toEqual({ kind: 'not-yet-supported', case: 'supersede-recovery-delegated', aid, sn: 1 });
  });

  test('delegated supersede by the known side → the same not-yet-supported, never forked', () => {
    // call our method under test
    const r = KelFreshness.outcome({ kind: 'supersede-unsupported', sn: 1, by: 'mine', case: 'delegated' }, ctx);

    // assertions
    expect(r).toEqual({ kind: 'not-yet-supported', case: 'supersede-recovery-delegated', aid, sn: 1 });
  });

  test('unknown diff kind throws', () => {
    // call our method under test / assertions
    expect(() => KelFreshness.outcome({ kind: 'bogus' } as unknown as KelDiff, ctx)).toThrow();
  });
});
