# @kerits/core Package Guidance

## Purpose

Pure functional core: KERI/CESR primitives, KEL validation, SAID computation, signing, canonical data, threshold logic. No I/O, no storage, no side effects.

## Naming Conventions

This package follows the [KERI Domain Modules](../../docs/architecture-keri.md) naming pattern. For each KERI noun `<Name>`:

| Suffix | Role | Example |
|--------|------|---------|
| `<Name>Data` | Types, schemas, factory functions, parse/encode | `KELEvents` (event builders) |
| `<Name>Ops` | Pure domain logic: validation, queries, transforms | `KELOps` |

Core does **not** have `*DAO`, `*API`, `*IndexDAO`, or `*AppendCeremony` modules — those belong in the SDK (`@kerits/kerits`). Core provides the pure functions that SDK layers call.

### KELOps

`KELOps` is the namespace for all pure KEL domain logic:

- **Validation**: `validateKel`, `validateKelChain`, `isValidKeriEvent`, `validateEventSaid`, `validateRequiredFields`, `validateKeyChain`
- **State derivation**: `reduceKelState`
- **KEL interpretation**: `forKEL` (builds a `KELView`), `validateAppend`
- **Property queries**: `isDoNotDelegate`, `isNonTransferable`
- **Key management**: `matchKeyRevelation`, `resolveCurrentKeys`, `buildNextCommitment`, `assertThresholdSatisfiable`

All functions take loaded data and return answers. No `KeyValueView`, no `KeyValueStore`, no I/O.

## Key Constraints

- All exports must be pure: no I/O, no ambient state, no hidden mutation
- Expected failure modeled in result types, not exceptions
- Branded types (`AID`, `SAID`, `PublicKey`, `Signature`) — avoid `as any`
- Tests use `bun:test`, run with `bun test packages/core`

## Public API Surface

- **Namespace objects**: `Cesr`, `Kel`, `KELOps`, `KELEvents`, `Said`, `Signature`, `Signers`
- **Bare re-exports**: kept for backward compatibility but prefer namespace access
- Types and validation errors exported from `./kel/validation.js`

## Reference

- [KERI Domain Modules](../../docs/architecture-keri.md) — standard module shape
- [Coding Standards](../../docs/coding-standards.md) — type safety, error handling, patterns
- [Testing Standards](../../docs/testing-standards.md) — testing strategy by layer
