# Storage Key Design

## Problem

The current storage layer uses flat string keys like `"ev/ESAID123"` which:
1. Loses type information (is this a KEL event or TEL event?)
2. Mixes KERI primitives with application metadata
3. Makes it hard for KV implementations to optimize storage (SQL tables, IndexedDB stores, etc.)
4. Doesn't preserve file extensions (.cesr, .json) on disk

## Solution: Structured Keys

### Key Type Definition

```typescript
/**
 * Structured storage key that can be interpreted by different KV implementations
 */
export type StorageKey = {
  /** Path segments (e.g., ['kel', 'EAID123', 'ESAID456']) */
  path: string[];

  /** Optional type hint for KV implementation */
  type?: 'cesr' | 'json' | 'text';

  /** Optional metadata for KV optimization */
  meta?: {
    /** Event type for CESR files (icp, rot, ixn, vcp, iss, rev) */
    eventType?: string;
    /** Whether this is immutable content-addressed data */
    immutable?: boolean;
    /** Suggested index keys for query optimization */
    indexes?: string[];
  };
};
```

## Storage Layout

### 1. KERI Primitives (immutable, content-addressed)

```
kel/{AID}/{EVENT_SAID}
  path: ['kel', 'EAID...', 'ESAID...']
  type: 'cesr'
  meta: { eventType: 'icp'|'rot'|'ixn', immutable: true }
  → On disk: .keri/kel/EAID.../ESAID....icp.cesr

tel/{REGISTRY_ID}/{EVENT_SAID}
  path: ['tel', 'EREG...', 'ESAID...']
  type: 'cesr'
  meta: { eventType: 'vcp'|'iss'|'rev', immutable: true }
  → On disk: .keri/tel/EREG.../ESAID....iss.cesr

acdc/{ACDC_SAID}
  path: ['acdc', 'EACDC...']
  type: 'json'
  meta: { immutable: true }
  → On disk: .keri/acdc/EACDC....json

schema/{SCHEMA_SAID}
  path: ['schema', 'ESCHEMA...']
  type: 'json'
  meta: { immutable: true }
  → On disk: .keri/schema/ESCHEMA....json
```

### 2. Application Metadata (mutable)

```
meta/{SAID}
  path: ['meta', 'ESAID...']
  type: 'json'
  meta: { immutable: false }
  → On disk: .keri/meta/ESAID....json
  → Content: { t: 'icp', d: 'ESAID...', i: 'EAID...', ... }

head/kel/{AID}
  path: ['head', 'kel', 'EAID...']
  type: 'text'
  → On disk: .keri/head/kel/EAID...
  → Content: "ESAID..." (latest event SAID)

head/tel/{REGISTRY_ID}
  path: ['head', 'tel', 'EREG...']
  type: 'text'
  → On disk: .keri/head/tel/EREG...
```

### 3. Indexes (for queries)

```
idx/kel/{AID}/{SEQ}
  path: ['idx', 'kel', 'EAID...', '0']
  type: 'text'
  meta: { indexes: ['aid', 'seq'] }
  → On disk: .keri/idx/kel/EAID.../0
  → Content: "ESAID..." (event SAID at sequence 0)

idx/tel/{REGISTRY_ID}/{EVENT_SAID}
  path: ['idx', 'tel', 'EREG...', 'ESAID...']
  type: 'text'
  → On disk: .keri/idx/tel/EREG.../ESAID...
  → Content: "2025-10-07T..." (timestamp)

idx/prev/{PRIOR_SAID}
  path: ['idx', 'prev', 'ESAID...']
  type: 'text'
  → On disk: .keri/idx/prev/ESAID...
  → Content: "ENEXTSAID..." (next event SAID)
```

### 4. Aliases (human-readable names)

```
alias/kel/{ALIAS}
  path: ['alias', 'kel', 'alice']
  type: 'text'
  → On disk: .keri/alias/kel/alice
  → Content: "EAID..." (AID)

alias/tel/{ALIAS}
  path: ['alias', 'tel', 'credentials']
  type: 'text'
  → On disk: .keri/alias/tel/credentials
  → Content: "EREG..." (registry ID)

alias/schema/{ALIAS}
  path: ['alias', 'schema', 'degree']
  type: 'text'
  → On disk: .keri/alias/schema/degree
  → Content: "ESCHEMA..." (schema SAID)
```

## KV Implementation Strategies

### Memory KV
```typescript
// Flatten to string key
const key = storageKey.path.join('/');
map.set(key, value);
```

