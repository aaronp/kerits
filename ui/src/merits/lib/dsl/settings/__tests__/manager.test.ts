/**
 * SettingsManager Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsManager } from '../manager';
import { DEFAULT_SETTINGS } from '../types';
import { MemoryKv } from '../../../storage';

describe('SettingsManager', () => {
  let manager: SettingsManager;
  let kv: MemoryKv;
  const userAid = 'test-user-aid';

  beforeEach(() => {
    kv = new MemoryKv();
    manager = new SettingsManager(kv, userAid);
  });

  describe('getSettings', () => {
    it('should return default settings for new user', async () => {
      const settings = await manager.getSettings();

      expect(settings).toEqual(DEFAULT_SETTINGS);
      expect(settings.blockUnknownSenders).toBe(false);
      expect(settings.notifyBlockedSenders).toBe(true);
      expect(settings.autoHideUnknownAfterBlock).toBe(false);
    });

    it('should merge stored settings with defaults', async () => {
      // Simulate old version with missing field
      await kv.set('config', JSON.stringify({
        blockUnknownSenders: true,
        // notifyBlockedSenders missing
      }));

      const settings = await manager.getSettings();

      expect(settings.blockUnknownSenders).toBe(true);
      expect(settings.notifyBlockedSenders).toBe(true); // Default
      expect(settings.autoHideUnknownAfterBlock).toBe(false); // Default
    });
  });

  describe('getSetting', () => {
    it('should get individual setting', async () => {
      await manager.updateSettings({ blockUnknownSenders: true });

      const value = await manager.getSetting<boolean>('blockUnknownSenders');
      expect(value).toBe(true);
    });

    it('should return null for non-existent setting', async () => {
      const value = await manager.getSetting('nonExistent');
      expect(value).toBeNull();
    });
  });

  describe('setSetting', () => {
    it('should set individual setting', async () => {
      await manager.setSetting('blockUnknownSenders', true);

      const settings = await manager.getSettings();
      expect(settings.blockUnknownSenders).toBe(true);
    });

    it('should preserve other settings when setting one', async () => {
      await manager.updateSettings({
        blockUnknownSenders: true,
        notifyBlockedSenders: false,
      });

      await manager.setSetting('autoHideUnknownAfterBlock', true);

      const settings = await manager.getSettings();
      expect(settings.blockUnknownSenders).toBe(true);
      expect(settings.notifyBlockedSenders).toBe(false);
      expect(settings.autoHideUnknownAfterBlock).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update multiple settings atomically', async () => {
      await manager.updateSettings({
        blockUnknownSenders: true,
        notifyBlockedSenders: false,
      });

      const settings = await manager.getSettings();
      expect(settings.blockUnknownSenders).toBe(true);
      expect(settings.notifyBlockedSenders).toBe(false);
      expect(settings.autoHideUnknownAfterBlock).toBe(false); // Unchanged
    });

    it('should handle partial updates', async () => {
      await manager.updateSettings({ blockUnknownSenders: true });

      const settings = await manager.getSettings();
      expect(settings.blockUnknownSenders).toBe(true);
      expect(settings.notifyBlockedSenders).toBe(true); // Default
    });

    it('should allow updating same setting multiple times', async () => {
      await manager.updateSettings({ blockUnknownSenders: true });
      await manager.updateSettings({ blockUnknownSenders: false });
      await manager.updateSettings({ blockUnknownSenders: true });

      const settings = await manager.getSettings();
      expect(settings.blockUnknownSenders).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', async () => {
      await manager.updateSettings({
        blockUnknownSenders: true,
        notifyBlockedSenders: false,
        autoHideUnknownAfterBlock: true,
      });

      await manager.resetSettings();

      const settings = await manager.getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('persistence', () => {
    it('should persist settings across manager instances', async () => {
      await manager.updateSettings({ blockUnknownSenders: true });

      // Create new manager with same storage
      const manager2 = new SettingsManager(kv, userAid);
      const settings = await manager2.getSettings();

      expect(settings.blockUnknownSenders).toBe(true);
    });
  });

  describe('user isolation', () => {
    it('should isolate settings per user', async () => {
      const user1Kv = new MemoryKv();
      const user2Kv = new MemoryKv();

      const manager1 = new SettingsManager(user1Kv, 'user1');
      const manager2 = new SettingsManager(user2Kv, 'user2');

      await manager1.updateSettings({ blockUnknownSenders: true });
      await manager2.updateSettings({ blockUnknownSenders: false });

      const settings1 = await manager1.getSettings();
      const settings2 = await manager2.getSettings();

      expect(settings1.blockUnknownSenders).toBe(true);
      expect(settings2.blockUnknownSenders).toBe(false);
    });
  });

  describe('convenience methods', () => {
    it('should check if block unknown senders is enabled', async () => {
      expect(await manager.isBlockUnknownSendersEnabled()).toBe(false);

      await manager.updateSettings({ blockUnknownSenders: true });

      expect(await manager.isBlockUnknownSendersEnabled()).toBe(true);
    });

    it('should check if should notify blocked senders', async () => {
      expect(await manager.shouldNotifyBlockedSenders()).toBe(true);

      await manager.updateSettings({ notifyBlockedSenders: false });

      expect(await manager.shouldNotifyBlockedSenders()).toBe(false);
    });

    it('should check if should auto-hide unknown after block', async () => {
      expect(await manager.shouldAutoHideUnknownAfterBlock()).toBe(false);

      await manager.updateSettings({ autoHideUnknownAfterBlock: true });

      expect(await manager.shouldAutoHideUnknownAfterBlock()).toBe(true);
    });
  });
});
