import { describe, expect, test } from 'bun:test';
import { ACDC_ONLY_METADATA, EvidenceOps, PolicyData, PolicyOps, RequirementData, TELEvents } from '../../index.js';
import type { AID, HasCredential, HasCredentialEvidence, Holder, Policy, SAID, SelfAssertedEvidence } from '../../index.js';
import { anchor, DEFAULT_SCHEMA, delegate, incept, issue, revoke } from './fixtures.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const issuer0 = incept(100);
const org0 = incept(200);
const { parent: org, child: employee } = delegate(org0, 300);
const { issuer, acdc, registry, iss } = issue(issuer0, employee.aid, { name: 'Emp', age: 30 });

const req = (holder: Holder = { type: 'subject' }): HasCredential =>
  RequirementData.hasCredential({ issuer: { type: 'any-of', aids: [issuer.aid] }, holder, credential: { schema: DEFAULT_SCHEMA, predicates: [] } });

const base: HasCredentialEvidence = {
  type: 'has-credential', acdc, registryTel: [registry], credentialTel: [iss], kels: { [issuer.aid]: issuer.kel },
};
const membership = { type: 'is-member' as const, lineage: [org.aid, employee.aid], kels: { [org.aid]: org.kel, [employee.aid]: employee.kel } };
const kinds = (r: ReturnType<typeof EvidenceOps.verify>) => (r.ok ? [] : r.error.map((f) => f.kind));

