# Kerits API Implementation Plan

This document outlines the comprehensive implementation plan for the Kerits API, based on the detailed thoughts and feedback in `thoughts.md`.

## Overview

The Kerits API provides a clean, dependency-injected interface for KERI operations, with pluggable storage and transport backends. The design emphasizes:

- **Content-addressed storage** by SAID (Self-Addressing IDentifier)
- **Multi-signature key rotation** with transport-driven coordination
- **Type-safe operations** with strong TypeScript interfaces
- **Pluggable backends** for different environments (browser, Node.js, etc.)

## Architecture

### Core Packages

```
src/model/
├── io/                    # Storage and transport abstractions
│   ├── types.ts          # KeyValueStore, Transport, AID, SAID, etc.
│   ├── storage.ts        # Memory, disk, IndexedDB implementations
│   └── transport.ts      # Memory, HTTP, WebSocket implementations
├── services/             # Service layer interfaces
│   ├── types.ts          # Crypto, KelEvent, TelEvent, Rotation types
│   ├── kel.ts           # KEL service interface
│   ├── tel.ts           # TEL service interface
│   └── schema.ts        # Schema and ACDC services
├── kel/                  # KEL operations and rotation
│   ├── types.ts         # KEL event types
│   ├── kel-ops.ts       # Core KEL operations
│   └── rotation/        # Key rotation workflow
│       ├── types.ts     # Rotation workflow types
│       └── rotate-keys.ts # Rotation implementation
├── tel/                  # TEL operations
│   ├── types.ts         # TEL event types
│   └── tel-ops.ts       # Core TEL operations
└── api/                  # Top-level API
    ├── types.ts         # KeritsAPI, AccountAPI, TelAPI
    ├── kerits.ts        # Main API implementation
    └── examples.test.ts # Example usage and tests
```

## Implementation Status

### ✅ Completed

1. **IO Package** (`src/model/io/`)
   - Core types: `KeyValueStore`, `Transport`, `AID`, `SAID`, `Bytes`
   - Storage implementations: `memoryStore()`, `namespace()`, `contentAddressed()`
   - Transport implementations: `memoryTransport()`
   - JSON helpers: `putJson()`, `getJson()`

2. **Services Package** (`src/model/services/`)
   - Service interfaces: `KelService`, `TelService`, `SchemaService`, `ACDCService`
   - Crypto interface for signing/verification
   - Rotation workflow types

3. **KEL Rotation** (`src/model/kel/rotation/`)
   - Multi-signature key rotation workflow
   - Transport-driven coordination
   - Progress tracking and status management

4. **API Package** (`src/model/api/`)
   - Top-level `KeritsAPI` interface
   - `AccountAPI` for account operations
   - `TelAPI` for TEL operations
   - Example tests demonstrating usage

### 🚧 In Progress

1. **Service Implementations**
   - Need to implement concrete `KelService` that wraps existing `kel-ops.ts`
   - Need to implement concrete `TelService` that wraps existing `tel-ops.ts`
   - Need to implement `SchemaService` and `ACDCService`

2. **Crypto Integration**
   - Need to create `Crypto` implementations that use existing CESR operations
   - Need to integrate with existing keypair generation and signing

### 📋 TODO

1. **Complete Service Implementations**
   ```typescript
   // src/model/services/kel-service.ts
   export class KelServiceImpl implements KelService {
     // Wrap existing KEL operations
   }
   
   // src/model/services/tel-service.ts
   export class TelServiceImpl implements TelService {
     // Wrap existing TEL operations
   }
   ```

2. **Crypto Factory**
   ```typescript
   // src/model/services/crypto-factory.ts
   export function createCryptoFactory(keypairs: Map<AID, CESRKeypair>) {
     return (aid: AID) => new CryptoImpl(keypairs.get(aid));
   }
   ```

3. **Production Storage Adapters**
   ```typescript
   // src/model/io/disk-store.ts
   export function diskStore(rootDir: string): KeyValueStore
   
   // src/model/io/indexeddb-store.ts
   export function indexedDBStore(dbName: string): KeyValueStore
   ```

