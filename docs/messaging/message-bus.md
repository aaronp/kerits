# MessageBus Architecture

## Overview

The MessageBus architecture provides a clean, transport-agnostic abstraction for sending and receiving encrypted KERI messages. It uses the Factory pattern to enable different backend implementations while maintaining a consistent interface.

## Design Principles

1. **Transport Agnostic**: MessageBus interface doesn't depend on Convex, HTTP, or any specific backend
2. **Factory Pattern**: MessageBusFactory creates configured MessageBus instances
3. **KERITS Integration**: Custom factory extracts identity from KERITS accounts
4. **Separation of Concerns**: Store management is separate from MessageBus connection

## Core Interfaces

### MessageBus

The core interface for message transport:

```typescript
export interface MessageBus {
  sendMessage(args: SendMessageArgs): Promise<string>;
  receiveMessages(): Promise<EncryptedMessage[]>;
  acknowledgeMessage(messageId: string, envelopeHash: string): Promise<void>;
  onMessage(callback: (msg: EncryptedMessage) => void): void;
  onError(callback: (error: Error) => void): void;
  disconnect(): void;
}
```

**Location**: [ui/src/merits/lib/message-bus/types.ts](../../ui/src/merits/lib/message-bus/types.ts)

### MessageBusFactory

Creates connected MessageBus instances:

```typescript
export interface MessageBusFactory {
  connect(config: MessageBusConfig): Promise<MessageBus>;
}

export interface MessageBusConfig {
  userAid: string;
  privateKey: Uint8Array;
  ksn: number;
  backendConfig?: Record<string, any>;
}
```

**Location**: [ui/src/merits/lib/message-bus/types.ts](../../ui/src/merits/lib/message-bus/types.ts)

## Implementations

### ConvexMessageBus

Production implementation using Convex backend:

- Challenge-response authentication
- Ed25519 signature verification
- Automatic polling for new messages (currently disabled)
- Envelope hash verification for non-repudiation

**Location**: [ui/src/merits/lib/message-bus/convex-message-bus.ts](../../ui/src/merits/lib/message-bus/convex-message-bus.ts)

### KeritsMessageBusFactory

KERITS-specific factory that:

1. Extracts AID and private key from KERITS accounts
2. Registers key state with Convex backend
3. Creates ConvexMessageBus instance with KERITS credentials

**Location**: [ui/src/lib/messaging-bridge.ts](../../ui/src/lib/messaging-bridge.ts)

**Usage**:
```typescript
// Initialize stores
const aid = await initializeStores(userId, accountAlias);

// Create factory
const factory = new KeritsMessageBusFactory(userId, accountAlias);

// Connect via connection store
await useConnection.getState().initializeWithFactory(factory);
```

## Authentication Flow

```
1. KeritsMessageBusFactory.connect()
   └─> Extract identity from KERITS account (AID, private key, KSN)
   └─> Register key state with Convex (public keys, threshold)
   └─> ConvexMessageBus.connect()
       └─> Create ConvexClient
       └─> Return connected MessageBus

2. MessageBus.sendMessage()
   └─> Compute args hash
   └─> Request challenge from server
   └─> Sign challenge payload with KERITS private key
   └─> Submit signed mutation to Convex
   └─> Server verifies signature using registered public keys
```

## Signing

All signatures use `@noble/ed25519` for compatibility between KERITS and Convex:

**Signer**: [ui/src/lib/keri-signer.ts](../../ui/src/lib/keri-signer.ts)

```typescript
export async function signPayload(
  payload: any,
  privateKey: Uint8Array,
  keyIndex: number = 0
): Promise<string[]>
```

**Format**: Indexed signatures as `"<keyIndex>-<base64url-signature>"`

**Canonical JSON**: Object keys are sorted before signing to ensure deterministic payloads

## Store Integration

The MessageBus integrates with Zustand stores for state management:

### Connection Store

Manages MessageBus lifecycle:

```typescript
interface ConnectionState {
  bus: MessageBus | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;

  initialize(userAid: string, privateKey: Uint8Array, ksn: number): Promise<void>;
  initializeWithFactory(factory: MessageBusFactory): Promise<void>;
  disconnect(): void;
}
```

**Location**: [ui/src/merits/store/connection.ts](../../ui/src/merits/store/connection.ts)

### Storage Initialization

Separate from MessageBus connection, `initializeStores()` sets up:

- ContactManager, MessageManager, SettingsManager, GroupManager, ACLManager
- KERITS-backed KV storage adapters
- Zustand store state

**Location**: [ui/src/lib/messaging-bridge.ts](../../ui/src/lib/messaging-bridge.ts)

## Component Integration

### Messages Page

```typescript
// 1. Initialize stores (contacts, messages, settings, groups)
const aid = await initializeStores(userId, accountAlias);

// 2. Create MessageBusFactory
const factory = new KeritsMessageBusFactory(userId, accountAlias);

// 3. Connect to MessageBus
await useConnection.getState().initializeWithFactory(factory);
```

**Location**: [ui/src/components/Messages.tsx](../../ui/src/components/Messages.tsx)

## Storage Bridge

Adapts KERITS binary storage (Uint8Array) to MERITS JSON storage:

