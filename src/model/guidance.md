# Implementation Guidance

This document captures key design decisions and patterns for the kerits model implementation.


## Core Principles

- **Pure functional approach**: All operations return results, no side effects
- **SAID-centric design**: Everything gets a unique identifier
- **TEL-based state management**: Groups and aliases use append-only TELs
- **"Pimped" operations**: Fluent API pattern like `kel(data).rotateKeys()`
- **Real cryptographic operations**: Use actual key generation and KERI primitives, not mock data

## Testing Philosophy
- **Use real cryptographic values**: Generate actual keys, SAIDs, and AIDs
- **Avoid mock data**: Let the system demonstrate its own capabilities
- **Test with realistic scenarios**: Use proper key management and KERI workflows
