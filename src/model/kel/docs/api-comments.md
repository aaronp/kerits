# Proposition:
My KERITS system is growing in capability and complexity. I need strong confidence against regression tests, and to be able to quickly/easily visually see what it's doing. 

To that end, I'd like to be able to ask the API to 'dump' it's state -- provide a single, readable (e.g. json) value of its view of the world: 
 * The aliases
 * the kelevents
 * the cesr values
 * ...
 
 Given the system is referentially transparent, I should also be able to write clearer tests: 
  * do a thing (i.e. incept an account, rotate a key)
  * dump the state / inspect -- if visually ok, then save that output as a regression file 
  * serialisation. Prove we can also read back the dumped state, and do deep object equality to prove the read and write works
  * the test is now just a diff against actual vs previous, with clear/transparent inputs and outputs
  
  
# Following Conversation:
Yes! Snapshots + golden files are perfect for a system like this. 
Here’s a tight plan and drop-in API so you can:

* dump the whole world (deterministically),
* diff it in tests (golden/regression),
* reload it to prove read↔write correctness,
* and inspect signatures/SAIDs easily.

I’ll keep secrets redacted by default, with a toggle for local-only tests.


# **Design goals**

* **Deterministic**: same inputs ⇒ byte-identical dump.

  * Sort keys, sort arrays, avoid nondeterministic fields.

* **Complete** (enough to replay): aliases, chains, events, envelopes (CESR), receipts (when you add them), and a **public vault view** (pubkeys only).

* **Portable**: rich enough for another peer to verify SAIDs and sigs.

* **Safe by default**: **no secret material** in dumps unless explicitly requested.

---

# **Snapshot shape (single JSON)**

```ts
export interface KelSnapshot {
  version: 1;
  createdAt: string;          // ISO, informational; not used in equality
  digest: string;             // sha256 of canon(snapshot.withoutDigest)
  aliases: Array<{ alias: string; aid: AID }>;
  aids: Array<{
    aid: AID;
    alias?: string;
    chain: Array<{
      said: SAID;
      type: string;           // 'icp' | 'rot' | 'ixn' | 'dip' | 'drt' ...
      sn: number;             // event sequence as number
      event: KelEvent;        // canonical event JSON
      eventCesr: string;      // qb64 canonical bytes (source of truth)
      signatures: CesrSig[];  // with signerSet refs
      receipts?: CesrSig[];
      eventHash: string;      // sha256 of canonical bytes (duplicate of SAID check, helpful in diffs)
    }>;
    meta: ChainMetadata;
    vault: {
      current: string[];      // public keys
      next: string[];         // public keys
      // secrets?: string[]    // optional (only if includeSecrets: true)
    };
  }>;
}
```

* **Why include `event` and `eventCesr`?**

  * CESR is the source of truth for verifying SAID & signatures.

  * JSON is convenient for eyeballing.

* **`eventHash`** is redundant with SAID in KERI, but nice for quick diffs.

---

# **New API surface**

Add to `KelApi`:

```ts
dumpState(args?: { includeSecrets?: boolean }): Promise<KelSnapshot>;
loadState(snapshot: KelSnapshot, opts?: { allowSecrets?: boolean, truncateExisting?: boolean }): Promise<void>;
```

* `includeSecrets` defaults to `false`. If `true`, we include base64url-encoded secret handles (only for local/dev).

* `truncateExisting`: if true, clears stores first (for deterministic load tests).

---

# **Determinism rules**

(See my comment about leveraging our [Data](../../data/data.ts) capability for a cononical representation and SAIDIFY the data below)

* Sort everything:

  * `aliases` by lowercase alias;
  * `aids` by AID;
  * `chain` by sequence;
  * `signatures` and `receipts` by `signerSet.kind`, then `sn`, then `keyIndex`.

* Canonical JSON for the final file: use a stable stringifier (sorted keys). You already have canonicalization for events via CESR; for **dump file** determinism, implement a small `canonicalStringify`.

---

# **Implementation (drop-in)**

## **1) Helpers**

