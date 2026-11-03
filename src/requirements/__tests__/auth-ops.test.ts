import { describe, expect, test } from 'bun:test';
import {
  AuthOps,
  ChallengeOps,
  isAuthResponse,
  PolicyData,
  PolicyRefOps,
  RequirementData,
  type AID,
  type AuthRequest,
  type ChallengeResponse,
  type KeriKeyPair,
  type PublicKey,
  type RequestEntry,
  type ResolvedAuthResponse,
  type ResolvedAuthResponseSlot,
  type SAID,
} from '../../index.js';
import {
  DEFAULT_SCHEMA, delegate, incept, inceptMulti, issue, revoke, rotate, rotateMulti, signBytes, type Controller,
} from './fixtures.js';

const NOW = new Date('2026-10-07T12:00:00.000Z');
const NONCE = 'n'.repeat(32);
const OTHER_NONCE = 'x'.repeat(32);

// setup: three holders, a target, one issuer who issues each holder a credential
const h1 = incept(100);
const h2 = incept(200);
const h3 = incept(300);
const target = incept(400);
const c1 = issue(incept(900), h1.aid, { name: 'One' });
const c2 = issue(c1.issuer, h2.aid, { name: 'Two' });
const c3 = issue(c2.issuer, h3.aid, { name: 'Three' });
const issuer = c3.issuer;
const kels: Record<AID, typeof h1.kel> = {
  [h1.aid]: h1.kel, [h2.aid]: h2.kel, [h3.aid]: h3.kel, [target.aid]: target.kel, [issuer.aid]: issuer.kel,
};

const policy = PolicyData.create(
  RequirementData.hasCredential({
    issuer: { type: 'any-of', aids: [issuer.aid] },
    holder: { type: 'subject' },
    credential: { schema: DEFAULT_SCHEMA, predicates: [] },
  }),
);

const entry = (as: string, need: RequestEntry['need'] = 'required'): RequestEntry => ({ policy, as, need, purpose: `why ${as}` });

const request: AuthRequest = {
  entries: [entry('alpha'), entry('beta'), entry('gamma')],
  nonce: NONCE,
  audience: 'https://rp.example',
  createdAt: '2026-10-07T00:00:00.000Z',
  expiresAt: '2026-10-08T00:00:00.000Z',
  allowTargetAid: true,
};

/** `aid`'s control over `nonce`, signed by `key` (defaults to its current key). */
const controlFor = (aid: AID, key: KeriKeyPair, nonce = NONCE, audience = request.audience): ChallengeResponse => {
  const unsigned = { nonce, audience, aid, publicKey: key.publicKey as PublicKey };
  return { ...unsigned, signature: signBytes(key, AuthOps.signingBytes(unsigned)) };
};
const control = (who: Controller, nonce = NONCE) => controlFor(who.aid, who.current, nonce);

const slotFor = (cred: typeof c1, subject: AID): ResolvedAuthResponseSlot => ({
  policySaid: policy.d,
  subject,
  evidence: {
    type: 'has-credential', acdc: cred.acdc, registryTel: [cred.registry], credentialTel: [cred.iss],
    kels: { [issuer.aid]: issuer.kel },
  },
});

const response: ResolvedAuthResponse = {
  requestNonce: NONCE,
  target: target.aid,
  slots: { alpha: slotFor(c1, h1.aid), beta: slotFor(c2, h2.aid), gamma: slotFor(c3, h3.aid) },
  controls: { [h1.aid]: control(h1), [h2.aid]: control(h2), [h3.aid]: control(h3), [target.aid]: control(target) },
};

const failures = (r: ReturnType<typeof AuthOps.checkShape>) => (r.ok ? [] : r.error);

