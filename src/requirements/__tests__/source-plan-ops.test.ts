// packages/core/src/requirements/__tests__/source-plan-ops.test.ts
import { describe, expect, test } from 'bun:test';
import { RequirementData, SchemaData, SourcePlanOps } from '../../index.js';
import type { AID } from '../../index.js';

const I = 'EIssuerAid000000000000000000000000000000000' as AID;
const schema = SchemaData.create({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties: { name: { type: 'string' } } });
const all = { expected: true, oobi: true, inLine: true };

describe('SourcePlanOps.plan', () => {
  test('absent sources = any channel: every available channel, fallback order expected → oobi → in-line', () => {
    // setup: no directive; everything available, then only in-line

    // call our method under test
    const full = SourcePlanOps.plan(undefined, all);
    const inLineOnly = SourcePlanOps.plan(undefined, { expected: false, oobi: false, inLine: true });

    // assertions: no restriction (in-line alone still resolves); fallback order is the implementation choice
    expect(full).toEqual(['expected', 'oobi', 'in-line']);
    expect(inLineOnly).toEqual(['in-line']);
  });

  test('listed sources are tried in the policy list order, filtered to what is available', () => {
    // setup: a policy that prefers in-line over expected; one that demands an OOBI the ref lacks

    // call our method under test
    const ordered = SourcePlanOps.plan(['in-line', 'expected'], all);
    const unmet = SourcePlanOps.plan(['oobi'], { expected: true, oobi: false, inLine: true });

    // assertions: list order kept; unlisted channels never used, even when available
    expect(ordered).toEqual(['in-line', 'expected']);
    expect(unmet).toEqual([]);
  });
});

describe('SourcePlanOps.allowedAt', () => {
  test('returns the leaf directive for one artifact at a nested path', () => {
    // setup: and{a (no sources), b (issuerKel: oobi)}
    const leaf = { issuer: { type: 'any-of' as const, aids: [I] }, holder: { type: 'subject' as const }, credential: { schema, predicates: [] } };
    const r = RequirementData.and({
      a: RequirementData.hasCredential(leaf),
      b: RequirementData.hasCredential({ ...leaf, sources: { issuerKel: ['oobi'] } }),
    });

    // call our method under test
    const b = SourcePlanOps.allowedAt(r, ['b'], 'issuerKel');
    const a = SourcePlanOps.allowedAt(r, ['a'], 'issuerKel');
    const bOther = SourcePlanOps.allowedAt(r, ['b'], 'acdc');

    // assertions: only b's issuerKel is restricted
    expect(b).toEqual(['oobi']);
    expect(a).toBeUndefined();
    expect(bOther).toBeUndefined();
  });

  test('is-member carries only lineageKels', () => {
    // setup: is-member leaf with a lineage directive
    const r = { type: 'is-member' as const, parentAID: I, sources: { lineageKels: ['expected' as const] } };

    // call our method under test
    const lineage = SourcePlanOps.allowedAt(r, [], 'lineageKels');
    const issuerKel = SourcePlanOps.allowedAt(r, [], 'issuerKel');

    // assertions
    expect(lineage).toEqual(['expected']);
    expect(issuerKel).toBeUndefined();
  });
});

describe('SourcePlanOps.intersect', () => {
  test('only channels every directive allows, in the first directive order; absent means any', () => {
    // call our method under test
    const narrowed = SourcePlanOps.intersect([['in-line', 'expected'], ['expected', 'in-line', 'oobi']]);
    const disjoint = SourcePlanOps.intersect([['in-line'], ['oobi']]);
    const withAbsent = SourcePlanOps.intersect([undefined, ['oobi']]);
    const allAbsent = SourcePlanOps.intersect([undefined, undefined]);

    // assertions: empty = no channel may serve it; undefined = any channel
    expect(narrowed).toEqual(['in-line', 'expected']);
    expect(disjoint).toEqual([]);
    expect(withAbsent).toEqual(['oobi']);
    expect(allAbsent).toBeUndefined();
  });
});
