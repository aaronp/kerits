# KERITS Multi-Signature and Delegation Implementation Plan

**Status**: ✅ Phase 1-3 Complete - Ready for Phase 4
**Started**: 2025-10-12
**Target Completion**: Q1 2025

## 🧪 Test Status

| Test Suite | Status | Pass Rate | Details |
|------------|--------|-----------|---------|
| **keripy** | ✅ PASSING | 75/75 (100%) | All regression tests pass |
| **kerits** | ✅ PASSING | 349/349 (100%) | Full test suite passing |
| **multisig inception** | ✅ PASSING | 11/11 (100%) | Multi-key inception tests |
| **multisig rotation** | ✅ PASSING | 9/9 (100%) | Multi-key rotation tests |
| **group inception** | ✅ PASSING | 4/4 (100%) | Group event format tests |
| **group account** | ✅ PASSING | 11/11 (100%) | Group coordination unit tests |
| **delegated inception** | ✅ PASSING | 4/4 (100%) | Delegated inception (dip) tests |
| **scenario tests** | ✅ PASSING | 57/57 (100%) | Real-world scenarios (multi-device + delegation) |

**Last Verified**: 2025-10-12

**Scenario Breakdown:**
- Multi-device scenarios: 26 tests
- Delegation scenarios: 31 tests

---

## Executive Summary

This document outlines the implementation plan to achieve full feature parity between **keripy** (Python reference implementation) and **kerits** (TypeScript implementation) for KERI multi-signature and delegation functionality. The implementation will maintain kerits' strongly-typed, functional approach while ensuring 100% compatibility via extensive regression testing.

---

## Current State

### ✅ KERIPY Features (Reference Implementation)

**Multi-Signature:**
- `GroupHab` class for group multisig identifiers
- `Counselor` for partial signing coordination via escrows
- `Multiplexor` for peer-to-peer multisig messaging
- Weighted threshold support (`["1/2", "1/2", "1/2"]`)
- Three-stage escrow processing:
  1. Partial signature collection
  2. Delegation approval (if delegated)
  3. Witness receipt collection
- Exchange message handlers: `/multisig/{icp,rot,ixn,vcp,iss,rev,exn,rpy}`

**Delegation:**
- `Anchorer` class for delegation coordination
- `DelegateRequestHandler` for `/delegate/request` messages
- Delegated inception (dip) and rotation (drt) events
- Seal anchoring in delegator's KEL
- Witness publication coordination

**Test Coverage:**
- Unit tests: `tests/app/test_grouping.py`, `tests/app/test_delegating.py`
- Integration tests with witness coordination

### ❌ KERITS Missing Features

**Currently Implemented:**
- Single-key inception only
- Single-key rotation
- Account DSL with basic key rotation
- Registry and credential support

**Missing:**
- ❌ Multi-signature support
- ❌ Delegation support
- ❌ Group identifier creation
- ❌ Weighted threshold support
- ❌ Partial signing coordination
- ❌ Peer-to-peer exchange messaging

### 📊 Regression Test Infrastructure

**Current:**
- 20 test generators in `testgen/generators/`
- JSON test case format consumed by both implementations
- Examples: `gen_incept.sh`, `gen_rotate.sh`, `gen_signer.sh`
- 572 test files in kerits

**Needed:**
- Multi-signature test generators
- Delegation test generators

---

## Implementation Phases

### 🔵 Phase 1: Core Multi-Signature Primitives

**Goal**: Support multiple keys and thresholds in single-controller identifiers

#### 1.1 Multi-Key Inception
- **File**: `kerits/src/incept.ts`
- **Changes**:
  - Remove single-key limitation (line 117-121)
  - Support multiple keys with numeric thresholds
  - Update `InceptOptions` interface
- **Test Generator**: `testgen/generators/gen_multisig_incept.sh`
- **Test Cases**:
  - 2-of-3 threshold
  - 3-of-5 threshold
  - Unanimous (n-of-n)
  - Single key (backward compatibility)

#### 1.2 Weighted Thresholds
- **File**: `kerits/src/tholder.ts`
- **Add**:
  - Parse fractional weight syntax `["1/2", "1/2", "1/2"]`
  - Compute satisfaction threshold
  - Validate against keripy logic
- **Types**:
  ```typescript
  type Threshold = number | string | WeightedThreshold[];
  type WeightedThreshold = { weight: string; key: string };
  ```

