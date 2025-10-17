/**
 * Unread Tracker Tests
 *
 * Tests for mark-as-read logic including scroll-into-view behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateUnreadCount,
  calculateNewLastRead,
  markAllAsRead,
  hasUnread,
  getUnreadMessageIds,
  type Message,
  type ScrollState,
} from '../unread-tracker';

describe('Unread Tracker', () => {
  const myAid = 'me';
  const otherAid = 'alice';

  const createMessage = (id: string, from: string, timestamp: number): Message => ({
    id,
    from,
    to: from === myAid ? otherAid : myAid,
    timestamp,
  });

  // ==================== calculateUnreadCount ====================

  describe('calculateUnreadCount', () => {
    it('should return 0 if all messages are from me', () => {
      const messages = [
        createMessage('msg1', myAid, 1),
        createMessage('msg2', myAid, 2),
      ];

      expect(calculateUnreadCount(messages, null, myAid)).toBe(0);
    });

    it('should count all received messages if no lastReadMessageId', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
        createMessage('msg3', otherAid, 3),
      ];

      expect(calculateUnreadCount(messages, null, myAid)).toBe(2);
    });

    it('should count messages after lastReadMessageId', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
        createMessage('msg4', otherAid, 4),
        createMessage('msg5', otherAid, 5),
      ];

      expect(calculateUnreadCount(messages, 'msg2', myAid)).toBe(2); // msg4, msg5
    });

    it('should return 0 if lastReadMessageId is the latest received message', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
      ];

      expect(calculateUnreadCount(messages, 'msg2', myAid)).toBe(0);
    });

    it('should not count my own messages after lastReadMessageId', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
        createMessage('msg3', myAid, 3),
        createMessage('msg4', otherAid, 4),
      ];

      expect(calculateUnreadCount(messages, 'msg1', myAid)).toBe(1); // Only msg4
    });

    it('should handle lastReadMessageId not found (count all)', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
      ];

      expect(calculateUnreadCount(messages, 'nonexistent', myAid)).toBe(2);
    });

    it('should handle empty message list', () => {
      expect(calculateUnreadCount([], null, myAid)).toBe(0);
      expect(calculateUnreadCount([], 'msg1', myAid)).toBe(0);
    });
  });

  // ==================== calculateNewLastRead (scroll-into-view) ====================

  describe('calculateNewLastRead', () => {
    it('should return null if no messages are visible', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: [],
        lastReadMessageId: null,
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBeNull();
    });

    it('should mark latest visible message as read', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', otherAid, 3),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2'], // msg3 not visible
        lastReadMessageId: null,
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBe('msg2');
    });

    it('should update to newer visible message', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', otherAid, 3),
        createMessage('msg4', otherAid, 4),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg2', 'msg3'], // Now viewing msg2-msg3
        lastReadMessageId: 'msg1', // Was at msg1
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBe('msg3');
    });

    it('should not update if no newer messages are visible', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', otherAid, 3),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2'],
        lastReadMessageId: 'msg3', // Already read up to msg3
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBeNull();
    });

    it('should ignore my own messages in visible set', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2), // My message
        createMessage('msg3', otherAid, 3),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2'], // msg2 is mine
        lastReadMessageId: null,
      };

      // Should mark msg1 as read, not msg2 (which is mine)
      expect(calculateNewLastRead(messages, scrollState, myAid)).toBe('msg1');
    });

    it('should return null if only my messages are visible', () => {
      const messages = [
        createMessage('msg1', myAid, 1),
        createMessage('msg2', myAid, 2),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2'],
        lastReadMessageId: null,
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBeNull();
    });

    it('should handle mixed visible messages and find latest from others', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
        createMessage('msg3', otherAid, 3),
        createMessage('msg4', myAid, 4),
        createMessage('msg5', otherAid, 5),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg2', 'msg3', 'msg4'], // msg3 is latest from others
        lastReadMessageId: 'msg1',
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBe('msg3');
    });

    it('should work when scrolling to bottom with all messages visible', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', otherAid, 3),
      ];

      const scrollState: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2', 'msg3'], // All visible
        lastReadMessageId: 'msg1',
      };

      expect(calculateNewLastRead(messages, scrollState, myAid)).toBe('msg3');
    });
  });

  // ==================== markAllAsRead ====================

  describe('markAllAsRead', () => {
    it('should return latest received message ID', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
      ];

      expect(markAllAsRead(messages, myAid)).toBe('msg2');
    });

    it('should return null if no received messages', () => {
      const messages = [
        createMessage('msg1', myAid, 1),
        createMessage('msg2', myAid, 2),
      ];

      expect(markAllAsRead(messages, myAid)).toBeNull();
    });

    it('should return null for empty message list', () => {
      expect(markAllAsRead([], myAid)).toBeNull();
    });

    it('should find latest even if followed by my messages', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
        createMessage('msg4', myAid, 4),
        createMessage('msg5', myAid, 5),
      ];

      expect(markAllAsRead(messages, myAid)).toBe('msg2');
    });
  });

  // ==================== hasUnread ====================

  describe('hasUnread', () => {
    it('should return true if there are unread messages', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
      ];

      expect(hasUnread(messages, null, myAid)).toBe(true);
    });

    it('should return false if no unread messages', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
      ];

      expect(hasUnread(messages, 'msg1', myAid)).toBe(false);
    });

    it('should return false for empty conversation', () => {
      expect(hasUnread([], null, myAid)).toBe(false);
    });
  });

  // ==================== getUnreadMessageIds ====================

  describe('getUnreadMessageIds', () => {
    it('should return IDs of all received messages if no lastReadMessageId', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
        createMessage('msg3', otherAid, 3),
      ];

      expect(getUnreadMessageIds(messages, null, myAid)).toEqual(['msg1', 'msg3']);
    });

    it('should return IDs of messages after lastReadMessageId', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
        createMessage('msg4', otherAid, 4),
      ];

      expect(getUnreadMessageIds(messages, 'msg2', myAid)).toEqual(['msg4']);
    });

    it('should return empty array if no unread messages', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', myAid, 2),
      ];

      expect(getUnreadMessageIds(messages, 'msg1', myAid)).toEqual([]);
    });

    it('should handle lastReadMessageId not found', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
      ];

      expect(getUnreadMessageIds(messages, 'nonexistent', myAid)).toEqual(['msg1', 'msg2']);
    });
  });

  // ==================== Real-world Scenarios ====================

  describe('Real-world scenarios', () => {
    it('should handle typical scroll-to-read flow', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', otherAid, 3),
        createMessage('msg4', otherAid, 4),
        createMessage('msg5', otherAid, 5),
      ];

      let lastRead: string | null = null;

      // User has 5 unread messages
      expect(calculateUnreadCount(messages, lastRead, myAid)).toBe(5);

      // User scrolls and msg1-msg2 become visible
      const scroll1: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2'],
        lastReadMessageId: lastRead,
      };
      lastRead = calculateNewLastRead(messages, scroll1, myAid);
      expect(lastRead).toBe('msg2');
      expect(calculateUnreadCount(messages, lastRead, myAid)).toBe(3); // msg3-msg5

      // User scrolls down, msg3-msg4 visible
      const scroll2: ScrollState = {
        visibleMessageIds: ['msg3', 'msg4'],
        lastReadMessageId: lastRead,
      };
      lastRead = calculateNewLastRead(messages, scroll2, myAid);
      expect(lastRead).toBe('msg4');
      expect(calculateUnreadCount(messages, lastRead, myAid)).toBe(1); // msg5

      // User scrolls to bottom, all visible
      const scroll3: ScrollState = {
        visibleMessageIds: ['msg1', 'msg2', 'msg3', 'msg4', 'msg5'],
        lastReadMessageId: lastRead,
      };
      lastRead = calculateNewLastRead(messages, scroll3, myAid);
      expect(lastRead).toBe('msg5');
      expect(calculateUnreadCount(messages, lastRead, myAid)).toBe(0); // All read
    });

    it('should handle marking all as read explicitly', () => {
      const messages = [
        createMessage('msg1', otherAid, 1),
        createMessage('msg2', otherAid, 2),
        createMessage('msg3', myAid, 3),
        createMessage('msg4', otherAid, 4),
      ];

      expect(calculateUnreadCount(messages, null, myAid)).toBe(3);

      const lastRead = markAllAsRead(messages, myAid);
      expect(lastRead).toBe('msg4');
      expect(calculateUnreadCount(messages, lastRead, myAid)).toBe(0);
    });
  });
});
