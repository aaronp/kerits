/**
 * KEL Service interface
 * 
 * Provides high-level operations for Key Event Log management.
 * This is the service layer that wraps the core KEL operations.
 */

import type { AID, SAID, Bytes } from '../io/types';
import type { KelEvent, CesrSig, KelEnvelope, Crypto } from './types';

/**
 * KEL Service interface
 * 
 * Provides pure operations for creating and manipulating KEL events.
 * All operations are deterministic and stateless.
 */
export interface KelService {
    /**
     * Create an inception event
     */
    incept(args: {
        controller: AID;
        k: string[];
        kt: number;
        nextK: string[];
        nt: number;
        witnesses?: string[];
        wt?: number;
        dt?: string;
    }): KelEvent;

    /**
     * Create a rotation event
     */
    rotate(args: {
        controller: AID;
        prior: KelEvent;            // to enforce reveal==n
        k: string[];
        kt: number;
        nextK: string[];
        nt: number;
        dt?: string;
    }): KelEvent;

    /**
     * Create an interaction event
     */
    interaction(args: {
        controller: AID;
        prior: KelEvent;
        anchors?: SAID[];
        dt?: string
    }): KelEvent;

    /**
     * Sign a KEL event with the provided crypto
     */
    sign(ev: KelEvent, crypto: Crypto): Promise<KelEnvelope>;

    /**
     * Verify signatures on a KEL envelope
     */
    verifyEnvelope(env: KelEnvelope, priorEvent?: KelEvent): Promise<{
        valid: boolean;
        validSignatures: number;
        requiredSignatures: number;
        signatureResults: Array<{ signature: CesrSig; valid: boolean }>;
    }>;

    // Helper methods
    canonicalBytes(ev: KelEvent): Uint8Array;
    saidOf(ev: KelEvent): SAID;
    saidOfKeyset(k: string[], kt: number): SAID; // SAID({k, kt})
    decodeThreshold(kt: string): number;
    encodeThreshold(n: number): string;
    thresholdsEqual(threshold1: string, threshold2: string): boolean;
}