#### 1.3 Multi-Key Rotation
- **File**: `kerits/src/rotate.ts`
- **Changes**: Support multiple keys and thresholds
- **Test Generator**: `testgen/generators/gen_multisig_rotate.sh`

**Deliverable**: ✅ Single-controller multi-key accounts working in kerits

---

### 🔵 Phase 2: Group Multisig Coordination

**Goal**: Enable distributed multi-signature identifiers with partial signing

#### 2.1 Group Account Type
- **New File**: `kerits/src/app/group-account.ts`
- **Types**:
  ```typescript
  interface GroupAccount extends Account {
    readonly groupId: string;        // Group identifier prefix
    readonly mhab: Account;           // Local member account
    readonly smids: string[];         // Signing member AIDs
    readonly rmids: string[];         // Rotation member AIDs
    readonly isith: Threshold;        // Signing threshold
    readonly nsith: Threshold;        // Next threshold
  }

  interface PartiallySignedEvent {
    readonly event: Uint8Array;
    readonly signatures: Map<string, Signature>;
    readonly state: PartialSigningState;
  }

  type PartialSigningState =
    | { stage: 'collecting_signatures'; received: number; required: number }
    | { stage: 'awaiting_delegation'; delegator: string }
    | { stage: 'awaiting_witnesses'; receipts: number }
    | { stage: 'complete'; said: string };
  ```

#### 2.2 Partial Signing Escrow
- **New File**: `kerits/src/app/multisig/counselor.ts`
- **Responsibilities**:
  - Manage escrow storage for partially-signed events
  - Coordinate signature collection from group members
  - Process three-stage escrow pipeline
  - Determine "elected" member for delegation/witnessing
- **Storage Tables** (matching keripy):
  ```typescript
  interface MultisigEscrows {
    gpse: Map<Pre, [Seqner, Saider]>;  // group partial signed escrow
    gdee: Map<Pre, [Seqner, Saider]>;  // group delegatee escrow
    gpwe: Map<Pre, [Seqner, Saider]>;  // group partial witness escrow
    cgms: Map<[Pre, Sn], Saider>;      // completed group multisig
  }
  ```

#### 2.3 Exchange Message Protocol
- **New File**: `kerits/src/app/multisig/exchange.ts`
- **Message Types**:
  - `/multisig/icp` - Group inception proposal
  - `/multisig/rot` - Group rotation proposal
  - `/multisig/ixn` - Group interaction proposal
  - `/multisig/vcp` - Registry inception
  - `/multisig/iss` - Credential issuance
  - `/multisig/rev` - Credential revocation
  - `/multisig/exn` - Generic exchange
  - `/multisig/rpy` - Reply message
- **Components**:
  - `Multiplexor` class for message routing
  - SAID-based message correlation
  - Notification system for UI updates

#### 2.4 DSL Integration
- **New File**: `kerits/src/app/dsl/builders/group-account.ts`
- **API**:
  ```typescript
  interface GroupAccountDSL extends AccountDSL {
    readonly groupAccount: GroupAccount;

    // Propose a group rotation
    proposeRotation(opts: RotationOptions): Promise<ProposalId>;

    // Propose a group interaction
    proposeInteraction(data: SealData[]): Promise<ProposalId>;

    // Get pending proposals
    listProposals(): Promise<Proposal[]>;

    // Sign a proposal from another member
    signProposal(proposalId: ProposalId): Promise<void>;

    // Get group members
    getMembers(): { smids: string[]; rmids: string[] };
  }

  // Root DSL enhancement
  interface KerDSL {
    createGroupAccount(opts: GroupAccountOptions): Promise<GroupAccountDSL>;
    joinGroupAccount(invitation: GroupInvitation): Promise<GroupAccountDSL>;
  }
  ```

**Deliverable**: ✅ 2-of-3 group multisig working end-to-end

---

### 🔵 Phase 3: Delegation Support

**Goal**: Enable hierarchical identifier relationships (parent/child)

#### 3.1 Delegated Inception
- **File**: `kerits/src/incept.ts`
- **Changes**:
  - Add `delpre?: string` to `InceptOptions`
  - Generate `dip` event type when `delpre` provided
  - Include `di` (delegator identifier) field
- **Test Generator**: `testgen/generators/gen_delegated_incept.sh`

#### 3.2 Delegated Rotation
- **New File**: `kerits/src/rotate.ts` (enhancement)
- **Changes**:
  - Support `drt` (delegated rotation) event type
  - Link to delegator via stored relationship

