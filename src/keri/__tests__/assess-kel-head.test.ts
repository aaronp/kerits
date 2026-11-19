import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { decodeKey } from '../../cesr/keys.js';
import { type CESREvent, KSNs } from '../../kel/types.js';
import { TestKeys } from '../../keys/test-keys.js';
import { anchor, delegate, incept, rotateDelegated } from '../../requirements/__tests__/fixtures.js';
import { assessKelHead, serviceAidOf } from '../assess-kel-head.js';
import { type KeyStateAssessment, RpyKsa } from '../rpy-ksa.js';

const SEED = TestKeys.iterator('assess-kel-head/service').at(0).privateKey;
const NOW = new Date('2026-11-17T12:00:00.000Z');

/** The assessment the signed rpy carries, parsed back from its bytes. */
function assessed(result: ReturnType<typeof assessKelHead>): KeyStateAssessment {
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  const parsed = RpyKsa.parse(result.value.rpy);
  if (!parsed.ok) throw new Error(`rpy did not parse: ${parsed.error}`);
  expect(parsed.value.assessment).toEqual(result.value.assessment);
  return parsed.value.assessment;
}

describe('assessKelHead', () => {
  test('a valid KEL is assessed valid with validatedHead = head', () => {
    // setup: an identity with a one-event KEL
    const alice = incept(100);

    // call out our method under test
    const result = assessKelHead({ aid: alice.aid, kel: alice.kel, seed: SEED, now: NOW });

    // assertions: valid, the real KSN, validatedHead the head, signed by the service key
    const a = assessed(result);
    const head = alice.kel[0]!.event;
    expect(a).toEqual({
      ksn: KSNs.fromKEL(alice.aid, alice.kel)!,
      validation: { status: 'valid' },
      validatedHead: { s: head.s, d: head.d, k: head.k, kt: String(head.kt) },
      assessedAt: NOW.toISOString(),
    });
    if (!result.ok) return;
    expect(RpyKsa.parse(result.value.rpy)).toMatchObject({ ok: true, value: { signer: serviceAidOf(SEED) } });
  });

  test('a dip without its anchor is pending, validatedHead null, outstanding delegation-approval with delegatorAid', () => {
    // setup: a dip whose anchor the published delegator KEL does not hold (the delegator's pre-anchor KEL)
    const parent = incept(120);
    const { child } = delegate(parent, 130);

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: child.kel, delegatorKel: parent.kel, seed: SEED, now: NOW });

    // assertions: pending on the dip's approval by the parent; nothing validated yet; the KSN is still the real head
    const a = assessed(result);
    expect(a.validation).toEqual({
      status: 'pending',
      outstanding: [{ type: 'delegation-approval', eventSaid: child.kel[0]!.event.d, delegatorAid: parent.aid }],
    });
    expect(a.validatedHead).toBeNull();
    expect(a.ksn.d).toBe(child.kel[0]!.event.d);
  });

  test('a dip with no delegator KEL at all is pending', () => {
    // setup: a dip whose delegator has published nothing
    const { child } = delegate(incept(125), 135);

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: child.kel, seed: SEED, now: NOW });

    // assertions: pending, not refused
    expect(assessed(result).validation.status).toBe('pending');
  });

  test('a drt without its anchor after a valid dip is pending with validatedHead = the dip', () => {
    // setup: a delegated rotation whose anchor the published delegator KEL does not yet hold
    const d = delegate(incept(140), 150);
    const r = rotateDelegated(d.child, d.parent);

    // call out our method under test
    const result = assessKelHead({ aid: r.child.aid, kel: r.child.kel, delegatorKel: d.parent.kel, seed: SEED, now: NOW });

    // assertions: pending on the drt; validatedHead the dip at the dip's keys; the KSN names the drt head and its keys
    const a = assessed(result);
    const [dip, drt] = [r.child.kel[0]!.event, r.child.kel[1]!.event];
    expect(a.validation).toEqual({
      status: 'pending',
      outstanding: [{ type: 'delegation-approval', eventSaid: drt.d, delegatorAid: d.parent.aid }],
    });
    expect(a.validatedHead).toEqual({ s: dip.s, d: dip.d, k: dip.k, kt: dip.kt });
    expect(a.ksn.d).toBe(drt.d);
    expect(a.ksn.k).not.toEqual(dip.k);
  });

  test('an ixn as validatedHead carries the keys in force at it (the dip\'s)', () => {
    // setup: a delegate's dip (approved), an ixn, then a drt whose anchor the published delegator KEL does not hold
    const d = delegate(incept(180), 190);
    const r = rotateDelegated(anchor(d.child, []), d.parent);

    // call out our method under test
    const result = assessKelHead({ aid: r.child.aid, kel: r.child.kel, delegatorKel: d.parent.kel, seed: SEED, now: NOW });

    // assertions: pending on the drt; validatedHead is the ixn's s/d with the dip's keys and threshold
    const a = assessed(result);
    const [dip, ixn] = [r.child.kel[0]!.event, r.child.kel[1]!.event];
    expect(a.validation.status).toBe('pending');
    expect(a.validatedHead).toEqual({ s: ixn.s, d: ixn.d, k: dip.k, kt: String(dip.kt) });
  });

  test('a validated rotation before a pending one gives validatedHead the earlier rotation\'s keys', () => {
    // setup: a delegate whose first drt is approved and whose second drt's anchor is not published
    const d = delegate(incept(185), 195);
    const r1 = rotateDelegated(d.child, d.parent);
    const r2 = rotateDelegated(r1.child, r1.parent);

    // call out our method under test
    const result = assessKelHead({ aid: r2.child.aid, kel: r2.child.kel, delegatorKel: r1.parent.kel, seed: SEED, now: NOW });

    // assertions: pending on the second drt; validatedHead the first drt at its keys, not the head's
    const a = assessed(result);
    const drt1 = r2.child.kel[1]!.event;
    expect(a.validation.status).toBe('pending');
    expect(a.validatedHead).toEqual({ s: drt1.s, d: drt1.d, k: drt1.k, kt: String(drt1.kt) });
    expect(a.ksn.k).not.toEqual(drt1.k);
  });

  test('the anchor published turns pending into valid', () => {
    // setup: a delegated rotation, assessed before and after the delegator publishes its anchor
    const d = delegate(incept(160), 170);
    const r = rotateDelegated(d.child, d.parent);
    const before = assessKelHead({ aid: r.child.aid, kel: r.child.kel, delegatorKel: d.parent.kel, seed: SEED, now: NOW });

    // call out our method under test
    const after = assessKelHead({ aid: r.child.aid, kel: r.child.kel, delegatorKel: r.parent.kel, seed: SEED, now: NOW });

    // assertions: pending, then valid with validatedHead the drt
    expect(assessed(before).validation.status).toBe('pending');
    const a = assessed(after);
    expect(a.validation).toEqual({ status: 'valid' });
    const drt = r.child.kel[1]!.event;
    expect(a.validatedHead).toEqual({ s: drt.s, d: drt.d, k: a.ksn.k, kt: a.ksn.kt });
  });

  test('a bad signature is invalid-kel, never pending', () => {
    // setup: a dip (anchor missing) whose signature is replaced by one over another event
    const { child } = delegate(incept(200), 210);
    const other = incept(220).kel[0]!;
    const forged = {
      ...child.kel[0]!,
      attachments: child.kel[0]!.attachments.map((a) => (a.kind === 'sig' ? other.attachments.find((o) => o.kind === 'sig')! : a)),
    };

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: [forged], seed: SEED, now: NOW });

    // assertions: refused as invalid-kel, not signed as pending
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('invalid-kel');
  });

  test('a delegator event at the seal-source sn with a different SAID is invalid-kel, never pending', () => {
    // setup: the delegator published a different event (an empty ixn) at the sn the dip's seal source names
    const parent = incept(230);
    const { child } = delegate(parent, 240);
    const other = anchor(parent, []);

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: child.kel, delegatorKel: other.kel, seed: SEED, now: NOW });

    // assertions: refused (parent-said-mismatch), not signed as pending
    expect(result).toEqual({ ok: false, error: { kind: 'invalid-kel', reason: 'parent-said-mismatch' } });
  });

  test('a seal source naming a delegator event without the anchor seal is invalid-kel, never pending', () => {
    // setup: the dip's seal source points at a real delegator event (an empty ixn) that carries no seal for it
    const parent = incept(250);
    const { child } = delegate(parent, 260);
    const other = anchor(parent, []);
    const unanchored = withSource(child.kel[0]!, other.kel[1]!.event.s, other.kel[1]!.event.d);

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: [unanchored], delegatorKel: other.kel, seed: SEED, now: NOW });

    // assertions: refused (anchor-seal-missing), not signed as pending
    expect(result).toEqual({ ok: false, error: { kind: 'invalid-kel', reason: 'anchor-seal-missing' } });
  });

  test('a malformed seal-source sn is invalid-kel, never pending', () => {
    // setup: the dip's seal source names an unparseable sn
    const parent = incept(270);
    const { child } = delegate(parent, 280);
    const malformed = withSource(child.kel[0]!, 'zz', child.kel[0]!.event.d);

    // call out our method under test
    const result = assessKelHead({ aid: child.aid, kel: [malformed], delegatorKel: parent.kel, seed: SEED, now: NOW });

    // assertions: refused rather than read as a missing anchor
    expect(result).toEqual({ ok: false, error: { kind: 'invalid-kel', reason: 'malformed seal source' } });
  });

  test('empty KEL is not-published', () => {
    // setup: an AID with no KEL
    const alice = incept(110);

    // call out our method under test
    const result = assessKelHead({ aid: alice.aid, kel: [], seed: SEED, now: NOW });

    // assertions: refused as not-published
    expect(result).toEqual({ ok: false, error: { kind: 'not-published' } });
  });

  test('a KEL for another AID is invalid-kel', () => {
    // setup: two identities
    const alice = incept(180);
    const bob = incept(190);

    // call out our method under test
    const result = assessKelHead({ aid: alice.aid, kel: bob.kel, seed: SEED, now: NOW });

    // assertions: refused rather than assessing bob's keys as alice's
    expect(result).toEqual({ ok: false, error: { kind: 'invalid-kel', reason: 'KEL is not for aid' } });
  });

  test('serviceAidOf starts with B and is the seed public key', () => {
    // setup: the seed's Ed25519 public key
    const pub = ed25519.getPublicKey(SEED);

    // call out our method under test
    const aid = serviceAidOf(SEED);

    // assertions: non-transferable prefix over the seed's public key
    expect(aid.startsWith('B')).toBe(true);
    expect(decodeKey(aid).raw).toEqual(pub);
  });
});

