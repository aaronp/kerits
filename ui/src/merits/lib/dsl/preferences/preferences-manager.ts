/**
 * Preferences Manager
 *
 * Manages user preferences including pinned conversations.
 * Uses pluggable KV storage (IndexedDB, Memory, etc.)
 */

import type { Kv } from '../../storage';
import type { PinnedConversation, UserPreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';

export interface PreferencesManagerOptions {
  storage: Kv;
}

export class PreferencesManager {
  private storage: Kv;
  private PREFS_KEY = 'preferences';

  constructor(options: PreferencesManagerOptions) {
    this.storage = options.storage;
  }

  /**
   * Get all preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const prefs = await this.storage.get<UserPreferences>(this.PREFS_KEY);
    return prefs || { ...DEFAULT_PREFERENCES };
  }

  /**
   * Set preferences (full replace)
   */
  async setPreferences(preferences: UserPreferences): Promise<void> {
    await this.storage.set(this.PREFS_KEY, preferences);
  }

  // ==================== Pinned Conversations ====================

  /**
   * Get pinned conversations sorted by index
   */
  async getPinned(): Promise<PinnedConversation[]> {
    const prefs = await this.getPreferences();
    return prefs.pinnedConversations.sort((a, b) => a.index - b.index);
  }

  /**
   * Pin a conversation at a specific index
   * If index is not provided, append to end
   */
  async pinConversation(
    id: string,
    type: 'dm' | 'group',
    index?: number
  ): Promise<void> {
    const prefs = await this.getPreferences();

    // Remove if already pinned
    const filtered = prefs.pinnedConversations.filter((p) => p.id !== id);

    // Determine index
    const targetIndex = index !== undefined
      ? index
      : this.getNextAvailableIndex(filtered);

    // Add new pin
    filtered.push({
      id,
      type,
      index: targetIndex,
      pinnedAt: Date.now(),
    });

    prefs.pinnedConversations = filtered;
    await this.setPreferences(prefs);
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(id: string): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.pinnedConversations = prefs.pinnedConversations.filter((p) => p.id !== id);
    await this.setPreferences(prefs);
  }

  /**
   * Check if conversation is pinned
   */
  async isPinned(id: string): Promise<boolean> {
    const prefs = await this.getPreferences();
    return prefs.pinnedConversations.some((p) => p.id === id);
  }

  /**
   * Get pin index for a conversation (null if not pinned)
   */
  async getPinIndex(id: string): Promise<number | null> {
    const prefs = await this.getPreferences();
    const pin = prefs.pinnedConversations.find((p) => p.id === id);
    return pin ? pin.index : null;
  }

  /**
   * Reorder pinned conversations
   * Accepts array of IDs in desired order, assigns indices 1, 2, 3, ...
   */
  async reorderPinned(orderedIds: string[]): Promise<void> {
    const prefs = await this.getPreferences();

    // Create map of existing pins
    const pinMap = new Map(
      prefs.pinnedConversations.map((p) => [p.id, p])
    );

    // Rebuild with new indices
    prefs.pinnedConversations = orderedIds
      .map((id, i) => {
        const existing = pinMap.get(id);
        if (!existing) return null; // Skip if not pinned
        return {
          ...existing,
          index: i + 1, // 1-indexed
        };
      })
      .filter((p): p is PinnedConversation => p !== null);

    await this.setPreferences(prefs);
  }

  /**
   * Move pinned conversation to new index
   * Adjusts other pins accordingly
   */
  async movePinToIndex(id: string, newIndex: number): Promise<void> {
    const prefs = await this.getPreferences();
    const pin = prefs.pinnedConversations.find((p) => p.id === id);

    if (!pin) {
      throw new Error(`Conversation ${id} is not pinned`);
    }

    const oldIndex = pin.index;

    // Update indices of affected pins
    prefs.pinnedConversations.forEach((p) => {
      if (p.id === id) {
        p.index = newIndex;
      } else if (oldIndex < newIndex && p.index > oldIndex && p.index <= newIndex) {
        // Moving down: shift up items in between
        p.index--;
      } else if (oldIndex > newIndex && p.index >= newIndex && p.index < oldIndex) {
        // Moving up: shift down items in between
        p.index++;
      }
    });

    await this.setPreferences(prefs);
  }

  /**
   * Get next available index (max + 1, or 1 if empty)
   */
  private getNextAvailableIndex(pins: PinnedConversation[]): number {
    if (pins.length === 0) return 1;
    const maxIndex = Math.max(...pins.map((p) => p.index));
    return maxIndex + 1;
  }

  /**
   * Clear all pinned conversations
   */
  async clearPinned(): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.pinnedConversations = [];
    await this.setPreferences(prefs);
  }

  /**
   * Get pinned conversation count
   */
  async getPinnedCount(): Promise<number> {
    const prefs = await this.getPreferences();
    return prefs.pinnedConversations.length;
  }
}
