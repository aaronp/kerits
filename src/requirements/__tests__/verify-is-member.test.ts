import { describe, expect, test } from 'bun:test';
import { EvidenceOps, RequirementData } from '../../index.js';
import type { AID, IsMemberEvidence, ResolvedEvidence } from '../../index.js';
import { delegate, incept, rotateDelegated } from './fixtures.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');

// org → team → member (two hops)
const org0 = incept(100);
const { parent: org1, child: team0 } = delegate(org0, 200);
const { parent: team1, child: member } = delegate(team0, 300);

const evidence = (lineage: AID[], kels: Record<string, typeof org0.kel>): IsMemberEvidence => ({ type: 'is-member', lineage, kels });
const full = evidence([org1.aid, team1.aid, member.aid], { [org1.aid]: org1.kel, [team1.aid]: team1.kel, [member.aid]: member.kel });
const kinds = (r: ReturnType<typeof EvidenceOps.verify>) => (r.ok ? [] : r.error.map((f) => f.kind));

describe('EvidenceOps.verify — is-member', () => {
  test('sufficient: depth 1 and depth 2 lineages verify', () => {
    // setup: one-hop and two-hop evidence
    const oneHop = evidence([org1.aid, team0.aid], { [org1.aid]: org1.kel, [team0.aid]: team0.kel });

    // method under test
    const r1 = EvidenceOps.verify(RequirementData.isMember(org1.aid), team0.aid, oneHop, NOW);
    const r2 = EvidenceOps.verify(RequirementData.isMember(org1.aid), member.aid, full, NOW);

    // assertions
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  test('sufficient: delegated rotation (drt) sealed by parent verifies', () => {
    // setup: team rotates via drt sealed by org
    const { parent: org2, child: team2 } = rotateDelegated(team0, org1);
    const e = evidence([org2.aid, team2.aid], { [org2.aid]: org2.kel, [team2.aid]: team2.kel });

    // method under test / assertions
    expect(EvidenceOps.verify(RequirementData.isMember(org2.aid), team2.aid, e, NOW).ok).toBe(true);
  });

  test('necessary: drt the parent never sealed fails delegation-unsealed', () => {
    // setup: rotated child KEL paired with the parent KEL from before the rotation
    const { child: team2 } = rotateDelegated(team0, org1);
    const e = evidence([org1.aid, team2.aid], { [org1.aid]: org1.kel, [team2.aid]: team2.kel });

    // method under test / assertions
    expect(kinds(EvidenceOps.verify(RequirementData.isMember(org1.aid), team2.aid, e, NOW))).toContain('delegation-unsealed');
  });

  test('necessary: each element', () => {
    // setup: tampered variants of the full evidence
    const req = RequirementData.isMember(org1.aid);
    const tamperedKel = [...member.kel];
    tamperedKel[0] = { ...tamperedKel[0]!, event: { ...tamperedKel[0]!.event, k: [org0.current.publicKey] } };
    const unsealedParent = { ...full.kels, [team1.aid]: team0.kel.slice(0, 1) }; // team KEL without the ixn sealing member

    const cases: [ResolvedEvidence, AID, typeof req, string][] = [
      [evidence([team1.aid, member.aid], full.kels), member.aid, req, 'lineage-mismatch'],
      [full, team1.aid, req, 'subject-mismatch'],
      [full, member.aid, RequirementData.isMember(org1.aid, { maxDepth: 1 }), 'max-depth-exceeded'],
      [evidence(full.lineage, { [org1.aid]: org1.kel, [member.aid]: member.kel }), member.aid, req, 'kel-missing'],
      [evidence(full.lineage, { ...full.kels, [member.aid]: tamperedKel }), member.aid, req, 'kel-invalid'],
      [evidence(full.lineage, unsealedParent), member.aid, req, 'delegation-unsealed'],
      [evidence([org1.aid, team1.aid, org1.aid, member.aid], full.kels), member.aid, req, 'lineage-mismatch'],
      [evidence([org1.aid], { [org1.aid]: org1.kel }), org1.aid, req, 'lineage-mismatch'],
    ];

    // method under test / assertions
    for (const [e, subject, r, kind] of cases) expect(kinds(EvidenceOps.verify(r, subject, e, NOW))).toContain(kind);
  });

  test('necessary: KEL must belong to the lineage AID', () => {
    // setup: a genuine KEL of a different member substituted into the subject slot / an intermediate slot
    const req = RequirementData.isMember(org1.aid);
    const other = delegate(team1, 400).child;
    const sibling = delegate(org1, 500).child;
    const subst = evidence([org1.aid, team1.aid, other.aid], { ...full.kels, [other.aid]: member.kel });
    const mid = evidence(full.lineage, { ...full.kels, [team1.aid]: sibling.kel });

    // method under test / assertions
    expect(kinds(EvidenceOps.verify(req, other.aid, subst, NOW))).toContain('kel-invalid');
    expect(kinds(EvidenceOps.verify(req, member.aid, mid, NOW))).toContain('kel-invalid');
  });

  test('delegated lineage root verifies only with its ancestor KEL', () => {
    // setup: lineage root team1 is itself delegated by org1; org1 is not in the lineage
    const req = RequirementData.isMember(team1.aid);
    const e = evidence([team1.aid, member.aid], { [team1.aid]: team1.kel, [member.aid]: member.kel });

    // method under test
    const withAncestor = EvidenceOps.verify(req, member.aid, { ...e, kels: { ...e.kels, [org1.aid]: org1.kel } }, NOW);
    const without = EvidenceOps.verify(req, member.aid, e, NOW);

    // assertions
    expect(withAncestor.ok).toBe(true);
    expect(kinds(without)).toContain('kel-invalid');
  });

  test('malformed evidence never throws', () => {
    // setup: inherited-property AID and a KEL element lacking .event
    const req = RequirementData.isMember(org1.aid);
    const inherited = evidence([org1.aid, 'constructor' as AID], { [org1.aid]: org1.kel });
    const broken = evidence(full.lineage, { ...full.kels, [member.aid]: [{} as (typeof member.kel)[number]] });

    // method under test / assertions
    expect(kinds(EvidenceOps.verify(req, 'constructor' as AID, inherited, NOW))).toContain('kel-missing');
    expect(kinds(EvidenceOps.verify(req, member.aid, broken, NOW))).toContain('kel-invalid');
  });

  test('evidence of the wrong type fails type-mismatch without throwing', () => {
    // setup: and-evidence supplied for is-member
    const wrong: ResolvedEvidence = { type: 'and', evidence: {} };
    // method under test / assertions
    expect(kinds(EvidenceOps.verify(RequirementData.isMember(org1.aid), member.aid, wrong, NOW))).toEqual(['type-mismatch']);
  });
});
