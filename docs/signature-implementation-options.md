# Signature Implementation Options for Kerits

## Problem Statement

Currently, **all KERI events are stored unsigned**. The codebase generates keypairs from mnemonics but never uses the private keys to sign events. This violates the KERI specification and makes events unverifiable.

### Critical Issues

1. **No private key persistence** - Private keys generated from mnemonics are discarded immediately after deriving public keys
2. **No signature attachment** - Events serialized without indexed signatures
3. **No verification on storage** - Events stored without checking signatures
4. **No verification on retrieval** - Events retrieved without validating signature chain
5. **No key state tracking** - Current/next keys not maintained for verification

---

## Architecture Analysis

### Current Event Flow

```typescript
// In src/app/dsl/builders/kerits.ts:newAccount()
const seed = mnemonicToSeed(mnemonic);
const kp = await generateKeypairFromSeed(seed);  // Has privateKey + verfer

const { aid } = await createIdentity(store, {
  keys: [kp.verfer],  // Only public key stored
  // kp.privateKey is LOST here - never stored!
});

// In src/app/helpers.ts:createIdentity()
const icp = incept({ keys, nextKeys });         // Unsigned event
const rawCesr = serializeEvent(icp.ked);        // No signatures
await store.putEvent(rawCesr);                  // Stored unsigned
```

### Current Data Model

```typescript
interface Account {
  alias: string;
  aid: string;
  verfer: string;     // Public key only
  createdAt: string;
  // ❌ NO privateKey field
  // ❌ NO signer/keypair reference
}
```

---

## Implementation Options

### Option 1: Stateless Signing (Re-derive from Mnemonic)

**Architecture**: Never store private keys. Re-derive from mnemonic when signing.

#### Pros
- ✅ No private key storage (most secure)
- ✅ Minimal data model changes
- ✅ User controls mnemonic externally

#### Cons
- ❌ User must provide mnemonic for every operation
- ❌ Poor UX (constant password/mnemonic prompts)
- ❌ Difficult for automated processes
- ❌ Complex API: every method needs `mnemonic` parameter

#### Changes Required

```typescript
interface AccountDSL {
  // Every operation needs mnemonic
  async createRegistry(alias: string, mnemonic: Mnemonic): Promise<RegistryDSL>;
  async rotateKeys(newMnemonic: Mnemonic, currentMnemonic: Mnemonic): Promise<Account>;
  async issueCredential(data: any, mnemonic: Mnemonic): Promise<ACDC>;
}

// User experience
const mnemonic = dsl.newMnemonic(seed);
const account = await dsl.newAccount('alice', mnemonic);

// Every operation requires re-entry
const registry = await accountDsl.createRegistry('docs', mnemonic);  // ❌ Annoying
const cred = await registryDsl.issue(data, schema, mnemonic);        // ❌ Annoying
await accountDsl.rotateKeys(newMnemonic, mnemonic);                  // ❌ Very annoying
```

#### Verdict
**❌ NOT RECOMMENDED** - Poor UX makes this impractical for any real application.

---

### Option 2: In-Memory Keypair Cache (Session-based)

**Architecture**: Store keypairs in memory during session. User provides mnemonic once, keys cached until process ends.

#### Pros
- ✅ Good UX - unlock once per session
- ✅ Reasonable security - keys never touch disk
- ✅ Clean API - no mnemonic on every call
- ✅ Works for web/mobile apps

#### Cons
- ❌ Keys lost on restart/crash
- ❌ Not suitable for long-running services
- ❌ Complex for multi-account scenarios
- ❌ Needs session management

#### Changes Required

```typescript
// New KeyManager service
class KeyManager {
  private signers = new Map<string, Signer>();  // aid -> Signer

  async unlock(aid: string, mnemonic: Mnemonic): Promise<void> {
    const seed = mnemonicToSeed(mnemonic);
    const signer = new Signer({ raw: seed, code: MatterCodex.Ed25519_Seed });
    this.signers.set(aid, signer);
  }

  getSigner(aid: string): Signer | null {
    return this.signers.get(aid) || null;
  }

  lock(aid: string): void {
    this.signers.delete(aid);
  }
}

// Updated DSL
const keyManager = new KeyManager();
await keyManager.unlock(account.aid, mnemonic);  // Once per session

const registry = await accountDsl.createRegistry('docs');  // ✅ No mnemonic
const cred = await registryDsl.issue(data, schema);        // ✅ No mnemonic
```

