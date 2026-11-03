import type { ACDCCredential } from '../acdc/types.js';
import type { SAID } from '../common/types.js';
import type { Result } from '../result.js';
import type { VcpEvent } from '../tel/types.js';
import type { PublishError, PublishStatus } from './publish-types.js';

/** Placeholder type for backer receipts — not yet modelled as a domain type. */
export type BackerReceiptsJson = unknown;

/**
 * Transport-agnostic publisher for registry SAID documents (ACDC, VCP) and receipts.
 * TEL aggregate / RSN live on the TEL publisher (store: `registry/{rid}/tel|rsn`).
 */
export interface RegistryPublisher {
  publishAcdc(said: SAID, acdc: ACDCCredential): Promise<Result<PublishStatus, PublishError>>;
  /** Registry inception at `registry/{rid}/vcp` (COUNTED; `ii` must be the publisher subject). */
  publishVcp(vcp: VcpEvent): Promise<Result<PublishStatus, PublishError>>;
  publishBackerReceiptsRaw(eventSaid: SAID, receipts: BackerReceiptsJson): Promise<Result<PublishStatus, PublishError>>;
}
