# Delegation Scenarios: Parent-Child Identifier Relationships

**Real-world guide to KERI delegation for hierarchical identity management**

This document explains how KERI's delegation feature enables secure parent-child identifier relationships, perfect for organizational hierarchies, custody arrangements, and recovery mechanisms.

---

## Table of Contents
1. [What is Delegation?](#what-is-delegation)
2. [Scenario 1: Creating a Delegated Identity](#scenario-1-creating-a-delegated-identity)
3. [Scenario 2: Organization with Department AIDs](#scenario-2-organization-with-department-aids)
4. [Scenario 3: Delegated Key Rotation](#scenario-3-delegated-key-rotation)
5. [Scenario 4: Using Delegation for Recovery](#scenario-4-using-delegation-for-recovery)
6. [Scenario 5: Multi-Level Delegation](#scenario-5-multi-level-delegation)
7. [Scenario 6: Revoking Delegated Authority](#scenario-6-revoking-delegated-authority)
8. [Technical Deep Dive](#technical-deep-dive)

---

## What is Delegation?

**Delegation** allows one KERI identifier (the **delegator** or **parent**) to authorize and control another identifier (the **delegatee** or **child**). This creates a cryptographically-enforced parent-child relationship.

### Key Concepts

**Delegator (Parent)**
- Has authority over delegatee
- Must approve delegatee's key events (inception, rotation)
- Anchors delegatee events in its own KEL via interaction events
- Can effectively revoke delegatee by refusing to anchor

**Delegatee (Child)**
- Created with `delpre` field pointing to delegator
- Cannot rotate keys without delegator approval
- Maintains its own KEL, but relies on delegator's KEL for authority
- Event types: `dip` (delegated inception), `drt` (delegated rotation)

### Why Use Delegation?

✅ **Organizational Hierarchy** - Company → Departments → Teams
✅ **Custody & Recovery** - User → Recovery AID (trusted contact)
✅ **Device Management** - Master AID → Device-specific AIDs
✅ **Authority Delegation** - Admin → Sub-admins → Users
✅ **Graduated Control** - Parent controls child's key lifecycle

### Delegation Flow

```
1. Child creates delegated inception event (dip)
2. Child sends event to parent
3. Parent approves by creating interaction event with anchor seal
4. Parent's anchor includes: {i: child_AID, s: child_sn, d: child_said}
5. Child event becomes valid once anchored
6. Witnesses verify parent's anchor before accepting child event
```

---

## Scenario 1: Creating a Delegated Identity

**User Story:** Alice wants to create a recovery AID that her trusted contact Bob can control. Bob's AID will be delegated to Alice's main AID.

### Step 1: Alice Creates Main AID

```typescript
import { incept } from 'kerits';

// Alice's main identifier
const aliceMain = incept({
  keys: ['DAlice_Phone_Key', 'DAlice_Laptop_Key'],
  ndigs: ['EAlice_Phone_Next', 'EAlice_Laptop_Next'],
  isith: '2',
  nsith: '2',
});

const aliceAID = aliceMain.pre;
console.log('Alice AID:', aliceAID);
```

### Step 2: Bob Creates Delegated AID

```typescript
// Bob's recovery AID, delegated to Alice
const bobRecovery = incept({
  keys: ['DBob_Key'],
  ndigs: ['EBob_Next_Key_Digest'],
  delpre: aliceAID,  // Delegated to Alice's AID
});

console.log('Event type:', bobRecovery.ked.t);  // 'dip' (delegated inception)
console.log('Delegator:', bobRecovery.ked.di);  // Alice's AID
```

### Step 3: Alice Anchors Bob's Delegated Inception

```typescript
import { interact } from 'kerits';

// Alice creates interaction event to anchor Bob's inception
const aliceAnchor = interact({
  pre: aliceAID,
  dig: aliceMain.said,
  sn: 1,
  data: [
    {
      i: bobRecovery.pre,      // Bob's recovery AID
      s: bobRecovery.ked.s,    // Sequence number (0)
      d: bobRecovery.said,     // Event digest
    },
  ],
});

// Alice signs with both devices (2-of-2)
// Publishes to witnesses
await agent.publish(aliceAnchor);
```

### Step 4: Verify Delegation Chain

```typescript
// Bob's AID is now valid, anchored by Alice
const bobAID = bobRecovery.pre;

// Delegation relationship verified:
// - Bob's inception has delpre = Alice's AID
// - Alice's KEL contains anchor for Bob's inception
// - Witnesses verify anchor exists before accepting Bob's events
```

### Result

Alice has created a delegated recovery mechanism:
- ✅ **Bob's AID delegated** to Alice's main AID
- ✅ **Anchor recorded** in Alice's KEL
- ✅ **Authority established** - Alice must approve Bob's key rotations
- ✅ **Recovery ready** - Bob can help Alice recover if needed

**Test:** [`test/scenarios/delegated-inception.test.ts`](../test/scenarios/delegated-inception.test.ts)

---

## Scenario 2: Organization with Department AIDs

**User Story:** TechCorp creates department-specific identifiers, all delegated to the company's root AID.

### Step 1: Company Creates Root AID

```typescript
const techCorpRoot = incept({
  keys: [
    'DCEO_Key',
    'DCFO_Key',
    'DCTO_Key',
  ],
  ndigs: [
    'ECEO_Next',
    'ECFO_Next',
    'DCTO_Next',
  ],
  isith: '2',  // 2-of-3 executive approval
  nsith: '2',
});

const companyAID = techCorpRoot.pre;
```

### Step 2: Create Engineering Department AID

```typescript
const engineeringDept = incept({
  keys: [
    'DEngineering_Manager_Key',
    'DEngineering_Lead_Key',
  ],
  ndigs: [
    'EEngineering_Manager_Next',
    'EEngineering_Lead_Next',
  ],
  isith: '2',
  nsith: '2',
  delpre: companyAID,  // Delegated to TechCorp root
});
```

### Step 3: Create Sales Department AID

```typescript
const salesDept = incept({
  keys: ['DSales_Manager_Key'],
  ndigs: ['ESales_Manager_Next'],
  delpre: companyAID,  // Also delegated to TechCorp root
});
```

### Step 4: Company Anchors Both Departments

```typescript
const companyAnchor = interact({
  pre: companyAID,
  dig: techCorpRoot.said,
  sn: 1,
  data: [
    // Anchor Engineering
    {
      i: engineeringDept.pre,
      s: '0',
      d: engineeringDept.said,
    },
    // Anchor Sales
    {
      i: salesDept.pre,
      s: '0',
      d: salesDept.said,
    },
  ],
});

// 2-of-3 executives sign
await agent.publish(companyAnchor);
```

### Result

Organizational hierarchy established:
```
TechCorp (Root AID)
├── Engineering Department (Delegated AID)
└── Sales Department (Delegated AID)
```

Benefits:
- ✅ **Centralized control** - Company approves department key changes
- ✅ **Department autonomy** - Departments manage own credentials
- ✅ **Audit trail** - Company KEL shows all department relationships
- ✅ **Revocable** - Company can refuse to anchor rogue departments

**Test:** [`test/scenarios/organization-hierarchy.test.ts`](../test/scenarios/organization-hierarchy.test.ts)

---

## Scenario 3: Delegated Key Rotation

**User Story:** Bob needs to rotate keys on his delegated recovery AID, requiring Alice's approval.

### Step 1: Bob Creates Rotation Event

```typescript
const bobRotation = rotate({
  pre: bobRecoveryAID,
  keys: ['DBob_New_Key'],  // Rotated key
  dig: bobInception.said,
  sn: 1,
  ndigs: ['EBob_Next_Next_Key'],
  delpre: aliceAID,  // Still delegated to Alice
});

console.log('Event type:', bobRotation.ked.t);  // 'drt' (delegated rotation)
```

### Step 2: Bob Sends to Alice for Approval

```typescript
// Bob signs his rotation
const bobSig = bobSigner.sign(bobRotation.raw);

// Bob sends to Alice via exchange message
await agent.sendExchange({
  recipient: aliceAID,
  topic: '/delegate/request',
  event: bobRotation,
  signatures: [bobSig],
});
```

### Step 3: Alice Reviews and Anchors

```typescript
// Alice receives delegation request
const delegationRequest = await agent.receiveDelegationRequests();

// Alice reviews: Is this Bob? Is rotation legitimate?
if (isLegitimate(delegationRequest)) {
  // Alice creates anchor
  const aliceAnchor = interact({
    pre: aliceAID,
    dig: previousAliceEventSaid,
    sn: 2,
    data: [
      {
        i: bobRecoveryAID,
        s: '1',  // Bob's rotation sequence number
        d: bobRotation.said,
      },
    ],
  });

  await agent.publish(aliceAnchor);
}
```

### Step 4: Bob's Rotation Validated

```typescript
// After Alice's anchor is published:
// - Witnesses see anchor in Alice's KEL
// - Bob's rotation becomes valid
// - Bob's KEL updated with new keys

// Bob can now use new keys
const bobNewSigner = Signer.fromPrivateKey(bobNewPrivateKey);
```

### Result

- ✅ **Bob rotated keys** with Alice's approval
- ✅ **Delegation maintained** - still delegated to Alice
- ✅ **Authority respected** - Alice had veto power
- ✅ **KEL continuity** - Both KELs updated

**KEL Timeline:**
```
Alice KEL:
sn=0 (icp): Alice's inception
sn=1 (ixn): Anchor Bob's inception
sn=2 (ixn): Anchor Bob's rotation ← Approval

Bob KEL:
sn=0 (dip): Bob's delegated inception (anchored by Alice sn=1)
sn=1 (drt): Bob's delegated rotation (anchored by Alice sn=2)
```

**Test:** [`test/scenarios/delegated-rotation.test.ts`](../test/scenarios/delegated-rotation.test.ts)

---

## Scenario 4: Using Delegation for Recovery

**User Story:** Alice loses both phone and laptop (below threshold). Bob uses his delegated recovery AID to rotate Alice's keys.

### Prerequisites

Alice's setup:
- Main AID: 2-of-2 (phone + laptop)
- Recovery AID delegated to main AID
- Bob controls recovery AID

### Step 1: Alice Loses Devices

```typescript
// Alice's main AID (2-of-2, both devices lost)
const aliceMain = {
  pre: 'EAlice_Main_AID',
  keys: ['DPhone_Lost', 'DLaptop_Lost'],
  threshold: '2',
};

// Alice cannot sign - below threshold ❌
```

### Step 2: Bob Uses Recovery AID

```typescript
// Bob's recovery AID can rotate Alice's main AID
// because the relationship is REVERSED:
// Recovery AID is delegated TO Alice's main AID,
// meaning Alice controls the recovery AID,
// BUT Bob (holding recovery keys) can't directly rotate Alice's keys

// Instead, proper setup is:
// Alice's main AID is delegated TO Bob's recovery AID
```

**Important Correction:** For recovery to work, the relationship must be:
```
Bob's Recovery AID (Delegator/Parent)
    ↓ delegates authority
Alice's Main AID (Delegatee/Child)
```

### Proper Recovery Setup

```typescript
// Step 1: Bob creates his recovery AID (not delegated)
const bobRecovery = incept({
  keys: ['DBob_Recovery_Key'],
  ndigs: ['EBob_Recovery_Next'],
});

// Step 2: Alice creates her main AID, delegated to Bob's recovery AID
const aliceMain = incept({
  keys: ['DAlice_Phone', 'DAlice_Laptop'],
  ndigs: ['EAlice_Phone_Next', 'EAlice_Laptop_Next'],
  isith: '2',
  nsith: '2',
  delpre: bobRecovery.pre,  // Delegated to Bob's recovery AID
});

// Step 3: Bob anchors Alice's inception
const bobAnchor = interact({
  pre: bobRecovery.pre,
  dig: bobRecovery.said,
  sn: 1,
  data: [{
    i: aliceMain.pre,
    s: '0',
    d: aliceMain.said,
  }],
});
```

### Step 3: Recovery - Bob Rotates Alice's Keys

```typescript
// Alice loses both devices
// Bob creates rotation for Alice's AID
const aliceRecoveryRotation = rotate({
  pre: aliceMain.pre,
  keys: [
    'DAlice_New_Phone',
    'DAlice_New_Laptop',
  ],
  dig: aliceMain.said,
  sn: 1,
  isith: '2',
  ndigs: ['EAlice_New_Phone_Next', 'EAlice_New_Laptop_Next'],
  nsith: '2',
  delpre: bobRecovery.pre,  // Still delegated to Bob
});

// Bob signs as delegator
const bobSig = bobSigner.sign(aliceRecoveryRotation.raw);

// Bob anchors in his KEL
const bobAnchorRotation = interact({
  pre: bobRecovery.pre,
  dig: bobAnchor.said,
  sn: 2,
  data: [{
    i: aliceMain.pre,
    s: '1',
    d: aliceRecoveryRotation.said,
  }],
});

await agent.publish(bobAnchorRotation);
```

### Step 4: Alice Regains Control

```typescript
// Alice gets new devices with new keys
// Alice's AID recovered with new keys
// Alice can now sign with new devices

// Optional: Alice can later rotate to remove delegation
// (requires Bob's approval one last time)
```

### Result

- ✅ **Complete recovery** even with total device loss
- ✅ **Bob authorized** to rotate Alice's keys
- ✅ **KEL continuity** maintained
- ✅ **Trust model** clear - Alice trusts Bob

**Test:** [`test/scenarios/delegated-recovery.test.ts`](../test/scenarios/delegated-recovery.test.ts)

---

## Scenario 5: Multi-Level Delegation

**User Story:** Three-tier organizational hierarchy: Corporation → Department → Team.

### Setup

```
Acme Corp (Root)
    ↓
Engineering Dept (Child of Root)
    ↓
DevOps Team (Child of Engineering)
```

### Step 1: Create Root

```typescript
const acmeCorp = incept({
  keys: ['DAcme_CEO_Key', 'DAcme_CFO_Key'],
  ndigs: ['EAcme_CEO_Next', 'EAcme_CFO_Next'],
  isith: '2',
  nsith: '2',
});
```

### Step 2: Create Department (Delegated to Root)

```typescript
const engineering = incept({
  keys: ['DEngineering_VP_Key'],
  ndigs: ['EEngineering_VP_Next'],
  delpre: acmeCorp.pre,  // Delegated to Acme Corp
});

// Acme anchors Engineering
const acmeAnchor1 = interact({
  pre: acmeCorp.pre,
  dig: acmeCorp.said,
  sn: 1,
  data: [{
    i: engineering.pre,
    s: '0',
    d: engineering.said,
  }],
});
```

### Step 3: Create Team (Delegated to Department)

```typescript
const devOps = incept({
  keys: ['DDevOps_Lead_Key'],
  ndigs: ['EDevOps_Lead_Next'],
  delpre: engineering.pre,  // Delegated to Engineering Dept
});

// Engineering anchors DevOps
const engAnchor1 = interact({
  pre: engineering.pre,
  dig: engineering.said,
  sn: 1,
  data: [{
    i: devOps.pre,
    s: '0',
    d: devOps.said,
  }],
});
```

### Delegation Chain

```
Acme Corp KEL:
  sn=0: icp (root inception)
  sn=1: ixn (anchor Engineering inception)

Engineering KEL:
  sn=0: dip (delegated to Acme, anchored by Acme sn=1)
  sn=1: ixn (anchor DevOps inception)

DevOps KEL:
  sn=0: dip (delegated to Engineering, anchored by Engineering sn=1)
```

### Verification

```typescript
// Verify delegation chain
const devOpsEvent = devOps.ked;
console.log('DevOps delegated to:', devOpsEvent.di);  // Engineering AID

const engineeringEvent = engineering.ked;
console.log('Engineering delegated to:', engineeringEvent.di);  // Acme AID

// Chain: Acme → Engineering → DevOps
```

### Result

- ✅ **3-level hierarchy** established
- ✅ **Cascading authority** - Acme controls all
- ✅ **Delegated autonomy** - Each level manages children
- ✅ **Audit trail** - Complete delegation chain in KELs

**Test:** [`test/scenarios/multi-level-delegation.test.ts`](../test/scenarios/multi-level-delegation.test.ts)

---

## Scenario 6: Revoking Delegated Authority

**User Story:** Company needs to revoke a department's delegated AID.

### Mechanism: Refusal to Anchor

The delegator doesn't explicitly revoke; instead, it **refuses to anchor** future events.

### Step 1: Department Attempts Rotation

```typescript
// Engineering dept tries to rotate keys
const engineeringRotation = rotate({
  pre: engineeringAID,
  keys: ['DNew_Engineering_Key'],
  dig: previousEngineeringEventSaid,
  sn: 1,
  ndigs: ['ENew_Engineering_Next'],
  delpre: acmeCorpAID,
});

// Engineering signs and sends to Acme
await agent.sendDelegationRequest(engineeringRotation);
```

### Step 2: Company Refuses to Anchor

```typescript
// Acme receives request
const request = await agent.receiveDelegationRequest();

// Acme decides to revoke authority
if (shouldRevoke) {
  // Simply DO NOT create anchor interaction event
  console.log('Delegation request denied - not anchoring');
  // No anchor = rotation never becomes valid
}
```

### Step 3: Engineering Cannot Rotate

```typescript
// Engineering's rotation event exists but is not valid
// Witnesses check for anchor in Acme's KEL
// No anchor found → Event rejected by witnesses

// Engineering AID effectively frozen
// Can't rotate keys, can't issue credentials, etc.
```

### Result

- ✅ **Implicit revocation** - no explicit revoke event
- ✅ **Delegatee frozen** - can't make any key changes
- ✅ **Delegator retains control** - can anchor later if relationship restored
- ❌ **Permanent revocation** - requires explicit mechanism (future work)

**Test:** [`test/scenarios/delegation-revocation.test.ts`](../test/scenarios/delegation-revocation.test.ts)

---

## Technical Deep Dive

### Delegated Event Types

**dip (Delegated Inception)**
```json
{
  "v": "KERI10JSON000154_",
  "t": "dip",
  "d": "EChild_AID...",
  "i": "EChild_AID...",
  "s": "0",
  "kt": "1",
  "k": ["DChild_Key..."],
  "nt": "1",
  "n": ["EChild_Next..."],
  "bt": "0",
  "b": [],
  "c": [],
  "a": [],
  "di": "EParent_AID..."  ← Delegator identifier
}
```

**drt (Delegated Rotation)**
```json
{
  "v": "KERI10JSON000175_",
  "t": "drt",
  "d": "ERotation_SAID...",
  "i": "EChild_AID...",
  "s": "1",
  "p": "EPrevious_Event...",
  "kt": "1",
  "k": ["DChild_New_Key..."],
  "nt": "1",
  "n": ["EChild_Next_Next..."],
  "bt": "0",
  "br": [],
  "ba": [],
  "a": [],
  "di": "EParent_AID..."  ← Still delegated
}
```

### Anchor Seal Format

Parent's interaction event anchoring child's event:

```json
{
  "v": "KERI10JSON000120_",
  "t": "ixn",
  "d": "EInteraction_SAID...",
  "i": "EParent_AID...",
  "s": "1",
  "p": "EParent_Previous...",
  "a": [
    {
      "i": "EChild_AID...",      // Child identifier
      "s": "0",                   // Child event sequence number
      "d": "EChild_Event_SAID..." // Child event digest
    }
  ]
}
```

### Delegation Validation Rules

1. **Delegated event must have `di` field** matching delegator AID
2. **Delegator must have anchor** for child event in its KEL
3. **Anchor must appear** before or at same time as child event
4. **Anchor seal must match** child event identically (i, s, d)
5. **Witnesses verify anchor** exists before accepting child event

### Delegation vs. Multi-Sig

| Feature | Delegation | Multi-Sig |
|---------|-----------|-----------|
| **Control** | Parent controls child | Peers cooperate |
| **Authority** | Hierarchical | Distributed |
| **Approval** | Parent anchors | Peers sign |
| **Use Case** | Organizations, recovery | Multi-device, committees |
| **Event Types** | dip, drt | icp, rot |

---

## Summary

| Scenario | Relationship | Use Case | Test |
|----------|-------------|----------|------|
| **Delegated Inception** | Parent → Child | Create delegated AID | `delegated-inception.test.ts` |
| **Organization Hierarchy** | Company → Departments | Organizational structure | `organization-hierarchy.test.ts` |
| **Delegated Rotation** | Parent approves child rotation | Key management | `delegated-rotation.test.ts` |
| **Recovery** | Recovery AID → Main AID | Device loss recovery | `delegated-recovery.test.ts` |
| **Multi-Level** | Root → Dept → Team | Complex hierarchies | `multi-level-delegation.test.ts` |
| **Revocation** | Parent refuses anchor | Terminate relationship | `delegation-revocation.test.ts` |

**Key Takeaways:**
1. ✅ Delegation creates parent-child authority relationships
2. ✅ Parent must anchor child events for them to be valid
3. ✅ Delegated events use dip/drt types with `di` field
4. ✅ Perfect for organizations, recovery, and hierarchies
5. ✅ Implicit revocation by refusing to anchor
6. ✅ Can combine with multi-sig for delegated groups

---

**Next Steps:**
- Run scenario tests: `bun test test/scenarios/delegation`
- Compare with [MULTI-DEVICE-SCENARIOS.md](MULTI-DEVICE-SCENARIOS.md)
- Read [kerits-sig-plan.md](../kerits-sig-plan.md) for implementation
