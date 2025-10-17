/**
 * KERITS MessageBusFactory - Connects KERITS identity/accounts to MERITS messaging
 *
 * This factory:
 * 1. Extracts AID and private key from KERITS accounts
 * 2. Registers key state with Convex backend
 * 3. Creates connected MessageBus instance
 */

import { getDSL } from './dsl';
import { KeyManager } from '../../../src/app/keymanager';
import type {
  MessageBus,
  MessageBusConfig,
  MessageBusFactory,
} from '../merits/lib/message-bus/types';
import type { AID, ALIAS } from '../../../src/types/keri';

/**
 * Messaging identity derived from KERITS account
 */
export interface MessagingIdentity {
  /** User's AID (from KERITS account) */
  aid: AID;
  /** Account alias */
  alias: ALIAS;
  /** Signer for creating signatures */
  signer: any; // Signer from KERITS
  /** Current key sequence number */
  ksn: number;
  /** Display name for UI */
  username: string;
}

/**
 * Extract messaging identity from KERITS account
 *
 * This function:
 * - Loads the account from DSL
 * - Unlocks the KeyManager to access private key
 * - Extracts the current signing key and KSN
 *
 * @param userId - KERITS user ID
 * @param accountAlias - Account alias to use for messaging
 * @returns MessagingIdentity with AID and private key
 */
export async function getMessagingIdentity(
  userId: string,
  accountAlias: string
): Promise<MessagingIdentity> {
  // Get DSL instance
  const dsl = await getDSL(userId);

  // Get account details
  const account = await dsl.getAccount(accountAlias);
  if (!account) {
    throw new Error(`Account not found: ${accountAlias}`);
  }

  // Create a raw Kv instance for KeyManager (same database as DSL)
  const { IndexedDBKv } = await import('../../../src/storage/adapters/indexeddb');
  const kv = new IndexedDBKv(`kerits-app-${userId}`);

  // Create KeyManager with Kv store
  const keyManager = new KeyManager({ store: kv });

  // Try to unlock from stored mnemonic
  const unlocked = await keyManager.unlockFromStore(account.aid);
  if (!unlocked) {
    throw new Error(
      `Account ${accountAlias} is locked. Cannot access private key for messaging.`
    );
  }

  // Get signer from KeyManager
  const signer = keyManager.getSigner(account.aid);
  if (!signer) {
    throw new Error(`Failed to get signer for ${accountAlias}`);
  }

  console.log('[getMessagingIdentity] Signer public key (CESR):', signer.verfer.qb64);
  console.log('[getMessagingIdentity] Account AID:', account.aid);

  // Get current key sequence number from KEL using AccountDSL
  const accountDsl = await dsl.account(accountAlias);
  if (!accountDsl) {
    throw new Error(`Account DSL not found: ${accountAlias}`);
  }

  const kelEvents = await accountDsl.getKel();
  const ksn = kelEvents.length - 1; // Last event's sequence number
  const latestEvent = kelEvents[kelEvents.length - 1];
  const ked = latestEvent.meta?.ked || latestEvent;

  // Get current keys from KEL
  const currentKeys = ked.k || ked.keys || [];
  console.log('[getMessagingIdentity] KEL sequence number:', ksn);
  console.log('[getMessagingIdentity] Current keys in KEL:', currentKeys);

  // Check if the signer's key matches any current key in the KEL
  const signerKeyInKel = currentKeys.includes(signer.verfer.qb64);
  console.log('[getMessagingIdentity] Signer key in KEL?', signerKeyInKel);

  if (!signerKeyInKel) {
    console.error('[getMessagingIdentity] ERROR: Signer key not in KEL!');
    console.error('  Signer public key:', signer.verfer.qb64);
    console.error('  KEL current keys:', currentKeys);
    throw new Error(`Signer key ${signer.verfer.qb64} not found in current KEL keys`);
  }

  return {
    aid: account.aid as AID,
    alias: accountAlias as ALIAS,
    signer,
    ksn,
    username: accountAlias, // Use alias as username
  };
}


