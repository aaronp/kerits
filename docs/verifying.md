# KERI Signing and Verification in Kerits

## Current Status: ⚠️ **SIGNATURES NOT YET IMPLEMENTED**

The kerits codebase currently stores **unsigned events**. While cryptographic primitives exist, they are not integrated into the event creation and storage pipeline.

## Architecture Overview

### Event Flow (Current)
```
Event Creation → Serialization → Storage
     ↓                ↓              ↓
  (unsigned)      (unsigned)    (unsigned)
```

### Event Flow (Required)
```
Event Creation → Signing → Serialization → Storage → Verification
     ↓             ↓            ↓             ↓            ↓
  (unsigned)   (signed)     (w/ sigs)   (w/ sigs)    (verified)
```

---

## Cryptographic Primitives (Implemented)

### 1. Key Generation
**Location**: [src/signer.ts](../src/signer.ts)

```typescript
// Generate Ed25519 keypair from seed
const keypair = await generateKeypairFromSeed(seed, transferable);
// Returns: { privateKey, publicKey, verfer }
```

**CESR Signer Class**: [src/cesr/signer.ts](../src/cesr/signer.ts:28-90)
```typescript
class Signer extends Matter {
  sign(ser: Uint8Array): Cigar  // Signs data, returns signature
  get verfer(): Verfer           // Public key for verification
}
```

### 2. Signing Function
**Location**: [src/sign.ts](../src/sign.ts:119-151)

```typescript
async function sign(message: string, privateKey: string): Promise<string>
```

- Input: message string, CESR-encoded private key
- Output: CESR-encoded Ed25519 signature (prefix `0B`)
- Algorithm: Ed25519 via `@noble/ed25519`
- Encoding: CESR base64url with proper padding

**Test vectors**: [kerits/test-cases/test_sign_001.json](../test-cases/test_sign_001.json) - [test_sign_005.json](../test-cases/test_sign_005.json)

### 3. Verification Function
**Location**: [src/sign.ts](../src/sign.ts:160-181)

```typescript
async function verify(message: string, signature: string, publicKey: string): Promise<boolean>
```

- Input: message string, CESR signature, CESR public key
- Output: boolean (valid/invalid)
- Decodes CESR → verifies Ed25519 signature

### 4. SAID Verification
**Location**: [src/verify.ts](../src/verify.ts)

```typescript
function verifyCredential(credentialJson): VerificationResult
```

- Verifies credential SAID (self-addressing identifier)
- Verifies subject SAID in attributes
- Validates version string and structure
- **Does NOT verify signatures** (credentials currently unsigned)

---

## Event Creation (Unsigned)

### KEL Events

#### Inception
**Location**: [src/incept.ts](../src/incept.ts:64-150)
```typescript
function incept(options: InceptOptions): InceptionEvent
```
Creates unsigned inception event with:
- Current keys (`k`)
- Next key digests (`n`)
- Thresholds (`kt`, `nt`)
- SAID computed via saidify

#### Rotation
**Location**: [src/rotate.ts](../src/rotate.ts:31-120)
```typescript
function rotate(options: RotateOptions): RotationEvent
```
Creates unsigned rotation event updating keys.

#### Interaction
**Location**: [src/interaction.ts](../src/interaction.ts)
```typescript
function interaction(options): InteractionEvent
```
Creates unsigned interaction event for anchoring.

### TEL Events

**Location**: [src/tel.ts](../src/tel.ts)

- `registryIncept()` - Create registry (VCP event)
- `issue()` - Issue credential (ISS event)
- `revoke()` - Revoke credential (REV event)
- `interact()` - TEL interaction (IXN event)

All create unsigned events.

---

## Event Storage (Unsigned)

**Location**: [src/storage/core.ts](../src/storage/core.ts:49-149)

```typescript
async function putEvent(rawCesr: Uint8Array): Promise<PutResult>
```

Current behavior:
1. Parse event metadata (type, SAID, identifiers)
2. Determine KEL/TEL classification
3. Store raw CESR bytes at structured path
4. Store metadata separately
5. Update indexes and HEAD pointers

**No signature verification occurs**.

### Storage Paths
```
['kel', aid, eventSaid]           // KEL events
['tel', registryId, eventSaid]    // TEL events
['meta', eventSaid]                // Event metadata
```

---

## Event Retrieval (Returns Unsigned)

### DSL Methods
**Location**: [src/app/dsl/builders/account.ts](../src/app/dsl/builders/account.ts:177)

```typescript
async getKel(): Promise<KelEvent[]>
```

Returns array of events with metadata:
```typescript
interface KelEvent {
  raw: Uint8Array      // Raw CESR bytes (no signatures)
  meta: EventMeta      // Parsed metadata
}
```

**Location**: [src/app/dsl/builders/registry.ts](../src/app/dsl/builders/registry.ts:117)

```typescript
async getTel(): Promise<TelEvent[]>
```

Returns unsigned TEL events.

### What's Missing
- No signature data in returned events
- No verification on retrieval
- No indexed signatures attached to events

---

## KERI Signature Requirements

### KEL Event Signatures

Per KERI spec, events must include:
1. **Event body** (serialized JSON)
2. **Indexed signatures** - signatures over event body by current keys
3. **Witness receipts** (optional) - signatures by witnesses

