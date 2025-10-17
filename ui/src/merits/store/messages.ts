/**
 * Messages Store (Updated for MessageBus)
 *
 * Simplified message handling with MessageBus integration.
 * Keeps local storage for messages but uses MessageBus for transport.
 */

import { create } from 'zustand';
import type { StoredMessage, DetailedMessageStatus } from '../lib/dsl/messages/types';
import { MessageManager } from '../lib/dsl/messages/manager';
import { IndexedDBKv } from '../lib/storage';
import { useConnection } from './connection';
import { useContacts } from './contacts';
import { useSettings } from './settings';
import { mockEncrypt, mockDecrypt } from '../lib/crypto/simple-crypto';
import type { EncryptedMessage } from '../lib/message-bus';

interface MessagesState {
  // State
  messages: Map<string, StoredMessage[]>; // channelId -> messages
  loading: boolean;
  error: string | null;

  // Manager (scoped to current user)
  messageManager: MessageManager | null;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  sendMessage: (toAid: string, content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  receiveEncryptedMessage: (encMsg: EncryptedMessage) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  getChannelMessages: (channelId: string) => Promise<StoredMessage[]>;
  refreshChannel: (channelId: string) => Promise<void>;
}

export const useMessages = create<MessagesState>((set, get) => ({
  // Initial state
  messages: new Map(),
  loading: false,
  error: null,
  messageManager: null,

  // Initialize - create manager scoped to user
  initialize: async (userAid: string) => {
    console.log('[Messages] Initializing for user:', userAid);
    set({ loading: true, error: null });

    try {
      // Create KV store scoped to user
      const messageKv = new IndexedDBKv({ namespace: `${userAid}:messages` });
      const manager = new MessageManager(messageKv, userAid);

      set({ messageManager: manager, loading: false });
      console.log('[Messages] Initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize messages';
      console.error('[Messages] Initialization error:', message);
      set({ error: message, loading: false });
    }
  },

  // Send message
  sendMessage: async (toAid: string, content: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      throw new Error('MessageManager not initialized');
    }

    let messageId: string | null = null;

    try {
      // Create and store message locally
      const message = await messageManager.createMessage({
        channelId: toAid,
        to: toAid,
        content,
      });

      messageId = message.id;
      console.log('[Messages] Message created:', message.id.substring(0, 16));

      // Check connection before sending
      const connectionStore = useConnection.getState();
      if (!connectionStore.bus) {
        throw new Error('Not connected to MessageBus');
      }

      // Encrypt message content
      const ciphertext = mockEncrypt(JSON.stringify({
        type: 'message',
        id: message.id,
        prevId: message.prevId,
        content: message.content,
        timestamp: message.timestamp,
      }));

      // Send via MessageBus
      await connectionStore.bus.sendMessage({
        recipientAid: toAid,
        ciphertext,
        ttl: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Update status to 'sent'
      await messageManager.updateMessageStatus(message.id, 'sent');

      // Update contact's lastMessageAt for sorting
      const contactsStore = useContacts.getState();
      await contactsStore.updateContact(toAid, { lastMessageAt: message.timestamp });
      await contactsStore.refreshContacts();

      // Refresh channel in state
      await get().refreshChannel(toAid);
    } catch (error) {
      console.error('[Messages] Send error:', error);

      // Mark message as failed with error details
      if (messageId) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        await messageManager.updateMessageStatus(messageId, 'failed', errorMessage);
        await get().refreshChannel(toAid);
      }

      throw error;
    }
  },

  // Retry sending a failed message
  retryMessage: async (messageId: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      throw new Error('MessageManager not initialized');
    }

    try {
      // Get the failed message
      const message = await messageManager.getMessage(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.status !== 'failed') {
        throw new Error('Can only retry failed messages');
      }

      console.log('[Messages] Retrying message:', messageId.substring(0, 16));

      // Update status to 'sending'
      await messageManager.updateMessageStatus(messageId, 'sending', undefined);
      await get().refreshChannel(message.channelId);

      // Check connection
      const connectionStore = useConnection.getState();
      if (!connectionStore.bus) {
        throw new Error('Not connected to MessageBus');
      }

      // Encrypt and send
      const ciphertext = mockEncrypt(JSON.stringify({
        type: 'message',
        id: message.id,
        prevId: message.prevId,
        content: message.content,
        timestamp: message.timestamp,
      }));

      await connectionStore.bus.sendMessage({
        recipientAid: message.to,
        ciphertext,
        ttl: 24 * 60 * 60 * 1000,
      });

      // Update status to 'sent'
      await messageManager.updateMessageStatus(message.id, 'sent');
      await get().refreshChannel(message.channelId);
    } catch (error) {
      console.error('[Messages] Retry error:', error);

      // Mark as failed again
      const message = await messageManager.getMessage(messageId);
      if (message) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
        await messageManager.updateMessageStatus(messageId, 'failed', errorMessage);
        await get().refreshChannel(message.channelId);
      }

      throw error;
    }
  },

  // Receive encrypted message from MessageBus
  receiveEncryptedMessage: async (encMsg: EncryptedMessage) => {
    const { messageManager } = get();
    if (!messageManager) {
      console.warn('[Messages] Received message but manager not initialized');
      return;
    }

    try {
      // Decrypt message
      const decryptedStr = mockDecrypt(encMsg.ciphertext);
      const payload = JSON.parse(decryptedStr);

      console.log('[Messages] Received payload:', payload);

      // Handle regular messages
      if (payload.type === 'message') {
        const { id, prevId, content, timestamp } = payload;
        const senderAid = encMsg.senderAid;

        // Step 1: Check ACL - Is sender blocked or muted?
        const contactsStore = useContacts.getState();
        const isBlocked = await contactsStore.isBlocked(senderAid);
        const isMuted = await contactsStore.isMuted(senderAid);

        if (isBlocked || isMuted) {
          console.log('[Messages] Message dropped: sender blocked/muted:', senderAid.substring(0, 20));
          return; // NO STORAGE, NO ACK
        }

        // Step 2: Check if sender is a contact
        const contact = contactsStore.contacts.find(c => c.aid === senderAid);

        if (!contact) {
          // Step 3: Check settings - Block unknown senders?
          const settingsStore = useSettings.getState();
          const settings = settingsStore.settings;

          if (settings.blockUnknownSenders) {
            console.log('[Messages] Message dropped: unknown sender blocked by settings');
            return; // NO STORAGE, NO ACK
          }

          // Step 4: Create unknown contact
          console.log('[Messages] Creating unknown contact for sender:', senderAid.substring(0, 20));
          await contactsStore.createUnknownContact(senderAid);
        }

        // Step 5: Store received message
        const message = await messageManager.storeReceivedMessage({
          id,
          prevId,
          channelId: senderAid, // Sender is the channel
          from: senderAid,
          to: messageManager['userAid'], // Access private field (TODO: make public)
          content,
          timestamp,
        });

        console.log('[Messages] Message stored:', message.id.substring(0, 16));

        // Step 6: Update contact's lastMessageAt
        await contactsStore.updateContact(senderAid, { lastMessageAt: timestamp });
        await contactsStore.refreshContacts();

        // Step 7: Send acknowledgment to Convex
        const connectionStore = useConnection.getState();
        if (connectionStore.bus) {
          try {
            await connectionStore.bus.acknowledgeMessage(encMsg.id, encMsg.envelopeHash);
            console.log('[Messages] Acknowledged message:', encMsg.id);
          } catch (error) {
            console.warn('[Messages] Failed to acknowledge message:', error);
          }
        }

        // Step 8: Refresh channel
        await get().refreshChannel(senderAid);
      }
    } catch (error) {
      console.error('[Messages] Receive error:', error);
    }
  },

  // Mark message as read
  markAsRead: async (messageId: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      throw new Error('MessageManager not initialized');
    }

    // Update local status
    await messageManager.updateMessageStatus(messageId, 'read');

    // Get channel and refresh
    const message = await messageManager.getMessage(messageId);
    if (message) {
      await get().refreshChannel(message.channelId);
    }

    // TODO: Send 'read' notification via MessageBus if needed
  },

  // Get messages for a channel
  getChannelMessages: async (channelId: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      return [];
    }

    return messageManager.getChannelMessages(channelId);
  },

  // Refresh channel messages in state
  refreshChannel: async (channelId: string) => {
    const { messageManager, messages } = get();
    if (!messageManager) {
      return;
    }

    const channelMessages = await messageManager.getChannelMessages(channelId);
    const newMessages = new Map(messages);
    newMessages.set(channelId, channelMessages);

    set({ messages: newMessages });
  },
}));
