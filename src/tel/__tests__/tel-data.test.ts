import { describe, expect, test } from 'bun:test';
import { TELData } from '../tel-data.js';
import type { VcpEvent, VrtEvent, IssEvent, RevEvent, BisEvent, BrvEvent, TelEvent, RSN } from '../types.js';

// ── Fixtures ────────────────────────────────────────────────────────
const vcp: VcpEvent = {
  v: 'KERI10JSON000156_',
  t: 'vcp',
  d: 'EvcpSaid1234567890123456789012345678901234',
  i: 'EvcpSaid1234567890123456789012345678901234',
  ii: 'EIssuerAid123456789012345678901234567890' as any,
  s: '0',
  bt: '1',
  b: ['EBackerAid12345678901234567890123456789012' as any],
  c: [],
};

const vrt: VrtEvent = {
  v: 'KERI10JSON000156_',
  t: 'vrt',
  d: 'EvrtSaid12345678901234567890123456789012345',
  i: 'EvcpSaid1234567890123456789012345678901234',
  p: 'EvcpSaid1234567890123456789012345678901234',
  s: '1',
  bt: '2',
  br: [],
  ba: ['ENewBacker1234567890123456789012345678901' as any],
};

const iss: IssEvent = {
  v: 'KERI10JSON000156_',
  t: 'iss',
  d: 'EissSaid12345678901234567890123456789012345',
  i: 'EcredSaid123456789012345678901234567890123',
  s: '1',
  ri: 'EvcpSaid1234567890123456789012345678901234',
  dt: '2025-01-15T12:00:00Z',
};

const rev: RevEvent = {
  v: 'KERI10JSON000156_',
  t: 'rev',
  d: 'ErevSaid12345678901234567890123456789012345',
  i: 'EcredSaid123456789012345678901234567890123',
  s: '2',
  p: 'EissSaid12345678901234567890123456789012345',
  ri: 'EvcpSaid1234567890123456789012345678901234',
  dt: '2025-01-15T13:00:00Z',
};

const bis: BisEvent = {
  v: 'KERI10JSON000156_',
  t: 'bis',
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
  v: 'KERI10JSON000156_',
  t: 'brv',
  d: 'EbrvSaid12345678901234567890123456789012345',
  i: 'EcredSaid223456789012345678901234567890123',
  s: '2',
  p: 'EbisSaid12345678901234567890123456789012345',
  ra: {
    i: 'EvcpSaid1234567890123456789012345678901234' as any,
    s: '0',
    d: 'EvcpSaid1234567890123456789012345678901234',
  },
  dt: '2025-01-15T15:00:00Z',
};

// ── Type guards ─────────────────────────────────────────────────────
describe('TELData type guards', () => {
  test('isVcp', () => {
    expect(TELData.isVcp(vcp)).toBe(true);
    expect(TELData.isVcp(iss)).toBe(false);
  });

  test('isVrt', () => {
    expect(TELData.isVrt(vrt)).toBe(true);
    expect(TELData.isVrt(vcp)).toBe(false);
  });

  test('isIss', () => {
    expect(TELData.isIss(iss)).toBe(true);
    expect(TELData.isIss(vcp)).toBe(false);
  });

  test('isRev', () => {
    expect(TELData.isRev(rev)).toBe(true);
    expect(TELData.isRev(iss)).toBe(false);
  });

  test('isBis', () => {
    expect(TELData.isBis(bis)).toBe(true);
    expect(TELData.isBis(vcp)).toBe(false);
  });

  test('isBrv', () => {
    expect(TELData.isBrv(brv)).toBe(true);
    expect(TELData.isBrv(vcp)).toBe(false);
  });

  test('isEstablishment — VCP and VRT are establishment, others are not', () => {
    expect(TELData.isEstablishment(vcp)).toBe(true);
    expect(TELData.isEstablishment(vrt)).toBe(true);
    expect(TELData.isEstablishment(iss)).toBe(false);
    expect(TELData.isEstablishment(rev)).toBe(false);
    expect(TELData.isEstablishment(bis)).toBe(false);
    expect(TELData.isEstablishment(brv)).toBe(false);
  });
});

