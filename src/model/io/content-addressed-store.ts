/**
 * ContentAddressedStore - Wrapper that computes SAIDs automatically
 * 
 * Provides higher-level operations that automatically compute SAIDs
 * and handle deduplication.
 */

import type { SAID } from '../types';
import type { Bytes } from './types';

export interface ContentAddressedStore {
    /** Store object and return its SAID */
    putObject<T>(obj: T, encode: (o: T) => Bytes): Promise<SAID>;

    /** Retrieve object by SAID */
    getObject<T>(id: SAID, decode: (b: Bytes) => T): Promise<T | null>;
}
