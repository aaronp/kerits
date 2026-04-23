import { describe, expect, test } from 'bun:test';
import { TELOps } from '../ops.js';
import type { VcpEvent, VrtEvent, IssEvent, RevEvent, BisEvent, BrvEvent, TelEvent } from '../types.js';

// ── Fixtures ────────────────────────────────────────────────────────
const vcp: VcpEvent = {
  v: 'KERI10JSON000156_', t: 'vcp',
  d: 'EvcpSaid1234567890123456789012345678901234',
  i: 'EvcpSaid1234567890123456789012345678901234',
  ii: 'EIssuerAid123456789012345678901234567890' as any,
  s: '0', bt: '1',
  b: ['EBackerAid12345678901234567890123456789012' as any],
  c: [],
};

const iss: IssEvent = {
  v: 'KERI10JSON000156_', t: 'iss',
  d: 'EissSaid12345678901234567890123456789012345',
  i: 'EcredSaid123456789012345678901234567890123',
  s: '1',
  ri: 'EvcpSaid1234567890123456789012345678901234',
  dt: '2025-01-15T12:00:00Z',
};

const rev: RevEvent = {
  v: 'KERI10JSON000156_', t: 'rev',
  d: 'ErevSaid12345678901234567890123456789012345',
  i: 'EcredSaid123456789012345678901234567890123',
  s: '2', p: 'EissSaid12345678901234567890123456789012345',
  ri: 'EvcpSaid1234567890123456789012345678901234',
  dt: '2025-01-15T13:00:00Z',
};

const vrt: VrtEvent = {
  v: 'KERI10JSON000156_', t: 'vrt',
  d: 'EvrtSaid12345678901234567890123456789012345',
  i: 'EvcpSaid1234567890123456789012345678901234',
  p: 'EvcpSaid1234567890123456789012345678901234',
  s: '1', bt: '2',
  br: [],
  ba: ['ENewBacker1234567890123456789012345678901' as any],
};

const bis: BisEvent = {
  v: 'KERI10JSON000156_', t: 'bis',
  d: 'EbisSaid12345678901234567890123456789012345',
  i: 'EcredSaid223456789012345678901234567890123',
  ii: 'EIssuerAid123456789012345678901234567890' as any,
  s: '1',
  ra: {
    i: 'EvcpSaid1234567890123456789012345678901234' as any,
    s: '0',
    d: 'EvcpSaid1234567890123456789012345678901234',
  },
  dt: '2025-01-15T14:00:00Z',
};

const brv: BrvEvent = {
  v: 'KERI10JSON000156_', t: 'brv',
  d: 'EbrvSaid12345678901234567890123456789012345',
  i: 'EcredSaid223456789012345678901234567890123',
  s: '2', p: 'EbisSaid12345678901234567890123456789012345',
  ra: {
    i: 'EvcpSaid1234567890123456789012345678901234' as any,
    s: '0',
    d: 'EvcpSaid1234567890123456789012345678901234',
  },
  dt: '2025-01-15T15:00:00Z',
};

describe('TELOps.head', () => {
  test('returns undefined for empty entries', () => {
    expect(TELOps.head([])).toBeUndefined();
  });

  test('returns last event', () => {
    expect(TELOps.head([vcp, iss])).toBe(iss);
  });
});

describe('TELOps.issuerId', () => {
  test('returns VCP ii field from sequence 0', () => {
    expect(TELOps.issuerId([vcp, iss])).toBe(vcp.ii);
  });

  test('returns undefined if no VCP at sequence 0', () => {
    expect(TELOps.issuerId([iss])).toBeUndefined();
  });

  test('returns undefined for empty entries', () => {
    expect(TELOps.issuerId([])).toBeUndefined();
  });
});

describe('TELOps.credentialStatus', () => {
  // credentialStatus compares evt.i (credential SAID) to credSaid
  const credSaid = 'EcredSaid123456789012345678901234567890123';

  test('returns unknown for empty entries', () => {
    expect(TELOps.credentialStatus([], credSaid)).toBe('unknown');
  });

  test('returns issued after ISS matching credential SAID', () => {
    expect(TELOps.credentialStatus([vcp, iss], credSaid)).toBe('issued');
  });

  test('returns revoked after REV matching credential SAID', () => {
    expect(TELOps.credentialStatus([vcp, iss, rev], credSaid)).toBe('revoked');
  });

  test('returns unknown for non-matching credential', () => {
    expect(TELOps.credentialStatus([vcp, iss], 'Eunrelated000000000000000000000000000000000')).toBe('unknown');
  });

  test('returns revoked even without prior ISS in chain', () => {
    const revOnly: TelEvent[] = [vcp, { ...rev, s: '1', p: vcp.d } as RevEvent];
    expect(TELOps.credentialStatus(revOnly, credSaid)).toBe('revoked');
  });

  test('BIS marks credential as issued', () => {
    const bisSaid = 'EcredSaid223456789012345678901234567890123';
    expect(TELOps.credentialStatus([vcp, bis], bisSaid)).toBe('issued');
  });

  test('BRV marks credential as revoked', () => {
    const bisSaid = 'EcredSaid223456789012345678901234567890123';
    expect(TELOps.credentialStatus([vcp, bis, brv], bisSaid)).toBe('revoked');
  });
});

