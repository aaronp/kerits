As part of the evolution of the KelApi, I'd like to be able to easily create child accounts (e.g. new key-pairs which reference the parent AID) - methods to be able to do that easily from the API so as to cover e.g. creating organisations or departments, as well as for explicitly referencing the parent AID, for example when instantiating a new device (a user's phone for which they have their AID on their laptop)


Here’s a tight, KERI-faithful way to add child/delegated accounts and related flows to your KelApi, plus a quick audit of what’s still missing vs core KEL.

# Add these types
```ts
/** Standard KERI seal used when the parent anchors a child event */
export interface DelegationSeal {
  /** Child AID */
  i: AID;
  /** Child event sequence number as a string (sn) */
  s: string;
  /** Child event SAID */
  d: SAID;
}

/** What the child returns to the parent to be anchored */
export interface ParentAnchorRequest {
  parentAid: AID;         // who must anchor
  seal: DelegationSeal;   // i,s,d of the child's event
  childAid: AID;
  childEventSaid: SAID;
  childEventSeq: number;
}

```

# Extend KelApi
```ts
export interface KelApi {
  // existing…
  createAccount(...): Promise<Account>;
  rotateKeys(...): Promise<Account>;
  getEventProof(aid: AID, said: SAID): Promise<EventProof | null>;
  verifyEventProof(proof: EventProof): Promise<VerificationResult>;

  // NEW — child/delegation
  createChildAccount(args: {
    parentAid: AID;
    alias: string;
    currentKeySpec?: KeySpec;
    nextKeySpec?: KeySpec;
    timestamp?: string;
  }): Promise<{ child: Account; anchor: ParentAnchorRequest }>;

  /** Parent anchors the child’s delegated event (usually in a parent IXN with seals) */
  anchorDelegation(args: {
    parentAid: AID;
    anchor: ParentAnchorRequest;
    timestamp?: string;
  }): Promise<Account>; // returns updated parent account (new latestEvent/sequence)

  /** Child rotates (delegated rotation): parent must anchor the returned request */
  rotateChild(args: {
    childAid: AID;
    parentAid: AID;
    nextKeySpec?: KeySpec;
    timestamp?: string;
  }): Promise<{ child: Account; anchor: ParentAnchorRequest }>;

  /** Convenience: perform child rotation and parent anchor if both vaults available */
  rotateChildAndAnchor?(args: {
    childAid: AID;
    parentAid: AID;
    nextKeySpec?: KeySpec;
    timestamp?: string;
  }): Promise<{ child: Account; parent: Account }>;

  /** Stop accepting future child updates (policy-level “revoke”), by publishing a parent IXN note */
  revokeChildDelegation(args: {
    parentAid: AID;
    childAid: AID;
    note?: string;
    timestamp?: string;
  }): Promise<Account>;
}

```

## How the methods behave (concise flow)
1) createChildAccount

Builds a delegated inception event for the child (often called dip) that references the parent.

Fields same as icp, plus “delegator” reference (commonly di = parentAid).

Signatures are from the child’s keys (current set).

Returns:

child: Account (seq=0).

anchor: ParentAnchorRequest with seal = { i: childAid, s: "0", d: childIcpSaid }.

Pseudocode:

```ts
async function createChildAccount({ parentAid, alias, currentKeySpec, nextKeySpec, timestamp }) {
  const childKeys = { cur: keySpecToKeypair(currentKeySpec,true), nxt: keySpecToKeypair(nextKeySpec,true) };
  const dip = KEL.delegatedInception({
    delegator: parentAid,                   // <— important
    currentKeys: [CESR.getPublicKey(childKeys.cur)],
    nextKeys:    [CESR.getPublicKey(childKeys.nxt)],
    keyThreshold: 1, nextThreshold: 1, dt: timestamp
  });

  const ser = KEL.serialize(dip);
  const env = KEL.createEnvelope(dip, [childKeys.cur.privateKey]);
  const envelope: KelEnvelope = {
    ...env,
    eventCesr: ser.qb64,
    signatures: (env.signatures ?? []).map((sig, idx) => ({
      keyIndex: idx, sig: sig.sig ?? sig, signerSet: { kind: 'current', sn: 0 }
    }))
  };

  // persist child event (event->env->vault->chain), alias mapping etc. (same order as parent icp)
  // …

  const child: Account = { aid: dip.i, alias, sequence: 0, latestEvent: dip.d };

  const anchor: ParentAnchorRequest = {
    parentAid,
    childAid: dip.i,
    childEventSaid: dip.d,
    childEventSeq: 0,
    seal: { i: dip.i, s: "0", d: dip.d }
  };

  return { child, anchor };
}

```
2) anchorDelegation

