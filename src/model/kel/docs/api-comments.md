
# **1) Stop re-creating repos per call**

You construct `aliasRepo/kelRepo/vaultRepo` inside each method. Build them **once** so you don’t risk skew between calls and you keep your ops pure.

```ts
export namespace KelStores {
  export const ops = (stores: KelStores): KelApi => {
    const aliases = aliasRepo(stores.aliases);
    const kel     = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
    const vault   = vaultRepo(stores.vault);

    return {
      async createAccount(args) { /* use the captured aliases/kel/vault */ },
      async rotateKeys(args)   { /* ... */ },
      async getAccount(args)   { /* ... */ },
      async getAidByAlias(a)   { return aliases.get(a); },
      async getKelChain(aid)   { /* ... */ },
      async getLatestSequence(aid) { /* ... */ },
      async getKeys(aid) { /* ... */ }
    };
  };
}

```

  ---

  # **2) Canonicalize → SAID → sign (don’t mutate `s` after building)**

Right now you patch `rot.s` after `KEL.rotation(...)`. That can break the SAID (hash) and signature. Pass `sequence` into the builder so the event’s canonical bytes, SAID, and signature all match.

```ts
// Before:
const rot = KEL.rotation({ /* ... */ });
rot.s = (meta.sequence + 1).toString(); // ❌ dangerous

// After: pass sequence into builder and let it compute SAID from canonical bytes
const nextSeq = meta.sequence + 1;
const rot = KEL.rotation({
  controller: aid,
  previousEvent: meta.latestEvent,
  sequence: nextSeq,                // ✅
  currentKeys: [keyset.next.publicKey],
  nextKeys: [CESR.getPublicKey(nextNext)],
  transferable: true,
  keyThreshold: 1,
  nextThreshold: 1,
  dt: timestamp,
});

```


Also ensure your `KEL.rotation` and `KEL.inception` functions **canonicalize** deterministically before hashing to `d`. If you don’t already, add a single `canonicalize(evt) -> Uint8Array` used by both builders and verifiers.

---

# **3) Verify against *state*, not just prior event**

`verifyEnvelope(env, priorEvent)` is a start, but rotation must be checked against **previous state**: prior SAID link, prior thresholds, and that the revealed `currentKeys` \== prior `nextKeys`. Prefer a rotation-specific verifier:

```ts
KEL.verifyRotation(rot, {
  priorSaid: meta.latestEvent,
  expectedSeq: meta.sequence + 1,
  revealedKeys: [keyset.next.publicKey],
  priorKeyThreshold: 1,
  priorSignerKeys: [keyset.current.publicKey],
  witnessSet: undefined, // optional
});

```

If you keep `verifyEnvelope`, make it accept a small `context` object with the above fields, not just the prior event.

---

# **4) Make writes atomic (best-effort “unit of work”)**

If your KV isn’t transactional, **write in this order** and fail early. Only publish `ChainMetadata` last (the thing readers rely on):

```ts
// 1) putEvent
// 2) putEnvelope
// 3) vault.setKeyset (advance)
// 4) putChain (last)

// On any error before step 4, fail without touching chain metadata.
// Readers then never observe partial state.

```


Optional: expose a tiny helper to enforce the order & catch/log:

```ts
async function commitRotation({ kel, vault }, { rot, env, newKeyset, updatedChain }: {
  rot: KelEvent, env: KelEnvelope,
  newKeyset: any, updatedChain: ChainMetadata
}) {
  await kel.putEvent(rot);
  await kel.putEnvelope(env);
  await vault.setKeyset(updatedChain.aid, newKeyset);
  await kel.putChain(updatedChain);
}

```
    
  ---

  # **5) Vault: avoid leaking raw secret bytes; fix serialization**

You currently expose `privateKeySeed: Uint8Array` outward. At minimum, don’t surface that in the public `VaultEntry` return path. And when serializing, don’t rely on `Object.values` (ordering pitfalls); use a defined encoding like **base64url**.

