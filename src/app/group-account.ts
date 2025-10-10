/**
 * Group Multi-Signature Account Support
 *
 * Implementation of KERI group identifiers with partial signing coordination.
 * Based on keripy's GroupHab and Counselor classes.
 *
 * Architecture:
 * - GroupAccount: Multi-signature identifier with coordinated key management
 * - Partial signing: Members independently sign, events collected via escrow
 * - Counselor: Coordinates 3-stage escrow processing:
 *   1. Partial signed events (gpse) - collect member signatures
 *   2. Delegated events (gdee) - process delegation anchoring
 *   3. Partial witnessed (gpwe) - collect witness receipts
 */

import type { InceptionEvent } from '../incept';
import type { RotationEvent } from '../rotate';
import type { Threshold } from '../tholder';

/**
 * Group identifier configuration
 */
export interface GroupConfig {
  /** Local member's identifier prefix */
  mhab: string;

  /** Signing member identifiers (ordered list) */
  smids: string[];

  /** Rotating member identifiers (optional, defaults to smids) */
  rmids?: string[];

  /** Delegation anchor (optional, for delegated groups) */
  delpre?: string;
}

/**
 * Group account state
 *
 * Extends basic account with multi-sig coordination state
 */
export interface GroupAccount {
  /** Group identifier prefix */
  pre: string;

  /** Current sequence number */
  sn: number;

  /** Signing member identifiers */
  smids: string[];

  /** Rotating member identifiers */
  rmids: string[];

  /** Local member's identifier */
  mhab: string;

  /** Current signing threshold */
  kt: Threshold;

  /** Current signing keys */
  k: string[];

  /** Next signing threshold */
  nt: Threshold;

  /** Next key digests */
  n: string[];

  /** Delegation prefix (if delegated) */
  delpre?: string;

  /** Witness threshold */
  bt: string;

  /** Witness identifiers */
  b: string[];
}

/**
 * Partially signed event
 *
 * Represents an event that has collected some but not all required signatures
 */
export interface PartiallySignedEvent {
  /** Serialized event */
  raw: string;

  /** Event SAID */
  said: string;

  /** Sequence number */
  sn: number;

  /** Event type */
  t: 'icp' | 'rot' | 'ixn' | 'dip' | 'drt';

  /** Collected signatures (indexed by member identifier) */
  sigs: Map<string, string[]>;

  /** Collected receipts (indexed by witness identifier) */
  receipts?: Map<string, string>;

  /** Required signature count */
  required: number;

  /** Timestamp when first signature received */
  receivedAt: number;
}

/**
 * Partial signing state
 *
 * Tagged union representing the current state of a partially signed event
 */
export type PartialSigningState =
  | { stage: 'collecting'; event: PartiallySignedEvent }
  | { stage: 'delegating'; event: PartiallySignedEvent; anchor: string }
  | { stage: 'witnessing'; event: PartiallySignedEvent }
  | { stage: 'completed'; event: PartiallySignedEvent }
  | { stage: 'failed'; event: PartiallySignedEvent; reason: string };

/**
 * Group inception options
 *
 * Options for creating a new group identifier
 */
export interface GroupInceptOptions {
  /** Signing member identifiers */
  smids: string[];

  /** Rotating member identifiers (optional, defaults to smids) */
  rmids?: string[];

  /** Local member's identifier */
  mhab: string;

  /** Initial signing keys from all members */
  keys: string[];

  /** Next key digests from all members */
  ndigs?: string[];

  /** Signing threshold */
  isith?: Threshold;

  /** Next threshold */
  nsith?: Threshold;

  /** Witness configuration */
  witnesses?: {
    /** Witness identifiers */
    b: string[];
    /** Witness threshold */
    bt: number;
  };

  /** Delegation anchor (for delegated groups) */
  delpre?: string;
}

/**
 * Group rotation options
 */
export interface GroupRotateOptions {
  /** Group identifier prefix */
  pre: string;

  /** New signing keys from all members */
  keys: string[];

  /** Previous event digest */
  dig: string;

  /** Sequence number (optional, will increment from current) */
  sn?: number;

  /** New signing threshold */
  isith?: Threshold;

  /** New next key digests */
  ndigs?: string[];

  /** New next threshold */
  nsith?: Threshold;

  /** New witness configuration (optional) */
  witnesses?: {
    /** Added witness identifiers */
    ba: string[];
    /** Removed witness identifiers */
    br: string[];
    /** New witness threshold */
    bt: number;
  };
}

/**
 * Exchange message for group coordination
 *
 * Used for peer-to-peer exchange of partial signatures and receipts
 */
export interface ExchangeMessage {
  /** Message type */
  t: 'exn';

  /** Route/topic */
  r: string;

  /** Payload */
  a: {
    /** Event being signed */
    e?: {
      /** Event SAID */
      d: string;
      /** Serialized event */
      raw: string;
    };

    /** Signature from sender */
    s?: string[];

    /** Receipt from witness */
    receipt?: string;
  };

  /** Sender identifier */
  i: string;

  /** Timestamp */
  dt: string;
}

/**
 * Group escrow storage interface
 *
 * Stores partially signed events awaiting completion
 */
export interface GroupEscrowStore {
  /** Store partially signed event */
  putPartialSigned(said: string, event: PartiallySignedEvent): Promise<void>;

  /** Retrieve partially signed event */
  getPartialSigned(said: string): Promise<PartiallySignedEvent | null>;

  /** List all partially signed events */
  listPartialSigned(): Promise<PartiallySignedEvent[]>;

  /** Remove completed event from escrow */
  removePartialSigned(said: string): Promise<void>;

  /** Store delegation escrow */
  putDelegatee(said: string, event: PartiallySignedEvent): Promise<void>;

  /** Retrieve delegation escrow */
  getDelegatee(said: string): Promise<PartiallySignedEvent | null>;

  /** Store partial witness escrow */
  putPartialWitness(said: string, event: PartiallySignedEvent): Promise<void>;

  /** Retrieve partial witness escrow */
  getPartialWitness(said: string): Promise<PartiallySignedEvent | null>;

  /** Store completed group event */
  putCompleted(said: string, event: PartiallySignedEvent): Promise<void>;
}