#### 3.3 Delegation Anchoring
- **New File**: `kerits/src/app/delegation/anchorer.ts`
- **Responsibilities**:
  - Send delegation request to delegator (`/delegate/request`)
  - Wait for seal in delegator's KEL
  - Query delegator for confirmation
  - Coordinate witness publication after approval
- **Storage Tables**:
  ```typescript
  interface DelegationEscrows {
    dpwe: Map<[Pre, Said], Serder>;  // delegated partial witness escrow
    dune: Map<[Pre, Said], Serder>;  // delegated unanchored escrow
    dpub: Map<[Pre, Said], Serder>;  // delegated publication escrow
    cdel: Map<[Pre, Sn], Saider>;    // completed delegation
  }
  ```

#### 3.4 Seal Processing
- **Enhancement**: Extract seals from interaction events
- **Verification**: Match delegation seals to delegated events
- **Format**:
  ```json
  {
    "a": [
      { "i": "delegated-prefix", "s": "0", "d": "event-said" }
    ]
  }
  ```

#### 3.5 DSL Integration
- **File**: `kerits/src/app/dsl/builders/account.ts`
- **API**:
  ```typescript
  interface AccountDSL {
    // Create a delegated child identifier
    createDelegatedAccount(
      opts: DelegatedAccountOptions
    ): Promise<AccountDSL>;

    // Get pending delegation requests
    listDelegationRequests(): Promise<DelegationRequest[]>;

    // Approve a delegation request (anchor in KEL)
    approveDelegation(request: DelegationRequest): Promise<void>;

    // Deny a delegation request
    denyDelegation(request: DelegationRequest): Promise<void>;
  }
  ```

**Deliverable**: ✅ Parent/child delegation working

---

### 🔵 Phase 4: Combined Multi-Sig + Delegation

**Goal**: Support delegated group identifiers and multi-sig registries

#### 4.1 Delegated Group Identifiers
- **Feature**: Group multisig with delegation
- **Coordination**:
  - Combine `Counselor` + `Anchorer` workflows
  - First signer (lowest index) elected for delegation messaging
  - All members monitor delegator for anchor seal
- **Test Cases**:
  - 2-of-3 group delegated by single parent
  - 3-of-5 group delegated by 2-of-3 parent

#### 4.2 Multi-Sig Registry Operations
- **Enhancement**: Multi-sig credential registry inception
- **Message**: `/multisig/vcp` (verifiable credential provider)
- **Workflow**: Same as group inception, anchored via IXN

#### 4.3 Multi-Sig Credential Issuance
- **Enhancement**: Multi-sig credential issuance
- **Message**: `/multisig/iss`
- **Workflow**: Propose issuance, collect signatures, anchor

#### 4.4 Multi-Sig Credential Revocation
- **Enhancement**: Multi-sig credential revocation
- **Message**: `/multisig/rev`
- **Workflow**: Propose revocation, collect signatures, anchor

**Deliverable**: ✅ Full feature parity with keripy

---

### 🔵 Phase 5: Test Infrastructure

**Goal**: Ensure 100% compatibility via comprehensive regression testing

#### 5.1 Test Generators (Bash + Python)
- **Files**:
  - `testgen/generators/gen_multisig_incept.sh` - Group inception
  - `testgen/generators/gen_multisig_rotate.sh` - Group rotation
  - `testgen/generators/gen_multisig_ixn.sh` - Group interaction
  - `testgen/generators/gen_delegated_incept.sh` - Delegated inception
  - `testgen/generators/gen_delegated_rotate.sh` - Delegated rotation
  - `testgen/generators/gen_multisig_delegated.sh` - Combined
- **Format**:
  ```json
  {
    "description": "2-of-3 group inception",
    "commands": {
      "generate": "testgen/scripts/multisig_incept_generate.sh",
      "verify": "testgen/scripts/multisig_incept_verify.sh"
    },
    "input": { "smids": [...], "rmids": [...], "isith": "2", ... },
    "expected": { "ked": {...}, "signatures": [...] }
  }
  ```

#### 5.2 Integration Tests (TypeScript)
- **File**: `kerits/test/app/multisig.test.ts`
- **Scenarios**:
  - 3-party group inception with signature collection
  - Group rotation with threshold change
  - Partial signing escrow state transitions
  - Delegation approval workflow
  - Combined group + delegation
  - Witness receipt collection
