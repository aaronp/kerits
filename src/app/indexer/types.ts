/**
 * Indexer Types - Aggregated views of ACDC/TEL state
 *
 * Includes both query-time indexer types (legacy) and write-time indexer types (new)
 */

import type { SAID, AID, EventType } from '../../storage/types.js';
import type { EdgeBlock } from '../dsl/types/common.js';

// ========================================
// WRITE-TIME INDEXER TYPES (New)
// ========================================

/**
 * Signature information for an event
 * Supports both single-sig and multi-sig identifiers
 */
export interface EventSignature {
  publicKey: string;      // ED25519 public key (CESR-encoded verfer)
  signature: string;      // ED25519 signature (CESR-encoded)
  signingIndex?: number;  // Index in multi-sig setup (0 for single-sig)
}

/**
 * Reference to another KERI entity
 */
export interface EventReference {
  type: 'KEL' | 'TEL' | 'ACDC';
  id: SAID;                              // Target SAID
  relationship: ReferenceRelationship;   // Type of relationship
}

export type ReferenceRelationship =
  // KEL references
  | 'issuer-kel'                 // TEL → KEL (issuer)
  | 'signer-kel'                 // Any event → KEL (who signed)

  // TEL references
  | 'parent-registry'            // TEL → TEL (child → parent)
  | 'child-registry-created'     // TEL → TEL (parent → child)
  | 'credential-registry'        // ACDC → TEL (which registry issued it)

  // ACDC references (edges)
  | 'edge'                       // ACDC → ACDC (credential chain edge)
  | string;                      // Custom edge names (e.g., 'edge:parentCredential')

/**
 * KEL event entry in write-time indexer
 */
export interface KELEntry {
  // Identity & signatures
  eventId: SAID;                 // Event SAID (d field)
  eventType: 'icp' | 'rot' | 'ixn';
  signers: EventSignature[];     // At least 1 signer required

  // Temporal ordering
  sequenceNumber: number;        // Sequence number (s field)
  timestamp: string;             // ISO timestamp (dt field)
  priorEventId?: SAID;           // Prior event SAID (p field)

  // Event data
  format: 'cesr';                // Always CESR (matches KERI storage)
  eventData: string;             // CESR-encoded event as text

  // References
  references: EventReference[];  // Links to other entities

  // KEL-specific fields
  currentKeys?: string[];        // Current key set (k field)
  nextKeyDigests?: string[];     // Next key digests (n field)
  witnesses?: string[];          // Witness list (for rot events)
}

/**
 * TEL event entry in write-time indexer
 */
export interface TELEntry {
  // Identity & signatures
  eventId: SAID;                 // Event SAID (d field)
  eventType: 'vcp' | 'iss' | 'rev' | 'ixn';
  signers: EventSignature[];     // At least 1 signer required

  // Temporal ordering
  sequenceNumber: number;        // Sequence number (s field)
  timestamp: string;             // ISO timestamp (dt field)
  priorEventId?: SAID;           // Prior event SAID (for ixn events)

  // Event data
  format: 'cesr';                // Always CESR
  eventData: string;             // CESR-encoded event as text

  // References
  references: EventReference[];  // Links to KELs, TELs, ACDCs

  // TEL-specific fields
  registryId?: SAID;             // Registry identifier (ri field)
  acdcSaid?: SAID;               // Credential SAID (for iss/rev events)
  backers?: string[];            // Backer AIDs (for vcp events)

  // Registry hierarchy (for vcp/ixn events)
  parentRegistryId?: SAID;       // Parent registry (for nested registries)
  childRegistryId?: SAID;        // Child registry (when creating nested)
}

/**
 * Complete indexer state (export format)
 */
export interface IndexerState {
  version: string;               // Indexer schema version (e.g., "1.0.0")
  generatedAt: string;           // ISO timestamp of export

  // Event logs
  kels: {
    [kelSAID: string]: KELEntry[];
  };

  tels: {
    [telSAID: string]: TELEntry[];
  };

