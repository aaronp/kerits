# Structured Keys Implementation Summary

## Problem Solved

The original DiskKv implementation was encoding forward slashes (`/`) as `%2F`, creating a flat file structure like:
```
target/
  map%2Falias2id%2Fkel%2Falice
  map%2Fid2alias%2Fkel%2FEAID123
```

This violated the design principles in `docs/design.md` which specified:
1. Hierarchical directory structure
2. Proper file extensions (.cesr, .json) to distinguish KERI primitives from metadata
3. Event type extensions (.icp.cesr, .vcp.cesr) for clarity

## Solution: StorageKey Type

We introduced a structured key abstraction that:
1. Preserves type information (CESR vs JSON vs text)
2. Enables proper file extensions on disk
3. Allows different KV implementations to optimize storage

### Type Definition

```typescript
export interface StorageKey {
  /** Path segments (e.g., ['kel', 'EAID123', 'ESAID456']) */
  path: string[];

  /** Type hint for file extensions and serialization */
  type?: 'cesr' | 'json' | 'text';

  /** Optional metadata for KV optimization */
  meta?: {
    /** Event type for CESR files (icp, rot, ixn, vcp, iss, rev) */
    eventType?: EventType;
    /** Whether this is immutable content-addressed data */
    immutable?: boolean;
    /** Suggested index keys for query optimization */
    indexes?: string[];
  };
}
```

## Implementation

### 1. Updated Kv Interface (Backward Compatible)

```typescript
export interface Kv {
  // String-based methods (existing, backward compatible)
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
  list(prefix: string, opts?: ...): Promise<...>;

  // Structured key methods (optional, new)
  getStructured?(key: StorageKey): Promise<Uint8Array | null>;
  putStructured?(key: StorageKey, value: Uint8Array): Promise<void>;
  delStructured?(key: StorageKey): Promise<void>;
  listStructured?(keyPrefix: StorageKey, opts?: ...): Promise<...>;
}
```

### 2. DiskKv Enhancement

Added helper functions:
- `storageKeyToPath()`: Converts StorageKey to filesystem path with extensions
- `pathToStorageKey()`: Parses filesystem path back to StorageKey

Implemented methods:
- `getStructured()`: Read with proper path resolution
- `putStructured()`: Write with automatic directory creation
- `delStructured()`: Delete with proper path resolution
- `listStructured()`: List with StorageKey result type

### 3. File Extension Logic

```typescript
function storageKeyToPath(baseDir: string, key: StorageKey): string {
  const dirPath = path.join(baseDir, ...key.path.slice(0, -1));
  const fileName = key.path[key.path.length - 1];

  // Build file extension
  let ext = '';
  if (key.meta?.eventType) {
    ext += `.${key.meta.eventType}`;  // .icp, .rot, .ixn, etc.
  }
  if (key.type === 'cesr') {
    ext += '.cesr';
  } else if (key.type === 'json') {
    ext += '.json';
  }

  return path.join(dirPath, fileName + ext);
}
```

## Results

### File Structure (Before)
```
target/app-integration/
├── map%2Falias2id%2Fkel%2Falice
├── map%2Fid2alias%2Fkel%2FEAID123
├── ev%2FESAID456
└── ... (all flat)
```

### File Structure (After - with structured keys)
```
target/test-structured-keys/
├── kel/
│   └── EAID1/
│       └── ESAID1.icp.cesr
├── tel/
│   └── EREG1/
│       └── ESAID2.vcp.cesr
├── acdc/
│   └── EACDC1.json
├── head/
│   └── kel/
│       └── EAID123
└── alias/
    └── kel/
        └── alice
```

This matches the design.md specification!

## Benefits

### 1. Type Safety
KERI primitives (.cesr) are clearly distinguished from application metadata (.json)

### 2. Storage Flexibility
Different KV implementations can optimize based on key structure:
- **DiskKv**: Creates proper directory hierarchy with extensions
- **MemoryKv**: Flattens to string keys (simple join)
- **SqlKv** (future): Routes to appropriate tables based on path[0]
- **IndexedDBKv** (future): Uses path[0] as object store name

### 3. Clarity
```typescript
// Instead of: "kel/EAID123/ESAID456"
// We have:
{
  path: ['kel', 'EAID123', 'ESAID456'],
  type: 'cesr',
  meta: { eventType: 'icp', immutable: true }
}
```

### 4. Query Optimization
SQL/IndexedDB can create indexes based on path structure and metadata

### 5. Immutability Hints
KV implementations can optimize based on `immutable` flag (e.g., aggressive caching)

## Migration Strategy

### Phase 1: ✅ Complete
- Added StorageKey type to types.ts
- Extended Kv interface with optional structured methods
- Implemented structured methods in DiskKv
- All existing tests pass (164/164)

### Phase 2: Next Steps
1. Update KerStore to optionally use structured keys
2. Add helper function to convert string keys to StorageKey
3. Gradually migrate storage operations to use structured keys

### Phase 3: Future
1. Implement MemoryKv structured methods (simple flatten)
2. Create SqlKv with table-based routing
3. Create IndexedDBKv for browser storage
4. Remove old string-based methods once fully migrated

## Example Usage

```typescript
// Create a KEL event key
const key: StorageKey = {
  path: ['kel', 'EAID123', 'ESAID456'],
  type: 'cesr',
  meta: { eventType: 'icp', immutable: true }
};

// Store event
await kv.putStructured(key, cesrBytes);

// Result on disk:
// .keri/kel/EAID123/ESAID456.icp.cesr
```

```typescript
// Create an ACDC key
const acdcKey: StorageKey = {
  path: ['acdc', 'EACDC789'],
  type: 'json',
  meta: { immutable: true }
};

await kv.putStructured(acdcKey, jsonBytes);

// Result on disk:
// .keri/acdc/EACDC789.json
```

```typescript
// Create an alias key
const aliasKey: StorageKey = {
  path: ['alias', 'kel', 'alice'],
  type: 'text'
};

await kv.putStructured(aliasKey, new TextEncoder().encode('EAID123'));

// Result on disk:
// .keri/alias/kel/alice
```

## Testing

All tests pass:
- ✅ 164 existing tests (no regressions)
- ✅ 8 new structured key tests
- **Total: 172 tests passing**

## Documentation

Created comprehensive documentation:
1. `docs/storage-keys.md` - Full design specification
2. `docs/structured-keys-implementation.md` - This document
3. Inline code comments in implementation

## Backward Compatibility

The implementation maintains full backward compatibility:
- All existing string-based KV methods still work
- Structured methods are optional (marked with `?` in interface)
- Existing tests pass without modifications
- Migration can happen gradually

## Next Steps

To fully align with design.md, the storage layer should:

1. **Use structured keys everywhere**: Update KerStore to prefer structured keys
2. **Add HEAD tracking**: Implement `head/kel/{aid}` and `head/tel/{ri}`
3. **Migrate aliases**: Change from `map/alias2id/kel/alice` to `alias/kel/alice`
4. **Add ACDC storage**: Store credentials as `acdc/{SAID}.json`
5. **Preserve event types**: Ensure all CESR events have proper `.icp.cesr` extensions

See `docs/design-feedback.md` for detailed implementation roadmap.
