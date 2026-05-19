import { type Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { Qb64Schema } from '../common/types.js';
import type { AID, AidManifest, AidManifestEvent, SAID, Timestamp } from '../kel/types.js';
import { AidManifestSchema } from '../kel/types.js';
import { CanonicalPaths } from '../keri/canonical-paths.js';
import type { KELPublishedResource } from './kel-resource-types.js';
import { mergeRemoteRecords, type RemoteRecord } from './kel-resource-types.js';

export const RemoteMetadataSchema = Type.Object(
  {
    publishedAt: Type.String(),
    sn: Type.Number(),
  },
  { additionalProperties: false },
);
export type RemoteMetadata = Static<typeof RemoteMetadataSchema>;

const KELPublishedResourceSchema = Type.Union([
  Type.Object({ kind: Type.Literal('ksn'), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal('kel.event'), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal('kel.receipts'), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal('kel.full'), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal('kel.manifest'), url: Type.String() }, { additionalProperties: false }),
]);

export const KELManifestEntrySchema = Type.Object(
  {
    resource: KELPublishedResourceSchema,
    metadata: RemoteMetadataSchema,
  },
  { additionalProperties: false },
);
export type KELManifestEntry = Static<typeof KELManifestEntrySchema>;

export const KELManifestDataSchema = Type.Object(
  {
    v: Type.Literal('kerits-aid-manifest/2'),
    aid: Qb64Schema,
    entries: Type.Array(KELManifestEntrySchema, { minItems: 1 }),
  },
  { additionalProperties: false },
);
export type KELManifestData = Static<typeof KELManifestDataSchema>;

export function latestSnFromKelManifestData(data: KELManifestData): number {
  const eventSns = data.entries.filter((e) => e.resource.kind === 'kel.event').map((e) => e.metadata.sn);
  if (eventSns.length === 0) return -1;
  return Math.max(...eventSns);
}

export function aidManifestToKelManifestData(manifest: AidManifest, publishedAt: Timestamp): KELManifestData {
  const entries: KELManifestEntry[] = [
    {
      resource: { kind: 'ksn', url: manifest.ksnUrl },
      metadata: { publishedAt, sn: manifest.latestSn },
    },
  ];
  for (const event of manifest.events) {
    entries.push({
      resource: { kind: 'kel.event', url: event.url },
      metadata: { publishedAt, sn: event.sn },
    });
    if (event.receiptsUrl) {
      entries.push({
        resource: { kind: 'kel.receipts', url: event.receiptsUrl },
        metadata: { publishedAt, sn: event.sn },
      });
    }
  }
  if (manifest.kelUrl) {
    entries.push({
      resource: { kind: 'kel.full', url: manifest.kelUrl },
      metadata: { publishedAt, sn: manifest.latestSn },
    });
  }
  return { v: 'kerits-aid-manifest/2', aid: manifest.aid, entries };
}

function saidFromEventUrl(url: string): SAID | undefined {
  const match = url.match(/\/events\/([^/]+)\/event/);
  return match?.[1] as SAID | undefined;
}

function pathFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

/** Reconstruct v1 manifest from v2 wire data (requires resolved KSN for ksnSaid). */
export function kelManifestDataToAidManifest(data: KELManifestData, ksnSaid: SAID): AidManifest {
  const ksnEntry = data.entries.find((e) => e.resource.kind === 'ksn');
  if (!ksnEntry) {
    throw new Error('KELManifestData missing ksn entry');
  }
  const receiptsBySn = new Map<number, { path?: string; url: string }>();
  for (const entry of data.entries) {
    if (entry.resource.kind === 'kel.receipts') {
      receiptsBySn.set(entry.metadata.sn, { url: entry.resource.url, path: pathFromUrl(entry.resource.url) });
    }
  }
  const events: AidManifestEvent[] = [];
  for (const entry of data.entries) {
    if (entry.resource.kind !== 'kel.event') continue;
    const said = saidFromEventUrl(entry.resource.url);
    if (!said) {
      throw new Error(`Cannot derive SAID from event URL: ${entry.resource.url}`);
    }
    const receipts = receiptsBySn.get(entry.metadata.sn);
    events.push({
      sn: entry.metadata.sn,
      said,
      path: pathFromUrl(entry.resource.url),
      url: entry.resource.url,
      receiptsPath: receipts?.path,
      receiptsUrl: receipts?.url,
    });
  }
  events.sort((a, b) => a.sn - b.sn);
  const latestSn = latestSnFromKelManifestData(data);
  const kelFull = data.entries.find((e) => e.resource.kind === 'kel.full');
  return {
    v: 'kerits-aid-manifest/1',
    aid: data.aid,
    latestSn,
    ksnSaid,
    ksnPath: pathFromUrl(ksnEntry.resource.url),
    ksnUrl: ksnEntry.resource.url,
    kelPath: kelFull ? pathFromUrl(kelFull.resource.url) : undefined,
    kelUrl: kelFull?.resource.url,
    events,
  };
}

export function remoteRecordsFromKelManifestData(
  data: KELManifestData,
  at: Timestamp,
  manifestUrl: string,
): RemoteRecord[] {
  const headSn = latestSnFromKelManifestData(data);
  const records: RemoteRecord[] = data.entries.map((entry) => ({
    seqNo: headSn,
    at,
    resource: entry.resource as KELPublishedResource,
  }));
  if (!records.some((r) => r.resource.kind === 'kel.manifest')) {
    records.push({ seqNo: headSn, at, resource: { kind: 'kel.manifest', url: manifestUrl } });
  }
  return mergeRemoteRecords([], records);
}

export type ParsedKelManifest =
  | { readonly version: 1; readonly manifest: AidManifest }
  | { readonly version: 2; readonly data: KELManifestData };

export function parseKelManifestWire(value: unknown): ParsedKelManifest | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = (value as { v?: string }).v;
  if (v === 'kerits-aid-manifest/2') {
    if (!Value.Check(KELManifestDataSchema, value)) return undefined;
    return { version: 2, data: value as KELManifestData };
  }
  if (v === 'kerits-aid-manifest/1') {
    if (!Value.Check(AidManifestSchema, value)) return undefined;
    return { version: 1, manifest: value as AidManifest };
  }
  return undefined;
}

export function manifestUrlFromKelManifestData(data: KELManifestData): string | undefined {
  return data.entries.find((e) => e.resource.kind === 'kel.manifest')?.resource.url;
}

export function canonicalManifestUrlForAid(aid: AID, baseUrl: string): string {
  return CanonicalPaths.fullUrl(baseUrl.replace(/\/+$/, ''), CanonicalPaths.aidManifest(aid));
}
