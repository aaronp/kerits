# Transaction Event Log (TEL) Implementation

## Overview

The Transaction Event Log (TEL) provides a verifiable event log for ACDC (Authentic Chained Data Container) credential lifecycle events. TEL events track the state changes of credentials in a cryptographically verifiable manner.

## Implementation

**Source:** [kerits/src/tel.ts](../src/tel.ts)

## Supported Event Types

### 1. Registry Inception (vcp)

Creates a new credential registry under an AID. Defines the registry type, backers, and rules.

**Implementation:** [registryIncept()](../src/tel.ts#L121-L197)

**Key Fields:**
- `t`: "vcp" (registry inception ilk)
- `d`: Registry SAID
- `i`: Registry identifier (same as `d` for inception)
- `ii`: Issuer AID
- `s`: "0" (sequence number in hex)
- `c`: Configuration traits (array)
- `bt`: Backer threshold (hex)
- `b`: Backer AIDs (array)
- `n`: Nonce

**Example:**
```typescript
import { registryIncept } from './tel';

const registry = registryIncept({
  issuer: 'DBQo-84jo4m9QyM7KzeOKxVb8l1bg6hukLZaEg3LCYH-',
  baks: ['BKRaC6UsijUY1FRjExoAMc8WOHBDIfIKYnOlxWH8eOe8'],
  toad: 1
});

console.log(registry.regk); // Registry identifier
```

**Test Cases:** [3 test cases](../../testgen/test-cases/)
- Simple registry (no backers)
- Registry with one backer
- Registry with multiple backers

---

### 2. Issuance Event (iss)

Anchors the issuance of a credential into the registry. The credential's SAID is recorded.

**Implementation:** [issue()](../src/tel.ts#L207-L259)

**Key Fields:**
- `t`: "iss" (issuance ilk)
- `d`: Event SAID
- `i`: Credential SAID
- `s`: "0" (sequence number - always 0 for issuance)
- `ri`: Registry identifier
- `dt`: Issuance datetime (ISO 8601)

**Example:**
```typescript
import { issue } from './tel';

const issuance = issue({
  vcdig: 'EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dt: '2024-01-01T00:00:00.000000+00:00'
});
```

**Test Cases:** [3 test cases](../../testgen/test-cases/)
- Simple issuance
- Issuance with specific datetime
- Issuance for different registry

---

### 3. Revocation Event (rev)

Marks a credential as revoked (sealed). May include proof or backer signatures if required.

**Implementation:** [revoke()](../src/tel.ts#L269-L347)

**Key Fields:**
- `t`: "rev" (revocation ilk)
- `d`: Event SAID
- `i`: Credential SAID
- `s`: "1" (sequence number - always 1 for first revocation)
- `ri`: Registry identifier
- `p`: Prior event digest
- `dt`: Revocation datetime (ISO 8601)

**Example:**
```typescript
import { revoke } from './tel';

const revocation = revoke({
  vcdig: 'EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'ELZpzaM7ZaXo9HLvRcjQhQ5Rb1z0tXqZF5wX6dTj3hqY',
  dt: '2024-01-15T10:30:00.000000+00:00'
});
```

**Test Cases:** [3 test cases](../../testgen/test-cases/)
- Simple revocation
- Revocation with specific datetime
- Revocation for different registry

---

### 4. Interaction Event (ixn)

Records interactions, endorsements, or attestations without changing credential status. Used for logging related proofs and metadata.

**Implementation:** [interact()](../src/tel.ts#L357-L419)

**Key Fields:**
- `t`: "ixn" (interaction ilk)
- `d`: Event SAID
- `i`: Credential SAID
- `s`: Sequence number (hex, user-specified)
- `ri`: Registry identifier
- `p`: Prior event digest
- `a`: Interaction data/metadata (arbitrary JSON object)
- `dt`: Interaction datetime (ISO 8601)

**Example:**
```typescript
import { interact } from './tel';

const interaction = interact({
  vcdig: 'EOpMbWcZVemhMevTGrx9Wanc1I1kyv5Utzi_P6lN8GXM',
  regk: 'EMbueaMR7Sn63BBrHvDXgPo70XZMc07_xbAMg83dxSHi',
  dig: 'ENwxvffw6SXRTVcu3AHIb2OirZcjTHcLm-9tV0uREKOY',
  sn: 2,
  data: {
    action: 'endorse',
    endorser: 'EKC8085pwSwfvR-0_ZBhlEr0LklRuWJSLBe4SyuN6uBQ'
  },
  dt: '2024-02-01T15:30:00.000000+00:00'
});
```

**Test Cases:** [3 test cases](../../testgen/test-cases/)
- Credential endorsement
- Attestation with witness statement
- Usage tracking metadata

---

## Not Yet Implemented

### 5. Backer Addition Event (baks)

Adds or removes "backers" (entities authorized to co-sign registry events).

**Status:** ❌ Not implemented

**Key Fields:**
- `adds`: Backers to add
- `cuts`: Backers to remove

---

### 6. Anchoring Event (anc)

Anchors registry state to another AID's KEL for verifiability and cross-chain attestation.

**Status:** ❌ Not implemented

**Key Fields:**
- `s`: Sequence number
- `ri`: Registry identifier
- `seal`: Link to other AID event

---

## Test Coverage

### Summary

| Event Type | Implementation | Test Cases | Pass Rate |
|------------|---------------|------------|-----------|
| vcp (Registry Inception) | ✓ [registryIncept()](../src/tel.ts#L121) | 3 | 100% |
| iss (Issuance) | ✓ [issue()](../src/tel.ts#L207) | 3 | 100% |
| rev (Revocation) | ✓ [revoke()](../src/tel.ts#L269) | 3 | 100% |
| ixn (Interaction) | ✓ [interact()](../src/tel.ts#L357) | 3 | 100% |
| baks (Backer Addition) | ❌ | - | - |
| anc (Anchoring) | ❌ | - | - |

**Total:** 12 test cases, 100% passing

### Running Tests

```bash
cd kerits
bun run test
```

Expected output:
```
[41/57] test_tel_ixn_001.json... ✓ PASSED (23ms)
[42/57] test_tel_ixn_002.json... ✓ PASSED (23ms)
[43/57] test_tel_ixn_003.json... ✓ PASSED (23ms)
[44/57] test_tel_rev_001.json... ✓ PASSED (24ms)
[45/57] test_tel_rev_002.json... ✓ PASSED (24ms)
[46/57] test_tel_rev_003.json... ✓ PASSED (24ms)
[47/57] test_tel_vcp_001.json... ✓ PASSED (24ms)
[48/57] test_tel_vcp_002.json... ✓ PASSED (24ms)
[49/57] test_tel_vcp_003.json... ✓ PASSED (24ms)
[50/57] test_tel_iss_001.json... ✓ PASSED (19ms)
[51/57] test_tel_iss_002.json... ✓ PASSED (19ms)
[52/57] test_tel_iss_003.json... ✓ PASSED (19ms)

Total:     57
Passed:    57
Failed:    0
Pass Rate: 100.0%
Duration:  1.26s
```

---

## Architecture

### SAID Computation

All TEL events use Self-Addressing IDentifiers (SAIDs) computed via [saidify()](../src/saidify.ts):

1. Create event structure with placeholder SAID (`d` field = 44 `#` characters)
2. Serialize to JSON
3. Compute actual size
4. Update version string with size
5. Compute SAID using Blake3-256 digest
6. Replace placeholder with computed SAID

**Implementation:** See [saidify.ts](../src/saidify.ts)

### Version Strings

TEL events use KERI version strings generated by [versify()](../src/versify.ts):

- Protocol: `KERI` (for TEL events)
- Version: `1.0` (major.minor)
- Kind: `JSON`
- Size: Actual serialized size in bytes

Format: `KERI10JSON0000ed_` (example)

**Implementation:** See [versify.ts](../src/versify.ts)

### Datetime Format

All datetime fields use ISO 8601 format with microsecond precision:

```
YYYY-MM-DDTHH:MM:SS.ffffff+00:00
```

Example: `2024-01-01T00:00:00.000000+00:00`

**Implementation:** [nowIso8601()](../src/tel.ts#L93-L99)

---

## Keripy Compatibility

The kerits TEL implementation is designed to be compatible with keripy (the reference Python implementation):

- **vcp, iss, rev**: Fully compatible with keripy's `keri.vdr.eventing` module
- **ixn**: Kerits implements TEL ixn according to KERI/ACDC spec; keripy doesn't have TEL ixn yet
- All test cases verify identical SAID computation between implementations

### Test Generators

- **Location:** [testgen/generators/](../../testgen/generators/)
- **Keripy Scripts:** Use keripy to generate expected outputs
- **Kerits Scripts:** [kerits/scripts/](../scripts/) - Verify kerits matches expected outputs

---

## Usage in Applications

### Complete Credential Lifecycle Example

```typescript
import { registryIncept, issue, interact, revoke } from './tel';
import { credential } from './credential';

// 1. Create registry
const registry = registryIncept({
  issuer: 'DBQo-84jo4m9QyM7KzeOKxVb8l1bg6hukLZaEg3LCYH-'
});

// 2. Create and issue credential
const cred = credential({
  schema: 'ESchema_SAID_here',
  issuer: 'DBQo-84jo4m9QyM7KzeOKxVb8l1bg6hukLZaEg3LCYH-',
  recipient: 'ERecipient_AID_here',
  data: { degree: 'Bachelor of Science' }
});

const issuance = issue({
  vcdig: cred.said,
  regk: registry.regk
});

// 3. Record interaction (e.g., credential presentation)
const presentation = interact({
  vcdig: cred.said,
  regk: registry.regk,
  dig: issuance.said,
  sn: 2,
  data: {
    action: 'presented',
    verifier: 'EVerifier_AID_here'
  }
});

// 4. Revoke credential
const revocation = revoke({
  vcdig: cred.said,
  regk: registry.regk,
  dig: presentation.said
});
```

---

## References

- **KERI Specification:** [WebOfTrust KERI](https://github.com/WebOfTrust/keri)
- **ACDC Specification:** [WebOfTrust ACDC](https://github.com/trustoverip/tswg-acdc-specification)
- **Keripy Reference Implementation:** [WebOfTrust keripy](https://github.com/WebOfTrust/keripy)
- **TEL Source Code:** [kerits/src/tel.ts](../src/tel.ts)
- **Test Cases:** [testgen/test-cases/](../../testgen/test-cases/)
