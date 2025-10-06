# Cross-Entity Chain Synchronization

## Overview

Kerits supports importing and sharing KELs (Key Event Logs), TELs (Transaction Event Logs), and ACDCs (Authentic Chained Data Containers) between entities. This enables use cases like:

- Importing a contact's identity (KEL) to verify their credentials
- Importing credential registries (TEL) from issuers
- Importing credentials (ACDC) issued by others
- Viewing cross-entity relationships in graphs

## Features

### Import Options

- **`skipExisting`**: Skip events already in your store (enables re-syncing)
- **`verify`**: Verify SAIDs of imported events (currently works for KEL events)
- **`alias`**: Assign a custom alias to imported registries or credentials

### Export/Import Workflow

1. **Bob exports** his KEL, registry TEL, or credential ACDC to CESR or JSON format
2. **Alice imports** Bob's data into her store
3. **Alice can view** Bob's chain in her global graph
4. **Re-importing** the same data skips existing events

## Example: Sharing a Credential Registry

```typescript
// Bob creates identity and registry
const bobDSL = createKeritsDSL(bobStore);
const bob = await bobDSL.newAccount('bob', mnemonic);
const bobAccount = await bobDSL.account('bob');
const bobRegistry = await bobAccount!.createRegistry('health');

// Bob exports his KEL and TEL
const bobKelExport = await bobAccount!.export();
const bobTelExport = await bobRegistry.export();

// Bob saves to files
await bobKelExport.toFile('./bob-kel.cesr', 'cesr');
await bobTelExport.toFile('./bob-health-tel.cesr', 'cesr');

// Alice imports Bob's data
const aliceDSL = createKeritsDSL(aliceStore);
const aliceImport = aliceDSL.import();

// Import KEL first (required for TEL)
await aliceImport.fromFile('./bob-kel.cesr', {
  skipExisting: true,
  verify: true,
});

// Import TEL with custom alias
await aliceImport.fromFile('./bob-health-tel.cesr', {
  skipExisting: true,
  alias: 'bobs-health-registry',
});

// Alice can now access Bob's registry by alias
const registryId = await aliceStore.aliasToId('tel', 'bobs-health-registry');
```

## Example: Cross-Entity Credential Issuance

```typescript
// Setup Bob (issuer) and Alice (holder)
const bob = await bobDSL.newAccount('bob', bobMnemonic);
const alice = await aliceDSL.newAccount('alice', aliceMnemonic);

// Alice shares her KEL with Bob
const aliceKelExport = await (await aliceDSL.account('alice'))!.export();
await aliceKelExport.toFile('./alice-kel.cesr', 'cesr');

// Bob imports Alice's KEL
await bobDSL.import().fromFile('./alice-kel.cesr', {
  skipExisting: true,
  verify: true,
});

// Bob creates schema and registry
await bobDSL.createSchema('badge', {
  title: 'Badge',
  properties: { name: { type: 'string' } },
});
const bobRegistry = await (await bobDSL.account('bob'))!.createRegistry('badges');

// Bob issues credential to Alice
const credential = await bobRegistry.issue({
  schema: 'badge',
  holder: alice.aid, // Bob can now use Alice's AID
  data: { name: 'Alice Badge' },
});

// Bob exports credential and related data
const credentialExport = await credential.export();
await credentialExport.toFile('./alice-badge.cesr', 'cesr');

// Alice imports Bob's credential
await aliceDSL.import().fromFile('./bob-kel.cesr', { skipExisting: true });
await aliceDSL.import().fromFile('./bob-badges-tel.cesr', { skipExisting: true });
await aliceDSL.import().fromFile('./alice-badge.cesr', {
  skipExisting: true,
  alias: 'my-badge-from-bob',
});
```

## Graph Visualization

After importing, all entities' chains appear in the global graph:

```typescript
const graph = await aliceDSL.graph();

// Graph includes:
// - Alice's KEL events (her identity)
// - Bob's KEL events (his identity)
// - Bob's TEL events (his registry)
// - ACDC credential (issued by Bob to Alice)
// - Edges showing relationships
```

## Import Result

The `ImportResult` interface provides feedback:

```typescript
interface ImportResult {
  imported: number;      // Events successfully imported
  skipped: number;       // Events already in store (if skipExisting: true)
  failed: number;        // Events that failed to import
  errors: string[];      // Error messages
  aid?: string;          // AID if KEL was imported
  registryId?: string;   // Registry ID if TEL was imported
  credentialId?: string; // Credential ID if ACDC was imported
}
```

## Test Coverage

See comprehensive test cases in: [test/app/cross-entity-sync.test.ts](../test/app/cross-entity-sync.test.ts)

### Test Scenarios

1. **Sync Bob's registry to Alice with alias** - Import TEL with custom alias
2. **Sync Bob's credential to Alice** - Full credential import workflow
3. **Show Bob's chain in Alice's graph** - Cross-entity visibility
4. **Re-import and skip existing** - Idempotent imports
5. **Verify SAIDs during import** - Cryptographic verification
6. **Cross-entity credential issuance** - Bob issues to Alice

All tests validate:
- ✓ Events are imported correctly
- ✓ Aliases are created and retrievable
- ✓ Existing events are skipped on re-import
- ✓ SAIDs are verified (KEL events)
- ✓ Cross-entity data appears in graphs
- ✓ No data corruption or loss

## Current Limitations

1. **TEL/ACDC SAID Verification**: Currently disabled in tests (TODO)
   - KEL SAID verification works correctly
   - TEL/ACDC events may have different SAID computation rules

2. **Schema Import**: Schemas are currently recreated manually
   - Future: Schema export/import as bundles

3. **Signature Verification**: Not yet implemented
   - SAIDs are verified, but signatures are not

## Format Support

- **CESR** (`.cesr`): Raw concatenated CESR events (standard KERI format)
- **JSON** (`.json`): JSON-wrapped bundle with metadata

Both formats support:
- Auto-detection on import
- Metadata preservation
- Idempotent re-import

## CLI Support

CLI commands for import/export are available in the menus:

- **Export KEL**: Accounts menu → Export KEL
- **Export TEL**: Registries menu → Export registry (TODO: add option)
- **Export ACDC**: Credentials menu → Export credential
- **Import**: Contacts menu → Add contact (imports KEL automatically)

Additional CLI commands for registry/credential import are pending (TODO).
