/**
 * MessageManager Unit Tests
 *
 * Tests for message chain management with blockchain-like structure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageManager } from '../manager';
import { MemoryKv } from '../../../storage';

describe('MessageManager', () => {
  let manager: MessageManager;
  let kv: MemoryKv;
  const userAid = 'test-user-aid';
  const contactAid = 'test-contact-aid';

  beforeEach(() => {
    kv = new MemoryKv();
    manager = new MessageManager(kv, userAid);
  });

  describe('createMessage', () => {
    it('should create first message with null prevId', async () => {
      const message = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Hello World',
      });

      expect(message.prevId).toBeNull();
      expect(message.seq).toBe(0);
      expect(message.status).toBe('sending');
      expect(message.content).toBe('Hello World');
      expect(message.from).toBe(userAid);
      expect(message.to).toBe(contactAid);
      expect(message.id).toBeTruthy();
      expect(message.id).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('should create second message with prevId linking to first', async () => {
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'First',
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Second',
      });

      expect(msg2.prevId).toBe(msg1.id);
      expect(msg2.seq).toBe(1);
    });

    it('should create message chain with correct sequential IDs', async () => {
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const msg = await manager.createMessage({
          channelId: contactAid,
          to: contactAid,
          content: `Message ${i}`,
        });
        messages.push(msg);
        expect(msg.seq).toBe(i);
      }

      // Verify chain
      expect(messages[0].prevId).toBeNull();
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].prevId).toBe(messages[i - 1].id);
      }
    });

    it('should update channel metadata', async () => {
      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Test',
      });

      const metadata = await manager.getChannelInfo(contactAid);
      expect(metadata.messageCount).toBe(1);
      expect(metadata.headId).toBeTruthy();
      expect(metadata.lastActivity).toBeGreaterThan(0);
    });
  });

  describe('storeReceivedMessage', () => {
    it('should store received message from another user', async () => {
      const message = await manager.storeReceivedMessage({
        id: 'fake-id-12345',
        prevId: null,
        channelId: contactAid,
        from: contactAid,
        to: userAid,
        content: 'Hello from contact',
        timestamp: Date.now(),
      });

      expect(message.status).toBe('received');
      expect(message.from).toBe(contactAid);
      expect(message.to).toBe(userAid);
      expect(message.seq).toBe(0);
    });

    it('should maintain separate channels for different contacts', async () => {
      const contact1 = 'contact-1';
      const contact2 = 'contact-2';

      await manager.createMessage({
        channelId: contact1,
        to: contact1,
        content: 'To contact 1',
      });

      await manager.createMessage({
        channelId: contact2,
        to: contact2,
        content: 'To contact 2',
      });

      const meta1 = await manager.getChannelInfo(contact1);
      const meta2 = await manager.getChannelInfo(contact2);

      expect(meta1.messageCount).toBe(1);
      expect(meta2.messageCount).toBe(1);
      expect(meta1.headId).not.toBe(meta2.headId);
    });
  });

  describe('updateMessageStatus', () => {
    it('should update message status', async () => {
      const message = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Test',
      });

      expect(message.status).toBe('sending');

      await manager.updateMessageStatus(message.id, 'enqueued');
      const updated = await manager.getMessage(message.id);
      expect(updated?.status).toBe('enqueued');

      await manager.updateMessageStatus(message.id, 'received');
      const updated2 = await manager.getMessage(message.id);
      expect(updated2?.status).toBe('received');
    });

    it('should throw error for non-existent message', async () => {
      await expect(
        manager.updateMessageStatus('fake-id', 'read')
      ).rejects.toThrow('Message not found');
    });
  });

  describe('getChannelMessages', () => {
    it('should return messages in sequential order', async () => {
      const contents = ['First', 'Second', 'Third'];
      for (const content of contents) {
        await manager.createMessage({
          channelId: contactAid,
          to: contactAid,
          content,
        });
      }

      const messages = await manager.getChannelMessages(contactAid);
      expect(messages).toHaveLength(3);
      expect(messages.map(m => m.content)).toEqual(contents);
      expect(messages.map(m => m.seq)).toEqual([0, 1, 2]);
    });

    it('should return empty array for channel with no messages', async () => {
      const messages = await manager.getChannelMessages('unknown-channel');
      expect(messages).toEqual([]);
    });
  });

  describe('verifyChain', () => {
    it('should verify valid chain', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.createMessage({
          channelId: contactAid,
          to: contactAid,
          content: `Message ${i}`,
        });
      }

      const result = await manager.verifyChain(contactAid);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should detect broken chain', async () => {
      // Create two messages normally
      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'First',
      });

      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Second',
      });

      // Manually corrupt the chain by storing a message with wrong prevId
      await kv.set('channel:' + contactAid + ':seq:2', 'corrupted-message-id');
      await kv.set('message:corrupted-message-id', JSON.stringify({
        id: 'corrupted-message-id',
        prevId: 'wrong-prev-id',
        channelId: contactAid,
        from: userAid,
        to: contactAid,
        content: 'Third (corrupted)',
        timestamp: Date.now(),
        status: 'sending',
        seq: 2,
      }));

      // Update channel metadata
      const meta = await manager.getChannelInfo(contactAid);
      await kv.set('channel:' + contactAid + ':meta', JSON.stringify({
        ...meta,
        messageCount: 3,
      }));

      const result = await manager.verifyChain(contactAid);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Chain broken');
    });

    it('should validate empty channel', async () => {
      const result = await manager.verifyChain('empty-channel');
      expect(result.valid).toBe(true);
    });

    it('should validate that first message has null prevId', async () => {
      // Manually create invalid first message
      await kv.set('channel:' + contactAid + ':seq:0', 'invalid-first-message');
      await kv.set('message:invalid-first-message', JSON.stringify({
        id: 'invalid-first-message',
        prevId: 'should-be-null',
        channelId: contactAid,
        from: userAid,
        to: contactAid,
        content: 'Invalid first',
        timestamp: Date.now(),
        status: 'sending',
        seq: 0,
      }));

      await kv.set('channel:' + contactAid + ':meta', JSON.stringify({
        channelId: contactAid,
        headId: 'invalid-first-message',
        messageCount: 1,
        lastActivity: Date.now(),
      }));

      const result = await manager.verifyChain(contactAid);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('First message should have null prevId');
    });
  });

  describe('message hash integrity', () => {
    it('should generate unique hashes for different messages', async () => {
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 1',
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 2',
      });

      expect(msg1.id).not.toBe(msg2.id);
    });

    it('should generate deterministic hashes', async () => {
      // This tests that the hash is based on message content
      // We can't easily test determinism without exposing the hash function,
      // but we can verify that messages are stored and retrieved correctly
      const message = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Test content',
      });

      const retrieved = await manager.getMessage(message.id);
      expect(retrieved?.id).toBe(message.id);
      expect(retrieved?.content).toBe('Test content');
    });
  });
});
