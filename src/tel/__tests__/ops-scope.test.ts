import { describe, expect, test } from 'bun:test';
import { TELOps } from '../ops.js';
import type { IssEvent, RevEvent, TelEvent, VcpEvent } from '../types.js';

// ── Fixtures ─────────────────────────────────────────────────────────

const REGISTRY_SAID = 'EvcpSaid1234567890123456789012345678901234';
const CRED_SAID = 'EcredSaid123456789012345678901234567890123';

// Registry management TEL fixtures
const vcp: VcpEvent = {
  v: 'KERI10JSON000156_', t: 'vcp',
  d: REGISTRY_SAID,
  i: REGISTRY_SAID,
  ii: 'EIssuerAid123456789012345678901234567890' as any,
  s: '0', bt: '1',
  b: ['EBackerAid12345678901234567890123456789012' as any],
  c: [],
};

// Credential TEL fixtures — ISS at sn=0, REV at sn=1
const credIss: IssEvent = {
  v: 'KERI10JSON000156_', t: 'iss',
  d: 'EissSaid00000000000000000000000000000000000',
  i: CRED_SAID,
  s: '0',
  ri: REGISTRY_SAID,
  dt: '2025-01-15T12:00:00Z',
};

const credRev: RevEvent = {
  v: 'KERI10JSON000156_', t: 'rev',
  d: 'ErevSaid00000000000000000000000000000000000',
  i: CRED_SAID,
  s: '1',
  p: 'EissSaid00000000000000000000000000000000000',
  ri: REGISTRY_SAID,
  dt: '2025-01-15T13:00:00Z',
};

// ── Registry scope (default) ─────────────────────────────────────────

describe('validateAppend — registry scope (default)', () => {
  test('VCP accepted at sn=0', () => {
    // setup: empty chain
    const result = TELOps.validateAppend([], vcp);
    // method under test: validateAppend with default scope='registry'
    // assertion: VCP genesis is valid
    expect(result.ok).toBe(true);
  });

  test('ISS rejected as genesis (no VCP)', () => {
    // setup: empty registry chain, ISS at sn=0
    const issAtZero: IssEvent = { ...credIss, s: '0' };
    // method under test: validateAppend defaults to registry scope
    const result = TELOps.validateAppend([], issAtZero);
    // assertion: registry scope requires VCP genesis
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.some((e) => e.message.includes('first event must be VCP'))).toBe(true);
  });

  test('VCP rejected at non-zero sequence', () => {
    // setup: existing VCP chain, attempt second VCP
    const vcp2: VcpEvent = { ...vcp, d: 'EvcpSaid2222222222222222222222222222222222', i: 'EvcpSaid2222222222222222222222222222222222', s: '1' as any };
    // method under test: validateAppend registry scope
    const result = TELOps.validateAppend([vcp], vcp2);
    // assertion: VCP only valid at sn=0
    expect(result.ok).toBe(false);
  });
});

// ── Credential scope ─────────────────────────────────────────────────

describe('validateAppend — credential scope', () => {
  test('ISS accepted as genesis at sn=0', () => {
    // setup: empty credential TEL
    // method under test: validateAppend with scope='credential'
    const result = TELOps.validateAppend([], credIss, 'credential');
    // assertion: ISS at sn=0 is valid credential genesis
    expect(result.ok).toBe(true);
  });

  test('REV accepted after ISS', () => {
    // setup: credential TEL with ISS at sn=0
    // method under test: validateAppend REV at sn=1
    const result = TELOps.validateAppend([credIss], credRev, 'credential');
    // assertion: REV after ISS is the valid terminal event
    expect(result.ok).toBe(true);
  });

  test('VCP rejected in credential scope', () => {
    // setup: empty credential TEL, attempt VCP genesis
    const vcpAtZero: VcpEvent = { ...vcp, s: '0' };
    // method under test: validateAppend credential scope
    const result = TELOps.validateAppend([], vcpAtZero, 'credential');
    // assertion: VCP not allowed in credential TEL
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.some((e) => e.message.includes("not allowed in a credential TEL"))).toBe(true);
  });

  test('second ISS rejected after REV (terminal)', () => {
    // setup: fully revoked credential chain [ISS, REV]
    const iss2: IssEvent = {
      ...credIss,
      d: 'EissSaid11111111111111111111111111111111111',
      s: '2',
    };
    // method under test: validateAppend after REV
    const result = TELOps.validateAppend([credIss, credRev], iss2, 'credential');
    // assertion: chain is terminal after REV
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.some((e) => e.message.includes('terminal'))).toBe(true);
  });

  test('REV rejected as genesis (no ISS)', () => {
    // setup: empty credential TEL, REV as first event
    const revAtZero: RevEvent = { ...credRev, s: '0', p: 'EissSaid00000000000000000000000000000000000' };
    // method under test: validateAppend credential scope
    const result = TELOps.validateAppend([], revAtZero, 'credential');
    // assertion: first event must be ISS
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.some((e) => e.message.includes('first event in a credential TEL must be ISS'))).toBe(true);
  });

  test('registry ID mismatch rejected', () => {
    // setup: credential TEL with ISS pointing to one registry
    const issOtherRegistry: IssEvent = {
      ...credRev,
      t: 'rev',
      d: 'ErevSaid11111111111111111111111111111111111',
      s: '1',
      ri: 'EOtherReg000000000000000000000000000000000',
      p: credIss.d,
    };
    // method under test: validateAppend credential scope
    const result = TELOps.validateAppend([credIss], issOtherRegistry, 'credential');
    // assertion: ri must match the chain's registry
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.some((e) => e.field === 'i')).toBe(true);
  });
});

describe('TELOps.lane', () => {
  test('keeps only the requested lane of an aggregate', () => {
    // setup: a registry aggregate with the vcp, a credential's iss/rev, and another credential's iss
    const other: IssEvent = { ...credIss, d: 'EotherIss000000000000000000000000000000000', i: 'EotherCred00000000000000000000000000000000' };
    const aggregate: TelEvent[] = [vcp, credIss, credRev, other];

    // call our method under test
    const registry = TELOps.lane(aggregate, { kind: 'registry', ri: REGISTRY_SAID });
    const credential = TELOps.lane(aggregate, { kind: 'credential', said: CRED_SAID });

    // assertions: the registry lane is the vcp alone; the credential lane is that credential's events alone
    expect(registry).toEqual([vcp]);
    expect(credential).toEqual([credIss, credRev]);
    expect(TELOps.lane(aggregate, { kind: 'registry', ri: 'Eunknown' })).toEqual([]);
  });
});
