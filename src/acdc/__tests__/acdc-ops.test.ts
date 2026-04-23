import { describe, expect, test } from 'bun:test';
import { ACDCOps } from '../ops.js';
import type { CredentialStatusSource } from '../types.js';
import type { SAID, AID } from '../../common/types.js';
import { SchemaData } from '../../schema/schema-data.js';
import type { JSONSchema, ACDCSchema } from '../../schema/types.js';
import { deriveSaid } from '../../common/derivation-surface.js';
import { buildACDCCredentialSurface } from '../../said/surfaces.js';

const acdcSaid = 'EcredSaid123456789012345678901234567890123' as SAID;
const rid = 'EridSaid12345678901234567890123456789012345' as SAID;

const issSrc: CredentialStatusSource = {
  acdcSaid,
  kind: 'tel-iss',
  rid,
  eventSaid: 'EissSaid12345678901234567890123456789012345' as SAID,
  index: 1,
};

const revSrc: CredentialStatusSource = {
  acdcSaid,
  kind: 'tel-rev',
  rid,
  eventSaid: 'ErevSaid12345678901234567890123456789012345' as SAID,
  index: 2,
};

const anchorSrc: CredentialStatusSource = {
  acdcSaid,
  kind: 'kel-anchor',
  issuer: 'EIssuerAid123456789012345678901234567890' as AID,
  eventSaid: 'EkelSaid12345678901234567890123456789012345' as SAID,
  seqNo: 5,
};

describe('ACDCOps.status', () => {
  test('returns unknown for empty sources', () => {
    expect(ACDCOps.status([])).toBe('unknown');
  });

  test('returns issued for ISS source', () => {
    expect(ACDCOps.status([issSrc])).toBe('issued');
  });

  test('returns revoked when REV present (revoked wins)', () => {
    expect(ACDCOps.status([issSrc, revSrc])).toBe('revoked');
  });

  test('returns unknown for only anchor sources', () => {
    expect(ACDCOps.status([anchorSrc])).toBe('unknown');
  });
});

describe('ACDCOps.evidence', () => {
  test('maps ISS source to tel-issued evidence', () => {
    const ev = ACDCOps.evidence([issSrc]);
    expect(ev).toHaveLength(1);
    expect(ev[0]!.source).toBe('tel');
    expect(ev[0]!.status).toBe('issued');
  });

  test('maps REV source to tel-revoked evidence with correlated issSaid', () => {
    const ev = ACDCOps.evidence([issSrc, revSrc]);
    const revEv = ev.find((e) => e.status === 'revoked');
    expect(revEv).toBeDefined();
    if (revEv && revEv.source === 'tel' && revEv.status === 'revoked') {
      expect(revEv.issSaid).toBe(issSrc.eventSaid);
    }
  });

  test('maps kel-anchor source to anchored evidence', () => {
    const ev = ACDCOps.evidence([anchorSrc]);
    expect(ev).toHaveLength(1);
    expect(ev[0]!.source).toBe('kel-anchor');
    expect(ev[0]!.status).toBe('anchored');
  });
});

describe('ACDCOps.extractSaids', () => {
  test('extracts unique SAIDs', () => {
    const saids = ACDCOps.extractSaids([issSrc, revSrc]);
    expect(saids).toEqual([acdcSaid]);
  });
});

describe('ACDCOps.extractUniqueRids', () => {
  test('extracts unique registry IDs from tel sources', () => {
    const rids = ACDCOps.extractUniqueRids([issSrc, revSrc, anchorSrc]);
    expect(rids).toEqual([rid]);
  });
});

describe('ACDCOps.verifySignature', () => {
  test('returns signature_invalid for bad signature', () => {
    const cred = {
      v: 'ACDC10JSON000256_',
      d: 'EcredSaid123456789012345678901234567890123',
      i: 'EIssuer',
      s: 'Eschema',
    } as any;
    const proof = { t: 'Ed25519', i: 'EIssuer', s: 'Ainvalidsig' } as any;
    const result = ACDCOps.verifySignature(cred, proof, 'Dinvalidpubkey' as any);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('signature_invalid');
  });
});

