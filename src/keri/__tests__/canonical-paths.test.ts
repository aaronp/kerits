import { describe, test, expect } from 'bun:test';
import { CanonicalPaths, KERI_PREFIX } from '../../index.js';
import type { AID, SAID } from '../../index.js';
import type { ProfileAlias } from '../profile-alias.js';

const fakeAid = 'EFakeAID_000000000000000000000000000000000000000000' as AID;
const fakeSaid = 'EFakeSAID_00000000000000000000000000000000000000000' as SAID;

describe('KERI_PREFIX', () => {
  test('is the well-known KERI path prefix', () => {
    expect(KERI_PREFIX).toBe('/.well-known/keri');
  });
});

describe('CanonicalPaths', () => {
  test('kel(aid)', () => {
    expect(CanonicalPaths.kel(fakeAid)).toBe(`/.well-known/keri/aid/${fakeAid}/kel`);
  });

  test('ksn(aid)', () => {
    expect(CanonicalPaths.ksn(fakeAid)).toBe(`/.well-known/keri/aid/${fakeAid}/ksn`);
  });

  test('aidManifest(aid)', () => {
    expect(CanonicalPaths.aidManifest(fakeAid)).toBe(`/.well-known/keri/aid/${fakeAid}/manifest`);
  });

  test('oobi(aid)', () => {
    expect(CanonicalPaths.oobi(fakeAid)).toBe(`/.well-known/keri/oobi/${fakeAid}`);
  });

  test('schema(said)', () => {
    expect(CanonicalPaths.schema(fakeSaid)).toBe(`/.well-known/keri/said/${fakeSaid}/schema`);
  });

  test('acdc(said)', () => {
    expect(CanonicalPaths.acdc(fakeSaid)).toBe(`/.well-known/keri/said/${fakeSaid}/acdc`);
  });

  test('tel(rid)', () => {
    expect(CanonicalPaths.tel(fakeSaid)).toBe(`/.well-known/keri/registry/${fakeSaid}/tel`);
  });

  test('rsn(rid)', () => {
    expect(CanonicalPaths.rsn(fakeSaid)).toBe(`/.well-known/keri/registry/${fakeSaid}/rsn`);
  });

  test('event(said)', () => {
    expect(CanonicalPaths.event(fakeSaid)).toBe(`/.well-known/keri/events/${fakeSaid}/event`);
  });

  test('receipts(said)', () => {
    expect(CanonicalPaths.receipts(fakeSaid)).toBe(`/.well-known/keri/events/${fakeSaid}/receipts`);
  });

  test('profile returns correct path', () => {
    expect(CanonicalPaths.profile('ETestAID' as AID)).toBe('/.well-known/keri/aid/ETestAID/profile');
  });

  test('aliasProfile returns correct path', () => {
    expect(CanonicalPaths.aliasProfile('alice' as ProfileAlias)).toBe('/.well-known/keri/alias/alice/profile');
  });

  test('credentialMetadata returns correct path for aid + schemaSaid', () => {
    expect(CanonicalPaths.credentialMetadata(fakeAid, fakeSaid)).toBe(
      `/.well-known/keri/aid/${fakeAid}/credential-metadata/${fakeSaid}`,
    );
  });

  test('policy returns content-addressed path', () => {
    expect(CanonicalPaths.policy(fakeSaid)).toBe(`/policies/${fakeSaid}`);
  });

  test('policyAlias returns AID-namespaced slug path', () => {
    expect(CanonicalPaths.policyAlias(fakeAid, 'has-employment')).toBe(
      `/.well-known/keri/aid/${fakeAid}/policies/has-employment`,
    );
  });

  test('fullUrl strips trailing slashes', () => {
    expect(CanonicalPaths.fullUrl('https://example.com/', '/path')).toBe('https://example.com/path');
    expect(CanonicalPaths.fullUrl('https://example.com///', '/path')).toBe('https://example.com/path');
    expect(CanonicalPaths.fullUrl('https://example.com', '/path')).toBe('https://example.com/path');
  });

  test('baseUrlFromManifest strips the /.well-known/keri/... suffix', () => {
    expect(CanonicalPaths.baseUrlFromManifest('https://r2.kerits.id/.well-known/keri/aid/ETest/manifest'))
      .toBe('https://r2.kerits.id');
    expect(CanonicalPaths.baseUrlFromManifest('https://r2.kerits.id/.well-known/keri/aid/ETest/profile'))
      .toBe('https://r2.kerits.id');
  });

  test('resolveAidUrls derives all canonical URLs from a manifest URL', () => {
    // setup: manifest URL for a known AID
    const aid = 'ETestAID' as AID;
    const manifestUrl = `https://r2.kerits.id/.well-known/keri/aid/${aid}/manifest`;

    // call our method under test
    const urls = CanonicalPaths.resolveAidUrls(manifestUrl, aid);

    // assertions: all 4 canonical URLs derived from the base
    expect(urls.profileUrl).toBe(`https://r2.kerits.id/.well-known/keri/aid/${aid}/profile`);
    expect(urls.kelUrl).toBe(`https://r2.kerits.id/.well-known/keri/aid/${aid}/kel`);
    expect(urls.ksnUrl).toBe(`https://r2.kerits.id/.well-known/keri/aid/${aid}/ksn`);
    expect(urls.oobiUrl).toBe(`https://r2.kerits.id/.well-known/keri/oobi/${aid}`);
  });
});
