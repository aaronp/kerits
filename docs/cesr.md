# CESR Implementation in kerits

## Overview

This document describes the CESR (Composable Event Streaming Representation) implementation in kerits, a TypeScript implementation of KERI primitives.

CESR is a dual text-binary encoding scheme that provides:
- **Composability**: Primitives can be concatenated and parsed sequentially
- **Self-describing**: First few characters determine the type and size
- **Compact**: Efficient encoding with 24-bit alignment
- **Interoperable**: Compatible with keripy reference implementation

## Implementation Status

### ✅ Completed Components

#### Core CESR Files

1. **[src/cesr/utils.ts](../src/cesr/utils.ts)**
   - Base64 URL-safe encoding/decoding (no padding)
   - Integer to/from Base64 conversion
   - Binary conversion utilities
   - Byte array operations

2. **[src/cesr/codex.ts](../src/cesr/codex.ts)**
   - `MatterCodex` class with all derivation codes
   - `Sizes` table mapping codes to size parameters (hs, ss, xs, fs, ls)
   - `Hards` table for first-character lookup
   - `DigDex` for digest algorithm selection

3. **[src/cesr/matter.ts](../src/cesr/matter.ts)**
   - Base `Matter` class for all CESR primitives
   - `_infil()` - Encode raw bytes to qb64/qb64b
   - `_binfil()` - Encode raw bytes to qb2 (binary)
   - `_exfil()` - Decode qb64 to extract code and raw
   - `_bexfil()` - Decode qb2 to extract code and raw
   - Properties: `qb64`, `qb64b`, `qb2`, `raw`, `code`, `soft`

4. **[src/cesr/diger.ts](../src/cesr/diger.ts)**
   - `Diger` class for cryptographic digests (SAIDs)
   - Supported algorithms:
     - Blake3-256 (default), Blake3-512
     - Blake2b-256, Blake2b-512
     - Blake2s-256
     - SHA3-256, SHA3-512
     - SHA2-256, SHA2-512
   - `verify()` method for digest validation

5. **[src/cesr/signer.ts](../src/cesr/signer.ts)**
   - `Signer` class - Ed25519 private signing keys
   - `Verfer` class - Ed25519 public verification keys
   - `Cigar` class - Non-indexed signatures
   - `newSigner()` - Generate new random signer
   - Async `sign()` and `verify()` methods

6. **[src/cesr/index.ts](../src/cesr/index.ts)**
   - Public API exports

### Test Infrastructure

#### Test Generator

**[testgen/generators/gen_cesr.sh](../../testgen/generators/gen_cesr.sh)**

Generates test vectors from keripy reference implementation to ensure compatibility.

Run with:
```bash
./testgen/generators/gen_cesr.sh
```

#### Generated Test Cases

Location: `kerits/test-cases/test_cesr_*.json`

1. **test_cesr_ed25519_seed.json**
   - Ed25519 32-byte seed encoding
   - Code: 'A'
   - Tests fixed-size encoding (44 chars)

2. **test_cesr_ed25519_verkey.json**
   - Ed25519 transferable public key
   - Code: 'D'
   - Derived from seed

3. **test_cesr_ed25519_verkey_nt.json**
   - Ed25519 non-transferable public key
   - Code: 'B'
   - Derived from seed

4. **test_cesr_blake3_256.json**
   - Blake3-256 digest
   - Code: 'E'
   - Tests digest computation and encoding

5. **test_cesr_ed25519_signature.json**
   - Ed25519 signature
   - Code: '0B'
   - Tests signing and signature encoding

6. **test_cesr_var_string.json**
   - Variable-sized string encoding
   - Code: '4A'
   - Tests variable-size encoding with lead size 0

7. **test_cesr_number_short.json**
   - Short 2-byte number
   - Code: 'M'
   - Tests small integer encoding

8. **test_cesr_salt_256.json**
   - 256-bit salt/nonce
   - Code: 'a'
   - Tests random value encoding

9. **test_cesr_round_trip_digests.json**
   - Round-trip tests for Blake3, SHA3, SHA2
   - Verifies encode/decode preserves data

