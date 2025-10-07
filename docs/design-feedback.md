# Design Feedback and Implementation Plan

## Summary

The design in `docs/design.md` is excellent and well-thought-out. The git-inspired approach with SAIDs as content-addressable identifiers is the right model. Here's my analysis and recommendations:

## ✅ Design Strengths

1. **Clear 3-layer architecture**: Core → DSL → Storage
2. **Git-inspired model**: Content-addressable storage via SAIDs
3. **Pluggable storage**: KV abstraction supports multiple backends
4. **Remote sync**: Well-designed with heads/cursors for incremental sync
5. **Namespace scoping**: Prevents alias collisions across different domains

## 🔧 Current Implementation vs Design

### Storage Layer

**Design proposes**:
```
.keri/
  kel/{AID}/{EVENT_SAID}.{type}.cesr
  tel/{REGISTRY_SAID}/{EVENT_SAID}.{type}.cesr
  acdc/{ACDC_SAID}.json
  refs/{namespace}/{alias}
  remotes/{remote}/...
```

**Current implementation uses**:
```
ev/{said}                     → StoredEvent
meta/{said}                   → EventMeta
idx/kel/{aid}/{seq}          → SAID (HEX sequence!)
idx/tel/{ri}/{said}          → timestamp
idx/prev/{prior_said}        → SAID
map/alias2id/{scope}/{alias} → ID
map/id2alias/{scope}/{id}    → alias
```

**Assessment**: ✅ **Keep current implementation**
- The flat KV namespace is better for the abstraction layer
- Not all KV stores support hierarchical paths well
- Can add virtual filesystem layer on top for tools/debugging

**Fix needed**: Hex sequence number parsing (DONE ✅)

### Missing Components

1. **HEAD tracking** ❌ - Not implemented
   - Each KEL/TEL should track latest event SAID
   - Enables fast forward-only updates
   - Add: `head/kel/{aid} → SAID` and `head/tel/{ri} → SAID`

2. **ACDC Storage** ❌ - Referenced but not stored
   - Design: `acdc/{ACDC_SAID}.json`
   - Need: `putACDC(said, data)` and `getACDC(said)`

3. **Tags** ❌ - Not implemented
   - Design mentions tags for pinning versions
   - Could be useful for schema versioning

4. **Remotes** ❌ - No sync infrastructure
   - Not critical for MVP
   - Future: enable multi-party credential exchange

5. **log.index.json equivalent** ⚠️ - Partially exists
   - Current: Stored in metadata
   - Could optimize with separate index

## 🐛 Issues Found by Tests

### 1. Mnemonic Type Issue
```typescript
// Test expects: string (24 words)
// DSL returns: Mnemonic object

Fix: Update newMnemonic() to return string
```

### 2. Schema SAID Missing
```typescript
// Test: expect(schemaDsl.schema.schemaSaid).toBeDefined()
// Issue: Schema object doesn't have schemaSaid field

Fix: Add schemaSaid to Schema type
```

### 3. Schema Parameter Type Mismatch
```typescript
// Test passes: schemaDsl.schema.schemaSaid (string)
// issue() expects: ???

Fix: Clarify IssueParams.schema type
```

## 📋 Implementation Priorities

### Phase 1: Core Fixes (Immediate)
- [x] Fix hex sequence parsing (DONE)
- [x] Fix Uint8Array deserialization in graph (DONE)
- [ ] Fix mnemonic return type
- [ ] Add schemaSaid to Schema type
- [ ] Fix IssueParams.schema type

### Phase 2: Missing Storage Features
- [ ] Implement HEAD tracking
- [ ] Implement ACDC storage (putACDC/getACDC)
- [ ] Add getSchema by SAID (not just alias)

### Phase 3: Recursive TELs
- [ ] Design: How should nested TELs work?
  - Option A: registryDsl.createRegistry() - flat hierarchy
  - Option B: Add parentRegistryId to Registry type
  - Option C: Use special TEL event type for sub-registry creation
