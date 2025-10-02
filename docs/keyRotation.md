# Key Rotation

Implementation Summary

## Core Functions Created:

 1. ✅ kerits/src/rotate.ts - Pure rotation function with MVP features
 2. ✅ kerits/src/kel.ts - KEL serialization utilities

## Test Infrastructure: 
 3. ✅ testgen/generators/gen_rotate.sh - Test case generator 
 4. ✅ testgen/scripts/rotate_generate.sh - Python expected output 
 5. ✅ testgen/scripts/rotate_verify.sh - TypeScript verification CLI Updates: 
 6. ✅ Updated cli/index.ts with:
 
"Rotate Keys" menu option
KEL storage in account files
Full key rotation workflow

Test Results: 100% Feature Parity ✓
 * Total:     24 tests
 * Passed:    24 tests  
 * Failed:    0 tests
 * Pass Rate: 100.0%
 * Rotation Tests (4/4 passing):

 * Basic rotation with single key
 * Rotation with no next keys
 * Second rotation event (sn=2)
 * Rotation with explicit thresholds

# Key Features Implemented
rotate() function:
 * ✅ Creates rotation events deterministically
 * ✅ Updates signing keys (key rotation)
 * ✅ Establishes next pre-rotated keys
 * ✅ Maintains sequence numbering
 * ✅ Links to prior event via digest
 * ✅ Pure functional approach
 * ✅ 100% parity with keripy
## KEL utilities:
 * ✅ serializeKEL() - Concatenates events
 * ✅ parseKEL() - Parses newline-delimited JSON
 * ✅ getLatestEvent() - Gets last event
 * ✅ getLatestSequenceNumber() - Gets sequence number
## CLI features:
 * ✅ Account selection for rotation
 * ✅ Automatic key generation from pre-rotated seeds
 * ✅ KEL persistence across rotations
 * ✅ Sequence number tracking

# How It Works
Key Rotation Flow:

1. User selects existing account
2. CLI loads current KEL and gets sequence number
3. Current keys derived from nextSeed (pre-rotated)
4. New nextSeed generated for future rotation
5. Rotation event created linking to prior SAID
6. KEL updated with new event (newline-delimited)
7. Account saved with updated KEL
KEL Structure:
```js
{"v":"KERI10JSON00015a_","t":"icp",...}
{"v":"KERI10JSON000160_","t":"rot",...}
{"v":"KERI10JSON000160_","t":"rot",...}
```
Each line is a complete JSON event. The KEL grows with each rotation.