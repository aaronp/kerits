# Backer Issuance (bis)

## Purpose

Backer issuance events (`bis`) are used when issuing a verifiable credential in a registry that has **backers**. Unlike simple issuance (`iss`), backer issuance requires signatures from the registry's backers to authorize the credential issuance.

## When to Use

Use `bis` instead of `iss` when:
- The registry has backers configured (non-transferable identifiers that co-sign registry events)
- The credential issuance requires authorization from the backing entities
- Multi-party control over credential lifecycle is needed

## Implementation

### Core Function

[`backerIssue()`](../src/tel.ts#L563) in [kerits/src/tel.ts](../src/tel.ts)

```typescript
export interface BackerIssuanceOptions {
  vcdig: string;   // Credential SAID
  regk: string;    // Registry identifier
  regsn: number;   // Registry event sequence number
  regd: string;    // Registry event digest
  dt?: string;     // Issuance datetime (ISO 8601)
}

export function backerIssue(options: BackerIssuanceOptions): BackerIssuance
```

### Event Structure

```json
{
  "v": "KERI10JSON000150_",  // Version string
  "t": "bis",                // Event type (backer issuance)
  "d": "E...",               // SAID of this event
  "i": "E...",               // Credential SAID (vcdig)
  "ii": "E...",              // Registry identifier (regk)
  "s": "0",                  // Sequence number (always 0 for issuance)
  "ra": {                    // Registry anchor seal
    "i": "E...",             // Registry identifier
    "s": "3",                // Registry event sequence number (hex)
    "d": "E..."              // Registry event digest
  },
  "dt": "2024-03-01T10:00:00.000000+00:00"
}
```

### Field Descriptions

- **i**: Credential SAID (the verifiable credential being issued)
- **ii**: Issuer/Registry identifier (the registry issuing the credential)
- **s**: Sequence number (always `"0"` for issuance events)
- **ra**: Registry anchor seal - references the registry event that authorized this issuance
  - **ra.i**: Registry identifier
  - **ra.s**: Registry event sequence number (hex-encoded)
  - **ra.d**: Registry event SAID
- **dt**: Issuance datetime in ISO 8601 format

## Usage Example

```typescript
import { backerIssue } from './src/tel.ts';

const result = backerIssue({
  vcdig: 'EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  regsn: 3,
  regd: 'ELZpzaM7ZaXo9HLvRcjQhQ5Rb1z0tXqZF5wX6dTj3hqY',
  dt: '2024-03-01T10:00:00.000000+00:00'
});

console.log(result.said);  // Event SAID
console.log(result.raw);   // Serialized event
```

## Keripy Compatibility

The kerits implementation matches keripy's `eventing.backerIssue()`:

```python
from keri.vdr import eventing

serder = eventing.backerIssue(
    vcdig='EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
    regk='EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
    regsn=3,
    regd='ELZpzaM7ZaXo9HLvRcjQhQ5Rb1z0tXqZF5wX6dTj3hqY',
    dt='2024-03-01T10:00:00.000000+00:00'
)
```

## Test Coverage

Test cases: [testgen/test-cases/](../../testgen/test-cases/)
- `test_tel_bis_001.json`: Simple backer credential issuance
- `test_tel_bis_002.json`: Backer issuance with different registry
- `test_tel_bis_003.json`: Backer issuance with higher registry sequence number

**Test Results**: 3/3 tests passing (100%)

## Relationship to Other Events

- **vcp**: Registry must be created first with backers configured
- **vrt**: Registry rotation events manage the backer list
- **iss**: Simple issuance (no backers) - alternative to `bis`
- **brv**: Backer revocation - revokes a credential issued via `bis`

## Architecture Notes

### Registry Anchor Seal

The `ra` field creates a verifiable link between the credential issuance and a specific registry event. This ensures:
1. The credential is issued under the authority of a specific registry state
2. The registry's backers at that point in time authorize the issuance
3. Verification can trace back to the exact registry configuration

### Backer Signatures

After creating a `bis` event, the registry's backers must sign it. The number of required signatures is determined by the registry's threshold (`toad` - threshold of accountable duplicity).

### SAID Computation

Like all KERI events, `bis` uses Self-Addressing IDentifiers computed via Blake3-256 hash, managed by the [`saidify()`](../src/said.ts) function.

## See Also

- [brv.md](./brv.md): Backer revocation documentation
- [baks.md](./baks.md): Backer management via registry rotation
- [tel.md](./tel.md): Complete TEL implementation overview
