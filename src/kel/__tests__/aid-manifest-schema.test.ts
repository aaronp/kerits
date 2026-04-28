import { describe, expect, it } from 'bun:test';
import { Value } from '@sinclair/typebox/value';
import { AidManifestSchema } from '../types.js';

const validManifest = {
  v: 'kerits-aid-manifest/1',
  aid: 'EtestAidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  latestSn: 1,
  ksnSaid: 'ESaid0_0000000000000000000000000000000000000000',
  ksnPath: '/.well-known/keri/aid/EtestAidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/ksn',
  ksnUrl: 'https://example.com/.well-known/keri/aid/EtestAidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/ksn',
  events: [
    {
      sn: 0,
      said: 'Eevent0SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      path: '/.well-known/keri/events/Eevent0SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/event',
      url: 'https://example.com/.well-known/keri/events/Eevent0SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/event',
    },
    {
      sn: 1,
      said: 'Eevent1SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      path: '/.well-known/keri/events/Eevent1SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/event',
      url: 'https://example.com/.well-known/keri/events/Eevent1SaidXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/event',
    },
  ],
};

describe('AidManifestSchema', () => {
  it('parses a valid manifest', () => {
    expect(Value.Check(AidManifestSchema, validManifest)).toBe(true);
  });

  it('parses with optional kelPath/kelUrl', () => {
    const withKel = {
      ...validManifest,
      kelPath: '/.well-known/keri/aid/EtestAid/kel',
      kelUrl: 'https://example.com/.well-known/keri/aid/EtestAid/kel',
    };
    expect(Value.Check(AidManifestSchema, withKel)).toBe(true);
  });

  it('rejects wrong version string', () => {
    expect(Value.Check(AidManifestSchema, { ...validManifest, v: 'wrong/1' })).toBe(false);
  });

  it('rejects missing aid', () => {
    const { aid: _, ...rest } = validManifest;
    expect(Value.Check(AidManifestSchema, rest)).toBe(false);
  });

  it('rejects empty events array', () => {
    expect(Value.Check(AidManifestSchema, { ...validManifest, events: [] })).toBe(false);
  });

  it('rejects event missing sn', () => {
    const badEvent = { said: 'Efoo', path: '/p', url: 'https://x' };
    expect(Value.Check(AidManifestSchema, { ...validManifest, events: [badEvent] })).toBe(false);
  });

  it('rejects event missing url', () => {
    const badEvent = { sn: 0, said: 'Efoo', path: '/p' };
    expect(Value.Check(AidManifestSchema, { ...validManifest, events: [badEvent] })).toBe(false);
  });

  it('rejects missing ksnSaid', () => {
    const { ksnSaid: _, ...rest } = validManifest;
    expect(Value.Check(AidManifestSchema, rest)).toBe(false);
  });
});
