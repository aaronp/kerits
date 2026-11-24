# @kerits.id/core

[![npm version](https://img.shields.io/npm/v/@kerits.id/core.svg)](https://www.npmjs.com/package/@kerits.id/core)

Core cryptographic primitives and data structures for KERI (Key Event Receipt Infrastructure) in TypeScript.

> **This repository is a read-only mirror.** It is automatically synced from a private monorepo. Do not submit pull requests here.

## Documentation

Full documentation is available at [kerits.dev](https://kerits.dev).

## Installation

```bash
bun add @kerits.id/core
# or
npm install @kerits.id/core
```

## Usage

```typescript
import { Signature, Said, encodeSAID, Kel } from '@kerits.id/core';

// Sign and verify data
const signer = Signature.ed25519(secretKey);
const sig = signer.sign(data);

// Compute a self-addressing identifier
const said = encodeSAID(payload);

// Validate a Key Event Log chain
const result = Kel.validateKelChain(events);
```

See the [guides](https://kerits.dev/docs/guides) for detailed usage examples.

## License

MIT
