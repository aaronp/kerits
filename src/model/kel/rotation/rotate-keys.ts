/**
 * Key rotation workflow implementation
 * 
 * This module implements the multi-signature key rotation workflow
 * as described in the thoughts document.
 */

import type { KeyValueStore, SAID, Bytes, Transport, AID } from '../../io/types';
import type { KelEvent, KelEnvelope, Crypto } from '../../services/types';
import type { KelService } from '../../services/kel';
import type {
    RotationId,
    RotationHandle,
    RotationStatus,
    RotationProposal,
    RotationSign,
    RotationFinalize,
    RotationAbort,
    RotationProgressEvent
} from './types';
import { getJson, putJson } from '../../io/storage';

const enc = new TextEncoder();
const dec = new TextDecoder();

export interface RotateKeysDeps {
    clock: () => string;
    stores: { index: KeyValueStore; kels: KeyValueStore; };
    kel: KelService;
    transport: Transport;
    crypto: Crypto; // initiator
    // Maps prior.k[] pubs to AIDs and keyIndex positions
    resolveCosigners: (prior: KelEvent) => Promise<Array<{ aid: AID; keyIndex: number; pub: string }>>;
    appendKelEnv: (store: KeyValueStore, env: KelEnvelope) => Promise<void>;
}

// Helper to de-duplicate signatures by keyIndex (last-write-wins)
function mergeSignatures(existing: { keyIndex: number; sig: string }[], add: { keyIndex: number; sig: string }[]) {
    const map = new Map(existing.map(s => [s.keyIndex, s.sig]));
    for (const s of add) map.set(s.keyIndex, s.sig);
    return [...map.entries()].map(([keyIndex, sig]) => ({ keyIndex, sig }));
}

