import { describe, expect, test } from 'bun:test';
import { Value } from '@sinclair/typebox/value';
import { canonical, ChallengeOps, ChallengeResponseSchema, ChallengeSchema } from '../../index.js';
import type { AID, CESREvent, Challenge, ChallengeResponse, PublicKey, SAID, Signature } from '../../index.js';
import { anchor, delegate, incept, rotate, rotateDelegated, signBytes, type Controller } from '../../requirements/__tests__/fixtures.js';

/** The audience each test challenge expects (the verifier: a challenger AID or an AS origin). */
const AUD = 'https://as.example';
type Expected = Challenge & { audience: string };
const respond = (c: Expected, who: Controller, key = who.current, extra: Pick<ChallengeResponse, 'kel' | 'lineage' | 'remotes'> = {}): ChallengeResponse => {
  const unsigned = { nonce: c.nonce, audience: c.audience, aid: who.aid, publicKey: key.publicKey as PublicKey, ...(c.subject ? { subject: c.subject } : {}), ...extra };
  return { ...unsigned, signature: signBytes(key, ChallengeOps.signingBytes(unsigned)) };
};
const kind = (r: ReturnType<typeof ChallengeOps.verify>) => (r.ok ? 'ok' : r.error.kind);

describe('ChallengeOps.verify', () => {
  const bob = incept(200);
  const eve = incept(900);
  const challenge: Expected = { nonce: 'n'.repeat(32), subject: 'ESubject000000000000000000000000000000000000' as SAID, audience: AUD };

  test('valid response verifies', () => {
    // setup: bob signs the challenge with his current key
    const r = respond(challenge, bob);
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, bob.kel))).toBe('ok');
  });

  test('rejects wrong nonce, tampered subject, wrong aid, bad signature', () => {
    // setup
    const r = respond(challenge, bob);
    // method under test / assertions
    expect(kind(ChallengeOps.verify({ ...challenge, nonce: 'x'.repeat(32) }, r, bob.kel))).toBe('nonce-mismatch');
    expect(kind(ChallengeOps.verify(challenge, { ...r, subject: undefined }, bob.kel))).toBe('subject-mismatch');
    expect(kind(ChallengeOps.verify(challenge, { ...r, aid: eve.aid }, bob.kel))).toBe('aid-mismatch');
    expect(kind(ChallengeOps.verify(challenge, { ...r, signature: respond(challenge, eve).signature }, bob.kel))).toBe('signature-invalid');
  });

  test('key rotated out of the latest KEL fails key-not-in-kel', () => {
    // setup: bob answers with his pre-rotation key, then rotates
    const r = respond(challenge, bob);
    const rotated = rotate(bob);
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, rotated.kel))).toBe('key-not-in-kel');
    expect(kind(ChallengeOps.verify(challenge, respond(challenge, rotated), rotated.kel))).toBe('ok');
  });

  test('tampered KEL fails kel-invalid', () => {
    // setup
    const r = respond(challenge, bob);
    const broken = [{ ...bob.kel[0]!, attachments: [] }];
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, broken))).toBe('kel-invalid');
  });

  test('delegated responder verifies with ancestor KELs, kel-invalid without', () => {
    // setup: carol is delegated by bob
    const { parent: bobSealed, child: carol } = delegate(bob, 300);
    const r = respond(challenge, carol);
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, carol.kel, { [bobSealed.aid]: bobSealed.kel }))).toBe('ok');
    expect(kind(ChallengeOps.verify(challenge, r, carol.kel))).toBe('kel-invalid');
  });

  test('non-qb64 signature fails signature-invalid without throwing', () => {
    // setup
    const r = { ...respond(challenge, bob), signature: '!!not-qb64!!' as Signature };
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, bob.kel))).toBe('signature-invalid');
  });

  test('a response signed for audience A fails against a challenge for audience B → audience-mismatch', () => {
    // setup: bob answers a challenge from AS A; the same response is replayed to AS B
    const forA = respond({ ...challenge, audience: 'https://a.example' }, bob);
    // call out our method under test
    const atB = ChallengeOps.verify({ ...challenge, audience: 'https://b.example' }, forA, bob.kel);
    // assertions: refused before the signature is checked, naming the audience
    expect(kind(atB)).toBe('audience-mismatch');
    expect(kind(ChallengeOps.verify({ ...challenge, audience: 'https://a.example' }, forA, bob.kel))).toBe('ok');
  });

  test('audience is bound by the signature (relabelled to another audience → signature-invalid)', () => {
    // setup: signed for AS A, its audience then rewritten to AS B
    const forA = respond({ ...challenge, audience: 'https://a.example' }, bob);
    // call out our method under test
    const relabelled = ChallengeOps.verify({ ...challenge, audience: 'https://b.example' }, { ...forA, audience: 'https://b.example' }, bob.kel);
    // assertions
    expect(kind(relabelled)).toBe('signature-invalid');
  });

  test('nonce is bound by the signature (replay with different nonce fails)', () => {
    // setup: signed for one nonce, relabelled to another challenge
    const r = respond(challenge, bob);
    const other: Expected = { ...challenge, nonce: 'z'.repeat(32) };
    // method under test / assertions
    expect(kind(ChallengeOps.verify(other, { ...r, nonce: other.nonce }, bob.kel))).toBe('signature-invalid');
  });

  test('signature over the bare payload (no domain tag) fails', () => {
    // setup: bob signs the canonical payload without the kerits-challenge domain field
    const unsigned = { nonce: challenge.nonce, audience: AUD, aid: bob.aid, publicKey: bob.current.publicKey as PublicKey, subject: challenge.subject };
    const bare = new TextEncoder().encode(canonical({ nonce: unsigned.nonce, aid: unsigned.aid, publicKey: unsigned.publicKey, subject: unsigned.subject }));
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, { ...unsigned, signature: signBytes(bob.current, bare) }, bob.kel))).toBe('signature-invalid');
  });

  test('supporting data is not signed: tampering kel/lineage/remotes leaves the signature valid', () => {
    // setup: bob signs a response carrying his KEL, a lineage entry and remotes
    const rotated = rotate(bob);
    const r = respond(challenge, rotated, rotated.current, {
      kel: rotated.kel, lineage: [{ aid: eve.aid, kel: eve.kel }], remotes: [{ aid: rotated.aid, kelUri: 'https://example.test/m' }],
    });
    // method under test / assertions: signed bytes cover only the challenge, so swapping supporting data verifies
    expect(ChallengeOps.signingBytes(r)).toEqual(ChallengeOps.signingBytes({ ...r, kel: undefined, lineage: undefined, remotes: undefined }));
    expect(kind(ChallengeOps.verify(challenge, { ...r, kel: bob.kel, remotes: [{ aid: eve.aid, kelUri: 'https://evil.test/m' }] }, rotated.kel))).toBe('ok');
  });

  test('a tampered included KEL is not usable: local KEL is used and the rotated key is not in it', () => {
    // setup: bob rotates and answers with his new key, including a KEL whose rotation lost its signatures
    const rotated = rotate(bob);
    const r = respond(challenge, rotated, rotated.current, { kel: rotated.kel.map((e, i) => (i === 1 ? { ...e, attachments: [] } : e)) });
    // method under test
    const resolved = ChallengeOps.resolveKels(bob.aid, { [bob.aid]: bob.kel }, ChallengeOps.includedKels(r));
    // assertions: falls back to local (sn 0), where the new key is absent
    if (!resolved.ok) throw new Error('unexpected lineage-unresolved');
    expect(resolved.value.included).toEqual([]);
    expect(kind(ChallengeOps.verify(challenge, r, resolved.value.kels[bob.aid]!, resolved.value.kels))).toBe('key-not-in-kel');
  });

  test('a valid KEL of a different AID fails AID binding', () => {
    // setup: bob's response verified against eve's (valid) KEL
    const r = respond(challenge, bob, bob.current, { kel: eve.kel });
    // method under test / assertions
    expect(kind(ChallengeOps.verify(challenge, r, eve.kel))).toBe('aid-mismatch');
    const resolved = ChallengeOps.resolveKels(bob.aid, {}, ChallengeOps.includedKels(r));
    expect(resolved.ok && resolved.value.included).toEqual([]);
  });

  test('schemas accept include flags, included kel, lineage and remotes', () => {
    // setup
    const r = respond(challenge, bob, bob.current, {
      kel: bob.kel, lineage: [{ aid: eve.aid, kel: eve.kel }, { aid: eve.aid }], remotes: [{ aid: bob.aid, kelUri: 'https://example.test/m' }],
    });
    const lineage = (n: number) => Array(n).fill({ aid: eve.aid });
    const remotes = (n: number) => Array(n).fill({ aid: bob.aid, kelUri: 'https://example.test/m' });
    // method under test / assertions
    const { audience: _aud, ...wire } = challenge;
    expect(Value.Check(ChallengeSchema, { ...wire, includeKEL: true, includeRemotes: true })).toBe(true);
    expect(Value.Check(ChallengeSchema, { ...wire, includeOOBI: true })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, r)).toBe(true);
    expect(Value.Check(ChallengeResponseSchema, { ...r, oobi: 'https://example.test/oobi' })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, kel: [{ bogus: 1 }] })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, kel: Array(1025).fill(bob.kel[0]) })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, kel: Array(1024).fill(bob.kel[0]) })).toBe(true);
    expect(Value.Check(ChallengeResponseSchema, { ...r, lineage: lineage(16) })).toBe(true);
    expect(Value.Check(ChallengeResponseSchema, { ...r, lineage: lineage(17) })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, lineage: [{ aid: eve.aid, kel: Array(1025).fill(bob.kel[0]) }] })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, remotes: remotes(17) })).toBe(true);
    expect(Value.Check(ChallengeResponseSchema, { ...r, remotes: remotes(18) })).toBe(false);
  });

  test('nonce longer than 128 chars is rejected by the schemas', () => {
    // setup
    const long = 'n'.repeat(129);
    const r = respond(challenge, bob);
    // method under test / assertions
    expect(Value.Check(ChallengeSchema, { nonce: long })).toBe(false);
    expect(Value.Check(ChallengeResponseSchema, { ...r, nonce: long })).toBe(false);
    expect(Value.Check(ChallengeSchema, { nonce: 'n'.repeat(128) })).toBe(true);
  });
});

