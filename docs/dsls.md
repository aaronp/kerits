# KERI DSLs - High-Level API

Hierarchical DSL system for KERI operations with fluent, chainable interface.

## Quick Start

```typescript
import { createKeritsDSL } from 'kerits';
import { createKerStore, MemoryKv } from 'kerits/storage';

const store = createKerStore(new MemoryKv());
const dsl = createKeritsDSL(store);
```

## Use Case 1: Personal Health Records

**Scenario**: Person creates a health registry to share medical data with their doctor.

```typescript
// Patient creates account
const patientSeed = crypto.getRandomValues(new Uint8Array(32));
const patientMnemonic = dsl.newMnemonic(patientSeed);
const patient = await dsl.newAccount('patient-alice', patientMnemonic);

// Get patient DSL
const patientDsl = await dsl.account('patient-alice');

// Create health records registry
const healthRegistry = await patientDsl.createRegistry('health-records');

// Create health data schema
const healthSchema = await dsl.createSchema('blood-pressure', {
  title: 'Blood Pressure Reading',
  properties: {
    systolic: { type: 'number' },
    diastolic: { type: 'number' },
    date: { type: 'string', format: 'date-time' },
    notes: { type: 'string' },
  },
  required: ['systolic', 'diastolic', 'date'],
});

// Doctor creates account
const doctorSeed = crypto.getRandomValues(new Uint8Array(32));
const doctor = await dsl.newAccount('doctor-smith', dsl.newMnemonic(doctorSeed));

// Patient issues credential to themselves (self-asserted health data)
const bpReading = await healthRegistry.issue({
  schema: 'blood-pressure',
  holder: patient.aid, // Self-issued
  data: {
    systolic: 120,
    diastolic: 80,
    date: new Date().toISOString(),
    notes: 'Morning reading',
  },
  alias: 'bp-2024-10-06',
});

// Check credential status
const status = await bpReading.status();
console.log('Credential status:', status); // 'issued'

// View graph of patient's health records
const graph = await healthRegistry.graph();
console.log('Health records graph:', graph.nodes.length, 'nodes');
```

## Use Case 2: KYC Authority Issues Jurisdiction Credential

**Scenario**: Government KYC authority verifies a person and issues a jurisdiction credential.

```typescript
// KYC Authority setup
const kycSeed = crypto.getRandomValues(new Uint8Array(32));
const kycAuthority = await dsl.newAccount('kyc-authority-ca', dsl.newMnemonic(kycSeed));

// Get KYC authority DSL
const kycDsl = await dsl.account('kyc-authority-ca');

// Create KYC credentials registry
const kycRegistry = await kycDsl.createRegistry('jurisdiction-credentials');

// Create jurisdiction schema
await dsl.createSchema('jurisdiction-kyc', {
  title: 'Jurisdiction KYC',
  description: 'Government-issued jurisdiction verification',
  properties: {
    jurisdiction: { type: 'string' },
    verified: { type: 'boolean' },
    verificationDate: { type: 'string', format: 'date-time' },
    documentNumber: { type: 'string' },
    expiryDate: { type: 'string', format: 'date-time' },
  },
  required: ['jurisdiction', 'verified', 'verificationDate'],
});

// User creates account
const userSeed = crypto.getRandomValues(new Uint8Array(32));
const user = await dsl.newAccount('user-bob', dsl.newMnemonic(userSeed));

// KYC authority issues jurisdiction credential to user
const jurisdictionCred = await kycRegistry.issue({
  schema: 'jurisdiction-kyc',
  holder: user.aid,
  data: {
    jurisdiction: 'US-CA',
    verified: true,
    verificationDate: new Date().toISOString(),
    documentNumber: 'CA-DL-12345678',
    expiryDate: '2029-10-06T00:00:00Z',
  },
  alias: 'bob-jurisdiction-us-ca',
});

// Verify credential is issued
const status = await jurisdictionCred.status();
console.log('Jurisdiction credential:', status); // 'issued'

// View complete KYC graph (all issued credentials)
const graph = await kycRegistry.graph();
const acdcNodes = graph.nodes.filter(n => n.kind === 'ACDC');
console.log('Total jurisdic credentials issued:', acdcNodes.length);

// If needed, revoke credential
if (needsRevocation) {
  await jurisdictionCred.revoke();
  const newStatus = await jurisdictionCred.status();
  console.log('Updated status:', newStatus); // 'revoked'
}
```

