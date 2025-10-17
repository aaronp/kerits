/**
 * Unread Tracker
 *
 * Pure functions for tracking unread messages and mark-as-read logic.
 * Handles scroll-into-view detection for automatic marking.
 */

export interface Message {
  id: string;
  timestamp: number;
  from: string;
  to: string;
}

export interface ScrollState {
  visibleMessageIds: string[]; // Messages currently visible in viewport
  lastReadMessageId: string | null; // Last message marked as read
}

/**
 * Calculate unread count for a conversation
 *
 * @param allMessages - All messages in conversation (sorted by timestamp asc)
 * @param lastReadMessageId - ID of last message marked as read
 * @param myAid - Current user's AID
 * @returns Number of unread messages
 */
export function calculateUnreadCount(
  allMessages: Message[],
  lastReadMessageId: string | null,
  myAid: string
): number {
  // If no lastReadMessageId, all received messages are unread
  if (!lastReadMessageId) {
    return allMessages.filter((m) => m.from !== myAid).length;
  }

  // Find index of last read message
  const lastReadIndex = allMessages.findIndex((m) => m.id === lastReadMessageId);

  if (lastReadIndex === -1) {
    // Last read message not found, count all received messages
    return allMessages.filter((m) => m.from !== myAid).length;
  }

  // Count messages after last read that are from others
  let unreadCount = 0;
  for (let i = lastReadIndex + 1; i < allMessages.length; i++) {
    if (allMessages[i].from !== myAid) {
      unreadCount++;
    }
  }

  return unreadCount;
}

/**
 * Determine new lastReadMessageId based on scroll state
 *
 * Uses scroll-into-view logic: marks as read the latest message that is visible
 *
 * @param allMessages - All messages in conversation (sorted by timestamp asc)
 * @param scrollState - Current scroll/viewport state
 * @param myAid - Current user's AID
 * @returns New lastReadMessageId (or null if no update needed)
 */
export function calculateNewLastRead(
  allMessages: Message[],
  scrollState: ScrollState,
  myAid: string
): string | null {
  const { visibleMessageIds, lastReadMessageId } = scrollState;

  if (visibleMessageIds.length === 0) {
    // Nothing visible, no update
    return null;
  }

  // Find the latest visible message from others (not from me)
  let latestVisibleFromOthers: Message | null = null;
  let latestVisibleIndex = -1;

  for (let i = allMessages.length - 1; i >= 0; i--) {
    const msg = allMessages[i];
    if (visibleMessageIds.includes(msg.id) && msg.from !== myAid) {
      latestVisibleFromOthers = msg;
      latestVisibleIndex = i;
      break;
    }
  }

  if (!latestVisibleFromOthers) {
    // No received messages are visible, no update
    return null;
  }

  // If no previous lastReadMessageId, mark as read
  if (!lastReadMessageId) {
    return latestVisibleFromOthers.id;
  }

  // Find index of current last read
  const lastReadIndex = allMessages.findIndex((m) => m.id === lastReadMessageId);

  // If latest visible is newer than last read, update
  if (latestVisibleIndex > lastReadIndex) {
    return latestVisibleFromOthers.id;
  }

  // No update needed
  return null;
}

/**
 * Mark all messages as read (up to latest message)
 *
 * @param allMessages - All messages in conversation (sorted by timestamp asc)
 * @param myAid - Current user's AID
 * @returns ID of latest received message, or null if no received messages
 */
export function markAllAsRead(
  allMessages: Message[],
  myAid: string
): string | null {
  // Find latest message from others
  for (let i = allMessages.length - 1; i >= 0; i--) {
    if (allMessages[i].from !== myAid) {
      return allMessages[i].id;
    }
  }
  return null;
}

/**
 * Check if a conversation has unread messages
 *
 * @param allMessages - All messages in conversation
 * @param lastReadMessageId - ID of last message marked as read
 * @param myAid - Current user's AID
 * @returns True if there are unread messages
 */
export function hasUnread(
  allMessages: Message[],
  lastReadMessageId: string | null,
  myAid: string
): boolean {
  return calculateUnreadCount(allMessages, lastReadMessageId, myAid) > 0;
}

/**
 * Get unread message IDs
 *
 * @param allMessages - All messages in conversation (sorted by timestamp asc)
 * @param lastReadMessageId - ID of last message marked as read
 * @param myAid - Current user's AID
 * @returns Array of unread message IDs
 */
export function getUnreadMessageIds(
  allMessages: Message[],
  lastReadMessageId: string | null,
  myAid: string
): string[] {
  if (!lastReadMessageId) {
    return allMessages.filter((m) => m.from !== myAid).map((m) => m.id);
  }

  const lastReadIndex = allMessages.findIndex((m) => m.id === lastReadMessageId);
  if (lastReadIndex === -1) {
    return allMessages.filter((m) => m.from !== myAid).map((m) => m.id);
  }

  const unreadIds: string[] = [];
  for (let i = lastReadIndex + 1; i < allMessages.length; i++) {
    if (allMessages[i].from !== myAid) {
      unreadIds.push(allMessages[i].id);
    }
  }

  return unreadIds;
}
