/**
 * Message Queueing Tests
 *
 * Tests for querying pending/undelivered messages and message flushing.
 * These tests verify the client-side message queue management for offline recipients.
 *
 * Related: docs/adr/001-messaging-architecture.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageManager } from '../manager';
import { MemoryKv } from '../../../storage';

describe('MessageManager - Queueing', () => {
  let manager: MessageManager;
  let kv: MemoryKv;
  const userAid = 'test-user-123';
  const contactAid = 'test-contact-456';

  beforeEach(async () => {
    kv = new MemoryKv();
    manager = new MessageManager(kv, userAid);
  });

  describe('getPendingMessages', () => {
    it('should return empty array when no messages exist', async () => {
      const pending = await manager.getPendingMessages(contactAid);
      expect(pending).toEqual([]);
    });

    it('should return only messages in "sending" status', async () => {
      // Create messages with different statuses
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 1'
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 2'
      });

      const msg3 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 3'
      });

      // Update statuses: msg1=sending, msg2=sent, msg3=delivered
      await manager.updateMessageStatus(msg2.id, 'sent');
      await manager.updateMessageStatus(msg3.id, 'delivered');

      // Should only return msg1 (still in 'sending' status)
      const pending = await manager.getPendingMessages(contactAid);

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(msg1.id);
      expect(pending[0].status).toBe('sending');
      expect(pending[0].content).toBe('Message 1');
    });

    it('should return messages in sequence order', async () => {
      // Create 3 messages, all in 'sending' status
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'First'
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Second'
      });

      const msg3 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Third'
      });

      const pending = await manager.getPendingMessages(contactAid);

      expect(pending).toHaveLength(3);
      expect(pending[0].seq).toBe(0);
      expect(pending[1].seq).toBe(1);
      expect(pending[2].seq).toBe(2);
      expect(pending[0].content).toBe('First');
      expect(pending[1].content).toBe('Second');
      expect(pending[2].content).toBe('Third');
    });

    it('should only return messages for the specified contact', async () => {
      const otherContact = 'other-contact-789';

      // Create message for contactAid
      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'For contact 1'
      });

      // Create message for otherContact
      await manager.createMessage({
        channelId: otherContact,
        to: otherContact,
        content: 'For contact 2'
      });

      const pending = await manager.getPendingMessages(contactAid);

      expect(pending).toHaveLength(1);
      expect(pending[0].content).toBe('For contact 1');
      expect(pending[0].to).toBe(contactAid);
    });
  });

  describe('getPendingMessageCount', () => {
    it('should return 0 when no pending messages', async () => {
      const count = await manager.getPendingMessageCount(contactAid);
      expect(count).toBe(0);
    });

    it('should return correct count of pending messages', async () => {
      // Create 3 messages in 'sending' status
      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 1'
      });

      await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 2'
      });

      const msg3 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 3'
      });

      // Mark one as sent
      await manager.updateMessageStatus(msg3.id, 'sent');

      const count = await manager.getPendingMessageCount(contactAid);
      expect(count).toBe(2); // Only 2 still in 'sending' status
    });
  });

  describe('getUndeliveredMessages', () => {
    it('should return empty array when no messages exist', async () => {
      const undelivered = await manager.getUndeliveredMessages();
      expect(undelivered).toEqual([]);
    });

    it('should return messages in "sending" or "sent" status across all channels', async () => {
      const contact1 = 'contact-1';
      const contact2 = 'contact-2';

      // Create messages for contact1
      const msg1 = await manager.createMessage({
        channelId: contact1,
        to: contact1,
        content: 'Msg 1'
      }); // sending

      const msg2 = await manager.createMessage({
        channelId: contact1,
        to: contact1,
        content: 'Msg 2'
      });
      await manager.updateMessageStatus(msg2.id, 'sent');

      const msg3 = await manager.createMessage({
        channelId: contact1,
        to: contact1,
        content: 'Msg 3'
      });
      await manager.updateMessageStatus(msg3.id, 'delivered');

      // Create messages for contact2
      const msg4 = await manager.createMessage({
        channelId: contact2,
        to: contact2,
        content: 'Msg 4'
      }); // sending

      const msg5 = await manager.createMessage({
        channelId: contact2,
        to: contact2,
        content: 'Msg 5'
      });
      await manager.updateMessageStatus(msg5.id, 'read');

      const undelivered = await manager.getUndeliveredMessages();

      // Should include: msg1 (sending), msg2 (sent), msg4 (sending)
      // Should NOT include: msg3 (delivered), msg5 (read)
      expect(undelivered).toHaveLength(3);

      const contents = undelivered.map(m => m.content).sort();
      expect(contents).toEqual(['Msg 1', 'Msg 2', 'Msg 4']);
    });

    it('should return empty array when all messages are delivered or read', async () => {
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 1'
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Message 2'
      });

      // Mark both as delivered
      await manager.updateMessageStatus(msg1.id, 'delivered');
      await manager.updateMessageStatus(msg2.id, 'read');

      const undelivered = await manager.getUndeliveredMessages();
      expect(undelivered).toEqual([]);
    });
  });

  describe('Offline Recipient Scenario', () => {
    /**
     * Test Case: User A sends messages to offline User B
     *
     * This tests the scenario documented in:
     * docs/adr/001-messaging-architecture.md
     *
     * Steps:
     * 1. User A creates messages (status: 'sending')
     * 2. Send attempts fail (recipient offline)
     * 3. Messages remain in 'sending' status (queued locally)
     * 4. Query shows pending messages waiting for recipient
     */
    it('should queue messages for offline recipient', async () => {
      console.log('Scenario: User A sends messages to offline User B');

      // User A creates 3 messages to User B
      console.log('1. User A creates messages (status: sending)');
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Hello'
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Are you there?'
      });

      const msg3 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Let me know when you see this'
      });

      // Verify all messages are in 'sending' status
      expect(msg1.status).toBe('sending');
      expect(msg2.status).toBe('sending');
      expect(msg3.status).toBe('sending');

      console.log('2. Messages remain in sending status (recipient offline)');

      // Query pending messages
      console.log('3. Query shows 3 pending messages');
      const pending = await manager.getPendingMessages(contactAid);
      expect(pending).toHaveLength(3);

      console.log('4. Messages can be queried and are ready to flush when recipient comes online');
      const undelivered = await manager.getUndeliveredMessages();
      expect(undelivered).toHaveLength(3);

      // Verify messages are in correct order
      expect(pending[0].content).toBe('Hello');
      expect(pending[1].content).toBe('Are you there?');
      expect(pending[2].content).toBe('Let me know when you see this');
    });

    /**
     * Test Case: Recipient comes online, messages get flushed
     *
     * This simulates what happens in the store layer when:
     * - User B connects and broadcasts presence
     * - User A receives presence notification
     * - User A flushes queued messages (status: sending → sent)
     */
    it('should update message status after flushing queue', async () => {
      console.log('Scenario: Recipient comes online, sender flushes queue');

      // User A creates messages while B is offline
      console.log('1. User A creates messages while B offline');
      const msg1 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Queued message 1'
      });

      const msg2 = await manager.createMessage({
        channelId: contactAid,
        to: contactAid,
        content: 'Queued message 2'
      });

      // Verify both are pending
      let pending = await manager.getPendingMessages(contactAid);
      expect(pending).toHaveLength(2);

      // Simulate flushing: User B comes online, User A sends queued messages
      console.log('2. User B comes online, User A receives presence notification');
      console.log('3. User A flushes queued messages (DSL updates status)');

      await manager.updateMessageStatus(msg1.id, 'sent');
      await manager.updateMessageStatus(msg2.id, 'sent');

      // Verify no longer pending (status changed from 'sending' to 'sent')
      console.log('4. Messages no longer in pending queue');
      pending = await manager.getPendingMessages(contactAid);
      expect(pending).toHaveLength(0);

      // Verify messages still exist but with new status
      const allMessages = await manager.getChannelMessages(contactAid);
      expect(allMessages).toHaveLength(2);
      expect(allMessages[0].status).toBe('sent');
      expect(allMessages[1].status).toBe('sent');
    });
  });
});
