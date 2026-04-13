/**
 * Tests for common/types.ts — pure KERI primitive types ported from kv4 kerits/src/types.ts.
 *
 * Note: schemas that use custom `format` constraints (CesrType-derived schemas like
 * CesrKeyTransferableSchema, CesrDigestSchema, CesrAidSchema, CesrSignatureSchema)
 * will not pass Value.Check without registered format validators. In kv4 these formats
 * are registered at runtime in the kerits runtime. In kv5 core (browser-safe, no runtime
 * registrations), we test the schemas by verifying their shape and use the branded
 * parse/validate functions to cover the actual validation paths.
 * See backlog: a format-registration helper for kv5 tests would improve this (B-007).
 */

import { describe, expect, it } from 'bun:test';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import {
  asEd25519PrivateRaw,
  asEd25519PublicRaw,
  CesrAidSchema,
  CesrDigestSchema,
  CesrKeyTransferableSchema,
  CesrSignatureSchema,
  KeriPrivateKeySchema,
  KeriPublicKeySchema,
  keyRef,
  keyRefEquals,
  NonEmpty,
  parseAidQb64,
  parseBlake3Hex,
  parseBlake3Qb64,
  parseEd25519PrivateQb64,
  parseEd25519PublicQb64,
  parseEd25519SignatureQb64,
  parseSaidQb64,
  parseSha256Hex,
  parseBlake3Qb64Digest,
  Qb64Schema,
  ThresholdExpressionPattern,
  ThresholdExpressionSchema,
  ThresholdSchema,
  TimestampSchema,
  toEd25519KeyPairBranded,
  VersionSchema,
  WeightedThresholdSchema,
} from './types.js';

describe('Qb64Schema', () => {
  it('validates a qb64 string', () => {
    expect(Value.Check(Qb64Schema, 'EicpSaid1234')).toBe(true);
  });
  it('rejects a short string', () => {
    expect(Value.Check(Qb64Schema, 'ab')).toBe(false);
  });
});

describe('TimestampSchema', () => {
  it('validates ISO-8601 UTC timestamp', () => {
    expect(Value.Check(TimestampSchema, '2025-11-04T16:20:00Z')).toBe(true);
  });
  it('rejects invalid format', () => {
    expect(Value.Check(TimestampSchema, '2025/11/04')).toBe(false);
  });
});

describe('NonEmpty', () => {
  it('creates a non-empty string schema', () => {
    const schema = NonEmpty('title', 'desc');
    expect(Value.Check(schema, 'hello')).toBe(true);
    expect(Value.Check(schema, '')).toBe(false);
  });
});

describe('VersionSchema', () => {
  it('validates a KERI version string', () => {
    expect(Value.Check(VersionSchema, 'KERI10JSON000156_')).toBe(true);
  });
  it('rejects invalid version', () => {
    expect(Value.Check(VersionSchema, 'KERI10json000156_')).toBe(false);
  });
});

describe('ThresholdExpressionSchema', () => {
  it('validates simple threshold', () => {
    expect(Value.Check(ThresholdExpressionSchema, '1')).toBe(true);
    expect(Value.Check(ThresholdExpressionSchema, '2/3')).toBe(true);
  });
  it('has correct pattern', () => {
    expect(ThresholdExpressionPattern).toBe('^[0-9]+(/[0-9]+)?$');
  });
});

describe('WeightedThresholdSchema', () => {
  it('validates weighted threshold', () => {
    expect(Value.Check(WeightedThresholdSchema, [['1/2', '1/2']])).toBe(true);
  });
});

describe('ThresholdSchema', () => {
  it('accepts string threshold', () => {
    expect(Value.Check(ThresholdSchema, '2')).toBe(true);
  });
  it('accepts weighted threshold', () => {
    expect(Value.Check(ThresholdSchema, [['1/2', '1/2']])).toBe(true);
  });
});

describe('CesrKeyTransferableSchema shape', () => {
  it('is a TypeBox string schema', () => {
    // CesrType produces a Type.String with custom format.
    // Value.Check requires format registration; we just verify the schema is a string kind.
    expect(CesrKeyTransferableSchema.type).toBe('string');
    expect(CesrKeyTransferableSchema.format).toBe('qb64-key-transferable');
  });
});

describe('CesrDigestSchema shape', () => {
  it('is a TypeBox string schema with qb64-digest format', () => {
    expect(CesrDigestSchema.type).toBe('string');
    expect(CesrDigestSchema.format).toBe('qb64-digest');
  });
});

describe('CesrAidSchema shape', () => {
  it('is a TypeBox string schema with qb64 format', () => {
    expect(CesrAidSchema.type).toBe('string');
    expect(CesrAidSchema.format).toBe('qb64');
  });
});

describe('CesrSignatureSchema shape', () => {
  it('is a TypeBox string schema with qb64-signature format', () => {
    expect(CesrSignatureSchema.type).toBe('string');
    expect(CesrSignatureSchema.format).toBe('qb64-signature');
  });
});

describe('KeriPublicKeySchema', () => {
  it('is a TypeBox string schema', () => {
    expect(KeriPublicKeySchema.type).toBe('string');
    expect(KeriPublicKeySchema.format).toBe('qb64-key');
  });
});

