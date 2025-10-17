/**
 * Core KERI Type Definitions
 *
 * Canonical types for KERI primitives and events.
 * Single source of truth for type definitions.
 */

/**
 * SAID - Self-Addressing IDentifier
 *
 * A SAID is a cryptographic digest of the data it identifies.
 * The digest is embedded in the data itself, making it self-referential.
 *
 * Represented as a branded string type to prevent mixing with regular strings.
 */
export type SAID = string & { readonly __brand: 'SAID' }

/**
 * AID - Autonomic IDentifier
 *
 * A KERI identifier that controls its own key state.
 * Represented as a branded string type to prevent mixing with regular strings.
 */
export type AID = string & { readonly __brand: 'AID' }

/**
 * A user-friendly alias to key identifiers against
 */
export type ALIAS = string & { readonly __brand: 'ALIAS' }

/**
 * KeyPair represents a public/private key pair
 *
 * Used for signing and verifying KERI events.
 * Keys are represented as Uint8Array for cryptographic operations.
 */
export type KeyPair = {
  /** Public key (verifying key) */
  public: Uint8Array
  /** Private key (signing key) - MUST be kept secure */
  private: Uint8Array
}

/**
 * Event types for KEL (Key Event Log)
 */
export type KelEventType =
  | 'icp'  // Inception event (create identifier)
  | 'rot'  // Rotation event (rotate keys)
  | 'ixn'  // Interaction event (anchor data)
  | 'dip'  // Delegated inception
  | 'drt'  // Delegated rotation

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
 * - kt: key threshold
 * - k: keys
 * - n: next key digests
 * - bt: backer threshold (for witnesses)
 * - b: backers (witness identifiers)
 * - a: anchors (for interaction events)
 * - di: delegator identifier (for delegated events)
 */
export type KelEvent = {
  /** Version string (e.g., "KERI10JSON0001aa_") */
  v: string

  /** Event type */
  t: KelEventType

  /** Digest - SAID of this event (computed after all other fields) */
  d: SAID

  /** Identifier - the AID (Autonomic IDentifier) this event belongs to */
  i: string

  /** Sequence number (hexadecimal string, e.g., "0", "1", "a") */
  s: string

  /** Key threshold (signing threshold) */
  kt: string

  /** Current public keys (CESR encoded) */
  k: string[]

  /** Next key digests (commitment to next keys) */
  n: string[]

  /** Backer threshold (witness threshold) - optional */
  bt?: string

  /** Backers (witness identifiers) - optional */
  b?: string[]

  /** Anchors (SAIDs of anchored data) - for interaction events */
  a?: SAID[]

  /** Delegator identifier - for delegated events */
  di?: string

  /** Previous event digest - for all events after inception */
  p?: SAID
}

/**
 * InceptionEvent - Specialized type for inception events
 *
 * Inception events create a new identifier.
 * They must have sequence number "0" and no previous event.
 */
export type InceptionEvent = KelEvent & {
  t: 'icp'
  s: '0'
  p: undefined
}

/**
 * RotationEvent - Specialized type for rotation events
 *
 * Rotation events rotate the keys for an identifier.
 * They must have a previous event digest.
 */
export type RotationEvent = KelEvent & {
  t: 'rot'
  p: SAID
}

/**
 * InteractionEvent - Specialized type for interaction events
 *
 * Interaction events anchor data without rotating keys.
 * They must have a previous event digest and typically have anchors.
 */
export type InteractionEvent = KelEvent & {
  t: 'ixn'
  p: SAID
  a: SAID[]
}

/**
 * DelegatedInceptionEvent - Inception event for delegated identifier
 */
export type DelegatedInceptionEvent = InceptionEvent & {
  t: 'dip'
  di: string
}

/**
 * DelegatedRotationEvent - Rotation event for delegated identifier
 */
export type DelegatedRotationEvent = RotationEvent & {
  t: 'drt'
  di: string
}
