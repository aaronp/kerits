# Storage Layer Refactoring Plan

## Overview

This document outlines the plan to modernize the storage layer to align with `design.md`, using structured keys throughout and removing backward compatibility with string-based keys.

## Goals

1. **Separate KERI primitives from metadata** - CESR events stored as raw bytes, metadata as JSON
2. **Proper file extensions** - `.binary.cesr`, `.text.cesr`, `.json`
3. **Hierarchical storage** - Clean directory structure matching design
4. **Type safety** - StorageKey everywhere, no more string concatenation
5. **HEAD tracking** - Track latest event in each chain
6. **Content-addressable ACDC** - Store credentials by SAID
7. **Clean aliases** - `alias/kel/alice` instead of `map/alias2id/kel/alice`

## Storage Structure (New)

```
.keri/
  kel/
    {AID}/
      {SAID}.{eventType}.{encoding}.cesr    # Raw CESR event bytes

  tel/
    {REGISTRY_ID}/
      {SAID}.{eventType}.{encoding}.cesr    # Raw CESR event bytes

  acdc/
    {SAID}.json                              # Credential JSON

  schema/
    {SAID}.json                              # Schema JSON

  meta/
    {SAID}.json                              # Event metadata (t, d, i, s, p, etc.)

  head/
    kel/{AID}                                # Latest event SAID (text)
    tel/{REGISTRY_ID}                        # Latest event SAID (text)

  idx/
    kel/{AID}/{SEQ}                          # Sequence -> SAID mapping (text)
    tel/{REGISTRY_ID}/{SAID}                 # Event timestamp index (text)
    prev/{PRIOR_SAID}                        # Prior -> Next mapping (text)

  alias/
    kel/{ALIAS}                              # Alias -> AID mapping (text)
    tel/{ALIAS}                              # Alias -> Registry ID mapping (text)
    schema/{ALIAS}                           # Alias -> Schema SAID mapping (text)
    acdc/{ALIAS}                             # Alias -> Credential SAID mapping (text)
```

## File Extension Conventions

### CESR Events
- **Binary encoding**: `{SAID}.{eventType}.binary.cesr`
  - Contains raw CESR bytes
  - Example: `ESAID123.icp.binary.cesr`
- **Text encoding**: `{SAID}.{eventType}.text.cesr`
  - Contains text-encoded CESR
  - Example: `ESAID123.rot.text.cesr`

### JSON Data
- **Metadata**: `{SAID}.json` in `meta/` directory
- **ACDCs**: `{SAID}.json` in `acdc/` directory
- **Schemas**: `{SAID}.json` in `schema/` directory

### Text Data
- **Aliases**: No extension, plain text SAID or ID
- **HEAD pointers**: No extension, plain text SAID
- **Index mappings**: No extension, plain text SAID or timestamp

## Refactoring Steps

### Phase 1: Core Types ✅ Complete
- [x] Add `CesrEncoding` type
- [x] Add `cesrEncoding` to StorageKey.meta
- [x] Update DiskKv to handle encoding variants
- [x] Test CESR encoding variants

### Phase 2: New KerStore2 (No Breaking Changes)
Create a new `KerStore2` alongside existing `KerStore`:

```typescript
// New store that uses structured keys exclusively
export function createKerStore2(kv: Kv, opts?: StoreOptions): KerStore2 {
  // Implementation using structured keys
}

export interface KerStore2 {
  // Event storage (raw CESR)
  putEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  getEvent(said: SAID): Promise<{ raw: Uint8Array; meta: EventMeta } | null>;

  // KEL operations
  putKelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  listKel(aid: AID, fromS?: number, toS?: number): Promise<KelEvent[]>;
  getKelHead(aid: AID): Promise<SAID | null>;

  // TEL operations
  putTelEvent(raw: Uint8Array, encoding?: CesrEncoding): Promise<PutResult>;
  listTel(ri: SAID, fromS?: number): Promise<TelEvent[]>;
  getTelHead(ri: SAID): Promise<SAID | null>;

  // ACDC operations (content-addressable)
  putACDC(acdc: any): Promise<SAID>;
  getACDC(said: SAID): Promise<any | null>;

  // Schema operations
  putSchema(schema: any): Promise<SAID>;
  getSchema(said: SAID): Promise<any | null>;

  // Alias operations
  putAlias(scope: 'kel' | 'tel' | 'schema' | 'acdc', said: SAID, alias: string): Promise<void>;
  getAliasSaid(scope: 'kel' | 'tel' | 'schema' | 'acdc', alias: string): Promise<SAID | null>;
  getSaidAlias(scope: 'kel' | 'tel' | 'schema' | 'acdc', said: SAID): Promise<string | null>;
  listAliases(scope: 'kel' | 'tel' | 'schema' | 'acdc'): Promise<string[]>;

  // Graph building (unchanged)
  buildGraph(opts?: GraphOptions): Promise<Graph>;
}
```

**Key changes:**
1. `putEvent()` takes optional `encoding` parameter
2. Stores raw CESR in `kel/` or `tel/` directories
3. Stores metadata separately in `meta/`
4. Implements HEAD tracking
5. Implements ACDC content-addressable storage
6. Simplified alias API

### Phase 3: Migrate DSL Layer
Update DSL builders to use `KerStore2`:

```typescript
// In createKeritsDSL()
export function createKeritsDSL(store: KerStore2): KeritsDSL {
  // Use store.putKelEvent(), store.getKelHead(), etc.
}
```

### Phase 4: Update Tests
Migrate all tests to use `KerStore2` and verify:
- [ ] Raw CESR bytes stored correctly
- [ ] Metadata stored separately
- [ ] HEAD tracking works
- [ ] ACDC storage works
- [ ] Aliases work with new format
- [ ] All existing functionality preserved

