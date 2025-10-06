# UI Migration to DSL Architecture

## Overview

The kerits UI has been migrated from direct IndexedDB access to using the robust DSL architecture. This migration provides:

- **Type-safe operations** via DSL interfaces
- **CESR import/export** for cross-entity synchronization
- **SAID verification** on import
- **Clean separation** between storage and business logic
- **Future-proof** architecture for adding features

## Architecture Changes

### Before (Old)
```
UI Components
    ↓
storage.ts (IndexedDB wrapper)
    ↓
IndexedDB
```

### After (New)
```
UI Components
    ↓
dsl.ts (DSL singleton)
    ↓
KeritsDSL (App DSL)
    ↓
KerStore (Storage API)
    ↓
IndexedDBKv (Kv adapter)
    ↓
IndexedDB
```

## Files Created

### 1. `/src/storage/adapters/indexeddb.ts`
- **Purpose**: IndexedDB implementation of the `Kv` interface
- **Key Features**:
  - Simple key-value store design
  - Prefix-based listing via IDBKeyRange
  - Batch operations via transactions
  - Helper methods for testing (clear, size, close)

### 2. `/ui/src/lib/dsl.ts`
- **Purpose**: Global DSL singleton for UI
- **Key Features**:
  - Lazy initialization of IndexedDB backend
  - Exports `getDSL()` function for non-React usage
  - Exports `useDSL()` hook for React components
  - Exports `resetDSL()` for clearing data

### 3. `/ui/src/components/explorer/Explorer.tsx` (Refactored)
- **Purpose**: Hierarchical credential registry browser
- **Key Features**:
  - Lists registries using `accountDsl.registries().list()`
  - Creates registries using `accountDsl.createRegistry()`
  - Exports registries as CESR to clipboard
  - Imports registries from CESR clipboard with verification
  - Clean state management with React hooks

## Usage Examples

### Creating a Registry
```typescript
const accountDsl = await dsl.account('alice');
await accountDsl.createRegistry('my-registry');
```

### Exporting a Registry (CESR)
```typescript
const registryDsl = await accountDsl.registry(registryId);
const exportDsl = await registryDsl.export();
const cesr = await exportDsl.asCESR();

// Copy to clipboard
const text = new TextDecoder().decode(cesr);
await navigator.clipboard.writeText(text);
```

### Importing from Clipboard (CESR)
```typescript
const text = await navigator.clipboard.readText();
const cesr = new TextEncoder().encode(text);

const importDsl = accountDsl.import();
const result = await importDsl.fromCESR(cesr, {
  verify: true,        // Verify SAIDs
  skipExisting: true,  // Skip duplicate events
});

console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
```

### Listing Registries
```typescript
const registries = await accountDsl.registries().list();
// Returns: Array<{ registryId, alias, issuerAid, ... }>
```

## Breaking Changes

### ⚠️ **Important**: Data Migration Required

The new architecture uses a completely different storage schema. **All existing data in the old IndexedDB schema will NOT be accessible**. Users will need to:

1. Export data from the old UI (if needed)
2. Clear browser data
3. Import data into the new UI using CESR format

### Components Broken (Temporarily)

The following components still use `storage.ts` and will need refactoring:

- `IdentityCreator.tsx` - Uses `saveIdentity()`
- `IdentityList.tsx` - Uses `getIdentities()`
- `SchemaCreator.tsx` - Uses `saveSchema()`
- `SchemaList.tsx` - Uses `getSchemas()`
- `CredentialIssuer.tsx` - Uses `saveCredential()`
- `CredentialList.tsx` - Uses `getCredentials()`
- `CredentialRegistry.tsx` - Uses `getACDCsByRegistry()`
- `ACDCRow.tsx` - Uses credential data structures
- `Contacts.tsx` - Uses `getContacts()`
- `Dashboard.tsx` - Uses various storage functions

## Next Steps

### Phase 1: Complete (✅)
- [x] Implement IndexedDBKv
- [x] Create DSL singleton
- [x] Refactor Explorer.tsx
- [x] Implement Registry export/import (CESR)

### Phase 2: ACDC Hierarchy (Next)
- [ ] Refactor `CredentialRegistry.tsx` to use DSL
- [ ] List ACDCs using `registryDsl.listCredentials()`
- [ ] Issue ACDCs using `registryDsl.issue()`
- [ ] Export/import individual ACDCs
- [ ] Group by Schema
- [ ] Group by Recipient
- [ ] Display credential data

### Phase 3: Identity Management
- [ ] Refactor identity components to use DSL
- [ ] `dsl.newAccount()` for identity creation
- [ ] `dsl.listAccounts()` for listing identities

### Phase 4: Schema Management
- [ ] Refactor schema components to use DSL
- [ ] `dsl.createSchema()` for schema creation
- [ ] `dsl.listSchemas()` for listing schemas

### Phase 5: Contacts & Graphs
- [ ] Implement contacts using import DSL
- [ ] Add graph visualization at each level
- [ ] Cross-entity credential views

### Phase 6: Search & Filter
- [ ] Add top-level search
- [ ] Filter by registry, ACDC, schema, recipient
- [ ] Fuzzy search on credential data

## Testing

The `IndexedDBKv` adapter can be tested in browser devtools:

```typescript
import { IndexedDBKv } from './src/storage/adapters/indexeddb';

const kv = new IndexedDBKv('test-db');

// Test operations
await kv.put('test/key1', new TextEncoder().encode('value1'));
await kv.put('test/key2', new TextEncoder().encode('value2'));

const result = await kv.list('test/');
console.log('Keys:', result.map(r => r.key));

await kv.clear();
await kv.close();
```

## Performance Considerations

- **Lazy initialization**: DSL is only created when first needed
- **Batch operations**: IndexedDB transactions are used for bulk writes
- **Prefix scans**: Efficient listing using IDBKeyRange
- **Single instance**: DSL singleton avoids multiple database connections

## Security Notes

- **Local-only**: All data is stored in browser IndexedDB
- **SAID verification**: Imported events are cryptographically verified
- **No server sync**: This is a client-side only implementation

## Migration Path for Users

1. **Before migration**: Export all data as CESR (if old UI supports it)
2. **Clear data**: Open DevTools > Application > IndexedDB > Delete all databases
3. **Refresh page**: New schema will be created automatically
4. **Import data**: Use clipboard import to restore CESR exports

## Support

For questions or issues with the migration:
- File an issue at `github.com/anthropics/claude-code/issues`
- Include error messages from browser console
- Mention "kerits UI DSL migration"