```ts
function stableCompare<T>(a: T, b: T): number { return a < b ? -1 : a > b ? 1 : 0; }

function sortSignatures(xs: CesrSig[]): CesrSig[] {
  return [...xs].sort((a,b) => {
    const ak = a.signerSet.kind, bk = b.signerSet.kind;
    if (ak !== bk) return stableCompare(ak, bk);
    const asn = (a.signerSet as any).sn ?? -1;
    const bsn = (b.signerSet as any).sn ?? -1;
    if (asn !== bsn) return asn - bsn;
    return a.keyIndex - b.keyIndex;
  });
}

function canonicalStringify(obj: any): string {
  // Simple deterministic JSON stringify: sorts object keys recursively.
  const seen = new WeakSet();
  const normalize = (val: any): any => {
    if (val && typeof val === 'object') {
      if (seen.has(val)) return null;
      seen.add(val);
      if (Array.isArray(val)) return val.map(normalize);
      const out: any = {};
      for (const k of Object.keys(val).sort()) out[k] = normalize(val[k]);
      return out;
    }
    return val;
  };
  return JSON.stringify(normalize(obj));
}

function sha256Hex(u8: Uint8Array): string {
  // For Bun/Node use crypto.subtle if you want async; here a sync Buffer hash:
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(u8).digest('hex');
}
```

## **2) `dumpState`**

```ts
async function loadState(snapshot: KelSnapshot, opts?: { allowSecrets?: boolean, truncateExisting?: boolean }): Promise<void> {
  // Optional: wipe stores
  if (opts?.truncateExisting) {
    // if your KeyValueStore has no clear(), re-create inMemory stores or provide a truncate API
    // For now we assume caller provided fresh inMemory stores for tests.
  }

  // Verify digest first
  const { digest, ...withoutDigest } = snapshot as any;
  const canon = canonicalStringify(withoutDigest);
  const recomputed = sha256Hex(Buffer.from(canon));
  if (recomputed !== snapshot.digest) throw new Error(`Snapshot digest mismatch`);

  // Write aliases
  const aliasMap = { aliasToAid: {} as Record<string,AID>, aidToAlias: {} as any };
  for (const { alias, aid } of snapshot.aliases) {
    const lower = alias.toLowerCase();
    aliasMap.aliasToAid[lower] = aid;
    aliasMap.aidToAlias[aid] = { key: lower, display: alias };
  }
  await putJson(stores.aliases, 'mapping', aliasMap);

  // For each aid, write events/envelopes/vault/chain in safe order
  for (const a of snapshot.aids) {
    // events & envelopes
    for (const e of a.chain) {
      await kel.putEvent(e.event);
      // envelope: ensure we have eventCesr and signatures
      const env: KelEnvelope = {
        event: e.event,
        eventCesr: e.eventCesr,
        signatures: e.signatures ?? [],
        receipts: e.receipts ?? []
      };
      await kel.putEnvelope(env);
    }

    // vault (public only). If you allow secrets in tests, setKeyset with decoded values.
    if (opts?.allowSecrets) {
      // Implement only if you stored secrets in snapshot.
    } else {
      // synthesize a vault view from public keys by setting dummies (or skip setting vault entirely).
      // Better: leave vault empty; tests that rely on signing should generate fresh keys.
    }

    // chain meta last (atomic read consistency)
    await kel.putChain(a.meta);
  }
}
```

## **3) `loadState`**

```ts
async function loadState(snapshot: KelSnapshot, opts?: { allowSecrets?: boolean, truncateExisting?: boolean }): Promise<void> {
  // Optional: wipe stores
  if (opts?.truncateExisting) {
    // if your KeyValueStore has no clear(), re-create inMemory stores or provide a truncate API
    // For now we assume caller provided fresh inMemory stores for tests.
  }

  // Verify digest first
  const { digest, ...withoutDigest } = snapshot as any;
  const canon = canonicalStringify(withoutDigest);
  const recomputed = sha256Hex(Buffer.from(canon));
  if (recomputed !== snapshot.digest) throw new Error(`Snapshot digest mismatch`);

  // Write aliases
  const aliasMap = { aliasToAid: {} as Record<string,AID>, aidToAlias: {} as any };
  for (const { alias, aid } of snapshot.aliases) {
    const lower = alias.toLowerCase();
    aliasMap.aliasToAid[lower] = aid;
    aliasMap.aidToAlias[aid] = { key: lower, display: alias };
  }
  await putJson(stores.aliases, 'mapping', aliasMap);

  // For each aid, write events/envelopes/vault/chain in safe order
  for (const a of snapshot.aids) {
    // events & envelopes
    for (const e of a.chain) {
      await kel.putEvent(e.event);
      // envelope: ensure we have eventCesr and signatures
      const env: KelEnvelope = {
        event: e.event,
        eventCesr: e.eventCesr,
        signatures: e.signatures ?? [],
        receipts: e.receipts ?? []
      };
      await kel.putEnvelope(env);
    }

    // vault (public only). If you allow secrets in tests, setKeyset with decoded values.
    if (opts?.allowSecrets) {
      // Implement only if you stored secrets in snapshot.
    } else {
      // synthesize a vault view from public keys by setting dummies (or skip setting vault entirely).
      // Better: leave vault empty; tests that rely on signing should generate fresh keys.
    }

    // chain meta last (atomic read consistency)
    await kel.putChain(a.meta);
  }
}
```

