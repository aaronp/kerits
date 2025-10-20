In KERI (Key Event Receipt Infrastructure), a **Key Event Log (KEL)** is the authoritative, append-only record of all cryptographic control events for a given AID (Autonomic Identifier). It defines **what keys control that identifier, how they evolve over time, and who has witnessed or delegated control.**

Here’s a clear breakdown of **the operations you can perform on a KEL** — grouped by function and lifecycle phase:

---

## **🧩 1\. Establishment Operations**

These are the core control events that *establish or change authority* over an identifier.

| Operation | Event Type | Purpose |
| ----- | ----- | ----- |
| **Inception** | `icp` | Create a new AID. Defines the initial keys (`k`), threshold (`kt`), next-key commitment (`n`), witnesses (`w`), and configuration traits. |
| **Rotation** | `rot` | Replace the current key set with the next committed key set. Reveals previous `n`, commits a new `n'`, maintains cryptographic continuity (forward security). |
| **Interaction** | `ixn` | Append a non-establishment event — used for anchoring data (ACDCs, TELs, delegation links, etc.) without changing control keys. |
| **Delegation Inception** | `dip` | Create a delegated AID whose control is anchored by another (parent) AID. Requires parent to later post an anchor (e.g. `ixn` referencing the `dip` SAID). |
| **Delegation Rotation** | `drt` | Rotate keys of a delegated AID. Must be anchored by the parent’s KEL to be accepted. |
| **Delegation Interaction** | `dix` | Non-establishment interaction by a delegated AID (also requires anchoring by parent). |

---

## **🧾 2\. Ancillary / Support Operations**

These don’t change control, but help verify, persist, or distribute KEL state.

| Operation | Event Type / Record | Purpose |
| ----- | ----- | ----- |
| **Receipt (Validator)** | `rct` / `vrc` | Record another observer’s signature attesting to the event (receipt). Strengthens trust and synchronisation across witnesses or validators. |
| **Seal / Anchor** | `seal` | Embed reference to another event or SAID (often used in TELs or to anchor delegated AIDs, ACDCs, etc.). |
| **Witness Addition/Removal** | via `rot` fields `adds` / `cuts` | Modify the list of witnesses who co-sign events. |
| **Delegation Anchor** | parent `ixn` | Parent AID confirms a child’s delegated inception/rotation. |
| **Replay / Reconstruction** | read-only | Replay the KEL deterministically to reconstruct controller state (keys, thresholds, witnesses, etc.). |

---

## **🔐 3\. Validation and Replay Operations**

When verifying a KEL — either locally or when received from another controller — you perform validation and replay logic:

| Operation | Description |
| ----- | ----- |
| **Verify Event Signatures** | Ensure signatures match the controlling public keys and thresholds for that sequence number. |
| **Verify Key Continuity** | Check each rotation reveals the prior commitment, forming a valid cryptographic chain. |
| **Verify Delegation Anchors** | Confirm any delegated events are anchored in the parent’s KEL. |
| **Apply Witness Receipts** | Merge and verify receipt signatures from witnesses. |
| **Recompute Current State** | Traverse from inception → latest event to derive the active control state. |

---

## **🧮 4\. Data Anchoring Operations**

These make the KEL a root of trust for other data types (TELs, ACDCs, OOBIs, etc.):

| Operation | Event Type | Purpose |
| ----- | ----- | ----- |
| **Anchor Transaction Event Log (TEL)** | `ixn` | Embed SAID(s) of TEL events to prove ledger updates are controller-authorised. |
| **Anchor ACDC issuance** | `ixn` | Link issuance or revocation of a verifiable credential to a controller’s KEL. |
| **Anchor External State** | `ixn` | Reference an external system’s state (hashes, blockchain tx, etc.) for auditability. |

---

## **🔁 5\. Recovery and Maintenance Operations**

| Operation | Description |
| ----- | ----- |
| **Replay Recovery** | Rebuild state from the raw KEL file or stream (important for offline or replicated nodes). |
| **Revoke or Abandon** | There is *no direct delete* — you can only rotate away all keys and stop publishing (immutability is fundamental). |
| **Re-establish Identity (Transfer)** | Use `delegation` or a `transfer` TEL to hand over control to a new AID (pattern built on top of KERI core). |

---

## **💡 6\. Query / Management Operations**

These are application-level operations you typically provide over a KEL:

| Operation | Description |
| ----- | ----- |
| `getState(aid)` | Return current keys, thresholds, witnesses, sequence, and last SAID. |
| `getEvent(said)` | Fetch a specific event from log by SAID. |
| `getReceipts(said)` | List all witness receipts for an event. |
| `getWitnesses(aid)` | Return the current witness set. |
| `getAnchors(aid)` | Return anchored TELs, ACDCs, or child delegations. |

---

## **🧭 7\. Derived / Higher-Level Operations**

These are **patterns built on top of the KEL** (not part of the spec core, but common in implementations):

| Operation | Purpose |
| ----- | ----- |
| **Multisig Coordination** | Collect signatures from multiple controllers before posting a joint event. |
| **Group Identifier Management** | Support multi-controller KELs (e.g. group AIDs). |
| **Challenge/Response Proofs** | Prove key control to an OOBI or service using ephemeral signed messages. |
| **Replication / Sync** | Share and merge KEL fragments via OOBI, witness, or message bus transport. |

---

### **🔚 Summary**

**A KEL is append-only, verifiable, and deterministic.**  
 You can:

1. **Create / rotate / interact** → append events.

2. **Anchor / seal** → link to TELs, ACDCs, and delegations.

3. **Witness / receipt** → strengthen integrity.

4. **Validate / replay** → reconstruct state.

5. **Query / replicate** → expose or synchronize.

Every operation is cryptographically bound to the prior state, making the KEL both **a secure event ledger** and **a trust root** for everything derived from it.

