import { describe, test, expect, beforeEach, vi } from "bun:test";

// ---- Minimal test doubles ------------------------------------

type SAID = string;
type Bytes = Uint8Array;

interface AID { uri: string }
interface Message { id: string; from: AID; to: AID; typ: string; body: Bytes; dt: string }

interface KeyValueStore {
    get(id: SAID): Promise<Bytes | null>;
    put(id: SAID, data: Bytes): Promise<void>;
    del?(id: SAID): Promise<void>;
}
const memStore = (): KeyValueStore => {
    const m = new Map<string, Bytes>();
    return {
        async get(id) { return m.get(id) ?? null; },
        async put(id, data) { m.set(id, data); },
        async del(id) { m.delete(id) }
    };
};

const enc = new TextEncoder();
const dec = new TextDecoder();

// Very small bus
interface Transport {
    send(m: Message): Promise<void>;
    channel(aid: AID): { subscribe: (fn: (m: Message) => void) => () => void }
}
const memoryTransport = (): Transport => {
    const subs = new Map<string, Set<(m: Message) => void>>();
    return {
        async send(m) {
            subs.get(m.to.uri)?.forEach(fn => fn(m));
        },
        channel(aid) {
            if (!subs.has(aid.uri)) subs.set(aid.uri, new Set());
            return {
                subscribe(fn) { subs.get(aid.uri)!.add(fn); return () => subs.get(aid.uri)!.delete(fn); }
            };
        }
    };
};

// Helpers
const putJson = (s: KeyValueStore, id: string, v: any) => s.put(id, enc.encode(JSON.stringify(v)));
const getJson = async <T>(s: KeyValueStore, id: string) => {
    const b = await s.get(id);
    return b ? JSON.parse(dec.decode(b)) as T : null;
};

// ---- Interfaces that match your module -----------------------

interface CesrSig { keyIndex: number; sig: string }

interface KelEvent {
    v: string; t: "icp" | "rot" | "ixn" | "dlg" | "rpy";
    d: SAID; i: AID; s: string; p?: SAID;
    k?: string[]; kt?: string;
    n?: SAID; nt?: string;
    a?: any[]; dt: string;
}
interface KelEnvelope { event: KelEvent; signatures: CesrSig[] }

interface Crypto {
    // NB: for tests: signatures are just "sig:<pub>:<payloadHex>"
    sign(data: Bytes, keyIndex: number): Promise<string>;
    verify(data: Bytes, sig: string, pub: string): Promise<boolean>;
    pubKeys(): string[];          // current (unused here)
    threshold(): number;          // current (unused here)
    nextCommit(): { nextKeys: string[]; nt: number };
    priorKeys?(): string[];       // used by initiatorShare
}

interface KelService {
    rotate(args: {
        controller: AID; prior: KelEvent; k: string[]; kt: number;
        nextK: string[]; nt: number; dt: string;
    }): Promise<KelEvent>;
    sign(ev: KelEvent, crypto: Crypto): Promise<KelEnvelope>;
    canonicalBytes(ev: KelEvent): Bytes;
    decodeThreshold(kt: string): number;
    saidOfKeyset(k: string[], kt: number): SAID;
    saidOf(ev: KelEvent): SAID;
    thresholdsEqual(threshold1: string, threshold2: string): boolean;
    verifyEnvelope(env: KelEnvelope): Promise<{
        valid: boolean;
        validSignatures: number;
        requiredSignatures: number;
        signatureResults: Array<{ signature: CesrSig; valid: boolean }>;
    }>;
}

// Deterministic SAID + "signatures"
const hex = (u8: Uint8Array) => Array.from(u8).map(b => b.toString(16).padStart(2, "0")).join("");
const saidOfBytes = (u8: Uint8Array) => "E" + hex(u8).slice(0, 10); // short fake said

