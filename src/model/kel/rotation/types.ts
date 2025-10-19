/**
 * Key rotation workflow types
 * 
 * This package provides the types and interfaces for multi-signature
 * key rotation workflows in KERI.
 */

import type { AID, SAID } from '../../io/types';
import type { KelEvent, KelEnvelope } from '../../kel/types';

export type RotationId = string;
export type RotationPhase =
    | "proposed"         // proposal created; messages sent
    | "collecting"       // waiting for cosigner approvals
    | "finalizable"      // threshold reached, ready to finalize+publish
    | "finalized"        // KEL rot event published (env written to store)
    | "failed"           // canceled/expired or rejected by policy
    | "aborted";         // explicitly aborted by initiator

export interface SignerRequirement {
    aid: AID;               // cosigner AID
    keyIndex: number;       // index in prior k[]
    required: boolean;      // true if contributes to kt
    signed: boolean;
    signature?: string;     // CESR signature if present
    seenAt?: string;        // ISO
}

export interface RotationStatus {
    id: RotationId;
    controller: AID;
    phase: RotationPhase;
    createdAt: string;
    deadline?: string;
    required: number;           // kt (decoded)
    requiredExternal?: number; // required - initiatorShare (persisted for UI/logic)
    totalKeys: number;          // |k|
    collected: number;          // valid signatures collected
    missing: number;            // requiredExternal - collected (lower-bounded at 0)
    signers: SignerRequirement[];
    priorEvent: SAID;           // prior KEL d (p)
    revealCommit: SAID;         // SAID({k: newK, kt: newKt}) == prior.n
    nextThreshold: number;      // nt
    rotEvent: KelEvent;         // the rotation event being signed
    finalEnvelope?: KelEnvelope; // the final published envelope (when finalized)
    finalEventSaid?: SAID;      // SAID of the final event (for UI)
    sigCount?: number;          // number of signatures in final envelope (for UI)
}

export interface RotationProgressEvent {
    type:
    | "signature:accepted"
    | "signature:rejected"
    | "signature:stored_nonrequired"
    | "status:phase"
    | "deadline:near"
    | "finalized"
    | "aborted"
    | "error"
    | "resend:proposal"
    | "send:error"
    | "send:ok"
    | "finalize:invalid";
    rotationId: RotationId;
    payload?: any;
}

export interface RotationHandle {
    /** resolve when required signatures are collected (or failure/abort) */
    awaitAll(opts?: { timeoutMs?: number; throwOnFail?: boolean }): Promise<RotationStatus>;

    /** current status snapshot (reads from store/index) */
    status(): Promise<RotationStatus>;

    /** cancel flow and notify participants */
    abort(reason?: string): Promise<void>;

    /** subscribe to progress events */
    onProgress(handler: (e: RotationProgressEvent) => void): () => void;

    /** force an attempt to finalize (useful after manual cosigner import) */
    finalizeNow(): Promise<RotationStatus>;

    /** re-broadcast proposal to missing cosigners */
    resend(): Promise<void>;
}

/**
 * Rotation message types
 */
export type RotationProposal = {
    typ: "keri.rot.proposal.v1";
    rotationId: RotationId;
    controller: AID;
    priorEvent: SAID;                 // prior d
    priorKeys: string[];              // prior k[]
    priorThreshold: number;           // decode(kt)
    reveal: {                         // what will be revealed on rot
        newKeys: string[];              // k'
        newThreshold: number;           // kt'
        nextCommit: { n: SAID; nt: number }; // for *next* rotation
    };
    canonicalDigest: SAID;            // SAID of the rot event to be signed
    // optional UX
    deadline?: string;
    note?: string;
};

export type RotationSign = {
    typ: "keri.rot.sign.v1";
    rotationId: RotationId;
    signer: AID;
    keyIndex: number;                 // index into prior k[]
    sig: string;                      // CESR signature over proposal hash or canonical rot-event body
    ok: boolean;                      // false to explicitly reject
    canonicalDigest?: SAID;           // optional: SAID of the rot event being signed
    reason?: string;
};

export type RotationFinalize = {
    typ: "keri.rot.finalize.v1";
    rotationId: RotationId;
    rotEventSaid: SAID;               // published KEL rot d
};

export type RotationAbort = {
    typ: "keri.rot.abort.v1";
    rotationId: RotationId;
    reason?: string;
};
