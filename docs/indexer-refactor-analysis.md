# Indexer Refactoring Analysis

## Executive Summary

The proposed indexer refactoring transforms the current **query-time indexer** (which replays TEL chains on-demand) into a **write-time indexer** (which maintains materialized state updated during DSL operations). The new indexer will serve as an independent "checks and balances" system that can verify KERI data integrity.

---

## Current Architecture

### Current Indexer Design

**Location**: [src/app/indexer/tel-indexer.ts](../src/app/indexer/tel-indexer.ts)

**Type**: Query-time indexer (replay on demand)

**Current Behavior**:
- `TELIndexer.indexRegistry()` replays ALL TEL events each time it's called
- No persistent state - reconstructs from raw KERI events
- Used for:
  - Getting credential status (issued/revoked)
  - Building linked credential graphs
  - Extracting counterparty information
  - Generating event history summaries

**Current Usage Points**:

1. **DSL Methods** (10 call sites):
   - `acdcDsl.index()` - [acdc.ts:68](../src/app/dsl/builders/acdc.ts#L68)
   - `acdcDsl.getLatestData()` - [acdc.ts:73](../src/app/dsl/builders/acdc.ts#L73)
   - `acdcDsl.getSchemas()` - [acdc.ts:79](../src/app/dsl/builders/acdc.ts#L79)
   - `acdcDsl.getCounterparties()` - [acdc.ts:85](../src/app/dsl/builders/acdc.ts#L85)
   - `acdcDsl.getHistory()` - [acdc.ts:91](../src/app/dsl/builders/acdc.ts#L91)
   - `acdcDsl.getLinkedFrom()` - [acdc.ts:125](../src/app/dsl/builders/acdc.ts#L125)
   - `registryDsl.index()` - [registry.ts:220](../src/app/dsl/builders/registry.ts#L220)
   - `registryDsl.listCredentials()` - [registry.ts:225](../src/app/dsl/builders/registry.ts#L225)
   - `registryDsl.revoke()` - [registry.ts:242](../src/app/dsl/builders/registry.ts#L242)

2. **UI Components** (indirect via DSL):
   - [RegistryDetailView.tsx](../ui/src/components/explorer/RegistryDetailView.tsx) - Calls `registryDsl.listCredentials()`
   - [ACDCRecord.tsx](../ui/src/components/explorer/ACDCRecord.tsx) - Displays indexed data

3. **Tests**:
   - [test/app/indexer.test.ts](../test/app/indexer.test.ts)
   - [test/app/indexer-integration.test.ts](../test/app/indexer-integration.test.ts)

---

## Proposed Architecture

### New Indexer Design

**Type**: Write-time indexer with integrity checking

**Core Concept**: Maintain a parallel materialized view that is:
1. Updated incrementally as DSL operations occur
2. Stored independently from KERI events
3. Verifiable against raw KERI data for integrity checks

### Proposed Data Structure

```typescript
interface IndexerState {
  // KEL tracking
  kels: {
    [kelSAID: string]: KELEntry[]
  };

  // TEL tracking
  tels: {
    [telSAID: string]: TELEntry[]
  };

  // Bidirectional alias mappings
  aliasById: {
    schemas: { [SAID: string]: string };
    KELs: { [SAID: string]: string };
    TELs: { [SAID: string]: string };
  };

  idsByAlias: {
    schemas: { [alias: string]: SAID };
    KELs: { [alias: string]: SAID };
    TELs: { [alias: string]: SAID };
  };
}

interface KELEntry {
  publicKey: string;        // Public key used to sign
  signature: string;        // Signature of the KERI event
  eventId: SAID;            // SAID of the event
  eventType: EventType;     // icp, rot, ixn
  timestamp: string;        // ISO timestamp
  format: "json" | "cesr";  // Event encoding format
  eventData: string;        // Raw event data (JSON or CESR text)
  sequenceNumber: number;   // Sequence number
  priorEventId?: SAID;      // Link to prior event
}

interface TELEntry {
  publicKey: string;        // Public key used to sign
  signature: string;        // Signature of the KERI event
  eventId: SAID;            // SAID of the event
  eventType: EventType;     // vcp, iss, rev, ixn
  timestamp: string;        // ISO timestamp
  format: "json" | "cesr";  // Event encoding format
  eventData: string;        // Raw event data
  sequenceNumber: number;   // Sequence number
  references: Reference[];  // Links to other KELs/TELs
  acdcSaid?: SAID;          // For iss/rev events
}

interface Reference {
  type: "KEL" | "TEL";
  id: SAID;                 // Target KEL or TEL SAID
  relationshipType?: string; // e.g., "issuer", "registry", "credential"
}
```

---

## Analysis: What Will Be Affected?

### 1. Storage Layer - NO CHANGES REQUIRED ✓

**Current storage** ([storage/core.ts](../src/storage/core.ts)) will remain unchanged:
- Events still stored as CESR bytes
- `store.putEvent()` unchanged
- `store.listKel()` / `store.listTel()` unchanged
- Alias mappings already exist via `putAlias()` / `getAlias()`

**Indexer storage** can be:
- **Option A**: New KV namespace (e.g., `index:*` keys)
- **Option B**: New store method `store.putIndexState()` / `store.getIndexState()`
- **Option C**: Separate IndexedDB/file storage

### 2. DSL Layer - MINIMAL CHANGES REQUIRED

**Write Operations** need indexer updates added:

#### Affected DSL Methods:

| File | Method | Line | Change Required |
|------|--------|------|-----------------|
| [account.ts](../src/app/dsl/builders/account.ts) | `rotateKeys()` | 25-94 | Add KEL indexer update after ROT event |
| [kerits.ts](../src/app/dsl/builders/kerits.ts) | `newAccount()` | 38-94 | Add KEL indexer update after ICP event |
| [registry.ts](../src/app/dsl/builders/registry.ts) | `issue()` | 26-101 | Add TEL indexer update after ISS event |
| [registry.ts](../src/app/dsl/builders/registry.ts) | `revoke()` | 230-263 | Add TEL indexer update after REV event |
| [registry.ts](../src/app/dsl/builders/registry.ts) | `accept()` | 265-357 | Add TEL indexer update after accepting credential |
| [helpers.ts](../src/app/helpers.ts) | `createIdentity()` | 29-86 | Add KEL indexer update after ICP |
| [helpers.ts](../src/app/helpers.ts) | `createRegistry()` | 91-223 | Add TEL indexer update after VCP + IXN |
| [helpers.ts](../src/app/helpers.ts) | `issueCredential()` | 275-390 | Add TEL indexer update after ISS |
| [helpers.ts](../src/app/helpers.ts) | `revokeCredential()` | 395-442 | Add TEL indexer update after REV |

**Read Operations** change from query-time to direct lookup:

| Current Method | New Behavior |
|----------------|--------------|
| `new TELIndexer(store).indexRegistry()` | `indexer.getRegistry(registryId)` |
| `new TELIndexer(store).indexACDC()` | `indexer.getCredential(credentialId)` |
| Replays all events | Direct lookup from index state |

### 3. Indexer API - COMPLETE REWRITE

**Current API** (query-time):
```typescript
class TELIndexer {
  async indexRegistry(registryId: SAID): Promise<IndexedRegistry>
  async indexACDC(credentialId: SAID, registryId: SAID): Promise<IndexedACDC>
}
```

**Proposed API** (write-time):
```typescript
class Indexer {
  // Write operations (called by DSL)
  async addKelEvent(kelSaid: SAID, entry: KELEntry): Promise<void>
  async addTelEvent(telSaid: SAID, entry: TELEntry): Promise<void>
  async setAlias(scope: 'schemas' | 'KELs' | 'TELs', said: SAID, alias: string): Promise<void>

  // Read operations (called by DSL/UI)
  async getKelEvents(kelSaid: SAID): Promise<KELEntry[]>
  async getTelEvents(telSaid: SAID): Promise<TELEntry[]>
  async getRegistry(registryId: SAID): Promise<IndexedRegistry>
  async getCredential(credentialId: SAID): Promise<IndexedACDC>

  // Export full state
  async exportState(): Promise<IndexerState>

  // Integrity checking
  async verifyIntegrity(store: KerStore): Promise<IntegrityReport>
}
```

### 4. UI Components - NO CHANGES REQUIRED ✓

UI components call DSL methods, not the indexer directly. Since DSL method signatures remain the same, the UI is unaffected.

**Example flow remains identical**:
```typescript
// UI calls DSL
const credentials = await registryDsl.listCredentials();

// DSL now queries indexer instead of replaying
// (implementation detail hidden from UI)
```

### 5. Tests - UPDATES REQUIRED

**Existing indexer tests** will need updates:
- [test/app/indexer.test.ts](../test/app/indexer.test.ts) - Rewrite for new API
- [test/app/indexer-integration.test.ts](../test/app/indexer-integration.test.ts) - Update test structure

**New tests needed**:
- Indexer write operations
- Integrity checking between KERI data and index
- Index recovery/rebuild from raw KERI events

---

## Implementation Options

### Option 1: Incremental Write-Time Indexer

**Approach**: Update index state as events are created

**Pros**:
- ✅ Fast reads (no replay needed)
- ✅ Always up-to-date
- ✅ Can serve as integrity check vs raw KERI data
- ✅ Supports efficient queries and graph traversal

**Cons**:
- ❌ Adds complexity to DSL write operations
- ❌ Index corruption if update fails mid-write
- ❌ Initial migration effort

**Storage**: New KV namespace or IndexedDB object store

**Estimated Impact**:
- **Storage Layer**: No changes
- **DSL Layer**: ~9 write methods need updates
- **Indexer**: Complete rewrite (~500 LOC)
- **UI**: No changes
- **Tests**: ~5 test files need updates

### Option 2: Hybrid Approach (Write + Query Time)

**Approach**: Maintain index for common queries, but support full replay for verification

**Pros**:
- ✅ Fast common operations (indexed)
- ✅ Can verify against raw KERI data
- ✅ Graceful degradation if index corrupted

**Cons**:
- ❌ More complex - two code paths
- ❌ More storage space

**Implementation**:
```typescript
class HybridIndexer {
  // Fast path - use index
  async getCredential(credentialId: SAID): Promise<IndexedACDC> {
    const cached = await this.index.getCredential(credentialId);
    if (cached) return cached;
    // Fallback to replay
    return this.replayTel(credentialId);
  }

  // Verification path - replay and compare
  async verify(credentialId: SAID): Promise<boolean> {
    const indexed = await this.index.getCredential(credentialId);
    const replayed = await this.replayTel(credentialId);
    return deepEqual(indexed, replayed);
  }
}
```

### Option 3: Event-Sourced Projections

**Approach**: Treat index as a "projection" that can be rebuilt from events

**Pros**:
- ✅ Index is always derivable from source of truth (KERI events)
- ✅ Can rebuild index if corrupted
- ✅ Clear separation of concerns
- ✅ Supports multiple index "views" for different use cases

**Cons**:
- ❌ Requires rebuild mechanism
- ❌ Cold-start performance (must replay all events once)

**Implementation**:
```typescript
class ProjectionIndexer {
  // Rebuild entire index from KERI events
  async rebuild(store: KerStore): Promise<void> {
    const index = { kels: {}, tels: {}, aliasById: {}, idsByAlias: {} };

    // Replay all KEL events
    for (const alias of await store.listAliases('kel')) {
      const aid = await store.aliasToId('kel', alias);
      const events = await store.listKel(aid);
      for (const event of events) {
        await this.processKelEvent(event, index);
      }
    }

    // Replay all TEL events
    for (const alias of await store.listAliases('tel')) {
      const rid = await store.aliasToId('tel', alias);
      const events = await store.listTel(rid);
      for (const event of events) {
        await this.processTelEvent(event, index);
      }
    }

    await this.saveIndex(index);
  }

  // Incremental update
  async addEvent(event: ParsedEvent, index: IndexerState): Promise<void> {
    if (isKelEvent(event)) {
      await this.processKelEvent(event, index);
    } else {
      await this.processTelEvent(event, index);
    }
  }
}
```

---

## Clarifying Questions

### 1. **Public Key Extraction**

Your spec includes `publicKey` in each entry. Should this be:
- **A)** The signing key from the event's current key set (`k` field)?
- **B)** The identifier (AID) of the signer?
- **C)** Extracted from signature verification?

**Context**: Currently, signatures are indexed, but public keys are derived from the KEL's `k` field at the sequence number when the event was signed.

### 2. **Signature Storage Format**

Should signatures be stored as:
- **A)** CESR-encoded string (e.g., `0BA4L4WoCf...`)?
- **B)** Parsed as separate index/signature pairs?
- **C)** Both (indexed signature + extracted public key)?

**Context**: Current `parseIndexedSignatures()` extracts `{ index: number, signature: string }[]`.

### 3. **Event Data Format**

You specify `format: "json" | "cesr"`. Should we:
- **A)** Store both formats (raw CESR + parsed JSON)?
- **B)** Store only one and convert on-demand?
- **C)** Store minimal metadata + pointer to raw event in storage?

