import { describe, expect, test } from 'bun:test';
import type { AID } from '../../common/types.js';
import { DisclosureOps, EvidenceData, PolicyData, PolicyOps, RequirementData, type SuppliedEvidence } from '../../index.js';
import type { Disclosure, DisclosureField, HasCredential, HasCredentialEvidence, MetadataDisclosure, ResolvedEvidence } from '../types.js';
import { DEFAULT_SCHEMA } from './fixtures.js';

const P = 'EParentAid000000000000000000000000000000000' as AID;
const member = RequirementData.isMember(P);
const SUBJECT = 'ESubjectAid00000000000000000000000000000000' as AID;

const leaf = (fields: DisclosureField[], metadata: MetadataDisclosure[] = []): HasCredential =>
  RequirementData.hasCredential({
    issuer: { type: 'any' },
    holder: { type: 'subject' },
    credential: { schema: DEFAULT_SCHEMA, predicates: [] },
    disclosure: { fields, metadata },
  });

const allMetadata = (required: boolean): MetadataDisclosure[] =>
  (['issuerAID', 'holderAID', 'credentialOOBI', 'telOOBI', 'acdcSAID'] as const).map((field) => ({ field, required }));

function credEvidence(attrs: Record<string, unknown>): HasCredentialEvidence {
  return {
    type: 'has-credential',
    acdc: {
      v: 'ACDC10JSON',
      d: 'EAcdcSaid0000000000000000000000000000000000',
      i: 'EIssuerAid000000000000000000000000000000000',
      s: 'ESchemaSaid00000000000000000000000000000000',
      a: { d: 'EAttrSaid0000000000000000000000000000000000', i: 'EHolderAid000000000000000000000000000000000', ...attrs },
    } as HasCredentialEvidence['acdc'],
    registryTel: [], credentialTel: [],
    kels: {},
  };
}