describe('PolicyRefOps.resolve', () => {
  test('inline validates; SAID needs fetch and matching d; invalid inline rejected', () => {
    // setup: a second policy and a tampered copy
    const other = PolicyData.create(RequirementData.isMember(h1.aid));
    const tampered = { ...policy, d: other.d };
    const fetch = (s: SAID) => (s === policy.d ? policy : s === other.d ? tampered : undefined);

    // call out our method under test
    const inline = PolicyRefOps.resolve(policy);
    const bySaid = PolicyRefOps.resolve(policy.d, fetch);
    const missing = PolicyRefOps.resolve(policy.d);
    const mismatched = PolicyRefOps.resolve(other.d, fetch);
    const bad = PolicyRefOps.resolve(tampered);

    // assertions
    expect(inline.ok && inline.value).toEqual(policy);
    expect(bySaid.ok && bySaid.value).toEqual(policy);
    expect(!missing.ok && missing.error.kind).toBe('not-found');
    expect(!mismatched.ok && mismatched.error.kind).toBe('said-mismatch');
    expect(!bad.ok && bad.error.kind).toBe('said-mismatch');
  });
});

describe('AuthOps.checkShape — entries and slots', () => {
  test('3 has-credential entries → shaped in request order with slot and policy', () => {
    // call out our method under test
    const r = AuthOps.checkShape(request, response);

    // assertions: entries in request order, each with its slot subject and the inline policy
    expect(r.ok && r.value.map((e) => [e.entry.as, e.slot.subject, e.policy.d])).toEqual([
      ['alpha', h1.aid, policy.d], ['beta', h2.aid, policy.d], ['gamma', h3.aid, policy.d],
    ]);
  });

  test('slot schema rejects the removed discloseHolder flag', () => {
    // setup: a slot still carrying discloseHolder
    const slots = { ...response.slots, alpha: { ...response.slots.alpha!, discloseHolder: true } };

    // call out our method under test
    const legacy = isAuthResponse({ ...response, slots });

    // assertions: holderAID metadata replaces it
    expect(isAuthResponse(response)).toBe(true);
    expect(legacy).toBe(false);
  });

  test('optional entry absent → omitted; required absent → required-missing', () => {
    // setup: gamma optional; drop gamma's slot
    const { gamma: _g, ...slots } = response.slots;
    const optional = { ...request, entries: [entry('alpha'), entry('beta'), entry('gamma', 'optional')] };

    // call out our method under test
    const ok = AuthOps.checkShape(optional, { ...response, slots });
    const missing = AuthOps.checkShape(request, { ...response, slots });

    // assertions
    expect(ok.ok && ok.value.map((e) => e.entry.as)).toEqual(['alpha', 'beta']);
    expect(failures(missing)).toEqual([{ kind: 'required-missing', as: 'gamma' }]);
  });

  test('slot under an alias not in the request → unknown-alias', () => {
    // setup: an extra slot the site never asked for
    const slots = { ...response.slots, delta: slotFor(c1, h1.aid) };

    // call out our method under test
    const r = AuthOps.checkShape(request, { ...response, slots });

    // assertions
    expect(failures(r)).toEqual([{ kind: 'unknown-alias', as: 'delta' }]);
  });

  test('response nonce from another request → nonce-mismatch', () => {
    // call out our method under test
    const r = AuthOps.checkShape(request, { ...response, requestNonce: OTHER_NONCE });

    // assertions
    expect(failures(r)).toEqual([{ kind: 'nonce-mismatch' }]);
  });

  test('target when not allowed → target-not-allowed', () => {
    // call out our method under test
    const r = AuthOps.checkShape({ ...request, allowTargetAid: false }, response);

    // assertions
    expect(failures(r)).toEqual([{ kind: 'target-not-allowed' }]);
  });

  test('SAID PolicyRef: resolved via fetch or the slot policy; unresolvable → policy-unresolved per alias', () => {
    // setup: request references the policy by SAID only
    const bySaid = { ...request, entries: request.entries.map((e) => ({ ...e, policy: policy.d })) };
    const withPolicy = { ...response, slots: { ...response.slots, alpha: { ...response.slots.alpha!, policy } } };

    // call out our method under test
    const fetched = AuthOps.checkShape(bySaid, response, () => policy);
    const missing = AuthOps.checkShape(bySaid, withPolicy);

    // assertions: alpha resolves from its slot policy; beta and gamma cannot resolve
    expect(fetched.ok).toBe(true);
    expect(failures(missing)).toEqual([
      { kind: 'policy-unresolved', as: 'beta', reason: 'not-found' },
      { kind: 'policy-unresolved', as: 'gamma', reason: 'not-found' },
    ]);
  });
});

