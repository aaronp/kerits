/**
 * Service layer types
 * 
 * This package defines the service interfaces that provide high-level
 * operations for KEL, TEL, and other KERI services.
 */

import type { AID, SAID, Bytes } from '../io/types';
import type { KelEvent, CesrSig, KelEnvelope } from '../kel/types';
import type { TelEvent, TelEnvelope } from '../tel/types';

/**
 * Crypto interface for signing and verification
 */
export interface Crypto {
    /** Sign data with a specific key index */
    sign(data: Bytes, keyIndex: number): Promise<string>;         // CESR signature

    /** Verify signature against public key */
    verify(data: Bytes, sig: string, pub: string): Promise<boolean>;

    /** Get current public keys */
    pubKeys(): string[];          // current `k`

    /** Get current key threshold */
    threshold(): number;          // `kt`

    /** Get next commitment details */
    nextCommit(): { n: SAID; nt: number; nextKeys: string[] }; // committed next set
}

// Re-export KEL and TEL types for convenience
export type { KelEvent, CesrSig, KelEnvelope } from '../kel/types';
export type { TelEvent, TelEnvelope } from '../tel/types';

// Re-export rotation types from the rotation package
export type {
    RotationId,
    RotationPhase,
    SignerRequirement,
    RotationStatus,
    RotationProgressEvent,
    RotationHandle,
    RotationProposal,
    RotationSign,
    RotationFinalize,
    RotationAbort
} from '../kel/rotation/types';
