/**
 * Preferences Store
 *
 * React state for user preferences using DSL layer.
 * Manages PreferencesManager with IndexedDBKv storage.
 */

import { create } from 'zustand';
import type { PinnedConversation } from '../lib/dsl/preferences/types';
import { PreferencesManager } from '../lib/dsl/preferences';
import { IndexedDBKv } from '../lib/storage';

interface PreferencesState {
  // State
  pinnedConversations: PinnedConversation[];
  loading: boolean;
  error: string | null;

  // Manager (scoped to current user)
  preferencesManager: PreferencesManager | null;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  pinConversation: (id: string, type: 'dm' | 'group', index?: number) => Promise<void>;
  unpinConversation: (id: string) => Promise<void>;
  reorderPinned: (orderedIds: string[]) => Promise<void>;
  movePinToIndex: (id: string, newIndex: number) => Promise<void>;
  isPinned: (id: string) => boolean;
  getPinIndex: (id: string) => number | null;
  refreshPinned: () => Promise<void>;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  // Initial state
  pinnedConversations: [],
  loading: false,
  error: null,
  preferencesManager: null,

  // Initialize preferences manager for user
  initialize: async (userAid: string) => {
    try {
      set({ loading: true, error: null });

      const storage = new IndexedDBKv({ namespace: `preferences:${userAid}` });
      await storage.init();
      const manager = new PreferencesManager({ storage });

      set({ preferencesManager: manager });

      // Load pinned conversations
      const pinned = await manager.getPinned();
      set({ pinnedConversations: pinned, loading: false });
    } catch (error) {
      console.error('[PreferencesStore] Initialize error:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Pin a conversation
  pinConversation: async (id: string, type: 'dm' | 'group', index?: number) => {
    const { preferencesManager } = get();
    if (!preferencesManager) {
      throw new Error('PreferencesManager not initialized');
    }

    try {
      await preferencesManager.pinConversation(id, type, index);
      await get().refreshPinned();
    } catch (error) {
      console.error('[PreferencesStore] Pin error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Unpin a conversation
  unpinConversation: async (id: string) => {
    const { preferencesManager } = get();
    if (!preferencesManager) {
      throw new Error('PreferencesManager not initialized');
    }

    try {
      await preferencesManager.unpinConversation(id);
      await get().refreshPinned();
    } catch (error) {
      console.error('[PreferencesStore] Unpin error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Reorder pinned conversations
  reorderPinned: async (orderedIds: string[]) => {
    const { preferencesManager } = get();
    if (!preferencesManager) {
      throw new Error('PreferencesManager not initialized');
    }

    try {
      await preferencesManager.reorderPinned(orderedIds);
      await get().refreshPinned();
    } catch (error) {
      console.error('[PreferencesStore] Reorder error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Move pin to specific index
  movePinToIndex: async (id: string, newIndex: number) => {
    const { preferencesManager } = get();
    if (!preferencesManager) {
      throw new Error('PreferencesManager not initialized');
    }

    try {
      await preferencesManager.movePinToIndex(id, newIndex);
      await get().refreshPinned();
    } catch (error) {
      console.error('[PreferencesStore] Move pin error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Check if conversation is pinned
  isPinned: (id: string) => {
    const { pinnedConversations } = get();
    return pinnedConversations.some((pin) => pin.id === id);
  },

  // Get pin index for conversation
  getPinIndex: (id: string) => {
    const { pinnedConversations } = get();
    const pin = pinnedConversations.find((p) => p.id === id);
    return pin ? pin.index : null;
  },

  // Refresh pinned conversations from storage
  refreshPinned: async () => {
    const { preferencesManager } = get();
    if (!preferencesManager) return;

    try {
      const pinned = await preferencesManager.getPinned();
      set({ pinnedConversations: pinned });
    } catch (error) {
      console.error('[PreferencesStore] Refresh error:', error);
      set({ error: (error as Error).message });
    }
  },
}));
