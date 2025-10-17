/**
 * MERITS Module Exports
 *
 * Public API for integrating MERITS messaging into KERITS.
 * This module provides all the necessary components, stores, and utilities.
 */

// ============================================================================
// Core Components (Ready to integrate into any app)
// ============================================================================

export { MessagingView } from './components/MessagingView';
export { ConnectionPanel } from './components/ConnectionPanel';
export { GroupList } from './components/GroupList';
export { GroupDetailsPanel } from './components/GroupDetailsPanel';
export { ContactList } from './components/ContactList';
export { AddContactDialog } from './components/AddContactDialog';
export { AddToContactsDialog } from './components/AddToContactsDialog';
export { CreateGroupModal } from './components/CreateGroupModal';
export { ConversationItem } from './components/ConversationItem';
export { UnreadBadge } from './components/UnreadBadge';
export { PinButton } from './components/PinButton';

// Optional: Example components (may need customization)
export { WelcomeScreen } from './components/WelcomeScreen';
export { UserSwitcher } from './components/UserSwitcher';

// ============================================================================
// Stores (Zustand state management)
// ============================================================================

export { useConnection } from './store/connection';
export { useContacts } from './store/contacts';
export { useMessages } from './store/messages';
export { useGroups } from './store/groups';
export { useSettings } from './store/settings';
export { usePreferences } from './store/preferences';
export { useACL } from './store/acl';

// Optional: Identity store (KERITS will likely use its own)
export { useIdentity } from './store/identity';

// ============================================================================
// MessageBus (Transport abstraction)
// ============================================================================

export type {
  MessageBus,
  MessageBusConfig,
  MessageBusFactory,
  SendMessageArgs,
  EncryptedMessage,
} from './lib/message-bus';

export { ConvexMessageBus, ConvexMessageBusFactory } from './lib/message-bus';

// ============================================================================
// Crypto Utilities
// ============================================================================

export {
  mockEncrypt,
  mockDecrypt,
  decodeBase64Url,
  encodeBase64Url,
} from './lib/crypto/simple-crypto';

// ============================================================================
// Storage (IndexedDB abstraction)
// ============================================================================

export { IndexedDBKv, MemoryKv } from './lib/storage';
export type { KVStore } from './lib/storage';

// ============================================================================
// DSL Managers (Domain-Specific Logic)
// ============================================================================

export { MessageManager } from './lib/dsl/messages/manager';
export { ContactManager } from './lib/dsl/contacts/manager';
export { GroupManager } from './lib/dsl/groups/manager';
export { SettingsManager } from './lib/dsl/settings/manager';
export { PreferencesManager } from './lib/dsl/preferences/preferences-manager';

export type {
  StoredMessage,
  MessageStatus,
  DetailedMessageStatus,
} from './lib/dsl/messages/types';

export type { Contact, ContactMetadata } from './lib/dsl/contacts/types';
export type { Group, GroupMember } from './lib/dsl/groups/types';
export type { Settings } from './lib/dsl/settings/types';
export type { Preferences } from './lib/dsl/preferences/types';

// ============================================================================
// Identity (Simple identity provider - KERITS will replace)
// ============================================================================

export type { MeritsUser, IdentityProvider } from './lib/identity/types';
export { SimpleIdentityManager, identityManager } from './lib/identity/simple-identity';

// ============================================================================
// Utilities
// ============================================================================

export { cn } from './lib/utils';
export { getDisplayStatus } from './lib/dsl/messages/types';