  // Bidirectional alias mappings
  aliasById: {
    schemas: { [SAID: string]: string };
    KELs: { [SAID: string]: string };
    TELs: { [SAID: string]: string };
    ACDCs?: { [SAID: string]: string };  // Optional: credential aliases
  };

  idsByAlias: {
    schemas: { [alias: string]: SAID };
    KELs: { [alias: string]: SAID };
    TELs: { [alias: string]: SAID };
    ACDCs?: { [alias: string]: SAID };   // Optional: credential aliases
  };
}

/**
 * Integrity check report
 */
export interface IntegrityReport {
  valid: boolean;
  timestamp: string;

  // Overall statistics
  stats: {
    totalKelEvents: number;
    totalTelEvents: number;
    eventsChecked: number;
    errorsFound: number;
  };

  // Detailed errors (if any)
  errors: IntegrityError[];
}

export interface IntegrityError {
  type: 'missing-signature' | 'invalid-signature' | 'missing-publickey'
       | 'event-mismatch' | 'missing-event' | 'corrupted-data';
  eventId?: SAID;
  kelOrTelId?: SAID;
  message: string;
  details?: any;
}

/**
 * Registry hierarchy node (for graph traversal)
 */
export interface RegistryNode {
  registryId: SAID;
  alias?: string;
  parentRegistryId?: SAID;
  childRegistries: RegistryNode[];
  credentials: {
    credentialId: SAID;
    alias?: string;
    status: 'issued' | 'revoked';
  }[];
}

// ========================================
// QUERY-TIME INDEXER TYPES (Legacy)
// ========================================

/**
 * Schema usage tracking
 */
export interface SchemaUsage {
  schemaSaid: SAID;             // Schema identifier
  firstUsedAt: string;          // When first referenced
  eventSaid: SAID;              // Event that introduced it
}

/**
 * Counterparty tracking
 */
export interface CounterpartyInfo {
  aid: AID;                     // Counterparty AID
  role: 'issuer' | 'holder' | 'backer' | 'endorser' | 'witness';
  firstInteractionAt: string;   // When they first appeared
  eventSaids: SAID[];           // Events they participated in
}

/**
 * TEL event summary (for history view)
 */
export interface TELEventSummary {
  eventSaid: SAID;
  eventType: 'vcp' | 'iss' | 'rev' | 'ixn' | 'vrt';
  timestamp: string;
  sequenceNumber: number;
  actor?: AID;                  // Who performed the action
  summary: string;              // Human-readable description
}

/**
 * Aggregated ACDC state from TEL chain
 */
export interface IndexedACDC {
  // Identity
  credentialId: SAID;           // ACDC SAID
  registryId: SAID;             // Registry identifier

  // Issuance info
  issuerAid: AID;               // Who issued
  holderAid?: AID;              // Who holds (recipient)
  issuedAt: string;             // ISO timestamp from iss event
  issuanceEventSaid: SAID;      // iss event SAID

  // Schema info
  schemas: SchemaUsage[];       // All schemas referenced

  // Current state
  status: 'issued' | 'revoked'; // Current status
  revokedAt?: string;           // ISO timestamp if revoked
  revocationEventSaid?: SAID;   // rev event SAID if revoked

  // Credential data
  latestData: Record<string, any>; // Current attribute values (from a.d in ACDC)

  // Edge relationships
  edges: Record<string, EdgeBlock>; // Edge blocks from this ACDC to others
  linkedTo: SAID[];                 // ACDCs this credential links to (from edges)
  linkedFrom: SAID[];               // ACDCs that link to this credential

  // Interaction history
  counterparties: CounterpartyInfo[]; // All parties in TEL chain
  telEvents: TELEventSummary[];      // Summarized TEL history
}

/**
 * Registry-level index
 */
export interface IndexedRegistry {
  registryId: SAID;
  issuerAid: AID;
  inceptionAt: string;
  backers: AID[];

  // Aggregated stats
  credentialCount: number;
  issuedCount: number;
  revokedCount: number;

  // Credentials in this registry
  credentials: IndexedACDC[];
}