describe('ACDCOps.subjectClaims', () => {
  test('returns credential.a as-is', () => {
    const cred = { a: { d: 'said', i: 'issuer', name: 'Alice', age: 30 } } as any;
    const claims = ACDCOps.subjectClaims(cred);
    expect(claims).toEqual(cred.a);
  });
});

describe('ACDCOps.projectClaims', () => {
  const jsonSchema: JSONSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { name: { type: 'string' }, age: { type: 'number' } },
    required: ['name'],
  };
  const schema = SchemaData.create(jsonSchema);

  test('returns only keys present in schema.a.properties', () => {
    const cred = { a: { d: 'said', i: 'issuer', name: 'Alice', age: 30, extra: 'junk' } } as any;
    const claims = ACDCOps.projectClaims(cred, schema);
    expect(claims).toEqual({ name: 'Alice', age: 30 });
    expect(claims).not.toHaveProperty('extra');
    expect(claims).not.toHaveProperty('d');
  });
});

describe('ACDCOps.projectAndValidateClaims', () => {
  const jsonSchema: JSONSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { name: { type: 'string' }, age: { type: 'number' } },
    required: ['name'],
  };
  const schema = SchemaData.create(jsonSchema);

  test('returns claims and valid result', () => {
    const cred = { a: { name: 'Alice', age: 30 } } as any;
    const { claims, validation } = ACDCOps.projectAndValidateClaims(cred, schema);
    expect(claims).toEqual({ name: 'Alice', age: 30 });
    expect(validation.valid).toBe(true);
  });

  test('returns validation errors for missing required field', () => {
    const cred = { a: { age: 30 } } as any;
    const { validation } = ACDCOps.projectAndValidateClaims(cred, schema);
    expect(validation.valid).toBe(false);
  });
});

describe('ACDCOps.validateSaid', () => {
  // Helper: create a valid credential with a correctly computed SAID
  function makeCredential(attrs: Record<string, unknown> = { name: 'Alice' }) {
    const artifact: Record<string, unknown> = {
      v: '',
      d: '',
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq',
      s: 'EschemaSaid12345678901234567890123456789012',
      a: attrs,
    };
    const surface = buildACDCCredentialSurface(artifact);
    const { sealed } = deriveSaid(artifact, surface);
    return sealed;
  }

  test('returns valid for credential with correct SAID', () => {
    const cred = makeCredential();
    const result = ACDCOps.validateSaid(cred as any);
    expect(result.valid).toBe(true);
    expect(result.actual).toBe(cred.d);
    expect(result.expected).toBe(cred.d);
  });

  test('returns invalid for credential with tampered SAID', () => {
    const cred = makeCredential();
    const tampered = { ...cred, d: 'Etampered23456789012345678901234567890123' };
    const result = ACDCOps.validateSaid(tampered as any);
    expect(result.valid).toBe(false);
    expect(result.actual).toBe('Etampered23456789012345678901234567890123');
    expect(result.expected).toBe(cred.d);
  });

  test('returns invalid for credential with tampered attributes', () => {
    const cred = makeCredential();
    const tampered = { ...cred, a: { name: 'Mallory' } };
    const result = ACDCOps.validateSaid(tampered as any);
    expect(result.valid).toBe(false);
  });

  test('returns valid for credential with rd field', () => {
    const artifact: Record<string, unknown> = {
      v: '',
      d: '',
      i: 'EDP1vHcw_wc4M0MPoW1gVXEl3XEY2eJMBqhBMBCAFXMq',
      rd: 'EregDigest2345678901234567890123456789012345',
      s: 'EschemaSaid12345678901234567890123456789012',
      a: { name: 'Alice' },
    };
    const surface = buildACDCCredentialSurface(artifact);
    const { sealed } = deriveSaid(artifact, surface);
    const result = ACDCOps.validateSaid(sealed as any);
    expect(result.valid).toBe(true);
  });
});
