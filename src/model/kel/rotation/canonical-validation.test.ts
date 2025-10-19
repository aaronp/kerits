/**
 * Tests for canonical digest validation in key rotation workflow
 */

import { describe, expect, test } from "bun:test";
import { makeRotateKeys } from "./rotate-keys";
import { KEL } from "../kel-ops";
import { CESR } from "../../cesr/cesr";
import { memoryStore } from "../../io/storage";
import { memoryTransport } from "../../io/transport";
import { s } from "../../string-ops";
import type { AID, SAID } from "../../types";

// Mock dependencies
const clock = () => new Date().toISOString();
const enc = new TextEncoder();

class FakeKelService {
    async saidOfKeyset(k: string[], kt: number): Promise<SAID> {
        const data = { k, kt };
        const json = JSON.stringify(data);
        const hash = await crypto.subtle.digest('SHA-256', enc.encode(json));
        const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
        return s(`E${base64.slice(0, 43)}`).asSAID();
    }

    canonicalBytes(event: any): Uint8Array {
        return enc.encode(JSON.stringify(event));
    }

    decodeThreshold(kt: string): number {
        return parseInt(kt);
    }

    async rotate(args: any): Promise<any> {
        // Create a mock rotation event with the correct keys
        const n = await this.saidOfKeyset(args.nextK, args.nt);
        return {
            v: "KERI10JSON0001aa_",
            t: "rot",
            d: s("ErotEvent").asSAID(),
            i: args.controller,
            s: "1",
            p: args.prior.d,
            k: args.k, // Use the provided keys
            kt: args.kt.toString(),
            n: n, // Use computed commitment
            nt: args.nt.toString(),
            dt: args.dt
        };
    }

    async sign(event: any, crypto: any): Promise<any> {
        // For rotation events, generate signatures for all initiator-controlled keys
        if (event.t === "rot") {
            const initiatorPriorKeys = crypto.priorKeys?.() || [];
            const signatures: any[] = [];

            // Find which prior key indices the initiator controls
            for (let i = 0; i < event.k.length; i++) {
                if (initiatorPriorKeys.includes(event.k[i])) {
                    signatures.push({
                        keyIndex: i,
                        sig: `fake-signature-${i}`
                    });
                }
            }

            return {
                event,
                signatures
            };
        }

        // For other events, use default behavior
        return {
            event,
            signatures: [{
                keyIndex: 0,
                sig: "fake-signature"
            }]
        };
    }

    thresholdsEqual(threshold1: string, threshold2: string): boolean {
        return threshold1 === threshold2;
    }

    async verifyEnvelope(env: any): Promise<{
        valid: boolean;
        validSignatures: number;
        requiredSignatures: number;
        signatureResults: Array<{ signature: any; valid: boolean }>;
    }> {
        // Mock verification - always return valid for fake signatures
        return {
            valid: true,
            validSignatures: env.signatures.length,
            requiredSignatures: 1,
            signatureResults: env.signatures.map((sig: any) => ({
                signature: sig,
                valid: true
            }))
        };
    }
}

class FakeCrypto {
    threshold = 1;
    private controlledKeys: string[] = [];

    setControlledKeys(keys: string[]) {
        this.controlledKeys = keys;
    }

    pubKeys(): string[] {
        return ["Dfake1", "Dfake2"];
    }

    async verify(canonical: Uint8Array, sig: string, pub: string): Promise<boolean> {
        return true; // Always pass for these tests
    }

    priorKeys(): string[] {
        return this.controlledKeys;
    }

    nextCommit(): { n: SAID; nt: number; nextKeys: string[] } {
        const nextKeys = this.pubKeys();
        const nt = this.threshold;
        const n = s("EnextCommit").asSAID();
        return { n, nt, nextKeys };
    }
}

function createTestSetup() {
    const store = memoryStore();
    const transport = memoryTransport();
    const kel = new FakeKelService();
    const crypto = new FakeCrypto();

    const deps = {
        stores: { kels: store, index: store },
        transport,
        kel,
        crypto,
        clock,
        resolveCosigners: async (prior: any) => {
            // Mock cosigners - return all prior keys as cosigners
            return prior.k!.map((pub: string, idx: number) => ({
                aid: s(`Dcosigner${idx}`).asAID(),
                keyIndex: idx,
                pub: pub
            }));
        },
        appendKelEnv: async (store: any, env: any) => {
            await store.put(s("published").asSAID(), enc.encode(JSON.stringify(env)));
        }
    };

    return { deps, store, transport };
}