// ── Accessors ───────────────────────────────────────────────────────
describe('TELData accessors', () => {
  test('backerList from VCP', () => {
    expect(TELData.backerList(vcp)).toEqual(vcp.b);
  });

  test('backerList from non-establishment uses RSN', () => {
    const rsn = { b: ['EFromRsn123456789012345678901234567890123' as any] } as RSN;
    expect(TELData.backerList(iss, rsn)).toEqual(rsn.b);
  });

  test('backerList from non-establishment without RSN returns empty', () => {
    expect(TELData.backerList(iss)).toEqual([]);
  });

  test('backerThreshold from VCP', () => {
    expect(TELData.backerThreshold(vcp)).toBe(1);
  });

  test('backerThreshold from VRT', () => {
    expect(TELData.backerThreshold(vrt)).toBe(2);
  });

  test('priorSaid — VRT, REV, BRV have p; VCP, ISS, BIS do not', () => {
    expect(TELData.priorSaid(vrt)).toBe(vrt.p);
    expect(TELData.priorSaid(rev)).toBe(rev.p);
    expect(TELData.priorSaid(brv)).toBe(brv.p);
    expect(TELData.priorSaid(vcp)).toBeUndefined();
    expect(TELData.priorSaid(iss)).toBeUndefined();
    expect(TELData.priorSaid(bis)).toBeUndefined();
  });

  test('credentialId — ISS/REV/BIS/BRV return i (credential SAID)', () => {
    expect(TELData.credentialId(iss)).toBe(iss.i);
    expect(TELData.credentialId(rev)).toBe(rev.i);
    expect(TELData.credentialId(bis)).toBe(bis.i);
    expect(TELData.credentialId(brv)).toBe(brv.i);
    expect(TELData.credentialId(vcp)).toBeUndefined();
    expect(TELData.credentialId(vrt)).toBeUndefined();
  });

  test('registryId — VCP/VRT use i, ISS/REV use ri, BIS/BRV use ra.i', () => {
    expect(TELData.registryId(vcp)).toBe(vcp.i);
    expect(TELData.registryId(vrt)).toBe(vrt.i);
    expect(TELData.registryId(iss)).toBe(iss.ri);
    expect(TELData.registryId(rev)).toBe(rev.ri);
    expect(TELData.registryId(bis)).toBe(bis.ra.i);
    expect(TELData.registryId(brv)).toBe(brv.ra.i);
  });

  test('sequenceNumber', () => {
    expect(TELData.sequenceNumber(vcp)).toBe(0);
    expect(TELData.sequenceNumber(iss)).toBe(1);
  });
});

// ── RSN derivation ──────────────────────────────────────────────────
describe('TELData.fromTEL', () => {
  const rid = vcp.i as any;

  test('returns undefined for empty entries', () => {
    expect(TELData.fromTEL(rid, [])).toBeUndefined();
  });

  test('returns undefined if VCP registry ID does not match rid', () => {
    const wrongRid = 'EwrongRid2345678901234567890123456789012345' as any;
    expect(TELData.fromTEL(wrongRid, [vcp])).toBeUndefined();
  });

  test('builds RSN from VCP only', () => {
    const rsn = TELData.fromTEL(rid, [vcp]);
    expect(rsn).toBeDefined();
    expect(rsn!.i).toBe(rid);
    expect(rsn!.s).toBe('0');
    // d is the RSN's own SAID (self-referential), not the last event's SAID
    expect(typeof rsn!.d).toBe('string');
    expect(rsn!.d.startsWith('E')).toBe(true);
    expect(rsn!.d).toHaveLength(44);
    expect(rsn!.et).toBe('vcp');
    expect(rsn!.bt).toBe('1');
    expect(rsn!.b).toEqual(vcp.b);
    expect(rsn!.c).toEqual([]);
  });

  test('updates head on ISS but not backer state', () => {
    const rsn = TELData.fromTEL(rid, [vcp, iss]);
    // d is the RSN's own SAID (self-referential)
    expect(rsn!.d.startsWith('E')).toBe(true);
    expect(rsn!.s).toBe('1');
    expect(rsn!.et).toBe('iss');
    // Backer state unchanged from VCP
    expect(rsn!.bt).toBe('1');
    expect(rsn!.b).toEqual(vcp.b);
  });

  test('VRT applies backer additions', () => {
    const rsn = TELData.fromTEL(rid, [vcp, vrt]);
    expect(rsn!.bt).toBe('2');
    // VRT adds ba to existing b list
    expect(rsn!.b).toEqual([...vcp.b, ...vrt.ba]);
    expect(rsn!.et).toBe('vrt');
    expect(rsn!.c).toEqual([]); // c unchanged by VRT
  });

  test('VRT applies backer removals then additions', () => {
    const vrtRemove: typeof vrt = {
      ...vrt,
      br: [...vcp.b], // remove the original backer
      ba: ['ENewBacker1234567890123456789012345678901' as any],
    };
    const rsn = TELData.fromTEL(rid, [vcp, vrtRemove]);
    // Original backer removed, new one added
    expect(rsn!.b).toEqual(['ENewBacker1234567890123456789012345678901']);
  });
});
