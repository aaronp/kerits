# Contacts API - KERI Implementation Plan

## Goal
Implement the Contacts API (social network) using KERI primitives (KEL, TEL, ACDC) while maintaining the existing pure API interface.

## Current State
- ✅ **Contacts API** - Pure, in-memory implementation with comprehensive tests (33 tests passing)
- ✅ **CESR module** - Keypair generation, encoding/decoding using cesr-ts
- ❌ **KEL operations** - Need to create/manage key event logs
- ❌ **TEL operations** - Need to create/manage transaction event logs
- ❌ **Data/SAID operations** - Need to saidify data and manage schemas
- ❌ **ACDC operations** - Need to create credentials for facts

## Mapping: Contacts API → KERI Primitives

### 1. Contact = AID from KEL
- Each contact needs a KEL (Key Event Log)
- AID is derived from the inception event
- Contact name is metadata, not in KEL itself

### 2. Group = TEL with membership state
- Group ID = TEL inception SAID
- Members array = current TEL state (head)
- Updates = append new events to TEL

### 3. Fact = ACDC on a TEL
- Each FactChain = dedicated TEL
- Facts are ACDCs appended to that TEL
- Schema is referenced by SAID

### 4. Schema = SAIDified JSON Schema
- Use Data operations to create SAID
- Store schema by its SAID

## MVP Implementation Phases

### Phase 1: Data & SAID Operations ✅ CURRENT
**Goal**: Generate SAIDs for schemas and data

**API Surface**:
```typescript
// src/model/data/data.ts
export class Data {
  static fromJson(obj: any): Data;

  // Add SAID field to data
  saidify(fieldName?: string): { said: SAID; data: any };

  // Generate JSON Schema from data
  generateSchema(title: string, description?: string): Schema;

  // Validate data against schema
  static validate(data: any, schema: Schema): ValidationError[];
}
```

**Files to create**:
- `src/model/data/data.ts` - Data operations
- `src/model/data/data.test.ts` - TDD tests

**Why first?**: Simplest, no dependencies. Everything else needs SAID generation.

---

### Phase 2: Core KEL Operations
**Goal**: Create and manage KELs for contacts

**API Surface**:
```typescript
// src/model/kel/kel-ops.ts
export class KEL {
  // MVP: Single-owner inception only (no multisig)
  static inception(params: {
    keys: CESRKeypair;
    transferable: boolean;
  }): { aid: AID; event: InceptionEvent };

  // Get current keys from event log
  static getCurrentKeys(events: KelEvent[]): string[];

  // Serialize to CESR for storage
  static toCESR(events: KelEvent[]): Uint8Array;
  static fromCESR(cesr: Uint8Array): KelEvent[];
}
```

**Files to create**:
- `src/model/kel/types.ts` - KelEvent, InceptionEvent types
- `src/model/kel/kel-ops.ts` - KEL inception & operations
- `src/model/kel/kel-ops.test.ts` - TDD tests

**MVP Scope**:
- Single-owner only (no multisig)
- Inception only (no rotation yet)
- Basic serialization

---

### Phase 3: Core TEL Operations
**Goal**: Create and append to TELs for groups and fact chains

**API Surface**:
```typescript
// src/model/tel/tel-ops.ts
export class TEL {
  // MVP: Simple state TEL (no registry complexity)
  static inception(params: {
    issuerAID: AID;
    initialState: any;
  }): { telId: SAID; event: TelInceptionEvent };

  // Append new state
  static append(params: {
    telId: SAID;
    events: TelEvent[];
    newState: any;
  }): TelEvent;

  // Get current head state
  static getHeadState(events: TelEvent[]): any;

  // Serialize
  static toCESR(events: TelEvent[]): Uint8Array;
  static fromCESR(cesr: Uint8Array): TelEvent[];
}
```

**Files to create**:
- `src/model/tel/types.ts` - TelEvent types
- `src/model/tel/tel-ops.ts` - TEL inception & append
- `src/model/tel/tel-ops.test.ts` - TDD tests