## Use Case 3: Multi-Step Credential Flow

**Scenario**: University issues degree, employer verifies, issues employment credential.

```typescript
// University setup
const uniDsl = await dsl.account(
  await dsl.newAccount('stanford-university', dsl.newMnemonic(seed1))
);
const degreeRegistry = await uniDsl.createRegistry('degrees');

// Create degree schema
await dsl.createSchema('bachelor-degree', {
  title: 'Bachelor Degree',
  properties: {
    major: { type: 'string' },
    graduationYear: { type: 'number' },
    gpa: { type: 'number' },
  },
  required: ['major', 'graduationYear'],
});

// Student account
const student = await dsl.newAccount('alice', dsl.newMnemonic(seed2));

// University issues degree
const degree = await degreeRegistry.issue({
  schema: 'bachelor-degree',
  holder: student.aid,
  data: {
    major: 'Computer Science',
    graduationYear: 2024,
    gpa: 3.8,
  },
  alias: 'alice-stanford-bsc-2024',
});

// Employer setup
const employerDsl = await dsl.account(
  await dsl.newAccount('tech-corp', dsl.newMnemonic(seed3))
);
const employmentRegistry = await employerDsl.createRegistry('employees');

// Employer schema
await dsl.createSchema('employment-record', {
  title: 'Employment Record',
  properties: {
    position: { type: 'string' },
    startDate: { type: 'string' },
    department: { type: 'string' },
    degreeVerified: { type: 'boolean' },
  },
  required: ['position', 'startDate'],
});

// Employer issues employment credential after verifying degree
const employment = await employmentRegistry.issue({
  schema: 'employment-record',
  holder: student.aid,
  data: {
    position: 'Software Engineer',
    startDate: '2024-07-01',
    department: 'Engineering',
    degreeVerified: true, // Verified alice's degree
  },
  alias: 'alice-employment-techcorp',
});

// Alice now has credentials from multiple issuers
const aliceDsl = await dsl.account('alice');
const aliceGraph = await aliceDsl.graph();
console.log('Alice credentials:', aliceGraph.nodes.filter(n => n.kind === 'ACDC'));
```

## Use Case 4: Key Rotation

**Scenario**: User suspects key compromise and rotates keys.

```typescript
const userDsl = await dsl.account('alice');

// Check current KEL
let kel = await userDsl.getKel();
console.log('Current KEL:', kel.map(e => e.t)); // ['icp']

// Rotate to new keys
const newSeed = crypto.getRandomValues(new Uint8Array(32));
const newMnemonic = dsl.newMnemonic(newSeed);
await userDsl.rotateKeys(newMnemonic);

// Verify rotation in KEL
kel = await userDsl.getKel();
console.log('Updated KEL:', kel.map(e => e.t)); // ['icp', 'rot']

// Graph shows rotation event
const graph = await userDsl.graph();
const rotEvents = graph.nodes.filter(n =>
  n.kind === 'KEL_EVT' && n.meta?.t === 'rot'
);
console.log('Rotation events:', rotEvents.length); // 1
```

## Use Case 5: Managing Witnesses (Contacts)

**Scenario**: Set up witnesses for high-security credentials.

```typescript
const contactsDsl = dsl.contacts();

// Add witnesses
await contactsDsl.add('witness-primary', 'EWitness1AID...', {
  name: 'Primary Witness Server',
  role: 'witness',
  endpoint: 'https://witness1.example.com',
});

await contactsDsl.add('witness-backup', 'EWitness2AID...', {
  name: 'Backup Witness Server',
  role: 'witness',
  endpoint: 'https://witness2.example.com',
});

// List all witnesses
const witnesses = await contactsDsl.list();
console.log('Configured witnesses:', witnesses); // ['witness-primary', 'witness-backup']

// Get witness details
const primary = await contactsDsl.get('witness-primary');
console.log('Primary witness endpoint:', primary?.metadata?.endpoint);

// Remove witness if needed
await contactsDsl.remove('witness-backup');
```

## API Hierarchy