#### Storage Integration

```typescript
// In helpers.ts:createIdentity()
const icp = incept({ keys, nextKeys });

// NEW: Sign the event
const signer = keyManager.getSigner(aid);
if (!signer) throw new Error('Account not unlocked');

const eventBytes = serializeEvent(icp.ked);
const signature = signer.sign(eventBytes);
const signedCesr = attachSignature(eventBytes, signature, 0);  // index 0

await store.putEvent(signedCesr);  // Stored WITH signature
```

#### Verdict
**✅ GOOD FOR APPLICATIONS** - Best balance for interactive apps. CLI/mobile/web can unlock once.

---

### Option 3: Encrypted Private Key Storage

**Architecture**: Store encrypted private keys in database, decrypt with passphrase when needed.

#### Pros
- ✅ Survives process restarts
- ✅ Good for long-running services
- ✅ User unlocks with passphrase (not full mnemonic)
- ✅ Can support multi-device sync

#### Cons
- ❌ Private keys on disk (even if encrypted)
- ❌ Key derivation function overhead
- ❌ Passphrase management complexity
- ❌ More attack surface

#### Changes Required

```typescript
interface Account {
  alias: string;
  aid: string;
  verfer: string;
  createdAt: string;
  encryptedSeed: string;      // NEW: XChaCha20-Poly1305 encrypted seed
  salt: string;               // NEW: Argon2 salt for KDF
}

// Key storage module
class SecureKeyStore {
  async storeKey(aid: string, seed: Uint8Array, passphrase: string): Promise<void> {
    const salt = randomBytes(32);
    const key = await argon2(passphrase, salt);  // KDF
    const encrypted = await encrypt(seed, key);
    // Store encrypted + salt in DB
  }

  async retrieveKey(aid: string, passphrase: string): Promise<Uint8Array> {
    const { encrypted, salt } = await db.getEncryptedSeed(aid);
    const key = await argon2(passphrase, salt);
    return decrypt(encrypted, key);
  }
}

// Usage
const account = await dsl.newAccount('alice', mnemonic, passphrase);
// Later...
await keyManager.unlock(account.aid, passphrase);  // Decrypt from storage
const registry = await accountDsl.createRegistry('docs');
```

#### Verdict
**⚠️ COMPLEX BUT POWERFUL** - Good for server-side applications, but adds significant complexity.

---

### Option 4: Hybrid (Recommended)

**Architecture**: Combine Option 2 + Option 3. In-memory by default, optional encrypted persistence.

#### Approach

```typescript
interface KeyManagerOptions {
  persistence?: 'none' | 'encrypted';
}

class KeyManager {
  private signers = new Map<string, Signer>();
  private persistenceMode: 'none' | 'encrypted';
  private secureStore?: SecureKeyStore;

  constructor(opts: KeyManagerOptions = {}) {
    this.persistenceMode = opts.persistence || 'none';
    if (this.persistenceMode === 'encrypted') {
      this.secureStore = new SecureKeyStore();
    }
  }

  async unlock(aid: string, secret: string | Mnemonic): Promise<void> {
    let seed: Uint8Array;

    if (this.persistenceMode === 'encrypted') {
      // secret is passphrase, load from encrypted storage
      seed = await this.secureStore!.retrieveKey(aid, secret as string);
    } else {
      // secret is mnemonic, derive directly
      seed = mnemonicToSeed(secret as Mnemonic);
    }

    const signer = new Signer({ raw: seed });
    this.signers.set(aid, signer);
  }
}

// Usage - ephemeral mode (web apps)
const keyManager = new KeyManager({ persistence: 'none' });
await keyManager.unlock(aid, mnemonic);

// Usage - persistent mode (servers)
const keyManager = new KeyManager({ persistence: 'encrypted' });
await keyManager.unlock(aid, passphrase);
```

