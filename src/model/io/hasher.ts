/**
 * Hasher - Interface for computing SAIDs from data
 */

import type { SAID } from '../types';
import type { Bytes } from './types';

export interface Hasher {
    /** Compute SAID from bytes (canonical JSON + CESR digest, etc.) */
    saidOf(data: Bytes): SAID;
}