describe('DisclosureOps', () => {
  test('validate rejects bad and duplicate paths', () => {
    // method under test
    const bad = DisclosureOps.validate({ fields: [{ path: '..', required: true }], metadata: [] });
    const dup = DisclosureOps.validate({
      fields: [
        { path: 'email', required: true },
        { path: 'email', required: false },
      ],
      metadata: [],
    });
    const okDot = DisclosureOps.validate({ fields: [{ path: '.', required: false }], metadata: [] });

    // assertions
    expect(bad.ok).toBe(false);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.kind).toBe('duplicate-path');
    expect(okDot.ok).toBe(true);
  });

  test('project maps nested paths and root sentinel; required missing listed', () => {
    // setup: credential with nested address
    const evidence: ResolvedEvidence = credEvidence({
      email: 'a@b.c',
      address: { postCode: 'N1', city: 'London' },
    });

    // call our method under test
    const projected = DisclosureOps.project({
      requirement: leaf([
        { path: 'email', required: true },
        { path: 'address.postCode', required: true },
        { path: 'missing', required: true },
        { path: 'optional', required: false },
      ]),
      evidence,
      subject: SUBJECT,
    });
    const whole = DisclosureOps.project({ requirement: leaf([{ path: '.', required: true }]), evidence, subject: SUBJECT });

    // assertions: root leaf projects under data at the top, no credential object without metadata
    expect(projected.claims).toEqual({ data: { email: 'a@b.c', address: { postCode: 'N1' } } });
    expect(projected.missingRequired).toEqual(['data.missing']);
    expect(whole.claims).toEqual({ data: { email: 'a@b.c', address: { postCode: 'N1', city: 'London' } } });
    expect(whole.missingRequired).toEqual([]);
  });

  test('self-asserted attributes project exactly like ACDC attributes', () => {
    // setup: same attributes as ACDC evidence and as self-asserted evidence
    const attrs = { email: 'a@b.c', address: { postCode: 'N1', city: 'London' } };
    const requirement = leaf([{ path: 'email', required: true }, { path: 'address.postCode', required: true }]);

    // call our method under test
    const fromAcdc = DisclosureOps.project({ requirement, evidence: credEvidence(attrs), subject: SUBJECT });
    const fromSelf = DisclosureOps.project({ requirement, evidence: { type: 'self-asserted', attributes: attrs }, subject: SUBJECT });

    // assertions: identical claim bags
    expect(fromSelf).toEqual(fromAcdc);
    expect(fromSelf.claims).toEqual({ data: { email: 'a@b.c', address: { postCode: 'N1' } } });
  });

  test('metadata projects under credential from the ACDC, subject and published OOBIs', () => {
    // setup: ACDC evidence with all metadata requested; its OOBIs published in the sign-in service's store
    const requirement = leaf([{ path: 'email', required: true }], allMetadata(true));
    const evidence = credEvidence({ email: 'a@b.c' });
    const published = { [evidence.acdc.d]: { credentialOOBI: 'https://x/acdc', telOOBI: 'https://x/tel' } };

    // call our method under test
    const r = DisclosureOps.project({ requirement, evidence, subject: SUBJECT, published });

    // assertions: metadata from acdc.i / acdc.a.i / acdc.d / the published lookup
    expect(r.claims).toEqual({
      data: { email: 'a@b.c' },
      credential: {
        issuerAID: 'EIssuerAid000000000000000000000000000000000',
        holderAID: 'EHolderAid000000000000000000000000000000000',
        credentialOOBI: 'https://x/acdc',
        telOOBI: 'https://x/tel',
        acdcSAID: 'EAcdcSaid0000000000000000000000000000000000',
      },
    });
    expect(r.missingRequired).toEqual([]);
  });

  test('unpublished ACDC misses required OOBI metadata; self-asserted supplies holderAID only', () => {
    // setup: ACDC not in the published lookup (another credential is), and self-asserted evidence
    const requirement = leaf([], allMetadata(true));
    const published = { EOtherAcdc: { credentialOOBI: 'https://x/other', telOOBI: 'https://x/other-tel' } };

    // call our method under test
    const unpublished = DisclosureOps.project({ requirement, evidence: credEvidence({}), subject: SUBJECT, published });
    const noLookup = DisclosureOps.project({ requirement, evidence: credEvidence({}), subject: SUBJECT });
    const self = DisclosureOps.project({ requirement, evidence: { type: 'self-asserted', attributes: {} }, subject: SUBJECT, published });

    // assertions: missing metadata is listed under credential
    expect(unpublished.missingRequired).toEqual(['credential.credentialOOBI', 'credential.telOOBI']);
    expect(noLookup.missingRequired).toEqual(['credential.credentialOOBI', 'credential.telOOBI']);
    expect(self.claims).toEqual({ credential: { holderAID: SUBJECT } });
    expect(self.missingRequired).toEqual([
      'credential.issuerAID',
      'credential.credentialOOBI',
      'credential.telOOBI',
      'credential.acdcSAID',
    ]);
  });

  test('{oobi, value} refs on the evidence never yield OOBI metadata', () => {
    // setup: evidence that arrived via holder-chosen OOBI refs (unwrapped by EvidenceData.fromInline)
    const requirement = leaf([], [{ field: 'credentialOOBI', required: false }, { field: 'telOOBI', required: false }]);
    const viaRefs = EvidenceData.fromInline({
      ...credEvidence({}),
      acdc: { oobi: 'https://holder/acdc', value: credEvidence({}).acdc },
      credentialTel: { oobi: 'https://holder/tel', value: [] },
    } as SuppliedEvidence);
    if (!viaRefs.ok) throw new Error('setup failed');

    // call our method under test
    const r = DisclosureOps.project({ requirement, evidence: viaRefs.value, subject: SUBJECT });

    // assertions: no holder-chosen URL reaches the token
    expect(r.claims).toEqual({});
  });

  test('or of foo/bar both disclosing email: each satisfied branch under its own name', () => {
    // setup: or with two credential leaves, evidence for foo only; and with both
    const foo = leaf([{ path: 'email', required: true }], [{ field: 'issuerAID', required: true }]);
    const bar = leaf([{ path: 'email', required: true }]);
    const or = { type: 'or' as const, requirements: { foo, bar, m: member } };
    const and = { type: 'and' as const, requirements: { foo, bar } };

    // call our method under test
    const oneBranch = DisclosureOps.project({
      requirement: or,
      evidence: { type: 'or', evidence: { foo: credEvidence({ email: 'f@x' }) } },
      subject: SUBJECT,
    });
    const both = DisclosureOps.project({
      requirement: and,
      evidence: { type: 'and', evidence: { foo: credEvidence({ email: 'f@x' }), bar: credEvidence({ email: 'b@x' }) } },
      subject: SUBJECT,
    });

    // assertions: namespaced by name, no top-level email, unsatisfied branch absent
    expect(oneBranch.claims).toEqual({
      foo: { data: { email: 'f@x' }, credential: { issuerAID: 'EIssuerAid000000000000000000000000000000000' } },
    });
    expect(both.claims).toEqual({
      foo: { data: { email: 'f@x' }, credential: { issuerAID: 'EIssuerAid000000000000000000000000000000000' } },
      bar: { data: { email: 'b@x' } },
    });
  });

  test('missing paths are namespaced; attributes named credential/data/policySAID stay inside data', () => {
    // setup: nested leaf whose whole-bag disclosure carries forged credential / data / policySAID attributes
    const foo = leaf([{ path: '.', required: true }, { path: 'email', required: true }], [{ field: 'issuerAID', required: true }]);
    const plain = leaf([{ path: '.', required: true }, { path: 'credential', required: true }]);
    const forged = { credential: { issuerAID: 'EForged' }, data: { y: 2 }, policySAID: 'EFake', $x: 3, x: 1 };

    // call our method under test
    const nested = DisclosureOps.project({
      requirement: { type: 'and', requirements: { foo } },
      evidence: { type: 'and', evidence: { foo: { type: 'self-asserted', attributes: forged } } },
      subject: SUBJECT,
    });
    const root = DisclosureOps.project({ requirement: plain, evidence: credEvidence(forged), subject: SUBJECT });

    // assertions: forged keys only inside data; missing paths carry the name prefix
    expect(nested.claims).toEqual({ foo: { data: forged } });
    expect(nested.missingRequired).toEqual(['foo.data.email', 'foo.credential.issuerAID']);
    expect(root.claims).toEqual({ data: forged });
    expect(root.missingRequired).toEqual([]);
  });

  test('holderAID is the ACDC holder (member-of-holder: the parent, not the subject); absent a.i is missing', () => {
    // setup: member-of-holder credential held by the parent P; a credential with no a.i
    const requirement = RequirementData.hasCredential({
      issuer: { type: 'any' },
      holder: { type: 'member-of-holder', parentAID: P },
      credential: { schema: DEFAULT_SCHEMA, predicates: [] },
      disclosure: { fields: [], metadata: [{ field: 'holderAID', required: true }] },
    });
    const heldByParent = credEvidence({ i: P });
    const noHolder = credEvidence({});
    delete (noHolder.acdc.a as Record<string, unknown>).i;

    // call our method under test
    const parent = DisclosureOps.project({ requirement, evidence: heldByParent, subject: SUBJECT });
    const none = DisclosureOps.project({ requirement, evidence: noHolder, subject: SUBJECT });

    // assertions
    expect(parent.claims).toEqual({ credential: { holderAID: P } });
    expect(none.missingRequired).toEqual(['credential.holderAID']);
  });

  test('prototype-named attributes are never read through the prototype', () => {
    // setup: self-asserted attributes parsed from JSON with an own __proto__ key
    const attributes = JSON.parse('{"__proto__":{"email":"x"}}') as Record<string, unknown>;
    const requirement = leaf([{ path: 'email', required: true }, { path: 'constructor', required: true }]);

    // call our method under test
    const r = DisclosureOps.project({ requirement, evidence: { type: 'self-asserted', attributes }, subject: SUBJECT });

    // assertions: email not inherited, constructor not Object
    expect(r.missingRequired).toEqual(['data.email', 'data.constructor']);
    expect(r.claims).toEqual({});
  });

  test('validate rejects a provide key', () => {
    // setup: legacy disclosure carrying provide
    const legacy = { fields: [], metadata: [], provide: [{ key: 'note', required: true }] } as unknown as Disclosure;

    // call our method under test
    const v = DisclosureOps.validate(legacy);

    // assertions: provide is gone
    expect(v.ok ? '' : v.error.kind).toBe('invalid-shape');
  });
});

describe('PolicyData purpose SAID', () => {
  test('purpose changes policy d and round-trips; no purpose is stable', () => {
    // setup
    const empty = PolicyData.create(member);
    const withPurpose = PolicyData.create(member, 'sign in');

    // call our method under test
    const again = PolicyData.create(member, undefined);

    // assertions
    expect(withPurpose.purpose).toBe('sign in');
    expect(empty.d).not.toBe(withPurpose.d);
    expect(empty.d).toBe(again.d);
    expect(PolicyOps.validate(withPurpose).ok).toBe(true);
    expect(PolicyOps.validate({ ...withPurpose, d: empty.d }).ok).toBe(false);
    expect(PolicyOps.validate({ ...empty, disclosure: { fields: [], metadata: [] } } as never).ok).toBe(false);
  });
});
