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
export interface ChainMetadata {
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
    rotateKeys(args: { aid: AID; timestamp?: string; nextSeed?: number }): Promise<Account>;
    getAccount(args: Omit<GetAccountParams, 'stores'>): Promise<Account | null>;
    getAidByAlias(alias: string): Promise<AID | null>;
    getKelChain(aid: AID): Promise<KelEvent[]>;
    getLatestSequence(aid: AID): Promise<number | null>;
    getKeys(aid: AID): Promise<VaultEntry | null>;
};

export namespace KelStores {
    // Ports (IO abstractions) built on top of KeyValueStore
    export interface AliasRepo {
        get(alias: string): Promise<AID | null>;
        set(alias: string, aid: AID): Promise<void>;
        reverse(aid: AID): Promise<string | null>;
    }

    export interface KelRepo {
        getEvent(said: SAID): Promise<KelEvent | null>;
        putEvent(evt: KelEvent): Promise<void>;
        getEnvelope(said: SAID): Promise<KelEnvelope | null>;
        putEnvelope(env: KelEnvelope): Promise<void>;
        getChain(aid: AID): Promise<ChainMetadata | null>;
        putChain(meta: ChainMetadata): Promise<void>;
    }

    export interface Vault {
        getKeyset(aid: AID): Promise<{
            current: { publicKey: string; secretHandle: Uint8Array };
            next: { publicKey: string; secretHandle: Uint8Array };
        } | null>;
        setKeyset(aid: AID, ks: {
            current: { publicKey: string; secretHandle: Uint8Array };
            next: { publicKey: string; secretHandle: Uint8Array };
        }): Promise<void>;
    }

    // Thin adapters over KeyValueStore to realize the ports with current layout
    export function aliasRepo(store: KeyValueStore): AliasRepo {
        return {
            async get(alias) {
                const mapping = await getAliasMapping(store);
                return mapping.aliasToAid[alias.toLowerCase()] ?? null;
            },
            async set(alias, aid) {
                const mapping = await getAliasMapping(store);
                const lower = alias.toLowerCase();
                const next: AliasMapping = {
                    aliasToAid: { ...mapping.aliasToAid, [lower]: aid },
                    aidToAlias: { ...mapping.aidToAlias, [aid]: lower }
                };
                await putJsonString(store, 'mapping', next);
            },
            async reverse(aid) {
                const mapping = await getAliasMapping(store);
                return mapping.aidToAlias[aid] ?? null;
            }
        };
    }

    export function kelRepo(events: KeyValueStore, envs: KeyValueStore, meta: KeyValueStore): KelRepo {
        return {
            async getEvent(said) { return await getJson<KelEvent>(events, said); },
            async putEvent(evt) {
                const existing = await getJson<KelEvent>(events, evt.d);
                if (existing) return; // idempotent
                await putJson(events, evt.d, evt);
            },
            async getEnvelope(said) { return await getJson<KelEnvelope>(envs, said); },
            async putEnvelope(env) { await putJson(envs, env.event.d, env); },
            async getChain(aid) { return await getJsonString<ChainMetadata>(meta, `chain:${aid}`); },
            async putChain(cm) { await putJsonString(meta, `chain:${cm.aid}`, cm); }
        };
    }

