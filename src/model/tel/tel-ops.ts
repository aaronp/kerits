/**
 * TEL Operations - Pure functions for creating and manipulating Transaction Event Logs
 *
 * TELs (Transaction Event Logs) are append-only sequences of events that represent
 * state changes for specific entities. They are anchored to KEL events to provide
 * cryptographic integrity and are used for managing data lifecycle in KERI systems.
 *
 * Key principles:
 * - Append-only: Events can only be added, never modified or deleted
 * - Conflict resolution: "Winner = highest sequence number"
 * - Anchored to KEL: TEL events must be anchored to KEL interaction events
 * - Self-addressing: Each event has a SAID for integrity verification
 */

import { blake3 } from '@noble/hashes/blake3.js';
import { canonicalize } from 'json-canonicalize';
import type { SAID, AID } from '../types';
import { s } from '../string-ops';
import type {
    TelEvent,
    TelInceptionEvent,
    TelTransactionEvent,
    TelTombstoneEvent,
    TelUpdateEvent,
    TelChain,
    TelStorage,
    TelValidationResult,
    TelValidationError,
    TelEventHistoryEntry,
    TelStateData,
    ContactProfileData,
    ContactDetailsData,
    ContactRelationshipData,
    CESRSignature,
    TelEnvelope
} from './types';
import type { KelControllerState } from '../kel/kel-ops';
import { Data } from '../data/data';
import { CESR, type CESRKeypair } from '../cesr/cesr';

/**
 * CESR digest encoding helper for TEL events
 */
function encodeCESRDigest(hash: Uint8Array, code: string): SAID {
    const b64 = btoa(String.fromCharCode(...hash));
    return s(code + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')).asSAID();
}

/**
 * Convert sequence number to hexadecimal string
 */
function seqToHex(seq: number): string {
    return seq.toString(16);
}

/**
 * Convert hexadecimal string to sequence number
 */
function hexToSeq(hex: string): number {
    return parseInt(hex, 16);
}

/**
 * Deep merge objects for state updates
 */
function deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) return target;
    if (target === null || target === undefined) return source;

    if (typeof target !== 'object' || typeof source !== 'object') {
        return source;
    }

    if (Array.isArray(target) && Array.isArray(source)) {
        return source; // Replace arrays
    }

    if (Array.isArray(target) || Array.isArray(source)) {
        return source; // Replace if one is array
    }

    const result = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }

    return result;
}

/**
 * Parameters for creating a TEL inception event
 */
export interface TelInceptionParams {
    /** The AID this TEL belongs to */
    aid: AID;
    /** Initial event data */
    eventData: any;
    /** KEL event SAIDs that anchor this TEL inception */
    anchors: SAID[];
}

/**
 * Parameters for creating a TEL transaction event
 */
export interface TelTransactionParams {
    /** The AID this TEL belongs to */
    aid: AID;
    /** Previous TEL event SAID */
    previousEvent: SAID;
    /** Event data for this transaction */
    eventData: any;
    /** KEL event SAIDs that anchor this TEL event */
    anchors: SAID[];
    /** Sequence number (if not provided, will be computed) */
    sequence?: number;
}

/**
 * Parameters for creating a TEL tombstone event
 */
export interface TelTombstoneParams {
    /** The AID this TEL belongs to */
    aid: AID;
    /** Previous TEL event SAID to tombstone */
    previousEvent: SAID;
    /** KEL event SAIDs that anchor this TEL event */
    anchors: SAID[];
    /** Sequence number (if not provided, will be computed) */
    sequence?: number;
}

/**
 * TEL class - Static methods for creating and manipulating TEL events
 */
export class TEL {
    /**
     * Create a TEL envelope with attached signatures
     *
     * @param event - Canonical TEL event
     * @param controllerState - Controller state from KEL
     * @param privateKeys - Private keys for signing
     * @returns TEL envelope with attached signatures
     */
    static createEnvelope(
        event: TelEvent,
        controllerState: KelControllerState,
        privateKeys: Uint8Array[]
    ): TelEnvelope {
        // Validate we have enough private keys to meet threshold
        if (privateKeys.length < controllerState.keyThreshold) {
            throw new Error(`Insufficient private keys: need ${controllerState.keyThreshold}, got ${privateKeys.length}`);
        }

        // Create canonical representation for signing
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);

        // Create signatures for the required number of keys
        const signatures: CESRSignature[] = [];
        for (let i = 0; i < controllerState.keyThreshold; i++) {
            const privateKey = privateKeys[i];
            const publicKey = controllerState.keys[i];
            if (!privateKey || !publicKey) {
                throw new Error(`Missing private key or public key at index ${i}`);
            }
            const signature = CESR.sign(canonicalBytes, privateKey, true);
            signatures.push({
                signature,
                keyIndex: i,
                publicKey,
                rawPublicKey: controllerState.keys[i] ? undefined : undefined // We'll need to get this from the keypair
            });
        }