### Phase 5: Remove Old Code
Once everything works with `KerStore2`:
1. Delete old `KerStore` implementation
2. Rename `KerStore2` to `KerStore`
3. Remove string-based KV methods from interface
4. Update all references

## Implementation Details

### putEvent() - New Implementation

```typescript
async function putEvent(
  rawCesr: Uint8Array,
  encoding: CesrEncoding = 'binary'
): Promise<PutResult> {
  const parsed = parser.parse(rawCesr);
  const { meta } = parsed;

  if (!meta.t || !meta.d) throw new Error("Missing t or d in event");
  const said = meta.d;
  const now = clock();

  // Determine if KEL or TEL event
  const isKel = ['icp', 'rot', 'ixn'].includes(meta.t);
  const isTel = ['vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'].includes(meta.t);

  // Build storage key for raw CESR
  let eventKey: StorageKey;
  if (isKel) {
    if (!meta.i) throw new Error("KEL event missing AID (i)");
    eventKey = {
      path: ['kel', meta.i, said],
      type: 'cesr',
      meta: {
        eventType: meta.t,
        cesrEncoding: encoding,
        immutable: true
      }
    };
  } else if (isTel) {
    if (!meta.ri) throw new Error("TEL event missing registry ID (ri)");
    eventKey = {
      path: ['tel', meta.ri, said],
      type: 'cesr',
      meta: {
        eventType: meta.t,
        cesrEncoding: encoding,
        immutable: true
      }
    };
  } else {
    throw new Error(`Unknown event type: ${meta.t}`);
  }

  // Store raw CESR
  await kv.putStructured!(eventKey, rawCesr);

  // Store metadata separately
  const metaKey: StorageKey = {
    path: ['meta', said],
    type: 'json'
  };
  await kv.putStructured!(metaKey, encodeJson(meta));

  // Update HEAD pointer
  if (isKel && meta.i) {
    const headKey: StorageKey = {
      path: ['head', 'kel', meta.i],
      type: 'text'
    };
    await kv.putStructured!(headKey, utf8Encode(said));
  } else if (isTel && meta.ri) {
    const headKey: StorageKey = {
      path: ['head', 'tel', meta.ri],
      type: 'text'
    };
    await kv.putStructured!(headKey, utf8Encode(said));
  }

  // Update indexes
  if (meta.i && meta.s) {
    const idxKey: StorageKey = {
      path: ['idx', 'kel', meta.i, meta.s],
      type: 'text'
    };
    await kv.putStructured!(idxKey, utf8Encode(said));
  }

  if (meta.ri && isTel) {
    const idxKey: StorageKey = {
      path: ['idx', 'tel', meta.ri, said],
      type: 'text'
    };
    await kv.putStructured!(idxKey, utf8Encode(now));
  }

  if (meta.p) {
    const prevKey: StorageKey = {
      path: ['idx', 'prev', meta.p],
      type: 'text'
    };
    await kv.putStructured!(prevKey, utf8Encode(said));
  }

  return { said, meta };
}
```

### getEvent() - New Implementation

```typescript
async function getEvent(said: SAID): Promise<{ raw: Uint8Array; meta: EventMeta } | null> {
  // Get metadata first to determine path
  const metaKey: StorageKey = {
    path: ['meta', said],
    type: 'json'
  };

  const metaBytes = await kv.getStructured!(metaKey);
  if (!metaBytes) return null;

  const meta = decodeJson<EventMeta>(metaBytes);

  // Determine path based on event type
  const isKel = ['icp', 'rot', 'ixn'].includes(meta.t);
  const isTel = ['vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'].includes(meta.t);

  let eventKey: StorageKey;
  if (isKel && meta.i) {
    eventKey = {
      path: ['kel', meta.i, said],
      type: 'cesr'
      // encoding will be detected from filename
    };
  } else if (isTel && meta.ri) {
    eventKey = {
      path: ['tel', meta.ri, said],
      type: 'cesr'
    };
  } else {
    throw new Error(`Cannot determine path for event ${said}`);
  }

  const raw = await kv.getStructured!(eventKey);
  if (!raw) return null;

  return { raw, meta };
}
```

## Migration Strategy

1. **Dual Store Period**: Run both `KerStore` and `KerStore2` side-by-side
2. **Test Coverage**: Ensure 100% test coverage for `KerStore2`
3. **Gradual Migration**: Migrate DSL layer one module at a time
4. **Verification**: Compare outputs between old and new implementations
5. **Cutover**: Once all tests pass with `KerStore2`, remove `KerStore`

## Benefits

1. **Clean Separation**: KERI primitives vs application metadata
2. **Type Safety**: No string concatenation, all structured keys
3. **Flexibility**: Easy to add SQL, IndexedDB implementations
4. **Clarity**: File extensions show exactly what's inside
5. **Performance**: Can optimize based on immutability hints
6. **Standards Compliance**: CESR files contain pure CESR

## Testing Plan

- [ ] Unit tests for all `KerStore2` methods
- [ ] Integration tests with DiskKv
- [ ] Migration tests (old format -> new format)
- [ ] Performance benchmarks
- [ ] File format verification (binary vs text CESR)

## Timeline

- **Week 1**: Implement `KerStore2` core functions
- **Week 2**: Migrate DSL layer and tests
- **Week 3**: Verification and performance testing
- **Week 4**: Remove old code and cleanup

## Success Criteria

✅ All tests pass with `KerStore2`
✅ File structure matches design.md
✅ Raw CESR bytes stored correctly
✅ Metadata stored separately as JSON
✅ HEAD tracking implemented
✅ ACDC content-addressable storage works
✅ Zero regressions in functionality
✅ Performance equal or better than old implementation
