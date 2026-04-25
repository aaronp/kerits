import { describe, test, expect } from 'bun:test';
import { CanonicalPaths, KERI_PREFIX } from '../../index.js';
import type { AID, SAID } from '../../index.js';

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

  test('fullUrl strips trailing slashes', () => {
    expect(CanonicalPaths.fullUrl('https://example.com/', '/path')).toBe('https://example.com/path');
    expect(CanonicalPaths.fullUrl('https://example.com///', '/path')).toBe('https://example.com/path');
    expect(CanonicalPaths.fullUrl('https://example.com', '/path')).toBe('https://example.com/path');
  });
});
