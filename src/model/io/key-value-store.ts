/**
 * KeyValueStore - Content-addressed storage interface
 * 
 * Stores arbitrary bytes by SAID (Self-Addressing IDentifier).
 * This is the fundamental storage primitive for all KERI data.
 */

import type { SAID } from '../types';
import type { Bytes } from './types';

export interface KeyValueStore {
    /** Get data by SAID */
    get(id: SAID): Promise<Bytes | null>;

    /** Store data by SAID */
    put(id: SAID, data: Bytes): Promise<void>;

    /** Delete data by SAID (optional) */
    del?(id: SAID): Promise<void>;

    /** Check if SAID exists (optional) */
    has?(id: SAID): Promise<boolean>;

    /** List SAIDs with optional prefix (optional) */
    listKeys?(prefix?: string): Promise<SAID[]>;
}

/**
 * NamespacedStore - KeyValueStore with namespace prefix
 * 
 * Wraps a KeyValueStore to add a namespace prefix to all operations.
 * Useful for organizing different types of data in the same store.
 */
export interface NamespacedStore extends KeyValueStore {
    namespace: string;
}
