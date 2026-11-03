import { describe, expect, test } from 'bun:test';
import { assessTelKelAnchor, KELOps, RequirementData, RequirementOps } from '../../index.js';
import type { AID, HasCredential } from '../../index.js';
import { DEFAULT_SCHEMA, delegate, incept, issue, rotate, rotateDelegated } from './fixtures.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const issuer = incept(100);
const holder = incept(200);
const other = incept(300);
const { acdc } = issue(issuer, holder.aid, { name: 'Bob', age: 30, tags: ['a', 'b'] });

const req = (over: Partial<Omit<HasCredential, 'type'>> = {}): HasCredential =>
  RequirementData.hasCredential({
    issuer: { type: 'any-of', aids: [issuer.aid] }, holder: { type: 'subject' },
    credential: { schema: DEFAULT_SCHEMA, predicates: [{ path: 'age', op: 'gte', value: 18, fieldType: 'number' }] },
    ...over,
  });

const kinds = (r: ReturnType<typeof RequirementOps.matchCredential>) => (r.ok ? [] : r.error.map((f) => f.kind));

describe('RequirementOps.matchCredential', () => {
  test('matches a valid credential for the subject', () => {
    // method under test
    const r = RequirementOps.matchCredential(req(), acdc, holder.aid, NOW);
    // assertions
    expect(r.ok).toBe(true);
  });

  test('each acdc-side check fails with its own kind', () => {
    // setup: variations that break one check each
    const cases: [HasCredential, AID, string][] = [
      [req({ issuer: { type: 'any-of', aids: [other.aid] } }), holder.aid, 'issuer-not-allowed'],
      [req({ credential: { schema: { ...DEFAULT_SCHEMA, d: other.aid as unknown as typeof DEFAULT_SCHEMA.d }, predicates: [] } }), holder.aid, 'schema-mismatch'],
      [req({ credential: { schema: DEFAULT_SCHEMA, predicates: [{ path: 'age', op: 'gt', value: 40, fieldType: 'number' }] } }), holder.aid, 'predicate-failed'],
      [req(), other.aid, 'holder-mismatch'],
      [req({ holder: { type: 'member-of-holder', parentAID: other.aid } }), holder.aid, 'holder-mismatch'],
    ];

    // method under test / assertions
    for (const [r, subject, kind] of cases) expect(kinds(RequirementOps.matchCredential(r, acdc, subject, NOW))).toContain(kind);
  });

  test('predicate on missing field fails, array path passes if any element matches', () => {
    // setup: predicates on absent and array fields
    const missing = req({ credential: { schema: DEFAULT_SCHEMA, predicates: [{ path: 'nope', op: 'present' }] } });
    const arr = req({ credential: { schema: DEFAULT_SCHEMA, predicates: [{ path: 'tags[]', op: 'eq', value: 'b' }] } });

    // method under test / assertions
    expect(kinds(RequirementOps.matchCredential(missing, acdc, holder.aid, NOW))).toEqual(['predicate-failed']);
    expect(RequirementOps.matchCredential(arr, acdc, holder.aid, NOW).ok).toBe(true);
  });

  test('claims that break the schema fail claims-invalid', () => {
    // setup: credential missing required "name"
    const { acdc: bad } = issue(issuer, holder.aid, { age: 30 });
    // method under test / assertions
    expect(kinds(RequirementOps.matchCredential(req(), bad, holder.aid, NOW))).toContain('claims-invalid');
  });
});

describe('matchCredential never throws', () => {
  test('odd acdc.a and malformed paths yield failures', () => {
    // setup: a as string, a absent, malformed predicate paths
    const strA = { ...acdc, a: 'EcompactSaid' } as unknown as typeof acdc;
    const noA = { ...acdc, a: undefined } as unknown as typeof acdc;
    const badPath = (path: string) => req({ credential: { schema: DEFAULT_SCHEMA, predicates: [{ path, op: 'present' }] } });

    // method under test / assertions
    const s = kinds(RequirementOps.matchCredential(req(), strA, holder.aid, NOW));
    expect(s).toContain('claims-invalid');
    expect(s).toContain('predicate-failed');
    expect(kinds(RequirementOps.matchCredential(req(), noA, holder.aid, NOW))).toContain('predicate-failed');
    for (const p of ['', 'a[']) expect(kinds(RequirementOps.matchCredential(badPath(p), acdc, holder.aid, NOW))).toContain('predicate-failed');
  });
});

describe('fixtures self-check', () => {
  test('KELs validate and TEL anchors are found', () => {
    // setup: issuer issues a credential; parent delegates a child
    const { issuer: anchored, registry, iss } = issue(issuer, holder.aid, { name: 'Bob' });
    const { parent, child } = delegate(anchored, 400);
    const rotated = rotateDelegated(child, parent);

    // method under test: validate chains and find anchors
    const parentOk = KELOps.validateKelChain(rotated.parent.kel);
    const childOk = KELOps.validateKelChain(rotated.child.kel, { parentKel: rotated.parent.kel });
    const kelEvents = rotated.parent.kel.map((e) => e.event);
    const regAnchor = assessTelKelAnchor(kelEvents, registry.d);
    const issAnchor = assessTelKelAnchor(kelEvents, iss.d);

    // assertions: all valid
    expect(rotate(incept(1)).kel.length).toBe(2);
    expect(KELOps.validateKelChain(rotate(incept(1)).kel).valid).toBe(true);
    expect(parentOk.valid).toBe(true);
    expect(childOk.valid).toBe(true);
    expect(regAnchor.status).toBe('anchored');
    expect(issAnchor.status).toBe('anchored');
  });
});
