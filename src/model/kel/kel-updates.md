### **Append Preconditions**

To append a new event to a KEL:

1. **Resolve latest AID state**

   * Retrieve last valid event from this AID’s KEL.

   * Extract:

     * Current keys `k`

     * Signing threshold `kt`

     * Next commitment `n`, next threshold `nt`

     * Witnesses `w` and witness threshold `wt`

     * Sequence number `s`

2. **Build new event**

   * Increment `s`

   * Set `p = SAID(previous event)`

   * Compute new commitments (if `rot`)

   * Include correct witnesses (if changed)

3. **Signatures (controller-level)**

   * Must have ≥ `kt` valid signatures from current keys `k`.

4. **Witness receipts (network-level)**

   * Collect ≥ `wt` valid **witness receipts** from declared witnesses `w`.

   * Each witness signs the event’s SAID to attest replication.

5. **Validation (for verifiers)**

   * Verify chain integrity: each event’s `p` matches prior SAID.

   * Verify controller signatures meet `kt`.

   * Verify witness receipts meet `wt` (if policy requires witnessed events).

   * Verify time/order consistency.

   ---

   ### **Output**

* A valid **KEL event** in CESR format, with:

  * Controller signatures (attached)

  * Witness receipts (attached)

* The AID’s state advances to reflect new key material and commitments.  
1. 

