/**
 * Contact Store
 *
 * React state for contacts using DSL layer.
 * Manages ContactManager and ACLManager with IndexedDBKv storage.
 */

import { create } from 'zustand';
import type { Contact } from '../lib/dsl/contacts/types';
import { ContactManager } from '../lib/dsl/contacts/manager';
import { ACLManager } from '../lib/dsl/acl/manager';
import { IndexedDBKv } from '../lib/storage';

interface ContactState {
  // State
  contacts: Contact[];
  selectedContactAid: string | null;
  loading: boolean;
  error: string | null;

  // Managers (scoped to current user)
  contactManager: ContactManager | null;
  aclManager: ACLManager | null;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  addContact: (aid: string, alias?: string) => Promise<Contact>;
  createUnknownContact: (aid: string) => Promise<Contact>;
  promoteUnknownToContact: (aid: string, alias: string) => Promise<Contact>;
  removeContact: (aid: string) => Promise<void>;
  updateContact: (aid: string, updates: Partial<Contact>) => Promise<void>;
  selectContact: (aid: string | null) => void;
  refreshContacts: () => Promise<void>;

  // ACL actions
  blockContact: (aid: string) => Promise<void>;
  muteContact: (aid: string) => Promise<void>;
  hideContact: (aid: string) => Promise<void>;
  isBlocked: (aid: string) => Promise<boolean>;
  isMuted: (aid: string) => Promise<boolean>;
  isHidden: (aid: string) => Promise<boolean>;
}

export const useContacts = create<ContactState>((set, get) => ({
  // Initial state
  contacts: [],
  selectedContactAid: null,
  loading: false,
  error: null,
  contactManager: null,
  aclManager: null,

  // Initialize - create managers scoped to user
  initialize: async (userAid: string) => {
    console.log('[Contacts] Initializing for user:', userAid);
    set({ loading: true, error: null });

    try {
      // Create KV stores scoped to user
      const contactKv = new IndexedDBKv({ namespace: `${userAid}:contacts` });
      const aclKv = new IndexedDBKv({ namespace: `${userAid}:acl` });

      // Create DSL managers
      const contactManager = new ContactManager(contactKv);
      const aclManager = new ACLManager(aclKv);

      // Load contacts (sorted by most recent conversation)
      const contacts = await contactManager.listContacts({
        sortBy: 'lastMessageAt',
        sortDir: 'desc',
      });

      console.log('[Contacts] Loaded contacts:', contacts.length);

      set({
        contactManager,
        aclManager,
        contacts,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize contacts';
      console.error('[Contacts] Initialization error:', error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Add contact
  addContact: async (aid: string, alias?: string) => {
    const { contactManager } = get();
    if (!contactManager) throw new Error('Contact manager not initialized');

    console.log('[Contacts] Adding contact:', aid, alias);
    set({ loading: true, error: null });

    try {
      const contact = await contactManager.addContact(aid, alias);
      await get().refreshContacts();
      set({ loading: false });
      console.log('[Contacts] Contact added:', contact.aid);
      return contact;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add contact';
      console.error('[Contacts] Add error:', error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Create unknown contact (from stranger message)
  createUnknownContact: async (aid: string) => {
    const { contactManager } = get();
    if (!contactManager) throw new Error('Contact manager not initialized');

    console.log('[Contacts] Creating unknown contact:', aid.substring(0, 20) + '...');

    try {
      const contact = await contactManager.createUnknownContact(aid);
      await get().refreshContacts();
      return contact;
    } catch (error) {
      console.error('[Contacts] Create unknown error:', error);
      throw error;
    }
  },

  // Promote unknown contact to known contact
  promoteUnknownToContact: async (aid: string, alias: string) => {
    const { contactManager } = get();
    if (!contactManager) throw new Error('Contact manager not initialized');

    console.log('[Contacts] Promoting unknown contact:', aid, 'with alias:', alias);
    set({ loading: true, error: null });

    try {
      const contact = await contactManager.promoteUnknownToContact(aid, alias);
      await get().refreshContacts();
      set({ loading: false });
      console.log('[Contacts] Contact promoted:', aid);
      return contact;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to promote contact';
      console.error('[Contacts] Promote error:', error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Remove contact
  removeContact: async (aid: string) => {
    const { contactManager, selectedContactAid } = get();
    if (!contactManager) throw new Error('Contact manager not initialized');

    console.log('[Contacts] Removing contact:', aid);
    set({ loading: true, error: null });

    try {
      await contactManager.removeContact(aid);

      // Clear selection if removing selected contact
      if (selectedContactAid === aid) {
        set({ selectedContactAid: null });
      }

      await get().refreshContacts();
      set({ loading: false });
      console.log('[Contacts] Contact removed:', aid);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove contact';
      console.error('[Contacts] Remove error:', error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  // Update contact
  updateContact: async (aid: string, updates: Partial<Contact>) => {
    const { contactManager } = get();
    if (!contactManager) throw new Error('Contact manager not initialized');

    try {
      await contactManager.updateContact(aid, updates);
      await get().refreshContacts();
    } catch (error) {
      console.error('[Contacts] Update error:', error);
      throw error;
    }
  },

  // Select contact for messaging
  selectContact: (aid: string | null) => {
    console.log('[Contacts] Selected contact:', aid);
    set({ selectedContactAid: aid });
  },

  // Refresh contacts list
  refreshContacts: async () => {
    const { contactManager } = get();
    if (!contactManager) return;

    try {
      const contacts = await contactManager.listContacts({
        sortBy: 'lastMessageAt',
        sortDir: 'desc',
      });
      set({ contacts });
    } catch (error) {
      console.error('[Contacts] Refresh error:', error);
    }
  },

  // ACL actions
  blockContact: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) throw new Error('ACL manager not initialized');

    console.log('[Contacts] Blocking contact:', aid);
    await aclManager.blockContact(aid);
  },

  muteContact: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) throw new Error('ACL manager not initialized');

    console.log('[Contacts] Muting contact:', aid);
    await aclManager.muteContact(aid);
  },

  hideContact: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) throw new Error('ACL manager not initialized');

    console.log('[Contacts] Hiding contact:', aid);
    await aclManager.hideContact(aid);
    await get().refreshContacts();
  },

  isBlocked: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) return false;
    return await aclManager.isBlocked(aid);
  },

  isMuted: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) return false;
    return await aclManager.isMuted(aid);
  },

  isHidden: async (aid: string) => {
    const { aclManager } = get();
    if (!aclManager) return false;
    return await aclManager.isHidden(aid);
  },
}));