        return {
            event,
            signatures
        };
    }

    /**
     * Verify signatures on a TEL envelope
     *
     * @param envelope - TEL envelope to verify
     * @param controllerState - Controller state from KEL
     * @returns Verification result
     */
    static async verifyEnvelope(
        envelope: TelEnvelope,
        controllerState: KelControllerState,
        keypairs?: CESRKeypair[]
    ): Promise<{
        valid: boolean;
        validSignatures: number;
        requiredSignatures: number;
        signatureResults: Array<{ signature: CESRSignature; valid: boolean }>;
    }> {
        const { event, signatures } = envelope;
        const requiredSignatures = controllerState.keyThreshold;

        // Create canonical representation for verification
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);

        const signatureResults: Array<{ signature: CESRSignature; valid: boolean }> = [];

        // Verify each signature
        for (const signature of signatures) {
            let valid: boolean;

            // First verify the signature against the public key in the signature
            const signatureValid = await CESR.verify(signature.signature, canonicalBytes, signature.publicKey);

            // Then verify that the public key in the signature matches the controller state
            const keyMatchesControllerState = controllerState.keys.includes(signature.publicKey);

            // Both conditions must be true for the signature to be valid
            valid = signatureValid && keyMatchesControllerState;

            signatureResults.push({ signature, valid });
        }

        const validSignatures = signatureResults.filter(r => r.valid).length;
        const valid = validSignatures >= requiredSignatures;

        return {
            valid,
            validSignatures,
            requiredSignatures,
            signatureResults
        };
    }
    /**
     * Create a TEL inception event
     *
     * @param params - Inception parameters
     * @returns TelInceptionEvent with computed SAID
     */
    static inception(params: TelInceptionParams): TelInceptionEvent {
        const { aid, eventData, anchors } = params;

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'tcp',
            d: '#'.repeat(44), // Placeholder for SAID
            i: aid,
            s: '0', // Inception is always sequence 0
            a: anchors,
            e: eventData,
            dt: new Date().toISOString(),
        };

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = encodeCESRDigest(hash, 'E');

        // Replace placeholder with actual SAID
        event.d = said;

        return event as TelInceptionEvent;
    }

    /**
     * Create a TEL transaction event
     *
     * @param params - Transaction parameters
     * @returns TelTransactionEvent with computed SAID
     */
    static transaction(params: TelTransactionParams): TelTransactionEvent {
        const { aid, previousEvent, eventData, anchors, sequence } = params;

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'txn',
            d: '#'.repeat(44), // Placeholder for SAID
            i: aid,
            s: sequence !== undefined ? seqToHex(sequence) : '1', // Default to 1 if not provided
            p: previousEvent,
            a: anchors,
            e: eventData,
            dt: new Date().toISOString(),
        };

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = encodeCESRDigest(hash, 'E');

        // Replace placeholder with actual SAID
        event.d = said;

        return event as TelTransactionEvent;
    }

    /**
     * Create a TEL tombstone event
     *
     * @param params - Tombstone parameters
     * @returns TelTombstoneEvent with computed SAID
     */
    static tombstone(params: TelTombstoneParams): TelTombstoneEvent {
        const { aid, previousEvent, anchors, sequence } = params;

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'tmb',
            d: '#'.repeat(44), // Placeholder for SAID
            i: aid,
            s: sequence !== undefined ? seqToHex(sequence) : '1', // Default to 1 if not provided
            p: previousEvent,
            a: anchors,
            e: undefined, // No event data for tombstones
            dt: new Date().toISOString(),
        };

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = encodeCESRDigest(hash, 'E');

        // Replace placeholder with actual SAID
        event.d = said;

        return event as TelTombstoneEvent;
    }

    /**
     * Create a TEL update event
     *
     * @param params - Update parameters
     * @returns TelUpdateEvent with computed SAID
     */
    static update(params: TelTransactionParams): TelUpdateEvent {
        const { aid, previousEvent, eventData, anchors, sequence } = params;

        // Build event without SAID (use placeholder)
        const event: any = {
            v: 'KERI10JSON0001aa_',
            t: 'tup',
            d: '#'.repeat(44), // Placeholder for SAID
            i: aid,
            s: sequence !== undefined ? seqToHex(sequence) : '1', // Default to 1 if not provided
            p: previousEvent,
            a: anchors,
            e: eventData,
            dt: new Date().toISOString(),
        };

        // Compute SAID
        const canonical = canonicalize(event);
        const canonicalBytes = new TextEncoder().encode(canonical);
        const hash = blake3(canonicalBytes, { dkLen: 32 });
        const said = encodeCESRDigest(hash, 'E');

        // Replace placeholder with actual SAID
        event.d = said;

        return event as TelUpdateEvent;
    }

    /**
     * Verify a TEL event's SAID
     *
     * @param event - TEL event to verify
     * @returns true if SAID is valid
     */
    static verifyEvent(event: TelEvent): boolean {
        try {
            // Create a copy without the SAID for verification
            const eventCopy = { ...event };
            const originalSaid = eventCopy.d;
            eventCopy.d = s('#'.repeat(44)).asSAID(); // Placeholder

            // Compute expected SAID
            const canonical = canonicalize(eventCopy);
            const canonicalBytes = new TextEncoder().encode(canonical);
            const hash = blake3(canonicalBytes, { dkLen: 32 });
            const expectedSaid = encodeCESRDigest(hash, 'E');

            return expectedSaid === originalSaid;
        } catch {
            return false;
        }
    }

    /**
     * Verify a TEL event's SAID with detailed error information
     *
     * @param event - TEL event to verify
     * @param eventIndex - Index of the event in the chain
     * @returns Validation result with detailed error information
     */
    static verifyEventDetailed(event: TelEvent, eventIndex: number): { valid: boolean; error?: TelValidationError } {
        try {
            // Create a copy without the SAID for verification
            const eventCopy = { ...event };
            const originalSaid = eventCopy.d;
            eventCopy.d = s('#'.repeat(44)).asSAID(); // Placeholder

            // Compute expected SAID
            const canonical = canonicalize(eventCopy);
            const canonicalBytes = new TextEncoder().encode(canonical);
            const hash = blake3(canonicalBytes, { dkLen: 32 });
            const expectedSaid = encodeCESRDigest(hash, 'E');

            if (expectedSaid === originalSaid) {
                return { valid: true };
            } else {
                return {
                    valid: false,
                    error: {
                        type: 'invalid_said',
                        eventIndex,
                        eventSaid: originalSaid,
                        expectedSaid
                    }
                };
            }
        } catch (error) {
            return {
                valid: false,
                error: {
                    type: 'invalid_said',
                    eventIndex,
                    eventSaid: event.d,
                    expectedSaid: s('').asSAID()
                }
            };
        }
    }


    /**
     * Verify a TEL chain's integrity
     *
     * @param events - Array of TEL events in sequence order
     * @returns true if chain is valid
     */
    static verifyChain(events: TelEvent[]): boolean {
        const result = TEL.verifyChainDetailed(events);
        return result.valid;
    }

    /**
     * Verify a TEL chain's integrity with detailed validation results
     *
     * @param events - Array of TEL events in sequence order
     * @returns Detailed validation result
     */
    static verifyChainDetailed(events: TelEvent[]): TelValidationResult {
        const errors: TelValidationError[] = [];

        if (events.length === 0) {
            return {
                valid: true,
                errors: [],
                summary: 'Empty TEL chain is valid'
            };
        }

        // Check for inception event
        if (events[0]?.t !== 'tcp') {
            errors.push({
                type: 'missing_inception',
                message: 'First event must be a TEL inception event (tcp)'
            });
        }

        // Verify all events have valid SAIDs and sequence continuity
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (!event) {
                errors.push({
                    type: 'chain_break',
                    eventIndex: i,
                    message: 'Missing event at index ' + i
                });
                continue;
            }

            // Verify SAID
            const saidResult = TEL.verifyEventDetailed(event, i);
            if (!saidResult.valid && saidResult.error) {
                errors.push(saidResult.error);
            }

            // Verify sequence number
            const expectedSeq = i;
            const actualSeq = hexToSeq(event.s);
            if (actualSeq !== expectedSeq) {
                errors.push({
                    type: 'invalid_sequence',
                    eventIndex: i,
                    expectedSeq,
                    actualSeq
                });
            }

            // Verify previous event reference (except for inception)
            if (i > 0) {
                const prevEvent = events[i - 1];
                if (!prevEvent) {
                    errors.push({
                        type: 'chain_break',
                        eventIndex: i,
                        message: 'Previous event missing at index ' + (i - 1)
                    });
                } else if (event.p !== prevEvent.d) {
                    errors.push({
                        type: 'invalid_previous_reference',
                        eventIndex: i,
                        expectedPrevious: prevEvent.d,
                        actualPrevious: event.p || s('').asSAID()
                    });
                }
            } else {
                // Inception event should not have previous event
                if (event.p !== undefined) {
                    errors.push({
                        type: 'invalid_previous_reference',
                        eventIndex: i,
                        expectedPrevious: s('').asSAID(),
                        actualPrevious: event.p
                    });
                }
            }
        }

        const valid = errors.length === 0;
        const summary = valid
            ? `TEL chain is valid with ${events.length} events`
            : `TEL chain has ${errors.length} validation errors`;

        return {
            valid,
            errors,
            summary
        };
    }

    /**
     * Compute current state from TEL events
     *
     * @param events - Array of TEL events in sequence order
     * @returns Current state object with proper typing
     */
    static computeCurrentState(events: TelEvent[]): TelStateData {
        if (events.length === 0) return {};

        // Start with inception event data
        let state: TelStateData = events[0]?.e || {};

        // Apply subsequent events, respecting tombstones
        const tombstonedEvents = new Set<string>();

        for (let i = 1; i < events.length; i++) {
            const event = events[i]!;

            if (event.t === 'tmb') {
                // Mark the referenced event as tombstoned
                if (event.p) {
                    tombstonedEvents.add(event.p);
                }
            } else if (event.t === 'txn' || event.t === 'tup') {
                // Apply transaction or update data with deep merge for nested objects
                if (event.e) {
                    state = deepMerge(state, event.e);
                }
            }
        }

        return state;
    }

    /**
     * Create event history entries from TEL events
     *
     * @param events - Array of TEL events
     * @param envelopes - Optional array of TEL envelopes with signatures
     * @returns Array of event history entries
     */
    static createEventHistory(events: TelEvent[], envelopes?: TelEnvelope[]): TelEventHistoryEntry[] {
        return events.map((event, index) => {
            // Find corresponding envelope if provided
            const envelope = envelopes?.find(env => env.event.d === event.d);

            return {
                index,
                event,
                said: event.d,
                anchors: event.a.map(said => ({ said })),
                previousEvent: event.p,
                rawEvent: JSON.stringify(event, null, 2),
                signatures: envelope?.signatures,
                controllerState: undefined // Will be resolved externally from KEL
            };
        });
    }

    /**
     * Create a TEL chain from events
     *
     * @param aid - The AID this TEL belongs to
     * @param events - Array of TEL events
     * @returns TelChain instance
     */
    static createChain(aid: AID, events: TelEvent[]): TelChain {
        // Sort events by sequence number
        const sortedEvents = [...events].sort((a, b) => hexToSeq(a.s) - hexToSeq(b.s));

        return {
            aid,
            events: sortedEvents,
            currentState: TEL.computeCurrentState(sortedEvents),

            async addEvent(event: TelEvent): Promise<void> {
                // Verify the event belongs to this AID
                if (event.i !== aid) {
                    throw new Error('Event AID does not match chain AID');
                }

                // Verify sequence number is correct
                const expectedSeq = sortedEvents.length;
                const actualSeq = hexToSeq(event.s);
                if (actualSeq !== expectedSeq) {
                    throw new Error(`Invalid sequence number: expected ${expectedSeq}, got ${actualSeq}`);
                }

                // Add event and recompute state
                sortedEvents.push(event);
                (this as any).currentState = TEL.computeCurrentState(sortedEvents);
            },

            getEvents(from?: number, to?: number): TelEvent[] {
                const start = from || 0;
                const end = to || sortedEvents.length;
                return sortedEvents.slice(start, end);
            },

            getCurrentState<K extends keyof TelStateData>(dataType: K): TelStateData[K] | undefined {
                return (this as any).currentState[dataType];
            },

            getProfile(): ContactProfileData | undefined {
                return (this as any).currentState.profile;
            },

            getDetails(): ContactDetailsData | undefined {
                return (this as any).currentState.details;
            },

            getRelationships(): ContactRelationshipData[] {
                return (this as any).currentState.relationships || [];
            },

            getEventHistory(): TelEventHistoryEntry[] {
                return TEL.createEventHistory(sortedEvents);
            },

            getEventHistoryForDataType(dataType: keyof TelStateData): TelEventHistoryEntry[] {
                // Filter events that contain data for the specified type
                return TEL.createEventHistory(sortedEvents).filter(entry => {
                    const eventData = entry.event.e;
                    return eventData && eventData[dataType] !== undefined;
                });
            },

            async verify(): Promise<TelValidationResult> {
                return TEL.verifyChainDetailed(sortedEvents);
            },

            getSummary() {
                const validation = TEL.verifyChainDetailed(sortedEvents);
                return {
                    aid,
                    eventCount: sortedEvents.length,
                    lastEventSaid: sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1]?.d : undefined,
                    currentStateKeys: Object.keys((this as any).currentState),
                    isValid: validation.valid
                };
            }
        };
    }
}
