```ts
/**
 * KERI Key State Notice (KSN)
 *
 * A KSN is a compact summary of the latest key state of a KERI identifier (AID).
 * It is derived from the controller's current establishment event (icp/rot/drt),
 * and includes enough data for verifiers to confirm continuity and validity.
 *
 * Reference: KERI Spec §13.2 – Key State Notice
 */

import type { AID, SAID, Threshold } from "../types";
import type { CESRPublicKey } from "../cesr/cesr";
import type { CesrSig } from "../kel/types";

export interface Ksn {
  /** Version string, e.g. "KERI10JSON00011c_" */
  v: string;

  /** Message type, always "ksn" */
  t: "ksn";

  /** SAID of this KSN message (computed over all other fields) */
  d: SAID;

  /** Controller identifier (AID) this KSN refers to */
  i: AID;

  /** Sequence number of the event this KSN summarizes (hex string) */
  s: string;

  /** SAID of the previous establishment event */
  p: SAID;

  /** Public keys currently controlling the AID (establishment keys) */
  k: CESRPublicKey[];

  /** Current signing threshold */
  kt: Threshold;

  /** SAID of the next key commitment */
  n: SAID;

  /** Next key threshold */
  nt: Threshold;

  /** Witnesses currently associated with the identifier */
  w?: AID[];

  /** Witness signing threshold */
  wt?: Threshold;

  /** Delegating identifier (if this is a delegated identifier) */
  di?: AID;

  /** Timestamp (ISO8601) when this state was established */
  dt: string;

  /** Controller signatures attesting to this KSN (usually one or more) */
  c: CesrSig[];

  /** Optional: witness receipts attesting to this KSN */
  r?: CesrSig[];

  /** Optional: endorser/validator receipts (third-party attestations) */
  e?: CesrSig[];
}

```


Example:
```json
{
  "v": "KERI10JSON00011c_",
  "t": "ksn",
  "d": "EJ8s6JYQdO0Sg7xEdrKb-7WmTZvshTx9gP01a6pB8z4U",
  "i": "EJmX3lB-VVnKk4z1R6yM1m7X5qRM2uBgZIr4vUVbBxy4",
  "s": "a",
  "p": "EIu_y1CvMJ0xXZhM4trKy8wA1N1mDCm_mzO6PupnKJwQ",
  "k": ["DaBv45mhsdzv8Z4QXzRzjR4o2RQ9sKDc5Fdx4bUf2iDc"],
  "kt": "1",
  "n": "EGQvbdxAjjGaeIl7ZB6RgjZpVxUsmKjZy0WaaASeQ0B4",
  "nt": "1",
  "w": [
    "EBY2h1Vo4v4UjGH8FMRm2MLwnp8W6NZ5L8hR5TQ4oB8Q",
    "EHkz6Y9PMpX8PguZwF0z3LRs8Pn1hKz3BblvJmqYyZfM"
  ],
  "wt": "1",
  "dt": "2025-10-20T08:15:30.000000+00:00",
  "c": [
    { "keyIndex": 0, "sig": "ABcD1234..." }
  ],
  "r": [
    { "keyIndex": 0, "sig": "ADef5678..." }
  ]
}

```

🧩 Relationship to Other Structures

 * KEL (Key Event Log):	Full ordered list of all events	All events (icp, rot, ixn, etc.)
 * KEL Event:	Single event in the KEL	Keys, witnesses, commitments
 * KSN (Key State Notice):	Latest derived state	Flattened digest of latest key state, plus signatures
 * KERL (Key Event Receipt Log):	KEL + receipts	Log + witness/validator receipts
 * OOBI Discovery pointer (URI):	URL to fetch KEL/KSN/etc



 🧠 Implementation Notes

You can compute the KSN SAID exactly as you do for other events:

```ts
const canonical = canonicalize(ksn);
const bytes = new TextEncoder().encode(canonical);
const hash = blake3(bytes, { dkLen: 32 });
ksn.d = encodeCESRDigest(hash, "E") as SAID;
```