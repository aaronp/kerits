// packages/core/src/requirements/__tests__/requirement-data.test.ts
import { describe, expect, test } from 'bun:test';
import { PolicyData, PolicyOps, RequirementData, RequirementOps, SchemaData } from '../../index.js';
import type { AID, Requirement, SAID } from '../../index.js';

const P = 'EParentAid000000000000000000000000000000000' as AID;
const I = 'EIssuerAid000000000000000000000000000000000' as AID;
const schema = SchemaData.create({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties: { name: { type: 'string' } } });

const member = RequirementData.isMember(P, { maxDepth: 2 });
const cred = RequirementData.hasCredential({
  issuer: { type: 'any-of', aids: [I] }, holder: { type: 'subject' }, credential: { schema, predicates: [{ path: 'name', op: 'eq', value: 'Bob' }] },
});

describe('RequirementData / RequirementOps.validate', () => {
  test('said is stable and ignores undefined optionals', () => {
    // method under test: said
    const a = RequirementData.said({ type: 'is-member', parentAID: P });
    const b = RequirementData.said({ type: 'is-member', parentAID: P, maxDepth: undefined } as Requirement);

    // assertions: same digest
    expect(a).toBe(b);
    expect(a.startsWith('E')).toBe(true);
  });

  test('and() keys children by readable name and validates', () => {
    // setup: an and of member + credential
    const r = RequirementData.and({ member, cred });

    // call our method under test
    const v = RequirementOps.validate(r);

    // assertions: keys are the given names; valid
    expect(Object.keys(r.requirements)).toEqual(['member', 'cred']);
    expect(v.ok).toBe(true);
  });

  test('names outside [a-z][a-z0-9_-]{0,31} fail reserved-name', () => {
    // setup: uppercase, leading digit, prototype key, too long, child SAID
    const names = ['Foo', '1a', '__proto__', 'constructor-'.repeat(3), RequirementData.said(member)];

    // call our method under test
    const kinds = names.map((name) => {
      const v = RequirementOps.validate({ type: 'or', requirements: { [name]: member } });
      return v.ok ? 'ok' : v.error.kind;
    });

    // assertions
    expect(kinds).toEqual(names.map(() => 'reserved-name'));
  });

  test('`data` and `credential` are reserved child names (token namespaces)', () => {
    // setup: and/or children named like the per-credential token objects
    const names = ['data', 'credential'];

    // call our method under test
    const kinds = names.map((name) => {
      const v = RequirementOps.validate({ type: 'and', requirements: { [name]: member } });
      return v.ok ? 'ok' : v.error.kind;
    });

    // assertions: both rejected, so `kerits.<as>.data` is always attribute data
    expect(kinds).toEqual(['reserved-name', 'reserved-name']);
  });

  test('empty and, bad predicate, bad schema SAID, depth > 16 all rejected', () => {
    // setup: invalid shapes
    const empty: Requirement = { type: 'and', requirements: {} };
    const badPred = RequirementData.hasCredential({
      issuer: { type: 'any-of', aids: [I] }, holder: { type: 'subject' }, credential: { schema, predicates: [{ path: 'age', op: 'between', value: 1 }] },
    });
    const badSchema = RequirementData.hasCredential({
      issuer: { type: 'any-of', aids: [I] }, holder: { type: 'subject' }, credential: { schema: { ...schema, d: SchemaData.create({ $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', properties: { other: { type: 'string' } } }).d }, predicates: [] },
    });
    let deep: Requirement = member;
    for (let i = 0; i < 17; i++) deep = RequirementData.and({ x: deep });

    // method under test / assertions
    const kinds = [empty, badPred, badSchema, deep].map((r) => {
      const v = RequirementOps.validate(r);
      return v.ok ? 'ok' : v.error.kind;
    });
    expect(kinds).toEqual(['empty-expression', 'predicate-invalid', 'schema-said-invalid', 'too-deep']);
  });

  test('non-object input fails invalid-shape', () => {
    // method under test / assertions: untrusted JSON
    const v = RequirementOps.validate({ type: 'nope' } as unknown as Requirement);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error.kind).toBe('invalid-shape');
  });
});

describe('PolicyData / PolicyOps', () => {
  test('create computes d; tampered d fails', () => {
    // setup: a policy
    const p = PolicyData.create(member);

    // method under test: validate original and tampered
    const good = PolicyOps.validate(p);
    const bad = PolicyOps.validate({ ...p, d: RequirementData.said(cred) });

    // assertions
    expect(good.ok).toBe(true);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe('said-mismatch');
  });

  test("an empty purpose counts as none", () => {
    // call out our method under test
    const blank = PolicyData.create(member, '');

    // assertions: same policy (and SAID) as no purpose
    expect(blank).toEqual(PolicyData.create(member));
    expect('purpose' in blank).toBe(false);
  });

  test('policy d digests the whole tree: changing a named child changes d', () => {
    // setup: same name, different child
    const a = PolicyData.create(RequirementData.and({ foo: member }));
    const b = PolicyData.create(RequirementData.and({ foo: RequirementData.isMember(P, { maxDepth: 3 }) }));

    // call our method under test
    const tampered = PolicyOps.validate({ ...b, d: a.d });

    // assertions
    expect(a.d).not.toBe(b.d);
    expect(tampered.ok ? '' : tampered.error.kind).toBe('said-mismatch');
  });
});

describe('RequirementOps.validate — any issuer, names, disclosure', () => {
  const credWith = (issuer: Parameters<typeof RequirementData.hasCredential>[0]['issuer'], disclosure?: Parameters<typeof RequirementData.hasCredential>[0]['disclosure']) =>
    RequirementData.hasCredential({ issuer, holder: { type: 'subject' }, credential: { schema, predicates: [] }, disclosure });
  const kind = (r: Requirement) => {
    const v = RequirementOps.validate(r);
    return v.ok ? 'ok' : v.error.kind;
  };

  test('any issuer validates', () => {
    // method under test: validate
    expect(kind(credWith({ type: 'any' }))).toBe('ok');
  });

  test('$-prefixed requirement key is reserved-name; $ disclosure paths are valid', () => {
    // setup: a $foo child key; $ disclosure paths (values live inside data, no lookalikes possible)
    const badKey: Requirement = { type: 'and', requirements: { $foo: member } };
    const leading = credWith({ type: 'any' }, { fields: [{ path: '$x', required: true }], metadata: [] });
    const nested = credWith({ type: 'any' }, { fields: [{ path: 'a.$credential', required: true }], metadata: [] });

    // call our method under test / assertions
    expect(kind(badKey)).toBe('reserved-name');
    expect(kind(leading)).toBe('ok');
    expect(kind(nested)).toBe('ok');
  });

  test('ACDC-only metadata on self-asserted is unsatisfiable; holderAID is fine', () => {
    // setup
    const meta = (field: 'issuerAID' | 'holderAID', required: boolean) => ({ fields: [], metadata: [{ field, required }] });

    // method under test / assertions
    expect(kind(credWith({ type: 'self-asserted' }, meta('issuerAID', true)))).toBe('metadata-unsatisfiable');
    expect(kind(credWith({ type: 'self-asserted' }, meta('issuerAID', false)))).toBe('metadata-unsatisfiable');
    expect(kind(credWith({ type: 'self-asserted' }, meta('holderAID', true)))).toBe('ok');
    expect(kind(credWith({ type: 'any' }, meta('issuerAID', true)))).toBe('ok');
  });

  test('duplicate metadata field or field path is duplicate-path', () => {
    // setup
    const dupMeta = { fields: [], metadata: [{ field: 'acdcSAID' as const, required: true }, { field: 'acdcSAID' as const, required: false }] };
    const dupField = { fields: [{ path: 'a', required: true }, { path: 'a', required: false }], metadata: [] };

    // method under test / assertions
    expect(kind(credWith({ type: 'any' }, dupMeta))).toBe('duplicate-path');
    expect(kind(credWith({ type: 'any' }, dupField))).toBe('duplicate-path');
  });
});

describe('sources directive validation', () => {
  const leaf = { issuer: { type: 'any-of' as const, aids: [I] }, holder: { type: 'subject' as const }, credential: { schema, predicates: [] } };
  const kind = (requirement: unknown) => {
    const p = PolicyData.create(requirement as Requirement);
    const v = PolicyOps.validate(p);
    return v.ok ? 'ok' : v.error.kind;
  };

  test('leftover oobiRequired, empty list, unknown source and self-asserted sources are invalid-shape', () => {
    // setup: each bad leaf, plus valid has-credential and is-member directives
    const bad = [
      { ...cred, oobiRequired: true },
      RequirementData.hasCredential({ ...leaf, sources: { issuerKel: [] } }),
      { ...cred, sources: { issuerKel: ['known'] } },
      RequirementData.hasCredential({ ...leaf, issuer: { type: 'self-asserted' }, sources: { acdc: ['in-line'] } }),
      { ...member, sources: { issuerKel: ['oobi'] } },
    ];
    const good = [
      RequirementData.hasCredential({ ...leaf, sources: { issuerKel: ['oobi', 'in-line'], acdc: ['expected'] } }),
      { ...member, sources: { lineageKels: ['in-line'] } },
    ];

    // call our method under test
    const badKinds = bad.map(kind);
    const goodKinds = good.map(kind);

    // assertions
    expect(badKinds).toEqual(bad.map(() => 'invalid-shape'));
    expect(goodKinds).toEqual(['ok', 'ok']);
  });

  test('sources is inside the policy SAID; a policy without sources hashes as before', () => {
    // setup: the existing fixture policy, and the same with a directive
    const plain = PolicyData.create(RequirementData.and({ member, cred }), 'p');
    const withSources = PolicyData.create(RequirementData.and({ member, cred: { ...cred, sources: { acdc: ['in-line'] } } }), 'p');

    // call our method under test
    const tampered = PolicyOps.validate({ ...withSources, d: plain.d });

    // assertions: pinned SAID unchanged; dropping/adding sources breaks the SAID
    expect(plain.d).toBe('EM-Ksat2UhVCq4mDhS0Fny13CaAh3n8jOVLnOJ3cr1kt' as SAID);
    expect(withSources.d).not.toBe(plain.d);
    expect(tampered.ok ? 'ok' : tampered.error.kind).toBe('said-mismatch');
  });
});
