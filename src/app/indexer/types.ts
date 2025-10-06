/**
 * Indexer Types - Aggregated views of ACDC/TEL state
 */

import type { SAID, AID } from '../../storage/types.js';

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