/**
 * KERITS MessageBusFactory
 *
 * Implements MessageBusFactory interface for KERITS.
 * Handles key state registration and MessageBus connection.
 */
export class KeritsMessageBusFactory implements MessageBusFactory {
  constructor(private userId: string, private accountAlias: string) {}

  /**
   * Connect to MessageBus
   *
   * 1. Extracts identity from KERITS account
   * 2. Registers key state with Convex
   * 3. Returns connected MessageBus
   */
  async connect(config?: Partial<MessageBusConfig>): Promise<MessageBus> {
    // 1. Extract identity from KERITS account
    const identity = await getMessagingIdentity(this.userId, this.accountAlias);

    console.log('[KERITS MessageBusFactory] Identity extracted:', {
      aid: identity.aid.substring(0, 20) + '...',
      alias: identity.alias,
      ksn: identity.ksn,
    });

    // 2. Create Convex client (shared for both registration and message bus)
    const { ConvexClient } = await import('convex/browser');
    const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://accurate-penguin-901.convex.cloud';
    const client = new ConvexClient(convexUrl);

    // 3. Register key state with Convex backend using the shared client
    try {
      await this.registerKeyState(identity, client);
    } catch (error) {
      // Key state might already be registered, log the error but continue
      console.error('[KERITS MessageBusFactory] Key state registration error:', error);
      // Don't throw - maybe it's already registered
    }

    // 4. Create MessageBus config with Signer
    const busConfig: MessageBusConfig = {
      userAid: identity.aid,
      signer: identity.signer,
      ksn: identity.ksn,
      backendConfig: {
        convexUrl,
        ...config?.backendConfig,
      },
    };

    // 5. Connect to ConvexMessageBus with pre-created client
    const { ConvexMessageBus } = await import('../merits/lib/message-bus/convex-message-bus');
    return await ConvexMessageBus.connectWithClient(client, busConfig);
  }

  /**
   * Register key state with Convex backend
   */
  private async registerKeyState(identity: MessagingIdentity, client: any): Promise<void> {
    // Get the KEL to extract current key state
    const dsl = await getDSL(this.userId);
    const accountDsl = await dsl.account(identity.alias);
    if (!accountDsl) {
      throw new Error(`Account DSL not found: ${identity.alias}`);
    }

    const kelEvents = await accountDsl.getKel();
    if (kelEvents.length === 0) {
      throw new Error('No KEL events found');
    }

    console.log('[KERITS MessageBusFactory] KEL events:', kelEvents.length);

    // Get the LATEST event for current key state (not inception!)
    const latestEvent = kelEvents[kelEvents.length - 1];

    // KERITS stores events with meta property containing the parsed KED
    const ked = latestEvent.meta?.ked || latestEvent;

    // Extract keys and threshold from the event
    const keys = ked.k || ked.keys || [];
    const threshold = ked.kt || ked.threshold || '1';
    const lastEvtSaid = ked.d || latestEvent.meta?.d || '';

    if (keys.length === 0) {
      console.error('[KERITS MessageBusFactory] KEL event structure:', latestEvent);
      throw new Error('No keys found in KEL event');
    }

    // Verify signer's public key matches the keys in the KEL
    const signerPubKey = identity.signer.verfer.qb64;
    console.log('[KERITS MessageBusFactory] Signer public key:', signerPubKey);
    console.log('[KERITS MessageBusFactory] KEL keys:', keys);
    console.log('[KERITS MessageBusFactory] Signer key in KEL:', keys.includes(signerPubKey));

    if (!keys.includes(signerPubKey)) {
      console.error('[KERITS MessageBusFactory] KEY MISMATCH!');
      console.error('[KERITS MessageBusFactory] Signer public key:', signerPubKey);
      console.error('[KERITS MessageBusFactory] KEL keys:', keys);
      throw new Error(
        `Signer public key does not match KEL keys. ` +
        `Signer has ${signerPubKey}, but KEL has ${keys.join(', ')}. ` +
        `This indicates the KeyManager is using a different key than what's in the KEL.`
      );
    }

    console.log('[KERITS MessageBusFactory] Registering key state:', {
      aid: identity.aid.substring(0, 20) + '...',
      ksn: identity.ksn,
      keys: keys,
      threshold,
      lastEvtSaid: lastEvtSaid.substring(0, 20) + '...',
      kelEventsCount: kelEvents.length,
    });

    // Register key state using the provided client
    try {
      // @ts-ignore - Using Convex without generated types
      await client.mutation('auth:registerKeyState', {
        aid: identity.aid,
        ksn: identity.ksn,
        keys,
        threshold,
        lastEvtSaid,
      });

      console.log('[KERITS MessageBusFactory] Key state registered successfully');
    } catch (error) {
      console.error('[KERITS MessageBusFactory] Key state registration failed:', error);
      throw error;
    }
    // Note: Don't close the client - it will be used by the message bus
  }
}