- [ ] Implement nested registry creation
- [ ] Add graph edges for registry hierarchy

### Phase 4: Export/Import Enhancement
- [ ] Complete credential export/import flow
- [ ] Test cross-system credential sharing
- [ ] Implement remote sync (future)

## 🎯 Recommended Design Changes

### 1. Recursive TELs Design

**Proposal**: Use interaction events in parent TEL to anchor child registries

```typescript
// In parent registry TEL
const childRegistry = await parentRegistryDsl.createRegistry('sub-credentials');

// This creates:
// 1. VCP event for child registry
// 2. IXN event in parent TEL with seal: { i: childRegistryId, d: vcpSaid }
// 3. Stores child registry metadata with parentRegistryId field
```

**Benefits**:
- Mirrors KEL → TEL relationship
- Natural hierarchy visualization in graphs
- Clear audit trail of registry creation

**Storage**:
```
idx/tel/parent/{childRegistryId} → parentRegistryId
```

### 2. ACDC Storage Enhancement

**Add to storage layer**:
```typescript
// Store ACDC as immutable JSON
async putACDC(said: SAID, acdc: any): Promise<void>;
async getACDC(said: SAID): Promise<any | null>;

// List ACDCs by registry
async listACDCsByRegistry(registryId: SAID): Promise<SAID[]>;
```

**Storage keys**:
```
acdc/{SAID} → JSON data
idx/acdc-by-reg/{registryId}/{SAID} → timestamp
```

### 3. HEAD Tracking

**Add to storage layer**:
```typescript
async setHead(chain: 'kel' | 'tel', id: SAID, head: SAID): Promise<void>;
async getHead(chain: 'kel' | 'tel', id: SAID): Promise<SAID | null>;
```

**Storage keys**:
```
head/kel/{aid} → latest event SAID
head/tel/{registryId} → latest event SAID
```

**Benefits**:
- Fast access to latest state
- Enables efficient sync protocols
- Supports git-like operations (checkout, diff)

## 📝 Next Steps

1. **Fix immediate test failures** (Phase 1)
2. **Run full test suite** to ensure no regressions
3. **Implement HEAD tracking** (most important missing feature)
4. **Design recursive TEL spec** (document before coding)
5. **Implement ACDC storage** (enables full credential lifecycle)
6. **Add comprehensive integration tests** (app.test.ts)

## 🔄 Design Document Updates Needed

### Add to design.md:

1. **Recursive TEL section**:
```markdown
## Nested/Recursive TELs

Registries can create sub-registries for hierarchical credential organization:

.keri/tel/{PARENT_REGISTRY}/
  {IXN_SAID}.ixn.cesr      # Anchors child registry

.keri/tel/{CHILD_REGISTRY}/
  {VCP_SAID}.vcp.cesr      # Child registry inception
  ...

Index: idx/tel/parent/{childRegistryId} → parentRegistryId
```

2. **HEAD tracking section**:
```markdown
## HEAD Files

Each KEL and TEL maintains a HEAD pointer to the latest event:

head/kel/{AID} → latest KEL event SAID
head/tel/{REGISTRY_ID} → latest TEL event SAID

This enables:
- Fast access to current state
- Git-like operations (diff, merge)
- Efficient sync protocols
```

3. **ACDC storage clarification**:
```markdown
## ACDC Storage

ACDCs are stored as immutable JSON objects:

acdc/{ACDC_SAID}.json → Full ACDC data
idx/acdc-by-reg/{REGISTRY_ID}/{ACDC_SAID} → timestamp

This enables:
- Content-addressable credential storage
- Efficient registry-scoped queries
- Deduplication across registries
```

## Conclusion

The design is sound. The current implementation is good but needs:
1. Minor type fixes
2. HEAD tracking
3. ACDC storage
4. Recursive TEL design and implementation

The flat KV storage approach is actually better than the hierarchical design for the storage layer, as it's more flexible across different backends. The design.md hierarchical structure should be viewed as a "logical model" while the implementation uses a flat physical model.
