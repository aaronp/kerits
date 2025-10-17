/**
 * Settings Manager
 *
 * Manages user-specific application settings with persistent storage
 */

import type { Kv } from '../../storage';
import type { UserSettings } from './types';
import { DEFAULT_SETTINGS } from './types';

export class SettingsManager {
  private kv: Kv;
  private userAid: string;
  private settingsKey: string;

  constructor(kv: Kv, userAid: string) {
    this.kv = kv;
    this.userAid = userAid;
    this.settingsKey = 'config'; // Key within the namespaced KV
  }

  /**
   * Get all settings (with defaults for missing values)
   */
  async getSettings(): Promise<UserSettings> {
    const data = await this.kv.get(this.settingsKey);

    if (!data) {
      return { ...DEFAULT_SETTINGS };
    }

    const stored = JSON.parse(data);

    // Merge with defaults (in case new settings were added)
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  }

  /**
   * Get a single setting value
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const settings = await this.getSettings();
    return (settings as any)[key] ?? null;
  }

  /**
   * Set a single setting value
   */
  async setSetting<T>(key: string, value: T): Promise<void> {
    const settings = await this.getSettings();
    (settings as any)[key] = value;
    await this.kv.set(this.settingsKey, JSON.stringify(settings));
  }

  /**
   * Update multiple settings atomically
   */
  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    const settings = await this.getSettings();
    const updated = {
      ...settings,
      ...updates,
    };
    await this.kv.set(this.settingsKey, JSON.stringify(updated));
  }

  /**
   * Reset all settings to defaults
   */
  async resetSettings(): Promise<void> {
    await this.kv.set(this.settingsKey, JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Convenience method: Check if blocking unknown senders is enabled
   */
  async isBlockUnknownSendersEnabled(): Promise<boolean> {
    const value = await this.getSetting<boolean>('blockUnknownSenders');
    return value ?? DEFAULT_SETTINGS.blockUnknownSenders;
  }

  /**
   * Convenience method: Check if should notify blocked senders
   */
  async shouldNotifyBlockedSenders(): Promise<boolean> {
    const value = await this.getSetting<boolean>('notifyBlockedSenders');
    return value ?? DEFAULT_SETTINGS.notifyBlockedSenders;
  }

  /**
   * Convenience method: Check if should auto-hide unknown after block
   */
  async shouldAutoHideUnknownAfterBlock(): Promise<boolean> {
    const value = await this.getSetting<boolean>('autoHideUnknownAfterBlock');
    return value ?? DEFAULT_SETTINGS.autoHideUnknownAfterBlock;
  }
}