#### Pros
- ✅ Flexible - app chooses security model
- ✅ Default secure (in-memory only)
- ✅ Opt-in persistence for servers
- ✅ Clean migration path

#### Cons
- ❌ More code to maintain
- ❌ Two codepaths to test

#### Verdict
**✅ RECOMMENDED** - Provides flexibility while defaulting to secure ephemeral mode.

---

## Signature Implementation Details

### CESR Signature Format

Per KERI spec, signed events use CESR "attached signatures":

```
-KERI10JSON00011c_{"v":"KERI10JSON00011c_",...}
-AAD{indexed_sig_count}{index}{signature}{index}{signature}...
```

Example:
```
-KERI10JSON00011c_{"v":"KERI10JSON00011c_","t":"icp",...}
-AADAA0BAwGRhMx-pblAIbMNDc3Xy_vn0-FtRi3NTMnhALNPu5Dp4Wjy-cTWZx...
     │ │└─ Signature (88 chars base64url)
     │ └─ Index 0 (controller key #0)
     └─ Count: 1 signature
```

### Signing Function

```typescript
// src/app/signing.ts (NEW FILE)
import { Signer } from '../cesr/signer';

export interface SignedEvent {
  event: Uint8Array;      // Serialized event
  signatures: Uint8Array; // CESR indexed signatures
  combined: Uint8Array;   // event + signatures (CESR stream)
}

export async function signEvent(
  eventBytes: Uint8Array,
  signers: Signer[],
  indices?: number[]
): Promise<SignedEvent> {
  // Default: sign with all signers sequentially
  if (!indices) indices = signers.map((_, i) => i);

  const signatures: { index: number; sig: Cigar }[] = [];

  for (let i = 0; i < signers.length; i++) {
    const sig = signers[i].sign(eventBytes);
    signatures.push({ index: indices[i], sig });
  }

  // Build CESR indexed signature section
  const sigCount = signatures.length;
  const sigSection = buildIndexedSignatures(signatures, sigCount);

  // Combine: event || signatures
  const combined = new Uint8Array(eventBytes.length + sigSection.length);
  combined.set(eventBytes, 0);
  combined.set(sigSection, eventBytes.length);

  return { event: eventBytes, signatures: sigSection, combined };
}

function buildIndexedSignatures(
  sigs: Array<{ index: number; sig: Cigar }>,
  count: number
): Uint8Array {
  // Format: -AAD{count in hex}{index}{sig}{index}{sig}...
  const countHex = count.toString(16).toUpperCase().padStart(2, '0');
  let result = `-AAD${countHex}`;

  for (const { index, sig } of sigs) {
    const idxChar = String.fromCharCode(65 + index); // 'A' = 0, 'B' = 1, etc
    result += idxChar + sig.qb64;
  }

  return new TextEncoder().encode(result);
}
```

### Verification Function

```typescript
// src/app/verification.ts (NEW FILE)
export interface VerificationResult {
  valid: boolean;
  verifiedCount: number;
  requiredCount: number;
  errors: string[];
}

export async function verifyEvent(
  signedCesr: Uint8Array,
  expectedKeys: string[],
  threshold: number
): Promise<VerificationResult> {
  // Parse CESR stream
  const { event, signatures } = parseCesrStream(signedCesr);
  const eventBytes = event;

  // Parse indexed signatures
  const indexedSigs = parseIndexedSignatures(signatures);

  // Verify each signature
  const results = await Promise.all(
    indexedSigs.map(async ({ index, signature }) => {
      if (index >= expectedKeys.length) {
        return { valid: false, error: `Invalid key index: ${index}` };
      }

      const key = expectedKeys[index];
      const verfer = new Verfer({ qb64: key });
      const valid = verfer.verify(signature.raw, eventBytes);

      return { valid, error: valid ? null : 'Signature verification failed' };
    })
  );

  const validCount = results.filter(r => r.valid).length;
  const errors = results.filter(r => !r.valid).map(r => r.error!);

  return {
    valid: validCount >= threshold,
    verifiedCount: validCount,
    requiredCount: threshold,
    errors,
  };
}
```