describe('EvidenceOps.verify — has-credential', () => {
  test('sufficient: subject holder', () => {
    // method under test / assertions
    expect(EvidenceOps.verify(req(), employee.aid, base, NOW).ok).toBe(true);
  });

  test('sufficient: holder-is-member and member-of-holder', () => {
    // setup: org holds a second credential; employee is org delegate
    const orgCred = issue(issuer, org.aid, { name: 'Org' });
    const orgEvidence: HasCredentialEvidence = {
      type: 'has-credential', acdc: orgCred.acdc, registryTel: [orgCred.registry], credentialTel: [orgCred.iss],
      kels: { [orgCred.issuer.aid]: orgCred.issuer.kel }, membership,
    };
    const orgReq = RequirementData.hasCredential({
      issuer: { type: 'any-of', aids: [issuer.aid] }, holder: { type: 'member-of-holder', parentAID: org.aid }, credential: { schema: DEFAULT_SCHEMA, predicates: [] },
    });

    // method under test
    const him = EvidenceOps.verify(req({ type: 'holder-is-member', parentAID: org.aid }), employee.aid, { ...base, membership }, NOW);
    const moh = EvidenceOps.verify(orgReq, employee.aid, orgEvidence, NOW);

    // assertions
    expect(him.ok).toBe(true);
    expect(moh.ok).toBe(true);
  });

  test('necessary: each element', () => {
    // setup: tampered variants
    const otherIssuer = incept(900);
    const { event: otherIss } = TELEvents.computeSaid(
      TELEvents.buildIss({ credentialSaid: 'EOther00000000000000000000000000000000000000' as SAID, registryId: registry.i as SAID, sequence: 0, datetime: '2026-01-01T00:00:00.000Z' }).unsignedEvent,
    );
    const unanchored = issue(otherIssuer, employee.aid, { name: 'X' });
    const cases: [HasCredential, AID, HasCredentialEvidence, string][] = [
      [RequirementData.hasCredential({ ...req(), issuer: { type: 'any-of', aids: [otherIssuer.aid] } }), employee.aid, base, 'issuer-not-allowed'],
      [req(), employee.aid, { ...base, acdc: { ...acdc, a: { ...acdc.a, name: 'Tampered' } } }, 'acdc-said-invalid'],
      [req(), employee.aid, { ...base, credentialTel: [otherIss] }, 'tel-mismatch'],
      [req(), employee.aid, { ...base, kels: { [issuer.aid]: issuer0.kel } }, 'tel-unanchored'],
      [req(), employee.aid, { ...base, kels: {} }, 'kel-missing'],
      [req(), org.aid, base, 'holder-mismatch'],
      [req({ type: 'holder-is-member', parentAID: org.aid }), employee.aid, base, 'membership-missing'],
      [req({ type: 'holder-is-member', parentAID: otherIssuer.aid }), employee.aid, { ...base, membership }, 'lineage-mismatch'],
      [req(), employee.aid, { ...base, registryTel: [unanchored.registry] }, 'tel-mismatch'],
    ];

    // method under test / assertions
    for (const [r, subject, e, kind] of cases) expect(kinds(EvidenceOps.verify(r, subject, e, NOW))).toContain(kind);
  });

  test('necessary: issuer KEL slot must belong to acdc.i', () => {
    // setup: a different valid controller's KEL filed under the issuer AID
    const other = incept(700);
    const e = { ...base, kels: { [issuer.aid]: other.kel } } as HasCredentialEvidence;

    // method under test
    const r = EvidenceOps.verify(req(), employee.aid, e, NOW);

    // assertions
    expect(kinds(r)).toContain('kel-invalid');
    expect(r.ok ? '' : r.error.find((f) => f.kind === 'kel-invalid')?.detail).toContain(`KEL belongs to ${other.aid}`);
  });

  test('necessary: inherited/prototype KEL key is not a KEL', () => {
    // setup: acdc.i is an inherited property name
    const e = { ...base, acdc: { ...acdc, i: 'toString' }, kels: {} } as unknown as HasCredentialEvidence;

    // method under test / assertions
    expect(kinds(EvidenceOps.verify(req(), employee.aid, e, NOW))).toContain('kel-missing');
  });

  test('necessary: forged TEL event bodies with valid anchored SAIDs are rejected', () => {
    // setup: iss body altered but d retained (anchor still matches d); same for registry
    const forgedIss = { ...iss, dt: '2030-01-01T00:00:00.000Z' };
    const forgedReg = { ...registry, b: ['DForged'] } as unknown as typeof registry;

    // method under test / assertions
    expect(kinds(EvidenceOps.verify(req(), employee.aid, { ...base, credentialTel: [forgedIss] }, NOW))).toContain('tel-mismatch');
    expect(kinds(EvidenceOps.verify(req(), employee.aid, { ...base, registryTel: [forgedReg] }, NOW))).toContain('tel-mismatch');
  });

  test('delegated issuer: verifies with its delegator KEL, kel-invalid without', () => {
    // setup: issuer is a delegate of another controller and issues to employee
    const { parent: delegator, child: dIssuer0 } = delegate(incept(1100), 1200);
    const d = issue(dIssuer0, employee.aid, { name: 'Emp' });
    const r = RequirementData.hasCredential({ issuer: { type: 'any-of', aids: [d.issuer.aid] }, holder: { type: 'subject' }, credential: { schema: DEFAULT_SCHEMA, predicates: [] } });
    const e: HasCredentialEvidence = { type: 'has-credential', acdc: d.acdc, registryTel: [d.registry], credentialTel: [d.iss], kels: { [d.issuer.aid]: d.issuer.kel } };

    // method under test
    const withAncestor = EvidenceOps.verify(r, employee.aid, { ...e, kels: { ...e.kels, [delegator.aid]: delegator.kel } }, NOW);
    const without = EvidenceOps.verify(r, employee.aid, e, NOW);

    // assertions: the delegator chain is required and sufficient
    expect(withAncestor.ok).toBe(true);
    expect(kinds(without)).toContain('kel-invalid');
  });

  test('malformed untrusted evidence fails without throwing', () => {
    // setup: iss missing ri/i; registry missing fields; garbage acdc; garbage KEL
    const { ri: _ri, ...noRi } = iss;
    const { i: _i, ...noI } = iss;
    const variants: unknown[] = [
      { ...base, credentialTel: [noRi] },
      { ...base, credentialTel: [noI] },
      { ...base, credentialTel: [{ ...iss, t: 'bis' }] },
      { ...base, credentialTel: [{ ...iss, t: 'zzz' }] },
      { ...base, registryTel: [{}] },
      { ...base, registryTel: [] },
      { ...base, credentialTel: [] },
      { ...base, registryTel: undefined },
      { ...base, credentialTel: 'nope' },
      { ...base, acdc: {} },
      { ...base, kels: { [issuer.aid]: [{}] } },
      { ...base, kels: { [issuer.aid]: 'nope' } },
    ];

    // method under test / assertions
    for (const v of variants) {
      let res: ReturnType<typeof EvidenceOps.verify> | undefined;
      expect(() => { res = EvidenceOps.verify(req(), employee.aid, v as HasCredentialEvidence, NOW); }).not.toThrow();
      expect(res?.ok).toBe(false);
    }
  });

  test('revoked: anchored rev → exactly revoked, no tel-unanchored', () => {
    // setup: issuer revokes the credential (rev anchored in KEL)
    const { issuer: afterRev, rev } = revoke(issuer, acdc, iss);
    const e = { ...base, credentialTel: [iss, rev], kels: { [issuer.aid]: afterRev.kel } };

    // method under test
    const r = EvidenceOps.verify(req(), employee.aid, e, NOW);

    // assertions: fails closed as revoked (chain itself is valid and every event anchored)
    expect(kinds(r)).toEqual(['revoked']);
    expect(kinds(r)).not.toContain('tel-unanchored');
  });

  test('revoked: issuer KEL seals a rev the supplied credential TEL omits → revoked', () => {
    // setup: issuer revokes; the holder presents the post-rev KEL but drops the rev from the TEL
    const { issuer: afterRev } = revoke(issuer, acdc, iss);
    const e = { ...base, kels: { [issuer.aid]: afterRev.kel } };

    // method under test
    const r = EvidenceOps.verify(req(), employee.aid, e, NOW);

    // assertions: a sealed credential-TEL event missing from the TEL can only be a rev
    expect(kinds(r)).toEqual(['revoked']);
  });

  test('V14: unanchored rev → tel-unanchored, not revoked', () => {
    // setup: issuer builds a rev but never seals it in its KEL
    const { rev } = revoke(issuer, acdc, iss);
    const e = { ...base, credentialTel: [iss, rev] };

    // call our method under test
    const r = EvidenceOps.verify(req(), employee.aid, e, NOW);

    // assertions: anchor is judged before status — the rev is unanchored, never "revoked"
    expect(kinds(r)).toContain('tel-unanchored');
    expect(kinds(r)).not.toContain('revoked');
  });

  test('backers unsupported: bis or brv in either lane fails closed', () => {
    // setup: a bis in the credential lane; a brv appended in the credential lane
    const seal = { i: registry.i, s: '0', d: registry.d };
    const bis = TELEvents.computeSaid(
      TELEvents.buildBis({ credentialSaid: acdc.d as SAID, issuerAid: issuer.aid, sequence: 0, registrySeal: seal, datetime: '2026-01-01T00:00:00.000Z' }).unsignedEvent,
    ).event;
    const brv = TELEvents.computeSaid(
      TELEvents.buildBrv({ credentialSaid: acdc.d as SAID, sequence: 1, priorEventSaid: iss.d as SAID, registrySeal: seal, datetime: '2026-02-01T00:00:00.000Z' }).unsignedEvent,
    ).event;

    // method under test / assertions
    for (const e of [
      { ...base, credentialTel: [bis] },
      { ...base, credentialTel: [iss, brv] },
      { ...base, registryTel: [registry, bis] },
    ] as unknown as HasCredentialEvidence[]) {
      expect(kinds(EvidenceOps.verify(req(), employee.aid, e, NOW))).toEqual(['backers-unsupported']);
    }
  });
});