/**
 * Initialize MERITS stores with KERITS storage
 *
 * Separate from MessageBus initialization - sets up managers and store state.
 *
 * @param userId - KERITS user ID
 * @param accountAlias - Account alias to use for messaging
 */
export async function initializeStores(userId: string, accountAlias: string): Promise<AID> {
  console.log('[KERITS Stores] Initializing stores for:', accountAlias);

  // Get messaging identity to retrieve AID
  const identity = await getMessagingIdentity(userId, accountAlias);

  // Create raw Kv instance for MERITS storage (same database as KERITS)
  const { IndexedDBKv } = await import('../../../src/storage/adapters/indexeddb');
  const kv = new IndexedDBKv(`kerits-app-${userId}`);

  // Create MERITS-compatible KV stores with namespacing
  const { createMeritsKv } = await import('./storage-bridge');

  const contactKv = createMeritsKv(kv, `merits:${identity.aid}:contacts`);
  const messageKv = createMeritsKv(kv, `merits:${identity.aid}:messages`);
  const settingsKv = createMeritsKv(kv, `merits:${identity.aid}:settings`);
  const groupsKv = createMeritsKv(kv, `merits:${identity.aid}:groups`);
  const aclKv = createMeritsKv(kv, `merits:${identity.aid}:acl`);

  // Import MERITS managers
  const { ContactManager } = await import('../merits/lib/dsl/contacts/manager');
  const { MessageManager } = await import('../merits/lib/dsl/messages/manager');
  const { SettingsManager } = await import('../merits/lib/dsl/settings/manager');
  const { GroupManager } = await import('../merits/lib/dsl/groups/manager');
  const { ACLManager } = await import('../merits/lib/dsl/acl/manager');

  // Create managers with unified storage
  const contactManager = new ContactManager(contactKv);
  const messageManager = new MessageManager(messageKv, identity.aid);
  const settingsManager = new SettingsManager(settingsKv);
  const groupManager = new GroupManager(groupsKv, identity.aid);
  const aclManager = new ACLManager(aclKv);

  // Import MERITS stores
  const { useContacts } = await import('../merits/store/contacts');
  const { useMessages } = await import('../merits/store/messages');
  const { useSettings } = await import('../merits/store/settings');
  const { useGroups } = await import('../merits/store/groups');

  // Initialize stores with pre-created managers
  const contactsState = useContacts.getState();
  contactsState.contactManager = contactManager;
  contactsState.aclManager = aclManager;
  await contactsState.refreshContacts();

  const messagesState = useMessages.getState();
  messagesState.messageManager = messageManager;

  const settingsState = useSettings.getState();
  settingsState.settingsManager = settingsManager;
  const settings = await settingsManager.getSettings();
  settingsState.settings = settings;

  const groupsState = useGroups.getState();
  groupsState.groupManager = groupManager;
  await groupsState.refreshGroups();

  console.log('[KERITS Stores] Stores initialized successfully');

  return identity.aid;
}