    export function vaultRepo(store: KeyValueStore): Vault {
        return {
            async getKeyset(aid) {
                const data = await store.get(`keys:${aid}` as any);
                if (!data) return null;
                const parsed = JSON.parse(new TextDecoder().decode(data));
                // Convert secretHandle back to Uint8Array
                if (parsed.current?.secretHandle) {
                    parsed.current.secretHandle = new Uint8Array(Object.values(parsed.current.secretHandle));
                }
                if (parsed.next?.secretHandle) {
                    parsed.next.secretHandle = new Uint8Array(Object.values(parsed.next.secretHandle));
                }
                return parsed;
            },
            async setKeyset(aid, ks) {
                // Convert Uint8Array to array for JSON serialization
                const serializable = {
                    current: {
                        publicKey: ks.current.publicKey,
                        secretHandle: Array.from(ks.current.secretHandle)
                    },
                    next: {
                        publicKey: ks.next.publicKey,
                        secretHandle: Array.from(ks.next.secretHandle)
                    }
                };
                await putJsonString(store, `keys:${aid}`, serializable);
            }
        };
    }
    export const ops = (stores: KelStores): KelApi => {
        return {
            async createAccount({ alias, currentKeySeed, nextKeySeed, timestamp }) {
                const aliases = aliasRepo(stores.aliases);
                const kel = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
                const vault = vaultRepo(stores.vault);
                const existing = await aliases.get(alias);
                if (existing) throw new Error(`AliasExists: '${alias}'`);

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

                await kel.putEvent(inceptionEvent);

                const envelope = KEL.createEnvelope(inceptionEvent, [currentKp.privateKey]);
                await kel.putEnvelope(envelope);

                const metadata: ChainMetadata = {
                    aid: inceptionEvent.i,
                    chain: [inceptionEvent.d],
                    sequence: 0,
                    latestEvent: inceptionEvent.d,
                };
                await kel.putChain(metadata);

                await vault.setKeyset(inceptionEvent.i, {
                    current: { publicKey: CESR.getPublicKey(currentKp), secretHandle: currentKp.privateKey },
                    next: { publicKey: CESR.getPublicKey(nextKp), secretHandle: nextKp.privateKey }
                });

                await aliases.set(alias, inceptionEvent.i);

                return {
                    aid: inceptionEvent.i,
                    alias,
                    sequence: 0,
                    latestEvent: inceptionEvent.d,
                };
            },

            async rotateKeys({ aid, timestamp, nextSeed }) {
                const aliases = aliasRepo(stores.aliases);
                const kel = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
                const vault = vaultRepo(stores.vault);

                const meta = await kel.getChain(aid);
                if (!meta) throw new Error(`UnknownAID: ${aid}`);

                const keyset = await vault.getKeyset(aid);
                if (!keyset) throw new Error(`KeysetMissing: ${aid}`);

                // Prepare brand-new "next" for the following rotation (commitment chaining)
                const nextNext = nextSeed !== undefined
                    ? CESR.keypairFrom(nextSeed, true)
                    : CESR.keypairFromMnemonic(CESR.generateMnemonic(), true);

                // Build rotation: reveal previous next as current; commit fresh next
                const rot = KEL.rotation({
                    controller: aid,
                    previousEvent: meta.latestEvent,
                    currentKeys: [keyset.next.publicKey],          // reveal
                    nextKeys: [CESR.getPublicKey(nextNext)],       // commit
                    transferable: true,
                    keyThreshold: 1,
                    nextThreshold: 1,
                    dt: timestamp,
                });

                // Fix the sequence number (rotation method hardcodes it to '1')
                rot.s = (meta.sequence + 1).toString();

                // Sign with *previous current* keys
                const env = KEL.createEnvelope(rot, [keyset.current.secretHandle]);

                // Verify the envelope
                const priorEvent = meta.latestEvent ? await kel.getEvent(meta.latestEvent) : undefined;
                const verification = await KEL.verifyEnvelope(env, priorEvent || undefined);
                if (!verification.valid) {
                    throw new Error(`Invalid rotation signature: ${verification.validSignatures}/${verification.requiredSignatures} signatures valid`);
                }

                // Persist
                await kel.putEvent(rot);
                await kel.putEnvelope(env);
                const updated: ChainMetadata = {
                    aid: meta.aid,
                    chain: [...meta.chain, rot.d],
                    sequence: meta.sequence + 1,   // rot.s is string, but sequence is number
                    latestEvent: rot.d,
                };
                await kel.putChain(updated);

                // Advance vault keyset atomically
                await vault.setKeyset(aid, {
                    current: { publicKey: keyset.next.publicKey, secretHandle: keyset.next.secretHandle },
                    next: { publicKey: CESR.getPublicKey(nextNext), secretHandle: nextNext.privateKey },
                });

                const alias = (await aliases.reverse(aid)) ?? aid;
                return { aid: aid, alias, sequence: updated.sequence, latestEvent: updated.latestEvent };
            },

            async getAccount({ alias, aid }) {
                const aliases = aliasRepo(stores.aliases);
                const kel = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
                let resolvedAid: AID | null = null;
                if (alias) {
                    resolvedAid = await aliases.get(alias);
                } else if (aid) {
                    resolvedAid = aid;
                } else {
                    throw new Error('Either alias or aid must be provided');
                }

                if (!resolvedAid) return null;

                const metadata = await kel.getChain(resolvedAid);
                if (!metadata) return null;

                const resolvedAlias = (await aliases.reverse(resolvedAid)) ?? resolvedAid;

                return {
                    aid: resolvedAid,
                    alias: resolvedAlias,
                    sequence: metadata.sequence,
                    latestEvent: metadata.latestEvent,
                };
            },

            async getAidByAlias(alias) {
                const aliases = aliasRepo(stores.aliases);
                return await aliases.get(alias);
            },

            async getKelChain(aid) {
                const kel = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
                const meta = await kel.getChain(aid);
                if (!meta) return [];
                const evts: KelEvent[] = [];
                for (const said of meta.chain) {
                    const e = await kel.getEvent(said);
                    if (e) evts.push(e);
                }
                return evts;
            },

            async getLatestSequence(aid) {
                const kel = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
                const meta = await kel.getChain(aid);
                return meta?.sequence ?? null;
            },

            async getKeys(aid) {
                const vault = vaultRepo(stores.vault);
                const ks = await vault.getKeyset(aid);
                if (!ks) return null;
                return {
                    aid,
                    currentKeys: [{ publicKey: ks.current.publicKey, privateKeySeed: ks.current.secretHandle }],
                    nextKeys: [{ publicKey: ks.next.publicKey, privateKeySeed: ks.next.secretHandle }]
                } as unknown as VaultEntry;
            }
        };
    };
}
