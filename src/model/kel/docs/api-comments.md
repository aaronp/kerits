Highest-impact tweaks

Don’t hash index keys. You still call s(...).asSAID() on non-event keys (chain:${aid}, keys:${aid}, mapping). That will write under a different key than you’ll read later. Use plain strings for all indexes.

```ts
// replace everywhere
await getJson<ChainMetadata>(metadataStore, `chain:${aid}`);
await getJson<VaultEntry>(vaultStore, `keys:${aid}`);
await getJson<AliasMapping>(aliasStore, 'mapping');
await putJson(meta, `chain:${cm.aid}`, cm);
await putJson(store, 'mapping', next);
```


Make createAccount commit order match rotation (atomic-ish):
Right now you write putChain before vault.setKeyset. Readers could see a chain with no keys yet.

```ts
// good order: event -> envelope -> vault -> chain
await kel.putEvent(inceptionEvent);
await kel.putEnvelope(envelope);
await vault.setKeyset(inceptionEvent.i, { /* ... */ });
await kel.putChain(metadata);
await aliases.set(alias, inceptionEvent.i);

```

Add reveal/commit guard on rotation (assert revealed key equals prior next):

```ts
if (rot.currentKeys?.[0] !== keyset.next.publicKey) {
  throw new KelError('RevealMismatch', 'Revealed key must equal prior next key');
}

```


(Or call a KEL.verifyRotation that checks priorSaid, expectedSeq, reveal==prior.next, thresholds, and signature set.)

Use the repo in exported getAidByAlias and lowercase input:

```ts
export async function getAidByAlias(aliasStore: KeyValueStore, alias: string) {
  return KelStores.aliasRepo(aliasStore).get(alias);
}

```

Unify time field names. You use currentTime (icp) and dt (rot). Pick one (e.g., dt) and have both builders accept it. Canonicalization will then be stable across event types.

Public vault view type. You’re returning a VaultEntry but you strip secrets. Make the return type reflect that so you don’t accidentally expose secret handles later.

```ts
export interface SafeVaultView {
  aid: AID;
  currentKeys: { publicKey: string }[];
  nextKeys: { publicKey: string }[];
}
// getKeys(): Promise<SafeVaultView | null>

```

Buffer dependency. Your base64url helpers use Buffer (great for Node/Bun). If you’ll ever run this in the browser, gate them or use a small env shim. Otherwise you’re good in Bun/Node.

Parameter names are aligned now (👍) — currentKeySpec / nextKeySpec. Also remove the unused Mnemonic import if you don’t reference the type.

Micro-diffs to drop in
A) Index keys (no asSAID() on indexes)

```ts
// aliasRepo.set
await putJson(store, 'mapping', next);

// kelRepo.getChain / putChain
async getChain(aid) { return await getJson<ChainMetadata>(meta, `chain:${aid}`); }
async putChain(cm)  { await putJson(meta, `chain:${cm.aid}`, cm); }

// vaultRepo
const key = `keys:${aid}`;
const raw  = await getJson<any>(store, key);
await putJson(store, key, { /* encoded */ });

// top-level helpers
await getJson<ChainMetadata>(metadataStore, `chain:${aid}`);
await getJson<VaultEntry>(vaultStore, `keys:${aid}`);
const mapping = await getJson<AliasMapping>(aliasStore, 'mapping');
```

B) createAccount commit order

```ts
await kel.putEvent(inceptionEvent);
await kel.putEnvelope(envelope);
await vault.setKeyset(inceptionEvent.i, { /* ... */ });
await kel.putChain(metadata);
await aliases.set(alias, inceptionEvent.i);
```

C) Rotation guard + verify (before commit)

```ts
// Guard reveal==prior.next
if (rot.currentKeys?.[0] !== keyset.next.publicKey) {
  throw new KelError('RevealMismatch', 'Revealed key must equal prior next key');
}

// Stronger verify (if available)
KEL.verifyRotation(rot, {
  priorSaid: meta.latestEvent,
  expectedSeq: nextSeq,
  revealedKeys: [keyset.next.publicKey],
  priorKeyThreshold: 1,
  priorSignerKeys: [keyset.current.publicKey],
});

```

D) getAidByAlias (exported helper)

```ts
export async function getAidByAlias(aliasStore: KeyValueStore, alias: string) {
  return KelStores.aliasRepo(aliasStore).get(alias);
}
```
E) getKeys return type


```ts
export async function getKeys(vaultStore: KeyValueStore, aid: AID): Promise<SafeVaultView | null> { /* ... */ }

```
