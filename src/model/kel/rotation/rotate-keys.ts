/**
 * Key rotation workflow implementation
 * 
 * This module implements the multi-signature key rotation workflow
 * as described in the thoughts document.
 */

import type { KeyValueStore, Transport, AID, Message } from '../../io/types';
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
import { getJsonString, putJsonString } from '../../io/storage';

// Default hashing implementation
function defaultHashBody(body: Uint8Array): string {
    try {
        // Node: use crypto module
        const crypto = require('crypto');
        return crypto.createHash("sha256").update(body).digest("base64url").slice(0, 16);
    } catch {
        // Fallback: simple hash (not cryptographically secure, but works for replay protection)
        let hash = 0;
        for (let i = 0; i < body.length; i++) {
            hash = ((hash << 5) - hash + body[i]) & 0xffffffff;
        }
        return Math.abs(hash).toString(36).slice(0, 16);
    }
}

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
    hashBody?: (body: Uint8Array) => string; // Optional hash function for replay protection
}

// Helper to de-duplicate signatures by keyIndex (last-write-wins)
function mergeSignatures(existing: { keyIndex: number; sig: string }[], add: { keyIndex: number; sig: string }[]) {
    const map = new Map(existing.map(s => [s.keyIndex, s.sig]));
    for (const s of add) map.set(s.keyIndex, s.sig);
    return [...map.entries()].map(([keyIndex, sig]) => ({ keyIndex, sig }));
}

