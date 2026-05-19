// Verified: AID re-exported from kel/types.ts line 867 (defined in common/types.ts).
// KSN (line 274), AidManifest (line ~341), CESREvent (line 861) defined in kel/types.ts.
// If import path drifts, adjust — do not guess.
import type { AID, CESREvent, CesrAttachment, KSN, SAID } from '../kel/types.js';
import type { Result } from '../result.js';
import type { KELManifestData } from './kel-manifest-data.js';

/** Error from a KEL transport operation. */
export type KELTransportError =
  | { readonly kind: 'rejected'; readonly message: string }
  | { readonly kind: 'protocol-error'; readonly message: string; readonly code?: string }
  | { readonly kind: 'transport-error'; readonly message: string };

/** Location of a published artifact — canonical path + full URL. */
export type KELPublishLocation = {
  readonly path: string;
  readonly url: string;
};

/** Result of batch-publishing events — locations + aggregate counts. */
export type KELPublishEventsResult = {
  readonly locations: readonly KELPublishLocation[];
  readonly published: number;
  readonly updated: number;
  readonly rejected: number;
};

/**
 * Transport-agnostic interface for KEL artifact delivery.
 *
 * Rejection model:
 *   - publishEvents (multi-artifact): rejection is in-band via
 *     KELPublishEventsResult.rejected count. ok: true with rejected > 0
 *     is a valid partial-success outcome.
 *   - publishKsn, publishManifest (single-artifact): rejection flows
 *     through the error channel as { kind: 'rejected', message }.
 *
 * Implementations may no-op `publishKsn` if the backend derives KSN
 * server-side. The contract is: "ensure an equivalent KSN is available
 * at the backend's canonical KSN location."
 */
export interface KELTransport {
  /**
   * Publish events in input order. Must not reorder or parallelize.
   * ok: true means counts are authoritative, even if rejected > 0.
   * ok: false means the operation failed — no trustworthy counts.
   * locations[i] corresponds to events[i].
   */
  publishEvents(events: readonly CESREvent[]): Promise<Result<KELPublishEventsResult, KELTransportError>>;

  /** Publish or delegate KSN. Rejection → error channel. */
  publishKsn(aid: AID, ksn: KSN): Promise<Result<KELPublishLocation, KELTransportError>>;

  /** Publish manifest. Rejection → error channel. */
  publishManifest(aid: AID, manifest: KELManifestData): Promise<Result<KELPublishLocation, KELTransportError>>;

  /** Publish witness receipts for an event. Rejection → error channel. */
  publishReceipts(
    said: SAID,
    receipts: readonly CesrAttachment[],
  ): Promise<Result<KELPublishLocation, KELTransportError>>;
}