### Key State Tracker

```typescript
// src/app/keystate.ts (NEW FILE)
export interface KeyState {
  aid: string;
  sn: number;
  currentKeys: string[];
  nextDigests: string[];
  currentThreshold: number;
  nextThreshold: number;
}

export class KeyStateManager {
  private store: KerStore;
  private cache = new Map<string, KeyState>();

  async getKeyState(aid: string): Promise<KeyState> {
    if (this.cache.has(aid)) {
      return this.cache.get(aid)!;
    }

    // Replay KEL to build key state
    const kelEvents = await this.store.listKel(aid);
    let state: KeyState = {
      aid,
      sn: 0,
      currentKeys: [],
      nextDigests: [],
      currentThreshold: 1,
      nextThreshold: 1,
    };

    for (const event of kelEvents) {
      state = this.applyEvent(state, event);
    }

    this.cache.set(aid, state);
    return state;
  }

  private applyEvent(state: KeyState, event: any): KeyState {
    const meta = event.meta;

    switch (meta.t) {
      case 'icp':
        return {
          ...state,
          sn: 0,
          currentKeys: meta.keys || [],
          nextDigests: meta.nextDigests || [],
          currentThreshold: meta.threshold || 1,
          nextThreshold: meta.nextThreshold || 1,
        };

      case 'rot':
        // For rotation: currentKeys come from previous nextDigests
        // nextDigests come from this event
        return {
          ...state,
          sn: meta.s,
          currentKeys: meta.keys || [],
          nextDigests: meta.nextDigests || [],
          currentThreshold: meta.threshold || 1,
          nextThreshold: meta.nextThreshold || 1,
        };

      case 'ixn':
        return { ...state, sn: meta.s };

      default:
        return state;
    }
  }
}
```

---

## Integration Plan

### Phase 1: Core Infrastructure (Week 1)
1. ✅ Implement `KeyManager` (Option 4 - Hybrid)
2. ✅ Implement signing functions in `src/app/signing.ts`
3. ✅ Implement verification in `src/app/verification.ts`
4. ✅ Implement `KeyStateManager` for key state tracking
5. ✅ Add unit tests for signing/verification

### Phase 2: Event Creation (Week 2)
1. ✅ Update `src/app/helpers.ts`:
   - `createIdentity()` - sign ICP events
   - `createRegistry()` - sign VCP + IXN events
2. ✅ Update `src/app/dsl/builders/account.ts`:
   - `rotateKeys()` - sign ROT events
3. ✅ Update `src/app/dsl/builders/registry.ts`:
   - `issue()` - sign ISS events
   - `revoke()` - sign REV events
4. ✅ Add integration tests for signed event creation

### Phase 3: Storage Layer (Week 3)
1. ✅ Update `src/storage/core.ts`:
   - `putEvent()` - verify signatures before storage
   - `getEvent()` - return with signature info
2. ✅ Add verification on retrieval:
   - `listKel()` - verify KEL chain
   - `listTel()` - verify TEL chain
3. ✅ Add storage tests with signed events

### Phase 4: DSL API Updates (Week 4)
1. ✅ Add unlock/lock methods to DSL:
   ```typescript
   interface KeritsDSL {
     unlock(alias: string, secret: Mnemonic | string): Promise<void>;
     lock(alias: string): Promise<void>;
     isUnlocked(alias: string): boolean;
   }
   ```
2. ✅ Update all DSL methods to use KeyManager
3. ✅ Add user-facing tests with unlock flow

### Phase 5: Documentation & Migration (Week 5)
1. ✅ Update API documentation
2. ✅ Add migration guide for existing unsigned data
3. ✅ Add security best practices guide
4. ✅ Update examples in README

---

## Recommended Approach: Option 4 (Hybrid)

**Start with in-memory only (Option 2), add encrypted persistence later.**

### Phase 1 MVP - In-Memory Only