### Disk KV
```typescript
// Use path + type to create proper file structure
const dirPath = path.join(baseDir, ...storageKey.path.slice(0, -1));
const fileName = storageKey.path[storageKey.path.length - 1];
const ext = storageKey.type === 'cesr' ? '.cesr' :
            storageKey.type === 'json' ? '.json' : '';
const eventTypeExt = storageKey.meta?.eventType ? `.${storageKey.meta.eventType}` : '';
const fullPath = path.join(dirPath, fileName + eventTypeExt + ext);
```

### SQL KV
```typescript
// Use path[0] to route to table
switch (storageKey.path[0]) {
  case 'kel':
    // INSERT INTO kel_events (aid, said, event_type, data) VALUES (...)
    break;
  case 'tel':
    // INSERT INTO tel_events (registry_id, said, event_type, data) VALUES (...)
    break;
  case 'acdc':
    // INSERT INTO acdcs (said, data) VALUES (...)
    break;
  case 'idx':
    // Route to appropriate index table
    break;
}
```

### IndexedDB KV
```typescript
// Use path[0] as object store name
const storeName = storageKey.path[0];
const key = storageKey.path.slice(1).join('/');
const store = db.transaction(storeName, 'readwrite').objectStore(storeName);
store.put({ key, value });
```

## Migration Path

### Phase 1: Add StorageKey type (backward compatible)
```typescript
export interface Kv {
  // Old methods (keep for compatibility)
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, value: Uint8Array): Promise<void>;

  // New methods (with structured keys)
  getStructured?(key: StorageKey): Promise<Uint8Array | null>;
  putStructured?(key: StorageKey, value: Uint8Array): Promise<void>;
}
```

### Phase 2: Update KerStore to use structured keys internally
```typescript
async putEvent(raw: Uint8Array): Promise<PutResult> {
  const parsed = this.parser.parse(raw);
  const said = parsed.meta.d;

  // Determine event type and construct structured key
  const isKel = ['icp', 'rot', 'ixn'].includes(parsed.meta.t);
  const isTel = ['vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'].includes(parsed.meta.t);

  let eventKey: StorageKey;
  if (isKel) {
    eventKey = {
      path: ['kel', parsed.meta.i!, said],
      type: 'cesr',
      meta: { eventType: parsed.meta.t, immutable: true }
    };
  } else if (isTel) {
    eventKey = {
      path: ['tel', parsed.meta.ri!, said],
      type: 'cesr',
      meta: { eventType: parsed.meta.t, immutable: true }
    };
  }

  // Use structured key if available, fall back to string
  if (this.kv.putStructured) {
    await this.kv.putStructured(eventKey, raw);
  } else {
    await this.kv.put(eventKey.path.join('/'), raw);
  }
}
```

### Phase 3: Migrate existing KV implementations
1. Update MemoryKv to support structured keys (simple flatten)
2. Update DiskKv to create proper directory structure with extensions
3. Add SqlKv with table-based storage
4. Add IndexedDBKv for browser storage

### Phase 4: Remove old string-based methods
Once all implementations support structured keys, remove the old methods.

## Benefits

1. **Type Safety**: KERI primitives (.cesr) clearly separated from metadata (.json)
2. **Storage Flexibility**: Each KV can optimize based on key structure
3. **File Extensions**: Disk storage gets proper .cesr, .json, .icp.cesr extensions
4. **Query Optimization**: SQL/IndexedDB can create indexes based on path structure
5. **Clarity**: Path array makes hierarchy explicit
6. **Immutability Hints**: KV can optimize based on immutable flag

## Example: Disk Layout After Migration

```
.keri/
  kel/
    EAID123.../
      ESAID1.icp.cesr
      ESAID2.rot.cesr
      ESAID3.ixn.cesr

  tel/
    EREG456.../
      ESAID4.vcp.cesr
      ESAID5.iss.cesr
      ESAID6.rev.cesr

  acdc/
    EACDC789.json

  schema/
    ESCHEMA111.json

  meta/
    ESAID1.json
    ESAID2.json

  head/
    kel/
      EAID123...        # contains "ESAID3"
    tel/
      EREG456...        # contains "ESAID6"

  idx/
    kel/
      EAID123.../
        0               # contains "ESAID1"
        1               # contains "ESAID2"
    tel/
      EREG456.../
        ESAID5          # contains "2025-10-07..."

  alias/
    kel/
      alice             # contains "EAID123"
    tel/
      credentials       # contains "EREG456"
```

This matches the design.md specification while keeping the storage layer flexible!