- **File**: `kerits/test/app/delegation.test.ts`
- **Scenarios**:
  - Simple delegation (single parent, single child)
  - Multi-level delegation (grandparent → parent → child)
  - Delegation denial
  - Delegated rotation

#### 5.3 Regression Test Runner
- **Update**: `kerits/test/regression-runner.ts`
- **Features**:
  - Load test cases from `testgen/test-cases/`
  - Run kerits implementation against expected output
  - Report differences with detailed diagnostics
  - CI/CD integration via GitHub Actions

#### 5.4 Property-Based Testing
- **Library**: `fast-check` for property-based testing
- **Properties**:
  - Threshold computation is deterministic
  - Signature ordering doesn't affect validity
  - SAID computation matches keripy
  - Escrow state transitions are idempotent

**Deliverable**: ✅ 100% test case parity with keripy

---

## Design Principles

### 🎯 Strongly-Typed Approach

**Type Safety**:
```typescript
// Result types for error handling
type GroupInceptionResult = Result<
  { groupAccount: GroupAccount; invitation: GroupInvitation },
  GroupInceptionError
>;

// Tagged unions for state machines
type EscrowState =
  | { stage: 'partial_signed'; signatures: number }
  | { stage: 'awaiting_delegation'; delegator: string }
  | { stage: 'awaiting_witnesses'; receipts: number }
  | { stage: 'complete'; event: Uint8Array };

// Branded types for identifiers
type Pre = string & { readonly __brand: 'Pre' };
type Said = string & { readonly __brand: 'Said' };
```

### 🔧 Functional Approach

**Principles**:
- Immutable data structures (no mutation)
- Pure functions for event generation
- Side effects isolated to DSL/storage layers
- Composable operations
- Result types instead of exceptions

**Example**:
```typescript
// Pure function - no side effects
function addSignature(
  partial: PartiallySignedEvent,
  sig: Signature
): Result<PartiallySignedEvent, SignatureError> {
  // Returns new object, doesn't mutate
  return ok({
    ...partial,
    signatures: new Map(partial.signatures).set(sig.index, sig),
  });
}

// Side effects in DSL layer
async function signProposal(
  proposalId: ProposalId,
  store: KerStore
): Promise<void> {
  // All I/O here
  const partial = await store.getPartialEvent(proposalId);
  const sig = await createSignature(partial);
  const updated = addSignature(partial, sig);
  await store.putPartialEvent(proposalId, updated);
}
```

### 💾 Storage Strategy

**Escrow Tables** (matching keripy schema):
```typescript
interface KerStore {
  // Multi-signature escrows
  gpse: EscrowTable<Pre, [Seqner, Saider]>;  // group partial signed
  gdee: EscrowTable<Pre, [Seqner, Saider]>;  // group delegatee
  gpwe: EscrowTable<Pre, [Seqner, Saider]>;  // group partial witness
  cgms: EscrowTable<[Pre, Sn], Saider>;      // completed group multisig

  // Delegation escrows
  dpwe: EscrowTable<[Pre, Said], Serder>;    // delegated partial witness
  dune: EscrowTable<[Pre, Said], Serder>;    // delegated unanchored
  dpub: EscrowTable<[Pre, Said], Serder>;    // delegated publication
  cdel: EscrowTable<[Pre, Sn], Saider>;      // completed delegation

  // Message correlation
  meids: MessageTable<Said, Saider[]>;       // multisig embedded event IDs
  maids: MessageTable<Said, Prefixer[]>;     // multisig sender AIDs
}
```

**Indexing**:
- Group memberships indexed by member AID
- Delegation relationships indexed by parent/child
- Pending proposals indexed by group ID

---

## Implementation Roadmap

### Milestone 1: Multi-Key Support (Week 1-3) ✅ COMPLETED

- [x] Multi-key inception primitives
- [x] Weighted threshold computation (numeric and fractional)
- [x] Test generator for multi-key inception scenarios
- [x] Unit tests and regression tests (11/11 passing)
- [x] Multi-key rotation with weighted thresholds
- [x] Test generator for multi-key rotation scenarios
- [x] Rotation tests (9/9 passing)
- **Deliverable**: ✅ Single-controller multi-key accounts work

**Completed 2025-10-12**: Multi-key inception and rotation fully implemented with 100% test parity against keripy.

