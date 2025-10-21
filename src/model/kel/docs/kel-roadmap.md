# What’s still missing vs core KEL (high-level)

You now cover:

icp, rot, delegated dip/drt, ixn with seals,

envelopes with canonical bytes and signer-set metadata,

SAID + signature verification path.

Still to add for a fuller KERI toolchain:

Witness management

Add/remove witnesses via rotation (wa/wr arrays), witness receipts capture/storage, and a way to query “receipt coverage”.

Receipts API

Persist validator/witness receipts (rct, vrc) separate from controller signatures; expose getReceipts(said) and incorporate into getEventProof.

KSN snapshots

getKSN(aid): compact state (current keys, thresholds, last est. event SAID/seq, witnesses) for fast bootstraps.

Replay & validation pipeline

Apply events out-of-order with escrow queues; idempotent ingest; re-verification when missing anchors/receipts arrive.

Group (multisig) identifiers

Coordinated icp/rot for multi-controller AIDs; collect multiple controller signatures and meet kt across participants.

OOBI integration

First-class publish/resolve APIs; e.g., publishOOBI(aid) / resolveOOBI(aid) used by your proof/anchor flows.

Interaction events data

Your ixn builder should allow arbitrary attachments (seals list, small memos) and keep canonicalization stable.

Key event receipt exchange

“Tell me who has attested” / “request receipts” utilities for liveness and audit.

Import/Export

exportAID(aid) → bundle of KEL+env+minimal vault metadata; importAID(bundle).