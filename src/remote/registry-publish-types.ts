import type { ACDCCredential } from '../acdc/types.js';
import type { SAID } from '../common/types.js';
import type { Result } from '../result.js';
import type { PublishError, PublishStatus } from './publish-types.js';

/** Placeholder type for backer receipts — not yet modelled as a domain type. */
export type BackerReceiptsJson = unknown;

/**
 * Transport-agnostic publisher for non-TEL registry artifacts (ACDC, receipts).
 *
 * TEL event and RSN publishing is handled by {@link TELTransport} which provides
 * batch operations, aggregate snapshots, and location tracking.
 */
export interface RegistryPublisher {
  publishAcdc(said: SAID, acdc: ACDCCredential): Promise<Result<PublishStatus, PublishError>>;
  publishBackerReceiptsRaw(eventSaid: SAID, receipts: BackerReceiptsJson): Promise<Result<PublishStatus, PublishError>>;
}
