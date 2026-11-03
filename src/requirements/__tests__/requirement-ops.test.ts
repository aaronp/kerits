import { describe, expect, test } from 'bun:test';
import type { SuppliedEvidence } from '../../index.js';
import { EvidenceData, RequirementData, RequirementOps } from '../../index.js';
import { DEFAULT_SCHEMA, incept } from './fixtures.js';

const cred = () =>
  RequirementData.hasCredential({
    issuer: { type: 'any' },
    holder: { type: 'subject' },
    credential: { schema: DEFAULT_SCHEMA, predicates: [] },
  });

describe('RequirementOps.leaves', () => {
  test('returns every leaf with its name path, in order', () => {
    // setup: and{ x: or{ a, b }, c }
    const parent = incept(1).aid;
    const a = cred();
    const b = RequirementData.isMember(parent);
    const c = cred();
    const r = RequirementData.and({ x: RequirementData.or({ a, b }), c });

    // method under test:
    const out = RequirementOps.leaves(r);

    // assertions: paths in declaration order, leaf identity preserved
    expect(out.map((l) => l.path)).toEqual([['x', 'a'], ['x', 'b'], ['c']]);
    expect(out[1]!.leaf).toBe(b);
  });

  test('a root leaf has the empty path', () => {
    // setup + method under test:
    const out = RequirementOps.leaves(cred());

    // assertions:
    expect(out.map((l) => l.path)).toEqual([[]]);
  });
});

describe('EvidenceData.at', () => {
  test('descends and/or evidence by name; undefined when absent', () => {
    // setup: and{ x: or{ b: self-asserted } }
    const leaf: SuppliedEvidence = { type: 'self-asserted', attributes: {} };
    const e: SuppliedEvidence = { type: 'and', evidence: { x: { type: 'or', evidence: { b: leaf } } } };

    // method under test + assertions:
    expect(EvidenceData.at(e, ['x', 'b'])).toBe(leaf);
    expect(EvidenceData.at(e, [])).toBe(e);
    expect(EvidenceData.at(e, ['x', 'a'])).toBeUndefined();
    expect(EvidenceData.at(e, ['x', 'b', 'z'])).toBeUndefined();
    expect(EvidenceData.at(e, ['x', '__proto__'])).toBeUndefined();
  });
});
