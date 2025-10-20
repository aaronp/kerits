I'd like to be sure I'm storing the CESR-encoded values for each KelEvent correctly, so that other peers are able to follow the KERI spec and verify data integrity:
 (1) what signatures attested an event 
 (2) what public keys those signatures were 
 (3) the data matches the SAID

Considering the CesrSig and KelEnvelope types, 

The API appears to be putting the json representation of KeyEnvelope values.

Also, I can see that there is a 'keyIndex' on the CesrSig, so that looks like it should line up with the KSN (or latest Kel representation)

It would be nice if the API could expose that "proof" information more readily and make it easier for clients to verify -- that the data matches the SAID, the public keys match the signatures for the SAID, and we've looked up the AID for the public keys so we can answer "who signed this event"

To make envelopes maximally portable/verifiable by any KERI peer, I’d tighten three things:

 * Store the canonical CESR bytes alongside the JSON.
 * Make each signature self-describing (which key-set it indexes into).
 * Expose a one-shot getEventProof(...) that returns exactly what a client needs to verify SAID → keys → signatures → “who signed”.

Below is a minimal, drop-in shape.

# 1) Envelope shape: include canonical CESR and signer-set info

```ts
export type SignerSetRef =
  | { kind: 'prior'; sn: number }      // indexes refer to prior establishment key set (typical for `rot`)
  | { kind: 'current'; sn: number }    // indexes refer to this event's `k`
  | { kind: 'witness'; aid: AID };     // witness receipts (index into witness list if you carry it)

export interface CesrSig {
  /** Index into the referenced signer set (see `signerSet`) */
  keyIndex: number;
  /** CESR-encoded signature (qb64) */
  sig: string;
  /** Which set the index refers to (disambiguates “index into what?”) */
  signerSet: SignerSetRef;
}

export interface KelEnvelope {
  /** Canonical event (JSON) — convenient for app logic */
  event: KelEvent;

  /** CESR-serialized canonical bytes (qb64 of `Serder.raw`) — source of truth */
  eventCesr: string;

  /** Controller signatures on the event SAID (indices explained by `signerSet`) */
  signatures: CesrSig[];

  /** Optional witness receipts (same structure, typically `signerSet.kind = 'witness'`) */
  receipts?: CesrSig[];
}
```

Why:

Other peers don’t need to trust your JSON rendering; they can re-hash eventCesr to get the SAID and verify signatures directly.

signerSet removes ambiguity: a keyIndex is meaningless unless you say which key array it indexes into (current k, prior k, or a witness list). In KERI, rotations are signed by prior keys, so this matters.

When you create an envelope:
```ts
const ser = KEL.serialize(event);               // returns { raw: Uint8Array, qb64: string }
const env: KelEnvelope = {
  event,
  eventCesr: ser.qb64,
  signatures: controllerSigs.map((sig, idx) => ({
    keyIndex: idx,
    sig,                                        // qb64 signature
    signerSet: isRotation ? { kind:'prior', sn: prevSeq } 
                          : { kind:'current', sn: eventSequence }
  })),
  receipts: witnessReceipts // optional, same idea
};
```

# 2) Persist both JSON and CESR

Keep what you have, but ensure the CESR string (eventCesr) is stored too. Your kelRepo.putEnvelope(env) already writes JSON; just make sure the JSON includes eventCesr.

# 3) Add a proof API that answers “who signed what”

Expose a single call that gives clients a ready-to-check bundle.

```ts
export interface SignerProof {
  keyIndex: number;
  signerSet: SignerSetRef;
  signature: string;            // qb64
  publicKey: string;            // resolved key from the signer set
  signerAid?: AID;              // if you can resolve it (controller AID or witness AID)
}

export interface EventProof {
  said: SAID;
  eventCesr: string;            // qb64
  event: KelEvent;              // for human/debug
  signers: SignerProof[];       // who signed & with which keys
}

export interface VerificationResult {
  saidMatches: boolean;
  signaturesValid: boolean;
  validCount: number;
  requiredCount: number;
  failures?: string[];
}
```

Implementation sketch:

