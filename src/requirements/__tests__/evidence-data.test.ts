// packages/core/src/requirements/__tests__/evidence-data.test.ts
import { describe, expect, test } from 'bun:test';
import { EvidenceData, EvidenceOps, RequirementData } from '../../index.js';
import type { HasCredentialEvidence, SuppliedEvidence } from '../../index.js';
import { DEFAULT_SCHEMA, incept, issue } from './fixtures.js';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const issuer0 = incept(100);
const holder = incept(200);
const { issuer, acdc, registry, iss } = issue(issuer0, holder.aid, { name: 'Bob' });
const resolved: HasCredentialEvidence = { type: 'has-credential', acdc, registryTel: [registry], credentialTel: [iss], kels: { [issuer.aid]: issuer.kel } };
const req = () =>
  RequirementData.hasCredential({
    issuer: { type: 'any-of', aids: [issuer.aid] }, holder: { type: 'subject' }, credential: { schema: DEFAULT_SCHEMA, predicates: [] },
  });

describe('EvidenceData', () => {
  test('resolved evidence is a valid supplied evidence (compile-time) and fromInline round-trips', () => {
    // setup: resolved evidence used as supplied
    const supplied: SuppliedEvidence = resolved;

    // method under test:
    const back = EvidenceData.fromInline(supplied);

    // assertions:
    expect(back.ok).toBe(true);
    if (back.ok) expect(EvidenceOps.verify(req(), holder.aid, back.value, NOW).ok).toBe(true);
  });

  test('refs lists OOBI urls; fromInline fails on bare OobiRef, unwraps RequiredRef', () => {
    // setup:
    const withRefs: SuppliedEvidence = {
      ...resolved,
      acdc: { oobi: 'https://x/acdc' },
      credentialTel: { oobi: 'https://x/tel', value: [iss] },
    };
    const requiredOnly: SuppliedEvidence = { ...resolved, credentialTel: { oobi: 'https://x/tel', value: [iss] } };

    // method under test:
    const urls = EvidenceData.refs(withRefs);
    const failed = EvidenceData.fromInline(withRefs);
    const unwrapped = EvidenceData.fromInline(requiredOnly);

    // assertions:
    expect(urls.sort()).toEqual(['https://x/acdc', 'https://x/tel']);
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.error.refs).toEqual(['https://x/acdc']);
    expect(unwrapped.ok).toBe(true);
    if (unwrapped.ok) expect((unwrapped.value as HasCredentialEvidence).credentialTel).toEqual([iss]);
  });

  test('fromInline unwraps {oobi, value} refs without recording OOBI urls', () => {
    // setup: acdc and credential TEL supplied as {oobi, value}
    const viaOobi: SuppliedEvidence = {
      ...resolved,
      acdc: { oobi: 'https://x/acdc', value: acdc },
      credentialTel: { oobi: 'https://x/tel', value: [iss] },
    };

    // call our method under test
    const carried = EvidenceData.fromInline(viaOobi);
    const plain = EvidenceData.fromInline(resolved);

    // assertions: refs are transport only; the evidence is the same as inline
    expect(carried.ok && carried.value).toEqual(plain.ok && plain.value);
    expect(carried.ok && 'oobis' in carried.value).toBe(false);
  });
});
