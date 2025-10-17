/**
 * Message Manager
 *
 * Manages message chains with blockchain-like structure.
 * Each channel (contact) has its own chain of messages.
 */

import type { Kv } from '../../storage';
import type { StoredMessage, ChannelMetadata, MessageStatus } from './types';

export class MessageManager {
  private kv: Kv;
  private userAid: string;

  constructor(kv: Kv, userAid: string) {
    this.kv = kv;
    this.userAid = userAid;
  }

  /**
   * Compute SHA-256 hash of message content
   */
  private async computeHash(message: Omit<StoredMessage, 'id' | 'status' | 'seq'>): Promise<string> {
    const data = JSON.stringify({
      prevId: message.prevId,
      channelId: message.channelId,
      from: message.from,
      to: message.to,
      content: message.content,
      timestamp: message.timestamp,
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  /**
   * Get channel metadata
   */
  private async getChannelMetadata(channelId: string): Promise<ChannelMetadata> {
    const key = `channel:${channelId}:meta`;
    const data = await this.kv.get(key);

    if (!data) {
      return {
        channelId,
        headId: null,
        messageCount: 0,
        lastActivity: 0,
      };
    }

    return JSON.parse(data);
  }

  /**
   * Update channel metadata
   */
  private async updateChannelMetadata(metadata: ChannelMetadata): Promise<void> {
    const key = `channel:${metadata.channelId}:meta`;
    await this.kv.set(key, JSON.stringify(metadata));
  }

  /**
   * Create and store a new message
   */
  async createMessage(params: {
    channelId: string;
    to: string;
    content: string;
  }): Promise<StoredMessage> {
    const { channelId, to, content } = params;

    // Get channel metadata to find previous message
    const metadata = await this.getChannelMetadata(channelId);

    // Create message
    const timestamp = Date.now();
    const prevId = metadata.headId;
    const seq = metadata.messageCount;

    // Compute hash
    const messageData = {
      prevId,
      channelId,
      from: this.userAid,
      to,
      content,
      timestamp,
    };
    const id = await this.computeHash(messageData);

    const message: StoredMessage = {
      ...messageData,
      id,
      status: 'sending',
      seq,
    };

    // Store message by ID
    await this.kv.set(`message:${id}`, JSON.stringify(message));

    // Store message in channel sequence
    await this.kv.set(`channel:${channelId}:seq:${seq}`, id);

    // Update channel metadata
    await this.updateChannelMetadata({
      ...metadata,
      headId: id,
      messageCount: seq + 1,
      lastActivity: timestamp,
    });

    return message;
  }

  /**
   * Store a received message
   */
  async storeReceivedMessage(params: {
    id: string;
    prevId: string | null;
    channelId: string;
    from: string;
    to: string;
    content: string;
    timestamp: number;
  }): Promise<StoredMessage> {
    const { id, prevId, channelId, from, to, content, timestamp } = params;

    // Get channel metadata
    const metadata = await this.getChannelMetadata(channelId);

    const message: StoredMessage = {
      id,
      prevId,
      channelId,
      from,
      to,
      content,
      timestamp,
      status: 'received',
      seq: metadata.messageCount,
    };

    // Store message by ID
    await this.kv.set(`message:${id}`, JSON.stringify(message));

    // Store message in channel sequence
    await this.kv.set(`channel:${channelId}:seq:${message.seq}`, id);

    // Update channel metadata
    await this.updateChannelMetadata({
      ...metadata,
      headId: id,
      messageCount: message.seq + 1,
      lastActivity: timestamp,
    });

    return message;
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: MessageStatus, error?: string): Promise<void> {
    const data = await this.kv.get(`message:${messageId}`);
    if (!data) {
      throw new Error(`Message not found: ${messageId}`);
    }

    const message: StoredMessage = JSON.parse(data);
    message.status = status;
    if (error !== undefined) {
      message.error = error;
    }

    await this.kv.set(`message:${messageId}`, JSON.stringify(message));
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId: string): Promise<StoredMessage | null> {
    const data = await this.kv.get(`message:${messageId}`);
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  /**
   * Get all messages for a channel (ordered by sequence)
   */
  async getChannelMessages(channelId: string): Promise<StoredMessage[]> {
    const metadata = await this.getChannelMetadata(channelId);
    const messages: StoredMessage[] = [];

    for (let seq = 0; seq < metadata.messageCount; seq++) {
      const messageId = await this.kv.get(`channel:${channelId}:seq:${seq}`);
      if (messageId) {
        const message = await this.getMessage(messageId);
        if (message) {
          messages.push(message);
        }
      }
    }

    return messages;
  }

  /**
   * Get channel metadata (public)
   */
  async getChannelInfo(channelId: string): Promise<ChannelMetadata> {
    return this.getChannelMetadata(channelId);
  }

  /**
   * Get pending messages for a specific contact
   * Returns messages in 'sending' status (queued, waiting for recipient to come online)
   */
  async getPendingMessages(contactAid: string): Promise<StoredMessage[]> {
    const messages = await this.getChannelMessages(contactAid);
    return messages.filter(msg => msg.status === 'sending');
  }

  /**
   * Get all undelivered messages across all channels
   * Returns messages in 'sending' or 'sent' status (not yet delivered)
   */
  async getUndeliveredMessages(): Promise<StoredMessage[]> {
    // Get all channel metadata keys
    const allKeys = await this.kv.list('channel:');
    const channelKeys = allKeys.filter(key => key.endsWith(':meta'));

    const undeliveredMessages: StoredMessage[] = [];

    for (const key of channelKeys) {
      // Extract channelId from "channel:AID:meta"
      const parts = key.split(':');
      const channelId = parts[1]; // AID is the second part

      const messages = await this.getChannelMessages(channelId);
      const undelivered = messages.filter(
        msg => msg.status === 'sending' || msg.status === 'sent'
      );
      undeliveredMessages.push(...undelivered);
    }

    return undeliveredMessages;
  }

  /**
   * Get count of pending messages for a contact
   */
  async getPendingMessageCount(contactAid: string): Promise<number> {
    const pending = await this.getPendingMessages(contactAid);
    return pending.length;
  }

  /**
   * Verify message chain integrity for a channel
   */
  async verifyChain(channelId: string): Promise<{ valid: boolean; error?: string }> {
    const messages = await this.getChannelMessages(channelId);

    if (messages.length === 0) {
      return { valid: true };
    }

    // Check first message has no prev
    if (messages[0].prevId !== null) {
      return { valid: false, error: 'First message should have null prevId' };
    }

    // Check chain links
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].prevId !== messages[i - 1].id) {
        return {
          valid: false,
          error: `Chain broken at message ${i}: expected prevId ${messages[i - 1].id}, got ${messages[i].prevId}`,
        };
      }
    }

    return { valid: true };
  }
}
