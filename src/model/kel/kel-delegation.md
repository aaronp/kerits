# **🧱 KERI Delegation Specification Summary**

### **Purpose**

To allow one AID (the **Parent**) to authorize another AID (the **Delegate**) to act under its trust domain.  
 Delegation is cryptographically verifiable and revocable through the **KEL event chain** of both AIDs.

---

## **1\. Key Terms**

| Term | Description |
| ----- | ----- |
| **Delegating AID (Parent)** | The controller granting authority. Anchors and validates delegate inception. |
| **Delegate AID (Child)** | The new AID whose inception event is authorized by the parent. |
| **Delegation event (`dlg`)** | Event in the child’s KEL establishing it as a delegate. |
| **Anchoring interaction (`ixn`)** | Event in the parent’s KEL that anchors the delegate’s SAID, proving parent consent. |
| **Delegation acceptance** | A delegate KEL is valid only if the parent’s KEL includes a corresponding anchor. |

---

## **2\. Basic Rule of Delegation**

A **delegated inception (`dlg`)** is **not valid** until the parent AID **anchors** that delegation in its own KEL.

That parent anchor is a signed event (e.g., an `ixn`) containing the delegate’s SAID, providing verifiable authorization.

---

## **3\. Event Structures**

### **3.1 Delegate’s KEL (Child)**

Inception event (`dlg`):

1. `{`  
2.   `"v": "KERI10JSON0001aa_",`  
3.   `"t": "dlg",`  
4.   `"d": "SAID(delegate-inception)",`  
5.   `"i": "E_delegate",`  
6.   `"s": "0",`  
7.   `"p": "",`  
8.   `"kt": "1",`  
9.   `"k": ["D..."],`  
10.   `"n": "SAID(next-key-set)",`  
11.   `"a": [{ "d": "SAID(parent)", "role": "delegator" }],`  
12.   `"dt": "2025-10-19T12:00:00Z"`  
13. `}`  
      
* **Signed by:** the delegate’s key(s).

* **Referenced:** parent’s AID in `a`.

  ### **3.2 Parent’s KEL (Anchor)**

Parent anchors this delegate by including the delegate’s SAID in an `ixn` event:

14. `{`  
15.   `"t": "ixn",`  
16.   `"d": "SAID(parent-ixn)",`  
17.   `"i": "E_parent",`  
18.   `"s": "5",`  
19.   `"p": "SAID(previous)",`  
20.   `"a": [{ "d": "SAID(delegate-inception)", "role": "delegate" }],`  
21.   `"dt": "2025-10-19T12:05:00Z"`  
22. `}`  
      
    ---

    ## **4\. Validation Rules**

A validator must confirm:

1. **Delegate event validity:**

   * Well-formed `dlg` event, valid SAID, proper signatures.

2. **Anchoring proof:**

   * Parent’s KEL includes an `ixn` (or `rot`) anchoring the delegate’s SAID.

3. **Temporal ordering:**

   * Parent anchor occurs **after** the delegate’s `dlg`, but **before** any dependent delegate rotations or TEL updates.

4. **Parent authority continuity:**

   * Parent AID’s KEL remains valid (no revocation or rotation invalidating earlier keys).

5. **Revocation (optional):**

   * If parent later issues an event referencing the delegate’s SAID with role `"revoked"`, the delegate’s KEL becomes invalid past that point.

   ---

   # **🧪 Delegation Test Scenarios**

   ---

   ### **Scenario 1 – Basic Delegated Inception**

**Goal:** Establish a child AID whose inception must be anchored by a parent.

**Steps:**

1. Create `AID_Parent` via normal `icp`.

2. Create `AID_Child` with a `dlg` event referencing `AID_Parent`.

3. Before anchoring, `AID_Child` is **not valid**.

4. Parent publishes `ixn` anchoring child’s SAID.

5. Validation now succeeds.

✅ *Child AID becomes valid after parent anchor.*

---

### **Scenario 2 – Hierarchical Delegation (Org → Dept → Sub-Dept)**

**Goal:** Build a nested hierarchy of delegated AIDs.

**Steps:**

