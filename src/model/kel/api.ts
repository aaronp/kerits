/**
 * KEL API - Functional interface for KERI operations
 *
 * Provides high-level operations for managing KERI identifiers:
 * - Creating identifiers (inception)
 * - Rotating keys
 * - Storing and retrieving KEL events
 * - Managing aliases
 */

import type { KeyValueStore } from '../io/key-value-store';
import type { OOBIResolver } from '../io/oobi-resolver';
import type { AID, SAID } from '../types';
import type { KelEvent, KelEnvelope } from './types';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';
import { getJson, putJson, getJsonString, putJsonString, memoryStore, namespace } from '../io/storage';

/**
 * Account represents a KERI identifier with its associated data
 */
export interface Account {
    /** The autonomic identifier (AID) */
    aid: AID;
    /** Human-readable alias */
    alias: string;
    /** Current sequence number */
    sequence: number;
    /** Latest event SAID */
    latestEvent: SAID;
}

/**
 * Stores required for KEL operations
 */
export type KelStores = {
    /** Alias → AID mappings (namespaced to kel:aliases) */
    aliases: KeyValueStore;
    /** KEL events (JSON) by SAID */
    kelEvents: KeyValueStore;
    /** KEL envelopes (CESR signed) by SAID */
    kelCesr: KeyValueStore;
    /** KEL metadata (chain info, sequence) by AID */
    kelMetadata: KeyValueStore;
    /** Key vault for storing keypairs */
    vault: KeyValueStore;
};

export namespace KelStores {
    export const inMemory = (): KelStores => {
        const baseStore = memoryStore();
        const stores = {
            aliases: namespace(baseStore, 'alias:kel'),
            kelEvents: namespace(baseStore, 'kel:events'),
            kelCesr: namespace(baseStore, 'kel:cesr'),
            kelMetadata: namespace(baseStore, 'kel:meta'),
            vault: namespace(baseStore, 'vault'),
        }
        return stores;
    }
}

/**
 * Parameters for creating a new account
 */
export interface CreateAccountParams {
    /** Human-readable alias for the account */
    alias: string;
    /** Storage instances */
    stores: KelStores;
    /** Optional: Current key seed for deterministic testing */
    currentKeySeed?: number;
    /** Optional: Next key seed for deterministic testing */
    nextKeySeed?: number;
    /** Optional: Timestamp for deterministic testing */
    timestamp?: string;
}

/**
 * Parameters for retrieving an account
 */
export interface GetAccountParams {
    /** Alias or AID of the account */
    alias?: string;
    aid?: AID;
    /** Storage instances */
    stores: KelStores;
}

/**
 * Chain metadata stored for each AID
 */
interface ChainMetadata {
    /** AID of the identifier */
    aid: AID;
    /** Ordered list of event SAIDs (for O(1) traversal) */
    chain: SAID[];
    /** Latest sequence number */
    sequence: number;
    /** Latest event SAID */
    latestEvent: SAID;
}

/**
 * Vault entry for storing keys
 */
export interface VaultEntry {
    /** AID this key belongs to */
    aid: AID;
    /** Current keypairs (indexed by key) */
    currentKeys: {
        publicKey: string;
        privateKeySeed: Uint8Array;
    }[];
    /** Next keypairs (pre-rotated) */
    nextKeys: {
        publicKey: string;
        privateKeySeed: Uint8Array;
    }[];
}

/**
 * Alias bidirectional mapping
 */
interface AliasMapping {
    /** Alias → AID */
    aliasToAid: Record<string, AID>;
    /** AID → Alias */
    aidToAlias: Record<AID, string>;
}

/**
 * Create a new KERI identifier (inception)
 *
 * @param params - Account creation parameters
 * @returns The created account
 */
export async function createAccount(params: CreateAccountParams): Promise<Account> {
    const { stores, ...rest } = params;
    return KelStores.ops(stores).createAccount(rest);
}

/**
 * Retrieve an account by alias or AID
 *
 * @param params - Account retrieval parameters
 * @returns The account, or null if not found
 */
export async function getAccount(params: GetAccountParams): Promise<Account | null> {
    const { stores, ...rest } = params;
    return KelStores.ops(stores).getAccount(rest);
}

/**
 * Get AID by alias
 *
 * @param aliasStore - Alias storage
 * @param alias - The alias to look up
 * @returns The AID, or null if not found
 */
export async function getAidByAlias(aliasStore: KeyValueStore, alias: string): Promise<AID | null> {
    const mapping = await getAliasMapping(aliasStore);
    return mapping.aliasToAid[alias] || null;
}

/**
 * Get the full KEL chain for an AID
 *
 * @param metadataStore - Metadata storage
 * @param eventStore - Event storage
 * @param aid - The AID to retrieve events for
 * @returns Array of KEL events in sequence order
 */
export async function getKelChain(
    metadataStore: KeyValueStore,
    eventStore: KeyValueStore,
    aid: AID
): Promise<KelEvent[]> {
    const metadata = await getJsonString<ChainMetadata>(metadataStore, `chain:${aid}`);
    if (!metadata) {
        return [];
    }

    const events: KelEvent[] = [];
    for (const eventSaid of metadata.chain) {
        const event = await getJson<KelEvent>(eventStore, eventSaid);
        if (event) {
            events.push(event);
        }
    }

    return events;
}

/**
 * Get the latest sequence number for an AID
 *
 * @param metadataStore - Metadata storage
 * @param aid - The AID to retrieve sequence for
 * @returns The latest sequence number, or null if not found
 */
