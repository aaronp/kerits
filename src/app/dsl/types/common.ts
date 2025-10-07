/**
 * Common types shared across all DSLs
 */

import type { Graph } from '../../../storage/types';

/**
 * JSONSchema7 - JSON Schema Draft 7 definition
 * Represents the structure of a credential schema
 */
export interface JSONSchema7 {
  /** Schema identifier (typically a URI or SAID) */
  $id?: string;
  /** JSON Schema version */
  $schema?: string;
  /** Schema title */
  title: string;
  /** Schema description */
  description?: string;
  /** Type of the schema (typically 'object' for credential schemas) */
  type?: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';
  /** Property definitions */
  properties: Record<string, JSONSchema7Property>;
  /** Required properties */
  required?: string[];
  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchema7Property;
}

/**
 * JSONSchema7Property - Property definition in JSON Schema
 */
export interface JSONSchema7Property {
  /** Property type */
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  /** Property description */
  description?: string;
  /** Enum values for restricted choices */
  enum?: any[];
  /** Default value */
  default?: any;
  /** Format hint (e.g., 'date-time', 'email', 'uri') */
  format?: string;
  /** Minimum value (for numbers) */
  minimum?: number;
  /** Maximum value (for numbers) */
  maximum?: number;
  /** Minimum length (for strings) */
  minLength?: number;
  /** Maximum length (for strings) */
  maxLength?: number;
  /** Pattern (regex for strings) */
  pattern?: string;
  /** Items schema (for arrays) */
  items?: JSONSchema7Property;
  /** Properties (for nested objects) */
  properties?: Record<string, JSONSchema7Property>;
  /** Required properties (for nested objects) */
  required?: string[];
}

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
  /** Parent registry ID for nested registries (optional) */
  parentRegistryId?: string;
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
  /** Schema definition (JSON Schema Draft 7) */
  schema: JSONSchema7;
}

/**
 * SchemaExport represents a schema in KERI SAD format with alias metadata
 * This is the standard format for importing/exporting schemas
 */
export interface SchemaExport {
  /** Human-readable alias */
  alias: string;
  /** Self-Addressing Data (SED) - schema definition with SAID in $id */
  sed: JSONSchema7 & {
    $id: string; // SAID (required in export format)
    $schema: string; // JSON Schema version (required in export format)
    type: 'object'; // Always object for KERI schemas
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