**Context**: Raw CESR is ~400 bytes, parsed JSON is ~300 bytes. Storing both doubles storage.

### 4. **References Field**

For `references: [{ type: "KEL" | "TEL", id: SAID }]`:
- **A)** Should this include ALL referenced entities (issuer AID, registry ID, linked credentials)?
- **B)** Should it be hierarchical (e.g., TEL → Registry → Issuer KEL)?
- **C)** Should references be bidirectional (both forward and backward links)?

**Example**: An ISS event references:
- Registry ID (TEL)
- Issuer AID (KEL)
- Credential SAID (ACDC)

Should all three be in `references`?

### 5. **Integrity Check Scope**

When verifying integrity, should we check:
- **A)** Signature validity (re-verify all signatures)?
- **B)** Structural consistency (index state matches parsed events)?
- **C)** Completeness (all events in storage are indexed)?
- **D)** All of the above?

### 6. **Migration Strategy**

For existing data:
- **A)** Rebuild index from scratch on first run?
- **B)** Lazy migration (index events as they're accessed)?
- **C)** Background migration task?

---

## Recommended Approach

Based on the analysis, I recommend **Option 3: Event-Sourced Projections** with the following implementation plan:

### Phase 1: New Indexer Implementation
1. Create new `Indexer` class with write operations
2. Implement `exportState()` to match your spec
3. Add `rebuild()` for full replay from KERI events
4. Keep current `TELIndexer` temporarily (no breaking changes)

### Phase 2: DSL Integration
1. Update 9 DSL write methods to call new indexer
2. Update DSL read methods to query new indexer
3. Add integrity check utility: `verifyIndexerIntegrity()`

### Phase 3: Migration & Testing
1. Add migration path: rebuild index on startup if needed
2. Update tests to verify both KERI data and index state
3. Add integrity check tests

### Phase 4: Cleanup
1. Remove old `TELIndexer` once migration complete
2. Update documentation

### Benefits of This Approach:
- ✅ No UI changes required
- ✅ Index can be rebuilt if corrupted
- ✅ Clear integrity checking capability
- ✅ Gradual migration path
- ✅ Maintains current DSL API surface

### Timeline Estimate:
- Phase 1: 2-3 days
- Phase 2: 2-3 days
- Phase 3: 1-2 days
- Phase 4: 1 day
- **Total**: ~7-10 days

---

## Next Steps

Please provide answers to the clarifying questions above, then I can:

1. Create detailed type definitions matching your exact requirements
2. Design the storage schema for the new index
3. Create a detailed implementation plan with specific file changes
4. Begin implementation with a minimal prototype

Would you like me to proceed with the recommended approach, or do you prefer one of the other options?