4. **Production Transport Adapters**
   ```typescript
   // src/model/io/http-transport.ts
   export function httpTransport(baseUrl: string): Transport
   
   // src/model/io/websocket-transport.ts
   export function websocketTransport(wsUrl: string): Transport
   ```

5. **Schema and ACDC Services**
   ```typescript
   // src/model/services/schema-service.ts
   export class SchemaServiceImpl implements SchemaService {
     // JSON Schema generation and validation
   }
   
   // src/model/services/acdc-service.ts
   export class ACDCServiceImpl implements ACDCService {
     // ACDC issuance and verification
   }
   ```

## Key Design Decisions

### 1. Content-Addressed Storage

All data is stored by SAID, enabling:
- Automatic deduplication
- Content integrity verification
- Pluggable storage backends

### 2. Multi-Signature Key Rotation

The rotation workflow supports:
- Transport-driven coordination between devices
- Progress tracking and status management
- Configurable timeouts and deadlines
- Event-driven progress notifications

### 3. Type Safety

Strong TypeScript types throughout:
- Branded types for `AID`, `SAID`, `Threshold`
- Comprehensive interfaces for all operations
- Type-safe message passing

### 4. Dependency Injection

All services are injected, enabling:
- Easy testing with mock implementations
- Pluggable backends for different environments
- Clean separation of concerns

## Usage Examples

### Basic Account Operations

```typescript
import { kerits } from './api';
import { memoryStore, memoryTransport } from './io';

// Set up storage and transport
const root = memoryStore();
const transport = memoryTransport();

// Create API instance
const api = kerits(
  { root, kels: namespace(root, "kels"), index: namespace(root, "index") },
  transport,
  {
    hasher: { saidOf: (data) => computeSAID(data) },
    kel: kelService,
    tel: telService,
    schema: schemaService,
    acdc: acdcService,
    cryptoFactory: (aid) => createCrypto(aid),
    resolveCosignerAIDs: async (prior) => resolveCosigners(prior),
    appendKelEnv: async (store, env) => persistKelEnv(store, env)
  }
);

// Create and use accounts
const alice = await api.createAccount("alice");
const rotation = await alice.rotateKeys({ note: "Quarterly rotation" });
```

### Key Rotation Workflow

```typescript
// Start rotation
const handle = await account.rotateKeys({
  newKeys: ["new-key-1", "new-key-2"],
  newThreshold: 2,
  deadlineMs: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Monitor progress
handle.onProgress((event) => {
  console.log('Rotation progress:', event.type, event.payload);
});

// Wait for completion
const finalStatus = await handle.awaitAll({ timeoutMs: 7 * 24 * 60 * 60 * 1000 });
console.log('Rotation completed:', finalStatus.phase);
```

## Testing Strategy

### Unit Tests
- Test individual services in isolation
- Mock dependencies for clean testing
- Verify type safety and error handling

### Integration Tests
- Test complete workflows with real implementations
- Use `memoryStore()` and `memoryTransport()` for deterministic testing
- Verify persistence and message passing

### Example Tests
- Demonstrate real-world usage patterns
- Show how to create accounts and rotate keys
- Provide clear, readable examples for developers

## Migration Path

### Phase 1: Core API (Current)
- ✅ Basic API structure and types
- ✅ Storage and transport abstractions
- ✅ Rotation workflow framework
- 🚧 Service implementations

### Phase 2: Service Integration
- Complete service implementations
- Integrate with existing KEL/TEL operations
- Add comprehensive tests

### Phase 3: Production Features
- Production storage adapters
- Production transport adapters
- Schema and ACDC services
- Performance optimizations

### Phase 4: Advanced Features
- Delegation support
- Witness management
- Advanced TEL operations
- Multi-AID group operations

## Benefits

1. **Developer Experience**
   - Clean, intuitive API
   - Strong type safety
   - Comprehensive examples and tests

2. **Flexibility**
   - Pluggable storage and transport
   - Easy testing and mocking
   - Environment-specific implementations

3. **Maintainability**
   - Clear separation of concerns
   - Dependency injection
   - Comprehensive test coverage

4. **Scalability**
   - Content-addressed storage
   - Transport-driven coordination
   - Multi-signature support

This implementation provides a solid foundation for building KERI-based applications with a clean, type-safe API that's easy to use and extend.