```typescript
export class KvAdapter implements MeritsKv {
  constructor(
    private keritsDslKv: KeritsDslKv,
    private namespace: string = ''
  ) {}

  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T): Promise<void>
  async delete(key: string): Promise<void>
}
```

**Location**: [ui/src/lib/storage-bridge.ts](../../ui/src/lib/storage-bridge.ts)

## Testing

### Running Tests

```bash
# All tests (compatibility + core + UI/MERITS)
make test

# UI/MERITS tests only
make ui-test

# From ui directory
cd ui && bun test
```

### Unit Tests

- **Contacts**: [ui/src/merits/lib/dsl/contacts/__tests__/manager.test.ts](../../ui/src/merits/lib/dsl/contacts/__tests__/manager.test.ts)
- **Messages**: [ui/src/merits/lib/dsl/messages/__tests__/manager.test.ts](../../ui/src/merits/lib/dsl/messages/__tests__/manager.test.ts)
  - **Queueing**: [ui/src/merits/lib/dsl/messages/__tests__/queueing.test.ts](../../ui/src/merits/lib/dsl/messages/__tests__/queueing.test.ts)
  - **Types**: [ui/src/merits/lib/dsl/messages/__tests__/types.test.ts](../../ui/src/merits/lib/dsl/messages/__tests__/types.test.ts)
- **Groups**: [ui/src/merits/lib/dsl/groups/__tests__/manager.test.ts](../../ui/src/merits/lib/dsl/groups/__tests__/manager.test.ts)
  - **Types**: [ui/src/merits/lib/dsl/groups/__tests__/types.test.ts](../../ui/src/merits/lib/dsl/groups/__tests__/types.test.ts)
- **Settings**: [ui/src/merits/lib/dsl/settings/__tests__/manager.test.ts](../../ui/src/merits/lib/dsl/settings/__tests__/manager.test.ts)
- **Preferences**: [ui/src/merits/lib/dsl/preferences/__tests__/preferences-manager.test.ts](../../ui/src/merits/lib/dsl/preferences/__tests__/preferences-manager.test.ts)
- **Unread Tracking**: [ui/src/merits/lib/dsl/unread/__tests__/unread-tracker.test.ts](../../ui/src/merits/lib/dsl/unread/__tests__/unread-tracker.test.ts)

### Integration Tests

- **Group Manager**: [ui/src/merits/lib/dsl/groups/__tests__/manager.integration.test.ts](../../ui/src/merits/lib/dsl/groups/__tests__/manager.integration.test.ts)
- **Credential Issuance**: [ui/src/test/credential-issuance.test.ts](../../ui/src/test/credential-issuance.test.ts)

### TODO: MessageBus Tests

- [ ] Unit tests for `KeritsMessageBusFactory`
- [ ] Integration tests for signature verification
- [ ] End-to-end tests for send/receive flow
- [ ] Mock backend tests for error handling

## Configuration

### Environment Variables

```bash
VITE_CONVEX_URL=https://accurate-penguin-901.convex.cloud
```

**Location**: [ui/.env.example](../../ui/.env.example)

## Debugging

### Console Logging

All components use prefixed console logs:

- `[KERITS MessageBusFactory]` - Factory operations
- `[KERITS Stores]` - Store initialization
- `[Connection]` - MessageBus connection lifecycle
- `[Messages Page]` - Component initialization

### Status Footer

VS Code-style status bar showing connection state:

**Component**: [ui/src/components/StatusFooter.tsx](../../ui/src/components/StatusFooter.tsx)

## Known Issues

### Signature Verification (Ongoing)

The Convex backend currently rejects signatures with:

```
[CONVEX M(messages:receive)] Server Error: Invalid signatures
```

**Status**: Auto-polling is disabled to prevent error spam

**Next Steps**:
1. Verify `@noble/ed25519` produces compatible signatures
2. Write integration tests for signing/verification
3. Debug canonical payload format
4. Re-enable polling once signatures work

**Debug Tools**:
- [ui/src/lib/test-signing.ts](../../ui/src/lib/test-signing.ts) - Signature testing utilities
- [MESSAGING_DEBUG.md](../../MESSAGING_DEBUG.md) - Debug guide

## Architecture Diagram

```
┌─────────────────────┐
│  Messages.tsx       │
│  (Component)        │
└──────────┬──────────┘
           │
           ├─> initializeStores(userId, accountAlias)
           │   └─> Sets up ContactManager, MessageManager, etc.
           │   └─> Creates KERITS KV adapters
           │
           └─> new KeritsMessageBusFactory(userId, accountAlias)
               └─> factory.connect()
                   ├─> getMessagingIdentity() - Extract AID/keys
                   ├─> registerKeyState() - Register with Convex
                   └─> ConvexMessageBus.connect()
                       └─> Returns MessageBus instance

┌─────────────────────┐
│  useConnection      │
│  (Store)            │
└──────────┬──────────┘
           │
           └─> initializeWithFactory(factory)
               ├─> bus = await factory.connect()
               ├─> bus.onMessage(callback)
               └─> bus.onError(callback)
```

## Future Enhancements

1. **Multiple Transport Support**: Add HTTP/WebSocket factories
2. **Offline Queue**: Queue messages when disconnected
3. **Message Receipts**: Non-repudiation proof system
4. **Key Rotation**: Handle KSN updates automatically
5. **Multi-Device Sync**: Share message state across devices