describe('EvidenceOps.verify — issuer discriminant', () => {
  const selfReq = (predicates: HasCredential['credential']['predicates'] = []): HasCredential =>
    RequirementData.hasCredential({ issuer: { type: 'self-asserted' }, holder: { type: 'subject' }, credential: { schema: DEFAULT_SCHEMA, predicates } });
  const selfEv = (attributes: Record<string, unknown>): SelfAssertedEvidence => ({ type: 'self-asserted', attributes });
  const adult = [{ path: 'age', op: 'gte' as const, value: 18, fieldType: 'number' as const }];

  test('any-of: issuer in list ok, issuer not in list issuer-not-allowed', () => {
    // setup: a second issuer not in the list
    const other = incept(901);
    const notListed = RequirementData.hasCredential({ ...req(), issuer: { type: 'any-of', aids: [other.aid] } });

    // call our method under test
    const listed = EvidenceOps.verify(req(), employee.aid, base, NOW);
    const rejected = EvidenceOps.verify(notListed, employee.aid, base, NOW);

    // assertions: only listed issuers pass
    expect(listed.ok).toBe(true);
    expect(kinds(rejected)).toEqual(['issuer-not-allowed']);
  });

  test('any-of with empty aids fails PolicyOps.validate invalid-shape', () => {
    // setup: a policy whose any-of list is empty
    const policy = PolicyData.create(RequirementData.hasCredential({ ...req(), issuer: { type: 'any-of', aids: [] } }));

    // call our method under test
    const v = PolicyOps.validate(policy);

    // assertions: there is no "any issuer" option
    expect(v.ok ? '' : v.error.kind).toBe('invalid-shape');
  });

  test('unknown issuer.type fails PolicyOps.validate invalid-shape', () => {
    // setup: a policy with an unrecognised issuer variant
    const r = { ...req(), issuer: { type: 'anyone' } } as unknown as HasCredential;
    const policy = { ...PolicyData.create(req()), requirement: r } as Policy;

    // call our method under test
    const v = PolicyOps.validate(policy);

    // assertions: unknown variants reject
    expect(v.ok ? '' : v.error.kind).toBe('invalid-shape');
  });

  test('self-asserted: attributes satisfying schema and predicates ok', () => {
    // setup: self-asserted requirement with an age predicate
    const r = selfReq(adult);

    // call our method under test
    const v = EvidenceOps.verify(r, employee.aid, selfEv({ name: 'Me', age: 30 }), NOW);

    // assertions: no TEL/KEL needed
    expect(v.ok).toBe(true);
    expect(PolicyOps.validate(PolicyData.create(r)).ok).toBe(true);
  });

  test('self-asserted: schema failure claims-invalid, predicate failure predicate-failed', () => {
    // setup: missing required "name"; age under predicate threshold
    const r = selfReq(adult);

    // call our method under test
    const noName = EvidenceOps.verify(r, employee.aid, selfEv({ age: 30 }), NOW);
    const young = EvidenceOps.verify(r, employee.aid, selfEv({ name: 'Me', age: 12 }), NOW);

    // assertions: each failure reported with its own kind
    expect(kinds(noName)).toEqual(['claims-invalid']);
    expect(kinds(young)).toEqual(['predicate-failed']);
  });

  test('any-of requirement with self-asserted evidence: self-asserted-not-allowed', () => {
    // call our method under test
    const v = EvidenceOps.verify(req(), employee.aid, selfEv({ name: 'Me' }), NOW);

    // assertions: wallet cannot substitute its own values for an issued credential
    expect(kinds(v)).toEqual(['self-asserted-not-allowed']);
  });

  test('self-asserted requirement with ACDC evidence: type-mismatch', () => {
    // call our method under test
    const v = EvidenceOps.verify(selfReq(), employee.aid, base, NOW);

    // assertions
    expect(kinds(v)).toEqual(['type-mismatch']);
  });

  test('self-asserted requirement with non-subject holder fails PolicyOps.validate', () => {
    // setup: self-asserted values have no holder binding beyond the slot subject
    const r = RequirementData.hasCredential({ ...selfReq(), holder: { type: 'holder-is-member', parentAID: org.aid } });

    // call our method under test
    const v = PolicyOps.validate(PolicyData.create(r));

    // assertions
    expect(v.ok ? '' : v.error.kind).toBe('invalid-shape');
  });
});