```ts
// vaultRepo
function toB64(u8: Uint8Array) { return CESR.bytesToB64Url(u8); }
function fromB64(s: string)    { return CESR.b64UrlToBytes(s); }

async setKeyset(aid, ks) {
  await putJsonString(store, `keys:${aid}`, {
    current: { publicKey: ks.current.publicKey, secretHandle: toB64(ks.current.secretHandle) },
    next:    { publicKey: ks.next.publicKey,    secretHandle: toB64(ks.next.secretHandle)    }
  });
}
async getKeyset(aid) {
  const raw = await getJsonString<any>(store, `keys:${aid}`);
  if (!raw) return null;
  return {
    current: { publicKey: raw.current.publicKey, secretHandle: fromB64(raw.current.secretHandle) },
    next:    { publicKey: raw.next.publicKey,    secretHandle: fromB64(raw.next.secretHandle)    }
  };
}

```


And change `getKeys` to **not** return secrets:

```ts
async getKeys(aid) {
  const ks = await vault.getKeyset(aid);
  if (!ks) return null;
  return {
    aid,
    currentKeys: [{ publicKey: ks.current.publicKey }],
    nextKeys:    [{ publicKey: ks.next.publicKey }]
  } as VaultEntry; // or define a SafeVaultView type
}

```
    
  ---

  # **6) Alias mapping: preserve display name**

You lower-case aliases for keys (👍), but you store lowercased values in `aidToAlias` too, which loses original formatting. Keep both:

```ts
type AliasRecord = { key: string; display: string };
interface AliasMapping {
  aliasToAid: Record<string, AID>;          // key = lower(alias)
  aidToAlias: Record<AID, AliasRecord>;     // preserve display
}

async set(alias, aid) {
  const lower = alias.toLowerCase();
  const next: AliasMapping = {
    aliasToAid: { ...m.aliasToAid, [lower]: aid },
    aidToAlias: { ...m.aidToAlias, [aid]: { key: lower, display: alias } }
  };
  await putJsonString(store, 'mapping', next);
}
async reverse(aid) {
  const m = await getAliasMapping(store);
  return m.aidToAlias[aid]?.display ?? null;
}
```
    
  ---

  # **7) Consistency: `getJson` vs `getJsonString`**

You mix both; that leads to subtle bugs. Pick one (I’d keep `getJson/putJson` everywhere) and change `kelRepo` accordingly:

```ts
async getChain(aid) { return await getJson<ChainMetadata>(meta, `chain:${aid}`); }
async putChain(cm)  { await putJson(meta, `chain:${cm.aid}`, cm); }

```
    
  ---

  # **8) Event/envelope keys**

You store envelopes under `env.event.d`. Standardize:

 * Events: `kel:event:${said}`
 * Envelopes: `kel:env:${said}`
 * Chain meta: `kel:chain:${aid}`

Your adapters already follow that pattern via key strings; just keep it consistent across the codebase (and tests).

---

# **9) Guard against concurrent rotations**

Add a simple per-AID mutex to avoid races:

```ts
const locks = new Map<AID, Promise<void>>();

async function withAidLock<T>(aid: AID, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(aid) ?? Promise.resolve();
  let release!: () => void;
  const curr = new Promise<void>(res => (release = res));
  locks.set(aid, prev.then(() => curr));
  try { await prev; return await fn(); }
  finally { release(); if (locks.get(aid) === curr) locks.delete(aid); }
}

// usage
await withAidLock(aid, async () => {
  // read meta, verify, write event/env/vault/chain
});

```
    
  ---

  # **10) Tighten error types (actionable failures)**

Swap generic `Error` for a tiny union to simplify caller logic:

