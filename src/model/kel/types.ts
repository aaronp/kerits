import type { AID, SAID, Threshold } from '../types';
import type { CESRPublicKey } from '../cesr/cesr';

/**
 * KEL (Key Event Log) Type Definitions
 *
 * Types for KERI Key Event Logs following the KERI specification.
 */

/**
 * Event types for KEL (Key Event Log)
 */
export type KelEventType =
    | 'icp' // Inception event (create identifier)
    | 'rot' // Rotation event (rotate keys)
    | 'ixn' // Interaction event (anchor data)
    | 'dip' // Delegated inception
    | 'drt'; // Delegated rotation

/**
 * KelEvent - A Key Event Log event
 *
 * Core KERI event structure following the KERI spec.
 * All fields use KERI's terse field naming convention:
 * - v: version
 * - t: type
 * - d: digest (SAID of this event)
 * - i: identifier
 * - s: sequence number
 * - kt: key threshold (establishment events)
 * - k: keys (establishment events)
 * - n: next key commitment (establishment events)
 * - nt: next threshold (establishment events)
 * - w: witnesses (optional by policy)
 * - wt: witness threshold (optional by policy)
 * - a: anchors (interaction events)
 * - di: delegator identifier (delegated events)
 * - p: previous event digest
 * - dt: timestamp
 */
export type KelEvent = {
    /** Version string (e.g., "KERI10JSON0001aa_") */
    v: string;

    /** Event type */
    t: KelEventType;

    /** Digest - SAID of this event (computed after all other fields) */
    d: SAID;

    /** Identifier - the AID (Autonomic IDentifier) this event belongs to */
    i: AID;

    /** Sequence number (hexadecimal string, e.g., "0", "1", "a") */
    s: string;

    /** Previous event digest - for all events after inception */
    p?: SAID;

    /** Current public keys (CESR encoded) - establishment events only */
    k?: CESRPublicKey[];

    /** Key threshold (signing threshold) - establishment events only */
    kt?: Threshold;

    /** Next key commitment (SAID of next key set) - establishment events only */
    n?: SAID;

    /** Next threshold (for next rotation) - establishment events only */
    nt?: Threshold;

    /** Witnesses (witness identifiers) - optional by policy */
    w?: AID[];

    /** Witness threshold - optional by policy */
    wt?: Threshold;

    /** Anchors (SAIDs of anchored data) - interaction events */
    a?: SAID[];

    /** Delegator identifier - delegated events */
    di?: AID;

    /** Timestamp - ISO 8601 format */
    dt: string;
};

/**
 * InceptionEvent - Specialized type for inception events
 *
 * Inception events create a new identifier.
 * They must have sequence number "0", no previous event, and establishment fields.
 */
export type InceptionEvent = KelEvent & {
    t: 'icp';
    s: '0';
    p: undefined;
    k: CESRPublicKey[];
    kt: Threshold;
    n: SAID;
    nt: Threshold;
};

/**
 * RotationEvent - Specialized type for rotation events
 *
 * Rotation events rotate the keys for an identifier.
 * They must have a previous event digest and establishment fields.
 */
export type RotationEvent = KelEvent & {
    t: 'rot';
    p: SAID;
    k: CESRPublicKey[];
    kt: Threshold;
    n: SAID;
    nt: Threshold;
};

/**
 * InteractionEvent - Specialized type for interaction events
 *
 * Interaction events anchor data without rotating keys.
 * They must have a previous event digest and typically have anchors.
 */
export type InteractionEvent = KelEvent & {
    t: 'ixn';
    p: SAID;
    a: SAID[];
};

/**
 * DelegatedInceptionEvent - Inception event for delegated identifier
 */
export type DelegatedInceptionEvent = InceptionEvent & {
    t: 'dip';
    di: AID;
};

/**
 * DelegatedRotationEvent - Rotation event for delegated identifier
 */
export type DelegatedRotationEvent = RotationEvent & {
    t: 'drt';
    di: AID;
};

/**
 * Reference to which signer set a signature indexes into
 */
export type SignerSetRef =
    | { kind: 'prior'; sn: number }      // indexes refer to prior establishment key set (typical for rot/ixn)
    | { kind: 'current'; sn: number }    // indexes refer to this event's `k`
    | { kind: 'witness'; aid: AID };     // witness receipts (index into witness list)

/**
 * CESR signature with signer set reference
 */
export interface CesrSig {
    /** Index into the referenced signer set */
    keyIndex: number;
    /** CESR-encoded signature (qb64) */
    sig: string;
    /** Which set the index refers to (disambiguates "index into what?") - optional for backward compatibility */
    signerSet?: SignerSetRef;
}

/**
 * KEL envelope containing the canonical event and attached signatures
 * This is the physical representation for transmission/storage
 */
export interface KelEnvelope {
    /** The canonical KEL event (JSON) - convenient for app logic */
    event: KelEvent;
    /** CESR-serialized canonical bytes (qb64) - source of truth */
    eventCesr?: string;
    /** Controller signatures on the event SAID */
    signatures: CesrSig[];
    /** Witness receipts (optional) */
    receipts?: CesrSig[];
}

/**
 * Proof of a single signer's participation in an event
 */
export interface SignerProof {
    /** Index into the signer set */
    keyIndex: number;
    /** Which signer set this indexes into */
    signerSet: SignerSetRef;
    /** CESR-encoded signature (qb64) */
    signature: string;
    /** Resolved public key (qb64) */
    publicKey: string;
    /** Signer AID (controller or witness) */
    signerAid?: AID;
}

/**
 * Complete proof bundle for an event
 */
export interface EventProof {
    /** Event SAID */
    said: SAID;
    /** CESR-serialized event bytes (qb64) */
    eventCesr: string;
    /** Event JSON (for debugging/human readability) */
    event: KelEvent;
    /** Array of signer proofs */
    signers: SignerProof[];
}

/**
 * Result of verifying an event proof
 */
export interface VerificationResult {
    /** Whether the SAID matches the recomputed hash */
    saidMatches: boolean;
    /** Whether enough valid signatures were found */
    signaturesValid: boolean;
    /** Number of valid signatures */
    validCount: number;
    /** Number of required signatures (from threshold) */
    requiredCount: number;
    /** List of validation failures (if any) */
    failures?: string[];
}
