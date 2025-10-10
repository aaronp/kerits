# Multi-Device Control & Key Rotation Scenarios

**Real-world guide to using KERI multi-signature for device management**

This document explains how KERI's multi-signature support enables secure multi-device control, key rotation, and recovery scenarios that users encounter in practice.

---

## Table of Contents
1. [How Multi-Device Control Works](#how-multi-device-control-works)
2. [Scenario 1: Creating Account on Phone & PC](#scenario-1-creating-account-on-phone--pc)
3. [Scenario 2: Normal Key Rotation](#scenario-2-normal-key-rotation)
4. [Scenario 3: Adding a Third Device](#scenario-3-adding-a-third-device)
5. [Scenario 4: Device Loss & Recovery](#scenario-4-device-loss--recovery)
6. [Scenario 5: Delegated Recovery](#scenario-5-delegated-recovery)
7. [Technical Deep Dive](#technical-deep-dive)

---

## How Multi-Device Control Works

### 🔑 Single KEL, Multi-Sig Keys

When you create a KERI identifier (AID), the **inception event** defines:
- **Current public keys** (`k` array) - one per device
- **Next public keys** (`n` array) - hashes of the next rotation keys
- **Signing threshold** (`kt`) - how many signatures required (e.g., "2 of 3")

**Example: 2-of-2 Multi-Device Inception**
```json
{
  "v": "KERI10JSON000160_",
  "t": "icp",
  "d": "EUserAID_12345...",
  "i": "EUserAID_12345...",
  "s": "0",
  "kt": "2",
  "k": [
    "DPhone_PublicKey_1234...",
    "DLaptop_PublicKey_5678..."
  ],
  "nt": "2",
  "n": [
    "EPhone_NextKeyDigest_ABCD...",
    "ELaptop_NextKeyDigest_EFGH..."
  ],
  "bt": "0",
  "b": [],
  "c": [],
  "a": []
}
```

**Key Points:**
- ✅ **One AID**, shared across devices
- ✅ **Distributed keys**, one per device
- ✅ **Cooperative signing**, both devices must sign
- ✅ **Same KEL**, replicated across devices via KERI agents

### 🔄 Device Synchronization

Each device maintains:
1. **Local KEL copy** - the authoritative event log
2. **Key pair** - private key stays on device, public key in KEL
3. **KERI agent** - syncs KEL via witnesses and peer exchange

**Sync Flow:**
```
Phone KEL ←→ Witnesses ←→ Laptop KEL
     ↓                         ↓
   Agent                     Agent
```

Like Git commits, but cryptographically enforced:
- Events are immutable and ordered
- Witnesses verify and store events
- Devices fetch and validate events
- Pre-committed next-key hashes prevent unauthorized rotations

---

## Scenario 1: Creating Account on Phone & PC

**User Story:** Alice wants to create a KERI identifier that requires both her phone and laptop to sign transactions.

### Step 1: Generate Keys on Each Device

**On Phone:**
```typescript
import { Signer } from 'signify-ts';

const phoneSigner = new Signer();
const phoneCurrentKey = phoneSigner.verfer.qb64;
const phoneNextKey = phoneSigner.nextKeys()[0];
```

**On Laptop:**
```typescript
const laptopSigner = new Signer();
const laptopCurrentKey = laptopSigner.verfer.qb64;
const laptopNextKey = laptopSigner.nextKeys()[0];
```

### Step 2: Create Inception Event (Either Device)

```typescript
import { incept } from 'kerits';

const inceptionEvent = incept({
  keys: [phoneCurrentKey, laptopCurrentKey],
  ndigs: [phoneNextKey, laptopNextKey],
  isith: '2',  // Require both signatures
  nsith: '2',
});

console.log('Created AID:', inceptionEvent.pre);
```

### Step 3: Both Devices Sign

**On Phone:**
```typescript
const phoneSignature = phoneSigner.sign(
  Buffer.from(inceptionEvent.raw),
  index: 0  // Phone is first in keys array
);
```

**On Laptop:**
```typescript
const laptopSignature = laptopSigner.sign(
  Buffer.from(inceptionEvent.raw),
  index: 1  // Laptop is second in keys array
);
```

### Step 4: Combine & Publish

```typescript
import { messagize } from 'kerits';

const signedEvent = messagize(
  inceptionEvent,
  [phoneSignature, laptopSignature]
);

// Publish to witnesses
await agent.publish(signedEvent);
```

### Result

Alice now has:
- ✅ **One AID** controlled by both devices
- ✅ **2-of-2 threshold** - both must cooperate
- ✅ **KEL replicated** across phone and laptop
- ✅ **Pre-committed next keys** for future rotation

**Test:** [`test/scenarios/multi-device-inception.test.ts`](../test/scenarios/multi-device-inception.test.ts)

---

## Scenario 2: Normal Key Rotation

**User Story:** Alice wants to rotate her keys as a security best practice (e.g., every 90 days).

### Why Rotate?

- **Security hygiene** - limits exposure window
- **Forward secrecy** - old keys can't forge new events
- **Pre-commitment** - next keys were committed in advance

### Step 1: Generate New Next Keys

**On Phone:**
```typescript
phoneSigner.rotate();  // Rotates to pre-committed next key
const phoneNewNextKey = phoneSigner.nextKeys()[0];
```

**On Laptop:**
```typescript
laptopSigner.rotate();
const laptopNewNextKey = laptopSigner.nextKeys()[0];
```

### Step 2: Create Rotation Event

```typescript
import { rotate } from 'kerits';

const rotationEvent = rotate({
  pre: inceptionEvent.pre,
  keys: [phoneSigner.verfer.qb64, laptopSigner.verfer.qb64],
  dig: inceptionEvent.said,  // Previous event digest
  sn: 1,
  isith: '2',
  ndigs: [phoneNewNextKey, laptopNewNextKey],
  nsith: '2',
});
```

### Step 3: Both Devices Sign

```typescript
const phoneRotSig = phoneSigner.sign(
  Buffer.from(rotationEvent.raw),
  index: 0
);

const laptopRotSig = laptopSigner.sign(
  Buffer.from(rotationEvent.raw),
  index: 1
);
```

### Step 4: Publish Rotation

```typescript
const signedRotation = messagize(
  rotationEvent,
  [phoneRotSig, laptopRotSig]
);

await agent.publish(signedRotation);
```

### Result

- ✅ **KEL updated** with new event (sn=1)
- ✅ **Current keys rotated** to previously-committed next keys
- ✅ **New next keys** pre-committed for future rotation
- ✅ **Old keys invalidated** - can't sign future events

**KEL Timeline:**
```
sn=0 (icp): k=[phone_key_0, laptop_key_0], n=[phone_key_1_hash, laptop_key_1_hash]
            ↓
sn=1 (rot): k=[phone_key_1, laptop_key_1], n=[phone_key_2_hash, laptop_key_2_hash]
```

**Test:** [`test/scenarios/key-rotation.test.ts`](../test/scenarios/key-rotation.test.ts)

---

## Scenario 3: Adding a Third Device

**User Story:** Alice gets a tablet and wants to add it to her multi-device setup, changing threshold to 2-of-3.

### Step 1: Generate Tablet Keys

```typescript
const tabletSigner = new Signer();
const tabletCurrentKey = tabletSigner.verfer.qb64;
const tabletNextKey = tabletSigner.nextKeys()[0];
```

### Step 2: Rotate to Add Tablet (Phone + Laptop Sign)

```typescript
const rotationEvent = rotate({
  pre: aid,
  keys: [
    phoneSigner.verfer.qb64,
    laptopSigner.verfer.qb64,
    tabletCurrentKey,  // Add tablet
  ],
  dig: previousEventSaid,
  sn: currentSn + 1,
  isith: '2',  // Now 2-of-3 threshold
  ndigs: [phoneNewNextKey, laptopNewNextKey, tabletNextKey],
  nsith: '2',
});

// Phone + Laptop sign (still need both for this rotation)
const phoneRotSig = phoneSigner.sign(rotationEvent.raw, 0);
const laptopRotSig = laptopSigner.sign(rotationEvent.raw, 1);

await agent.publish(messagize(rotationEvent, [phoneRotSig, laptopRotSig]));
```

### Result

- ✅ **3 keys in KEL** (phone, laptop, tablet)
- ✅ **2-of-3 threshold** - any two devices can sign
- ✅ **Increased flexibility** - losing one device doesn't lock account

**KEL Timeline:**
```
sn=0 (icp): kt="2", k=[phone_0, laptop_0]           (2-of-2)
sn=1 (rot): kt="2", k=[phone_1, laptop_1, tablet_1] (2-of-3) ← Added tablet
```

**Test:** [`test/scenarios/add-device.test.ts`](../test/scenarios/add-device.test.ts)

---

## Scenario 4: Device Loss & Recovery

**User Story:** Alice loses her phone. She needs to recover using her remaining devices.

### Case A: Below Threshold (Lost 1 of 2) 🔴

**Problem:** Alice has 2-of-2 threshold and lost phone. She **cannot rotate** without the phone's key.

**Solutions:**
1. **Delegated Recovery** (see Scenario 5)
2. **Witness-Based Recovery** (if configured)
3. **Key Escrow** (optional, outside KERI)

### Case B: Above Threshold (Lost 1 of 3) ✅

**Situation:** Alice has 2-of-3 threshold and lost phone. She still has **laptop + tablet**.

### Step 1: Rotate to Remove Lost Device

```typescript
const recoveryRotation = rotate({
  pre: aid,
  keys: [
    laptopSigner.verfer.qb64,
    tabletSigner.verfer.qb64,
    // Phone key OMITTED - effectively removes it
  ],
  dig: previousEventSaid,
  sn: currentSn + 1,
  isith: '2',  // Now 2-of-2 (both remaining devices)
  ndigs: [laptopNewNextKey, tabletNewNextKey],
  nsith: '2',
});

// Laptop + Tablet sign (satisfy 2-of-3 threshold)
const laptopSig = laptopSigner.sign(recoveryRotation.raw, 0);
const tabletSig = tabletSigner.sign(recoveryRotation.raw, 1);

await agent.publish(messagize(recoveryRotation, [laptopSig, tabletSig]));
```

### Step 2: Optional - Add Replacement Device

```typescript
const addNewPhoneRotation = rotate({
  pre: aid,
  keys: [
    laptopSigner.verfer.qb64,
    tabletSigner.verfer.qb64,
    newPhoneCurrentKey,  // Add replacement phone
  ],
  dig: recoveryRotation.said,
  sn: currentSn + 2,
  isith: '2',  // Back to 2-of-3
  ndigs: [laptopNextKey, tabletNextKey, newPhoneNextKey],
  nsith: '2',
});
```

### Result

- ✅ **Lost device key removed** from KEL
- ✅ **Account recovered** using remaining devices
- ✅ **Security maintained** - lost phone key can't be used
- ✅ **Optional replacement** device added

**KEL Timeline:**
```
sn=2 (rot): kt="2", k=[phone, laptop, tablet]     (2-of-3)
sn=3 (rot): kt="2", k=[laptop, tablet]            (2-of-2) ← Phone lost, removed
sn=4 (rot): kt="2", k=[laptop, tablet, new_phone] (2-of-3) ← Added replacement
```

**Test:** [`test/scenarios/device-loss-recovery.test.ts`](../test/scenarios/device-loss-recovery.test.ts)

---

## Scenario 5: Delegated Recovery

**User Story:** Alice sets up a recovery AID (trusted contact or hardware wallet) that can rotate her keys if she loses threshold.

### Step 1: Create Recovery AID

```typescript
// Alice's trusted contact creates recovery AID
const recoveryInception = incept({
  keys: [trustedContactKey],
  ndigs: [trustedContactNextKey],
});

const recoveryAID = recoveryInception.pre;
```

### Step 2: Create Main AID with Delegation

```typescript
// Alice's main AID, delegated to recovery AID
const mainInception = incept({
  keys: [phoneKey, laptopKey],
  ndigs: [phoneNextKey, laptopNextKey],
  isith: '2',
  nsith: '2',
  delpre: recoveryAID,  // Delegated to recovery AID
});
```

### Step 3: Recovery Scenario (Lost Both Devices)

**Alice contacts trusted contact, who creates recovery rotation:**

```typescript
// Trusted contact creates rotation for Alice's AID
const recoveryRotation = rotate({
  pre: mainInception.pre,
  keys: [newPhone1Key, newPhone2Key],  // Alice's new device keys
  dig: lastKnownEventSaid,
  sn: currentSn + 1,
  isith: '2',
  ndigs: [newPhone1NextKey, newPhone2NextKey],
  nsith: '2',
  delpre: recoveryAID,  // Still delegated
});

// Trusted contact signs as delegator
const delegatorSig = trustedContactSigner.sign(recoveryRotation.raw);
```

### Step 4: Delegator Anchors Rotation

```typescript
// Trusted contact creates interaction event to anchor the rotation
const anchorInteraction = interact({
  pre: recoveryAID,
  dig: lastRecoveryEventSaid,
  sn: recoverySn + 1,
  data: [
    {
      i: mainInception.pre,
      s: recoveryRotation.ked.s,
      d: recoveryRotation.said,
    },
  ],
});

await agent.publish(anchorInteraction);
```

### Result

- ✅ **Complete recovery** even with total device loss
- ✅ **Delegator authorization** required for rotation
- ✅ **Trust model** - Alice trusts recovery contact/device
- ✅ **KEL continuity** - same AID, new keys

**Delegation Flow:**
```
Recovery AID (Delegator)
    ↓ delegates authority to
Main AID (Delegatee)
    ↓ if threshold lost
Recovery AID can rotate Main AID keys
```

**Test:** [`test/scenarios/delegated-recovery.test.ts`](../test/scenarios/delegated-recovery.test.ts)

---

## Technical Deep Dive

### 🔐 Pre-Commitment Security Model

KERI's **next-key pre-commitment** prevents unauthorized rotations:

1. **Inception** commits to `n` (next key digests)
2. **Rotation** reveals keys matching those digests
3. **Witnesses verify** rotation keys match pre-committed digests
4. **Unauthorized rotation** rejected if keys don't match

**Example:**
```
sn=0: n=["Hash(phone_key_1)", "Hash(laptop_key_1)"]
      ↓
sn=1: k=["phone_key_1", "laptop_key_1"]  ✅ Hashes match
sn=1: k=["attacker_key", "laptop_key_1"] ❌ Hash doesn't match - REJECTED
```

### 🔄 Threshold Validation

The `Tholder` class validates thresholds:

**Numeric Threshold:**
```typescript
const tholder = new Tholder({ sith: '2' });
tholder.validate(3);  // ✅ 2-of-3 is valid
tholder.validate(1);  // ❌ 2-of-1 is invalid
```

**Weighted Threshold:**
```typescript
const tholder = new Tholder({ sith: ['1/2', '1/4', '1/4'] });
// Requires signatures totaling >= 1/2
// Phone (1/2) alone = sufficient
// Laptop (1/4) + Tablet (1/4) = 1/2 = sufficient
```

### 📡 Witness Coordination

Witnesses provide:
- **Event storage** - authoritative KEL copies
- **Receipt signatures** - validation proof
- **Threshold verification** - check signature count
- **Availability** - always-on KEL access

**Witness Config in Inception:**
```json
{
  "bt": "2",
  "b": [
    "BWitness1_AID_1234...",
    "BWitness2_AID_5678...",
    "BWitness3_AID_ABCD..."
  ]
}
```

**Receipt Collection:**
```typescript
// After publishing event, collect witness receipts
const receipts = await agent.collectReceipts(eventSaid, threshold: 2);
// Must get 2-of-3 witness receipts to confirm event
```

### 🌳 Key Event Log Structure

**Complete KEL Example:**
```json
[
  {
    "v": "KERI10JSON000160_",
    "t": "icp",
    "d": "EAID...",
    "i": "EAID...",
    "s": "0",
    "kt": "2",
    "k": ["Dphone_0", "Dlaptop_0"],
    "nt": "2",
    "n": ["Ephone_1_hash", "Elaptop_1_hash"],
    "bt": "2",
    "b": ["BWit1", "BWit2", "BWit3"],
    "c": [],
    "a": []
  },
  {
    "v": "KERI10JSON000190_",
    "t": "rot",
    "d": "EROT1...",
    "i": "EAID...",
    "s": "1",
    "p": "EAID...",
    "kt": "2",
    "k": ["Dphone_1", "Dlaptop_1"],
    "nt": "2",
    "n": ["Ephone_2_hash", "Elaptop_2_hash"],
    "bt": "2",
    "br": [],
    "ba": [],
    "a": []
  }
]
```

**Properties:**
- **Immutable** - events can't be changed
- **Ordered** - sequence numbers enforce order
- **Chained** - each event references previous via `p` (prior digest)
- **Verifiable** - signatures prove authorization

---

## Summary

| Scenario | Threshold | Result | Test |
|----------|-----------|--------|------|
| **Phone + PC Setup** | 2-of-2 | ✅ Cooperative control | `multi-device-inception.test.ts` |
| **Key Rotation** | 2-of-2 | ✅ Both devices rotate | `key-rotation.test.ts` |
| **Add Tablet** | 2-of-3 | ✅ Increased flexibility | `add-device.test.ts` |
| **Lose Phone (2-of-3)** | 2-of-2 → 2-of-3 | ✅ Recover with remaining | `device-loss-recovery.test.ts` |
| **Lose Phone (2-of-2)** | — | ❌ Need delegated recovery | `delegated-recovery.test.ts` |
| **Delegated Recovery** | Any | ✅ Trusted contact recovers | `delegated-recovery.test.ts` |

**Key Takeaways:**
1. ✅ One AID, multiple devices with distributed keys
2. ✅ Threshold determines how many signatures required
3. ✅ Pre-committed next keys prevent unauthorized rotations
4. ✅ KEL syncs across devices via witnesses
5. ✅ Device loss recoverable if threshold allows
6. ✅ Delegation provides ultimate recovery mechanism

---

**Next Steps:**
- Run scenario tests: `bun test test/scenarios/`
- Read [kerits-sig-plan.md](../kerits-sig-plan.md) for implementation details
- Explore [test/scenarios/](../test/scenarios/) for working examples