export async function getLatestSequence(metadataStore: KeyValueStore, aid: AID): Promise<number | null> {
    const metadata = await getJsonString<ChainMetadata>(metadataStore, `chain:${aid}`);
    return metadata?.sequence ?? null;
}

/**
 * Get keys from vault for an AID
 *
 * @param vaultStore - Vault storage
 * @param aid - The AID to retrieve keys for
 * @returns The vault entry with current and next keys
 */
export async function getKeys(vaultStore: KeyValueStore, aid: AID): Promise<VaultEntry | null> {
    return await getJsonString<VaultEntry>(vaultStore, `keys:${aid}`);
}

/**
 * Get or initialize alias mapping
 */
async function getAliasMapping(aliasStore: KeyValueStore): Promise<AliasMapping> {
    const mapping = await getJsonString<AliasMapping>(aliasStore, 'mapping');
    return mapping || { aliasToAid: {}, aidToAlias: {} };
}

/**
 * Ops-style API capturing KelStores and exposing high-level operations.
 */
export type KelApi = {
    createAccount(args: Omit<CreateAccountParams, 'stores'>): Promise<Account>;
    getAccount(args: Omit<GetAccountParams, 'stores'>): Promise<Account | null>;
    getAidByAlias(alias: string): Promise<AID | null>;
    getKelChain(aid: AID): Promise<KelEvent[]>;
    getLatestSequence(aid: AID): Promise<number | null>;
    getKeys(aid: AID): Promise<VaultEntry | null>;
};

export namespace KelStores {
    export const ops = (stores: KelStores): KelApi => {
        return {
            async createAccount({ alias, currentKeySeed, nextKeySeed, timestamp }) {
                const existingMapping = await getAliasMapping(stores.aliases);
                if (existingMapping.aliasToAid[alias]) {
                    throw new Error(`Alias '${alias}' already exists`);
                }

                const currentKp = currentKeySeed !== undefined
                    ? CESR.keypairFrom(currentKeySeed, true)
                    : CESR.keypairFromMnemonic(CESR.generateMnemonic(), true);

                const nextKp = nextKeySeed !== undefined
                    ? CESR.keypairFrom(nextKeySeed, true)
                    : CESR.keypairFromMnemonic(CESR.generateMnemonic(), true);

                const inceptionEvent = KEL.inception({
                    currentKeys: [CESR.getPublicKey(currentKp)],
                    nextKeys: [CESR.getPublicKey(nextKp)],
                    transferable: true,
                    keyThreshold: 1,
                    nextThreshold: 1,
                    currentTime: timestamp,
                });

                const eventJson = JSON.stringify(inceptionEvent);
                await stores.kelEvents.put(inceptionEvent.d, new TextEncoder().encode(eventJson));

                const envelope = KEL.createEnvelope(inceptionEvent, [currentKp.privateKey]);
                const envelopeJson = JSON.stringify(envelope);
                await stores.kelCesr.put(inceptionEvent.d, new TextEncoder().encode(envelopeJson));

                const metadata: ChainMetadata = {
                    aid: inceptionEvent.i,
                    chain: [inceptionEvent.d],
                    sequence: 0,
                    latestEvent: inceptionEvent.d,
                };
                await putJsonString(stores.kelMetadata, `chain:${inceptionEvent.i}`, metadata);

                const vaultEntry: VaultEntry = {
                    aid: inceptionEvent.i,
                    currentKeys: [{
                        publicKey: CESR.getPublicKey(currentKp),
                        privateKeySeed: currentKp.privateKey,
                    }],
                    nextKeys: [{
                        publicKey: CESR.getPublicKey(nextKp),
                        privateKeySeed: nextKp.privateKey,
                    }],
                };
                await putJsonString(stores.vault, `keys:${inceptionEvent.i}`, vaultEntry);

                const newMapping: AliasMapping = {
                    aliasToAid: { ...existingMapping.aliasToAid, [alias]: inceptionEvent.i },
                    aidToAlias: { ...existingMapping.aidToAlias, [inceptionEvent.i]: alias },
                };
                await putJsonString(stores.aliases, 'mapping', newMapping);

                return {
                    aid: inceptionEvent.i,
                    alias,
                    sequence: 0,
                    latestEvent: inceptionEvent.d,
                };
            },

            async getAccount({ alias, aid }) {
                let resolvedAid: AID | null = null;
                if (alias) {
                    resolvedAid = await getAidByAlias(stores.aliases, alias);
                } else if (aid) {
                    resolvedAid = aid;
                } else {
                    throw new Error('Either alias or aid must be provided');
                }

                if (!resolvedAid) return null;

                const metadata = await getJsonString<ChainMetadata>(stores.kelMetadata, `chain:${resolvedAid}`);
                if (!metadata) return null;

                const mapping = await getAliasMapping(stores.aliases);
                const resolvedAlias = mapping.aidToAlias[resolvedAid] || resolvedAid;

                return {
                    aid: resolvedAid,
                    alias: resolvedAlias,
                    sequence: metadata.sequence,
                    latestEvent: metadata.latestEvent,
                };
            },

            async getAidByAlias(alias) {
                return await getAidByAlias(stores.aliases, alias);
            },

            async getKelChain(aid) {
                return await getKelChain(stores.kelMetadata, stores.kelEvents, aid);
            },

            async getLatestSequence(aid) {
                return await getLatestSequence(stores.kelMetadata, aid);
            },

            async getKeys(aid) {
                return await getKeys(stores.vault, aid);
            }
        };
    };
}