```typescript
// New API
const dsl = createKeritsDSL(store);

// Create account
const mnemonic = dsl.newMnemonic(randomSeed());
const account = await dsl.newAccount('alice', mnemonic);

// Unlock for session (stores keys in memory)
await dsl.unlock('alice', mnemonic);

// Now all operations are signed automatically
const accountDsl = await dsl.account('alice');
const registry = await accountDsl!.createRegistry('docs');  // Signed!
const cred = await registry.issue(data, schema);            // Signed!

// Lock when done (clear keys from memory)
await dsl.lock('alice');
```

### Migration to Encrypted Storage (Later)

```typescript
// Enable encrypted persistence
const dsl = createKeritsDSL(store, {
  keyManager: { persistence: 'encrypted' }
});

// Set passphrase on account creation
const account = await dsl.newAccount('alice', mnemonic, { passphrase: 'secret123' });

// Unlock with passphrase (keys loaded from encrypted storage)
await dsl.unlock('alice', 'secret123');
```

---

## Security Considerations

### In-Memory Mode
- ✅ Keys never touch disk
- ✅ Auto-cleared on process exit
- ❌ Lost on crash/restart
- ✅ Good for: Web apps, CLI tools, mobile apps

### Encrypted Persistence Mode
- ⚠️ Keys stored encrypted on disk
- ✅ Survives restarts
- ✅ Argon2id for KDF (memory-hard)
- ✅ XChaCha20-Poly1305 for encryption
- ⚠️ Good for: Server applications with proper key management

### Best Practices
1. **Never log private keys or mnemonics**
2. **Use secure random for key generation**
3. **Zeroize memory after key use** (when possible in JS)
4. **Rate-limit unlock attempts**
5. **Use passphrase strength requirements** (encrypted mode)

---

## Testing Strategy

### Unit Tests
- Sign/verify with single key
- Sign/verify with multi-sig (2-of-3)
- Reject tampered events
- Reject wrong signatures
- Reject insufficient signatures
- Pre-rotation key verification

### Integration Tests
- Complete KEL chain (ICP → IXN → ROT)
- Complete TEL chain (VCP → ISS → REV)
- Cross-entity verification (import external KEL)
- Session management (unlock/lock)

### Test Vectors
Use KERIpy test vectors from `/testgen`:
- `test_sign_*.json` - Signing vectors
- `test_incept_*.json` - ICP event vectors
- `test_rotate_*.json` - ROT event vectors

---

## Open Questions

1. **Multi-sig support**: How do we handle N-of-M thresholds where M > 1?
   - Need coordination protocol for collecting signatures
   - Probably deferred to Phase 2

2. **Witness signatures**: Do we support witnesses in MVP?
   - Probably no - add in Phase 2
   - Store only controller signatures initially

3. **Delegation**: How do we handle delegated identifiers?
   - Deferred to Phase 3
   - Requires parent AID verification

4. **Recovery**: What happens if user loses mnemonic but has passphrase?
   - Encrypted mode: can recover if passphrase known
   - In-memory mode: must have mnemonic

5. **Web browser security**: How do we protect keys in browser environment?
   - Use Web Crypto API for key derivation
   - Consider WebAuthn for passphrase protection
   - Sandbox in Worker if possible

---

## Summary & Recommendation

**Recommended Path**: Implement **Option 4 (Hybrid)** starting with **in-memory only**.

### Week 1-2 Milestone: Basic Signing
- ✅ KeyManager (in-memory)
- ✅ Sign ICP/ROT/IXN events
- ✅ Verify on storage
- ✅ unlock()/lock() API

### Week 3-4 Milestone: Full KEL/TEL
- ✅ Sign all TEL events (VCP/ISS/REV)
- ✅ Verify entire chains
- ✅ Key state tracking
- ✅ Pre-rotation verification

### Week 5+ Milestone: Production Ready
- ✅ Encrypted persistence (optional)
- ✅ Multi-sig coordination (optional)
- ✅ Witness receipts (optional)
- ✅ Full test coverage
- ✅ Migration tooling

**This approach provides a secure foundation while allowing incremental feature addition.**