```ts
async function getEventProof(aid: AID, said: SAID): Promise<EventProof | null> {
  const env = await kel.getEnvelope(said);
  if (!env) return null;

  // 1) Recompute SAID from CESR bytes
  const raw = CESR.fromQB64(env.eventCesr);
  const recomputedSaid = KEL.computeSAID(raw); // same canonicalizer as builder
  const saidFromEvent = env.event.d;
  if (recomputedSaid !== saidFromEvent) {
    // still return the bundle; verifier can mark saidMatches=false
  }

  // 2) Resolve signer sets
  // prior/current sets come from your local KSN/state for `aid`
  const stateFor = async (sn: number) => KEL.loadKeyStateAtSeq(aid, sn); // returns { k: string[], ... }
  const signers: SignerProof[] = [];
  for (const s of env.signatures) {
    let pk = '';
    let signerAid: AID | undefined = aid;
    if (s.signerSet.kind === 'current') {
      const st = await stateFor(s.signerSet.sn);
      pk = st.k[s.keyIndex];
    } else if (s.signerSet.kind === 'prior') {
      const st = await stateFor(s.signerSet.sn);
      pk = st.k[s.keyIndex];
    } else { // witness
      // If you carry witness list in state, index into it, or fetch by AID
      pk = await KEL.lookupWitnessKey(s.signerSet.aid, s.keyIndex);
      signerAid = s.signerSet.aid;
    }
    signers.push({
      keyIndex: s.keyIndex,
      signerSet: s.signerSet,
      signature: s.sig,
      publicKey: pk,
      signerAid
    });
  }

  return {
    said: saidFromEvent,
    eventCesr: env.eventCesr,
    event: env.event,
    signers
  };
}

async function verifyEventProof(proof: EventProof): Promise<VerificationResult> {
  const raw = CESR.fromQB64(proof.eventCesr);

  // 1) SAID check
  const saidMatches = (KEL.computeSAID(raw) === proof.said);

  // 2) Signature checks
  let validCount = 0;
  const failures: string[] = [];
  for (const s of proof.signers) {
    const ok = CESR.verifySignatureQb64({
      sigQb64: s.signature,
      publicKeyQb64: s.publicKey,
      messageRaw: raw
    });
    if (ok) validCount++; else failures.push(`idx ${s.keyIndex} (${s.signerAid ?? 'controller'})`);
  }

  // 3) Threshold check (derive from KSN; omitted here)
  const requiredCount = 1; // pull from prior/current state threshold for this event type

  return {
    saidMatches,
    signaturesValid: validCount >= requiredCount,
    validCount,
    requiredCount,
    failures: failures.length ? failures : undefined
  };
}
```

## Notes

 * Where do keys come from?
```
current signer set ⇒ keys are the event’s k (or the KSN at this event’s sn).

prior signer set ⇒ keys are the previous establishment state’s k.

witnesses ⇒ resolve from witness AID(s) (your local OOBI/registry), or from the event’s witness list if you carry it.
```

 * Thresholds: for rotations, validate against the prior state’s threshold; for inception, against the event’s kt.

# 4) Writer: make sure you populate signerSet correctly

Inception (icp): signatures reference { kind: 'current', sn: 0 } (indexes into this event’s k).

Rotation (rot): signatures reference { kind: 'prior', sn: previousSeq } (indexes into prior k).

Interaction (ixn): same as rotation: signed by current signing keys at that time (i.e., prior establishment state).

# 5) Storage compatibility

You can keep your existing kel:env:${said} value as JSON, but include:

eventCesr (qb64 of the canonical bytes)

signatures[].signerSet (as above)

Peers that don’t read your JSON can still import eventCesr + arrays of signature qb64 and verify everything.

# 6) Tiny safety checks to add to your rotation flow

Right after building rot and before commit:
```ts
// Guard: revealed equals prior next
if (rot.currentKeys?.[0] !== keyset.next.publicKey) {
  throw new KelError('RevealMismatch', 'Revealed key must equal prior next key');
}

// Build signatures with explicit signerSet ref
const env: KelEnvelope = {
  event: rot,
  eventCesr: KEL.serialize(rot).qb64,
  signatures: collectedSigs.map((sig, i) => ({
    keyIndex: i,
    sig,
    signerSet: { kind: 'prior', sn: meta.sequence } // prior state
  }))
};
```

With these minimal additions you get:

Cross-peer verifiability (no JSON ambiguities).

Clear “index into what?” semantics.

A dead-simple getEventProof → verifyEventProof path that answers:
(1) does data match the SAID, (2) do signatures match those bytes, (3) which public keys (and AIDs) signed, and (4) were thresholds met.

# == Implementation ==

1) Types to add (next to your other interfaces)

```ts
export type SignerSetRef =
  | { kind: 'prior'; sn: number }         // signer indices refer to *prior* establishment keys (common for rot/ixn)
  | { kind: 'current'; sn: number }       // indices refer to this event's `k`
  | { kind: 'witness'; aid: AID };        // witness signatures (optional)

export interface CesrSig {
  keyIndex: number;      // index into the signer set
  sig: string;           // qb64 signature over canonical bytes
  signerSet: SignerSetRef;
}

/** Keep your existing KelEnvelope but add eventCesr and signerSet on signatures */
export interface KelEnvelope {
  event: KelEvent;
  eventCesr: string;     // qb64 of canonical bytes ("Serder.raw" in KERI terms)
  signatures: CesrSig[];
  receipts?: CesrSig[];
}

export interface SignerProof {
  keyIndex: number;
  signerSet: SignerSetRef;
  signature: string;      // qb64
  publicKey: string;      // resolved signer public key (qb64)
  signerAid?: AID;        // controller AID or witness AID
}

export interface EventProof {
  said: SAID;
  eventCesr: string;      // qb64
  event: KelEvent;
  signers: SignerProof[];
}

export interface VerificationResult {
  saidMatches: boolean;
  signaturesValid: boolean;
  validCount: number;
  requiredCount: number;
  failures?: string[];
}
```

