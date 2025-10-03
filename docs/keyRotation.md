# Key Rotation in KERITS

## Overview

KERITS implements KERI key rotation using a single BIP39 mnemonic (24 words) to derive all keypairs through deterministic key derivation. The mnemonic **never changes** - it serves as the master seed for all key generations.

## Key Derivation

All keys are derived from the same 24-word mnemonic using different derivation paths:

```
Mnemonic (24 words) → BIP39 Seed
    ↓ path: "current"     → Current Keypair (initial)
    ↓ path: "next"        → Next Keypair (initial)
    ↓ path: "next-1"      → Next Keypair (after 1st rotation)
    ↓ path: "next-2"      → Next Keypair (after 2nd rotation)
    ↓ path: "next-N"      → Next Keypair (after Nth rotation)
```

**Implementation**: [`deriveSeed(mnemonic, path)`](../ui/src/lib/mnemonic.ts#L25-L28)

## Rotation Process

When rotating keys:

1. **Current keys** ← Previous "next" keys (already in KEL commitment)
2. **New next keys** ← Derived from mnemonic with path `next-${KEL.length}`
3. **Rotation event** → Added to KEL with new next key digest

### Key Methods

- **Derivation**: [`deriveSeed()`](../ui/src/lib/mnemonic.ts#L25) - Derives 32-byte seed from mnemonic + path
- **Keypair Generation**: [`generateKeypairFromSeed()`](../../src/signer.ts) - Creates Ed25519 keypair from seed
- **Digest**: [`diger()`](../../src/diger.ts) - Blake3-256 digest for next key commitment
- **Rotation Event**: [`rotate()`](../../src/rotate.ts) - Creates rotation event in KEL

### Implementation

**UI Profile Page**: [`handleRotateKeys()`](../ui/src/components/Profile.tsx#L24-L78)

```typescript
// Derive new next keypair from same mnemonic
const nextRotationSeed = deriveSeed(identity.mnemonic, `next-${identity.kel.length}`);
const newNextKeypair = await generateKeypairFromSeed(nextRotationSeed, true);
const newNextKeyDigest = diger(newNextKeypair.publicKey);

// Create rotation event
const rotationEvent = rotate({
  pre: prefix,
  keys: [identity.nextKeys.public],  // Previous "next" becomes "current"
  ndigs: [newNextKeyDigest],          // New next key commitment
  sn: identity.kel.length,            // Sequence number
  dig: prevDigest,                    // Previous event digest
});

// Update identity
const updatedIdentity = {
  ...identity,
  currentKeys: identity.nextKeys,     // Rotate keys
  nextKeys: newNextKeypair,           // New next keys
  kel: [...identity.kel, rotationEvent],
};
```

## Security Model

### Pre-Rotation

KERI uses **pre-rotation** - the digest of the next public key is committed in the current event. This means:

- Next keys are committed **before** they're used
- Attacker cannot forge rotation without knowing the next private key
- Key compromise requires stealing **both** current private key AND mnemonic

### Mnemonic Storage

The 24-word mnemonic is:
- Stored in IndexedDB for the UI application
- Required to derive all future keys
- **Should be backed up securely** by the user
- Never transmitted or shared

### Recovery

With the mnemonic, a user can:
1. Re-derive all keypairs using the same derivation paths
2. Reconstruct the entire KEL if sequence numbers are known
3. Recover full identity control

## Example: Key States Through Rotations

```
Inception (KEL[0]):
  Current: deriveSeed(mnemonic, "current")
  Next: deriveSeed(mnemonic, "next")
  KEL: [inception_event]

After 1st Rotation (KEL[1]):
  Current: deriveSeed(mnemonic, "next")        ← Was "next"
  Next: deriveSeed(mnemonic, "next-1")         ← New
  KEL: [inception_event, rotation_event_1]

After 2nd Rotation (KEL[2]):
  Current: deriveSeed(mnemonic, "next-1")      ← Was "next"
  Next: deriveSeed(mnemonic, "next-2")         ← New
  KEL: [inception_event, rotation_event_1, rotation_event_2]
```

## UI Features

Users can rotate keys from the **Profile** page:
- View current and next public keys
- Click "Rotate Keys" button
- Confirm rotation in dialog
- Keys automatically rotate and KEL updates
- Same mnemonic backs all keys

**Location**: User dropdown menu → Profile → Rotate Keys button on each identity
