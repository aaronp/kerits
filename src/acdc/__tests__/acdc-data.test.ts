import { describe, expect, test } from 'bun:test';
import { ACDCData } from '../acdc-data.js';

describe('ACDCData.isACDC', () => {
  test('returns true for valid credential shape with inline attributes', () => {
    const cred = {
      v: 'ACDC10JSON000256_',
      d: 'EcredSaid123456789012345678901234567890123',
      i: 'EIssuerAid123456789012345678901234567890',
      s: 'EschemaSaid12345678901234567890123456789012',
      a: { name: 'Alice' },
    };
    expect(ACDCData.isACDC(cred)).toBe(true);
  });

  test('returns true for valid credential shape with SAID array', () => {
    const cred = {
      v: 'ACDC10JSON000256_',
      d: 'EcredSaid123456789012345678901234567890123',
      i: 'EIssuerAid123456789012345678901234567890',
      s: 'EschemaSaid12345678901234567890123456789012',
      A: ['EattrSaid12345678901234567890123456789012'],
    };
    expect(ACDCData.isACDC(cred)).toBe(true);
  });

  test('returns false for non-object', () => {
    expect(ACDCData.isACDC(null)).toBe(false);
    expect(ACDCData.isACDC('string')).toBe(false);
  });

  test('returns false for non-ACDC version string', () => {
    expect(ACDCData.isACDC({ v: 'KERI10JSON000256_', d: 'E', i: 'E', s: 'E', a: {} })).toBe(false);
  });

  test('returns false for missing required fields', () => {
    expect(ACDCData.isACDC({ v: 'ACDC10JSON000256_', d: 'E', i: 'E' })).toBe(false);
  });
});

describe('ACDCData.createProof', () => {
  test('creates proof with required fields', () => {
    const proof = ACDCData.createProof('EIssuer123' as any, 'Asig456' as any);
    expect(proof.t).toBe('Ed25519');
    expect(proof.i).toBe('EIssuer123');
    expect(proof.s).toBe('Asig456');
    expect(proof.k).toBeUndefined();
    expect(proof.dt).toBeUndefined();
  });

  test('creates proof with optional fields', () => {
    const proof = ACDCData.createProof(
      'EIssuer123' as any,
      'Asig456' as any,
      'Ekey789',
      '2025-01-15T12:00:00Z',
    );
    expect(proof.k).toBe('Ekey789');
    expect(proof.dt).toBe('2025-01-15T12:00:00Z');
  });
});

describe('ACDCData.create', () => {
  test('derives SAID for minimal credential (v, d, i, s, a)', () => {
    const result = ACDCData.create({
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq' as any,
      s: 'EschemaSaid12345678901234567890123456789012' as any,
      a: { name: 'Alice' },
    });
    expect(result.d).toHaveLength(44);
    expect((result.d as string).startsWith('E')).toBe(true);
    expect(result.v).toMatch(/^ACDC10JSON[0-9a-f]{6}_$/);
    expect(result.i).toBe('EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq');
    expect(result.s).toBe('EschemaSaid12345678901234567890123456789012');
    expect(result.a).toEqual({ name: 'Alice' });
  });

  test('derives SAID for credential with optional fields (u, ri, e, r)', () => {
    const result = ACDCData.create({
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq' as any,
      s: 'EschemaSaid12345678901234567890123456789012' as any,
      a: { name: 'Bob' },
      u: 'nonce123',
      ri: 'EregSaid12345678901234567890123456789012345' as any,
      e: { edges: true },
      r: { rules: true },
    });
    expect(result.d).toHaveLength(44);
    expect(result.v).toMatch(/^ACDC10JSON[0-9a-f]{6}_$/);
    expect(result.u).toBe('nonce123');
    expect(result.ri).toBe('EregSaid12345678901234567890123456789012345');
    expect(result.e).toEqual({ edges: true });
    expect(result.r).toEqual({ rules: true });
  });

  test('SAID is deterministic', () => {
    const params = {
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq' as any,
      s: 'EschemaSaid12345678901234567890123456789012' as any,
      a: { name: 'Alice' },
    };
    expect(ACDCData.create(params).d).toBe(ACDCData.create(params).d);
  });

  test('derives SAID for credential with v2 rd field', () => {
    const result = ACDCData.create({
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq' as any,
      s: 'EschemaSaid12345678901234567890123456789012' as any,
      a: { name: 'Charlie' },
      rd: 'EregDigest2345678901234567890123456789012345' as any,
    });
    expect(result.d).toHaveLength(44);
    expect(result.v).toMatch(/^ACDC10JSON[0-9a-f]{6}_$/);
    expect((result as any).rd).toBe('EregDigest2345678901234567890123456789012345');
  });

  test('rd and ri produce different SAIDs', () => {
    const base = {
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq' as any,
      s: 'EschemaSaid12345678901234567890123456789012' as any,
      a: { name: 'Alice' },
    };
    const withRi = ACDCData.create({ ...base, ri: 'EregSaid12345678901234567890123456789012345' as any });
    const withRd = ACDCData.create({ ...base, rd: 'EregSaid12345678901234567890123456789012345' as any });
    expect(withRi.d).not.toBe(withRd.d);
  });
});
