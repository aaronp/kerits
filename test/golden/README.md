# Golden File Test Data

This directory contains golden files (reference snapshots) for regression testing.

## Structure

```
test/golden/
├── kel/                    # KEL system state snapshots
│   ├── create-single-key-inception.json
│   ├── rotate-keys-and-update-chain.json
│   └── generate-event-proof.json
└── (future categories...)
```

## What are Golden Files?

Golden files capture the expected output of the system for specific test scenarios. They serve as:

1. **Regression tests** - Detect unintended changes to system behavior
2. **Documentation** - Human-readable snapshots of system state
3. **Visual inspection** - Easy to review changes via git diffs

## Usage

### Running Tests

```bash
# Check against golden files (normal testing)
make test-model

# Update golden files (after intentional changes)
make snapshot-model
```

### Adding New Golden Tests

1. Write a test in `src/model/kel/kel-golden.test.ts` (or similar)
2. Import the golden file helpers:
   ```typescript
   import { assertMatchesGolden } from './test-helpers/golden';
   ```
3. Use explicit file paths (grep-able and obvious):
   ```typescript
   await assertMatchesGolden('test/golden/kel/my-test.json', snapshot);
   ```
4. Run with `UPDATE_GOLDEN=1` to create initial snapshot
5. Commit the golden file to git

### When Golden Tests Fail

1. **Review the diff** - Check what changed in the output
2. **Verify if expected** - Is this an intentional change?
3. **If expected**: Run `make snapshot-model` to accept new output
4. **If unexpected**: Fix the bug causing the change

## File Naming Convention

Golden files use explicit, descriptive names:
- `inception-single-key.json` - Single key inception
- `rotation-with-chain.json` - Key rotation with event chain
- `inception-with-proof.json` - Inception with event proof

File paths are explicit in test code for easy grepping and navigation.

## Categories

- **kel/** - Key Event Log system snapshots (inception, rotation, proofs, etc.)
- *(Add more categories as needed)*

## See Also

- [test-plan.md](../src/model/kel/docs/test-plan.md) - Complete testing documentation
- [kel-golden.test.ts](../src/model/kel/kel-golden.test.ts) - Example golden file tests
