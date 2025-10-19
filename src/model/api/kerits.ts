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

    async function appendKelEnv(store: KeyValueStore, env: KelEnvelope, priorEvent?: KelEvent) {
        // Verify the envelope before appending
        const verification = await deps.kel.verifyEnvelope(env, priorEvent);
        if (!verification.valid) {
            throw new Error(`invalid KEL envelope: ${verification.signatureResults?.filter((r: { signature: CesrSig; valid: boolean }) => !r.valid).length ?? 0} invalid signatures`);
        }

        const aid = env.event.i;
        const existing = await readKel(aid);
        await writeKel(aid, [...existing, env.event]);
        // (optional: persist sigs trail under kel:${aid}:sigs:${event.d})
    }

    const rotateKeysFactory = (aid: AID) =>
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
        // Create crypto first to get the public keys
        const tempAid = ("E" + alias) as AID; // Temporary AID for crypto factory
        const crypto = deps.cryptoFactory?.(tempAid);
        if (!crypto) {
            throw new Error("cryptoFactory not provided");
        }

        // Create an inception event - let KelService derive the AID from the inception body
        const nextCommit = crypto.nextCommit();
        const icp = await deps.kel.incept({
            controller: tempAid, // Temporary controller for inception
            k: crypto.pubKeys(),
            kt: crypto.threshold(), // Call the function
            nextK: nextCommit.nextKeys, // Extract nextKeys from nextCommit
            nt: nextCommit.nt, // Extract nt from nextCommit
            dt: deps.clock?.() ?? new Date().toISOString()
        });

        // Get the authoritative AID from the inception event
        const aid = icp.i as AID;
        await saveAccount(alias, aid);

        // Sign and persist the inception
        const env = await deps.kel.sign(icp, crypto);
        await appendKelEnv(kels, env);

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
                return rotateKeysFactory(aid)(aid, prior, opts);
            },

            async anchor(saids): Promise<KelEnvelope> {
                const events = await readKel(aid);
                const prior = events.at(-1);
                if (!prior) throw new Error("no prior KEL event to anchor from");

                // Create interaction event
                const ixn = await deps.kel.interaction({
                    controller: aid,
                    prior: prior,
                    anchors: saids,
                    dt: deps.clock?.() ?? new Date().toISOString()
                });

                // Sign using KelService for proper canonical bytes and indexed signatures
                const crypto = deps.cryptoFactory?.(aid) ?? (() => { throw new Error("cryptoFactory not provided"); })();
                const env = await deps.kel.sign(ixn, crypto);
                await appendKelEnv(kels, env, prior);

                return env; // Return envelope for richer inspection
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
