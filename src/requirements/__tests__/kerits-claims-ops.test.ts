import { describe, expect, test } from 'bun:test';
import {
  type AID,
  type AuthRequest,
  type DisclosureField,
  type HasCredential,
  type HasCredentialEvidence,
  type MetadataDisclosure,
  KeritsClaimsOps,
  type Policy,
  PolicyData,
  RequirementData,
  type RequestEntry,
  type SAID,
  type VerifiedAuth,
  type VerifiedEntry,
} from '../../index.js';
import { err } from '../../result.js';
import { DEFAULT_SCHEMA } from './fixtures.js';

const SUB = 'ESubject000000000000000000000000000000000000' as AID;
const OTHER = 'EOther00000000000000000000000000000000000000' as AID;
const ISSUER = 'EIssuer0000000000000000000000000000000000000' as AID;

const leafFor = (issuer: 'any-of' | 'self-asserted', fields: DisclosureField[], metadata: MetadataDisclosure[] = []): HasCredential =>
  RequirementData.hasCredential({
    issuer: issuer === 'any-of' ? { type: 'any-of', aids: [ISSUER] } : { type: 'self-asserted' },
    holder: { type: 'subject' },
    credential: { schema: DEFAULT_SCHEMA, predicates: [] },
    disclosure: { fields, metadata },
  });
const policyFor = (issuer: 'any-of' | 'self-asserted', fields: DisclosureField[], metadata: MetadataDisclosure[] = []): Policy =>
  PolicyData.create(leafFor(issuer, fields, metadata));

// ACDC evidence (projection does not verify, so a literal is enough)
const acdcEvidence = (attrs: Record<string, unknown>): HasCredentialEvidence => ({
  type: 'has-credential',
  acdc: { v: 'ACDC10JSON', d: 'EAcdc', i: ISSUER, s: 'ESchema', a: { d: 'EAttr', i: SUB, ...attrs } } as HasCredentialEvidence['acdc'],
  registryTel: [],
  credentialTel: [],
  kels: {},
});

const fieldsOf = (...paths: string[]): DisclosureField[] => paths.map((path) => ({ path, required: true }));

// self-asserted evidence: attributes supplied directly, no ACDC needed
const verifiedEntry = (as: string, policy: Policy, attributes: Record<string, unknown>, extra: Partial<VerifiedEntry> = {}): VerifiedEntry => ({
  as,
  policySaid: policy.d,
  policy,
  subject: SUB,
  evidence: { type: 'self-asserted', attributes },
  ...extra,
});

const reqEntry = (policy: Policy, as: string, extra: Partial<RequestEntry> = {}): RequestEntry => ({
  policy: policy.d,
  as,
  need: 'required',
  purpose: 'test',
  ...extra,
});

const requestOf = (entries: RequestEntry[]): AuthRequest => ({
  entries,
  nonce: 'n'.repeat(32),
  audience: 'https://rp.example',
  createdAt: '2026-10-07T00:00:00.000Z',
  expiresAt: '2026-10-08T00:00:00.000Z',
  allowTargetAid: true,
});

const authOf = (entries: VerifiedEntry[], target?: AID): VerifiedAuth => ({ entries, target, signingKeys: {} });

// setup: a location policy and a data-source policy with a url
const location = policyFor('self-asserted', fieldsOf('zipCode', 'address.postcode'));
const dataSource = policyFor('self-asserted', fieldsOf('url', 'owner'));
const membership = policyFor('self-asserted', fieldsOf('level'));

