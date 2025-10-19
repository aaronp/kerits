# **🪶 TEL Update Specification**

*(Transaction Event Log – Business / Data Layer)*

### **Purpose**

To record **transactional state transitions** controlled by a specific AID (as established in its KEL).  
 TEL events anchor domain-specific data (e.g. ACDCs, state changes, policies) to that AID’s key authority.

---

### **Event Types**

* `iss` — **Issue** (initial issuance of a data record)

* `up` — **Update** (new version or revision)

* `rev` — **Revoke** (invalidate or withdraw prior state)

* *(optionally)* `anc` — **Anchor** (explicit link to external record)

  ---

  ### **Append Preconditions**

To append a new event to a TEL:

1. **Resolve controller state**

   * Retrieve the controller AID’s latest KEL event.

   * Extract `k` (current signing keys) and `kt` (signing threshold).

   * **Ignore witnesses** (`w`, `wt`) — not used in TEL validation.

2. **Build new TEL event**

   * Increment `s` (TEL sequence).

   * Set `p = SAID(previous TEL event)` (hash chain).

   * Set `dt` \= current timestamp.

   * Add anchors (`a`) to new or updated ACDCs, policy documents, etc.

3. **Signatures**

   * Event must have ≥ `kt` valid signatures from the controller’s current keys (`k`).

4. **Optional endorsements**

   * If required by domain policy (e.g. “2-of-3 validators”), include endorsement signatures and a reference to the policy ACDC that defines the rule.

   ---

   ### **Validation (for verifiers)**

1. Verify:

   * `p` links correctly to previous TEL event SAID.

   * Signatures from controller AID satisfy `kt`.

   * (Optional) Endorsements satisfy any referenced policy ACDC.

2. Ensure data integrity:

   * Anchored ACDCs or referenced records are retrievable and validly SAID-linked.

   * Sequence, timestamps, and state transitions are consistent.

   ---

   ### **Output**

* A valid **TEL event** in CESR format, signed by the AID controller.

* Optionally contains **endorsements** if required by business policy.

* The TEL’s state advances to reference the new authoritative data (ACDC, policy, etc.).

  ---

  # **🧭 Summary Table**

| Aspect | KEL | TEL |
| ----- | ----- | ----- |
| Domain | Identity / Key control | Business / Data control |
| Signed by | Controller keys | Controller keys |
| Witnesses | Required for network attestation | Not used |
| Signature rule | Must meet `kt` from KEL | Must meet `kt` from KEL |
| Witness rule | Must meet `wt` from KEL | N/A |
| Anchors | Commitments to next keys, witnesses | Links to ACDCs or policies |
| Verification | Structural \+ cryptographic | Structural \+ data/policy integrity |
| Mutability | Never edited, append-only | Never edited, append-only |

1. 

