/**
 * Settings Types
 *
 * User-specific application preferences and privacy controls
 */

/**
 * User settings interface
 */
export interface UserSettings {
  // Privacy Controls
  blockUnknownSenders: boolean;      // Drop messages from non-contacts
  notifyBlockedSenders: boolean;     // Send notification via MERITS agent
  autoHideUnknownAfterBlock: boolean; // Auto-hide unknown senders after blocking
}

/**
 * Default settings for new users
 */
export const DEFAULT_SETTINGS: UserSettings = {
  blockUnknownSenders: false,
  notifyBlockedSenders: true,
  autoHideUnknownAfterBlock: false,
};
