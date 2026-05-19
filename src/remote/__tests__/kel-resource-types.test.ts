import { describe, expect, it } from 'bun:test';
import type { Timestamp } from '../../common/types.js';
import type { AID, AidManifest } from '../../kel/types.js';
import {
  manifestUrlFromRecords,
  mergeRemoteRecords,
  remoteRecordsFromAidManifest,
  resourceKey,
} from '../kel-resource-types.js';

const aid = 'ETestAid000000000000000000000000000000000' as AID;
const at = '2026-05-18T12:00:00.000Z' as Timestamp;

const manifest: AidManifest = {
  v: 'kerits-aid-manifest/1',
  aid,
  latestSn: 0,
  ksnSaid: 'ESaid0',
  ksnPath: '/ksn',
  ksnUrl: 'https://example/.well-known/keri/aid/EAid/ksn',
  events: [
    {
      sn: 0,
      said: 'ESaid0',
      path: '/event',
      url: 'https://example/.well-known/keri/events/ESaid0/event',
      receiptsUrl: 'https://example/.well-known/keri/events/ESaid0/receipts',
    },
  ],
};

describe('resourceKey', () => {
  it('combines kind and url', () => {
    expect(resourceKey({ kind: 'kel.event', url: 'https://x/y' })).toBe('kel.event:https://x/y');
  });
});

describe('mergeRemoteRecords', () => {
  it('dedupes by resource key keeping newer at', () => {
    const a = { seqNo: 0, at: '2026-01-01T00:00:00.000Z' as Timestamp, resource: { kind: 'kel.event' as const, url: 'https://x/e' } };
    const b = { seqNo: 1, at: '2026-05-01T00:00:00.000Z' as Timestamp, resource: { kind: 'kel.event' as const, url: 'https://x/e' } };
    const merged = mergeRemoteRecords([a], [b]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.seqNo).toBe(1);
  });
});

describe('remoteRecordsFromAidManifest', () => {
  it('includes ksn, events, receipts, manifest', () => {
    const records = remoteRecordsFromAidManifest(
      manifest,
      0,
      at,
      'https://example/.well-known/keri/aid/EAid/manifest',
    );
    expect(records.some((r) => r.resource.kind === 'ksn')).toBe(true);
    expect(records.some((r) => r.resource.kind === 'kel.event')).toBe(true);
    expect(records.some((r) => r.resource.kind === 'kel.receipts')).toBe(true);
    expect(manifestUrlFromRecords(records)).toBe('https://example/.well-known/keri/aid/EAid/manifest');
  });
});