1. **Org AID** creates its KEL.

2. **Dept AID** creates `dlg` referencing **Org AID**.  
    Org anchors Dept’s SAID.

3. **SubDept AID** creates `dlg` referencing **Dept AID**.  
    Dept anchors SubDept’s SAID.

4. Validation chain:

   * SubDept valid ⟹ Dept’s anchor valid ⟹ Org’s anchor valid.

✅ *Demonstrates multi-level delegation.*

---

### **Scenario 3 – Delegated Device (Ad-hoc Sub-AID)**

**Goal:** User creates a secondary AID for a new device.

**Steps:**

1. User’s main AID (`AID_User`) exists.

2. New device creates `AID_Device` (`dlg` referencing `AID_User`).

3. `AID_User` performs `ixn` anchoring `AID_Device`’s SAID.

4. `AID_Device` may now perform its own TEL operations.

✅ *Device acts as a trusted subordinate.*

---

### **Scenario 4 – Delegation with Multi-Sig Parent**

**Goal:** Require group consensus to authorize a delegate.

**Steps:**

1. Parent AID is controlled by 2-of-3 controllers.

2. Delegate’s `dlg` references Parent.

3. Parent’s `ixn` anchor is only valid after ≥2 parent controllers sign it.

4. Observers accept delegate only after multi-sig anchor verified.

✅ *Combines threshold signing and delegation.*

---

### **Scenario 5 – Re-Delegation (Delegate → Delegate)**

**Goal:** Allow a delegate to further delegate authority.

**Steps:**

1. AID\_Org delegates to AID\_Dept.

2. AID\_Dept delegates to AID\_Team.

3. Validation:

   * AID\_Team valid if AID\_Dept anchor exists *and* AID\_Org anchor exists.

4. Revoking AID\_Dept’s delegation invalidates all downstream delegates.

✅ *Models cascaded governance.*

---

### **Scenario 6 – Revocation**

**Goal:** Parent revokes a previously delegated AID.

**Steps:**

1. Parent issues an `ixn` event anchoring delegate’s SAID with role `"revoked"`.

2. Validators mark delegate AID as terminated.

3. Any further events from delegate beyond that point are rejected.

✅ *Demonstrates revocation cascade.*

---

### **Scenario 7 – Negative: Missing Parent Anchor**

**Goal:** Ensure unanchored delegate is rejected.

**Steps:**

1. Delegate issues `dlg`.

2. Parent **never** anchors it.

3. Observers replay:

   * See delegate KEL, but no corresponding parent anchor.

4. Reject delegate KEL as unauthorized.

✅ *Confirms correct enforcement of delegation linkage.*

---

# **🧭 Validation Checklist**

| Step | Requirement |
| ----- | ----- |
| Verify `dlg` event structure & SAID | ✅ |
| Verify signatures meet delegate’s `kt` | ✅ |
| Confirm parent anchor exists | ✅ |
| Confirm parent event SAID chain valid | ✅ |
| Enforce temporal order (`dlg` before parent anchor) | ✅ |
| Apply revocation rules (if any) | ✅ |

---

# **📦 Summary Table**

| Concept | Who Signs | What’s Anchored | Valid When |
| ----- | ----- | ----- | ----- |
| Delegate inception (`dlg`) | Delegate’s keys | Parent AID reference | Parent anchors delegate SAID |
| Parent anchor (`ixn`) | Parent’s keys | Delegate’s SAID | Signifies authorization |
| Rotation (`rot`) | Delegate’s keys | Prior event SAID | Valid only after parent anchor exists |
| Revocation | Parent’s keys | Delegate’s SAID | Terminates delegate’s validity |

---

# **🧰 Recommended TypeScript Structures**

23. `export interface Delegation {`  
24.   `parent: AID;`  
25.   `delegate: AID;`  
26.   `delegateSaid: SAID;`  
27.   `parentAnchor: SAID | null;`  
28.   `status: "pending" | "authorized" | "revoked";`  
29. `}`  
    

A simple resolver can determine the status by scanning both KELs for the presence (or absence) of the parent anchor.

30. 

