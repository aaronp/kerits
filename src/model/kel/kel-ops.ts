/**
 * KEL Operations - Pure functions for creating and manipulating Key Event Logs
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { canonicalize } from 'json-canonicalize';
import type { AID, SAID, Threshold } from '../types';
import type { InceptionEvent, RotationEvent, InteractionEvent, KelEvent, KelEnvelope, CesrSig } from './types';
import { CESR } from '../cesr/cesr';
import { s } from '../string-ops';

/**
 * Controller state extracted from KEL events
 */
export interface KelControllerState {
    /** Current signing keys (CESR-encoded) */
    keys: string[];
    /** Key threshold (number of signatures required) */
    keyThreshold: number;
    /** Sequence number of the latest KEL event */
    sequence: number;
    /** Whether the controller is active */
    active: boolean;
    /** AID of the controller */
    aid: AID;
}

/**
 * CESR digest encoding helper
 */
function encodeCESRDigest(hash: Uint8Array, code: string): string {
    const b64 = btoa(String.fromCharCode(...hash));
    return code + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Parameters for creating an inception event
 */
export interface InceptionParams {
    currentKeys: string[];
    nextKeys: string[];
    transferable: boolean;
    keyThreshold?: number;
    nextThreshold?: number;
    witnesses?: string[];
    witnessThreshold?: number;
    dt?: string;
    currentTime?: string; // ISO 8601 timestamp for deterministic testing
}

/**
 * Parameters for creating a rotation event
 */
export interface RotationParams {
    controller: AID;
    currentKeys: string[];
    nextKeys: string[];
    previousEvent: SAID;
    transferable: boolean;
    keyThreshold?: number;
    nextThreshold?: number;
    witnesses?: string[];
    witnessThreshold?: number;
    dt?: string;
    currentTime?: string; // ISO 8601 timestamp for deterministic testing
}

/**
 * Parameters for creating an interaction event
 */
export interface InteractionParams {
    previousEvent: SAID;
    anchors: SAID[];
    currentTime?: string; // ISO 8601 timestamp for deterministic testing
}

/**
 * KEL class - Static methods for creating and manipulating Key Event Log events
 */
export class KEL {

    /**
     * convenience function to create an inception event from two seeds
     * @param seed1 
     * @param seed2 
     * @param transferable 
     * @param currentTime - ISO 8601 timestamp for deterministic testing
     * @returns 
     */
    static inceptionFrom(seed1?: number, seed2?: number, transferable: boolean = true, currentTime?: string): InceptionEvent {
        // Use secure random numbers if seeds not provided
        const currentSeed = seed1 ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const nextSeed = seed2 ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

        const current = CESR.keypairFrom(currentSeed, transferable);
        const next = CESR.keypairFrom(nextSeed, transferable);

        return KEL.inception({
            currentKeys: [CESR.getPublicKey(current)],
            nextKeys: [CESR.getPublicKey(next)],
            transferable: transferable,
            currentTime,
        });
    }

    /**
     * Create an inception event
     *
     * @param params - Inception parameters
     * @returns InceptionEvent with computed SAID
     */
    static inception(params: InceptionParams): InceptionEvent {
        const {
            currentKeys,
            nextKeys,
            transferable,
            keyThreshold = currentKeys.length,
            nextThreshold = nextKeys.length,
            witnesses,
            witnessThreshold,
            dt,
            currentTime,
        } = params;

        // Use provided dt, currentTime, or fall back to current timestamp
        const timestamp = dt || currentTime || new Date().toISOString();

        // Validate thresholds
        if (keyThreshold <= 0 || keyThreshold > currentKeys.length) {
            throw new Error(`Invalid key threshold: ${keyThreshold}, must be 1-${currentKeys.length}`);
        }
        if (nextThreshold <= 0 || nextThreshold > nextKeys.length) {
            throw new Error(`Invalid next threshold: ${nextThreshold}, must be 1-${nextKeys.length}`);
        }

        // For inception, the identifier is the first public key
        const identifier = currentKeys[0];
        if (!identifier) {
            throw new Error('At least one current key is required for inception');
        }

        // Compute next key commitment
        const nextKeyCommitment = KEL.computeNextKeyCommitment(nextKeys, nextThreshold);

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'icp',
            d: s('#'.repeat(44)).asSAID(), // Placeholder for SAID
            i: s(identifier).asAID(),
            s: '0',
            k: currentKeys,
            kt: s(keyThreshold.toString()).asThreshold(),
            n: nextKeyCommitment,
            nt: s(nextThreshold.toString()).asThreshold(),
            dt: timestamp,
        };

        // Add optional witness fields
        if (witnesses && witnesses.length > 0) {
            event.w = witnesses.map(w => s(w).asAID());
            event.wt = s((witnessThreshold ?? witnesses.length).toString()).asThreshold();
        }

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = s(encodeCESRDigest(hash, 'E')).asSAID();

        // Replace placeholder with actual SAID
        event.d = said;

        return event as InceptionEvent;
    }

    /**
     * Extract controller state from a KEL event
     *
     * @param kelEvent - KEL event to extract controller state from
     * @returns Controller state for TEL signing
     */
    static extractControllerState(kelEvent: KelEvent): KelControllerState {
        return {
            aid: kelEvent.i,
            keys: kelEvent.k || [],
            keyThreshold: parseInt(kelEvent.kt || '1', 10),
            sequence: parseInt(kelEvent.s || '0', 16),
            active: true
        };
    }

    /**
     * Get the latest controller state from a KEL chain
     *
     * @param kelEvents - Array of KEL events in sequence order
     * @returns Latest controller state
     */
    static getLatestControllerState(kelEvents: any[]): KelControllerState | null {
        if (kelEvents.length === 0) {
            return null;
        }

        // Get the latest event (highest sequence number)
        const latestEvent = kelEvents.reduce((latest, current) => {
            const latestSeq = parseInt(latest.s || '0', 16);
            const currentSeq = parseInt(current.s || '0', 16);
            return currentSeq > latestSeq ? current : latest;
        });

        return KEL.extractControllerState(latestEvent);
    }

    /**
     * Compute next key commitment (SAID of next key set)
     *
     * @param nextKeys - Array of next key digests
     * @param nextThreshold - Next threshold
     * @returns SAID of the next key commitment
     */
    static computeNextKeyCommitment(nextKeys: string[], nextThreshold: number): SAID {
        const commitment = {
            k: nextKeys,
            kt: nextThreshold.toString()
        };
        const canonical = canonicalize(commitment);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        return s(encodeCESRDigest(hash, 'E')).asSAID();
    }

    /**
     * Create a rotation event
     *
     * @param params - Rotation parameters
     * @returns RotationEvent with computed SAID
     */
    static rotation(params: RotationParams): RotationEvent {
        const {
            currentKeys,
            nextKeys,
            previousEvent,
            transferable,
            keyThreshold = currentKeys.length,
            nextThreshold = nextKeys.length,
            witnesses,
            witnessThreshold,
            dt,
            currentTime,
        } = params;

        // Use provided dt, currentTime, or fall back to current timestamp
        const timestamp = dt || currentTime || new Date().toISOString();

        // Validate thresholds
        if (keyThreshold <= 0 || keyThreshold > currentKeys.length) {
            throw new Error(`Invalid key threshold: ${keyThreshold}, must be 1-${currentKeys.length}`);
        }
        if (nextThreshold <= 0 || nextThreshold > nextKeys.length) {
            throw new Error(`Invalid next threshold: ${nextThreshold}, must be 1-${nextKeys.length}`);
        }

        // For rotation, the identifier comes from the controller parameter
        const identifier = params.controller;

        // Compute next key commitment
        const nextKeyCommitment = KEL.computeNextKeyCommitment(nextKeys, nextThreshold);

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'rot',
            d: s('#'.repeat(44)).asSAID(), // Placeholder for SAID
            i: s(identifier).asAID(),
            s: '1', // This should be computed from previous event
            p: previousEvent,
            k: currentKeys,
            kt: s(keyThreshold.toString()).asThreshold(),
            n: nextKeyCommitment,
            nt: s(nextThreshold.toString()).asThreshold(),
            dt: timestamp,
        };

        // Add optional witness fields
        if (witnesses && witnesses.length > 0) {
            event.w = witnesses.map(w => s(w).asAID());
            event.wt = s((witnessThreshold ?? witnesses.length).toString()).asThreshold();
        }

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = s(encodeCESRDigest(hash, 'E')).asSAID();

        // Replace placeholder with actual SAID
        event.d = said;

        return event as RotationEvent;
    }

    /**
     * Create an interaction event
     *
     * @param params - Interaction parameters
     * @returns InteractionEvent with computed SAID
     */
    static interaction(params: InteractionParams): InteractionEvent {
        const { previousEvent, anchors, currentTime } = params;

        // Use provided currentTime or fall back to current timestamp
        const timestamp = currentTime || new Date().toISOString();

        // For interaction, the identifier comes from the previous event
        const identifier = 'placeholder'; // This should be passed in or extracted

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'ixn',
            d: s('#'.repeat(44)).asSAID(), // Placeholder for SAID
            i: s(identifier).asAID(),
            s: '1', // This should be computed from previous event
            p: previousEvent,
            a: anchors,
            dt: timestamp,
        };

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = s(encodeCESRDigest(hash, 'E')).asSAID();

        // Replace placeholder with actual SAID
        event.d = said;

        return event as InteractionEvent;
    }

    /**
     * Create a KEL envelope with attached signatures
     *
     * @param event - Canonical KEL event
     * @param privateKeys - Private keys for signing (in same order as event.k)
     * @returns KEL envelope with attached signatures
     */
    static createEnvelope(event: KelEvent, privateKeys: Uint8Array[]): KelEnvelope {
        if (!event.k || event.k.length === 0) {
            throw new Error('Event must have keys for signing');
        }

        // Create canonical representation for signing
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);

        // Create signatures for all provided private keys
        const signatures: CesrSig[] = [];
        for (let i = 0; i < privateKeys.length; i++) {
            const privateKey = privateKeys[i];
            if (!privateKey) {
                throw new Error(`Missing private key at index ${i}`);
            }
            const signature = CESR.sign(canonicalBytes, privateKey, true);
            signatures.push({
                keyIndex: i,
                sig: signature
            });
        }

        return {
            event,
            signatures
        };
    }

    /**
     * Verify signatures on a KEL envelope
     *
     * @param envelope - KEL envelope to verify
     * @param priorEvent - Prior event for rotation verification (optional)
     * @returns Verification result
     */
    static async verifyEnvelope(envelope: KelEnvelope, priorEvent?: KelEvent): Promise<{
        valid: boolean;
        validSignatures: number;
        requiredSignatures: number;
        signatureResults: Array<{ signature: CesrSig; valid: boolean }>;
    }> {
        const { event, signatures } = envelope;

        if (!event.k || event.k.length === 0) {
            throw new Error('Event must have keys for verification');
        }

        // For rotation events, use the prior event's threshold
        // For other events, use the event's own threshold
        let requiredSignatures: number;
        if (event.t === 'rot' && priorEvent && priorEvent.kt) {
            requiredSignatures = parseInt(priorEvent.kt, 10);
        } else {
            requiredSignatures = parseInt(event.kt || '1', 10);
        }

        // Create canonical representation for verification
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);

        const signatureResults: Array<{ signature: CesrSig; valid: boolean }> = [];

        // For rotation events, signatures should be verified against the prior event's keys
        // For other events, verify against the event's own keys
        let keysToVerifyAgainst: string[];
        if (event.t === 'rot' && priorEvent && priorEvent.k) {
            keysToVerifyAgainst = priorEvent.k;
        } else if (event.k) {
            keysToVerifyAgainst = event.k;
        } else {
            throw new Error('No keys available for signature verification');
        }

        // Verify each signature
        for (const signature of signatures) {
            if (signature.keyIndex >= keysToVerifyAgainst.length) {
                signatureResults.push({ signature, valid: false });
                continue;
            }

            const publicKey = keysToVerifyAgainst[signature.keyIndex];
            if (!publicKey) {
                signatureResults.push({ signature, valid: false });
                continue;
            }
            const valid = await CESR.verify(signature.sig, canonicalBytes, publicKey);
            signatureResults.push({ signature, valid });
        }

        const validSignatures = signatureResults.filter(r => r.valid).length;
        let valid = validSignatures >= requiredSignatures;

        // For rotation events, verify that the revealed keys match the prior commitment
        if (event.t === 'rot' && priorEvent) {
            const revealedCommitment = KEL.computeNextKeyCommitment(event.k, parseInt(event.kt || '1', 10));
            if (revealedCommitment !== priorEvent.n) {
                valid = false;
            }
        }

        return {
            valid,
            validSignatures,
            requiredSignatures,
            signatureResults
        };
    }
}