/** Which KEL `resolveKels` picks for `aid` (ancestors are the local KELs of its delegators). */
const pick = (aid: AID, local: CESREvent[], included: CESREvent[] | undefined, ancestors: Record<string, CESREvent[]> = {}) => {
  const r = ChallengeOps.resolveKels(aid, { ...ancestors, [aid]: local }, included ? { [aid]: included } : {});
  if (r.ok) return r.value.included.includes(aid) ? 'included' : 'local';
  return r.error.kind === 'kel-forked' ? 'forked' : 'unresolved';
};

describe('ChallengeOps.resolveKels — KEL choice', () => {
  // setup: bob's KEL at sn 0, a rotation extending it, and a fork (ixn at sn 1 instead of the rot)
  const bob = incept(400);
  const rotated = rotate(bob);
  const forked = anchor(bob, []);

  test('included KEL strictly extending the local copy is used', () => {
    // method under test / assertions
    expect(pick(bob.aid, bob.kel, rotated.kel)).toBe('included');
  });

  test('included KEL is used when there is no local copy', () => {
    // method under test / assertions
    expect(pick(bob.aid, [], rotated.kel)).toBe('included');
  });

  test('forked, equal, shorter, invalid, foreign or missing included KEL falls back to local', () => {
    // setup: an included KEL with stripped signatures and one for a different AID
    const unsigned = rotated.kel.map((e) => ({ ...e, attachments: [] }));
    const eve = rotate(incept(900));
    // method under test / assertions
    expect(pick(bob.aid, rotated.kel, forked.kel)).toBe('local');
    expect(pick(bob.aid, rotated.kel, rotated.kel)).toBe('local');
    expect(pick(bob.aid, rotated.kel, bob.kel)).toBe('local');
    expect(pick(bob.aid, bob.kel, unsigned)).toBe('local');
    expect(pick(bob.aid, [], eve.kel)).toBe('local');
    expect(pick(bob.aid, bob.kel, undefined)).toBe('local');
    expect(pick(bob.aid, bob.kel, [{ bogus: true }] as never)).toBe('local');
  });

  test('equal-length included KEL replaces a local copy that fails validation', () => {
    // setup: local events match included SAIDs but lack signatures (contact sync without attachments)
    const unsignedLocal = bob.kel.map((e) => ({ ...e, attachments: [] }));
    // method under test / assertions
    expect(pick(bob.aid, unsignedLocal, bob.kel)).toBe('included');
  });

  test('delegated included KEL needs its delegator chain', () => {
    // setup: carol delegated by bob
    const { parent, child: carol } = delegate(bob, 500);
    // method under test / assertions
    expect(pick(carol.aid, [], carol.kel, { [parent.aid]: parent.kel })).toBe('included');
    expect(pick(carol.aid, [], carol.kel)).toBe('unresolved');
  });
});