```
KeritsDSL
├── newMnemonic(seed) → Mnemonic
├── newAccount(alias, mnemonic) → Account
├── account(alias) → AccountDSL
│   ├── rotateKeys(mnemonic) → Account
│   ├── createRegistry(alias) → RegistryDSL
│   │   ├── issue(params) → ACDCDSL
│   │   │   ├── status() → CredentialStatus
│   │   │   ├── revoke()
│   │   │   └── graph() → Graph
│   │   ├── listACDCs() → string[]
│   │   ├── getTel() → TelEvent[]
│   │   └── graph() → Graph
│   ├── registry(alias) → RegistryDSL
│   ├── listRegistries() → string[]
│   ├── getKel() → KelEvent[]
│   └── graph() → Graph
├── createSchema(alias, schema) → SchemaDSL
│   ├── validate(data) → boolean
│   └── getSchema() → any
├── schema(alias) → SchemaDSL
├── contacts() → ContactsDSL
│   ├── add(alias, aid, metadata) → Contact
│   ├── get(alias) → Contact
│   ├── remove(alias)
│   ├── list() → string[]
│   └── getAll() → Contact[]
└── graph() → Graph
```

## Graph Visualization

Every DSL level provides a `graph()` method that returns a graph scoped to that context:

- **`dsl.graph()`** - Global graph (all events)
- **`accountDsl.graph()`** - Account-scoped (this account's KEL + anchored events)
- **`registryDsl.graph()`** - Registry-scoped (TEL + issued credentials)
- **`acdcDsl.graph()`** - Credential-scoped (single credential + related events)

### Graph Structure

```typescript
interface Graph {
  nodes: GraphNode[];  // AIDs, KEL_EVT, TEL_REGISTRY, TEL_EVT, ACDC, SCHEMA
  edges: GraphEdge[];  // PRIOR, ANCHOR, ISSUES, REVOKES, REFS, USES_SCHEMA
}
```

### Example: Visualize Credential Issuance Flow

```typescript
const graph = await kycRegistry.graph();

// Count node types
const counts = {
  aids: graph.nodes.filter(n => n.kind === 'AID').length,
  registries: graph.nodes.filter(n => n.kind === 'TEL_REGISTRY').length,
  credentials: graph.nodes.filter(n => n.kind === 'ACDC').length,
};

// Find issuance events
const issuances = graph.edges.filter(e => e.kind === 'ISSUES');
console.log(`Registry has issued ${issuances.length} credentials`);
```

## Storage Adapters

Works with any KV adapter:

```typescript
// In-memory (testing)
const memStore = createKerStore(new MemoryKv());

// On-disk (production)
const diskStore = createKerStore(new DiskKv({ baseDir: './data/keri' }));

// Use same DSL API with either
const dsl = createKeritsDSL(diskStore);
```

## Use Case 6: Export/Import KEL and TEL Data

**Scenario**: Share credentials between different systems or contacts using CESR bundles.

### Export KEL (Key Event Log)

```typescript
// Export account's KEL
const issuerDsl = await dsl.account('issuer');
const kelExport = await issuerDsl.export();

// Get as CESR bundle
const bundle = kelExport.asBundle();
console.log('Bundle type:', bundle.type); // 'kel'
console.log('Events:', bundle.events.length);

// Export as JSON for transfer
const json = kelExport.toJSON();
await kelExport.toFile('./exports/issuer-kel.json');

// Or get raw CESR events
const rawEvents = kelExport.asRaw(); // Uint8Array[]
```

### Export TEL (Transaction Event Log)

```typescript
// Export registry's TEL
const registryDsl = await issuerDsl.registry('health-records');
const telExport = await registryDsl.export();

// Save to file
await telExport.toFile('./exports/health-registry-tel.json');
```

### Export ACDC (Credential + Issuance Event)

```typescript
// Export specific credential with its issuance event
const acdcDsl = await registryDsl.acdc('patient-blood-pressure');
const acdcExport = await acdcDsl.export();

const bundle = acdcExport.asBundle();
console.log('ACDC bundle:', bundle.metadata.scope?.credentialId);

// Save for sharing
await acdcExport.toFile('./exports/bp-credential.json');
```

### Import from Another System

```typescript
// Create separate store for recipient
const recipientStore = createKerStore(new MemoryKv());
const recipientDsl = createKeritsDSL(recipientStore);

// Import KEL first (must exist before TEL)
const importDsl = recipientDsl.import();
const kelResult = await importDsl.fromFile('./exports/issuer-kel.json');
console.log('Imported KEL events:', kelResult.imported);

// Import TEL
const telResult = await importDsl.fromFile('./exports/health-registry-tel.json');
console.log('Imported TEL events:', telResult.imported);

// Import ACDC
const acdcResult = await importDsl.fromFile('./exports/bp-credential.json');
console.log('Imported credentials:', acdcResult.imported);

// Verify imported data
const kelEvents = await recipientStore.listKel(issuerAid);
console.log('Recipient now has KEL events:', kelEvents.length);
```

### Import Options

```typescript
// Skip events that already exist
await importDsl.fromBundle(bundle, { skipExisting: true });

// Verify signatures (future feature)
await importDsl.fromBundle(bundle, { verify: true });
```

### Import from Different Formats

```typescript
// From JSON string
const result1 = await importDsl.fromJSON(jsonString);

// From CESR bundle object
const result2 = await importDsl.fromBundle(cesrBundle);

// From raw CESR events
const result3 = await importDsl.fromRaw([event1, event2, event3]);

// From file
const result4 = await importDsl.fromFile('./data/export.json');
```

### Complete Sync Example

```typescript
// Issuer exports complete credential package
const issuerDsl = await dsl.account('health-provider');
const registryDsl = await issuerDsl.registry('patient-records');
const credentialDsl = await registryDsl.acdc('patient-123-vitals');

// Export all related data
const kelBundle = (await issuerDsl.export()).asBundle();
const telBundle = (await registryDsl.export()).asBundle();
const acdcBundle = (await credentialDsl.export()).asBundle();

// Patient imports into their system
const patientDsl = createKeritsDSL(patientStore);
const importer = patientDsl.import();

// Import in order: KEL → TEL → ACDC
await importer.fromBundle(kelBundle);
await importer.fromBundle(telBundle);
const result = await importer.fromBundle(acdcBundle);

console.log(`✓ Imported ${result.imported} events, ${result.skipped} skipped, ${result.failed} failed`);

// Patient can now query the credential
const imported = await patientStore.getEvent(credentialDsl.acdc.credentialId);
console.log('Credential available:', !!imported);
```

## API Hierarchy

```
KeritsDSL
├── newMnemonic(seed) → Mnemonic
├── newAccount(alias, mnemonic) → Account
├── account(alias) → AccountDSL
│   ├── rotateKeys(mnemonic) → Account
│   ├── createRegistry(alias) → RegistryDSL
│   │   ├── issue(params) → ACDCDSL
│   │   │   ├── status() → CredentialStatus
│   │   │   ├── revoke()
│   │   │   ├── graph() → Graph
│   │   │   └── export() → ExportDSL
│   │   ├── listACDCs() → string[]
│   │   ├── getTel() → TelEvent[]
│   │   ├── graph() → Graph
│   │   └── export() → ExportDSL
│   ├── registry(alias) → RegistryDSL
│   ├── listRegistries() → string[]
│   ├── getKel() → KelEvent[]
│   ├── graph() → Graph
│   └── export() → ExportDSL
├── createSchema(alias, schema) → SchemaDSL
│   ├── validate(data) → boolean
│   └── getSchema() → any
├── schema(alias) → SchemaDSL
├── contacts() → ContactsDSL
│   ├── add(alias, aid, metadata) → Contact
│   ├── get(alias) → Contact
│   ├── remove(alias)
│   ├── list() → string[]
│   └── getAll() → Contact[]
├── import() → ImportDSL
│   ├── fromBundle(bundle, opts) → ImportResult
│   ├── fromJSON(json, opts) → ImportResult
│   ├── fromRaw(events, opts) → ImportResult
│   └── fromFile(path, opts) → ImportResult
└── graph() → Graph
```

## Export/Import Types

```typescript
interface CESRBundle {
  type: 'kel' | 'tel' | 'acdc' | 'mixed';
  version: string;
  events: Uint8Array[];  // CESR-framed events
  metadata: {
    source?: string;      // AID of exporter
    created: string;      // ISO timestamp
    scope?: {
      aid?: string;       // For KEL bundles
      registryId?: string; // For TEL bundles
      credentialId?: string; // For ACDC bundles
    };
  };
}

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface ExportDSL {
  asBundle(): CESRBundle;
  asRaw(): Uint8Array[];
  toJSON(): string;
  toFile(path: string): Promise<void>;
}
```

## Next Steps

- Witness coordination and receipts
- Delegation and multi-sig support
- Receipt verification and validation
- Contact sync tracking (SAID/SeqNo pointers)
