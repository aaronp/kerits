import type { SAID, AID } from '../types';

/**
 * CESR signature attached to TEL events
 */
export interface CESRSignature {
    /** CESR-encoded signature */
    signature: string;
    /** Index of the public key this signature corresponds to */
    keyIndex: number;
    /** CESR-encoded public key */
    publicKey: string;
    /** Raw public key bytes (for verification when cesr-ts is not available) */
    rawPublicKey?: Uint8Array;
}

/**
 * TEL envelope containing the canonical event and attached signatures
 * This is the physical representation for transmission/storage
 */
export interface TelEnvelope {
    /** The canonical TEL event */
    event: TelEvent;
    /** Attached CESR signatures */
    signatures: CESRSignature[];
}

/**
 * TEL (Transaction Event Log) Type Definitions
 *
 * TELs are append-only sequences of events that represent the state changes
 * of a specific entity or process. Unlike KELs which manage key lifecycle,
 * TELs manage data lifecycle and state transitions.
 *
 * Key characteristics:
 * - Append-only: Events can only be added, never modified or deleted
 * - Conflict resolution: "Winner = highest sequence number"
 * - Anchored to KEL: TEL events are anchored to KEL interaction events
 * - Self-addressing: Each event has a SAID for integrity verification
 */

/**
 * TEL event types for different kinds of state changes
 */
export type TelEventType =
    | 'tcp' // Transaction inception (create new TEL)
    | 'txn' // Transaction event (state change)
    | 'tmb' // Tombstone event (mark as deleted/invalid)
    | 'tup' // Transaction update (replace previous state);

/**
 * TEL Event - A Transaction Event Log event
 *
 * TEL events follow a similar structure to KEL events but are focused on
 * data state management rather than key management. They are anchored to
 * KEL interaction events to provide cryptographic integrity.
 *
 * Field naming follows KERI's terse convention:
 * - v: version
 * - t: type (TEL event type)
 * - d: digest (SAID of this event)
 * - i: identifier (AID of the entity this TEL belongs to)
 * - s: sequence number (hexadecimal string)
 * - p: previous event digest (SAID of previous TEL event)
 * - a: anchors (SAIDs of KEL events that anchor this TEL event)
 * - e: event data (the actual state change data)
 * - k: signing keys (CESR-encoded public keys)
 * - kt: key threshold (number of signatures required)
 * - sig: signatures (CESR-encoded signatures)
 * - dt: timestamp (ISO 8601 format)
 */
/**
 * Canonical TEL event - contains only the structural and business data
 * Signing keys (k, kt) and signatures (sig) are resolved externally from KEL
 */
export type TelEvent = {
    /** Version string (e.g., "KERI10JSON0001aa_") */
    v: string;

    /** TEL event type */
    t: TelEventType;

    /** Digest - SAID of this TEL event (computed after all other fields) */
    d: SAID;

    /** Identifier - the AID this TEL belongs to */
    i: AID;

    /** Sequence number (hexadecimal string, e.g., "0", "1", "a") */
    s: string;

    /** Previous TEL event digest - for all events after inception */
    p?: SAID;

    /** Anchors - SAIDs of KEL events that anchor this TEL event */
    a: SAID[];

    /** Event data - the actual state change payload */
    e: any;

    /** Timestamp - ISO 8601 format */
    dt: string;
};

/**
 * TEL Inception Event - Creates a new TEL
 *
 * The inception event establishes a new TEL for tracking state changes
 * of a specific entity. It must be anchored to a KEL interaction event.
 */
export type TelInceptionEvent = TelEvent & {
    t: 'tcp';
    p: undefined; // No previous event for inception
};

/**
 * TEL Transaction Event - Represents a state change
 *
 * Transaction events contain the actual data changes and are the primary
 * mechanism for updating TEL state. They must be anchored to KEL events.
 */
export type TelTransactionEvent = TelEvent & {
    t: 'txn';
    p: SAID; // Must reference previous TEL event
};

/**
 * TEL Tombstone Event - Marks data as deleted/invalid
 *
 * Tombstone events don't contain data but mark previous events as invalid.
 * This provides a way to "delete" data while maintaining the append-only
 * property of TELs.
 */
export type TelTombstoneEvent = TelEvent & {
    t: 'tmb';
    p: SAID; // Must reference the TEL event being tombstoned
    e: undefined; // No event data for tombstones
};

/**
 * TEL Update Event - Replaces previous state
 *
 * Update events replace the state established by a previous transaction
 * event. This is useful for correcting errors or updating data while
 * maintaining the full history.
 */
export type TelUpdateEvent = TelEvent & {
    t: 'tup';
    p: SAID; // Must reference the TEL event being updated
};

