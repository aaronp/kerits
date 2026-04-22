// Verified: AID re-exported from kel/types.ts line 867 (defined in common/types.ts).
// KSN (line 274), KelManifest (line 341), CESREvent (line 861) defined in kel/types.ts.
// If import path drifts, adjust — do not guess.
import type { AID, CESREvent, KelManifest, KSN } from '../kel/types.js';
import type { Result } from '../result.js';

/** Error from a KEL publish operation. */
export type KELPublishError =
  | { readonly kind: 'rejected'; readonly message: string }
  | { readonly kind: 'protocol-error'; readonly message: string; readonly code?: string }
  | { readonly kind: 'transport-error'; readonly message: string };

/** Domain-level single-artifact publish status. Does not leak RemotePath. */
export type KELPublishStatus = { readonly status: 'published' | 'updated' };

/** Aggregate result of publishing multiple events. */
export type KELPublishResult = {
  readonly published: number;
  readonly updated: number;
  readonly rejected: number;
};

/**
 * Transport-agnostic publisher for KEL artifacts.
 *
 * Rejection model:
 *   - publishEvents (multi-artifact): rejection is in-band via
 *     KELPublishResult.rejected count. ok: true with rejected > 0
 *     is a valid partial-success outcome.
 *   - publishKsn, publishManifest (single-artifact): rejection flows
 *     through the error channel as { kind: 'rejected', message }.
 *     KELPublishStatus never contains 'rejected'.
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
   */
  publishEvents(events: readonly CESREvent[]): Promise<Result<KELPublishResult, KELPublishError>>;

  /** Publish or delegate KSN. Rejection → error channel, not status. */
  publishKsn(aid: AID, ksn: KSN): Promise<Result<KELPublishStatus, KELPublishError>>;

  /** Publish manifest. Rejection → error channel, not status. */
  publishManifest(aid: AID, manifest: KelManifest): Promise<Result<KELPublishStatus, KELPublishError>>;
}