```ts
class KelError extends Error { code: string; constructor(code: string, msg?: string){ super(msg ?? code); this.code = code; } }
const err = {
  AliasExists: (a:string)=> new KelError('AliasExists', `Alias '${a}' already exists`),
  UnknownAID: (a:AID)=> new KelError('UnknownAID', `Unknown AID ${a}`),
  KeysetMissing: (a:AID)=> new KelError('KeysetMissing', `No keys for ${a}`),
  BadSignature: ()=> new KelError('BadSignature'),
  SequenceGap: ()=> new KelError('SequenceGap'),
};
```
    
  ---

  # **11) Small correctness nits I spotted**

* `rotateKeys` builds `rot` with fields `{ controller, previousEvent, dt }`. Ensure those match the spec names your `KEL.*` expects (`i`, `p`, `s`, `dt` or `k/nt` arrays etc.). Ideally, your builder takes a typed `RotationInput` with exact names.

* `sequence` type: your chain meta uses `number`; events use `string`. That’s fine (spec uses CESR/strings), but **never mutate the event’s `s` post-build** (already fixed in \#2).

* `getKelChain`: you read events via `getJson` (good), but you read chain meta with `getJsonString`. Normalize (see \#7).

* `aliasRepo.get` lower-cases alias (good). Do the same in `getAidByAlias` helper you export at top (or delegate to repo to avoid duplicate code paths).

* `VaultEntry` type in public API exposes `privateKeySeed`. Consider renaming to `VaultView` and omit secrets, or mark the type internal.

  ---

  # **12) Quick rotation path (final shape)**

Putting it together, your rotation becomes:

```ts
async function rotateKeys({ aid, timestamp, nextSeed }) {
  return withAidLock(aid, async () => {
    const meta = await kel.getChain(aid);
    if (!meta) throw err.UnknownAID(aid);

    const keyset = await vault.getKeyset(aid);
    if (!keyset) throw err.KeysetMissing(aid);

    const nextNext = nextSeed !== undefined
      ? CESR.keypairFrom(nextSeed, true)
      : CESR.keypairFromMnemonic(CESR.generateMnemonic(), true);

    const nextSeq = meta.sequence + 1;
    const rot = KEL.rotation({
      controller: aid,
      previousEvent: meta.latestEvent,
      sequence: nextSeq,                                // ✅ set here
      currentKeys: [keyset.next.publicKey],             // reveal
      nextKeys:    [CESR.getPublicKey(nextNext)],       // commit
      transferable: true,
      keyThreshold: 1,
      nextThreshold: 1,
      dt: timestamp,
    });

    const env = KEL.createEnvelope(rot, [keyset.current.secretHandle]);

    KEL.verifyRotation(rot, {
      priorSaid: meta.latestEvent,
      expectedSeq: nextSeq,
      revealedKeys: [keyset.next.publicKey],
      priorKeyThreshold: 1,
      priorSignerKeys: [keyset.current.publicKey],
    });

    const updated: ChainMetadata = {
      aid: meta.aid,
      chain: [...meta.chain, rot.d],
      sequence: nextSeq,
      latestEvent: rot.d,
    };

    await commitRotation({ kel, vault }, {
      rot, env,
      newKeyset: {
        current: { publicKey: keyset.next.publicKey, secretHandle: keyset.next.secretHandle },
        next:    { publicKey: CESR.getPublicKey(nextNext), secretHandle: nextNext.privateKey },
      },
      updatedChain: updated,
    });

    const alias = (await aliases.reverse(aid)) ?? aid;
    return { aid, alias, sequence: updated.sequence, latestEvent: updated.latestEvent };
  });
}

```
    
  ---

  # **13) Test checklist (fast wins)**

 * **Determinism:** same seeds → same SAIDs for `icp`/`rot`.
 * **Reveal/commit:** `rot.k == prior.nt`, `rot.n == SAID(new nextKeys)`.
 * **Signature threshold:** reject if `env` missing required signature from *prior current* keys.
 * **Sequence:** reject `s != meta.sequence + 1`.
 * **Idempotency:** re-`putEvent(rot)` yields no change.
 * **Crash safety:** throw between event/envelope/vault/chain and assert readers never see a partial rotation (because `chain` wasn’t updated).