describe('ChallengeOps.resolveKels', () => {
  // setup: carol is delegated by bob; carol then rotates (drt sealed by a new bob ixn)
  const bob0 = incept(600);
  const { parent: bob1, child: carol0 } = delegate(bob0, 700);
  const { parent: bob2, child: carol1 } = rotateDelegated(carol0, bob1);
  const challenge: Expected = { nonce: 'n'.repeat(32), audience: AUD };
  const r = respond(challenge, carol1, carol1.current, { kel: carol1.kel, lineage: [{ aid: bob2.aid, kel: bob2.kel }] });

  test('delegated responder with no local KELs verifies with its lineage (root-first update list)', () => {
    // method under test
    const resolved = ChallengeOps.resolveKels(carol1.aid, {}, ChallengeOps.includedKels(r));
    // assertions: both KELs come from the response; carol's drt verifies against bob's sealing ixn
    if (!resolved.ok) throw new Error('unexpected lineage-unresolved');
    expect(resolved.value.included).toEqual([bob2.aid, carol1.aid]);
    expect(kind(ChallengeOps.verify(challenge, r, resolved.value.kels[carol1.aid]!, resolved.value.kels))).toBe('ok');
  });

  test('without lineage and no local delegator KEL: lineage-unresolved', () => {
    // method under test / assertions
    const resolved = ChallengeOps.resolveKels(carol1.aid, {}, ChallengeOps.includedKels({ ...r, lineage: undefined }));
    expect(resolved.ok ? 'ok' : resolved.error).toEqual({ kind: 'lineage-unresolved', aid: bob2.aid });
  });

  test('stale local KELs are extended by the lineage; a local up-to-date delegator needs no lineage', () => {
    // method under test / assertions: local bob1/carol0 are extended by included bob2/carol1
    const stale = ChallengeOps.resolveKels(carol1.aid, { [bob1.aid]: bob1.kel, [carol0.aid]: carol0.kel }, ChallengeOps.includedKels(r));
    expect(stale.ok && stale.value.included).toEqual([bob2.aid, carol1.aid]);
    const current = ChallengeOps.resolveKels(carol1.aid, { [bob2.aid]: bob2.kel }, ChallengeOps.includedKels({ ...r, lineage: undefined }));
    expect(current.ok && current.value.included).toEqual([carol1.aid]);
  });

  test('an invalid lineage KEL is ignored: local delegator used, or lineage-unresolved when none', () => {
    // setup: bob's included KEL with its sealing ixn unsigned
    const broken = bob2.kel.map((e, i) => (i === 2 ? { ...e, attachments: [] } : e));
    const included = ChallengeOps.includedKels({ ...r, lineage: [{ aid: bob2.aid, kel: broken }] });
    // method under test / assertions
    const withLocal = ChallengeOps.resolveKels(carol1.aid, { [bob2.aid]: bob2.kel }, included);
    expect(withLocal.ok && withLocal.value.included).toEqual([carol1.aid]);
    const noLocal = ChallengeOps.resolveKels(carol1.aid, {}, included);
    expect(noLocal.ok ? 'ok' : noLocal.error.kind).toBe('lineage-unresolved');
  });

  test('a valid but stale included parent KEL (no seal for the drt) with no local copy does not verify', () => {
    // setup: lineage carries bob1 (valid, but lacks the ixn sealing carol's drt)
    const stale = respond(challenge, carol1, carol1.current, { kel: carol1.kel, lineage: [{ aid: bob1.aid, kel: bob1.kel }] });
    // method under test
    const resolved = ChallengeOps.resolveKels(carol1.aid, {}, ChallengeOps.includedKels(stale));
    // assertions: bob1 is used, but carol's KEL fails against it so none is chosen -> verify fails kel-invalid
    if (!resolved.ok) throw new Error('unexpected lineage-unresolved');
    expect(resolved.value.included).toEqual([bob1.aid]);
    expect(kind(ChallengeOps.verify(challenge, stale, resolved.value.kels[carol1.aid] ?? [], resolved.value.kels))).toBe('kel-invalid');
  });

  test('a lineage entry holding a different AID valid KEL is not used', () => {
    // setup: the parent slot is filled with eve's (valid) KEL
    const eve = incept(901);
    const foreign = respond(challenge, carol1, carol1.current, { kel: carol1.kel, lineage: [{ aid: bob2.aid, kel: eve.kel }] });
    // method under test
    const resolved = ChallengeOps.resolveKels(carol1.aid, {}, ChallengeOps.includedKels(foreign));
    // assertions: bob has no usable KEL
    expect(resolved.ok ? 'ok' : resolved.error).toEqual({ kind: 'lineage-unresolved', aid: bob2.aid });
  });

  test('forked included KEL is reported', () => {
    // setup: dave's KEL [icp, ixn@1] branching at sn 2: local anchors A, the response includes a valid anchor of B
    const c = anchor(incept(1100), []);
    const local = anchor(c, [{ i: c.aid, s: '0', d: 'EA' }]);
    const included = anchor(c, [{ i: c.aid, s: '0', d: 'EB' }]);

    // call our method under test
    const resolved = ChallengeOps.resolveKels(c.aid, { [c.aid]: local.kel }, { [c.aid]: included.kel });

    // assertions: a fork is reported, never silently the local copy
    expect(pick(c.aid, local.kel, included.kel)).toBe('forked');
    expect(resolved.ok ? 'ok' : resolved.error).toEqual({ kind: 'kel-forked', aid: c.aid, sn: 2 });
  });

  test('a malformed local KEL is local corruption, not a fork', () => {
    // setup: eric's valid included [icp, ixn@1]; the local copy's sn 1 is malformed
    const c = anchor(incept(1200), []);
    const corrupt = [c.kel[0]!, { event: { t: 'ixn' } }] as never;

    // call our method under test
    const chosen = pick(c.aid, corrupt, c.kel);
    const resolved = ChallengeOps.resolveKels(c.aid, { [c.aid]: corrupt }, { [c.aid]: c.kel });

    // assertions: falls back to local; no kel-forked
    expect(chosen).toBe('local');
    expect(resolved.ok).toBe(true);
  });

  test('garbage and self-referencing input never throws', () => {
    // method under test / assertions
    const garbage = { [carol1.aid]: [{ bogus: true }], constructor: [{ event: { t: 'dip', i: 'constructor', di: 'constructor' } }] } as never;
    expect(() => ChallengeOps.resolveKels(carol1.aid, {}, garbage)).not.toThrow();
    expect(() => ChallengeOps.resolveKels('constructor' as AID, {}, garbage)).not.toThrow();
    expect(ChallengeOps.resolveKels('constructor' as AID, {}, garbage).ok).toBe(false);
  });
});