describe('AuthOps.controlAids / verifyControl — one proof per distinct AID', () => {
  /** verifyControl for every AID the response must prove, against `kelsIn`. */
  const proveAll = (resp: ResolvedAuthResponse, kelsIn: typeof kels) =>
    [...AuthOps.controlAids(request, resp).keys()].map((aid) => {
      const c = resp.controls[aid];
      return c ? AuthOps.verifyControl(request, aid, c, kelsIn) : undefined;
    });

  test('one AID holding two aliases and the target is proven once', () => {
    // setup: h1 holds alpha and beta and is the target
    const req = { ...request, entries: [entry('alpha'), entry('beta')] };
    const resp: ResolvedAuthResponse = {
      requestNonce: NONCE, target: h1.aid,
      slots: { alpha: slotFor(c1, h1.aid), beta: slotFor(c1, h1.aid) },
      controls: { [h1.aid]: control(h1) },
    };
    // bad signature: signed over another nonce, presented for this one
    const bad = { ...control(h1, OTHER_NONCE), nonce: NONCE };

    // call out our methods under test
    const aids = AuthOps.controlAids(req, resp);
    const good = AuthOps.verifyControl(request, h1.aid, resp.controls[h1.aid]!, kels);
    const forged = AuthOps.verifyControl(request, h1.aid, bad, kels);

    // assertions: one AID naming both aliases; the key verifies; a forged signature does not
    expect([...aids]).toEqual([[h1.aid, ['alpha', 'beta']]]);
    expect(good).toEqual({ ok: true, value: h1.current.publicKey });
    expect(forged).toEqual({ ok: false, error: 'signature-invalid' });
  });

  test('the target is proven too, after the slot subjects', () => {
    // call out our method under test
    const aids = AuthOps.controlAids(request, response);

    // assertions
    expect([...aids.keys()]).toEqual([h1.aid, h2.aid, h3.aid, target.aid]);
  });

  test("a control signed by another AID's key → key-not-in-kel", () => {
    // setup: h2's control signed with h1's key
    const controls = { ...response.controls, [h2.aid]: controlFor(h2.aid, h1.current) };

    // call out our method under test
    const r = proveAll({ ...response, controls }, kels);

    // assertions: only h2 fails
    expect(r.map((x) => x?.ok)).toEqual([true, false, true, true]);
    expect(r[1]).toEqual({ ok: false, error: 'key-not-in-kel' });
  });

  test('control signed by a rotated-out key with the full KEL → key-not-in-kel', () => {
    // setup: h1 rotated; the old key signs; the full rotated KEL is supplied
    const rotated = rotate(h1);

    // call out our method under test
    const r = AuthOps.verifyControl(request, h1.aid, controlFor(h1.aid, h1.current), { ...kels, [h1.aid]: rotated.kel });

    // assertions
    expect(r).toEqual({ ok: false, error: 'key-not-in-kel' });
  });

  test('multi-key target: any current key (index 1) → ok; a prior establishment key → key-not-in-kel', () => {
    // setup: 2-key target AID, then rotated to its next 2 keys
    const multi = inceptMulti(600, 2);
    const rotated = rotateMulti(multi, 610);
    const multiKels = { ...kels, [multi.aid]: rotated.kel };

    // call out our method under test
    const current = AuthOps.verifyControl(request, multi.aid, controlFor(multi.aid, rotated.keys[1]!), multiKels);
    const prior = AuthOps.verifyControl(request, multi.aid, controlFor(multi.aid, multi.keys[1]!), multiKels);

    // assertions
    expect(current).toEqual({ ok: true, value: rotated.keys[1]!.publicKey });
    expect(prior).toEqual({ ok: false, error: 'key-not-in-kel' });
  });

  test('a control signed for another audience (replayed from another AS) → audience-mismatch', () => {
    // setup: h1's control was signed for another AS
    const replayed = controlFor(h1.aid, h1.current, NONCE, 'https://other-as.example');

    // call out our method under test
    const r = AuthOps.verifyControl(request, h1.aid, replayed, kels);

    // assertions: refused, naming the audience
    expect(r).toEqual({ ok: false, error: 'audience-mismatch' });
  });

  test('control for a different AID filed under the slot subject → aid-mismatch', () => {
    // setup: h2's valid control presented for h1

    // call out our method under test
    const r = AuthOps.verifyControl(request, h1.aid, control(h2), kels);

    // assertions
    expect(r).toEqual({ ok: false, error: 'aid-mismatch' });
  });
});