export function makeRotateKeys(deps: RotateKeysDeps) {
    return async function rotateKeys(
        controllerAid: AID,
        prior: KelEvent,
        opts?: {
            newKeys?: string[];
            newThreshold?: number;
            nextKeys?: string[];
            nextThreshold?: number;
            deadlineMs?: number;
            note?: string;
        }
    ): Promise<RotationHandle> {

        const now = deps.clock();

        // Reveal set and next-commit set
        // For reveal, we need to use the keys that were committed in the prior event
        // If no newKeys provided, we can't do a proper rotation without knowing what was committed
        const revealK = opts?.newKeys;
        const revealKt = opts?.newThreshold;

        if (!revealK || revealKt === undefined) {
            throw new Error("newKeys and newThreshold must be provided for rotation");
        }

        const next = (opts?.nextKeys && opts?.nextThreshold)
            ? { nextKeys: opts.nextKeys, nt: opts.nextThreshold }
            : deps.crypto.nextCommit();

        // Validate threshold ranges
        if (revealKt <= 0 || revealKt > revealK.length) {
            throw new Error(`Invalid reveal threshold: ${revealKt} (must be 0 < kt <= ${revealK.length})`);
        }
        if (next.nt <= 0 || next.nt > next.nextKeys.length) {
            throw new Error(`Invalid next threshold: ${next.nt} (must be 0 < nt <= ${next.nextKeys.length})`);
        }

        // Build rot candidate (unsigned)
        const rotEvent = deps.kel.rotate({
            controller: controllerAid,
            currentKeys: revealK,
            nextKeys: next.nextKeys,
            previousEvent: prior.d,
            transferable: true,
            keyThreshold: revealKt,
            nextThreshold: next.nt,
            dt: now,
        });

        // Enforce reveal == prior.n
        const revealSaid = deps.kel.saidOfKeyset(rotEvent.k!, deps.kel.decodeThreshold(rotEvent.kt!));
        console.log("Debug rotation:", {
            priorN: prior.n,
            revealSaid,
            rotEventK: rotEvent.k,
            rotEventKt: rotEvent.kt
        });
        if (revealSaid !== prior.n) throw new Error("Reveal does not match prior commitment");

        // Proposal id — SAID of canonical rot body (or SAID of a proposal doc)
        const rotationId: RotationId = deps.kel.saidOf(rotEvent);

        const priorKt = deps.kel.decodeThreshold(prior.kt!);
        const cosigners = await deps.resolveCosigners(prior);

        // Fast path for 1-of-1 rotations
        if (priorKt === 1) {
            const env = await deps.kel.sign(rotEvent, deps.crypto);
            await deps.appendKelEnv(deps.stores.kels, env);
            const final: RotationStatus = {
                id: rotationId,
                controller: controllerAid,
                phase: "finalized",
                createdAt: now,
                deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,
                required: priorKt,
                totalKeys: prior.k!.length,
                collected: 1,
                missing: 0,
                signers: cosigners.map(c => ({
                    aid: c.aid,
                    keyIndex: c.keyIndex,
                    required: true,
                    signed: true,
                    signature: c.keyIndex === 0 ? "self-signed" : undefined
                })),
                priorEvent: prior.d,
                revealCommit: revealSaid,
                nextThreshold: deps.kel.decodeThreshold(rotEvent.nt!)
            };
            const docKey = `rotation:${rotationId}`;
            await putJson(deps.stores.index, docKey as SAID, final);
            return {
                awaitAll: async () => final,
                status: async () => final,
                abort: async () => { },
                onProgress: () => () => { },
                resend: async () => { }
            };
        }

        const proposal: RotationProposal = {
            typ: "keri.rot.proposal.v1",
            rotationId,
            controller: controllerAid,
            priorEvent: prior.d,
            priorKeys: prior.k!,
            priorThreshold: priorKt,
            reveal: {
                newKeys: revealK,
                newThreshold: revealKt,
                nextCommit: { n: rotEvent.n!, nt: deps.kel.decodeThreshold(rotEvent.nt!) },
            },
            deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,
            note: opts?.note,
        };

        const docKey = `rotation:${rotationId}`;
        const status0: RotationStatus = {
            id: rotationId,
            controller: controllerAid,
            phase: "collecting", // Set to collecting after broadcast
            createdAt: now,
            deadline: proposal.deadline,
            required: priorKt,
            totalKeys: prior.k!.length,
            collected: 0,
            missing: priorKt,
            signers: cosigners.map(c => ({
                aid: c.aid,
                keyIndex: c.keyIndex,
                required: true,
                signed: false
            })),
            priorEvent: prior.d,
            revealCommit: revealSaid,
            nextThreshold: deps.kel.decodeThreshold(rotEvent.nt!)
        };

        await putJson(deps.stores.index, docKey as SAID, status0);

        // Progress events
        const listeners = new Set<(e: RotationProgressEvent) => void>();
        const onProgress = (e: RotationProgressEvent) => listeners.forEach(fn => fn(e));

        // Broadcast proposal
        const body = enc.encode(JSON.stringify(proposal));
        for (const s of status0.signers) {
            await deps.transport.send({
                id: rotationId,
                from: controllerAid,
                to: s.aid,
                typ: "keri.rot.proposal.v1",
                body,
                dt: now
            });
        }

        // Emit status:phase event for collecting
        onProgress({ type: "status:phase", rotationId, payload: "collecting" });

        // Subscribe for signatures
        const unsub = deps.transport.channel(controllerAid).subscribe(async (m: import('../../io/types').Message) => {
            if (m.typ !== "keri.rot.sign.v1") return;
            const msg = JSON.parse(dec.decode(m.body)) as RotationSign;
            if (msg.rotationId !== rotationId) return;

            const status = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
            if (!status || status.phase === "finalized" || status.phase === "aborted" || status.phase === "failed") return;

            // Bounds check on keyIndex
            if (msg.keyIndex < 0 || msg.keyIndex >= prior.k!.length) {
                onProgress({ type: "error", rotationId, payload: "invalid keyIndex" });
                return;
            }

            const signer = status.signers.find(s => s.keyIndex === msg.keyIndex);
            if (!signer) return;

            // Prevent duplicate signatures
            if (signer.signed) {
                onProgress({ type: "error", rotationId, payload: "duplicate keyIndex" });
                return;
            }

            // Authenticate who is signing
            if (m.from !== signer.aid) {
                onProgress({ type: "error", rotationId, payload: "signer AID mismatch" });
                return;
            }

            if (!msg.ok) {
                onProgress({ type: "signature:rejected", rotationId, payload: msg });
                return;
            }

            // Verify signature over canonical rot bytes using PRIOR key
            const canon = deps.kel.canonicalBytes(rotEvent);
            const pub = prior.k![msg.keyIndex];
            if (!msg.sig) {
                onProgress({ type: "error", rotationId, payload: "missing signature" });
                return;
            }
            const signature = msg.sig as string; // Type assertion for JSON parsing
            const ok = await deps.crypto.verify(canon, signature, pub);
            if (!ok) {
                onProgress({ type: "error", rotationId, payload: "bad signature" });
                return;
            }

            signer.signed = true;
            signer.signature = msg.sig;
            signer.seenAt = deps.clock();
            status.collected = status.signers.filter(s => s.signed && s.required).length;
            status.missing = Math.max(0, status.required - status.collected);
            status.phase = status.collected >= status.required ? "finalizable" : "collecting";
            await putJson(deps.stores.index, docKey as SAID, status);
            onProgress({ type: "signature:accepted", rotationId, payload: { keyIndex: msg.keyIndex } });
            if (status.phase === "finalizable") onProgress({ type: "status:phase", rotationId, payload: "finalizable" });
        });

        async function tryFinalize(): Promise<RotationStatus> {
            const status = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
            if (!status) throw new Error("rotation missing");
            if (status.phase !== "finalizable") return status;

            // Gather cosigner signatures (indexed) + add initiator's
            const cosigs = status.signers
                .filter(s => s.signed && s.signature)
                .map(s => ({ keyIndex: s.keyIndex, sig: s.signature! }));

            const selfEnv = await deps.kel.sign(rotEvent, deps.crypto); // adds your own indexed sig
            const env: KelEnvelope = {
                event: selfEnv.event,
                signatures: mergeSignatures(cosigs, selfEnv.signatures), // de-dupe on keyIndex if needed
            };

            // Publish rot to store with all signatures
            await deps.appendKelEnv(deps.stores.kels, env);

            // Notify finalize (optional broadcast to all cosigners)
            const fin: RotationFinalize = {
                typ: "keri.rot.finalize.v1",
                rotationId,
                rotEventSaid: rotEvent.d
            };
            await deps.transport.send({
                id: rotationId,
                from: controllerAid,
                to: controllerAid,
                typ: "keri.rot.finalize.v1",
                body: enc.encode(JSON.stringify(fin)),
                dt: deps.clock()
            });

            status.phase = "finalized";
            await putJson(deps.stores.index, docKey as SAID, status);
            onProgress({ type: "finalized", rotationId, payload: { rot: rotEvent.d } });
            unsub();
            return status;
        }

        const handle: RotationHandle = {
            async awaitAll(opts) {
                const timeoutMs = opts?.timeoutMs ?? 7 * 24 * 3600_000;
                const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                    const s = await tryFinalize();
                    if (s.phase === "finalized" || s.phase === "aborted" || s.phase === "failed") {
                        if (opts?.throwOnFail && s.phase !== "finalized") throw new Error(`rotation ${s.phase}`);
                        return s;
                    }
                    // If finalizable, try immediately to avoid extra loop tick
                    if (s.phase === "finalizable") {
                        const final = await tryFinalize();
                        if (final.phase === "finalized") return final;
                    }
                    await new Promise(r => setTimeout(r, 1200));
                }
                const cur = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
                if (cur) {
                    cur.phase = "failed";
                    await putJson(deps.stores.index, docKey as SAID, cur);
                    if (opts?.throwOnFail) throw new Error("rotation timed out");
                    return cur;
                }
                throw new Error("rotation missing");
            },
            async status() {
                const s = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
                if (!s) throw new Error("rotation missing");
                return s;
            },
            async abort(reason) {
                const s = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
                if (!s) return;
                s.phase = "aborted";
                await putJson(deps.stores.index, docKey as SAID, s);
                const abort: RotationAbort = {
                    typ: "keri.rot.abort.v1",
                    rotationId,
                    reason
                };
                await deps.transport.send({
                    id: rotationId,
                    from: controllerAid,
                    to: controllerAid,
                    typ: "keri.rot.abort.v1",
                    body: enc.encode(JSON.stringify(abort)),
                    dt: deps.clock()
                });
                onProgress({ type: "aborted", rotationId, payload: { reason } });
                unsub();
            },
            onProgress(handler) {
                listeners.add(handler);
                return () => listeners.delete(handler);
            },
            async resend() {
                const status = await getJson<RotationStatus>(deps.stores.index, docKey as SAID);
                if (!status || status.phase === "finalized" || status.phase === "aborted" || status.phase === "failed") return;

                // Re-broadcast proposal to missing cosigners
                const missingSigners = status.signers.filter(s => !s.signed && s.required);
                const body = enc.encode(JSON.stringify(proposal));
                for (const s of missingSigners) {
                    await deps.transport.send({
                        id: rotationId,
                        from: controllerAid,
                        to: s.aid,
                        typ: "keri.rot.proposal.v1",
                        body,
                        dt: deps.clock()
                    });
                }
            }
        };

        return handle;
    };
}