describe('EvidenceOps.verify — issuer any', () => {
  const adult = [{ path: 'age', op: 'gte' as const, value: 18, fieldType: 'number' as const }];
  const anyReq = (
    metadata: HasCredential['disclosure']['metadata'] = [],
    predicates: HasCredential['credential']['predicates'] = [],
  ): HasCredential =>
    RequirementData.hasCredential({
      issuer: { type: 'any' }, holder: { type: 'subject' }, credential: { schema: DEFAULT_SCHEMA, predicates },
      disclosure: { fields: [], metadata },
    });
  const selfEv = (attributes: Record<string, unknown>): SelfAssertedEvidence => ({ type: 'self-asserted', attributes });
  const meta = (required: boolean) => [{ field: 'issuerAID' as const, required }];

  test('ACDC from an issuer in no list verifies', () => {
    // setup: any requirement, credential from an arbitrary issuer

    // call our method under test
    const v = EvidenceOps.verify(anyReq(), employee.aid, base, NOW);

    // assertions: issuer is not restricted
    expect(v.ok).toBe(true);
  });

  test('self-asserted values verify against schema and predicates', () => {
    // setup: age predicate
    const r = anyReq([], adult);

    // call our method under test
    const good = EvidenceOps.verify(r, employee.aid, selfEv({ name: 'Me', age: 30 }), NOW);
    const young = EvidenceOps.verify(r, employee.aid, selfEv({ name: 'Me', age: 12 }), NOW);
    const noName = EvidenceOps.verify(r, employee.aid, selfEv({ age: 30 }), NOW);

    // assertions: shape and predicates still enforced
    expect(good.ok).toBe(true);
    expect(kinds(young)).toEqual(['predicate-failed']);
    expect(kinds(noName)).toEqual(['claims-invalid']);
  });

  test('self-asserted with required ACDC-only metadata fails metadata-unavailable', () => {
    // setup: issuerAID required vs optional
    const required = anyReq(meta(true));
    const optional = anyReq(meta(false));

    // call our method under test
    const rejected = EvidenceOps.verify(required, employee.aid, selfEv({ name: 'Me' }), NOW);
    const accepted = EvidenceOps.verify(optional, employee.aid, selfEv({ name: 'Me' }), NOW);

    // assertions: rejected at verification with the field as detail; optional is fine
    expect(rejected.ok ? [] : rejected.error).toEqual([{ path: [], kind: 'metadata-unavailable', detail: 'issuerAID' }]);
    expect(accepted.ok).toBe(true);
  });

  test('every ACDC-only metadata field is rejected when required', () => {
    // setup: one requirement per ACDC-only field
    for (const field of ACDC_ONLY_METADATA) {
      // call our method under test
      const v = EvidenceOps.verify(anyReq([{ field, required: true }]), employee.aid, selfEv({ name: 'Me' }), NOW);

      // assertions
      expect(v.ok ? [] : v.error.map((f) => f.detail)).toEqual([field]);
    }
  });

  test('self-asserted issuer with required ACDC-only metadata fails even when unvalidated', () => {
    // setup: built via RequirementData, bypassing PolicyOps.validate
    const r = RequirementData.hasCredential({
      issuer: { type: 'self-asserted' }, holder: { type: 'subject' }, credential: { schema: DEFAULT_SCHEMA, predicates: [] },
      disclosure: { fields: [], metadata: meta(true) },
    });

    // call our method under test
    const v = EvidenceOps.verify(r, employee.aid, selfEv({ name: 'Me' }), NOW);

    // assertions
    expect(kinds(v)).toEqual(['metadata-unavailable']);
  });

  test('wrong evidence type is type-mismatch', () => {
    // call our method under test
    const v = EvidenceOps.verify(anyReq(), employee.aid, membership, NOW);

    // assertions
    expect(kinds(v)).toEqual(['type-mismatch']);
  });
});
