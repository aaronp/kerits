This is really tight now. A few small refinements will make it rock-solid and iron out edge cases:

Quick wins

Don’t rely on btoa/atob (browser-only). Use Buffer (Node/Bun) or your CESR helpers.

```ts
// Replace toB64/fromB64 with Buffer-based, URL-safe variants
function toB64(u8: Uint8Array): string {
  return Buffer.from(u8).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}
function fromB64(s: string): Uint8Array {
  const base64 = s.replace(/-/g,'+').replace(/_/g,'/');
  const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
  return new Uint8Array(Buffer.from(base64 + pad, 'base64'));
}
```

KeySpec typing & check. You test typeof keySpec === 'string' but Mnemonic may not be string at type level. Make it explicit and rename params for clarity:

```ts
export type KeySpec = undefined | number | string | CESRKeypair; // string = mnemonic

function keySpecToKeypair(spec: KeySpec, transferable = true): CESRKeypair {
  if (spec === undefined) return CESR.keypairFromMnemonic(CESR.generateMnemonic(), transferable);
  if (typeof spec === 'number') return CESR.keypairFrom(spec, transferable);
  if (typeof spec === 'string') return CESR.keypairFromMnemonic(spec, transferable);
  return spec; // CESRKeypair
}

// Also rename in CreateAccountParams
currentKeySpec?: KeySpec;
nextKeySpec?: KeySpec;
```


…and update usages (currentKeySeed → currentKeySpec, nextKeySeed → nextKeySpec).

Never mutate event fields post-build (you already fixed rotation s, nice). Do the same on inception: ensure KEL.inception internally canonicalizes → SAID, then you sign.

Verify rotation against prior state (reveal/commit). You verify signatures; also assert that currentKeys == prior next.publicKey:

```ts
if (rot.k?.[0] !== keyset.next.publicKey) { // or whatever field your builder uses for current keys
  throw err.BadSignature(); // or new KelError('RevealMismatch', 'Revealed key != prior next key');
}
```


(If KEL.verifyEnvelope doesn’t do this, add a KEL.verifyRotation that checks priorSaid, expectedSeq, revealedKeys, threshold, etc.)

Public getAidByAlias should reuse the repo (and lowercase):

```ts
export async function getAidByAlias(aliasStore: KeyValueStore, alias: string): Promise<AID | null> {
  return KelStores.aliasRepo(aliasStore).get(alias);
}
```

Avoid asSAID() for non-SAID keys (like chain:${aid}, keys:${aid}). If s(...).asSAID() hashes/normalizes, you’ll never read back by the original string. Use plain strings for these index keys:

```ts
await getJson<ChainMetadata>(metadataStore, `chain:${aid}`);
await getJson<VaultEntry>(vaultStore, `keys:${aid}`);
await getJson<AliasMapping>(aliasStore, 'mapping');
```

Consistent time fields. You use currentTime on inception and dt on rotation. Pick one field name across builders (or map consistently), so canonicalization stays stable.

Return a safe vault view type. You already omit secrets in getKeys; reflect that in the type to prevent accidental exposure elsewhere:

```ts
export interface SafeVaultView {
  aid: AID;
  currentKeys: { publicKey: string }[];
  nextKeys: { publicKey: string }[];
}
// getKeys(): Promise<SafeVaultView | null>
```

Standardize storage keys (just naming):
kel:event:${said}, kel:env:${said}, kel:chain:${aid}, kel:alias:mapping, kel:vault:${aid}—your adapters already follow the spirit; keeping a single convention avoids future drift.

Keep repos singletons per ops ✅ you already did this—great.

Micro-patches (drop in)

Rotation “reveal/commit” assert + verify wrapper:

```ts
// After building `rot` and before commit:
if (rot.currentKeys?.[0] !== keyset.next.publicKey) {
  throw new KelError('RevealMismatch', 'Revealed current key must equal prior next key');
}

KEL.verifyRotation(rot, {
  priorSaid: meta.latestEvent,
  expectedSeq: nextSeq,
  revealedKeys: [keyset.next.publicKey],
  priorKeyThreshold: 1,
  // optionally pass signer set if your verifier checks it:
  priorSignerKeys: [keyset.current.publicKey],
});
```

Rename CreateAccount params & calls:

```ts
async createAccount({ alias, currentKeySpec, nextKeySpec, timestamp }) {
  const currentKp = keySpecToKeypair(currentKeySpec, true);
  const nextKp    = keySpecToKeypair(nextKeySpec, true);
  // ...
}
```


Base64url helpers replacement in vaultRepo (using the Buffer versions above).

Sanity checklist (you’re already close)

Same seeds ⇒ same SAIDs (icp/rot) in tests.

Rotation fails if revealed != prior.next.

Atomic write order respected: event → envelope → vault → chain.

No secrets leak across public APIs.

Aliases case-folded for lookup, but display preserved.

No post-build mutation of event fields.