## **4) Wire into your `ops` return**

Add in `KelStores.ops`:

```ts
return {
  // existing methods...
  createAccount, rotateKeys, getAccount, getAidByAlias, getKelChain, getLatestSequence, getKeys,
  getEventProof, verifyEventProof,
  // NEW:
  dumpState,
  loadState,
};

```

---

# **Test pattern (Bun/Jest)**

```ts
test('golden snapshot', async () => {
  const stores = KelStores.inMemory();
  const api = KelStores.ops(stores);

  // 1) do a thing
  const acc = await api.createAccount({ alias: 'alice' });

  // 2) dump snapshot
  const snap = await api.dumpState();

  // 3) compare to golden
  const fs = await import('node:fs/promises');
  const path = 'testdata/golden/kel-01.json';
  const want = await fs.readFile(path, 'utf8');
  const got  = canonicalStringify(snap);

  if (process.env.UPDATE_GOLDEN) {
    await fs.writeFile(path, got); // accept new
  } else {
    expect(got).toBe(want);
  }

  // 4) reload and deep-equal
  const stores2 = KelStores.inMemory();
  const api2 = KelStores.ops(stores2);
  await api2.loadState(JSON.parse(got)); // no secrets

  const got2 = canonicalStringify(await api2.dumpState());
  expect(got2).toBe(got); // read <-> write stable
});

```

---

# **Visual inspection (optional but easy)**

* Add a tiny helper that **pretty-prints** a single AID: `api.dumpAid(aid)` returning `{ chain:[{sn, type, said, keySummary}], receiptsCoverage, thresholds }`.

* Or generate a **Mermaid sequence** or a compact **HTML** debug view from the snapshot (later).

---

# **A few gotchas & tips**

* **Timestamps:** they’ll vary. They’re part of canonical event bytes; for regression tests keep fixed times via your existing `timestamp` parameters.

* **Secrets:** keep out of snapshots by default. If you add them for a local test, store them base64url-encoded and gate load with `allowSecrets`.

* **Unknown events:** snapshots should tolerate future event types—store `event.t` as string and keep the raw `eventCesr`.

* **Receipts/witnesses:** as you add these, extend snapshot with `receipts` per event. Your `getEventProof` can then merge controller signatures \+ receipts.

---

## Notes:

Let's be sure to leverage our existing [Data](../../data/data.ts) ability, e.g. using 'saidify' already knows how to create a cononical json representation with sorted keys.


The trick is to sort/normalize any *semantic* lists (aliases, chain order, sig arrays) first.

Then **hand the final object** to `saidify` to get deterministic bytes/strings for digests, golden files, and read↔write checks.

Below is a drop-in way to wire it in, replacing the ad-hoc `canonicalStringify`.

---

## **1) A tiny, centralized canonicalizer wrapper**

Make one helper and use it everywhere (snapshot digests, test equality):

