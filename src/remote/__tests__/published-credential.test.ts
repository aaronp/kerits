import { describe, expect, test } from 'bun:test';
import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { AID, SAID } from '../../common/types.js';
import type { Timestamp } from '../../kel/types.js';

// Register CESR format validators so Value.Check passes in pure-core tests
if (!FormatRegistry.Has('qb64')) FormatRegistry.Set('qb64', () => true);
if (!FormatRegistry.Has('qb64-key')) FormatRegistry.Set('qb64-key', () => true);
if (!FormatRegistry.Has('qb64-digest')) FormatRegistry.Set('qb64-digest', () => true);
if (!FormatRegistry.Has('qb64-signature')) FormatRegistry.Set('qb64-signature', () => true);
if (!FormatRegistry.Has('qb64-key-transferable')) FormatRegistry.Set('qb64-key-transferable', () => true);
import {
  type KELManifestData,
  KELManifestDataSchema,
  type PublishedCredential,
  PublishedCredentialSchema,
  aidManifestToKelManifestData,
  parseKelManifestWire,
  validatePublishedCredential,
} from '../kel-manifest-data.js';

const AID_VAL = 'ETestPublCredAID0000000000000000000000000000' as AID;
const SCHEMA_SAID_1 = 'ESchemaSaid1_0000000000000000000000000000000' as SAID;
const SCHEMA_SAID_2 = 'ESchemaSaid2_0000000000000000000000000000000' as SAID;
const REGISTRY_SAID = 'ERegistrySaid0000000000000000000000000000000' as SAID;
const TEL_URL = 'https://example.com/.well-known/keri/registry/ERegistrySaid0000000000000000000000000000000/tel';

function validCredentialEntry(overrides?: Partial<PublishedCredential>): PublishedCredential {
  return {
    name: 'Trusted Devices',
    registry: REGISTRY_SAID,
    schemas: [SCHEMA_SAID_1],
    url: TEL_URL,
    ...overrides,
  } as PublishedCredential;
}

function minimalManifest(credentials: PublishedCredential[] = []): KELManifestData {
  return {
    v: 'kerits-aid-manifest/2',
    aid: AID_VAL,
    entries: [
      {
        resource: { kind: 'ksn', url: `https://example.com/.well-known/keri/aid/${AID_VAL}/ksn` },
        metadata: { publishedAt: '2026-06-03T00:00:00.000Z', sn: 0 },
      },
      {
        resource: { kind: 'kel.event', url: `https://example.com/.well-known/keri/events/ESaid0/event` },
        metadata: { publishedAt: '2026-06-03T00:00:00.000Z', sn: 0 },
      },
    ],
    credentials,
  };
}

describe('PublishedCredential schema validation', () => {
  test('valid credential entry passes', () => {
    expect(Value.Check(PublishedCredentialSchema, validCredentialEntry())).toBe(true);
  });

  test('empty name is rejected', () => {
    expect(Value.Check(PublishedCredentialSchema, validCredentialEntry({ name: '' }))).toBe(false);
  });

  test('empty schemas array is rejected (minItems: 1)', () => {
    expect(Value.Check(PublishedCredentialSchema, validCredentialEntry({ schemas: [] as any }))).toBe(false);
  });

  test('unknown property is rejected (additionalProperties: false)', () => {
    const withExtra = { ...validCredentialEntry(), extra: 'nope' };
    expect(Value.Check(PublishedCredentialSchema, withExtra)).toBe(false);
  });

  test('multiple credential entries with same schema but different registry are valid', () => {
    const REGISTRY_2 = 'ERegistrySaid2_00000000000000000000000000000' as SAID;
    const cred1 = validCredentialEntry();
    const cred2 = validCredentialEntry({ registry: REGISTRY_2, url: `https://example.com/.well-known/keri/registry/${REGISTRY_2}/tel` });
    const manifest = minimalManifest([cred1, cred2]);
    expect(Value.Check(KELManifestDataSchema, manifest)).toBe(true);
  });
});

describe('validatePublishedCredential', () => {
  test('valid entry returns no errors', () => {
    expect(validatePublishedCredential(validCredentialEntry())).toEqual([]);
  });

  test('invalid URL is rejected', () => {
    const errors = validatePublishedCredential(validCredentialEntry({ url: 'not-a-url' }));
    expect(errors).toContain('url must be a valid URI');
  });

  test('duplicate schemas are rejected', () => {
    const errors = validatePublishedCredential(
      validCredentialEntry({ schemas: [SCHEMA_SAID_1, SCHEMA_SAID_1] as any }),
    );
    expect(errors).toContain('schemas must not contain duplicates');
  });

  test('multiple distinct schemas are valid', () => {
    const errors = validatePublishedCredential(
      validCredentialEntry({ schemas: [SCHEMA_SAID_1, SCHEMA_SAID_2] as any }),
    );
    expect(errors).toEqual([]);
  });
});

describe('KELManifestData with credentials', () => {
  test('manifest with credentials: [] is valid', () => {
    expect(Value.Check(KELManifestDataSchema, minimalManifest())).toBe(true);
  });

  test('manifest missing credentials field is rejected', () => {
    const { credentials, ...noCredentials } = minimalManifest();
    expect(Value.Check(KELManifestDataSchema, noCredentials)).toBe(false);
  });

  test('manifest with populated credentials round-trips through parseKelManifestWire', () => {
    const manifest = minimalManifest([validCredentialEntry()]);
    const parsed = parseKelManifestWire(manifest);
    expect(parsed).toBeDefined();
    expect(parsed?.version).toBe(2);
    if (parsed?.version === 2) {
      expect(parsed.data.credentials).toHaveLength(1);
      expect(parsed.data.credentials[0]!.name).toBe('Trusted Devices');
      expect(parsed.data.credentials[0]!.registry).toBe(REGISTRY_SAID);
      expect(parsed.data.credentials[0]!.schemas).toEqual([SCHEMA_SAID_1]);
      expect(parsed.data.credentials[0]!.url).toBe(TEL_URL);
    }
  });

  test('aidManifestToKelManifestData produces credentials: []', () => {
    const v1 = {
      v: 'kerits-aid-manifest/1' as const,
      aid: AID_VAL,
      latestSn: 0,
      ksnSaid: 'EKsnSaid000000000000000000000000000000000000' as SAID,
      ksnPath: `/.well-known/keri/aid/${AID_VAL}/ksn`,
      ksnUrl: `https://example.com/.well-known/keri/aid/${AID_VAL}/ksn`,
      events: [
        {
          sn: 0,
          said: 'ESaid0_0000000000000000000000000000000000000' as SAID,
          path: '/.well-known/keri/events/ESaid0/event',
          url: 'https://example.com/.well-known/keri/events/ESaid0/event',
        },
      ],
    };
    const v2 = aidManifestToKelManifestData(v1, '2026-06-03T00:00:00.000Z' as Timestamp);
    expect(v2.credentials).toEqual([]);
  });
});
