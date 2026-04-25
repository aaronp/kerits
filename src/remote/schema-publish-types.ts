import type { SAID } from '../common/types.js';
import type { Result } from '../result.js';
import type { JSONSchema } from '../schema/types.js';
import type { PublishError, PublishStatus } from './publish-types.js';

/**
 * Transport-agnostic publisher for JSON schemas.
 */
export interface SchemaPublisher {
  publishSchema(said: SAID, schema: JSONSchema): Promise<Result<PublishStatus, PublishError>>;
}
