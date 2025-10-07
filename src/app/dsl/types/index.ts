/**
 * DSL Type Definitions
 */

export * from './common';
export * from './sync';
export * from './contact-sync';

// Re-export indexer types for convenience
export type { IndexedRegistry, IndexedACDC, SchemaUsage, CounterpartyInfo, TELEventSummary } from '../../indexer/types';

import type { KerStore } from '../../../storage/types';

import type {
  Account,
  Registry,
  ACDC,
  Schema,
  SchemaExport,
  Contact,
  Mnemonic,
  KelEvent,
  TelEvent,
  RegistryOptions,
  IssueParams,
  CredentialStatus,
  JSONSchema7,
  JSONSchema7Property,
} from './common';
import type { ExportDSL, ImportDSL } from './sync';
import type { ContactSyncDSL } from './contact-sync';
import type { IndexedRegistry, IndexedACDC, SchemaUsage, CounterpartyInfo, TELEventSummary } from '../../indexer/types';

/**
 * AccountDSL - Operations for a specific account
 */
export interface AccountDSL {
  /** The account this DSL operates on */
  readonly account: Account;

  /**
   * Rotate the account's keys
   * @param newMnemonic - New mnemonic for generating next keys
   * @returns Updated account with new keys
   */
  rotateKeys(newMnemonic: Mnemonic): Promise<Account>;

  /**
   * Create a new credential registry
   * @param alias - Registry alias
   * @param opts - Registry options
   * @returns RegistryDSL for the new registry
   */
  createRegistry(alias: string, opts?: RegistryOptions): Promise<RegistryDSL>;

  /**
   * Get a credential registry by alias
   * @param alias - Registry alias
   * @returns RegistryDSL or null if not found
   */
  registry(alias: string): Promise<RegistryDSL | null>;

  /**
   * List all registries for this account
   * @returns Array of registry aliases
   */
  listRegistries(): Promise<string[]>;

  /**
   * Get the key event log for this account
   * @returns Array of all KEL events
   */
  getKel(): Promise<KelEvent[]>;

  /**
   * Export KEL events for this account
   * @returns ExportDSL for creating CESR bundle
   */
  export(): Promise<ExportDSL>;
}

/**
 * RegistryDSL - Operations for a credential registry
 */
export interface RegistryDSL {
  /** The registry this DSL operates on */
  readonly registry: Registry;
  /** The account that owns this registry */
  readonly account: Account;

  /**
   * Issue a new credential
   * @param params - Issuance parameters
   * @returns ACDCDSL for the issued credential
   */
  issue(params: IssueParams): Promise<ACDCDSL>;

  /**
   * Get a credential by alias
   * @param alias - Credential alias
   * @returns ACDCDSL or null if not found
   */
  acdc(alias: string): Promise<ACDCDSL | null>;

  /**
   * List all credentials in this registry
   * @returns Array of credential aliases
   */
  listACDCs(): Promise<string[]>;

  /**
   * Get the transaction event log for this registry
   * @returns Array of all TEL events
   */
  getTel(): Promise<TelEvent[]>;

  /**
   * Export TEL events for this registry
   * @returns ExportDSL for creating CESR bundle
   */
  export(): Promise<ExportDSL>;

  /**
   * Get indexed view of this registry
   * @returns Aggregated registry state with all credentials
   */
  index(): Promise<IndexedRegistry>;

  /**
   * List all credentials with their current state
   * @returns Array of indexed credentials
   */
  listCredentials(): Promise<IndexedACDC[]>;

  /**
   * Revoke a credential in this registry
   * @param credentialId - Credential SAID to revoke
   * @returns Promise that resolves when revocation is complete
   */
  revoke(credentialId: string): Promise<void>;

  /**
   * Create a sub-registry within this registry
   * The sub-registry will be anchored in this registry's TEL
   * @param alias - Alias for the sub-registry
   * @param opts - Registry options
   * @returns RegistryDSL for the newly created sub-registry
   */
  createRegistry(alias: string, opts?: RegistryOptions): Promise<RegistryDSL>;

  /**
   * Accept and anchor a received credential
   * Imports a credential from another party and stores it as 'received'
   * @param params - Acceptance parameters
   * @returns ACDCDSL for the accepted credential
   */
  accept(params: {
    /** Full ACDC credential object or credential SAID */
    credential: any;
    /** Optional TEL issuance event */
    issEvent?: any;
    /** Optional human-readable alias for the credential */
    alias?: string;
  }): Promise<ACDCDSL>;
}

/**
 * ACDCDSL - Operations for a specific ACDC (credential)
 */
export interface ACDCDSL {
  /** The ACDC this DSL operates on */
  readonly acdc: ACDC;
  /** The registry this ACDC belongs to */
  readonly registry: Registry;

  /**
   * Revoke this credential
   */
  revoke(): Promise<void>;

  /**
   * Get credential status
   * @returns Current credential status
   */
  status(): Promise<CredentialStatus>;

  /**
   * Export this credential and its issuance event
   * @returns ExportDSL for creating CESR bundle
   */
  export(): Promise<ExportDSL>;

  /**
   * Get indexed view of this credential
   * @returns Aggregated credential state
   */
  index(): Promise<IndexedACDC>;

