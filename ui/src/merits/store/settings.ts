/**
 * Settings Store
 *
 * React state for user settings using SettingsManager DSL with IndexedDB storage.
 */

import { create } from 'zustand';
import type { UserSettings } from '../lib/dsl/settings/types';
import { DEFAULT_SETTINGS } from '../lib/dsl/settings/types';
import { SettingsManager } from '../lib/dsl/settings/manager';
import { IndexedDBKv } from '../lib/storage';

interface SettingsState {
  // State
  settings: UserSettings;
  loading: boolean;
  error: string | null;

  // Manager (scoped to current user)
  settingsManager: SettingsManager | null;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  getSetting: <T>(key: string) => Promise<T | null>;
  resetSettings: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  // Initial state
  settings: { ...DEFAULT_SETTINGS },
  loading: false,
  error: null,
  settingsManager: null,

  // Initialize - create manager scoped to user
  initialize: async (userAid: string) => {
    console.log('[Settings] Initializing for user:', userAid);
    set({ loading: true, error: null });

    try {
      // Create KV store scoped to user
      const settingsKv = new IndexedDBKv({ namespace: `${userAid}:settings` });
      const manager = new SettingsManager(settingsKv, userAid);

      // Load settings
      const settings = await manager.getSettings();

      set({ settingsManager: manager, settings, loading: false });
      console.log('[Settings] Initialized successfully:', settings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize settings';
      console.error('[Settings] Initialization error:', message);
      set({ error: message, loading: false });
    }
  },

  // Update settings
  updateSettings: async (updates: Partial<UserSettings>) => {
    const { settingsManager } = get();
    if (!settingsManager) {
      throw new Error('SettingsManager not initialized');
    }

    try {
      await settingsManager.updateSettings(updates);
      const settings = await settingsManager.getSettings();
      set({ settings });
      console.log('[Settings] Updated:', updates);
    } catch (error) {
      console.error('[Settings] Update error:', error);
      throw error;
    }
  },

  // Get single setting
  getSetting: async (key: string) => {
    const { settingsManager } = get();
    if (!settingsManager) {
      return null;
    }

    return settingsManager.getSetting(key);
  },

  // Reset to defaults
  resetSettings: async () => {
    const { settingsManager } = get();
    if (!settingsManager) {
      throw new Error('SettingsManager not initialized');
    }

    try {
      await settingsManager.resetSettings();
      const settings = await settingsManager.getSettings();
      set({ settings });
      console.log('[Settings] Reset to defaults');
    } catch (error) {
      console.error('[Settings] Reset error:', error);
      throw error;
    }
  },
}));