Each test includes:
- `description` - Human-readable test description
- `code` - CESR derivation code
- `raw_hex` - Raw bytes as hex string
- `qb64` - Base64 text encoding
- `qb64b_hex` - Base64 bytes encoding (as hex)
- `qb2_hex` - Binary encoding (as hex)

## CESR Encoding Algorithm

### Size Parameters (Sizage)

Every derivation code has 5 size parameters:

- **hs** (hard size): Number of chars in stable/hard part of code (1, 2, or 4)
- **ss** (soft size): Number of chars in variable/soft part of code
- **xs** (extra size): Number of pre-pad chars in soft part
- **fs** (full size): Total size in chars (null for variable-sized)
- **ls** (lead size): Number of lead bytes to pre-pad raw (0, 1, or 2)

### Fixed-Size Encoding

For codes with `fs !== null`:

```
1. Calculate pad size: ps = (3 - ((raw_size + lead_size) % 3)) % 3
2. Verify alignment: ps must equal (code_size % 4)
3. Prepad raw with (ps + ls) zero bytes
4. Base64 encode the prepadded bytes
5. Skip first ps characters
6. Prepend code to create qb64
```

Example: Ed25519 key (32 bytes, code 'D')
```
raw = 32 bytes
code = 'D' (hs=1, ss=0, cs=1, fs=44, ls=0)
ps = (3 - (32 % 3)) % 3 = 1
cs % 4 = 1 (alignment verified ✓)

Steps:
1. Prepad: [0x00] + raw (33 bytes)
2. Encode: base64([0x00] + raw) = 44 chars
3. Skip ps=1: result[1:] = 43 chars
4. Prepend: 'D' + 43 chars = 44 chars total
```

### Variable-Size Encoding

For codes with `fs === null`:

```
1. Calculate lead size: ls = (3 - (raw_size % 3)) % 3
2. Calculate size in triplets: size = (raw_size + ls) / 3
3. Encode size in soft part: soft = intToB64(size, ss)
4. Prepad raw with ls zero bytes
5. Base64 encode prepadded bytes
6. Concatenate: code + soft + encoded
```

Example: String "Hello World!" (12 bytes)
```
raw = "Hello World!" (12 bytes)
code = '4A' (hs=2, ss=2)
ls = (3 - (12 % 3)) % 3 = 0
size = (12 + 0) / 3 = 4
soft = intToB64(4, 2) = 'AE'

Result: '4A' + 'AE' + base64(raw) = '4AAESGVsbG8gV29ybGQh'
```

### Decoding

```
1. Read first char to determine hard size (hs)
2. Extract code (hs chars)
3. Look up size parameters in Sizes table
4. Extract soft part (ss chars) if present
5. Calculate full size (from table if fixed, from soft if variable)
6. Decode material:
   - Calculate pad size: ps = code_size % 4
   - Prepad encoded with ps 'A' chars
   - Base64 decode to binary
   - Strip ps + ls bytes from start
   - Validate midpad bytes are zero
7. Extract raw bytes
```

## Usage Examples

### Creating a Digest

```typescript
import { Diger } from './cesr';

// Compute Blake3-256 digest
const data = new TextEncoder().encode('Hello, KERI!');
const diger = new Diger({ ser: data });

console.log(diger.qb64);  // e.g., 'EN5aZqQWSRHwMLmllE4sh2lWXEJGYO_CVzxxLaoTeg64'
console.log(diger.code);  // 'E'

// Verify digest
const valid = diger.verify(data);  // true
```

### Signing and Verifying

```typescript
import { newSigner } from './cesr';

// Create new signer
const signer = await newSigner(true);  // transferable
const verfer = signer.verfer;

console.log(verfer.qb64);  // e.g., 'DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA'

// Sign message
const message = new TextEncoder().encode('Test message');
const signature = await signer.sign(message);

console.log(signature.qb64);  // e.g., '0B...' (88 chars)

// Verify signature
const valid = await verfer.verify(signature, message);  // true
```

