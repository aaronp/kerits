import type { Timestamp } from '../common/types.js';
import type { AidManifest } from '../kel/types.js';

/** Published KEL artifact coordinate — pipe type for publish and fetch. */
export type KSNResource = { readonly kind: 'ksn'; readonly url: string };
export type KELEventResource = { readonly kind: 'kel.event'; readonly url: string };
export type KELReceiptsResource = { readonly kind: 'kel.receipts'; readonly url: string };
export type KELFullResource = { readonly kind: 'kel.full'; readonly url: string };
export type KELManifestResource = { readonly kind: 'kel.manifest'; readonly url: string };

export type KELPublishedResource =
  | KSNResource
  | KELEventResource
  | KELReceiptsResource
  | KELFullResource
  | KELManifestResource;

/** Local record of a known remote resource at a point in time. */
export type RemoteRecord = {
  readonly seqNo: number;
  readonly at: Timestamp;
  readonly resource: KELPublishedResource;
};

export function resourceKey(resource: KELPublishedResource): string {
  return `${resource.kind}:${resource.url}`;
}

/** Upsert by resource key; newer `at` then higher `seqNo` wins. */
export function mergeRemoteRecords(
  existing: readonly RemoteRecord[],
  incoming: readonly RemoteRecord[],
): RemoteRecord[] {
  const map = new Map<string, RemoteRecord>();
  for (const record of existing) {
    map.set(resourceKey(record.resource), record);
  }
  for (const record of incoming) {
    const key = resourceKey(record.resource);
    const prior = map.get(key);
    if (!prior || recordSortKey(record) >= recordSortKey(prior)) {
      map.set(key, record);
    }
  }
  return [...map.values()];
}

function recordSortKey(record: RemoteRecord): string {
  return `${record.at}\0${String(record.seqNo).padStart(12, '0')}`;
}

export function manifestUrlFromRecords(records: readonly RemoteRecord[]): string | undefined {
  return records.find((r) => r.resource.kind === 'kel.manifest')?.resource.url;
}

/** Build deduped coordinates from a wire manifest (e.g. after fetch or for up-to-date publish). */
export function remoteRecordsFromAidManifest(
  manifest: AidManifest,
  seqNo: number,
  at: Timestamp,
  manifestUrl: string,
): RemoteRecord[] {
  const records: RemoteRecord[] = [{ seqNo, at, resource: { kind: 'ksn', url: manifest.ksnUrl } }];
  for (const entry of manifest.events) {
    records.push({ seqNo, at, resource: { kind: 'kel.event', url: entry.url } });
    if (entry.receiptsUrl) {
      records.push({ seqNo, at, resource: { kind: 'kel.receipts', url: entry.receiptsUrl } });
    }
  }
  records.push({ seqNo, at, resource: { kind: 'kel.manifest', url: manifestUrl } });
  return mergeRemoteRecords([], records);
}
