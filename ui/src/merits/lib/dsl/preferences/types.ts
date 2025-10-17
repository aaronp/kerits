/**
 * Preferences Types
 *
 * User preferences including pinned conversations, UI settings, etc.
 */

/**
 * Pinned conversation entry
 */
export interface PinnedConversation {
  id: string; // AID (for DM) or groupId (for group)
  type: 'dm' | 'group';
  index: number; // Position in pinned list (1, 2, 3, ...)
  pinnedAt: number; // Timestamp when pinned
}

/**
 * User preferences
 */
export interface UserPreferences {
  pinnedConversations: PinnedConversation[];
  // Future: theme, notifications, etc.
}

/**
 * Default preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  pinnedConversations: [],
};
