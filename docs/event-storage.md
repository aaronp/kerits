# Event Storage and Chain Integrity

## Overview

The KerStore storage layer maintains KERI event chains (KEL and TEL) with proper SAID-based linking and indexing. This document explains how events are stored, indexed, and retrieved.

## Key Concepts

### SAIDs (Self-Addressing Identifiers)

Every KERI event has a SAID - a cryptographic digest of the event that serves as its unique identifier. The SAID is stored in the event's `d` field.

### Prior Links

Events in a KEL or TEL chain are linked via the `p` (prior) field, which contains the SAID of the previous event in the chain. This creates a tamper-evident hash chain.

### Sequence Numbers

Events have sequence numbers (`s` field) that are **stored as hexadecimal strings** per the KERI spec:
- Sequence 0: `"0"`
- Sequence 10: `"a"`
- Sequence 255: `"ff"`

## Storage Schema

The KerStore uses a namespaced key-value structure:

```
ev/{said}                     → StoredEvent (raw CESR bytes + metadata)
meta/{said}                   → EventMeta (parsed SAD fields)
att/{said}/{n}                → Attachment (signatures, seals, receipts)
idx/kel/{aid}/{seq}           → SAID (KEL index by AID and sequence)
idx/tel/{ri}/{said}           → timestamp (TEL index by registry)
idx/prev/{prior_said}         → SAID (prior index for chain traversal)
map/alias2id/{scope}/{alias}  → ID (alias resolution)
map/id2alias/{scope}/{id}     → alias (reverse alias lookup)
```

## Event Chain Integrity

### KEL (Key Event Log)

KEL events follow this chain structure:

```
ICP (seq=0) ──prior──> IXN (seq=1) ──prior──> IXN (seq=2) ──prior──> ...
   d: E123...              d: E456...              d: E789...
   p: (none)               p: E123...              p: E456...
   s: "0"                  s: "1"                  s: "2"
```

### TEL (Transaction Event Log)

TEL events anchor in the KEL via seals:

```
KEL: IXN (seq=1) ─────anchors─────> VCP (Registry Inception)
         a: [{                          d: E999...
           i: E999... (registry ID)     ri: E999...
           d: E999... (VCP SAID)
         }]
                                    ──prior──> ISS (Credential Issuance)
                                                  d: Exxx...
                                                  p: E999...
                                                  ri: E999...
                                                  i: Eabc... (ACDC SAID)
```

## Critical Implementation Details

### ⚠️ Hex Sequence Number Parsing

Sequence numbers MUST be parsed as hexadecimal when retrieving from storage:

```typescript
// ✅ CORRECT
const s = parseInt(hexSeq, 16);

// ❌ WRONG - will break for seq ≥ 10
const s = parseInt(hexSeq, 10);
```

**Why**: KERI stores sequence numbers as hex strings. If you parse "a" as decimal, you get `NaN`, causing events with seq ≥ 10 to be silently dropped.

### Prior Chain Validation

When retrieving a KEL or TEL:

1. Events MUST be ordered by sequence number
2. Each event's `p` field MUST match the prior event's `d` field
3. The first event (ICP/VCP) has no prior (`p` is undefined)

### Graph Building

The graph builder creates visual representations of event relationships:

- **KEL_EVT nodes**: Individual key events (ICP, ROT, IXN)
- **TEL_REGISTRY nodes**: Registry inception events (VCP)
- **TEL_EVT nodes**: Transaction events (ISS, REV, etc.)
- **ACDC nodes**: Credential references
- **PRIOR edges**: Link events in sequence order
- **ANCHOR edges**: Link KEL IXN events to registries they anchor

## Testing

See `test/storage-chain-integrity.test.ts` for comprehensive tests covering:

1. Event storage with correct SAIDs
2. Prior chain integrity
3. Hex sequence number handling
4. Graph building and edge relationships

### Running Tests

```bash
bun test test/storage-chain-integrity.test.ts
```

Expected output shows proper chain linking:

