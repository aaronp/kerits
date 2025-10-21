# KEL Snapshot Testing & Golden Files

## Overview

This document describes the snapshot testing infrastructure for the KEL (Key Event Log) system. Golden file tests capture complete system state for regression testing and visual inspection.

## Goals

- **Regression Protection**: Detect unintended changes to KEL behavior
- **Visual Inspection**: Human-readable JSON snapshots of system state
- **Round-Trip Verification**: Prove serialization correctness (dump → load → dump = identical)
- **Deterministic**: Same inputs always produce identical snapshots

## Components

### 1. Data Canonicalization ([data.ts](../../data/data.ts))

Extended the `Data` class with:

```typescript
// Canonicalize to deterministic bytes/text (no SAID injection)
Data.fromJson(obj).canonicalize() -> { raw: Uint8Array, text: string }

// Compute Blake3 digest of canonical bytes
Data.digest(raw: Uint8Array) -> string  // CESR-encoded

// Byte encoding helpers for Uint8Array <-> base64url
Data.encodeBytes(bytes: Uint8Array) -> string
Data.decodeBytes(encoded: string) -> Uint8Array
```

**Key difference from `saidify()`**: `canonicalize()` does NOT inject a SAID field - it's purely for deterministic serialization.

### 2. Snapshot Types ([snapshot.ts](../snapshot.ts))

```typescript
interface KelSnapshot {
  version: 1;
  createdAt: string;  // ISO timestamp (informational, not in digest)
  digest: string;     // Blake3 of entire snapshot (excluding this field)
  stores: {
    aliases: AliasMapping;
    kelEvents: Record<SAID, KelEvent>;
    kelCesr: Record<SAID, KelEnvelope>;
    kelMetadata: Record<string, ChainMetadata>;
    vault: Record<string, VaultSnapshot>;  // Public keys only by default
  };
}
```

**Determinism helpers**:
- `sortSignatures()` - Deterministic signature ordering
- `sortObject()` - Alphabetical key sorting

**Note**: `snapshot.ts` is production code (used by `dumpState`/`loadState`). Test-only utilities are in `test-helpers/`.

### 3. KelApi Extensions ([api.ts](../api.ts))

```typescript
// Dump complete state to snapshot
dumpState(opts?: {
  includeSecrets?: boolean;  // default: false
  timestamp?: string;        // for deterministic tests
}) -> Promise<KelSnapshot>

// Load snapshot into stores (verifies digest)
loadState(snapshot: KelSnapshot, opts?: {
  allowSecrets?: boolean;   // default: false
  truncateExisting?: boolean;  // NOT IMPLEMENTED - use fresh stores
}) -> Promise<void>
```

### 4. Golden File Helpers ([golden.ts](../golden.ts))

```typescript
// Derive golden file path from test location
goldenFilePath(testFilePath: string, testName: string) -> string

// Save/load golden files
saveGolden(filePath: string, snapshot: KelSnapshot) -> Promise<void>
loadGolden(filePath: string) -> Promise<KelSnapshot | null>

// Assert snapshot matches golden file (with UPDATE_GOLDEN support)
assertMatchesGolden(testFilePath, testName, snapshot) -> Promise<void>

// Verify round-trip stability
assertRoundTrip(snapshot1, snapshot2) -> void
```

## Usage

### Writing Golden File Tests

See [kel-golden.test.ts](../kel-golden.test.ts) for examples.

```typescript
import { assertMatchesGolden, assertRoundTrip } from './test-helpers/golden';

it('should create single-key inception', async () => {
  const stores = KelStores.inMemory();
  const api = KelStores.ops(stores);

  await api.createAccount({
    alias: 'alice',
    currentKeySpec: 12345,  // Deterministic keys
    nextKeySpec: 67890,
    timestamp: '2024-01-01T00:00:00.000Z'  // Deterministic timestamp
  });

  const snapshot = await api.dumpState({
    timestamp: '2024-01-01T00:00:00.000Z'
  });

  // Assert matches golden file (explicit path is grep-able)
  await assertMatchesGolden('test/golden/kel/inception-single-key.json', snapshot);

  // Verify round-trip
  const stores2 = KelStores.inMemory();
  const api2 = KelStores.ops(stores2);
  await api2.loadState(snapshot);
  const snapshot2 = await api2.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });
  assertRoundTrip(snapshot, snapshot2);
});
```