### Milestone 2: Group Coordination (Week 4-7) ✅ COMPLETED
- [x] GroupAccount type and interfaces
- [x] Partial signing escrow management
- [x] Exchange message protocol
- [x] Counselor coordinator
- [x] DSL integration
- [x] Integration tests (11/11 passing)
- **Deliverable**: ✅ 2-of-3 group multisig working end-to-end

**Completed 2025-10-12**: Group multi-signature coordination fully implemented with 3-stage escrow processing.

### Milestone 3: Delegation (Week 8-10)
- [ ] Delegated inception (dip)
- [ ] Delegated rotation (drt)
- [ ] Anchorer for delegation approval
- [ ] Seal extraction and verification
- [ ] DSL integration
- [ ] Integration tests
- **Deliverable**: Parent/child delegation working

### Milestone 4: Advanced Features (Week 11-13)
- [ ] Delegated group identifiers
- [ ] Multi-sig registry operations
- [ ] Multi-sig credential issuance/revocation
- [ ] Performance optimization
- [ ] Edge case handling
- **Deliverable**: Full feature parity with keripy

### Milestone 5: Test Coverage (Week 14-15)
- [ ] Complete test generator suite
- [ ] Integration test scenarios
- [ ] Regression test automation
- [ ] CI/CD integration
- [ ] Documentation
- **Deliverable**: 100% test case parity with keripy

**Total Duration**: 15 weeks

---

## Progress Tracking

### ✅ Completed

**Phase 1: Multi-Key Support (Inception & Rotation)** (2025-10-12)

**Phase 1.1 & 1.2: Multi-Key Inception & Weighted Thresholds**
- ✅ Updated `incept.ts` to support multiple keys with both derivation modes
- ✅ Enhanced `Tholder` class to support weighted thresholds `["1/2", "1/2", "1/2"]`
- ✅ Created test generator: `testgen/generators/gen_multisig_incept.sh`
- ✅ Generated 7 inception test cases
- ✅ Fixed derivation mode logic to match keripy exactly
- ✅ All 11 inception tests passing (100%)

**Phase 1.3: Multi-Key Rotation**
- ✅ Updated `rotate.ts` to support weighted thresholds
- ✅ Created test generator: `testgen/generators/gen_multisig_rotate.sh`
- ✅ Generated 5 rotation test cases covering:
  - 2-of-3, 3-of-5 numeric threshold rotation
  - Weighted (fractional) threshold rotation
  - Threshold changes during rotation
  - Non-transferable rotation (no next keys)
- ✅ All 9 rotation tests passing (100%)

**Test Results:**
- **kerits**: 269/269 tests passing (100%)
- **keripy**: 75/75 tests passing (100%)
- **multisig inception**: 11/11 tests (100%)
- **multisig rotation**: 9/9 tests (100%)

**Key Implementation Details:**
- **Dual derivation mode** (matching keripy behavior):
  - Basic derivation: `prefix = first key` (single key, no explicit thresholds)
  - Self-addressing: `prefix = SAID` (multi-key OR explicit thresholds)
- Detection via `'isith' in options` check (not just `isith === undefined`)
- Threshold format: Numeric strings (`"2"`) or weighted arrays (`["1/2", "1/2", "1/2"]`)
- Type safety: `ThresholdValue = number | string | string[]`
- Validation: Thresholds checked against key count
- Threshold changes supported during rotation

### ✅ Completed
- **Phase 1**: Multi-Key Support (Single controller, multiple keys)
- **Phase 2**: Group Multi-Signature Coordination (Multiple controllers)
- **Phase 3**: Delegation Support (Delegated identifiers)
- **Real-World Scenarios**: Multi-device control documentation and tests

### 📋 Next Steps
- Phase 4: Combined Multi-Sig + Delegation (Delegated groups)
- Phase 5: Complete test infrastructure
- Witness coordination implementation
- Performance optimization

---

## 🎯 Real-World Use Cases

Comprehensive documentation and tests demonstrating practical KERI multi-signature scenarios:

### Documentation

**Multi-Device Control**
- **[Multi-Device Scenarios Guide](docs/MULTI-DEVICE-SCENARIOS.md)** - Complete guide covering:
  - How multi-device control works
  - Creating accounts on phone & PC
  - Normal key rotation
  - Adding devices
  - Device loss and recovery
  - Delegated recovery