describe('TELOps.validateEvent', () => {
  test('valid VCP passes', () => {
    expect(TELOps.validateEvent(vcp).ok).toBe(true);
  });

  test('valid VRT passes', () => {
    expect(TELOps.validateEvent(vrt).ok).toBe(true);
  });

  test('valid BIS passes', () => {
    expect(TELOps.validateEvent(bis).ok).toBe(true);
  });

  test('valid BRV passes', () => {
    expect(TELOps.validateEvent(brv).ok).toBe(true);
  });

  test('rejects event with empty d field', () => {
    const bad = { ...vcp, d: '' };
    expect(TELOps.validateEvent(bad as any).ok).toBe(false);
  });
});

describe('TELOps.validateAppend', () => {
  test('valid ISS after VCP passes', () => {
    expect(TELOps.validateAppend([vcp], iss).ok).toBe(true);
  });

  test('valid VRT after VCP passes', () => {
    expect(TELOps.validateAppend([vcp], vrt).ok).toBe(true);
  });

  test('rejects wrong sequence number', () => {
    const badSeq = { ...iss, s: '5' };
    expect(TELOps.validateAppend([vcp], badSeq as IssEvent).ok).toBe(false);
  });

  test('rejects wrong prior SAID on REV', () => {
    const badPrior = { ...rev, p: 'EwrongPrior0000000000000000000000000000000', s: '1' };
    expect(TELOps.validateAppend([vcp], badPrior as RevEvent).ok).toBe(false);
  });

  test('ISS without p passes (ISS has no prior linkage)', () => {
    // ISS does not have a `p` field — prior SAID check should not apply
    expect(TELOps.validateAppend([vcp], iss).ok).toBe(true);
  });

  test('rejects VCP at non-zero position', () => {
    const secondVcp = { ...vcp, s: '1' as any, d: 'Esecond0000000000000000000000000000000000' };
    expect(TELOps.validateAppend([vcp], secondVcp as any).ok).toBe(false);
  });

  test('rejects mismatched registry ID for ISS (ri mismatch)', () => {
    const wrongRi = { ...iss, ri: 'Ewrong00000000000000000000000000000000000' };
    expect(TELOps.validateAppend([vcp], wrongRi as IssEvent).ok).toBe(false);
  });

  test('rejects mismatched registry ID for BIS (ra.i mismatch)', () => {
    const wrongRa = { ...bis, ra: { ...bis.ra, i: 'Ewrong00000000000000000000000000000000000' as any } };
    expect(TELOps.validateAppend([vcp], wrongRa as BisEvent).ok).toBe(false);
  });

  test('rejects mismatched registry ID for VRT (i mismatch)', () => {
    const wrongI = { ...vrt, i: 'Ewrong00000000000000000000000000000000000' };
    expect(TELOps.validateAppend([vcp], wrongI as VrtEvent).ok).toBe(false);
  });

  test('rejects duplicate SAID', () => {
    const dupSaid = { ...iss, d: vcp.d };
    expect(TELOps.validateAppend([vcp], dupSaid as IssEvent).ok).toBe(false);
  });

  test('rejects ISS with empty ri field', () => {
    const emptyRi = { ...iss, ri: '' };
    expect(TELOps.validateAppend([vcp], emptyRi as IssEvent).ok).toBe(false);
  });

  test('rejects VRT before VCP exists', () => {
    const vrtFirst = { ...vrt, s: '0' } as any;
    expect(TELOps.validateAppend([], vrtFirst).ok).toBe(false);
  });
});

describe('TELOps.validateChain', () => {
  test('valid chain passes', () => {
    expect(TELOps.validateChain([vcp, iss, rev]).ok).toBe(true);
  });

  test('empty chain passes', () => {
    expect(TELOps.validateChain([]).ok).toBe(true);
  });

  test('chain starting with non-VCP fails', () => {
    expect(TELOps.validateChain([iss]).ok).toBe(false);
  });
});
