// Verified: AID re-exported from kel/types.ts line 867 (defined in common/types.ts).
// KSN (line 274), AidManifest (line ~341), CESREvent (line 861) defined in kel/types.ts.
// If import path drifts, adjust — do not guess.
import type { AID, AidManifest, CESREvent, KSN } from '../kel/types.js';
import type { Result } from '../result.js';

/** Error from a KEL publish operation. */
export type KELPublishError =
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
 * Transport-agnostic publisher for KEL artifacts.
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
export interface KELPublisher {
  /**
   * Publish events in input order. Must not reorder or parallelize.
   * ok: true means counts are authoritative, even if rejected > 0.
   * ok: false means the operation failed — no trustworthy counts.
   * locations[i] corresponds to events[i].
   */
  publishEvents(events: readonly CESREvent[]): Promise<Result<KELPublishEventsResult, KELPublishError>>;

  /** Publish or delegate KSN. Rejection → error channel. */
  publishKsn(aid: AID, ksn: KSN): Promise<Result<KELPublishLocation, KELPublishError>>;

  /** Publish manifest. Rejection → error channel. */
  publishManifest(aid: AID, manifest: AidManifest): Promise<Result<KELPublishLocation, KELPublishError>>;
}
