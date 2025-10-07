/**
 * Common types shared across all DSLs
 */

import type { Graph } from '../../../storage/types';

/**
 * Account represents a KERI identifier with human-friendly metadata
 */
export interface Account {
  /** Human-readable alias */
  alias: string;
  /** KERI AID (Autonomic Identifier) */
  aid: string;
  /** Public key in CESR format */
  verfer: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Registry represents a TEL credential registry
 */
export interface Registry {
  /** Human-readable alias */
  alias: string;
  /** Registry identifier (SAID) */
  registryId: string;
  /** Issuer AID */
  issuerAid: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * ACDC represents a verifiable credential
 */
export interface ACDC {
  /** Human-readable alias (optional) */
  alias?: string;
  /** Credential identifier (SAID) */
  credentialId: string;
  /** Registry identifier */
  registryId: string;
  /** Schema identifier */
  schemaId: string;
  /** Issuer AID */
  issuerAid: string;
  /** Holder AID */
  holderAid: string;
  /** Credential data */
  data: Record<string, any>;
  /** Issuance timestamp */
  issuedAt: string;
}

/**
 * Schema represents a credential schema
 */
export interface Schema {
  /** Human-readable alias */
  alias: string;
  /** Schema identifier (SAID) */
  schemaId: string;
  /** Schema SAID (alias for schemaId for API consistency) */
  schemaSaid: string;
  /** Schema definition */
  schema: {
    title: string;
    description?: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * SchemaExport represents a schema in KERI SAD format with alias metadata
 * This is the standard format for importing/exporting schemas
 */
export interface SchemaExport {
  /** Human-readable alias */
  alias: string;
  /** Self-Addressing Data (SED) - schema definition with SAID in $id */
  sed: {
    $id: string; // SAID
    $schema: string;
    title: string;
    type: 'object';
    properties: Record<string, any>;
    description?: string;
    required?: string[];
  };
  /** Schema SAID (redundant with sed.$id but part of standard format) */
  said: string;
}

/**
 * Contact represents a witness or other KERI participant
 */
export interface Contact {
  /** Human-readable alias */
  alias: string;
  /** Contact's AID */
  aid: string;
  /** Optional metadata */
  metadata?: {
    name?: string;
    role?: string;
    endpoint?: string;
  };
  /** When contact was added */
  addedAt: string;
}

/**
 * Credential status information
 */
export interface CredentialStatus {
  /** Whether the credential has been revoked */
  revoked: boolean;
  /** The status as a string */
  status: 'issued' | 'revoked' | 'expired';
}

/**
 * Mnemonic seed phrase (24 words for 256-bit entropy)
 */
/** 24-word BIP39-style mnemonic as space-separated string */
export type Mnemonic = string;

/**
 * Options for graph building
 */
export interface GraphOptions {
  /** Limit number of nodes */
  limit?: number;
  /** Include only specific scopes */
  scopeAliases?: string[];
}

/**
 * KEL event metadata
 */
export interface KelEvent {
  t: string;  // Event type
  d: string;  // SAID
  i?: string; // AID
  s?: string; // Sequence
  p?: string; // Prior
  [key: string]: any;
}

/**
 * TEL event metadata
 */
export interface TelEvent {
  t: string;  // Event type
  d: string;  // SAID
  ri?: string; // Registry ID
  s?: string;  // Sequence
  [key: string]: any;
}

/**
 * Options for creating a registry
 */
export interface RegistryOptions {
  /** Backers (optional witnesses for registry) */
  backers?: string[];
  /** Nonce for registry inception */
  nonce?: string;
}

/**
 * Parameters for issuing a credential
 */
export interface IssueParams {
  /** Schema alias or SAID */
  schema: string;
  /** Holder AID or alias */
  holder: string;
  /** Credential data matching schema */
  data: Record<string, any>;
  /** Optional alias for the credential */
  alias?: string;
}
