# KEL Test Helpers

This directory contains test-only utilities that should **not** be included in production builds.

## Contents

### golden.ts
Golden file testing utilities for regression tests:
- `saveGolden()` - Save snapshots to golden files
- `loadGolden()` - Load golden files for comparison
- `assertMatchesGolden()` - Assert snapshot matches golden file (with UPDATE_GOLDEN support)
- `assertRoundTrip()` - Verify dump → load → dump stability
- `goldenFilePath()` - Derive golden file paths from test names

**Usage**: Import in test files only
```typescript
import { assertMatchesGolden, assertRoundTrip } from './test-helpers/golden';
```

## Production Code vs Test Code

**Production code** (ships with the library):
- `snapshot.ts` - Snapshot types and sorting helpers
- `api.ts` - `dumpState()` and `loadState()` methods

**Test code** (this directory):
- `golden.ts` - Golden file utilities for regression testing
- `*.test.ts` - Test files

## See Also

- [test-plan.md](../docs/test-plan.md) - Complete testing documentation
- [kel-golden.test.ts](../kel-golden.test.ts) - Example golden file tests