### Golden File Workflow

**1. Create/Update Golden Files**:
```bash
# Using make target (recommended)
make snapshot-model

# Or directly with bun
UPDATE_GOLDEN=1 bun test src/model/kel/kel-golden.test.ts
```

**2. Check Against Golden Files**:
```bash
# Part of normal model tests
make test-model

# Or directly with bun
bun test src/model/kel/kel-golden.test.ts
```

**3. Visual Inspection**:
Golden files are stored in `test/golden/{category}/{test-slug}.json` at the project root, with pretty-printed JSON for easy review.

**4. When Tests Fail**:
- Review the diff in test output
- If change is expected: `make snapshot-model`
- If change is unexpected: investigate and fix

## FAQ

### Q: Data.saidify() vs Data.canonicalize()?
**A**: `saidify()` injects a SAID field into the data (for KERI events). `canonicalize()` just produces deterministic bytes/text without modification (for snapshots).

### Q: Why is `createdAt` excluded from digest?
**A**: It's metadata about when the snapshot was created, not part of the semantic state. Tests use fixed timestamps for determinism.

### Q: Why Blake3 instead of SHA-256?
**A**: Consistency with KERI SAIDs, faster, and snapshots are for internal testing (not external interchange).

### Q: What if I add a new field (e.g., witnesses)?
**A**: Tests will fail with a diff showing the new field. Visually confirm the change, then run `UPDATE_GOLDEN=1` to regenerate golden files.

### Q: How do I test only one golden file?
**A**: Use Bun's test filtering:
```bash
bun test src/model/kel/kel-golden.test.ts -t "single-key inception"
```

### Q: Can I include secrets in snapshots?
**A**: Yes, with `includeSecrets: true`, but **only for local debugging**. Golden files should never contain secrets (they're committed to git).

### Q: What about circular references (delegated events)?
**A**: Snapshots are just database dumps - no logic/traversal. Circular refs are represented as separate keys in the flat store structure.

## Directory Structure

```
# Production code
src/model/kel/
├── snapshot.ts              # Snapshot types & helpers (production)
├── api.ts                   # dumpState/loadState methods
├── kel-golden.test.ts       # Golden file tests
├── snapshot.test.ts         # Snapshot dump/load tests
└── test-helpers/            # Test utilities (not in production)
    ├── README.md
    └── golden.ts            # Golden file utilities

# Test data (not in src/)
test/golden/
├── README.md
└── kel/                     # KEL golden files
    ├── create-single-key-inception.json
    ├── rotate-keys-and-update-chain.json
    └── generate-event-proof.json
```

## Implementation Phases (Completed)

✅ **Phase 1**: Data canonicalization (30 tests pass)
✅ **Phase 2**: Snapshot schema & dumpState (7 snapshot tests pass)
✅ **Phase 3**: Golden file infrastructure
✅ **Phase 4**: 3 golden file tests with round-trip verification
✅ **Phase 5**: loadState with digest verification

**All 90 KEL tests pass** (including 3 golden file tests, 7 snapshot tests, 30 data tests)

## Next Steps (Future Work)

1. **Add more golden tests** as new features are developed (witnesses, receipts, delegations)
2. **Migrate existing tests** to golden files where appropriate (reduces test code duplication)
3. **Diff improvements**: Better diff output showing field-by-field changes instead of character-level
4. **Snapshot versioning**: When `version: 2` is needed, implement migration logic

## See Also

- [api-comments.md](./api-comments.md) - Original proposal and discussion
- [kel-serialization.test.ts](../kel-serialization.test.ts) - CESR serialization tests
- [Data tests](../../data/data.test.ts) - Canonicalization tests