  /**
   * Get latest credential data (current field values)
   * @returns Credential data attributes
   */
  getLatestData(): Promise<Record<string, any>>;

  /**
   * Get all schemas used by this credential
   * @returns Schema usage history
   */
  getSchemas(): Promise<SchemaUsage[]>;

  /**
   * Get all counterparties that have interacted with this credential
   * @returns List of counterparties
   */
  getCounterparties(): Promise<CounterpartyInfo[]>;

  /**
   * Get full TEL history for this credential
   * @returns Timeline of TEL events
   */
  getHistory(): Promise<TELEventSummary[]>;
}

/**
 * SchemaDSL - Operations for a credential schema
 */
export interface SchemaDSL {
  /** The schema this DSL operates on */
  readonly schema: Schema;

  /**
   * Validate data against this schema
   * @param data - Data to validate
   * @returns True if valid
   */
  validate(data: any): boolean;

  /**
   * Get the schema definition
   * @returns Schema object
   */
  getSchema(): any;

  /**
   * Export schema in KERI SAD format with alias metadata
   * @returns Schema export in SchemaExport format
   */
  export(): SchemaExport;

  /**
   * Delete this schema
   * @returns Promise that resolves when schema is deleted
   */
  delete(): Promise<void>;
}

/**
 * ContactsDSL - Operations for managing contacts (witnesses, etc.)
 */
export interface ContactsDSL {
  /**
   * Add a new contact
   * @param alias - Contact alias
   * @param aid - Contact's AID
   * @param metadata - Optional metadata
   * @returns Contact object
   */
  add(alias: string, aid: string, metadata?: Contact['metadata']): Promise<Contact>;

  /**
   * Get a contact by alias
   * @param alias - Contact alias
   * @returns Contact or null if not found
   */
  get(alias: string): Promise<Contact | null>;

  /**
   * Remove a contact
   * @param alias - Contact alias
   */
  remove(alias: string): Promise<void>;

  /**
   * List all contacts
   * @returns Array of contact aliases
   */
  list(): Promise<string[]>;

  /**
   * Get all contacts with full details
   * @returns Array of Contact objects
   */
  getAll(): Promise<Contact[]>;
}

/**
 * KeritsDSL - Top-level DSL for KERI operations
 */
export interface KeritsDSL {
  /**
   * Generate a new mnemonic from a seed (deterministic)
   * @param seed - 32-byte seed for deterministic generation
   * @returns 24-word mnemonic
   */
  newMnemonic(seed: Uint8Array): Mnemonic;

  /**
   * Create a new account from mnemonic
   * @param alias - Human-readable account name
   * @param mnemonic - 24-word seed phrase
   * @returns Account object
   */
  newAccount(alias: string, mnemonic: Mnemonic): Promise<Account>;

  /**
   * Get account by alias
   * @param alias - Account alias to lookup
   * @returns Account or null if not found
   */
  getAccount(alias: string): Promise<Account | null>;

  /**
   * Get account by AID
   * @param aid - KERI AID
   * @returns Account or null if not found
   */
  getAccountByAid(aid: string): Promise<Account | null>;

  /**
   * List all account aliases
   * @returns Array of account aliases
   */
  accountNames(): Promise<string[]>;

  /**
   * Get AccountDSL for a specific account
   * @param alias - Account alias
   * @returns AccountDSL or null if account not found
   */
  account(alias: string): Promise<AccountDSL | null>;

  /**
   * Get AccountDSL for a specific account by AID
   * @param aid - Account AID
   * @returns AccountDSL or null if account not found
   */
  accountByAid(aid: string): Promise<AccountDSL | null>;

  /**
   * Create a new schema
   * @param alias - Schema alias
   * @param schema - Schema definition (JSON Schema Draft 7)
   * @returns SchemaDSL for the new schema
   */
  createSchema(alias: string, schema: JSONSchema7): Promise<SchemaDSL>;

  /**
   * Import a schema from KERI SAD format
   * @param schemaData - Schema in SchemaExport format
   * @returns SchemaDSL for the imported schema
   */
  importSchema(schemaData: SchemaExport): Promise<SchemaDSL>;

  /**
   * Get a schema by alias
   * @param alias - Schema alias
   * @returns SchemaDSL or null if not found
   */
  schema(alias: string): Promise<SchemaDSL | null>;

  /**
   * List all schemas
   * @returns Array of schema aliases
   */
  listSchemas(): Promise<string[]>;

  /**
   * Delete a schema by alias
   * @param alias - Schema alias to delete
   * @returns Promise that resolves when schema is deleted
   */
  deleteSchema(alias: string): Promise<void>;

  /**
   * Get ContactsDSL for managing contacts
   * @returns ContactsDSL instance
   */
  contacts(): ContactsDSL;

  /**
   * Get ImportDSL for importing CESR bundles
   * @returns ImportDSL instance
   */
  import(): ImportDSL;

  /**
   * Get ContactSyncDSL for tracking sync state with contacts
   * @returns ContactSyncDSL instance
   */
  sync(): ContactSyncDSL;

  /**
   * Get the underlying KerStore instance
   * @returns KerStore instance
   */
  getStore(): KerStore;
}
