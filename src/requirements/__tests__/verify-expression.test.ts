import { describe, expect, test } from 'bun:test';
import { EvidenceOps, PolicyData, ProofBundleOps, RequirementData } from '../../index.js';
import type { ExpressionEvidence, IsMemberEvidence, ResolvedEvidence } from '../../index.js';
import { delegate, incept } from './fixtures.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const a0 = incept(100);
const b0 = incept(500);
const { parent: a, child: ca } = delegate(a0, 200);
const { parent: b, child: cb } = delegate(b0, 600);
// member is a delegate of `a` only
const memberOfA = RequirementData.isMember(a.aid);
const memberOfB = RequirementData.isMember(b.aid);
const evA: IsMemberEvidence = { type: 'is-member', lineage: [a.aid, ca.aid], kels: { [a.aid]: a.kel, [ca.aid]: ca.kel } };
const kA = 'a';
const kB = 'b';
const kinds = (r: ReturnType<typeof EvidenceOps.verify>) => (r.ok ? [] : r.error.map((f) => f.kind));

describe('EvidenceOps.verify — expressions', () => {
  test('sufficient: or with one proven branch', () => {
    // setup
    const r = RequirementData.or({ [kA]: memberOfA, [kB]: memberOfB });
    const e: ExpressionEvidence = { type: 'or', evidence: { [kA]: evA } };
    // method under test / assertions
    expect(EvidenceOps.verify(r, ca.aid, e, NOW).ok).toBe(true);
  });

  test('sufficient: and with all branches', () => {
    // setup: two named member requirements, both proven by the same lineage
    const r = RequirementData.and({ [kA]: memberOfA, a2: RequirementData.isMember(a.aid, { maxDepth: 2 }) });
    const keys = Object.keys(r.requirements);
    const e: ExpressionEvidence = { type: 'and', evidence: Object.fromEntries(keys.map((k) => [k, evA])) };
    // method under test / assertions
    expect(EvidenceOps.verify(r, ca.aid, e, NOW).ok).toBe(true);
  });

  test('necessary: and-incomplete, or-empty, unexpected key, nested failure path', () => {
    // setup
    const and = RequirementData.and({ [kA]: memberOfA, [kB]: memberOfB });
    const or = RequirementData.or({ [kA]: memberOfA, [kB]: memberOfB });
    const evB: ResolvedEvidence = { type: 'is-member', lineage: [b.aid, cb.aid], kels: { [b.aid]: b.kel, [cb.aid]: cb.kel } };

    // method under test
    const incomplete = EvidenceOps.verify(and, ca.aid, { type: 'and', evidence: { [kA]: evA } }, NOW);
    const empty = EvidenceOps.verify(or, ca.aid, { type: 'or', evidence: {} }, NOW);
    const unexpected = EvidenceOps.verify(or, ca.aid, { type: 'or', evidence: { [kA]: evA, Ebogus: evA } }, NOW);
    const nested = EvidenceOps.verify(or, ca.aid, { type: 'or', evidence: { [kB]: evB } }, NOW);

    // assertions
    expect(kinds(incomplete)).toContain('and-incomplete');
    expect(kinds(empty)).toContain('or-empty');
    expect(kinds(unexpected)).toContain('unexpected-evidence');
    expect(nested.ok).toBe(false);
    if (!nested.ok) expect(nested.error[0]!.path).toEqual([kB]);
  });

  test('necessary: prototype keys are unexpected evidence, not children', () => {
    // setup
    const or = RequirementData.or({ [kA]: memberOfA, [kB]: memberOfB });
    // method under test
    const r = EvidenceOps.verify(or, ca.aid, { type: 'or', evidence: { constructor: evA } }, NOW);
    // assertions
    expect(kinds(r)).toContain('unexpected-evidence');
    expect(kinds(r)).toContain('or-empty');
  });

  test('necessary: a present-but-failing or child fails the or even if another passes', () => {
    // setup
    const or = RequirementData.or({ [kA]: memberOfA, [kB]: memberOfB });
    const bad: ResolvedEvidence = { ...evA, lineage: [b.aid, cb.aid] };
    // method under test
    const r = EvidenceOps.verify(or, ca.aid, { type: 'or', evidence: { [kA]: evA, [kB]: bad } }, NOW);
    // assertions
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.every((f) => f.path[0] === kB)).toBe(true);
  });

  test('necessary: structurally malformed evidence returns failures, never throws', () => {
    // setup
    const hasCred = RequirementData.hasCredential({ schema: 'Eschema', holder: { type: 'subject' } } as never);
    // method under test
    const m = EvidenceOps.verify(memberOfA, ca.aid, { type: 'is-member' } as unknown as ResolvedEvidence, NOW);
    const c = EvidenceOps.verify(hasCred, ca.aid, { type: 'has-credential' } as unknown as ResolvedEvidence, NOW);
    // assertions
    for (const r of [m, c]) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error[0]!.kind).toBe('type-mismatch');
        expect(r.error[0]!.path).toEqual([]);
        expect(r.error[0]!.detail).toContain('malformed evidence');
      }
    }
  });
});

describe('ProofBundleOps.verify', () => {
  test('valid bundle verifies; tampered policy d fails said-mismatch', () => {
    // setup
    const policy = PolicyData.create(memberOfA);
    // method under test
    const good = ProofBundleOps.verify({ policy, subject: ca.aid, evidence: evA }, NOW);
    const bad = ProofBundleOps.verify({ policy: { ...policy, d: kB }, subject: ca.aid, evidence: evA }, NOW);
    // assertions
    expect(good.ok).toBe(true);
    expect(kinds(bad)).toContain('said-mismatch');
  });
});
