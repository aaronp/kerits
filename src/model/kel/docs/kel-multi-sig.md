# **🧱 KERI Multi-Sig Specification Summary**

### **Purpose**

Enable a single Autonomous Identifier (AID) to be **controlled by multiple participants or devices**, enforcing **threshold signing** (e.g. “2 of 3 keys must sign” for any KEL event).

---

## **1\. Establishment Events and Thresholds**

Every KEL event that defines or rotates key material (icp, rot) has:

| Field | Description |
| ----- | ----- |
| `k` | Array of current signing public keys |
| `kt` | Signing threshold — minimum number of valid signatures required |
| `n` | Next key commitment (SAID of next key set) |
| `nt` | Next threshold (for next rotation) |

---

## **2\. Valid Signatures for a Multi-Sig Event**

When verifying an establishment event:

1. Compute the event’s SAID.

2. Verify that there are ≥ `kt` valid signatures from the set `k`.

3. Each signature must correspond to one of the listed keys (by index).

4. The event is only accepted if the threshold is met.

These signatures may originate from multiple devices or co-controllers.

---

## **3\. Types of Multi-Sig**

| Type | Description | Example |
| ----- | ----- | ----- |
| **Multi-key** | Multiple keys listed directly in one AID’s KEL | “2-of-3 device keys” |
| **Multi-AID (Group AID)** | Multiple existing AIDs jointly control a *group* AID via a **delegated inception** | “Org AID controlled by Alice \+ Bob” |

Both are valid in KERI — the first is simpler for local multi-device scenarios; the second for organizational control.

---

## **4\. How Events Get Signed**

* **Inception (`icp`)**

  * Lists all controller public keys (`k`) and the signing threshold (`kt`).

  * Each controller signs the serialized event.

  * Event is accepted only when the collected signatures ≥ `kt`.

* **Rotation (`rot`)**

  * Reveals the previously committed `n` as the new `k`.

  * New next commitment (`n'`) and threshold (`nt'`) are included.

  * Must be signed by ≥ `kt` keys from the *previous* key set.

* **Interaction (`ixn`)**

  * Used for anchoring or data linking.

  * Must also be signed by ≥ `kt` current keys.

  ---

  ## **5\. Witnesses in Multi-Sig Context**

Witnesses (`w`, `wt`) work exactly as usual — they **attest**, not authorize.  
 They don’t replace threshold signatures; they only add network receipts.

---

# **🧪 Test Scenarios for Multi-Sig KELs**

---

### **Scenario 1 – Single-Device Inception (Baseline)**

**Goal:** Create a 1-of-1 AID and validate simple rotation.

**Steps:**

1. Generate key pair K₁.

1. Build `icp` with:

    `{ "k": [K₁.pub], "kt": "1", "n": SAID(nextKeys) }`  
2.   
3. Sign with K₁.

4. Validate inception.

5. Build a `rot` signed again by K₁ → should pass.

✅ *Baseline KEL flow works with one controller.*

---

### **Scenario 2 – Multi-Device Inception (2-of-2)**

**Goal:** A single AID controlled jointly by two devices.

**Steps:**

1. Devices A and B each generate key pairs Kₐ and Kᵦ.

2. Build an `icp`:

    `{`  
3.   `"k": [Kₐ.pub, Kᵦ.pub],`  
4.   `"kt": "2",`  
5.   `"n": SAID(nextKeys)`  
6. `}`  
2.   
3. Both A and B sign the same inception event.

4. Combine both signatures (two CESR attachments).

5. Event is accepted (2 signatures ≥ `kt=2`).

✅ *This AID now requires both devices to sign any rotation.*

---

### **Scenario 3 – Add Another Device (Creating a Linked AID)**

**Goal:** Add a new device that has its own AID, anchored by the original.

**Steps:**

1. Existing AID\_A (2-of-2) exists on devices A and B.

2. Device C creates a new AID\_C (`icp_c`).

3. AID\_A performs an `ixn` anchoring AID\_C’s inception SAID — effectively “delegating” authority or acknowledging it.

4. Observers can replay:

   * AID\_C’s KEL → see its `icp_c`

   * AID\_A’s KEL → see the anchoring `ixn`  
      and accept that AID\_C is linked to AID\_A.

✅ *Demonstrates linking sub-identities or new devices via anchoring.*

---

### **Scenario 4 – Rotation with 2-of-2 Threshold**

**Goal:** Rotate the AID, requiring both controllers to sign.

**Steps:**

7. AID\_A’s current state:

    `{ "k": [Kₐ, Kᵦ], "kt": "2", "n": SAID(nextKeys) }`  
1.   
2. Both controllers generate next keys (Kₐ′, Kᵦ′).

3. Build `rot` event revealing `n` → `k = [Kₐ′, Kᵦ′]`.

4. Both A and B sign the `rot`.

5. Validation passes only if both signatures present.

✅ *Confirms enforced multi-signature rotation.*

---

### **Scenario 5 – Failure Case: Insufficient Signatures**

**Goal:** Reject invalid rotation with only one signature.

**Steps:**

1. Same AID\_A (2-of-2).

2. Device A alone signs the rotation event.

3. Validator checks signatures → finds only one valid signature.

4. Reject event (`kt` not satisfied).

✅ *Confirms enforcement of threshold.*

---

### **Scenario 6 – Rotation Increasing Threshold (2-of-3)**

**Goal:** Extend control to a third device.

**Steps:**

1. AID\_A current state: `kt=2`, `k=[Kₐ,Kᵦ]`.

2. New key K𝚌 added in next commitment (`n′`).

3. Next rotation reveals new `k=[Kₐ′,Kᵦ′,K𝚌′]`, `kt′="2"`.

4. Requires ≥ 2 signatures from current set (Kₐ,Kᵦ) to authorize.

5. After accepted, future events may use any 2 of 3\.

✅ *Simulates adding a new controller while keeping threshold logic intact.*

---

# **🧭 Validation Checklist**

| Step | Requirement |
| ----- | ----- |
| Verify `p` links to prior event SAID | ✅ |
| Verify event SAID recomputes deterministically | ✅ |
| Verify ≥ `kt` valid signatures from `k` | ✅ |
| Verify `n` commitment matches prior event’s next commitment | ✅ |
| Verify witness receipts ≥ `wt` (if policy) | ✅ |

---

# **📦 Summary Table**

| Concept | KEL Field | Description |
| ----- | ----- | ----- |
| Current signing keys | `k` | Authorized public keys |
| Current threshold | `kt` | M-of-N rule for current keys |
| Next key commitment | `n` | SAID of next key set (hidden until reveal) |
| Next threshold | `nt` | M-of-N rule for next keys |
| Validation rule | ≥ `kt` valid signatures from `k` | Required for acceptance |

8. 