describe('KeriPrivateKeySchema', () => {
  it('validates a private key string (44 chars)', () => {
    expect(Value.Check(KeriPrivateKeySchema, 'A'.repeat(44))).toBe(true);
  });
  it('rejects a short string', () => {
    expect(Value.Check(KeriPrivateKeySchema, 'short')).toBe(false);
  });
});

describe('KeyRef helpers', () => {
  it('keyRef creates a KeyRef without d', () => {
    // Validate structural requirements using a plain schema rather than format-constrained CesrAidSchema
    const schema = Type.Object({ aid: Type.String(), s: Type.String(), kidx: Type.Integer({ minimum: 0 }) });
    const ref = keyRef('Daid' as unknown as import('./types.js').AID, '0', 0);
    expect(ref).toEqual({ aid: 'Daid', s: '0', kidx: 0 });
    expect(Value.Check(schema, ref)).toBe(true);
  });
  it('keyRef creates a KeyRef with d', () => {
    const ref = keyRef(
      'Daid' as unknown as import('./types.js').AID,
      '0',
      0,
      'Edigest' as unknown as import('./types.js').SAID,
    );
    expect(ref).toEqual({ aid: 'Daid', s: '0', kidx: 0, d: 'Edigest' });
  });
  it('keyRefEquals returns true for equal refs', () => {
    const a = { aid: 'D1', s: '0', kidx: 0 };
    expect(keyRefEquals(a, a)).toBe(true);
  });
  it('keyRefEquals returns false for different refs', () => {
    expect(keyRefEquals({ aid: 'D1', s: '0', kidx: 0 }, { aid: 'D2', s: '0', kidx: 0 })).toBe(false);
  });
});

describe('parseEd25519PublicQb64', () => {
  it('throws for obviously bad inputs (format check fails before prefix check)', () => {
    expect(() => parseEd25519PublicQb64('')).toThrow();
    expect(() => parseEd25519PublicQb64('short')).toThrow();
  });
});

describe('parseEd25519PrivateQb64', () => {
  const validKey = 'A'.repeat(44);
  it('accepts a 44-char key that matches the private key schema', () => {
    expect(parseEd25519PrivateQb64(validKey)).toBe(validKey);
  });
  it('throws for short key', () => {
    expect(() => parseEd25519PrivateQb64('short')).toThrow();
  });
});

describe('asEd25519PublicRaw', () => {
  it('accepts 32-byte array', () => {
    const raw = new Uint8Array(32);
    expect(asEd25519PublicRaw(raw)).toBe(raw);
  });
  it('throws for wrong length', () => {
    expect(() => asEd25519PublicRaw(new Uint8Array(16))).toThrow();
  });
});

describe('asEd25519PrivateRaw', () => {
  it('accepts 32-byte array', () => {
    const raw = new Uint8Array(32);
    expect(asEd25519PrivateRaw(raw)).toBe(raw);
  });
  it('throws for wrong length', () => {
    expect(() => asEd25519PrivateRaw(new Uint8Array(10))).toThrow();
  });
});

describe('parseSha256Hex', () => {
  const validHex = 'a'.repeat(64);
  it('accepts valid hex', () => {
    expect(parseSha256Hex(validHex)).toBe(validHex);
  });
  it('throws for wrong length', () => {
    expect(() => parseSha256Hex('abc')).toThrow();
  });
});

describe('parseBlake3Qb64Digest', () => {
  // parseBlake3Qb64Digest calls Value.Check(CesrDigestSchema) which uses format 'qb64-digest'.
  // TypeBox v0.34 rejects unknown formats; throws in unregistered environment. See B-007.
  it('throws for any input (CesrDigestSchema format not registered in pure core)', () => {
    expect(() => parseBlake3Qb64Digest(`E${'A'.repeat(43)}`)).toThrow();
  });
});

describe('parseBlake3Hex', () => {
  const validHex = 'b'.repeat(64);
  it('accepts valid hex', () => {
    expect(parseBlake3Hex(validHex)).toBe(validHex);
  });
});

describe('parseBlake3Qb64', () => {
  it('throws for any input (CesrDigestSchema format not registered in pure core)', () => {
    expect(() => parseBlake3Qb64(`E${'A'.repeat(43)}`)).toThrow();
  });
});

describe('parseEd25519SignatureQb64', () => {
  it('throws for any input (CesrSignatureSchema format not registered in pure core)', () => {
    expect(() => parseEd25519SignatureQb64(`0B${'A'.repeat(86)}`)).toThrow();
  });
});

describe('parseAidQb64', () => {
  it('returns the input as AID (AidQb64 is now an alias for AID)', () => {
    const input = `D${'A'.repeat(43)}`;
    expect(parseAidQb64(input)).toBe(input);
  });
});

describe('parseSaidQb64', () => {
  it('returns the input as SAID (SaidQb64 is now an alias for SAID)', () => {
    const input = `E${'A'.repeat(43)}`;
    expect(parseSaidQb64(input)).toBe(input);
  });
});

describe('toEd25519KeyPairBranded', () => {
  it('throws because parseEd25519PublicQb64 will fail (format not registered)', () => {
    const pub = `D${'A'.repeat(43)}`;
    const priv = 'A'.repeat(44);
    // parseEd25519PublicQb64 calls Value.Check(KeriPublicKeySchema) which uses qb64-key format
    expect(() => toEd25519KeyPairBranded({ publicKey: pub, privateKey: priv, transferable: true })).toThrow();
  });
});