**MVP Scope**:
- Simple state updates (no complex registry logic)
- Append-only semantics
- Head state calculation

---

### Phase 4: ACDC Operations
**Goal**: Create ACDCs for facts

**API Surface**:
```typescript
// src/model/acdc/acdc-ops.ts
export class ACDC {
  // MVP: Simple credential creation
  static create(params: {
    issuerAID: AID;
    schemaId: SAID;
    data: any;
  }): { said: SAID; acdc: AcdcCredential };

  // Validate ACDC structure
  static validate(acdc: AcdcCredential): ValidationError[];
}
```

**Files to create**:
- `src/model/acdc/types.ts` - ACDC types
- `src/model/acdc/acdc-ops.ts` - ACDC creation
- `src/model/acdc/acdc-ops.test.ts` - TDD tests

**MVP Scope**:
- Basic credential creation
- Simple validation
- No chaining/proofs yet

---

### Phase 5: KERI-Backed Contacts Implementation
**Goal**: Implement Contacts API backed by KERI primitives

**API Surface**:
```typescript
// src/model/apps/contacts/keri-backend.ts
export function createKeriBackedSocialNetwork(storage: Storage): SocialNetworkApi {
  // Use KEL for contacts (each contact = KEL)
  // Use TEL for groups (state = members array)
  // Use TEL for fact chains (events = ACDCs)
  // Use Data for schemas
}

// src/io/storage.ts
export interface Storage {
  get(key: string): Promise<Uint8Array | undefined>;
  set(key: string, value: Uint8Array): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}
```

**Files to create**:
- `src/model/apps/contacts/keri-backend.ts` - KERI-backed implementation
- `src/model/apps/contacts/keri-backend.test.ts` - Integration tests
- `src/io/storage.ts` - Simple KV storage interface + in-memory impl

**Implementation Strategy**:
1. **Contacts.add()** → Create KEL, store by AID
2. **Contacts.get()** → Load KEL events, derive AID
3. **Groups.save()** → Create/update TEL with members state
4. **FactChain.addFact()** → Append ACDC to TEL
5. **Schemas.add()** → Saidify and store schema

---

## TDD Development Order

### ✅ Phase 1: Data Operations (CURRENT)
1. Write tests for `Data.fromJson().saidify()`
2. Implement SAID generation (using blake3 hash)
3. Write tests for schema generation
4. Implement basic validation

### Phase 2: KEL Operations
1. Write tests for inception with generated keys
2. Implement using cesr-ts Signer/Verfer
3. Write tests for AID derivation
4. Focus on single-owner only

### Phase 3: TEL Operations
1. Write tests for TEL inception
2. Write tests for append + head state
3. Implement simple state updates
4. No complex registry logic yet

### Phase 4: ACDC Operations
1. Write tests for credential creation
2. Implement credential structure
3. Write tests for validation

### Phase 5: Integration
1. Implement Storage interface (in-memory)
2. Implement KERI-backed Contacts.add/get
3. Implement KERI-backed Groups.save
4. Implement KERI-backed FactChain operations
5. Run existing Contacts API tests against KERI backend

---

## Out of Scope for MVP

- ❌ Key rotation (KEL rotation events)
- ❌ Multisig / delegation
- ❌ Witnesses / receipts
- ❌ Registry complexity (simple TEL only)
- ❌ ACDC chaining / proofs
- ❌ Escrow / OOBI resolution
- ❌ Network protocol (just local storage)

---

## Success Criteria

✅ All existing Contacts API tests pass with KERI backend
✅ Data persists and can be reloaded from storage
✅ SAIDs are stable and deterministic
✅ TELs correctly maintain append-only semantics
✅ Type checking passes throughout

---

## Next Steps

**CURRENT**: Phase 1 - Data Operations
- [ ] Create `src/model/data/data.test.ts` with TDD tests
- [ ] Implement `src/model/data/data.ts`
- [ ] Verify tests pass and types check