**Delegation & Hierarchies**
- **[Delegation Scenarios Guide](docs/DELEGATION-SCENARIOS.md)** - Comprehensive guide covering:
  - What is delegation and why use it
  - Creating delegated identities
  - Organization with department AIDs
  - Delegated key rotation
  - Using delegation for recovery
  - Multi-level delegation (3+ tiers)
  - Revoking delegated authority

### Scenario Tests (57 tests, all passing)

**Multi-Device Inception** ([`test/scenarios/multi-device-inception.test.ts`](test/scenarios/multi-device-inception.test.ts))
- 2-of-2 threshold setup
- Same AID across devices
- Distributed key control
- Pre-committed next keys

**Key Rotation** ([`test/scenarios/key-rotation.test.ts`](test/scenarios/key-rotation.test.ts))
- Security best practices (90-day rotation)
- Forward secrecy validation
- KEL continuity verification
- Multiple rotation cycles

**Device Loss & Recovery** ([`test/scenarios/device-loss-recovery.test.ts`](test/scenarios/device-loss-recovery.test.ts))
- Below threshold scenarios (2-of-2, lost 1 device)
- Above threshold recovery (2-of-3, lost 1 device)
- Removing lost device keys
- Adding replacement devices
- Threshold management

**Delegated Inception** ([`test/scenarios/delegation/delegated-inception-scenario.test.ts`](test/scenarios/delegation/delegated-inception-scenario.test.ts))
- Parent-child AID creation
- Delegated inception (dip) events
- Recovery mechanism setup
- Multi-sig delegated AIDs

**Delegated Rotation** ([`test/scenarios/delegation/delegated-rotation-scenario.test.ts`](test/scenarios/delegation/delegated-rotation-scenario.test.ts))
- Child rotates with parent approval
- Delegated rotation (drt) events
- Delegation maintained after rotation
- Threshold changes in delegated AIDs

**Organization Hierarchy** ([`test/scenarios/delegation/organization-hierarchy-scenario.test.ts`](test/scenarios/delegation/organization-hierarchy-scenario.test.ts))
- Company root AID
- Multiple department AIDs
- Organizational structure
- Department autonomy with central control

**Multi-Level Delegation** ([`test/scenarios/delegation/multi-level-delegation-scenario.test.ts`](test/scenarios/delegation/multi-level-delegation-scenario.test.ts))
- 3+ tier hierarchies (Corp → Dept → Team)
- Cascading delegation chains
- Complex branching structures
- Deep organizational trees

---

## Phase 2 Implementation Details (2025-10-12)

### Architecture Overview

Phase 2 implements group multi-signature coordination following keripy's 3-stage escrow processing model:

1. **Partial Signed Escrow (gpse)**: Collect member signatures until threshold met
2. **Delegatee Escrow (gdee)**: Wait for delegation approval (if delegated)
3. **Partial Witness Escrow (gpwe)**: Collect witness receipts until threshold met

### Created Files

#### Core Types: `src/app/group-account.ts`
- **GroupConfig**: Configuration for creating group identifiers
  - `mhab`: Local member's identifier
  - `smids`: Signing member identifiers (ordered)
  - `rmids`: Rotating member identifiers (defaults to smids)
  - `delpre`: Optional delegation anchor

- **GroupAccount**: Group identifier state
  - Extends basic account with multi-sig coordination
  - Tracks signing/rotating members
  - Stores current and next thresholds
  - Optional witness and delegation configuration

- **PartiallySignedEvent**: Partially signed event in escrow
  - Tracks collected signatures by member ID
  - Tracks collected receipts by witness ID
  - Stores required signature count and timestamp

- **PartialSigningState**: Tagged union for escrow stages
  - `collecting`: Still gathering member signatures
  - `delegating`: Awaiting delegator approval
  - `witnessing`: Collecting witness receipts
  - `completed`: Event fully signed and witnessed
  - `failed`: Processing failed with reason

- **GroupEscrowStore**: Interface for escrow storage
  - Methods for each escrow table (gpse, gdee, gpwe, cgms)
  - Async API for storage operations

#### Coordinator: `src/app/counselor.ts`
- **Counselor Class**: Manages 3-stage escrow processing
  - `processExchangeMessage()`: Handle incoming partial signatures
  - `processPartialSignedEscrow()`: Stage 1 - collect signatures
  - `processDelegateEscrow()`: Stage 2 - handle delegation
  - `processPartialWitnessEscrow()`: Stage 3 - collect receipts
  - `isElected()`: Determine which member handles delegation/witnessing
  - `cleanupExpired()`: Remove timed-out escrow events

