# MERITS Identity System

Minimal identity management for standalone MERITS usage.

## Overview

This identity system provides:
- **Multiple Users**: Create and switch between multiple local identities
- **ED25519 Keys**: Cryptographic keypair generation using Web Crypto API
- **IndexedDB Storage**: Persistent storage of user identities
- **Clean Components**: Reusable UI components for KERITS integration

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│  WelcomeScreen, UserSwitcher (easily embeddable)        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  Zustand Store                           │
│  useIdentity() - React hooks for identity state         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              SimpleIdentityManager                       │
│  IdentityProvider interface implementation              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    IndexedDB                             │
│  Persistent storage of MeritsUser records               │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Create User (Welcome Flow)

```tsx
import { WelcomeScreen } from '@/lib/identity';

function App() {
  return <WelcomeScreen />;
}
```

The WelcomeScreen:
1. Shows username input
2. Generates ED25519 keypair
3. Creates fake SAID (did:key format)
4. Stores in IndexedDB
5. Sets as current user

### Access Current User

```tsx
import { useIdentity } from '@/lib/identity';

function MyComponent() {
  const { currentUser, loading } = useIdentity();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <div>No user</div>;

  return (
    <div>
      <h1>Hello, {currentUser.username}</h1>
      <p>AID: {currentUser.aid}</p>
    </div>
  );
}
```

### Switch Users

```tsx
import { UserSwitcher } from '@/lib/identity';

function Sidebar() {
  return (
    <aside>
      <UserSwitcher />
      {/* Other sidebar content */}
    </aside>
  );
}
```

The UserSwitcher provides:
- Display current user
- Dropdown to switch users
- Delete user (with confirmation)
- Logout

### Sign Data

```tsx
import { useIdentity } from '@/lib/identity';

function MyComponent() {
  const { provider } = useIdentity();

  async function signMessage(message: string) {
    const data = new TextEncoder().encode(message);
    const signature = await provider.sign(data);
    return signature; // base64url encoded
  }
}
```

## Data Model

### MeritsUser

```typescript
interface MeritsUser {
  aid: string;          // Unique identifier (did:key:${publicKey})
  username: string;     // Display name
  publicKey: string;    // ED25519 public key (base64url)
  privateKey: string;   // ED25519 private key (base64url, encrypted at rest)
  createdAt: number;    // Timestamp
  lastLoginAt: number;  // Timestamp
}
```

### IdentityProvider Interface

```typescript
interface IdentityProvider {
  name: string;        // "SimpleIdentity"
  version: string;     // "1.0"

  getCurrentUser(): Promise<MeritsUser | null>;
  getAllUsers(): Promise<MeritsUser[]>;
  createUser(username: string): Promise<MeritsUser>;
  switchUser(aid: string): Promise<MeritsUser>;
  removeUser(aid: string): Promise<void>;

  sign(data: Uint8Array): Promise<string>;
  verify(signature: string, data: Uint8Array, publicKey: string): Promise<boolean>;
  getPublicKey(): Promise<string>;
}
```

## KERITS Integration

When integrating with KERITS, create a `KeriIdentityProvider` that implements the `IdentityProvider` interface:

```typescript
// kerits/src/lib/merits-identity-adapter.ts

import type { IdentityProvider, MeritsUser } from '@merits/ui/identity';
import { Keeper, Hab } from '@kerits/client';

export class KeriIdentityProvider implements IdentityProvider {
  name = 'KERI';
  version = '1.0';

  constructor(
    private keeper: Keeper,
    private hab: Hab,
  ) {}

  async getCurrentUser(): Promise<MeritsUser> {
    return {
      aid: this.hab.pre,              // Real KERI AID
      username: this.hab.name,        // KERI alias
      publicKey: this.hab.currentKeys[0],
      privateKey: '',                 // Not needed (handled by Keeper)
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
  }

  async sign(data: Uint8Array): Promise<string> {
    return await this.keeper.sign(this.hab.pre, data);
  }

  async verify(signature: string, data: Uint8Array, publicKey: string): Promise<boolean> {
    return await this.keeper.verify(signature, data, publicKey);
  }

  // Implement other methods...
}
```

Then in KERITS UI:

```tsx
// kerits/ui/src/App.tsx

import { useIdentity } from '@merits/ui/identity';
import { KeriIdentityProvider } from './lib/merits-identity-adapter';

function App() {
  const { provider } = useIdentity();

  useEffect(() => {
    // Replace SimpleIdentityManager with KERI provider
    const keriProvider = new KeriIdentityProvider(keeper, hab);
    useIdentity.setState({ provider: keriProvider });
  }, [keeper, hab]);

  // Rest of the app works the same!
}
```

## Components are Standalone

All components are designed to be easily extracted and embedded in KERITS:

### WelcomeScreen.tsx
- Clean, self-contained component
- No MERITS-specific dependencies
- Just uses `useIdentity()` hook

### UserSwitcher.tsx
- Dropdown for switching users
- Delete confirmation
- Logout functionality
- Can be placed anywhere in KERITS UI

### ConnectionPanel.tsx
- Shows connection status
- Uses current user's AID
- Updates when user switches

## Security Notes

⚠️ **Current Implementation (MVP)**:
- Private keys stored in IndexedDB **unencrypted** (base64url encoded)
- Suitable for development/testing
- **NOT production-ready**

✅ **Production TODO**:
- Encrypt private keys using Web Crypto API
- Use device-specific encryption key or user password
- Consider using Web Authentication API for biometric unlock

## Future Enhancements

1. **Key Encryption**: Use Web Crypto SubtleCrypto for encryption
2. **Biometric Auth**: Integrate Web Authentication API
3. **Export/Import**: Allow exporting identities for backup
4. **Multi-Device**: Share identity across devices securely
5. **KERI Integration**: Full KEL support via KERITS adapter

## Testing

To test the identity system:

```bash
cd merits/ui
bun run dev
```

1. Visit http://localhost:5175
2. Enter username (e.g., "Alice")
3. Click "Create Identity"
4. Should see main UI with user in sidebar
5. Click user dropdown to test switching/logout

## Migration Path

The architecture supports gradual migration:

**Phase 1** (Current):
- Use `SimpleIdentityManager`
- Local ED25519 keys
- Fake SAID

**Phase 2** (KERITS Integration):
- Replace with `KeriIdentityProvider`
- Real KERI AIDs
- KEL-backed signatures

**Phase 3** (Full KERI):
- Multi-sig support
- Witness coordination
- Credential issuance
- All KERITS features

The `IdentityProvider` interface ensures compatibility across all phases.
