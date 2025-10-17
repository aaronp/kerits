# MERITS Messaging Integration

This document describes the integration of MERITS messaging into KERITS.

## Overview

MERITS (Messaging Engine for Reliable Identity-based Transport System) has been fully integrated into KERITS, providing secure, AID-based messaging capabilities.

## Architecture

### Phase 1: Identity Bridge
- **File**: `ui/src/lib/messaging-bridge.ts`
- **Purpose**: Connects KERITS accounts to MERITS messaging
- Extracts Ed25519 private keys from KERITS KeyManager
- Converts KERITS accounts → MERITS user identity
- Manages messaging session lifecycle

### Phase 2: Unified Storage
- **File**: `ui/src/lib/storage-bridge.ts`
- **Purpose**: Adapts KERITS Kv (binary) to MERITS Kv (JSON)
- All messaging data stored in KERITS IndexedDB
- Namespaced storage: `{aid}:contacts`, `{aid}:messages`, etc.
- Single source of truth for all data

### Phase 3: Contact Synchronization
- **File**: `ui/src/lib/contact-sync.ts`
- **Purpose**: Syncs KERITS contacts ↔ MERITS contacts
- Copies KERITS DSL contacts to MERITS ContactManager on init
- Auto-sync every 5 minutes
- Handles unknown contacts from strangers

### Phase 4: UI Integration
- **File**: `ui/src/components/Messages.tsx`
- Standalone messaging page with contact list and conversation view
- Sidebar navigation button (MessageCircle icon)
- Route: `/messages`
- Initialization tied to current user and account

### Phase 5: Configuration
- **Environment Variables**:
  - `VITE_CONVEX_URL`: Convex backend URL (default: https://accurate-penguin-901.convex.cloud)
- **Dependencies Added**:
  - `sonner`: Toast notifications for MERITS components
  - `convex`: Client library (already in server/package.json)

## Usage

### For Users

1. **Navigate to Messages**
   - Click "Messages" in the sidebar
   - Messages page initializes automatically with your current account

2. **Contacts**
   - All KERITS contacts are automatically available in messaging
   - Add contacts in KERITS → they appear in Messages
   - Receive message from unknown AID → creates "unknown contact"

3. **Messaging**
   - Select a contact to start messaging
   - Messages are encrypted and signed with your account's private key
   - Status indicators: sending, sent, delivered, read, failed
   - Retry failed messages

### For Developers

#### Initialize Messaging Manually

```typescript
import { initializeMessaging } from './lib/messaging-bridge';

const { identity, cleanup } = await initializeMessaging(userId, accountAlias);

// Use messaging stores
import { useMessages, useContacts, useConnection } from './merits/store';

// Cleanup when done
cleanup();
```

#### Access Messaging Identity

```typescript
import { getMessagingIdentity } from './lib/messaging-bridge';

const identity = await getMessagingIdentity(userId, accountAlias);
// identity.aid, identity.privateKey, identity.ksn
```

#### Sync Contacts

```typescript
import { syncKeritsToMerits, addToKeritsContacts } from './lib/contact-sync';

// Sync KERITS → MERITS
await syncKeritsToMerits(userId, contactManager);

// Add MERITS contact to KERITS
await addToKeritsContacts(userId, aid, alias, kel);
```

## File Structure

```
ui/src/
├── components/
│   └── Messages.tsx                 # Main messages page
├── lib/
│   ├── messaging-bridge.ts          # Phase 1: Identity bridge
│   ├── storage-bridge.ts            # Phase 2: Storage adapter
│   └── contact-sync.ts              # Phase 3: Contact sync
└── merits/                          # MERITS module (imported wholesale)
    ├── components/                  # UI components
    │   ├── MessagingView.tsx        # Chat interface
    │   ├── ContactList.tsx          # Contact/group sidebar
    │   ├── ConnectionPanel.tsx      # Connection status
    │   └── ...
    ├── store/                       # Zustand stores
    │   ├── contacts.ts
    │   ├── messages.ts
    │   ├── connection.ts
    │   └── ...
    ├── lib/                         # Core libraries
    │   ├── message-bus/             # MessageBus transport
    │   ├── dsl/                     # Domain logic managers
    │   ├── storage/                 # Storage abstractions
    │   └── ...
    └── index.ts                     # Public API exports
```

## Backend

The messaging backend uses **Convex** (serverless):
- **Location**: `server/` directory
- **Schema**: Challenge-response auth, encrypted messages, key states
- **Functions**:
  - `messages.send`: Send message with KERI signature
  - `messages.receive`: Receive messages for AID
  - `messages.acknowledge`: Non-repudiation receipt
  - `auth.issueChallenge`: Challenge for authentication

## Security

- **Private keys** extracted from KERITS KeyManager (not stored separately)
- **Mnemonic-based** key derivation (KERITS standard)
- **Message encryption**: XChaCha20-Poly1305 (planned, currently mock)
- **Signatures**: Ed25519 indexed signatures over message envelopes
- **Challenge-response auth**: Prevents replay attacks

## Limitations

1. **KEL Required**: MERITS contacts need full KEL (Key Event Log)
   - Unknown contacts can't be added to KERITS without KEL
   - They remain in messaging system only

2. **Single Account**: Currently uses `currentAccountAlias`
   - Future: Support multiple accounts/switching

3. **Convex Backend**: Requires Convex URL configuration
   - Alternative backends would need MessageBus adapter

## Troubleshooting

### "Account is locked" Error
- KERITS account must have mnemonic stored in KeyManager
- Account created via DSL should auto-unlock
- Manual unlock: ensure mnemonic is saved

### Messages Not Loading
- Check `VITE_CONVEX_URL` in `.env`
- Verify Convex backend is running
- Check browser console for errors

### Contacts Not Syncing
- Auto-sync runs every 5 minutes
- Manual sync: navigate away and back to Messages page
- Check contact has valid AID in KERITS

## Future Enhancements

1. **Real Encryption**: Replace mock crypto with actual XChaCha20-Poly1305
2. **Group Messaging**: Full group chat support
3. **File Attachments**: Send/receive files via MessageBus
4. **Message Search**: Full-text search across conversations
5. **Push Notifications**: Desktop notifications for new messages
6. **Multiple Backends**: Support for non-Convex transports
7. **Inline Messaging**: Messaging panel in contact detail pages

## Dependencies

### Added to `ui/package.json`
```json
{
  "dependencies": {
    "sonner": "^1.4.0"
  }
}
```

### Already Present
- `zustand`: State management
- `lucide-react`: Icons
- `@noble/ed25519`: Cryptography

## Testing

### Manual Testing
1. Create two KERITS users with accounts
2. Share KEL between them (copy from Profile)
3. Add each other as contacts
4. Navigate to Messages
5. Send messages back and forth

### Unit Testing
```bash
bun test ui/src/lib/messaging-bridge.test.ts
bun test ui/src/lib/storage-bridge.test.ts
bun test ui/src/lib/contact-sync.test.ts
```

## References

- **MERITS Original**: `ui/src/merits/` (copied wholesale from separate project)
- **KERI Spec**: https://github.com/WebOfTrust/keri
- **Convex Docs**: https://docs.convex.dev/