describe('AuthOps.checkShape / verifyControl', () => {
  test('checkShape returns each present entry with its slot and resolved policy', () => {
    // setup: gamma optional and absent
    const optional = { ...request, entries: [entry('alpha'), entry('beta'), entry('gamma', 'optional')] };
    const { gamma: _g, ...slots } = response.slots;

    // call out our method under test
    const shaped = AuthOps.checkShape(optional, { ...response, slots });
    const said = AuthOps.checkShape(request, { ...response, slots: { ...response.slots, alpha: { ...response.slots.alpha!, policySaid: h1.aid as string as SAID } } });

    // assertions: two entries, each with the inline policy; a slot naming another SAID is policy-said-mismatch
    expect(shaped.ok && shaped.value.map((s) => [s.entry.as, s.slot.subject, s.policy.d])).toEqual([
      ['alpha', h1.aid, policy.d],
      ['beta', h2.aid, policy.d],
    ]);
    expect(failures(said)).toEqual([{ kind: 'policy-said-mismatch', as: 'alpha' }]);
  });

  test('verifyControl reads only the given KELs: one current key, kt not consulted', () => {
    // setup: a 2-key AID (kt 2) signs with one of its current keys
    const multi = inceptMulti(700, 2);
    const signed = controlFor(multi.aid, multi.keys[1]!);

    // call out our method under test
    const ok = AuthOps.verifyControl(request, multi.aid, signed, { [multi.aid]: multi.kel });
    const missing = AuthOps.verifyControl(request, multi.aid, signed, {});
    const mismatch = AuthOps.verifyControl(request, h1.aid, signed, { [multi.aid]: multi.kel });

    // assertions: the signing key; no KEL → kel-missing; filed under another AID → aid-mismatch
    expect(ok).toEqual({ ok: true, value: multi.keys[1]!.publicKey });
    expect(missing).toEqual({ ok: false, error: 'kel-missing' });
    expect(mismatch).toEqual({ ok: false, error: 'aid-mismatch' });
  });

  test('verifyControl verifies a delegated AID against its delegator in the given KELs', () => {
    // setup: a delegated child; its delegator's KEL supplied alongside
    const d = delegate(incept(800), 810);

    // call out our method under test
    const withParent = AuthOps.verifyControl(request, d.child.aid, control(d.child), { [d.child.aid]: d.child.kel, [d.parent.aid]: d.parent.kel });
    const alone = AuthOps.verifyControl(request, d.child.aid, control(d.child), { [d.child.aid]: d.child.kel });

    // assertions: ok with the delegator; kel-invalid without it
    expect(withParent.ok).toBe(true);
    expect(alone).toEqual({ ok: false, error: 'kel-invalid' });
  });
});

describe('auth controls and identity challenges have separate signature domains', () => {
  const unsigned = { nonce: NONCE, audience: request.audience, aid: h1.aid, publicKey: h1.current.publicKey as PublicKey };

  test('an identity-challenge signature does not verify as a kerits-auth control, and vice versa', () => {
    // setup: the same holder signs the same nonce and audience once per domain
    const asChallenge = { ...unsigned, signature: signBytes(h1.current, ChallengeOps.signingBytes(unsigned)) };
    const asControl = { ...unsigned, signature: signBytes(h1.current, AuthOps.signingBytes(unsigned)) };

    // call out our method under test
    const challengeAsControl = AuthOps.verifyControl(request, h1.aid, asChallenge, kels);
    const controlAsChallenge = ChallengeOps.verify({ nonce: NONCE, audience: request.audience }, asControl, h1.kel);

    // assertions: each domain rejects the other's signature; each accepts its own
    expect(challengeAsControl).toEqual({ ok: false, error: 'signature-invalid' });
    expect(controlAsChallenge.ok ? 'ok' : controlAsChallenge.error.kind).toBe('signature-invalid');
    expect(AuthOps.verifyControl(request, h1.aid, asControl, kels).ok).toBe(true);
    expect(ChallengeOps.verify({ nonce: NONCE, audience: request.audience }, asChallenge, h1.kel).ok).toBe(true);
  });
});