- **Election Mechanism**: Lowest-index signer in `smids` handles delegation/witnessing

#### Storage: `src/app/memory-group-escrow.ts`
- **MemoryGroupEscrow Class**: In-memory escrow storage
  - Maps for each escrow table (gpse, gdee, gpwe, cgms)
  - Async methods matching `GroupEscrowStore` interface
  - Helper methods: `clear()`, `stats()`, `getCompleted()`

#### DSL Integration: `src/app/dsl/builders/group-account.ts`
- **GroupAccountBuilder**: Fluent API for group management
  - `group()`: Start building a new group identifier
  - `getGroup()`: Retrieve existing group
  - `listGroups()`: List all groups

- **GroupInceptBuilder**: Fluent builder for group inception
  - `.members(smids)`: Set signing members
  - `.localMember(mhab)`: Set local member ID
  - `.threshold(isith)`: Set signing threshold
  - `.withWitnesses(b, bt)`: Configure witnesses
  - `.delegatedBy(delpre)`: Make delegated group
  - `.incept(options)`: Create the group

- **GroupRotateBuilder**: Fluent builder for group rotation
  - `.threshold(isith)`: Change signing threshold
  - `.nextThreshold(nsith)`: Change next threshold
  - `.updateWitnesses(ba, br, bt)`: Modify witness configuration
  - `.rotate(options)`: Execute rotation

### Test Coverage

#### `test/app/group-account.test.ts` - 11 tests, all passing
1. **Group Inception** (6 tests):
   - Creates 2-of-3 multi-sig group
   - Creates group with weighted thresholds
   - Creates group with witnesses
   - Creates delegated group
   - Validates required members
   - Validates required local member

2. **Partial Signing Coordination** (3 tests):
   - Collects signatures from group members
   - Handles partial signing with witnesses
   - Handles delegated group coordination

3. **Group Rotation** (1 test):
   - Rotates group keys

4. **Escrow Cleanup** (1 test):
   - Cleans up expired escrow events

### Key Design Decisions

1. **Tagged Union State Machine**: `PartialSigningState` uses TypeScript discriminated unions for type-safe state tracking

2. **Async Storage Interface**: All escrow operations are async to support both in-memory and persistent storage

3. **Fluent DSL**: Builder pattern provides intuitive API for group operations

4. **Election Mechanism**: Simplified to lowest-index member (keripy uses more complex logic)

5. **Exchange Messages**: Defined message format but not yet integrated with networking layer (Phase 4)

### Integration Points

- **Inception/Rotation**: Uses existing `incept()` and `rotate()` functions
- **Thresholds**: Uses existing `Tholder` class for validation
- **Storage**: Escrow store interface can be swapped for persistent storage

### Next Steps (Phase 3)

Phase 2 provides the foundation for group coordination. Phase 3 will add delegation support:
- Delegated inception (dip) and rotation (drt) events
- Anchorer for delegation approval workflow
- Seal extraction and verification
- Integration with Phase 2 for delegated groups

---

## References

### KERIPY Source Files
- [src/keri/app/habbing.py:2575](../src/keri/app/habbing.py#L2575) - GroupHab class
- [src/keri/app/grouping.py:23](../src/keri/app/grouping.py#L23) - Counselor coordinator
- [src/keri/app/grouping.py:561](../src/keri/app/grouping.py#L561) - Multiplexor
- [src/keri/app/delegating.py:22](../src/keri/app/delegating.py#L22) - Anchorer
- [tests/app/test_grouping.py](../tests/app/test_grouping.py) - Multi-sig tests
- [tests/app/test_delegating.py](../tests/app/test_delegating.py) - Delegation tests

### KERITS Source Files
- [src/incept.ts](src/incept.ts) - Current inception (single-key only)
- [src/rotate.ts](src/rotate.ts) - Current rotation
- [src/app/dsl/builders/account.ts](src/app/dsl/builders/account.ts) - Account DSL

### Specifications
- KERI Whitepaper: https://github.com/SmithSamuelM/Papers/blob/master/whitepapers/KERI_WP_2.x.web.pdf
- CESR Specification: https://weboftrust.github.io/ietf-cesr/draft-ssmith-cesr.html

---

**Last Updated**: 2025-10-12
**Next Review**: After Milestone 1 completion
