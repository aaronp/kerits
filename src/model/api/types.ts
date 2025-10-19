/**
 * Top-level API types
 * 
 * This package provides the main KeritsAPI and related interfaces
 * that tie together all the underlying services.
 */

import type { AID, SAID, KeyValueStore, Transport } from '../io/types';
import type { KelEvent, KelEnvelope, Crypto } from '../services/types';
import type { KelService } from '../services/kel';
import type { RotationHandle } from '../kel/rotation/types';

/**
 * KeritsAPI - Top-level API interface
 * 
 * The main entry point for the Kerits system. Provides account
 * management and high-level operations.
 */
export interface KeritsAPI {
    /** Get all accounts */
    accounts(): Promise<AccountAPI[]>;

    /** Create a new account */
    createAccount(alias: string, opts?: { crypto?: any }): Promise<AccountAPI>;

    /** Get account by alias or AID */
    getAccount(aliasOrAid: string): Promise<AccountAPI>;
}

/**
 * AccountAPI - Account-level operations
 * 
 * Provides operations for a specific account, including KEL management,
 * TEL operations, and key rotation.
 */
export interface AccountAPI {
    /** Get the account's AID */
    aid(): AID;

    /** Get the account's alias */
    alias(): string;

    /** Get the account's KEL events */
    kel(): Promise<KelEvent[]>;

    /** Rotate keys (multi-signature workflow) */
    rotateKeys(opts?: {
        newKeys?: string[];
        newThreshold?: number;
        nextKeys?: string[];
        nextThreshold?: number;
        deadlineMs?: number;
        note?: string;
    }): Promise<RotationHandle>;

    /** Create an interaction event (anchor SAIDs) */
    anchor(saids: SAID[]): Promise<KelEnvelope>;

    /** List TELs for this account */
    listTels(): Promise<SAID[]>;

    /** Get a specific TEL */
    getTel(id: string): Promise<TelAPI>;

    /** Create a new TEL */
    createTel(name: string): Promise<TelAPI>;

    /** Create a delegate account */
    createDelegateAccount(alias: string): Promise<AccountAPI>; // child AID with dlg + parent anchor
}

/**
 * TelAPI - TEL-level operations
 * 
 * Provides operations for managing a specific Transaction Event Log.
 */
export interface TelAPI {
    /** Get the TEL's ID (SAID) */
    id(): SAID;

    /** Get the latest TEL event */
    latest(): Promise<any | null>;

    /** Append data to the TEL */
    append(data: unknown, opts?: { withPolicy?: SAID }): Promise<{ stateSaid: SAID; telEvent: any }>;

    /** Revoke the TEL */
    revoke(reason?: string): Promise<any>;

    /** Low-level operations */
    issueWithState(stateSaid: SAID): Promise<any>;
    updateToState(stateSaid: SAID, policySaid?: SAID): Promise<any>;
}

/**
 * KeritsDeps - Dependencies for the KeritsAPI
 * 
 * All the services and utilities needed to construct a KeritsAPI instance.
 */
export interface KeritsDeps {
    /** Hasher for computing SAIDs */
    hasher: { saidOf(data: Uint8Array): string };

    /** KEL service */
    kel: KelService;

    /** TEL service */
    tel: any; // TelService

    /** Schema service */
    schema: any; // SchemaService

    /** ACDC service */
    acdc: any; // ACDCService

    /** OOBI resolver (optional) */
    oobi?: any; // OOBIResolver

    /** Clock function */
    clock?: () => string;

    /** Crypto factory */
    cryptoFactory?: (aid: AID) => any; // Crypto

    /** Resolve cosigner AIDs for key rotation */
    resolveCosignerAIDs: (prior: KelEvent) => Promise<Array<{ aid: AID; keyIndex: number; pub: string }>>;

    /** Append KEL envelope to store */
    appendKelEnv: (store: KeyValueStore, env: KelEnvelope) => Promise<void>;
}

/**
 * KeritsStores - Storage configuration
 * 
 * Defines the storage layout for different types of data.
 */
export interface KeritsStores {
    /** Root storage */
    root: KeyValueStore;

    /** KEL storage (optional, will be namespaced) */
    kels?: KeyValueStore;

    /** TEL storage (optional, will be namespaced) */
    tels?: KeyValueStore;

    /** Schema storage (optional, will be namespaced) */
    schemas?: KeyValueStore;

    /** ACDC storage (optional, will be namespaced) */
    acdcs?: KeyValueStore;

    /** Index storage for aliases and mappings */
    index?: KeyValueStore;
}
