import { describe, expect, test } from 'bun:test';
import { anchor, delegate, incept, rotate, rotateDelegated } from '../../requirements/__tests__/fixtures.js';
import type { CESREvent } from '../types.js';
import { KELOps } from '../ops.js';

const last = (kel: CESREvent[]) => kel[kel.length - 1]!;

describe('KELOps.validateSupersede', () => {
  test('validateSupersede ok', () => {
    // setup: known [icp, ixn1, ixn2, ixn3]; a recovery rot built on [icp, ixn1]
    const upTo1 = anchor(incept(7100), []);
    const known = anchor(anchor(upTo1, []), []).kel;
    const rot = last(rotate(upTo1).kel);

    // call our method under test
    const result = KELOps.validateSupersede(upTo1.kel, known.slice(2), rot);

    // assertions: the rot may supersede ixn2 and ixn3
    expect(result).toEqual({ ok: true, value: true });
  });

  test('refuses superseding a rot', () => {
    // setup: known [icp, rot1]; a second, different rot at sn 1 signed by the same pre-rotated key
    const c = incept(7200);
    const known = rotate(c).kel;
    const rotAt1 = last(rotate({ ...c, seed: c.seed + 5 }).kel);

    // call our method under test
    const result = KELOps.validateSupersede(c.kel, known.slice(1), rotAt1);

    // assertions: an establishment event is never superseded
    expect(rotAt1.event.d).not.toBe(known[1]!.event.d);
    expect(result.ok === false && result.error.kind).toBe('kel-invalid');
  });

  test('drt → supersede-unsupported delegated', () => {
    // setup: a delegate [dip, ixn1, ixn2]; a delegator-sealed drt built on [dip, ixn1]
    const { parent, child } = delegate(incept(7300), 7310);
    const child1 = anchor(child, []);
    const known = anchor(child1, []).kel;
    const drt = last(rotateDelegated(child1, parent).child.kel);

    // call our method under test
    const result = KELOps.validateSupersede(child1.kel, known.slice(2), drt);

    // assertions: delegated recovery is typed as unsupported, never kel-invalid
    expect(result).toEqual({ ok: false, error: { kind: 'supersede-unsupported', case: 'delegated' } });
  });

  test('wrong p → kel-invalid', () => {
    // setup: known [icp, ixn1, ixn2]; a rot at sn 2 built on a different ixn1
    const c = incept(7400);
    const upTo1 = anchor(c, []);
    const known = anchor(upTo1, []).kel;
    const otherUpTo1 = anchor(c, [{ i: c.aid, s: '0', d: String(c.kel[0]!.event.d) }]);
    const rot = last(rotate(otherUpTo1).kel);

    // call our method under test
    const result = KELOps.validateSupersede(upTo1.kel, known.slice(2), rot);

    // assertions: p must be the SAID at N-1
    expect(result.ok === false && result.error.kind).toBe('kel-invalid');
  });

  test('rot signed by the current (compromised) key → kel-invalid', () => {
    // setup: known [icp, ixn1]; a rot at sn 1 signed with the current key, not the pre-rotated one
    const c = incept(7500);
    const known = anchor(c, []).kel;
    const forgedRot = last(rotate({ ...c, next: c.current }).kel);

    // call our method under test
    const result = KELOps.validateSupersede(c.kel, known.slice(1), forgedRot);

    // assertions: the prior next-key commitment is not met
    expect(result.ok === false && result.error.kind).toBe('kel-invalid');
  });

  test('malformed inputs → typed err, no throw', () => {
    // setup: a valid recovery rot, then broken inputs around it
    const c = incept(7600);
    const known = anchor(c, []).kel;
    const rot = last(rotate(c).kel);

    // call our method under test
    const empty = KELOps.validateSupersede([], known.slice(1), rot);
    const nothing = KELOps.validateSupersede(c.kel, [], rot);
    const notCesr = KELOps.validateSupersede(c.kel, known.slice(1), { foo: 1 } as unknown as CESREvent);
    const notCesrKel = KELOps.validateSupersede([{} as CESREvent], known.slice(1), rot);

    // assertions: each is a typed kel-invalid
    for (const r of [empty, nothing, notCesr, notCesrKel]) expect(r.ok === false && r.error.kind).toBe('kel-invalid');
  });
});

describe('delegated AIDs', () => {
  test('a plain rot on a dip KEL → supersede-unsupported delegated', () => {
    // setup: a delegate [dip, ixn1, ixn2]; a plain rot (not drt) built on [dip, ixn1] by its pre-rotated key
    const { child } = delegate(incept(7700), 7710);
    const child1 = anchor(child, []);
    const known = anchor(child1, []).kel;
    const rot = last(rotate(child1).kel);

    // call our method under test
    const result = KELOps.validateSupersede(child1.kel, known.slice(2), rot);

    // assertions: the delegated guard holds whatever the supplied ilk
    expect(result).toEqual({ ok: false, error: { kind: 'supersede-unsupported', case: 'delegated' } });
  });

  test('validateAppend rejects a rot after a dip', () => {
    // setup: a delegate [dip]; a plain rot by its pre-rotated key
    const { child } = delegate(incept(7800), 7810);
    const rot = last(rotate(child).kel);

    // call our method under test
    const result = KELOps.validateAppend(child.kel, rot);

    // assertions: a blocking, typed ilk mismatch (keripy: a delegated AID rotates only with drt)
    expect(result.ok).toBe(false);
    expect(result.validation.errors.map((e) => e.code)).toContain('ROTATION_ILK_MISMATCH');
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });
});

describe('non-delegated AIDs', () => {
  test('validateAppend rejects a drt after an icp', () => {
    // setup: a non-delegated [icp] and a delegate's drt-building fixture reused on it (drt signed by alice's pre-rotated key)
    const alice = incept(7900);
    const { parent } = delegate(incept(7950), 7960);
    const drt = last(rotateDelegated(alice, parent).child.kel);

    // call our method under test
    const result = KELOps.validateAppend(alice.kel, drt);

    // assertions: a blocking, typed ilk mismatch (keripy: a non-delegated AID never rotates with drt)
    expect(result.ok).toBe(false);
    expect(result.validation.errors.map((e) => e.code)).toContain('ROTATION_ILK_MISMATCH');
    expect(KELOps.isOnlyPendingSignatureFailures(result.validation)).toBe(false);
  });
});
