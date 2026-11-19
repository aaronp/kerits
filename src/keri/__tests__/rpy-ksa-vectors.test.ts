/**
 * Golden `rpy /ksa` vectors (packages/core/test-vectors/ksa) for the offline verifiers: `@kerits/ksn-verifier`
 * `verifyKeyStateAssessment` and the merits module's `ksn.rs` read the same bytes.
 */
import { describe, expect, test } from 'bun:test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ed25519 } from '@noble/curves/ed25519.js';
import { TestKeys } from '../../keys/test-keys.js';
import { delegate, incept, rotateDelegated } from '../../requirements/__tests__/fixtures.js';
import { assessKelHead, serviceAidOf } from '../assess-kel-head.js';
import { type KeyStateAssessment, RpyKsa } from '../rpy-ksa.js';

const VECTOR_DIR = resolve(import.meta.dir, '../../../test-vectors/ksa');
const SEED = TestKeys.iterator('ksa-vectors/service').at(0).privateKey;
const OTHER_SEED = TestKeys.iterator('ksa-vectors/other').at(0).privateKey;
const DT = new Date('2026-11-17T12:00:00.000Z');
const NOW = new Date(DT.getTime() + 60_000).toISOString();
const STALE_NOW = new Date(DT.getTime() + 400_000).toISOString(); // past the default 300s + 30s skew

type Expected = { ok: true; value: { said: string; assessment: KeyStateAssessment; signer: string } } | { ok: false; error: { kind: string; at?: string; key?: string } };
type Vector = { description: string; rpy: string; verifierKeys: string[]; now: string; expected: Expected };

const b64url = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64url');
const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
const bytesOf = (s: string): Uint8Array => new TextEncoder().encode(s);

function assessed(input: Parameters<typeof assessKelHead>[0]): { rpy: Uint8Array; assessment: KeyStateAssessment } {
  const result = assessKelHead(input);
  if (!result.ok) throw new Error(`assessKelHead refused: ${JSON.stringify(result.error)}`);
  return result.value;
}

/** The body of `rpy` with `from` replaced by `to` (same length, so the version string stays), re-signed by `seed`. */
function resigned(rpy: Uint8Array, from: string, to: string, seed: Uint8Array): Uint8Array {
  const body = text(rpy).slice(0, rpy.length - 136); // -CAB + 44 key + 88 sig
  if (from.length !== to.length || !body.includes(from)) throw new Error(`cannot replace ${from}`);
  const forged = bytesOf(body.replace(from, to));
  return RpyKsa.attach(forged, serviceAidOf(seed), ed25519.sign(forged, seed));
}

