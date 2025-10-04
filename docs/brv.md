# Backer Revocation (brv)

## Purpose

Backer revocation events (`brv`) are used when revoking a verifiable credential that was issued via backer issuance (`bis`). Backer revocation requires signatures from the registry's backers to authorize the credential revocation.

## When to Use

Use `brv` instead of `rev` when:
- The credential was issued using `bis` (backer issuance)
- The registry has backers configured
- The credential revocation requires authorization from the backing entities

## Implementation

### Core Function

[`backerRevoke()`](../src/tel.ts#L650) in [kerits/src/tel.ts](../src/tel.ts)

```typescript
export interface BackerRevocationOptions {
  vcdig: string;   // Credential SAID
  regk: string;    // Registry identifier
  regsn: number;   // Registry event sequence number
  regd: string;    // Registry event digest
  dig: string;     // Prior event digest
  dt?: string;     // Revocation datetime (ISO 8601)
}

export function backerRevoke(options: BackerRevocationOptions): BackerRevocation
```

### Event Structure

```json
{
  "v": "KERI10JSON00015a_",  // Version string
  "t": "brv",                // Event type (backer revocation)
  "d": "E...",               // SAID of this event
  "i": "E...",               // Credential SAID (vcdig)
  "s": "1",                  // Sequence number (always 1 for revocation)
  "p": "E...",               // Prior event digest (the bis event)
  "ra": {                    // Registry anchor seal
    "i": "E...",             // Registry identifier
    "s": "4",                // Registry event sequence number (hex)
    "d": "E..."              // Registry event digest
  },
  "dt": "2024-03-10T15:00:00.000000+00:00"
}
```

### Field Descriptions

- **i**: Credential SAID (the verifiable credential being revoked)
- **s**: Sequence number (always `"1"` for revocation events)
- **p**: Prior event digest (SAID of the `bis` issuance event)
- **ra**: Registry anchor seal - references the registry event that authorized this revocation
  - **ra.i**: Registry identifier
  - **ra.s**: Registry event sequence number (hex-encoded)
  - **ra.d**: Registry event SAID
- **dt**: Revocation datetime in ISO 8601 format

## Usage Example

```typescript
import { backerRevoke } from './src/tel.ts';

const result = backerRevoke({
  vcdig: 'EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  regsn: 4,
  regd: 'ERegistryEventAfterIssuance_12345678901234',
  dig: 'EPriorIssuanceEventDigest_123456789012345',
  dt: '2024-03-10T15:00:00.000000+00:00'
});

console.log(result.said);  // Event SAID
console.log(result.raw);   // Serialized event
```

## Keripy Compatibility

The kerits implementation matches keripy's `eventing.backerRevoke()`:

```python
from keri.vdr import eventing

serder = eventing.backerRevoke(
    vcdig='EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
    regk='EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
    regsn=4,
    regd='ERegistryEventAfterIssuance_12345678901234',
    dig='EPriorIssuanceEventDigest_123456789012345',
    dt='2024-03-10T15:00:00.000000+00:00'
)
```

## Test Coverage

Test cases: [testgen/test-cases/](../../testgen/test-cases/)
- `test_tel_brv_001.json`: Simple backer credential revocation
- `test_tel_brv_002.json`: Backer revocation with different registry
- `test_tel_brv_003.json`: Backer revocation with higher registry sequence number

**Test Results**: 3/3 tests passing (100%)

## Credential Lifecycle

A typical backer-backed credential lifecycle:

1. **Registry Creation** (`vcp`): Create registry with backers
   ```typescript
   registryIncept({ pre, baks: ['B...'], toad: 1 })
   ```

2. **Backer Issuance** (`bis`): Issue credential with backer authorization
   ```typescript
   backerIssue({ vcdig, regk, regsn, regd })
   ```

3. **Backer Revocation** (`brv`): Revoke credential with backer authorization
   ```typescript
   backerRevoke({ vcdig, regk, regsn, regd, dig })
   ```

## Relationship to Other Events

- **bis**: Backer issuance - must precede `brv` in the credential's TEL
- **vcp**: Registry inception - must have backers configured
- **vrt**: Registry rotation - manages the backer list over time
- **rev**: Simple revocation (no backers) - alternative to `brv`

## Architecture Notes

### Event Chaining

The `p` field links the revocation to the prior issuance event, creating a verifiable chain:
- `bis` event (s="0") → `brv` event (s="1", p=bis.d)

This ensures:
1. Each credential has exactly one issuance and at most one revocation
2. The revocation references the correct issuance
3. Replay attacks are prevented

### Registry Anchor Seal

The `ra` field ensures the revocation is authorized by the registry at a specific state:
1. The registry's backers at `regsn` authorize the revocation
2. Verification traces back to the exact registry configuration
3. The revocation is cryptographically bound to registry state

### Backer Signatures

After creating a `brv` event, the registry's backers must sign it according to the threshold (`toad`). The verification process checks:
- Sufficient backer signatures (>= toad)
- Signatures from valid backers at the referenced registry state
- Proper indexing and cryptographic validity

### SAID Computation

`brv` events use Self-Addressing IDentifiers computed via Blake3-256 hash, ensuring immutability and verifiability via the [`saidify()`](../src/said.ts) function.

## See Also

- [bis.md](./bis.md): Backer issuance documentation
- [baks.md](./baks.md): Backer management via registry rotation
- [tel.md](./tel.md): Complete TEL implementation overview
