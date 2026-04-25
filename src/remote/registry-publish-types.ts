import type { ACDCCredential } from '../acdc/types.js';
import type { SAID } from '../common/types.js';
import type { Result } from '../result.js';
import type { RSN, TelEvent } from '../tel/types.js';
import type { PublishError, PublishStatus } from './publish-types.js';

/** Placeholder type for backer receipts — not yet modelled as a domain type. */
export type BackerReceiptsJson = unknown;

/**
 * Transport-agnostic publisher for registry artifacts (TEL, ACDC, RSN, receipts).
 */
export interface RegistryPublisher {
  /** registryId is used for path resolution; TEL events are self-addressing but don't carry registry context in a path-derivable way. */
  publishTelEvent(registryId: SAID, event: TelEvent): Promise<Result<PublishStatus, PublishError>>;
  publishAcdc(said: SAID, acdc: ACDCCredential): Promise<Result<PublishStatus, PublishError>>;
  publishRsn(registryId: SAID, rsn: RSN): Promise<Result<PublishStatus, PublishError>>;
  publishBackerReceiptsRaw(eventSaid: SAID, receipts: BackerReceiptsJson): Promise<Result<PublishStatus, PublishError>>;
}