### Encoding/Decoding Raw Data

```typescript
import { Matter } from './cesr';

// Encode raw bytes
const raw = new Uint8Array(32);  // 32 random bytes
crypto.getRandomValues(raw);

const matter = new Matter({ raw, code: 'E' });  // Blake3-256 code
console.log(matter.qb64);  // 44 character string

// Decode qb64
const decoded = new Matter({ qb64: matter.qb64 });
console.log(decoded.code);  // 'E'
console.log(decoded.raw);   // Original 32 bytes
```

## Testing

### Run Test Generator

```bash
cd /Users/aaron/dev/sandbox/keripy
./testgen/generators/gen_cesr.sh
```

This generates test vectors from keripy in `kerits/test-cases/`.

### Run Test Suite

CESR tests are integrated into the standard test framework. Run from the keripy root:

```bash
# Run all tests (includes 7 CESR tests)
make test

# Or run kerits tests directly
cd kerits
bun run src/test-runner.ts
```

**Test Results:**
```
Running 75 test cases...

[1/75] test_cesr_blake3_256.json... ✓ PASSED
[2/75] test_cesr_ed25519_seed.json... ✓ PASSED
[3/75] test_cesr_ed25519_verkey.json... ✓ PASSED
[4/75] test_cesr_ed25519_verkey_nt.json... ✓ PASSED
[5/75] test_cesr_number_short.json... ✓ PASSED
[6/75] test_cesr_salt_256.json... ✓ PASSED
[7/75] test_cesr_var_string.json... ✓ PASSED
...

======================================================================
TEST REPORT
======================================================================
Total:      75
Passed:     75
Failed:     0
Pass Rate:  100.0%
======================================================================

✅ All tests PASSED! kerits CESR is compatible with keripy.
```

**CESR Tests Verify:**
- ✅ Ed25519 seed encoding (32 bytes → 44 char qb64)
- ✅ Ed25519 verification keys (transferable & non-transferable)
- ✅ Blake3-256 digest encoding
- ✅ Short number encoding (2 bytes)
- ✅ Salt/random value encoding (32 bytes)
- ✅ Variable-sized string encoding
- ✅ Encoding raw → qb64 matches keripy
- ✅ Decoding qb64 → raw matches keripy

## Supported Derivation Codes

### Keys and Seeds (32 bytes, 44 chars)
- `A` - Ed25519_Seed
- `B` - Ed25519N (non-transferable)
- `C` - X25519
- `D` - Ed25519 (transferable)
- `J` - ECDSA_256k1_Seed
- `Q` - ECDSA_256r1_Seed
- `a` - Salt_256

### Digests (32 bytes, 44 chars)
- `E` - Blake3_256 (default)
- `F` - Blake2b_256
- `G` - Blake2s_256
- `H` - SHA3_256
- `I` - SHA2_256

### Signatures (64 bytes, 88 chars)
- `0B` - Ed25519_Sig
- `0C` - ECDSA_256k1_Sig
- `0I` - ECDSA_256r1_Sig

### Numbers
- `M` - Short (2 bytes, 4 chars)
- `0H` - Long (4 bytes, 8 chars)
- `N` - Big (8 bytes, 12 chars)
- `R` - Tall (5 bytes, 8 chars)
- `S` - Large (11 bytes, 16 chars)

### Variable Sized
- `4A` - StrB64_L0 (lead size 0)
- `5A` - StrB64_L1 (lead size 1)
- `6A` - StrB64_L2 (lead size 2)
- `4B` - Bytes_L0
- `5B` - Bytes_L1
- `6B` - Bytes_L2

## Compatibility

The kerits CESR implementation is designed to be 100% compatible with keripy. All test vectors are generated from keripy to ensure identical encoding/decoding behavior.

## References

- [CESR Specification](https://trustoverip.github.io/tswg-cesr-specification/)
- [keripy Reference Implementation](https://github.com/WebOfTrust/keripy)
- [KERI Specification](https://trustoverip.github.io/tswg-keri-specification/)
