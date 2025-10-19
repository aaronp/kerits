/**
 * Top-level KeritsAPI implementation
 * 
 * This module implements the main KeritsAPI that ties together
 * all the underlying services and provides a clean developer experience.
 */

import type { KeyValueStore, Transport, AID, SAID } from '../io/types';
import { namespace, getJson, putJson } from '../io/storage';
import type { KelEvent, KelEnvelope, CesrSig } from '../services/types';
import type { RotationHandle } from '../kel/rotation/types';
import type { KeritsAPI, AccountAPI, TelAPI, KeritsDeps, KeritsStores } from './types';
import { makeRotateKeys } from '../kel/rotation/rotate-keys';
import { KEL } from '../kel/kel-ops';
import { CESR } from '../cesr/cesr';

/**
 * Create a KeritsAPI instance
 * 
 * This is the main factory function that wires together all the services
 * and returns a fully functional KeritsAPI.
 */
export function kerits(
    stores: KeritsStores,
    transport: Transport,
    deps: KeritsDeps
): KeritsAPI {

    const kels = stores.kels ?? namespace(stores.root, "kels");
    const tels = stores.tels ?? namespace(stores.root, "tels");
    const schemas = stores.schemas ?? namespace(stores.root, "schemas");
    const acdcs = stores.acdcs ?? namespace(stores.root, "acdcs");
    const index = stores.index ?? namespace(stores.root, "index");

    // Very simple account registry (alias -> AID JSON)
    async function saveAccount(alias: string, aid: AID) {
        await putJson(index, `acct:${alias}` as SAID, aid);
    }

    async function loadAccount(aliasOrAid: string): Promise<AID> {
        if (aliasOrAid.startsWith("E")) return aliasOrAid as AID;
        const b = await getJson<AID>(index, `acct:${aliasOrAid}` as SAID);
        if (!b) throw new Error("account not found");
        return b;
    }

    // KEL persistence helpers
    async function readKel(aid: AID): Promise<KelEvent[]> {
        const b = await getJson<KelEvent[]>(kels, `kel:${aid}` as SAID);
        console.log(`Reading KEL for ${aid}:`, b);
        if (!b) return [];
        return b;
    }

    async function writeKel(aid: AID, events: KelEvent[]) {
        console.log(`Writing KEL for ${aid}:`, events);
        await putJson(kels, `kel:${aid}` as SAID, events);
    }

    async function appendKelEnv(store: KeyValueStore, env: KelEnvelope) {
        const aid = env.event.i;
        const existing = await readKel(aid);
        await writeKel(aid, [...existing, env.event]);
        // (Optionally persist signatures trail elsewhere)
    }

    const rotateKeysFactory = (aid: AID, prior: KelEvent) =>
        makeRotateKeys({
            clock: deps.clock ?? (() => new Date().toISOString()),
            stores: { index, kels },
            kel: deps.kel,
            transport,
            crypto: deps.cryptoFactory?.(aid) ?? (() => { throw new Error("cryptoFactory not provided"); })(),
            resolveCosigners: deps.resolveCosignerAIDs,
            appendKelEnv,
        });

    async function createAccount(alias: string): Promise<AccountAPI> {
        // Create crypto first to get the real AID from the public key
        const tempAid = ("E" + alias) as AID; // Temporary AID for crypto factory
        const crypto = deps.cryptoFactory?.(tempAid);
        if (!crypto) {
            throw new Error("cryptoFactory not provided");
        }

        const publicKeys = crypto.pubKeys();
        const aid = publicKeys[0] as AID; // Use the first public key as the AID
        await saveAccount(alias, aid);

        // Create an inception event for the account
        const inception = await deps.kel.incept({
            controller: aid,
            k: publicKeys,
            kt: crypto.threshold,
            nextK: publicKeys, // Use the same keys for next commitment
            nt: crypto.threshold,
            dt: deps.clock?.() ?? new Date().toISOString()
        });

        // Sign and persist the inception
        if (crypto) {
            const env = await deps.kel.sign(inception, crypto);
            await appendKelEnv(kels, env);
        }

        return accountAPI(aid, alias);
    }

    function accountAPI(aid: AID, alias: string): AccountAPI {
        return {
            aid: () => aid,
            alias: () => alias,

            async kel() {
                return readKel(aid);
            },

            async rotateKeys(opts) {
                const events = await readKel(aid);
                const prior = events.at(-1);
                if (!prior) throw new Error("no prior KEL event to rotate from");
                return rotateKeysFactory(aid, prior)(aid, prior, opts);
            },

            async anchor(saids) {
                const events = await readKel(aid);
                const prior = events.at(-1);
                if (!prior) throw new Error("no prior KEL event to anchor from");

                // Create interaction event
                const ixn = KEL.interaction({
                    controller: aid,
                    previousEvent: prior.d,
                    anchors: saids,
                    currentTime: deps.clock?.() ?? new Date().toISOString()
                });

                // Sign and persist
                const crypto = deps.cryptoFactory?.(aid) ?? (() => { throw new Error("cryptoFactory not provided"); })();
                const privateKeys = (crypto as any).keypairs?.map((kp: any) => kp.privateKey) || [];

                // For interaction events, we need to create a special envelope since they don't have embedded keys
                // We'll use the current controller's keys for signing
                const canonical = JSON.stringify(ixn);
                const canonicalBytes = new TextEncoder().encode(canonical);

                const signatures: CesrSig[] = [];
                for (let i = 0; i < privateKeys.length; i++) {
                    const signature = CESR.sign(canonicalBytes, privateKeys[i], true);
                    signatures.push({
                        keyIndex: i,
                        sig: signature
                    });
                }

                const env: KelEnvelope = {
                    event: ixn,
                    signatures
                };

                await appendKelEnv(kels, env);

                return ixn;
            },

            async listTels() {
                // Implementation would go here
                return [];
            },

            async getTel(id: string) {
                // Implementation would go here
                throw new Error("TEL operations not implemented yet");
            },

            async createTel(name: string) {
                // Implementation would go here
                throw new Error("TEL operations not implemented yet");
            },

            async createDelegateAccount(alias: string) {
                // Implementation would go here
                throw new Error("Delegation not implemented yet");
            }
        };
    }

    return {
        async createAccount(alias) {
            return createAccount(alias);
        },

        async getAccount(aliasOrAid) {
            try {
                const aid = await loadAccount(aliasOrAid);
                // look up alias back (optional)
                return accountAPI(aid, aliasOrAid.startsWith("E") ? aid : aliasOrAid);
            } catch (error) {
                // If account not found, try to create it
                if (error instanceof Error && error.message === "account not found") {
                    return createAccount(aliasOrAid);
                }
                throw error;
            }
        },

        async accounts() {
            const keys = (await index.listKeys?.("acct:")) ?? [];
            return Promise.all(keys.map(async k => {
                // Handle namespaced keys: "acct:bob" -> "bob"
                const alias = k.replace(/^acct:/, "");
                const aid = await loadAccount(alias);
                return accountAPI(aid, alias);
            }));
        },
    };
}