function goldenVectors(): Record<string, Vector> {
  const signer = serviceAidOf(SEED);
  const ok = ({ rpy, assessment }: { rpy: Uint8Array; assessment: KeyStateAssessment }): Expected => {
    const parsed = RpyKsa.parse(rpy);
    if (!parsed.ok) throw new Error(parsed.error);
    return { ok: true, value: { said: parsed.value.said, assessment, signer } };
  };
  const refused = (kind: string): Expected => ({ ok: false, error: { kind } });

  const alice = incept(900);
  const valid = assessed({ aid: alice.aid, kel: alice.kel, seed: SEED, now: DT });
  const parent = incept(910); // its pre-anchor KEL: the dip is not approved yet
  const d = delegate(parent, 920);
  const pendingDip = assessed({ aid: d.child.aid, kel: d.child.kel, delegatorKel: parent.kel, seed: SEED, now: DT });
  const r = rotateDelegated(d.child, d.parent);
  const pendingDrt = assessed({ aid: r.child.aid, kel: r.child.kel, delegatorKel: d.parent.kel, seed: SEED, now: DT });

  // signed by the service key, SAID-valid, but `valid` while validatedHead is the dip, not the drt head
  const notHead = RpyKsa.build({ ...pendingDrt.assessment, validation: { status: 'valid' } }, DT).body;
  // signed and SAID-valid, `valid` at the head's s/d, but validatedHead names other keys than the KSN
  const vh = valid.assessment.validatedHead!;
  const otherKeys = RpyKsa.build(
    { ...valid.assessment, validatedHead: { ...vh, k: pendingDrt.assessment.ksn.k } },
    DT,
  ).body;
  // signed and SAID-valid, `pending` on the drt, but validatedHead is the drt head itself (not before it)
  const { ksn: drtKsn } = pendingDrt.assessment;
  const atHead = RpyKsa.build(
    { ...pendingDrt.assessment, validatedHead: { s: drtKsn.s, d: drtKsn.d, k: drtKsn.k, kt: String(drtKsn.kt) } },
    DT,
  ).body;

  return {
    valid: {
      description: 'A valid KEL assessed by the pinned service key, 60s old.',
      rpy: b64url(valid.rpy),
      verifierKeys: [signer],
      now: NOW,
      expected: ok(valid),
    },
    'pending-inception': {
      description: 'A dip whose delegator anchor is not published: pending, validatedHead null.',
      rpy: b64url(pendingDip.rpy),
      verifierKeys: [signer],
      now: NOW,
      expected: ok(pendingDip),
    },
    'pending-rotation': {
      description: 'A drt whose delegator anchor is not published: pending, validatedHead the dip.',
      rpy: b64url(pendingDrt.rpy),
      verifierKeys: [signer],
      now: NOW,
      expected: ok(pendingDrt),
    },
    'untrusted-signer': {
      description: 'A valid assessment, but its signer is not pinned.',
      rpy: b64url(valid.rpy),
      verifierKeys: [serviceAidOf(OTHER_SEED)],
      now: NOW,
      expected: { ok: false, error: { kind: 'untrusted-signer', key: signer } },
    },
    stale: {
      description: 'A valid assessment 400s old (default maxAge 300s + 30s skew).',
      rpy: b64url(valid.rpy),
      verifierKeys: [signer],
      now: STALE_NOW,
      expected: { ok: false, error: { kind: 'stale', at: DT.toISOString() } },
    },
    tampered: {
      description: 'The rpy dt changed after signing.',
      rpy: b64url(bytesOf(text(valid.rpy).replace('"dt":"2026-11-17T12:00:00', '"dt":"2026-11-17T12:00:01'))),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('bad-signature'),
    },
    'unknown-status': {
      description: 'A signed assessment whose validation status is not valid/pending.',
      rpy: b64url(resigned(valid.rpy, '"status":"valid"', '"status":"vxlid"', SEED)),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('malformed'),
    },
    'unknown-outstanding-type': {
      description: 'A signed pending assessment whose outstanding type is unknown.',
      rpy: b64url(resigned(pendingDip.rpy, '"type":"delegation-approval"', '"type":"delegation-approvax"', SEED)),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('malformed'),
    },
    'valid-not-head': {
      description: 'A signed assessment saying valid while validatedHead is not the KSN head.',
      rpy: b64url(RpyKsa.attach(notHead, signer, ed25519.sign(notHead, SEED))),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('malformed'),
    },
    'pending-not-before-head': {
      description: 'A signed pending assessment whose validatedHead is the KSN head, not an earlier event.',
      rpy: b64url(RpyKsa.attach(atHead, signer, ed25519.sign(atHead, SEED))),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('malformed'),
    },
    'valid-other-keys': {
      description: 'A signed assessment saying valid while validatedHead.k is not the KSN head keys.',
      rpy: b64url(RpyKsa.attach(otherKeys, signer, ed25519.sign(otherKeys, SEED))),
      verifierKeys: [signer],
      now: NOW,
      expected: refused('malformed'),
    },
  };
}

describe('golden vectors (packages/core/test-vectors/ksa)', () => {
  const vectors = goldenVectors();

  // Regenerate with UPDATE_GOLDEN=1 (then `bun x biome format --write packages/core/test-vectors/ksa`); Ed25519 is deterministic.
  if (process.env.UPDATE_GOLDEN === '1') {
    mkdirSync(VECTOR_DIR, { recursive: true });
    for (const [name, v] of Object.entries(vectors)) writeFileSync(join(VECTOR_DIR, `${name}.json`), JSON.stringify(v));
  }

  for (const [name, v] of Object.entries(vectors)) {
    test(`${name} matches the recorded file and core parses it as recorded`, () => {
      // setup: the regenerated vector

      // call out our method under test: RpyKsa.parse on the vector bytes
      const parsed = RpyKsa.parse(new Uint8Array(Buffer.from(v.rpy, 'base64url')));

      // assertions: the file matches; core accepts the bytes iff the verdict is ok or a trust/freshness refusal
      expect(JSON.parse(readFileSync(join(VECTOR_DIR, `${name}.json`), 'utf8'))).toEqual(v);
      const kind = v.expected.ok ? undefined : v.expected.error.kind;
      expect(parsed.ok).toBe(kind === undefined || kind === 'untrusted-signer' || kind === 'stale');
      if (v.expected.ok && parsed.ok) {
        expect(parsed.value.assessment).toEqual(v.expected.value.assessment);
        expect(parsed.value.said).toBe(v.expected.value.said);
      }
    });
  }
});
