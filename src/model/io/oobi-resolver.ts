/**
 * OOBIResolver - Resolve OOBI (Out-of-Band Introduction) documents
 * 
 * OOBI is "get by identifier → document bytes"; the adapter decides
 * the transport (HTTP, memory cache, etc.).
 */

import type { Bytes } from './types';

export interface OOBIResolver {
    /** Resolve OOBI document by identifier */
    resolve(id: string): Promise<Bytes | null>; // could fetch /oobi/{id}
}