/** `ev` with its delegator seal source replaced by `{s, d}` (the seal source is an attachment, outside the signed body). */
function withSource(ev: CESREvent, s: string, d: string): CESREvent {
  return {
    ...ev,
    attachments: ev.attachments.map((a) => (a.kind === 'delegator-seal-source' ? { kind: 'delegator-seal-source', s, d } : a)),
  };
}

describe('RpyKsa.parse', () => {
  const alice = incept(300);
  const head = alice.kel[0]!.event;
  const headAt = { s: head.s, d: head.d, k: head.k, kt: String(head.kt) };
  const signedBy = (assessment: KeyStateAssessment, seed: Uint8Array) => {
    const { body } = RpyKsa.build(assessment, NOW);
    return RpyKsa.attach(body, serviceAidOf(seed), ed25519.sign(body, seed));
  };

  test('parse accepts insufficient-signatures outstanding', () => {
    // setup: a pending assessment the store does not emit today, signed by the service key
    const assessment: KeyStateAssessment = {
      ksn: KSNs.fromKEL(alice.aid, alice.kel)!,
      validation: { status: 'pending', outstanding: [{ type: 'insufficient-signatures', eventSaid: head.d }] },
      validatedHead: null,
      assessedAt: NOW.toISOString(),
    };

    // call out our method under test
    const parsed = RpyKsa.parse(signedBy(assessment, SEED));

    // assertions: parsed back unchanged, with its signer
    expect(parsed).toMatchObject({ ok: true, value: { assessment, signer: serviceAidOf(SEED) } });
  });

  test('parse refuses a body not signed by the attached signer', () => {
    // setup: a valid assessment signed by one key, with another key named as the signer
    const { body } = RpyKsa.build(
      { ksn: KSNs.fromKEL(alice.aid, alice.kel)!, validation: { status: 'valid' }, validatedHead: headAt, assessedAt: NOW.toISOString() },
      NOW,
    );
    const otherSeed = TestKeys.iterator('assess-kel-head/other').at(0).privateKey;
    const rpy = RpyKsa.attach(body, serviceAidOf(SEED), ed25519.sign(body, otherSeed));

    // call out our method under test
    const parsed = RpyKsa.parse(rpy);

    // assertions: refused
    expect(parsed.ok).toBe(false);
  });

  test('parse refuses valid without validatedHead at the head', () => {
    // setup: valid assessments whose validatedHead is null, or not the KSN's head or its keys
    const ksn = KSNs.fromKEL(alice.aid, alice.kel)!;
    const valid = { ksn, validation: { status: 'valid' }, assessedAt: NOW.toISOString() } as const;
    const nullHead = signedBy({ ...valid, validatedHead: null }, SEED);
    const otherHead = signedBy({ ...valid, validatedHead: { ...headAt, d: incept(310).kel[0]!.event.d } }, SEED);
    const otherSn = signedBy({ ...valid, validatedHead: { ...headAt, s: '1' } }, SEED);
    const otherKeys = signedBy({ ...valid, validatedHead: { ...headAt, k: incept(311).kel[0]!.event.k } }, SEED);

    // call out our method under test
    const parsed = [nullHead, otherHead, otherSn, otherKeys].map((rpy) => RpyKsa.parse(rpy));

    // assertions: each refused for the invariant
    for (const p of parsed) expect(p).toEqual({ ok: false, error: 'valid but validatedHead is not the head' });
  });

  test('parse accepts pending with a validatedHead before the head', () => {
    // setup: a delegate whose drt is pending; validatedHead is the dip
    const d = delegate(incept(320), 330);
    const r = rotateDelegated(d.child, d.parent);
    const dip = r.child.kel[0]!.event;
    const assessment: KeyStateAssessment = {
      ksn: KSNs.fromKEL(r.child.aid, r.child.kel)!,
      validation: {
        status: 'pending',
        outstanding: [{ type: 'delegation-approval', eventSaid: r.child.kel[1]!.event.d, delegatorAid: d.parent.aid }],
      },
      validatedHead: { s: dip.s, d: dip.d, k: dip.k, kt: String(dip.kt) },
      assessedAt: NOW.toISOString(),
    };

    // call out our method under test
    const parsed = RpyKsa.parse(signedBy(assessment, SEED));

    // assertions: accepted unchanged
    expect(parsed).toMatchObject({ ok: true, value: { assessment } });
  });

  test('parse refuses a validatedHead without keys or with a kt its keys cannot meet', () => {
    // setup: pending assessments whose validatedHead has no keys, or a threshold above its key count
    const d = delegate(incept(340), 350);
    const r = rotateDelegated(d.child, d.parent);
    const dip = r.child.kel[0]!.event;
    const pending = (validatedHead: KeyStateAssessment['validatedHead']): KeyStateAssessment => ({
      ksn: KSNs.fromKEL(r.child.aid, r.child.kel)!,
      validation: {
        status: 'pending',
        outstanding: [{ type: 'delegation-approval', eventSaid: r.child.kel[1]!.event.d, delegatorAid: d.parent.aid }],
      },
      validatedHead,
      assessedAt: NOW.toISOString(),
    });
    const noKeys = signedBy(pending({ s: dip.s, d: dip.d, k: [], kt: '1' }), SEED);
    const ktTooHigh = signedBy(pending({ s: dip.s, d: dip.d, k: dip.k, kt: '2' }), SEED);

    // call out our method under test
    const parsed = [noKeys, ktTooHigh].map((rpy) => RpyKsa.parse(rpy));

    // assertions: refused by the schema, and by the threshold check
    expect(parsed).toEqual([
      { ok: false, error: 'body is not a KeyStateAssessment' },
      { ok: false, error: 'bad validatedHead.kt' },
    ]);
  });

  test('parse refuses an extra field in the ksn', () => {
    // setup: a valid assessment whose ksn carries a field KSNSchema does not define
    const ksn = { ...KSNs.fromKEL(alice.aid, alice.kel)!, extra: 'x' };
    const rpy = signedBy(
      { ksn, validation: { status: 'valid' }, validatedHead: headAt, assessedAt: NOW.toISOString() },
      SEED,
    );

    // call out our method under test
    const parsed = RpyKsa.parse(rpy);

    // assertions: refused by the closed schema
    expect(parsed).toEqual({ ok: false, error: 'body is not a KeyStateAssessment' });
  });
});