describe('KeritsClaimsOps.project', () => {
  test('alias objects, policySAIDs in entry order, sub is the sole subject', () => {
    const request = requestOf([reqEntry(location, 'location'), reqEntry(dataSource, 'data-source')]);
    const verified = authOf([
      verifiedEntry('location', location, { zipCode: '90210', address: { postcode: 'X1' } }),
      verifiedEntry('data-source', dataSource, { url: 'https://b.example', owner: 'o' }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions: dotted path nests under alias; no holder by default
    expect(r.ok && r.value.sub).toBe(SUB);
    expect(r.ok && r.value.kerits).toEqual({
      v: 2,
      policySAIDs: [location.d, dataSource.d],
      location: { policySAID: location.d, data: { zipCode: '90210', address: { postcode: 'X1' } } },
      'data-source': { policySAID: dataSource.d, data: { url: 'https://b.example', owner: 'o' } },
    });
  });

  test('target wins over subjects; holderAID metadata from self-asserted evidence is the subject', () => {
    // setup: self-asserted policy requesting holderAID
    const withHolder = policyFor('self-asserted', fieldsOf('level'), [{ field: 'holderAID', required: true }]);
    const request = requestOf([reqEntry(withHolder, 'membership')]);
    const verified = authOf([verifiedEntry('membership', withHolder, { level: 'gold' })], OTHER);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions: sub is the target; holderAID is the slot subject
    expect(r.ok && r.value.sub).toBe(OTHER);
    expect(r.ok && r.value.kerits.membership).toEqual({ policySAID: withHolder.d, data: { level: 'gold' }, credential: { holderAID: SUB } });
  });

  test('single credential: fields at kerits.<as>.data.<field>, metadata at kerits.<as>.credential', () => {
    // setup: any-of policy disclosing tier plus issuerAID
    const policy = policyFor('any-of', fieldsOf('tier'), [{ field: 'issuerAID', required: true }]);
    const request = requestOf([reqEntry(policy, 'acct')]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, authOf([verifiedEntry('acct', policy, {}, { evidence: acdcEvidence({ tier: 'pro' }) })]));

    // assertions
    expect(r.ok && r.value.kerits.acct).toEqual({ policySAID: policy.d, data: { tier: 'pro' }, credential: { issuerAID: ISSUER } });
  });

  test('or of foo/bar both disclosing email: namespaced, no top-level email, no lift from nested leaves', () => {
    // setup: or policy whose any-of leaves both disclose email; evidence for both branches
    const foo = leafFor('any-of', fieldsOf('email', 'url'));
    const bar = leafFor('any-of', fieldsOf('email'));
    const policy = PolicyData.create({ type: 'or', requirements: { foo, bar } });
    const request = requestOf([reqEntry(policy, 'src', { audienceFrom: 'foo.data.url' })]);
    const evidence = { type: 'or' as const, evidence: { foo: acdcEvidence({ email: 'f@x', url: 'https://foo.example/r' }), bar: acdcEvidence({ email: 'b@x' }) } };

    // call out our method under test
    const r = KeritsClaimsOps.project(request, authOf([verifiedEntry('src', policy, {}, { evidence })]));
    const oneBranch = KeritsClaimsOps.project(
      requestOf([reqEntry(policy, 'src')]),
      authOf([verifiedEntry('src', policy, {}, { evidence: { type: 'or', evidence: { bar: acdcEvidence({ email: 'b@x' }) } } })]),
    );

    // assertions: both emails under their own names; namespaced audienceFrom resolves; nothing lifted
    expect(r.ok && r.value.kerits.src).toEqual({
      policySAID: policy.d,
      foo: { data: { email: 'f@x', url: 'https://foo.example/r' } },
      bar: { data: { email: 'b@x' } },
    });
    expect(r.ok && r.value.topLevel).toEqual({});
    expect(r.ok && r.value.resources).toEqual([{ origin: 'https://foo.example', aliases: ['src'] }]);
    expect(oneBranch.ok && oneBranch.value.kerits.src).toEqual({ policySAID: policy.d, bar: { data: { email: 'b@x' } } });
    expect(KeritsClaimsOps.liftedKeys(policy)).toEqual([]);
  });

  test('published OOBIs project under credential; unpublished required credentialOOBI fails disclosure-missing', () => {
    // setup: policy requesting both OOBIs; a lookup that has the credential published
    const policy = policyFor('any-of', [], [{ field: 'credentialOOBI', required: true }, { field: 'telOOBI', required: true }]);
    const request = requestOf([reqEntry(policy, 'acct')]);
    const verified = authOf([verifiedEntry('acct', policy, {}, { evidence: acdcEvidence({}) })]);
    const published = { ['EAcdc' as SAID]: { credentialOOBI: 'https://store/acdc', telOOBI: 'https://store/tel' } };

    // call out our method under test
    const found = KeritsClaimsOps.project(request, verified, published);
    const missing = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(found.ok && found.value.kerits.acct).toEqual({
      policySAID: policy.d,
      credential: { credentialOOBI: 'https://store/acdc', telOOBI: 'https://store/tel' },
    });
    expect(!missing.ok && missing.error).toEqual([
      { kind: 'disclosure-missing', as: 'acct', path: 'credential.credentialOOBI' },
      { kind: 'disclosure-missing', as: 'acct', path: 'credential.telOOBI' },
    ]);
  });

  test('unsatisfied optional entry contributes nothing', () => {
    const request = requestOf([reqEntry(location, 'location'), reqEntry(membership, 'membership', { need: 'optional' })]);
    const verified = authOf([verifiedEntry('location', location, { zipCode: '1', address: { postcode: '2' } })]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(r.ok && r.value.kerits.policySAIDs).toEqual([location.d]);
    expect(r.ok && 'membership' in r.value.kerits).toBe(false);
  });

  test('multiple subjects without target fail ambiguous-subject; none fail missing-sub', () => {
    // setup: two entries with different subjects, no target
    const request = requestOf([reqEntry(membership, 'a'), reqEntry(membership, 'b')]);

    // call out our method under test
    const many = KeritsClaimsOps.project(request, authOf([
      verifiedEntry('a', membership, { level: '1' }),
      verifiedEntry('b', membership, { level: '2' }, { subject: OTHER }),
    ]));
    const none = KeritsClaimsOps.project(request, authOf([]));

    // assertions
    expect(!many.ok && many.error).toEqual([{ kind: 'ambiguous-subject' }]);
    expect(!none.ok && none.error).toEqual([{ kind: 'missing-sub' }]);
  });

  test('missing required disclosure field fails', () => {
    // setup: required field absent from the evidence
    const request = requestOf([reqEntry(membership, 'membership')]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, authOf([verifiedEntry('membership', membership, {})]));

    // assertions
    expect(!r.ok && r.error).toEqual([{ kind: 'disclosure-missing', as: 'membership', path: 'data.level' }]);
  });

  test('disclosed fields cannot forge policySAID, credential or data', () => {
    // setup: whole-bag disclosure of attributes named policySAID, credential and data
    const forge = policyFor('self-asserted', fieldsOf('.'), [{ field: 'holderAID', required: true }]);
    const plain = policyFor('self-asserted', fieldsOf('.'));
    const request = requestOf([reqEntry(forge, 'forge'), reqEntry(plain, 'plain')]);
    const attrs = { policySAID: 'EFake', credential: { holderAID: OTHER }, data: { level: 'y' }, level: 'x' };

    // call out our method under test
    const r = KeritsClaimsOps.project(request, authOf([verifiedEntry('forge', forge, attrs), verifiedEntry('plain', plain, attrs)]));

    // assertions: real SAID always; forged keys only inside data; credential absent when no metadata requested
    expect(r.ok && r.value.kerits.forge).toEqual({ policySAID: forge.d, data: attrs, credential: { holderAID: SUB } });
    expect(r.ok && r.value.kerits.plain).toEqual({ policySAID: plain.d, data: attrs });
  });

  test('OIDC keys lift to top level only for any-of issuers; self-asserted stays under alias', () => {
    const verifiedPolicy = policyFor('any-of', fieldsOf('email', 'tier'));
    const selfPolicy = policyFor('self-asserted', fieldsOf('email'));
    const request = requestOf([reqEntry(verifiedPolicy, 'acct'), reqEntry(selfPolicy, 'contact')]);
    const verified = authOf([
      verifiedEntry('acct', verifiedPolicy, { email: 'a@x.example', tier: 'pro' }),
      verifiedEntry('contact', selfPolicy, { email: 'liar@x.example' }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions: lifted keys removed from data; an emptied data object is dropped
    expect(r.ok && r.value.topLevel).toEqual({ email: 'a@x.example' });
    expect(r.ok && r.value.kerits.acct).toEqual({ policySAID: verifiedPolicy.d, data: { tier: 'pro' } });
    expect(r.ok && r.value.kerits.contact).toEqual({ policySAID: selfPolicy.d, data: { email: 'liar@x.example' } });
  });

  test('OIDC lift reads root data only: an attribute named email nested elsewhere never lifts', () => {
    // setup: any-of root credential disclosing only email; another whose data.credential.email is an attribute
    const onlyEmail = policyFor('any-of', fieldsOf('email'));
    const nestedEmail = policyFor('any-of', fieldsOf('credential'));
    const request = requestOf([reqEntry(onlyEmail, 'acct'), reqEntry(nestedEmail, 'other')]);
    const verified = authOf([
      verifiedEntry('acct', onlyEmail, { email: 'a@x.example' }),
      verifiedEntry('other', nestedEmail, { credential: { email: 'n@x.example' } }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(r.ok && r.value.topLevel).toEqual({ email: 'a@x.example' });
    expect(r.ok && r.value.kerits.acct).toEqual({ policySAID: onlyEmail.d });
    expect(r.ok && r.value.kerits.other).toEqual({ policySAID: nestedEmail.d, data: { credential: { email: 'n@x.example' } } });
  });

  test('audienceFrom + audienceIncludes build resource grants; unsatisfied includes omitted', () => {
    const request = requestOf([
      reqEntry(dataSource, 'data-source', { audienceFrom: 'data.url', audienceIncludes: ['membership', 'ghost'] }),
      reqEntry(membership, 'membership'),
      reqEntry(membership, 'ghost', { need: 'optional' }),
    ]);
    const verified = authOf([
      verifiedEntry('data-source', dataSource, { url: 'https://Bridge.example/x/', owner: 'o' }),
      verifiedEntry('membership', membership, { level: 'g' }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(r.ok && r.value.resources).toEqual([{ origin: 'https://bridge.example', aliases: ['data-source', 'membership'] }]);
  });

  test('audience builds a resource grant from the literal URL', () => {
    // setup: a literal audience entry including another satisfied alias
    const request = requestOf([
      reqEntry(membership, 'member', { audience: 'https://bridge.example/x', audienceIncludes: ['other'] }),
      reqEntry(membership, 'other'),
    ]);
    const verified = authOf([
      verifiedEntry('member', membership, { level: 'g' }),
      verifiedEntry('other', membership, { level: 'h' }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(r.ok && r.value.resources).toEqual([{ origin: 'https://bridge.example', aliases: ['member', 'other'] }]);
  });

  test('declined optional audience entry has no resource grant', () => {
    // setup: the audience entry is optional and not satisfied
    const request = requestOf([
      reqEntry(membership, 'member', { need: 'optional', audience: 'https://bridge.example' }),
      reqEntry(membership, 'other'),
    ]);
    const verified = authOf([verifiedEntry('other', membership, { level: 'h' })]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(r.ok && r.value.resources).toEqual([]);
    expect(r.ok && KeritsClaimsOps.forResource(r.value, 'https://bridge.example')).toEqual(err('invalid_target'));
  });

  test('two any-of entries lifting the same OIDC key fail oidc-conflict', () => {
    // setup: two verified-issuer entries both disclose email
    const policyA = policyFor('any-of', fieldsOf('email'));
    const policyB = policyFor('any-of', fieldsOf('email'));
    const request = requestOf([reqEntry(policyA, 'one'), reqEntry(policyB, 'two')]);
    const verified = authOf([
      verifiedEntry('one', policyA, { email: 'a@x.example' }),
      verifiedEntry('two', policyB, { email: 'b@x.example' }),
    ]);

    // call out our method under test
    const r = KeritsClaimsOps.project(request, verified);

    // assertions
    expect(!r.ok && r.error).toEqual([{ kind: 'oidc-conflict', as: 'two' }]);
  });

  test('audienceFrom missing or not a URL fails audience-invalid', () => {
    // setup: audienceFrom pointing at a non-URL value / an absent field
    const request = requestOf([reqEntry(dataSource, 'data-source', { audienceFrom: 'data.url' })]);

    // call out our method under test
    const notUrl = KeritsClaimsOps.project(request, authOf([verifiedEntry('data-source', dataSource, { url: 'nope', owner: 'o' })]));
    const absent = KeritsClaimsOps.project(
      requestOf([reqEntry(dataSource, 'data-source', { audienceFrom: 'data.repo' })]),
      authOf([verifiedEntry('data-source', dataSource, { url: 'https://b.example', owner: 'o' })]),
    );

    // assertions
    expect(!notUrl.ok && notUrl.error).toEqual([{ kind: 'audience-invalid', as: 'data-source', reason: 'not-a-url' }]);
    expect(!absent.ok && absent.error).toEqual([{ kind: 'audience-invalid', as: 'data-source', reason: 'missing' }]);
  });
});

describe('KeritsClaimsOps.forResource / base', () => {
  const build = (urls: string[]) => {
    const entries = urls.map((_, i) => reqEntry(dataSource, `src${i}`, { audienceFrom: 'data.url', ...(i === 0 ? { audienceIncludes: ['membership'] } : {}) }));
    const r = KeritsClaimsOps.project(
      requestOf([...entries, reqEntry(membership, 'membership')]),
      authOf([
        ...urls.map((url, i) => verifiedEntry(`src${i}`, dataSource, { url, owner: 'o' })),
        verifiedEntry('membership', membership, { level: 'g' }),
      ]),
    );
    if (!r.ok) throw new Error('setup failed');
    return r.value;
  };

  test('resource matches by origin and carries only its aliases', () => {
    // setup: two resources; the first also includes membership
    const grant = build(['https://a.example/p', 'https://b.example']);

    // call out our method under test
    const r = KeritsClaimsOps.forResource(grant, 'https://A.example/other/');

    // assertions
    expect(r.ok && r.value).toEqual({
      v: 2,
      policySAIDs: grant.kerits.policySAIDs,
      src0: grant.kerits.src0,
      membership: grant.kerits.membership,
    });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(['membership', 'policySAIDs', 'src0', 'v']);
  });

  test('unknown origin, invalid URL, and two aliases on one origin are invalid_target', () => {
    // setup: two aliases sharing one origin
    const grant = build(['https://a.example/1', 'https://a.example/2']);

    // call out our method under test
    const dup = KeritsClaimsOps.forResource(grant, 'https://a.example');
    const unknown = KeritsClaimsOps.forResource(grant, 'https://z.example');
    const bad = KeritsClaimsOps.forResource(grant, 'not a url');

    // assertions
    expect(!dup.ok && dup.error).toBe('invalid_target');
    expect(!unknown.ok && unknown.error).toBe('invalid_target');
    expect(!bad.ok && bad.error).toBe('invalid_target');
  });

  test('base is only v and policySAIDs', () => {
    // setup: a grant with one resource
    const grant = build(['https://a.example']);

    // call out our method under test
    const b = KeritsClaimsOps.base(grant);

    // assertions
    expect(b).toEqual({ v: 2, policySAIDs: grant.kerits.policySAIDs });
  });
});

describe('KeritsClaimsOps.liftedKeys', () => {
  test('any-of lifts the OIDC keys; self-asserted lifts none', () => {
    // setup: one policy per issuer type
    const anyOf = policyFor('any-of', fieldsOf('email'));
    const selfAsserted = policyFor('self-asserted', fieldsOf('email'));

    // call out our method under test
    const lifted = [KeritsClaimsOps.liftedKeys(anyOf), KeritsClaimsOps.liftedKeys(selfAsserted)];

    // assertions: lifted keys as alias-relative paths
    expect(lifted).toEqual([['data.email', 'data.email_verified', 'data.name', 'data.preferred_username'], []]);
  });
});
