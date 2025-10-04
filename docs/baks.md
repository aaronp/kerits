# Backer Management (Registry Rotation)

## Overview

In KERI, "backers" are entities authorized to co-sign registry events. Backer management is handled through **Registry Rotation (VRT)** events, not a separate "baks" event type.

The `vrt` event type allows:
- Adding new backers to a registry
- Removing existing backers from a registry
- Updating the signing threshold
- Performing combinations of the above operations

## Implementation

### Core Function

The primary function for backer management is [`registryRotate()`](../src/tel.ts#L452) in [kerits/src/tel.ts](../src/tel.ts).

```typescript
export interface RegistryRotationOptions {
  regk: string;      // Registry identifier
  dig: string;       // Prior event digest
  sn: number;        // Sequence number
  toad?: number;     // Threshold of accountable duplicity (optional)
  adds?: string[];   // Backers to add (optional)
  cuts?: string[];   // Backers to remove (optional)
}

export function registryRotate(options: RegistryRotationOptions): RegistryRotation
```

### Event Structure

A `vrt` event contains:

```json
{
  "v": "KERI10JSON0000ed_",  // Version string
  "t": "vrt",                // Event type (registry rotation)
  "d": "E...",               // SAID of this event
  "i": "E...",               // Registry identifier (regk)
  "p": "E...",               // Prior event digest
  "s": "1",                  // Sequence number (hex)
  "bt": "1",                 // Backer threshold (hex)
  "br": [],                  // Backers to remove (cuts)
  "ba": ["BKRa..."]          // Backers to add (adds)
}
```

### Field Descriptions

- **bt (Backer Threshold)**: Minimum number of backer signatures required, stored as hex string
- **br (Backer Removal/Cuts)**: Array of backer identifiers to remove from the registry
- **ba (Backer Addition/Adds)**: Array of backer identifiers to add to the registry

## Usage Examples

### 1. Add First Backer

```typescript
import { registryRotate } from './src/tel.ts';

const result = registryRotate({
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'ELZpzaM7ZaXo9HLvRcjQhQ5Rb1z0tXqZF5wX6dTj3hqY',
  sn: 1,
  adds: ['BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8'],
  toad: 1
});
```

### 2. Add Multiple Backers

```typescript
const result = registryRotate({
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'EKs8vu6F9BvLZpAWhSNNQV5e1tQmJo2z8H4YrXgD2fPo',
  sn: 1,
  adds: [
    'BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8',
    'BNg7fRaZp3FkT8qLxM9WvYnH2cDjEsK6uO1pQ4rS5tU'
  ],
  toad: 2  // Require 2 signatures
});
```

### 3. Remove a Backer

```typescript
const result = registryRotate({
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'EKs8vu6F9BvLZpAWhSNNQV5e1tQmJo2z8H4YrXgD2fPo',
  sn: 1,
  cuts: ['BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8'],
  toad: 0  // No backers required after removal
});
```

### 4. Replace Backers (Add and Remove Simultaneously)

```typescript
const result = registryRotate({
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'EKs8vu6F9BvLZpAWhSNNQV5e1tQmJo2z8H4YrXgD2fPo',
  sn: 1,
  cuts: ['BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8'],  // Remove old
  adds: ['BXyZ9pQrS5tU7vW8xA1bC2dE3fG4hI6jK8lM9nO0pQ'],  // Add new
  toad: 1
});
```

### 5. Update Threshold Only

```typescript
const result = registryRotate({
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'EKs8vu6F9BvLZpAWhSNNQV5e1tQmJo2z8H4YrXgD2fPo',
  sn: 1,
  toad: 2  // Increase threshold from 1 to 2
});
```

## Validation Rules

The `registryRotate()` function enforces:

1. **No Duplicates**: Neither `adds` nor `cuts` may contain duplicate identifiers
2. **No Overlap**: `adds` and `cuts` must be disjoint sets (no identifier can appear in both)
3. **Auto-Threshold**: If `toad` is not specified, it's computed using the `ample()` function: `f = (n-1)/3, m = f+1` where n is the number of backers

## Keripy Compatibility

The kerits implementation matches keripy's `eventing.rotate()` function:

```python
from keri.vdr import eventing

serder = eventing.rotate(
    regk='EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
    dig='ELZpzaM7ZaXo9HLvRcjQhQ5Rb1z0tXqZF5wX6dTj3hqY',
    sn=1,
    baks=[],        # Existing backers (not included in output)
    adds=['BKRa...'], # Backers to add
    cuts=[],        # Backers to remove
    toad=1          # Threshold
)
```

**Field Mapping**:
- `regk` → `i` (registry identifier)
- `dig` → `p` (prior event digest)
- `sn` → `s` (sequence number, hex-encoded)
- `toad` → `bt` (backer threshold, hex-encoded)
- `adds` → `ba` (backer additions)
- `cuts` → `br` (backer removals)

## Test Coverage

All backer rotation scenarios are tested in [testgen/test-cases/](../../testgen/test-cases/):

- `test_tel_vrt_001.json`: Add first backer
- `test_tel_vrt_002.json`: Add multiple backers
- `test_tel_vrt_003.json`: Remove a backer
- `test_tel_vrt_004.json`: Replace backers (simultaneous add/remove)
- `test_tel_vrt_005.json`: Update threshold only

**Test Results**: 5/5 tests passing (100%)

## Architecture Notes

### SAID Computation

Like all KERI events, `vrt` uses Self-Addressing IDentifiers:

1. Create event with SAID placeholder (`'#' * 44`)
2. Compute Blake3-256 hash of serialized event
3. Replace placeholder with hash to get final SAID

This is handled by the [`saidify()`](../src/said.ts) function.

### Version Strings

Version strings follow KERI format: `KERI10JSON0000ed_`
- Protocol: KERI
- Version: 1.0
- Serialization: JSON
- Size: Hex-encoded byte count (e.g., `ed` = 237 bytes)

Generated by [`versify()`](../src/versify.ts).

### Hex Encoding

Sequence numbers and thresholds are stored as hex strings:
- `sn: 1` → `"s": "1"`
- `sn: 15` → `"s": "f"`
- `sn: 16` → `"s": "10"`

## Related Functions

- [`registryIncept()`](../src/tel.ts#L169): Create initial registry (vcp event)
- [`issue()`](../src/tel.ts#L219): Issue credential (iss event)
- [`revoke()`](../src/tel.ts#L269): Revoke credential (rev event)
- [`interact()`](../src/tel.ts#L357): Registry interaction (ixn event)
- [`ample()`](../src/tel.ts#L422): Compute default threshold

## See Also

- [TEL Documentation](./tel.md): Complete TEL implementation overview
- [KERI Spec](https://github.com/WebOfTrust/keripy): Official KERI specification