Parent publishes an interaction event (ixn) with a seal anchoring the child event.

In the parent’s ixn, include a: [ { i, s, d } ] (the DelegationSeal).

Parent signs with its current keys (per normal ixn).

Result: observers now accept the child’s delegated event (and future delegated rotations that the parent anchors).

Pseudocode

```ts
async function anchorDelegation({ parentAid, anchor, timestamp }) {
  // load parent meta + keyset, build IXN with `a: [anchor.seal]`, sign with parent current keys
  const ixn = KEL.interaction({
    aid: parentAid,
    prior: parentMeta.latestEvent,
    sequence: parentMeta.sequence + 1,
    seals: [anchor.seal],
    dt: timestamp
  });

  // sign, verify, persist (event->env->vault(unchanged)->chain)
  // …

  return updatedParentAccount;
}

```

3) rotateChild

Child issues a delegated rotation (commonly drt):

Reveal prior next, commit fresh next.

Include delegator reference.

Returns:

child: Account (locally advanced state),

anchor: ParentAnchorRequest with the rotation SAID and corresponding seal (s = childSeq).

Observers will accept only after parent anchors that rotation via anchorDelegation.

Pseudocode

```ts
async function rotateChild({ childAid, parentAid, nextKeySpec, timestamp }) {
  // like rotateKeys, but include delegator: parentAid and build a delegated rotation event
  const nextNext = keySpecToKeypair(nextKeySpec, true);
  const seq = childMeta.sequence + 1;

  const drt = KEL.delegatedRotation({
    controller: childAid,
    delegator: parentAid,
    previousEvent: childMeta.latestEvent,
    sequence: seq,
    currentKeys: [childKeyset.next.publicKey], // reveal
    nextKeys:    [CESR.getPublicKey(nextNext)],// commit
    keyThreshold: 1, nextThreshold: 1, dt: timestamp
  });

  const ser = KEL.serialize(drt);
  const env = KEL.createEnvelope(drt, [childKeyset.current.secretHandle]);

  const envelope: KelEnvelope = {
    ...env,
    eventCesr: ser.qb64,
    signatures: (env.signatures ?? []).map((sig, idx) => ({
      keyIndex: idx, sig: sig.sig ?? sig, signerSet: { kind: 'prior', sn: childMeta.sequence }
    }))
  };

  // persist child rotation (event->env->vault->chain)
  // …

  return {
    child: { aid: childAid, alias: (await aliases.reverse(childAid)) ?? childAid, sequence: seq, latestEvent: drt.d },
    anchor: { parentAid, childAid, childEventSaid: drt.d, childEventSeq: seq, seal: { i: childAid, s: String(seq), d: drt.d } }
  };
}

```

4) rotateChildAndAnchor (optional)

If your process has both parent & child vaults, you can do:

rotateChild(...) then immediately call anchorDelegation(...).

Return both updated accounts.

5) revokeChildDelegation

There isn’t a single “spec magic” kill-switch; the parent’s refusal to anchor future child updates already “revokes” in practice (observers will reject unaffirmed child events).

To make it explicit for observers, parent can publish an ixn with a revocation note (application convention) and optionally include a seal of the last accepted child event. Observers that honor this convention will mark the child as no longer accepted unless a new parent re-anchors.

Implementation: parent `ixn` with `data` / `r` field or a typed EXN payload; keep it simple now:

```ts
async function revokeChildDelegation({ parentAid, childAid, note, timestamp }) {
  const lastChild = await kel.getChain(childAid); // get last accepted SAID
  const revSeal: DelegationSeal | undefined = lastChild
    ? { i: childAid, s: String(lastChild.sequence), d: lastChild.latestEvent }
    : undefined;

  const ixn = KEL.interaction({
    aid: parentAid,
    prior: parentMeta.latestEvent,
    sequence: parentMeta.sequence + 1,
    seals: revSeal ? [revSeal] : [],
    // optionally include an application-level "revocation" memo in a data field
    memo: note,
    dt: timestamp
  });

  // sign & persist
  // …

  return updatedParentAccount;
}

```
Later you can standardize the memo as an EXN message type if you want interoperable “revocation-intent” semantics.


Device vs Org: how to use these

New device for the same user: You don’t need delegation; just rotate the controller to add a new device key (or do multisig).

Org/Department/Service account: Use delegated child AIDs so the org (parent) can explicitly approve each child inception/rotation by anchoring.

Personal phone under work AID: model it as a delegated child of the work AID; the laptop (parent) anchors the phone’s dip and later drts.