/**
 * TEL Chain - Represents a complete TEL with all events
 *
 * A TEL chain contains all events for a specific entity, ordered by
 * sequence number. It provides methods for querying current state and
 * historical changes.
 */
export interface TelChain {
    /** The AID this TEL belongs to */
    readonly aid: AID;

    /** All events in this TEL, ordered by sequence number */
    readonly events: TelEvent[];

    /** Current state (derived from latest non-tombstoned events) */
    readonly currentState: TelStateData;

    /** Add a new event to this TEL */
    addEvent(event: TelEvent): Promise<void>;

    /** Get events by sequence number range */
    getEvents(from?: number, to?: number): TelEvent[];

    /** Get current state for a specific data type */
    getCurrentState<K extends keyof TelStateData>(dataType: K): TelStateData[K] | undefined;

    /** Get current profile data */
    getProfile(): ContactProfileData | undefined;

    /** Get current contact details */
    getDetails(): ContactDetailsData | undefined;

    /** Get current relationships */
    getRelationships(): ContactRelationshipData[];

    /** Get event history with detailed information */
    getEventHistory(): TelEventHistoryEntry[];

    /** Get event history for a specific data type */
    getEventHistoryForDataType(dataType: keyof TelStateData): TelEventHistoryEntry[];

    /** Verify TEL integrity with detailed results */
    verify(): Promise<TelValidationResult>;

    /** Get TEL chain summary */
    getSummary(): {
        aid: AID;
        eventCount: number;
        lastEventSaid: SAID | undefined;
        currentStateKeys: string[];
        isValid: boolean;
    };
}

/**
 * TEL Validation Error Types
 */
export type TelValidationError =
    | { type: 'invalid_said'; eventIndex: number; eventSaid: SAID; expectedSaid: SAID }
    | { type: 'invalid_sequence'; eventIndex: number; expectedSeq: number; actualSeq: number }
    | { type: 'invalid_previous_reference'; eventIndex: number; expectedPrevious: SAID; actualPrevious: SAID }
    | { type: 'missing_inception'; message: string }
    | { type: 'invalid_signature'; eventIndex: number; eventSaid: SAID; error: string }
    | { type: 'invalid_anchor'; eventIndex: number; anchorSaid: SAID; error: string }
    | { type: 'chain_break'; eventIndex: number; message: string };

/**
 * TEL Validation Result
 */
export interface TelValidationResult {
    /** Whether the TEL chain is valid */
    valid: boolean;
    /** Array of validation errors */
    errors: TelValidationError[];
    /** Summary of validation issues */
    summary: string;
}

/**
 * TEL Event History Entry
 */
export interface TelEventHistoryEntry {
    /** Event index in the chain */
    index: number;
    /** The TEL event */
    event: TelEvent;
    /** Event SAID */
    said: SAID;
    /** KEL events that anchor this TEL event */
    anchors: {
        said: SAID;
        kelEvent?: any; // KEL event data if available
    }[];
    /** Previous event SAID (if not inception) */
    previousEvent?: SAID;
    /** Raw event JSON for inspection */
    rawEvent: string;
    /** Attached signatures (if any) */
    signatures?: CESRSignature[];
    /** Controller state from KEL (resolved externally) */
    controllerState?: {
        keys: string[];
        keyThreshold: number;
        sequence: number;
        active: boolean;
    };
}


/**
 * TEL State Data Types
 */
export interface TelStateData {
    /** Profile data (name, avatar, etc.) */
    profile?: ContactProfileData;
    /** Contact details (email, phone, etc.) */
    details?: ContactDetailsData;
    /** Relationships (friends, groups, etc.) */
    relationships?: ContactRelationshipData[];
    /** Custom data by schema ID */
    [schemaId: string]: any;
}

/**
 * Contact Profile Data
 */
export interface ContactProfileData {
    name: string;
    avatar?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Contact Details Data
 */
export interface ContactDetailsData {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    [key: string]: any;
}

/**
 * Contact Relationship Data
 */
export interface ContactRelationshipData {
    type: 'friend' | 'colleague' | 'family' | 'group';
    targetAid: AID;
    groupId?: SAID;
    createdAt: string;
}

/**
 * TEL Storage - Interface for persisting TEL chains
 *
 * TEL storage handles the persistence and retrieval of TEL chains.
 * It must maintain the append-only property and provide efficient
 * querying capabilities.
 */
export interface TelStorage {
    /** Store a TEL event */
    storeEvent(event: TelEvent): Promise<void>;

    /** Retrieve a TEL chain by AID */
    getChain(aid: AID): Promise<TelChain | undefined>;

    /** Get all TEL chains */
    getAllChains(): Promise<TelChain[]>;

    /** Verify TEL chain integrity */
    verifyChain(aid: AID): Promise<TelValidationResult>;
}