If you already declared CesrSig/KelEnvelope, extend them (don’t duplicate). The key addition is eventCesr and signerSet on each signature.

2) Extend KelApi

Add these to the KelApi type:
```ts
getEventProof(aid: AID, said: SAID): Promise<EventProof | null>;
verifyEventProof(proof: EventProof): Promise<VerificationResult>;
```

3) Implement in KelStores.ops(...)

Drop these helpers and methods inside your existing ops factory (they only use your repos + CESR/KEL utils):

```ts
export namespace KelStores {
  export const ops = (stores: KelStores): KelApi => {
    const aliases = aliasRepo(stores.aliases);
    const kel     = kelRepo(stores.kelEvents, stores.kelCesr, stores.kelMetadata);
    const vault   = vaultRepo(stores.vault);

    // ---- Helpers ----------------------------------------------------------

    // Load the event by sequence number (via chain metadata), then walk back to
    // the nearest *establishment* event (icp or rot) to obtain the signer key set `k`.
    async function getEstablishmentAtOrBefore(aid: AID, seq: number): Promise<KelEvent | null> {
      const meta = await kel.getChain(aid);
      if (!meta) return null;
      const chain = meta.chain;
      // clamp
      const idx = Math.min(Math.max(seq, 0), chain.length - 1);
      for (let i = idx; i >= 0; i--) {
        const e = await kel.getEvent(chain[i]);
        if (!e) continue;
        if (e.t === 'icp' || e.t === 'rot') return e;   // adjust to your event-type discriminator
      }
      return null;
    }

    // Resolve a public key for a signer reference
    async function resolveSignerPublicKey(aid: AID, ref: SignerSetRef, keyIndex: number, eventForCurrent?: KelEvent): Promise<{ pk: string; signerAid?: AID } | null> {
      if (ref.kind === 'current') {
        const e = eventForCurrent ?? await getEstablishmentAtOrBefore(aid, ref.sn);
        const keys = e?.k ?? [];
        return keys[keyIndex] ? { pk: keys[keyIndex], signerAid: aid } : null;
      }
      if (ref.kind === 'prior') {
        const prior = await getEstablishmentAtOrBefore(aid, ref.sn);
        const keys = prior?.k ?? [];
        return keys[keyIndex] ? { pk: keys[keyIndex], signerAid: aid } : null;
      }
      if (ref.kind === 'witness') {
        // Optional: if you maintain witness keys per AID, resolve here.
        // For now we just signal "unknown" unless you have a registry.
        return { pk: '', signerAid: ref.aid }; // fill from your witness registry if available
      }
      return null;
    }

    // ---- New API: getEventProof -------------------------------------------

    async function getEventProof(aid: AID, said: SAID): Promise<EventProof | null> {
      const env = await kel.getEnvelope(said);
      if (!env) return null;

      const raw = CESR.fromQB64(env.eventCesr);            // canonical bytes
      const recomputedSaid = KEL.computeSAID(raw);         // same canonicalizer as your builders
      const eventSaid = env.event.d;

      // Build signer proofs
      const signers: SignerProof[] = [];
      for (const s of (env.signatures ?? [])) {
        const resolved = await resolveSignerPublicKey(aid, s.signerSet, s.keyIndex, env.event);
        signers.push({
          keyIndex: s.keyIndex,
          signerSet: s.signerSet,
          signature: s.sig,
          publicKey: resolved?.pk ?? '',
          signerAid: resolved?.signerAid,
        });
      }

      return {
        said: eventSaid,
        eventCesr: env.eventCesr,
        event: env.event,
        signers,
      };
    }

    // ---- New API: verifyEventProof ----------------------------------------

    async function verifyEventProof(proof: EventProof): Promise<VerificationResult> {
      const raw = CESR.fromQB64(proof.eventCesr);

      // 1) SAID matches
      const saidMatches = (KEL.computeSAID(raw) === proof.said);

      // 2) Verify signatures (basic validity)
      let validCount = 0;
      const failures: string[] = [];
      for (const s of proof.signers) {
        if (!s.publicKey || !s.signature) { failures.push(`missing pk/sig @${s.keyIndex}`); continue; }
        const ok = CESR.verifySignatureQb64({
          sigQb64: s.signature,
          publicKeyQb64: s.publicKey,
          messageRaw: raw
        });
        if (ok) validCount++; else failures.push(`bad sig @${s.keyIndex} (${s.signerAid ?? 'controller'})`);
      }

      // 3) Threshold — derive from KSN: for inception, from this event; for rotation, from prior state.
      // Minimal rule here: require >=1 valid signature. Replace with your real threshold resolution.
      let requiredCount = 1;
      if (proof.event.t === 'icp') {
        requiredCount = KEL.thresholdFromEvent(proof.event) ?? 1;
      } else {
        const priorSeq = Number(proof.event.s) - 1;
        const priorEst = await getEstablishmentAtOrBefore(proof.event.i, priorSeq);
        requiredCount = KEL.thresholdFromEvent(priorEst) ?? 1;
      }

      return {
        saidMatches,
        signaturesValid: validCount >= requiredCount,
        validCount,
        requiredCount,
        failures: failures.length ? failures : undefined,
      };
    }

    // ---- (existing methods …) ---------------------------------------------

    return {
      // … keep your existing methods
      createAccount: async (args) => { /* unchanged except: see patch below to enrich env */ },
      rotateKeys:    async (args) => { /* unchanged except: see patch below to enrich env */ },
      getAccount:    async (args) => { /* … */ },
      getAidByAlias: async (alias) => aliases.get(alias),
      getKelChain:   async (aid) => { /* … */ },
      getLatestSequence: async (aid) => { /* … */ },
      getKeys:       async (aid) => { /* … */ },

      // NEW:
      getEventProof,
      verifyEventProof,
    };
  };
}
```