Format (CESR):
```
-EVENT_VERSION_STRING{size}_{"event":"data"}
-SIGNATURE_VERSION{count}#AAAA...BBBB...  # Indexed sigs
```

### Signing Threshold
- Events specify threshold `kt` (e.g., "1" = 1-of-N, "2" = 2-of-N)
- Must have sufficient valid signatures to meet threshold
- Signature indices correspond to key list positions

### Key State Verification
- ICP: signatures by inception keys
- ROT: signatures by **pre-rotation** keys (from previous event's `n` field)
- IXN: signatures by current keys

---

## Required Implementation

### 1. Sign Events on Creation
**File**: [src/app/helpers.ts](../src/app/helpers.ts)

Modify `createIdentity()`, `createRegistry()`, etc:

```typescript
// Current (wrong):
const rawCesr = serializeEvent(icp.ked);
await store.putEvent(rawCesr);

// Required:
const eventBytes = serializeEvent(icp.ked);
const signatures = await signEvent(eventBytes, keypairs, threshold);
const signedCesr = attachSignatures(eventBytes, signatures);
await store.putEvent(signedCesr);
```

### 2. Verify Events on Storage
**File**: [src/storage/core.ts](../src/storage/core.ts:49)

Modify `putEvent()`:

```typescript
async function putEvent(rawCesr: Uint8Array): Promise<PutResult> {
  const parsed = parser.parse(rawCesr);

  // NEW: Verify signatures before storage
  const verified = await verifyEventSignatures(parsed);
  if (!verified) {
    throw new Error('Invalid signatures');
  }

  // Store event...
}
```

### 3. Verify Events on Retrieval
**File**: [src/app/dsl/builders/account.ts](../src/app/dsl/builders/account.ts:177)

```typescript
async getKel(): Promise<KelEvent[]> {
  const events = await store.listKel(account.aid);

  // NEW: Verify signature chain
  for (const event of events) {
    if (!await verifyEvent(event)) {
      console.warn(`Invalid signature: ${event.meta.d}`);
    }
  }

  return events;
}
```

### 4. Key State Management
**New file needed**: `src/keystate.ts`

Track current and next keys for verification:

```typescript
interface KeyState {
  aid: string;
  sn: number;
  keys: string[];      // Current keys
  nextDigests: string[]; // Next key commitments
  threshold: number;
}
```

### 5. Signature Verification Algorithm

```typescript
async function verifyEvent(event: ParsedEvent, keyState: KeyState): Promise<boolean> {
  const { eventBytes, signatures } = separateEventAndSigs(event.raw);

  // For ROT: verify with NEXT keys from previous event
  const keys = event.meta.t === 'rot'
    ? await getNextKeys(event.meta.p)  // From prior event's 'n' field
    : keyState.keys;

  // Verify indexed signatures
  let validCount = 0;
  for (const sig of signatures) {
    const key = keys[sig.index];
    if (await verify(eventBytes, sig.signature, key)) {
      validCount++;
    }
  }

  // Check threshold
  return validCount >= keyState.threshold;
}
```

---

## Test Coverage Needed

### Unit Tests
- [ ] Sign event with single key
- [ ] Sign event with multi-sig (2-of-3 threshold)
- [ ] Verify valid signatures
- [ ] Reject invalid signatures
- [ ] Reject insufficient signatures (below threshold)
- [ ] Pre-rotation key verification (ROT events)

### Integration Tests
- [ ] Create signed KEL chain (ICP → IXN → ROT)
- [ ] Verify entire KEL chain
- [ ] Create signed TEL chain (VCP → ISS → REV)
- [ ] Reject tampered events
- [ ] Import and verify external KEL/TEL

### Test Vectors
Existing: [kerits/test-cases/](../test-cases/)
- `test_sign_*.json` - Signing test vectors (5 cases)
- `test_signer_*.json` - Key generation vectors (5 cases)

Need: Event signing vectors from KERIpy
- Signed ICP/ROT/IXN events
- Multi-sig examples
- Pre-rotation examples

---

## References

### KERI Specification
- [KERI Whitepaper](https://github.com/SmithSamuelM/Papers/blob/master/whitepapers/KERI_WP_2.x.web.pdf)
- [CESR Spec](https://weboftrust.github.io/ietf-cesr/draft-ssmith-cesr.html)
- [KERI Python Implementation (KERIpy)](https://github.com/WebOfTrust/keripy)

### Implementation Files
- Signing: [src/sign.ts](../src/sign.ts), [src/cesr/signer.ts](../src/cesr/signer.ts)
- Event creation: [src/incept.ts](../src/incept.ts), [src/rotate.ts](../src/rotate.ts), [src/tel.ts](../src/tel.ts)
- Storage: [src/storage/core.ts](../src/storage/core.ts)
- DSL: [src/app/dsl/builders/](../src/app/dsl/builders/)

---

## Summary

**Current State**: Events are created, stored, and retrieved **without signatures**.

**Required**: Full signature lifecycle:
1. ✅ Cryptographic primitives exist
2. ❌ Not integrated into event creation
3. ❌ Not verified on storage
4. ❌ Not verified on retrieval
5. ❌ No key state tracking
6. ❌ No pre-rotation verification

**Priority**: Implement signature attachment in event creation and verification in storage layer before production use.