const fakeKelService = (): KelService => ({
    async rotate({ controller, prior, k, kt, nextK, nt, dt }) {
        const ev: KelEvent = {
            v: "KERI10JSON0001aa_",
            t: "rot",
            d: "E?", // filled after canonical
            i: controller,
            s: (Number(prior.s) + 1).toString(),
            p: prior.d,
            k, kt: kt.toString(),
            n: "E" + (k.length * 7 + kt).toString(16).padStart(5, "0"), // not used, provided by prior in real impl
            nt: nt.toString(),
            dt
        };
        const d = saidOfBytes(new TextEncoder().encode(JSON.stringify(ev)));
        ev.d = d;
        return ev;
    },
    async sign(ev, crypto) {
        const canon = new TextEncoder().encode(JSON.stringify(ev));
        // sign with the *first* prior key index the crypto can provide; for tests we always use 0
        const sig = await crypto.sign(canon, 0);
        return { event: ev, signatures: [{ keyIndex: 0, sig }] };
    },
    canonicalBytes(ev) { return new TextEncoder().encode(JSON.stringify(ev)); },
    decodeThreshold(kt) { return Number(kt); },
    saidOfKeyset(k, kt) {
        return "E" + (k.join("|") + "|" + kt).length.toString(16).padStart(5, "0");
    },
    saidOf(ev) {
        return saidOfBytes(new TextEncoder().encode(JSON.stringify(ev)));
    },
    thresholdsEqual(threshold1, threshold2) {
        return threshold1 === threshold2;
    },
    async verifyEnvelope(env) {
        // Simple fake verification - just check that signatures exist
        const validSignatures = env.signatures.length;
        const requiredSignatures = 1; // Simple threshold for tests
        return {
            valid: validSignatures >= requiredSignatures,
            validSignatures,
            requiredSignatures,
            signatureResults: env.signatures.map(sig => ({ signature: sig, valid: true }))
        };
    }
});

// Crypto that "signs" by embedding the pub and payload into a predictable string.
const cryptoFor = (priorKeys: string[], nextKeys: string[] = [], nt = 1): Crypto => ({
    async sign(data, keyIndex) {
        const pub = priorKeys[keyIndex];
        return `sig:${pub}:${hex(data)}`;
    },
    async verify(data, sig, pub) {
        // Accept signatures for any pub, not just the ones we control
        return sig === `sig:${pub}:${hex(data)}`;
    },
    pubKeys() { return []; },
    threshold() { return 1; },
    nextCommit() { return { nextKeys, nt }; },
    priorKeys() { return priorKeys; },
});

// ---- Import your rotate-keys factory -------------------------
import { makeRotateKeys } from "./rotate-keys"; // path as in your tree

// ---- Fixtures ------------------------------------------------
const A = (id: string): AID => id as AID;

const priorEvent = (aid: AID, k: string[], kt: number): KelEvent => {
    // Create a fake KEL service to compute the correct n value
    const fakeKel = fakeKelService();
    const n = fakeKel.saidOfKeyset(k, kt);

    return {
        v: "KERI10JSON0001aa_",
        t: "rot",
        d: "Eprior",
        i: aid,
        s: "0",
        k,
        kt: String(kt),
        n,
        nt: String(kt),
        dt: new Date().toISOString()
    };
};

// ===================================================================
//                              TESTS
// ===================================================================

