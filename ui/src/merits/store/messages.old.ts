/**
 * Messages Store
 *
 * React state for messages using MessageManager DSL with IndexedDB storage.
 */

import { create } from 'zustand';
import type { StoredMessage, DetailedMessageStatus } from '../lib/dsl/messages/types';
import { MessageManager } from '../lib/dsl/messages/manager';
import { IndexedDBKv } from '../lib/storage';
import { useConnection } from './connection';
import { useContacts } from './contacts';
import { useSettings } from './settings';

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
  flushQueuedMessages: (toAid: string) => Promise<number>;
  receiveMessage: (message: any) => Promise<void>;
  sendAck: (messageId: string, ackType: 'received' | 'read') => Promise<void>;
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
      if (!connectionStore.client) {
        throw new Error('Not connected to MERITS');
      }

      // Send via MERITS
      const payload = JSON.stringify({
        type: 'message',
        id: message.id,
        prevId: message.prevId,
        content: message.content,
        timestamp: message.timestamp,
      });

      connectionStore.client.send(
        toAid,
        new TextEncoder().encode(payload),
        { id: message.id }
      );

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
      if (!connectionStore.client) {
        throw new Error('Not connected to MERITS');
      }

      // Send via MERITS
      const payload = JSON.stringify({
        type: 'message',
        id: message.id,
        prevId: message.prevId,
        content: message.content,
        timestamp: message.timestamp,
      });

      connectionStore.client.send(
        message.to,
        new TextEncoder().encode(payload),
        { id: message.id }
      );

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

  // Flush all queued messages for a contact (called when they come online)
  flushQueuedMessages: async (toAid: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      console.warn('[Messages] Cannot flush: manager not initialized');
      return 0;
    }

    try {
      console.log('[Messages] Flushing queued messages for:', toAid.substring(0, 20));

      // Get all pending messages for this contact
      const pendingMessages = await messageManager.getPendingMessages(toAid);

      if (pendingMessages.length === 0) {
        console.log('[Messages] No pending messages to flush');
        return 0;
      }

      console.log(`[Messages] Found ${pendingMessages.length} pending messages to send`);

      // Check connection
      const connectionStore = useConnection.getState();
      if (!connectionStore.client) {
        console.warn('[Messages] Cannot flush: not connected to MERITS');
        return 0;
      }

      let sentCount = 0;

      // Attempt to send each pending message
      for (const message of pendingMessages) {
        try {
          // Send via MERITS
          const payload = JSON.stringify({
            type: 'message',
            id: message.id,
            prevId: message.prevId,
            content: message.content,
            timestamp: message.timestamp,
          });

          connectionStore.client.send(
            message.to,
            new TextEncoder().encode(payload),
            { id: message.id }
          );

          // Update status to 'sent'
          await messageManager.updateMessageStatus(message.id, 'sent');
          sentCount++;
        } catch (error) {
          console.error('[Messages] Failed to send queued message:', message.id.substring(0, 16), error);
          // Mark as failed
          const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
          await messageManager.updateMessageStatus(message.id, 'failed', errorMessage);
        }
      }

      // Refresh channel to update UI
      await get().refreshChannel(toAid);

      console.log(`[Messages] Flushed ${sentCount}/${pendingMessages.length} messages`);
      return sentCount;
    } catch (error) {
      console.error('[Messages] Flush error:', error);
      return 0;
    }
  },

  // Receive message from MERITS
  receiveMessage: async (rawMessage: any) => {
    const { messageManager } = get();
    if (!messageManager) {
      console.warn('[Messages] Received message but manager not initialized');
      return;
    }

    try {
      // Decode payload
      const payloadStr = typeof rawMessage.payload === 'string'
        ? rawMessage.payload
        : new TextDecoder().decode(rawMessage.payload);
      const payload = JSON.parse(payloadStr);

      console.log('[Messages] Received payload:', payload);

      // Handle ACK messages
      if (payload.type === 'ack') {
        const { messageId, ackType } = payload;
        console.log(`[Messages] Received ${ackType} ACK for message:`, messageId.substring(0, 16));

        // Update message status
        const newStatus: DetailedMessageStatus = ackType === 'received' ? 'received' : 'read';
        await messageManager.updateMessageStatus(messageId, newStatus);

        // Refresh channel
        await get().refreshChannel(rawMessage.from);
        return;
      }

      // Handle regular messages
      if (payload.type === 'message') {
        const { id, prevId, content, timestamp } = payload;
        const senderAid = rawMessage.from;

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

            // TODO: Send notification via MERITS Agent if notifyBlockedSenders = true
            if (settings.notifyBlockedSenders) {
              console.log('[Messages] TODO: Notify sender via agent that message was blocked');
            }

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
          to: rawMessage.to,
          content,
          timestamp,
        });

        console.log('[Messages] Message stored:', message.id.substring(0, 16));

        // Step 6: Update contact's lastMessageAt
        await contactsStore.updateContact(senderAid, { lastMessageAt: timestamp });
        await contactsStore.refreshContacts();

        // Step 7: Send automatic 'received' ACK
        await get().sendAck(message.id, 'received');

        // Step 8: Refresh channel
        await get().refreshChannel(senderAid);
      }
    } catch (error) {
      console.error('[Messages] Receive error:', error);
    }
  },

  // Send ACK to message sender
  sendAck: async (messageId: string, ackType: 'received' | 'read') => {
    const { messageManager } = get();
    if (!messageManager) {
      throw new Error('MessageManager not initialized');
    }

    const connectionStore = useConnection.getState();
    if (!connectionStore.client) {
      throw new Error('Not connected to MERITS');
    }

    // Get message to find sender
    const message = await messageManager.getMessage(messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Send ACK to message sender
    const ackPayload = JSON.stringify({
      type: 'ack',
      ackType,
      messageId,
      timestamp: Date.now(),
    });

    connectionStore.client.send(message.from, new TextEncoder().encode(ackPayload));
    console.log(`[Messages] Sent ${ackType} ACK for message:`, messageId.substring(0, 16));
  },

  // Mark message as read (sends 'read' ACK)
  markAsRead: async (messageId: string) => {
    const { messageManager } = get();
    if (!messageManager) {
      throw new Error('MessageManager not initialized');
    }

    // Update local status
    await messageManager.updateMessageStatus(messageId, 'read');

    // Send 'read' ACK
    await get().sendAck(messageId, 'read');

    // Get channel and refresh
    const message = await messageManager.getMessage(messageId);
    if (message) {
      await get().refreshChannel(message.channelId);
    }
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