describe("Canonical Digest Validation", () => {
    test("self-finalize when initiatorShare ≥ priorKt", async () => {
        const { deps } = createTestSetup();

        // Create a 2-of-2 KEL where initiator controls both keys
        const keypair1 = CESR.keypairFrom(12345);
        const keypair2 = CESR.keypairFrom(12346);
        const pub1 = CESR.getPublicKey(keypair1);
        const pub2 = CESR.getPublicKey(keypair2);

        // Create a proper prior with matching commitment
        const priorN = await deps.kel.saidOfKeyset([pub1, pub2], 2);

        const prior = {
            d: s("Eprior").asSAID(),
            k: [pub1, pub2],
            kt: s("2").asThreshold(),
            n: priorN, // Use the computed commitment
            nt: s("2").asThreshold()
        };

        // Set the crypto to control both prior keys
        deps.crypto.setControlledKeys([pub1, pub2]);

        const rotateKeys = makeRotateKeys(deps);
        const handle = await rotateKeys(s("Dcontroller").asAID(), prior, {
            newKeys: [pub1, pub2], // Same keys to match commitment
            newThreshold: 2
        });

        console.log("Handle created, checking status...");
        const status = await handle.status();
        console.log("Status:", status);
        console.log("Status ID:", status.id);

        expect(status.phase).toBe("finalized");
        expect(status.collected).toBe(2);
        expect(status.missing).toBe(0);

        // Should not need any cosigner messages (but may have finalize message)
        const messages = await deps.transport.readUnread(s("Dcontroller").asAID());
        expect(messages.length).toBeLessThanOrEqual(1); // May have finalize message
    });

    test("signer pub mismatch: wrong pub for keyIndex → reject", async () => {
        const { deps, transport } = createTestSetup();

        const keypair1 = CESR.keypairFrom(12345);
        const keypair2 = CESR.keypairFrom(12346);
        const pub1 = CESR.getPublicKey(keypair1);
        const pub2 = CESR.getPublicKey(keypair2);

        // Create a proper prior with matching commitment
        const priorN = await deps.kel.saidOfKeyset([pub1, pub2], 2);

        const prior = {
            d: s("Eprior").asSAID(),
            k: [pub1, pub2],
            kt: s("2").asThreshold(),
            n: priorN,
            nt: s("2").asThreshold()
        };

        // Set the crypto to control only one prior key (not enough for self-finalize)
        deps.crypto.setControlledKeys([pub1]);

        // Override resolveCosigners to return wrong pub for keyIndex 0
        deps.resolveCosigners = async (prior: any) => {
            return prior.k!.map((pub: string, idx: number) => ({
                aid: s(`Dcosigner${idx}`).asAID(),
                keyIndex: idx,
                pub: idx === 0 ? "wrong-pub" : pub // Return wrong pub for keyIndex 0
            }));
        };

        const rotateKeys = makeRotateKeys(deps);

        // This should throw an error during setup due to pub/keyIndex mismatch
        await expect(async () => {
            await rotateKeys(s("Dcontroller").asAID(), prior, {
                newKeys: [pub1, pub2],
                newThreshold: 2
            });
        }).rejects.toThrow("cosigner pub/keyIndex mismatch");
    });

    test("proposal canonical digest: cosigner signs different rot body → reject", async () => {
        const { deps, transport } = createTestSetup();

        const keypair1 = CESR.keypairFrom(12345);
        const keypair2 = CESR.keypairFrom(12346);
        const pub1 = CESR.getPublicKey(keypair1);
        const pub2 = CESR.getPublicKey(keypair2);

        // Create a proper prior with matching commitment
        const priorN = await deps.kel.saidOfKeyset([pub1, pub2], 2);

        const prior = {
            d: s("Eprior").asSAID(),
            k: [pub1, pub2],
            kt: s("2").asThreshold(),
            n: priorN,
            nt: s("2").asThreshold()
        };

        // Set the crypto to control only one prior key (not enough for self-finalize)
        deps.crypto.setControlledKeys([pub1]);

        const rotateKeys = makeRotateKeys(deps);
        const handle = await rotateKeys(s("Dcontroller").asAID(), prior, {
            newKeys: [pub1, pub2],
            newThreshold: 2
        });

        const status = await handle.status();

        const errors: string[] = [];
        handle.onProgress((e) => {
            if (e.type === "error") {
                errors.push(e.payload as string);
            }
        });

        // Get the actual rotation ID from the handle status
        const rotationId = status.id;

        // Send message with wrong canonical digest
        await transport.send({
            id: "test-rotation",
            from: s("Dcosigner0").asAID(), // Use the correct cosigner AID
            to: s("Dcontroller").asAID(),
            typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({
                rotationId: rotationId,
                signer: s("Dcosigner0").asAID(), // Use the correct cosigner AID
                keyIndex: 0,
                sig: "fake-sig",
                ok: true,
                canonicalDigest: s("EwrongDigest").asSAID() // Wrong digest
            })),
            dt: clock()
        });

        await new Promise(r => setTimeout(r, 100));
        expect(errors).toContain("canonical digest mismatch (stale/altered proposal)");
    });

    test("proposal includes canonical digest for cosigner verification", async () => {
        const { deps, transport } = createTestSetup();

        const keypair1 = CESR.keypairFrom(12345);
        const keypair2 = CESR.keypairFrom(12346);
        const pub1 = CESR.getPublicKey(keypair1);
        const pub2 = CESR.getPublicKey(keypair2);

        // Create a proper prior with matching commitment
        const priorN = await deps.kel.saidOfKeyset([pub1, pub2], 2);

        const prior = {
            d: s("Eprior").asSAID(),
            k: [pub1, pub2],
            kt: s("2").asThreshold(),
            n: priorN,
            nt: s("2").asThreshold()
        };

        const rotateKeys = makeRotateKeys(deps);
        const handle = await rotateKeys(s("Dcontroller").asAID(), prior, {
            newKeys: [pub1, pub2],
            newThreshold: 2
        });

        // Check that proposal was sent with canonical digest
        const messages = await transport.readUnread(s("Dcosigner0").asAID());
        expect(messages.length).toBeGreaterThan(0);

        const proposalMsg = messages.find(m => m.typ === "keri.rot.proposal.v1");
        expect(proposalMsg).toBeDefined();

        const proposal = JSON.parse(new TextDecoder().decode(proposalMsg!.body));
        expect(proposal.canonicalDigest).toBeDefined();
        expect(typeof proposal.canonicalDigest).toBe("string");
    });
});