// canon.ts
```ts
// canon.ts
// Wrap your existing Data.saidify (name/args may differ in your codebase)
import { Data } from '../data'; // where saidify lives

type SaidifyOpts = {
  // If your saidify injects SAIDs (.d) into objects, keep it OFF for snapshots
  // unless you explicitly want SAIDs added to the dump structure.
  injectSaids?: boolean; // default false
};

export function canonBytes(obj: unknown, opts?: SaidifyOpts): Uint8Array {
  // Pseudocode — adapt to your saidify’s actual API:
  // Expect something like: Data.saidify(object, { sortKeys: true, injectSaids: false }) -> { raw: Uint8Array, text?: string }
  const { raw } = Data.saidify(obj, { sortKeys: true, injectSaids: !!opts?.injectSaids });
  return raw;
}

export function canonString(obj: unknown, opts?: SaidifyOpts): string {
  const raw = canonBytes(obj, opts);
  // Safe UTF-8 decode for your snapshots
  return new TextDecoder().decode(raw);
}

```

**Why:**

* You get **one** canonical path.

* If `saidify` evolves, you update here, not everywhere.

If your `saidify` always injects `.d`, pass an option to disable it for snapshots. If that doesn’t exist, deep-clone → delete `.d` before calling it.

---

## **2) Sort lists before you ‘saidify’**

`saidify` sorts **object keys**, not semantic arrays (and it shouldn’t). Keep your deterministic sorting just before canonicalization:

* aliases → sort by lowercase alias

* aids → sort by AID

* chain → sort by `sn`

* signatures/receipts → sort by `(kind, sn, keyIndex)`

(You already have a `sortSignatures` in the earlier plan—keep it.)

---

## **3) Use `saidify` for snapshot digests and golden files**

Replace the previous digest/stringify with your wrapper:

```ts
import { canonBytes, canonString } from './canon';
import { createHash } from 'node:crypto';

function sha256Hex(u8: Uint8Array): string {
  return createHash('sha256').update(u8).digest('hex');
}

// When building the snapshot:
const skeleton = { version: 1, createdAt, aliases, aids };
// Important: do NOT include `digest` inside the bytes you hash
const bytes = canonBytes(skeleton, { injectSaids: false });
const digest = sha256Hex(bytes);
const snapshot = { ...skeleton, digest };

// For golden tests and read↔write equality:
const golden = canonString(snapshot, { injectSaids: false });

```

Keep `createdAt` out of equality if you want strict byte-identical diffs. Easiest is to **omit** it from the skeleton you hash/stringify, or set it deterministically in tests.

---

## **4) Still use CESR for events (source of truth)**

For each `KelEvent` you already have **CESR canonical bytes** (what peers verify). Keep that as the event truth:

* `eventCesr` (qb64) stays the thing you use for SAID/signature checks.

* `saidify` is for **snapshot determinism** (a separate concern from KERI wire format).

This gives you two layers:

* **Wire/cross-peer**: CESR (`eventCesr`, signatures).

* **Dev/test snapshot**: `saidify` to canonicalize the **snapshot JSON**.

---

## **5) Minimal patches in your snapshot code**

Replace the earlier custom canonicalization with `saidify`:

```ts
// build `skeleton` as before (after sorting arrays)
const bytes  = canonBytes(skeleton, { injectSaids: false });
const digest = sha256Hex(bytes);
return { ...skeleton, digest };
```

…and for loading/validating:

```ts
const { digest, ...withoutDigest } = snapshot;
const bytes = canonBytes(withoutDigest, { injectSaids: false });
if (sha256Hex(bytes) !== digest) throw new Error('Snapshot digest mismatch');
```

---

## **6) Bonus: unify event serialization too (optional)**

If your `KEL.serialize(evt)` already calls `saidify` internally, you’re done. If not, implement it on top:

```ts
// KEL.serialize
export function serialize(evt: KelEvent): { raw: Uint8Array; qb64: string } {
  const raw = canonBytes(evt, { injectSaids: true }); // for events you *do* want .d injected prior to hashing
  const qb64 = CESR.bytesToQb64(raw);                 // your CESR helper
  return { raw, qb64 };
}

```

For events you’ll sign/verify, you typically **inject** SAID (`.d`) in canonical order so everyone hashes & signs the same bytes. Keep that behaviour in your event path; snapshots can use `injectSaids:false`.

---

## **7) What this buys you**

* **One canonical engine** (saidify) drives:

  * event bytes (via `KEL.serialize`)

  * snapshot bytes / golden files (via `canonBytes/String`)

* **Deterministic diffs**: your dump files are stable even across machines.

* **Clean separation** of concerns: CESR for KERI wire-truth, saidify for JSON snapshot determinism.