// Helper to count how many prior keys the initiator controls
function countInitiatorPriorKeys(priorKeys: string[], initiatorPriorKeys: string[]): number {
    const set = new Set(initiatorPriorKeys);
    return priorKeys.reduce((acc, k) => acc + (set.has(k) ? 1 : 0), 0);
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
        const rotEvent = await deps.kel.rotate({
            controller: controllerAid,
            prior: prior,
            k: revealK,
            kt: revealKt,
            nextK: next.nextKeys,
            nt: next.nt,
            dt: now,
        });

        // Enforce reveal == prior.n
        const revealSaid = await deps.kel.saidOfKeyset(rotEvent.k!, deps.kel.decodeThreshold(rotEvent.kt!));
        if (revealSaid !== prior.n) throw new Error("Reveal does not match prior commitment");

        // Enforce revealKt === prior.nt (threshold equality)
        if (!deps.kel.thresholdsEqual(rotEvent.kt!, prior.nt!)) {
            throw new Error(`Reveal kt must equal prior nt`);
        }

        // Proposal id — SAID of canonical rot body (or SAID of a proposal doc)
        const rotationId: RotationId = rotEvent.d;

        const priorKt = deps.kel.decodeThreshold(prior.kt!);
        const cosigners = await deps.resolveCosigners(prior);

        // Calculate initiator's prior keys once, up-front
        const initiatorPriorKeys = deps.crypto.priorKeys?.() ?? [];
        const isInitiatorIndex = (i: number) => initiatorPriorKeys.includes(prior.k![i]!);

        // Preflight cosigner mapping validation
        {
            const seen = new Set<number>();
            for (const c of cosigners) {
                if (c.keyIndex < 0 || c.keyIndex >= prior.k!.length) throw new Error("cosigner keyIndex OOB");
                if (seen.has(c.keyIndex)) throw new Error("duplicate cosigner keyIndex");
                if (prior.k![c.keyIndex] !== c.pub) throw new Error("cosigner pub/keyIndex mismatch");
                seen.add(c.keyIndex);
            }
            // Ensure all *external* indices are mapped
            for (let i = 0; i < prior.k!.length; i++) {
                if (!isInitiatorIndex(i) && !seen.has(i)) {
                    throw new Error("incomplete cosigner mapping: missing external index " + i);
                }
            }
        }

        // Calculate initiator's share of prior keys for threshold calculation
        const initiatorShare = countInitiatorPriorKeys(prior.k!, initiatorPriorKeys);

        // Fast path when initiator alone can satisfy prior threshold
        if (initiatorShare >= priorKt) {
            // Local no-op emit for fast-path (onProgress not yet defined)
            const emit = (e: RotationProgressEvent) => { /* no-op in fast path */ };

            const env = await deps.kel.sign(rotEvent, deps.crypto); // This must include all initiator prior indices

            // Assert initiator signatures in fast-path
            const myIdx = prior.k!.map((k, i) => initiatorPriorKeys.includes(k) ? i : -1).filter(i => i >= 0);
            for (const i of myIdx) {
                if (!env.signatures.some(s => s.keyIndex === i)) {
                    throw new Error("missing initiator signature at prior index " + i);
                }
            }

            // Extra sanity on self signature indices
            for (const s of env.signatures) {
                if (s.keyIndex < 0 || s.keyIndex >= prior.k!.length) {
                    throw new Error(`self signature keyIndex OOB: ${s.keyIndex}`);
                }
            }

            const finalEnv: KelEnvelope = {
                event: env.event,
                signatures: env.signatures.sort((a, b) => a.keyIndex - b.keyIndex)
            };

            // Fast-path symmetry: verify before append (same as slow path)
            const ver = await deps.kel.verifyEnvelope(finalEnv);
            if (!ver.valid) {
                emit({ type: "finalize:invalid", rotationId, payload: ver.signatureResults });
                throw new Error(`final envelope invalid: ${ver.signatureResults.filter(r => !r.valid).length} invalid signatures`);
            }

            await deps.appendKelEnv(deps.stores.kels, finalEnv);

            // Emit finalization event (mirroring slow path)
            emit({ type: "finalized", rotationId, payload: { rot: rotEvent.d } });

            const final: RotationStatus = {
                id: rotationId,
                controller: controllerAid,
                phase: "finalized",
                createdAt: now,
                deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,
                required: priorKt,
                totalKeys: prior.k!.length,
                collected: initiatorShare,
                missing: 0,
                // Mark initiator-controlled prior keys as not required; they're satisfied by self-signing at publish.
                signers: cosigners.map(c => ({
                    aid: c.aid,
                    keyIndex: c.keyIndex,
                    required: !(c.aid === controllerAid || (prior.k?.[c.keyIndex] && initiatorPriorKeys.includes(prior.k[c.keyIndex]!))),
                    signed: !!(prior.k?.[c.keyIndex] && initiatorPriorKeys.includes(prior.k[c.keyIndex]!)),
                    signature: undefined
                })),
                priorEvent: prior.d,
                revealCommit: revealSaid,
                nextThreshold: deps.kel.decodeThreshold(rotEvent.nt!),
                rotEvent: rotEvent
            };
            const docKey = `rotation:${rotationId}`;
            await putJsonString(deps.stores.index, docKey, final);
            return {
                awaitAll: async () => final,
                status: async () => final,
                abort: async () => { },
                onProgress: () => () => { },
                finalizeNow: async () => final,
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
            canonicalDigest: rotEvent.d,  // SAID of the rot event to be signed
            deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,
            note: opts?.note,
        };

        const docKey = `rotation:${rotationId}`;

        // Persist proposal for deterministic resend
        await putJsonString(deps.stores.index, `${docKey}:proposal`, proposal);

        // Cache proposal in closure to avoid re-reading
        let cachedProposal: RotationProposal = proposal;

        const initialRequired = Math.max(0, priorKt - initiatorShare);
        // Build a set of initiator-controlled prior key indices. If resolveCosigners maps the
        // initiator's prior keys to an AID equal to controllerAid, or if the prior pub appears
        // in initiatorPriorKeys, we treat those as NOT required for collection (we'll add them
        // at finalize via self signing).
        const initiatorControlledIdx = new Set<number>();
        for (const c of cosigners) {
            const pubAtIndex = prior.k?.[c.keyIndex];
            if (pubAtIndex && (c.aid === controllerAid || initiatorPriorKeys.includes(pubAtIndex))) {
                initiatorControlledIdx.add(c.keyIndex);
            }
        }
        // Sort signers for determinism
        const signersSorted = [...cosigners].sort((a, b) => a.keyIndex - b.keyIndex);

        const status0: RotationStatus = {
            id: rotationId,
            controller: controllerAid,
            phase: "collecting", // Set to collecting after broadcast
            createdAt: now,
            deadline: proposal.deadline,
            required: priorKt,
            requiredExternal: initialRequired,
            totalKeys: prior.k!.length,
            collected: 0,
            missing: initialRequired,
            signers: signersSorted.map(c => ({
                aid: c.aid,
                keyIndex: c.keyIndex,
                // Only non-initiator signers count toward collection threshold
                required: !initiatorControlledIdx.has(c.keyIndex),
                signed: false
            })),
            priorEvent: prior.d,
            revealCommit: revealSaid,
            nextThreshold: deps.kel.decodeThreshold(rotEvent.nt!),
            rotEvent: rotEvent
        };

        await putJsonString(deps.stores.index, docKey, status0);

        // Progress events
        const listeners = new Set<(e: RotationProgressEvent) => void>();
        const onProgress = (e: RotationProgressEvent) => listeners.forEach(fn => fn(e));

        // Broadcast proposal only to required signers
        const body = enc.encode(JSON.stringify(proposal));
        for (const s of status0.signers.filter(s => s.required)) {
            try {
                await deps.transport.send({
                    id: rotationId,
                    from: controllerAid,
                    to: s.aid,
                    typ: "keri.rot.proposal.v1",
                    body,
                    dt: now
                });
                onProgress({ type: "send:ok", rotationId, payload: { signer: s.aid } });
            } catch (e) {
                onProgress({ type: "send:error", rotationId, payload: String(e) });
            }
        }

        // Emit status:phase event for collecting
        onProgress({ type: "status:phase", rotationId, payload: "collecting" });

        // Helper to normalize AIDs for comparison (future-proofing)
        const sameAid = (a: AID, b: AID) => a === b; // replace later if you add normalization

        // Message replay protection with capped and hashed set
        const seen = new Set<string>();
        const cap = 2000; // tune to your traffic

        function msgKeyOf(m: Message): string {
            const bodyHash = deps.hashBody ? deps.hashBody(m.body) : defaultHashBody(m.body);
            return m.id ?? `${m.from}|${m.typ}|${bodyHash}`;
        }

        function remember(key: string): void {
            seen.add(key);
            if (seen.size > cap) {
                // simple prune: delete first N (or keep a tiny FIFO queue)
                const it = seen.values();
                for (let i = 0; i < 200; i++) {
                    const v = it.next();
                    if (v.done) break;
                    seen.delete(v.value);
                }
            }
        }

        // Subscribe for signatures
        const unsub = deps.transport.channel(controllerAid).subscribe(async (m: Message) => {
            // Reject exact message replays (with fallback for missing IDs)
            const msgKey = msgKeyOf(m);
            if (seen.has(msgKey)) return;
            remember(msgKey);

            if (m.typ !== "keri.rot.sign.v1") return;
            const msg = JSON.parse(dec.decode(m.body)) as RotationSign;
            if (msg.rotationId !== rotationId) return;

            const status = await getJsonString<RotationStatus>(deps.stores.index, docKey);
            if (!status || status.phase === "finalized" || status.phase === "aborted" || status.phase === "failed") return;

            // Get the rotEvent from the status
            const rotEvent = status.rotEvent;

            // Bounds check on keyIndex
            if (msg.keyIndex < 0 || msg.keyIndex >= prior.k!.length) {
                onProgress({ type: "error", rotationId, payload: "invalid keyIndex" });
                return;
            }

            // Get the proposal to validate canonical digest
            const liveProposal = cachedProposal ?? await getJsonString<RotationProposal>(deps.stores.index, `${docKey}:proposal`);
            if (!liveProposal) {
                onProgress({ type: "error", rotationId, payload: "proposal not found" });
                return;
            }
            // Keep cachedProposal truly live
            if (liveProposal && liveProposal !== cachedProposal) {
                cachedProposal = liveProposal;
            }

            // Be strict that proposal SAID matches rot SAID
            if (liveProposal.canonicalDigest !== rotEvent.d) {
                onProgress({ type: "error", rotationId, payload: "proposal/event SAID mismatch" });
                return;
            }

            const signer = status.signers.find(s => s.keyIndex === msg.keyIndex);
            if (!signer) {
                onProgress({ type: "error", rotationId, payload: "unknown signer for keyIndex" });
                return;
            }

            // Prevent duplicate signatures
            if (signer.signed) {
                onProgress({ type: "error", rotationId, payload: "duplicate keyIndex" });
                return;
            }

            // Non-required signer (initiator's own prior key): still authenticate & verify,
            // then store but do not increment collected.
            if (!signer.required) {
                // AID must match the mapped signer
                if (!sameAid(m.from, signer.aid)) {
                    onProgress({ type: "error", rotationId, payload: "signer AID mismatch" });
                    return;
                }
                if (!msg.ok) {
                    onProgress({ type: "signature:rejected", rotationId, payload: msg });
                    return;
                }

                // Ensure keyIndex maps to the expected pub (belt-and-braces)
                const expected = cosigners.find(c => c.keyIndex === msg.keyIndex);
                const pubAtIndex = prior.k?.[msg.keyIndex];
                if (!expected || !pubAtIndex || expected.pub !== pubAtIndex) {
                    onProgress({ type: "error", rotationId, payload: "signer pub mismatch" });
                    return;
                }

                // Validate that cosigner is signing the correct canonical digest
                if (!msg.canonicalDigest || msg.canonicalDigest !== liveProposal.canonicalDigest) {
                    onProgress({ type: "error", rotationId, payload: "missing/incorrect canonical digest" });
                    return;
                }

                const canon = deps.kel.canonicalBytes(rotEvent);
                const pub = pubAtIndex;
                if (!msg.sig) {
                    onProgress({ type: "error", rotationId, payload: "missing signature" });
                    return;
                }
                const ok = await deps.crypto.verify(canon, msg.sig as string, pub);
                if (!ok) {
                    onProgress({ type: "error", rotationId, payload: "bad signature" });
                    return;
                }
                // Idempotency: avoid recording duplicate value
                if (status.signers.some(s => s.signature === msg.sig)) {
                    onProgress({ type: "error", rotationId, payload: "duplicate signature" });
                    return;
                }
                signer.signed = true;
                signer.signature = msg.sig;
                signer.seenAt = deps.clock();
                await putJsonString(deps.stores.index, docKey, status);
                onProgress({ type: "signature:stored_nonrequired", rotationId, payload: { keyIndex: msg.keyIndex, signer: signer.aid } });
                return;
            }

            // Prevent duplicate signature values (replay protection)
            if (status.signers.some(s => s.signature === msg.sig)) {
                onProgress({ type: "error", rotationId, payload: "duplicate signature" });
                return;
            }

            // Authenticate who is signing - compare AID URIs, not object identity
            if (!sameAid(m.from, signer.aid)) {
                onProgress({ type: "error", rotationId, payload: "signer AID mismatch" });
                return;
            }

            if (!msg.ok) {
                onProgress({ type: "signature:rejected", rotationId, payload: msg });
                return;
            }

            // Ensure keyIndex maps to the expected pub (belt-and-braces)
            const expected = cosigners.find(c => c.keyIndex === msg.keyIndex);
            const pubAtIndex = prior.k?.[msg.keyIndex];
            if (!expected || !pubAtIndex || expected.pub !== pubAtIndex) {
                onProgress({ type: "error", rotationId, payload: "signer pub mismatch" });
                return;
            }

            // Validate that cosigner is signing the correct canonical digest
            if (!msg.canonicalDigest || msg.canonicalDigest !== liveProposal.canonicalDigest) {
                onProgress({ type: "error", rotationId, payload: "missing/incorrect canonical digest" });
                return;
            }

            // Verify signature over canonical rot bytes (matches what will be published)
            const canon = deps.kel.canonicalBytes(rotEvent);
            const pub = pubAtIndex;
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

            // Calculate threshold accounting for initiator's share
            const required = status.requiredExternal ?? Math.max(0, status.required - initiatorShare);
            status.collected = status.signers.filter(s => s.signed && s.required).length;
            status.missing = Math.max(0, required - status.collected);
            status.phase = status.collected >= required ? "finalizable" : "collecting";

            // If we've reached the threshold, finalize immediately
            if (status.phase === "finalizable") {
                await putJsonString(deps.stores.index, docKey, status);
                onProgress({ type: "status:phase", rotationId, payload: "finalizable" });
                await tryFinalize(); // Kick off finalization immediately
                return;
            }

            await putJsonString(deps.stores.index, docKey, status);
            onProgress({ type: "signature:accepted", rotationId, payload: { keyIndex: msg.keyIndex, signer: signer.aid } });
        });

        async function tryFinalize(): Promise<RotationStatus> {
            const status = await getJsonString<RotationStatus>(deps.stores.index, docKey);
            if (!status) throw new Error("rotation missing");
            if (status.phase !== "finalizable") return status;

            // Re-check status after potential race condition
            const currentStatus = await getJsonString<RotationStatus>(deps.stores.index, docKey);
            if (!currentStatus) throw new Error("rotation missing");
            if (currentStatus.phase === "finalized") return currentStatus;
            if (currentStatus.phase !== "finalizable") return currentStatus;

            // Gather cosigner signatures (indexed) + add initiator's
            const cosigs = currentStatus.signers
                .filter(s => s.signed && s.signature)
                .map(s => ({ keyIndex: s.keyIndex, sig: s.signature! }));

            const selfEnv = await deps.kel.sign(rotEvent, deps.crypto); // This must include all initiator prior indices

            // Extra sanity on self signature indices
            for (const s of selfEnv.signatures) {
                if (s.keyIndex < 0 || s.keyIndex >= prior.k!.length) {
                    throw new Error(`self signature keyIndex OOB: ${s.keyIndex}`);
                }
            }

            const env: KelEnvelope = {
                event: selfEnv.event,
                signatures: mergeSignatures(cosigs.sort((a, b) => a.keyIndex - b.keyIndex), selfEnv.signatures)
                    .sort((a, b) => a.keyIndex - b.keyIndex), // stable ordering by keyIndex
            };

            // Optional: final verification before append
            const ver = await deps.kel.verifyEnvelope(env);
            if (!ver.valid) {
                onProgress({ type: "finalize:invalid", rotationId, payload: ver.signatureResults });
                throw new Error(`final envelope invalid: ${ver.signatureResults.filter(r => !r.valid).length} invalid signatures`);
            }

            // Publish rot to store with all signatures
            await deps.appendKelEnv(deps.stores.kels, env);

            // Notify finalize (optional broadcast to all cosigners)
            const fin: RotationFinalize = {
                typ: "keri.rot.finalize.v1",
                rotationId,
                rotEventSaid: rotEvent.d
            };
            try {
                await deps.transport.send({
                    id: rotationId,
                    from: controllerAid,
                    to: controllerAid,
                    typ: "keri.rot.finalize.v1",
                    body: enc.encode(JSON.stringify(fin)),
                    dt: deps.clock()
                });
            } catch (e) {
                onProgress({ type: "send:error", rotationId, payload: String(e) });
            }

            currentStatus.phase = "finalized";
            currentStatus.finalEnvelope = env;
            currentStatus.finalEventSaid = env.event.d;
            currentStatus.sigCount = env.signatures.length;
            await putJsonString(deps.stores.index, docKey, currentStatus);
            onProgress({ type: "finalized", rotationId, payload: { rot: rotEvent.d } });
            unsub();
            return currentStatus;
        }

        const handle: RotationHandle = {
            async awaitAll(opts) {
                const timeoutMs = opts?.timeoutMs ?? 7 * 24 * 3600_000;
                const start = Date.now();
                let warnedDeadline = false;
                let delay = 800; // Start with shorter delay
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

                    // Check for deadline warning (24 hours before deadline) - throttled to once
                    if (!warnedDeadline && s.deadline && Date.parse(s.deadline) - Date.now() < 86_400_000) {
                        warnedDeadline = true;
                        onProgress({ type: "deadline:near", rotationId });
                    }

                    await new Promise(r => setTimeout(r, delay));
                    delay = Math.min(delay + 400, 5000); // Linear backoff, max 5s
                }
                const cur = await getJsonString<RotationStatus>(deps.stores.index, docKey);
                if (cur) {
                    cur.phase = "failed";
                    await putJsonString(deps.stores.index, docKey, cur);
                    unsub(); // prevent leaks
                    if (opts?.throwOnFail) throw new Error("rotation timed out");
                    return cur;
                }
                throw new Error("rotation missing");
            },
            async status() {
                const s = await getJsonString<RotationStatus>(deps.stores.index, docKey);
                if (!s) throw new Error("rotation missing");
                return s;
            },
            async abort(reason) {
                const s = await getJsonString<RotationStatus>(deps.stores.index, docKey);
                if (!s) return;
                s.phase = "aborted";
                await putJsonString(deps.stores.index, docKey, s);
                const abort: RotationAbort = {
                    typ: "keri.rot.abort.v1",
                    rotationId,
                    reason
                };
                try {
                    await deps.transport.send({
                        id: rotationId,
                        from: controllerAid,
                        to: controllerAid,
                        typ: "keri.rot.abort.v1",
                        body: enc.encode(JSON.stringify(abort)),
                        dt: deps.clock()
                    });
                } catch (e) {
                    onProgress({ type: "send:error", rotationId, payload: String(e) });
                }
                onProgress({ type: "aborted", rotationId, payload: { reason } });
                unsub();
            },
            onProgress(handler) {
                listeners.add(handler);
                return () => listeners.delete(handler);
            },
            async finalizeNow() {
                return tryFinalize();
            },
            async resend() {
                const status = await getJsonString<RotationStatus>(deps.stores.index, docKey);
                if (!status || status.phase === "finalized" || status.phase === "aborted" || status.phase === "failed") return;

                // Emit progress signal for resend activity
                onProgress({ type: "resend:proposal", rotationId });

                // Re-broadcast proposal to missing cosigners
                const missingSigners = status.signers.filter(s => !s.signed && s.required);

                // Use persisted proposal for deterministic resend
                const savedProposal = await getJsonString<RotationProposal>(deps.stores.index, `${docKey}:proposal`);
                const proposalToSend = savedProposal ?? proposal;
                const body = enc.encode(JSON.stringify(proposalToSend));
                for (const s of missingSigners) {
                    try {
                        await deps.transport.send({
                            id: rotationId,
                            from: controllerAid,
                            to: s.aid,
                            typ: "keri.rot.proposal.v1",
                            body,
                            dt: deps.clock()
                        });
                    } catch (e) {
                        onProgress({ type: "send:error", rotationId, payload: String(e) });
                    }
                }
            }
        };

        return handle;
    };
}