describe("rotate-keys workflow (core invariants)", () => {
    let index: KeyValueStore;
    let kels: KeyValueStore;
    let transport: Transport;
    let kel: KelService;
    const clock = () => new Date().toISOString();

    beforeEach(() => {
        index = memStore();
        kels = memStore();
        transport = memoryTransport();
        kel = fakeKelService();
    });

    test("AID mismatch rejection", async () => {
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB"], 2);

        const deps = {
            clock, stores: { index, kels }, kel, transport,
            crypto: cryptoFor(["pubA"]), // initiator only controls pubA, not pubB
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
            ],
            appendKelEnv: async (_s, _env) => { }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB"], newThreshold: 2, nextKeys: ["nextA", "nextB"], nextThreshold: 2
        });

        // subscribe progress to capture errors
        const errors: any[] = [];
        handle.onProgress(e => { if (e.type === "error") errors.push(e.payload); });

        // Get the actual rotation ID from the handle status
        const status = await handle.status();
        const rotationId = status.id;

        // Wait a bit for subscription to be established
        await new Promise(r => setTimeout(r, 10));

        // send a signature from the WRONG AID for keyIndex 0
        const rot = await kel.rotate({
            controller, prior,
            k: ["pubA", "pubB"], kt: 2, nextK: ["nextA", "nextB"], nt: 2, dt: clock()
        });
        const canon = kel.canonicalBytes(rot);
        const badSigner = A("E-Wrong");
        const goodSigner = A("E-A");
        await transport.send({
            id: "msg1", from: badSigner, to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({
                rotationId, signer: badSigner, keyIndex: 0,
                sig: `sig:pubA:${hex(canon)}`, ok: true
            })), dt: clock()
        });

        // give it a tick
        await new Promise(r => setTimeout(r, 100));
        expect(errors).toContain("signer AID mismatch");

        // now send matching AID -> should be accepted
        await transport.send({
            id: "msg2", from: goodSigner, to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({
                rotationId, signer: goodSigner, keyIndex: 0,
                sig: `sig:pubA:${hex(canon)}`, ok: true
            })), dt: clock()
        });
        await new Promise(r => setTimeout(r, 10));
        // no new errors
        const after = errors.filter(x => x === "signer AID mismatch").length;
        expect(after).toBe(1);
    });

    test("initiator-share reduces required cosigners", async () => {
        // prior has 2-of-3; initiator controls one prior key
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB", "pubC"], 2);

        const deps = {
            clock, stores: { index, kels }, kel, transport,
            // initiator controls pubA only
            crypto: cryptoFor(["pubA"]),
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
                { aid: A("E-C"), keyIndex: 2, pub: "pubC" },
            ],
            appendKelEnv: async (_s, _env) => { }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB", "pubC"], newThreshold: 2, nextKeys: ["nA", "nB", "nC"], nextThreshold: 2
        });

        const s0 = await handle.status();
        // missing should be 1 (2 required - 1 initiator prior key)
        expect(s0.missing).toBe(1);
    });

    test("cosigner sigs are verified over canonical rot body and published", async () => {
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB"], 2);

        const deps = {
            clock, stores: { index, kels }, kel, transport,
            crypto: cryptoFor(["pubA"]), // initiator only controls pubA
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
            ],
            appendKelEnv: async (store, env) => {
                await putJson(store, "published", env);
            }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB"], newThreshold: 2, nextKeys: ["nA", "nB"], nextThreshold: 2
        });

        // Get the actual rotation ID from the handle status
        const status = await handle.status();
        const rotationId = status.id;

        // Wait a bit for subscription to be established
        await new Promise(r => setTimeout(r, 10));

        // Get the rotEvent from the status instead of creating our own
        const rotEvent = status.rotEvent;
        const canon = kel.canonicalBytes(rotEvent);

        // send signatures from both cosigners
        await transport.send({
            id: "s1", from: A("E-A"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-A"), keyIndex: 0, sig: `sig:pubA:${hex(canon)}`, ok: true })),
            dt: clock()
        });
        await transport.send({
            id: "s2", from: A("E-B"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-B"), keyIndex: 1, sig: `sig:pubB:${hex(canon)}`, ok: true })),
            dt: clock()
        });

        const final = await handle.awaitAll({ timeoutMs: 2000 });
        expect(final.phase).toBe("finalized");

        const env = await getJson<KelEnvelope>(kels, "published");
        expect(env).not.toBeNull();
        // should contain both cosigner sigs + initiator's (order by keyIndex)
        expect(env!.signatures.length).toBeGreaterThanOrEqual(2);
        expect(env!.signatures.map(s => s.keyIndex)).toEqual([...env!.signatures.map(s => s.keyIndex)].sort((a, b) => a - b));
        // verify one sig explicitly
        expect(env!.signatures.some(s => s.sig === `sig:pubA:${hex(canon)}`)).toBeTrue();
    });

    test("duplicate signature value is rejected", async () => {
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB"], 2);

        const deps = {
            clock, stores: { index, kels }, kel, transport,
            crypto: cryptoFor(["pubA"]), // initiator only controls pubA
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
            ],
            appendKelEnv: async () => { }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB"], newThreshold: 2, nextKeys: ["nA", "nB"], nextThreshold: 2
        });

        // Get the actual rotation ID from the handle status
        const status = await handle.status();
        const rotationId = status.id;

        // Wait a bit for subscription to be established
        await new Promise(r => setTimeout(r, 10));

        // Get the rotEvent from the status instead of creating our own
        const rotEvent = status.rotEvent;
        const canon = deps.kel.canonicalBytes(rotEvent);

        // Send the same signature string twice (replay)
        const sig = `sig:pubA:${hex(canon)}`;

        const errors: any[] = [];
        handle.onProgress(e => { if (e.type === "error") errors.push(e.payload); });

        await transport.send({
            id: "s1", from: A("E-A"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-A"), keyIndex: 0, sig, ok: true })),
            dt: clock()
        });
        await transport.send({
            id: "s2", from: A("E-B"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-B"), keyIndex: 1, sig, ok: true })),
            dt: clock()
        });

        await new Promise(r => setTimeout(r, 100));
        expect(errors).toContain("duplicate signature");
    });

    test("immediate finalize when threshold reached", async () => {
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB"], 2);

        const deps = {
            clock, stores: { index, kels }, kel, transport,
            crypto: cryptoFor(["pubA"]), // initiator only controls pubA
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
            ],
            appendKelEnv: async () => { }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB"], newThreshold: 2, nextKeys: ["nA", "nB"], nextThreshold: 2
        });

        // Get the actual rotation ID from the handle status
        const status = await handle.status();
        const rotationId = status.id;

        // Wait a bit for subscription to be established
        await new Promise(r => setTimeout(r, 10));

        // Get the rotEvent from the status instead of creating our own
        const rotEvent = status.rotEvent;
        const canon = deps.kel.canonicalBytes(rotEvent);

        const phases: string[] = [];
        handle.onProgress(e => { if (e.type === "status:phase") phases.push(String(e.payload)); });

        // two signatures arrive back-to-back
        await transport.send({
            id: "s1", from: A("E-A"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-A"), keyIndex: 0, sig: `sig:pubA:${hex(canon)}`, ok: true })),
            dt: clock()
        });
        await transport.send({
            id: "s2", from: A("E-B"), to: controller, typ: "keri.rot.sign.v1",
            body: enc.encode(JSON.stringify({ rotationId, signer: A("E-B"), keyIndex: 1, sig: `sig:pubB:${hex(canon)}`, ok: true })),
            dt: clock()
        });

        const final = await handle.awaitAll({ timeoutMs: 1000 });
        expect(final.phase).toBe("finalized");
        expect(phases.includes("finalizable")).toBeTrue();
    });

    test("resend uses persisted proposal and targets only missing cosigners", async () => {
        const controller = A("E-controller");
        const prior = priorEvent(controller, ["pubA", "pubB", "pubC"], 2);

        const sentTo: string[] = [];
        const t = memoryTransport();
        const spySend = vi.spyOn(t, "send").mockImplementation(async (m) => {
            sentTo.push(m.to.uri);
            // also deliver to subscribers
            const ch = t.channel(m.to); ch["__direct"]?.(m);
        });
        // patch subscribe to expose direct call for test
        const origChan = t.channel;
        t.channel = (aid: AID) => {
            const ch = origChan(aid);
            (ch as any)["__direct"] = (m: Message) => (ch as any)._subs?.forEach?.((fn: (m: Message) => void) => fn(m));
            return ch;
        };

        const deps = {
            clock, stores: { index, kels }, kel, transport: t,
            crypto: cryptoFor(["pubA"]), // initiator controls pubA
            resolveCosigners: async () => [
                { aid: A("E-A"), keyIndex: 0, pub: "pubA" },
                { aid: A("E-B"), keyIndex: 1, pub: "pubB" },
                { aid: A("E-C"), keyIndex: 2, pub: "pubC" },
            ],
            appendKelEnv: async () => { }
        };

        const rotate = makeRotateKeys(deps);
        const handle = await rotate(controller, prior, {
            newKeys: ["pubA", "pubB", "pubC"], newThreshold: 2, nextKeys: ["nA", "nB", "nC"], nextThreshold: 2
        });

        // After start, missing should be 1 (needs either B or C). Call resend -> should send to both B and C (both missing).
        await handle.resend();
        expect(sentTo.filter(x => x === "E-B").length).toBeGreaterThan(0);
        expect(sentTo.filter(x => x === "E-C").length).toBeGreaterThan(0);
    });
});