```
KEL events: [
  { t: "icp", s: "0", d: "EJeQEz...", p: undefined },
  { t: "ixn", s: "1", d: "EAm4-m...", p: "EJeQEz..." },
  { t: "ixn", s: "2", d: "EPq648...", p: "EAm4-m..." }
]
```

## Common Issues

### Issue: Events with seq ≥ 10 not appearing in KEL

**Symptom**: `listKel()` returns fewer events than expected

**Cause**: Sequence numbers parsed as decimal instead of hex

**Fix**: Ensure `parseInt(seq, 16)` is used when parsing sequence numbers from index keys

### Issue: Graph shows incorrect prior relationships

**Symptom**: "IXN #3" shows prior "EKqiN..." which doesn't match "IXN #2" SAID

**Cause**: Graph builder incorrectly linking events, or events stored with wrong prior SAIDs

**Fix**: Verify each event's `p` field matches the actual SAID of the previous event

## Best Practices

1. **Always verify chain integrity** after creating events
2. **Use `getByPrior()`** to traverse chains forward
3. **Check SAIDs match** between event creation and storage
4. **Log sequence numbers in hex** for debugging
5. **Test with seq > 10** to catch decimal parsing bugs

## Example: Creating a Valid Chain

```typescript
import { createKerStore } from './storage/core';
import { MemoryKv } from './storage/adapters/memory';
import { incept } from './incept';
import { interaction } from './interaction';
import { serializeEvent } from './app/dsl/utils/serialization';

const kv = new MemoryKv();
const store = createKerStore(kv);

// Create inception
const icp = incept({
  keys: ['DKxy2sgzfplyr-tgwIxS19f2OchFHtLwPWD3v4oYimBx'],
  ndigs: ['ELYk1bLRCb3IEUOr1ufLkp9y0oqM7PKXZWM7RRYbvhTl'],
});
await store.putEvent(serializeEvent(icp.ked));

// Create interaction (note: dig = icp.ked.d, NOT icp.sad.d)
const ixn = interaction({
  pre: icp.pre,
  sn: 1,
  dig: icp.ked.d,  // ✅ CORRECT: Use .ked.d
  seals: [],
});
await store.putEvent(serializeEvent(ixn.ked));

// Verify chain
const kel = await store.listKel(icp.pre);
console.log('Chain valid:', kel[1].meta.p === kel[0].meta.d); // true
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         KerStore                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  putEvent()                                           │  │
│  │    ↓                                                  │  │
│  │  1. Parse CESR → Extract SAD + Attachments           │  │
│  │  2. Compute/Verify SAID                              │  │
│  │  3. Store:                                            │  │
│  │     - ev/{said} ← Raw event                          │  │
│  │     - meta/{said} ← Parsed metadata                  │  │
│  │     - idx/kel/{aid}/{s} ← KEL index (s is HEX!)     │  │
│  │     - idx/prev/{p} ← Prior index                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  listKel(aid)                                         │  │
│  │    ↓                                                  │  │
│  │  1. List idx/kel/{aid}/*                             │  │
│  │  2. Parse sequence as HEX (parseInt(seq, 16))        │  │
│  │  3. Sort by numeric sequence                          │  │
│  │  4. Fetch events by SAID                             │  │
│  │  5. Return ordered chain                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  buildGraph()                                         │  │
│  │    ↓                                                  │  │
│  │  1. List all events                                   │  │
│  │  2. Create nodes (AID, KEL_EVT, TEL_REGISTRY, ACDC)  │  │
│  │  3. Create edges:                                     │  │
│  │     - PRIOR: From p field                            │  │
│  │     - ANCHOR: From ixn seals (a field)               │  │
│  │     - ISSUES: From TEL iss events                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Related Files

- `src/storage/core.ts` - Core storage implementation (FIXED: hex parsing)
- `src/storage/graph.ts` - Graph builder (FIXED: ixn seal parsing)
- `src/storage/parser.ts` - CESR parser
- `test/storage-chain-integrity.test.ts` - Comprehensive tests
- `ui/src/components/graph/GraphTableView.tsx` - Visual table view
- `ui/src/components/graph/NetworkGraph.tsx` - Graph visualization