4) Patch your writers to include eventCesr + signerSet

Right now you call KEL.createEnvelope(...). If that already returns eventCesr and filled signerSet, you’re done. If not, enrich it locally like this:

In createAccount(...)
```ts
const inceptionEvent = KEL.inception({ /* ... */ });

// canonical CESR for the event (source of truth)
const ser = KEL.serialize(inceptionEvent); // -> { raw: Uint8Array, qb64: string }

const baseEnv = KEL.createEnvelope(inceptionEvent, [currentKp.privateKey]);

// Ensure envelope carries eventCesr and explicit signerSet (current@sn=0 for icp)
const envelope: KelEnvelope = {
  ...baseEnv,
  eventCesr: ser.qb64,
  signatures: (baseEnv.signatures ?? []).map((sig, idx) => ({
    keyIndex: idx,
    sig: sig.sig ?? sig, // depending on your createEnvelope shape
    signerSet: { kind: 'current', sn: 0 },
  })),
};

await kel.putEvent(inceptionEvent);
await kel.putEnvelope(envelope);
// vault -> chain (atomic order as we discussed)
```

In rotateKeys(...)

```ts
const nextSeq = meta.sequence + 1;
const rot = KEL.rotation({ /* sequence: nextSeq, prior, reveal/commit */ });

const ser = KEL.serialize(rot);

const baseEnv = KEL.createEnvelope(rot, [keyset.current.secretHandle]);

// For rotations, signatures index into *prior* establishment keys (sn = meta.sequence)
const envelope: KelEnvelope = {
  ...baseEnv,
  eventCesr: ser.qb64,
  signatures: (baseEnv.signatures ?? []).map((sig, idx) => ({
    keyIndex: idx,
    sig: sig.sig ?? sig,
    signerSet: { kind: 'prior', sn: meta.sequence },
  })),
};

await kel.putEvent(rot);
await kel.putEnvelope(envelope);
// vault -> chain (atomic order)
```

If your createEnvelope already returns exactly that shape (with eventCesr and signerSet), just keep it and skip the wrapping.

5) What clients do now
```ts
const proof = await api.getEventProof(aid, said);
if (!proof) throw new Error('Missing event');

const verify = await api.verifyEventProof(proof);
if (!verify.saidMatches) console.error('Event bytes ↔ SAID mismatch');
if (!verify.signaturesValid) console.error(`Only ${verify.validCount}/${verify.requiredCount} valid sigs`, verify.failures);

// Show who signed:
for (const s of proof.signers) {
  console.log(`idx=${s.keyIndex} aid=${s.signerAid ?? aid} pk=${s.publicKey} set=${s.signerSet.kind}@${'sn' in s.signerSet ? s.signerSet.sn : '-'}`);
}
```

This gives you an end-to-end, KERI-faithful verification path:

 * SAID ⇄ canonical bytes,
 * signatures over those bytes,
 * which keys signed (and from which signer set),
 * threshold satisfied,
 * and a clean “who signed” answer via signerAid + public key.