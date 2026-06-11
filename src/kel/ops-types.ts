/**
 * Types for KELOps — pure KEL interpretation and validation.
 */

import type { AID, CesrDigest, PublicKey, SAID, Threshold } from '../common/types.js';
import type { DipEvent, DrtEvent, IcpEvent, IxnEvent, KSN, RotEvent } from './types.js';
import type { EventValidationDetail, ValidationError } from './validation.js';

/** A typed reference to a specific event in a KEL. */
export interface EventRef<T = any> {
  event: T;
  index: number;
  said: SAID;
}

/** Union of all establishment event types. */
export type EstablishmentEvent = IcpEvent | RotEvent | DipEvent | DrtEvent;

/** Key set from the most recent establishment event. */
export interface CurrentKeySet {
  kt: Threshold;
  k: string[];
  nt: Threshold;
  n: string[];
  from: EstablishmentEvent;
  index: number;
}

/** Next key commitment from a previous establishment event. */
export interface PreviousNextKeyCommitment {
  threshold: Threshold;
  digests: string[];
  establishment: EstablishmentEvent;
  establishmentIndex: number;
}

/**
 * Pure synchronous read surface over a materialised KEL.
 * Constructed via `KELOps.forKEL(aid, events)`.
 */
export interface KELView {
  head(): EventRef | undefined;
  inception(): EventRef<IcpEvent | DipEvent> | undefined;
  ksn(): KSN | undefined;
  eventsByType(type: string): EventRef[];
  eventAtSequence(sn: number): EventRef | undefined;
  length(): number;
  isEmpty(): boolean;
  lastEstablishment(): EventRef<EstablishmentEvent> | undefined;
  currentKeySet(): CurrentKeySet | undefined;
  previousNextKeyCommitment(): PreviousNextKeyCommitment | undefined;
  interactions(): EventRef<IxnEvent>[];
  bySAID(said: SAID): EventRef | undefined;
}

/** Result of KELOps.validateAppend — domain errors only. */
export type ValidateAppendResult =
  | { ok: true; validation: EventValidationDetail }
  | { ok: false; errors: ValidationError[]; validation: EventValidationDetail };

/** Input for matchKeyRevelation. */
export interface MatchKeyRevelationInput {
  priorN: string[];
  priorNt: Threshold;
  proposedK: string[];
}

/** Result of matchKeyRevelation. */
export interface MatchKeyRevelationResult {
  revealed: { kIndex: number; nIndex: number }[];
  augmented: number[];
  priorNtSatisfied: boolean;
  errors: string[];
}

// --- Controller signature validation ---

export type ValidateControllerSignatureResult =
  | { ok: true }
  | { ok: false; errors: ControllerSignatureValidationError[] };

export type ControllerSignatureValidationError = {
  code: 'KEY_INDEX_OUT_OF_RANGE' | 'SIGNATURE_INVALID' | 'DUPLICATE_SIGNATURE';
  message: string;
};

// --- Key state extraction (from KEL verification) ---

export type VerifiedKeyState = {
  aid: AID;
  seqNo: number;
  digest: string;
  currentKeys: PublicKey[];
  threshold: Threshold;
  nextKeyDigests: CesrDigest[];
};

export type KeyStateError =
  | { kind: 'missing-inception' }
  | { kind: 'broken-chain'; seqNo: number; reason: string }
  | { kind: 'invalid-signature'; seqNo: number }
  | { kind: 'malformed-event'; reason: string }
  | { kind: 'kel-rollback'; existingSeqNo: number; newSeqNo: number }
  | { kind: 'kel-fork'; seqNo: number; existingDigest: string; newDigest: string }
  | { kind: 'prior-digest-mismatch'; expected: string; actual: string }
  | { kind: 'aid-mismatch'; expected: string; actual: string };

export type KeyStateResult = { ok: true; keyState: VerifiedKeyState } | { ok: false; error: KeyStateError };
