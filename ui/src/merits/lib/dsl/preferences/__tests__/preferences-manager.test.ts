/**
 * Preferences Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PreferencesManager } from '../preferences-manager';
import { MemoryKv } from '../../../storage/memory-kv';

describe('PreferencesManager', () => {
  let storage: MemoryKv;
  let manager: PreferencesManager;

  beforeEach(() => {
    storage = new MemoryKv();
    manager = new PreferencesManager({ storage });
  });

  // ==================== Basic Operations ====================

  describe('getPreferences', () => {
    it('should return default preferences if none exist', async () => {
      const prefs = await manager.getPreferences();
      expect(prefs.pinnedConversations).toEqual([]);
    });

    it('should return stored preferences', async () => {
      await manager.pinConversation('alice', 'dm');
      const prefs = await manager.getPreferences();
      expect(prefs.pinnedConversations).toHaveLength(1);
      expect(prefs.pinnedConversations[0].id).toBe('alice');
    });
  });

  // ==================== Pinning Operations ====================

  describe('pinConversation', () => {
    it('should pin a conversation with auto-index', async () => {
      await manager.pinConversation('alice', 'dm');
      const pinned = await manager.getPinned();

      expect(pinned).toHaveLength(1);
      expect(pinned[0].id).toBe('alice');
      expect(pinned[0].type).toBe('dm');
      expect(pinned[0].index).toBe(1);
      expect(pinned[0].pinnedAt).toBeGreaterThan(0);
    });

    it('should pin multiple conversations with sequential indices', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');
      await manager.pinConversation('group-1', 'group');

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(3);
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].index).toBe(2);
      expect(pinned[2].index).toBe(3);
    });

    it('should pin at specific index', async () => {
      await manager.pinConversation('alice', 'dm', 5);
      const pinned = await manager.getPinned();

      expect(pinned[0].index).toBe(5);
    });

    it('should update existing pin if already pinned', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('alice', 'dm', 10);

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(1);
      expect(pinned[0].index).toBe(10);
    });

    it('should pin groups', async () => {
      await manager.pinConversation('group-123', 'group');
      const pinned = await manager.getPinned();

      expect(pinned[0].type).toBe('group');
    });
  });

  describe('unpinConversation', () => {
    it('should unpin a conversation', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.unpinConversation('alice');

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(0);
    });

    it('should handle unpinning non-existent pin', async () => {
      await manager.unpinConversation('nonexistent');
      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(0);
    });

    it('should keep other pins intact', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');
      await manager.unpinConversation('alice');

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(1);
      expect(pinned[0].id).toBe('bob');
    });
  });

  describe('isPinned', () => {
    it('should return true for pinned conversation', async () => {
      await manager.pinConversation('alice', 'dm');
      expect(await manager.isPinned('alice')).toBe(true);
    });

    it('should return false for unpinned conversation', async () => {
      expect(await manager.isPinned('bob')).toBe(false);
    });
  });

  describe('getPinIndex', () => {
    it('should return index for pinned conversation', async () => {
      await manager.pinConversation('alice', 'dm', 5);
      expect(await manager.getPinIndex('alice')).toBe(5);
    });

    it('should return null for unpinned conversation', async () => {
      expect(await manager.getPinIndex('bob')).toBeNull();
    });
  });

  // ==================== Reordering ====================

  describe('reorderPinned', () => {
    it('should reorder pinned conversations', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');
      await manager.pinConversation('carol', 'dm');

      // Reorder: carol, alice, bob
      await manager.reorderPinned(['carol', 'alice', 'bob']);

      const pinned = await manager.getPinned();
      expect(pinned[0].id).toBe('carol');
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].id).toBe('alice');
      expect(pinned[1].index).toBe(2);
      expect(pinned[2].id).toBe('bob');
      expect(pinned[2].index).toBe(3);
    });

    it('should handle partial reorder (skip non-pinned)', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');

      // Include non-pinned ID (should be skipped)
      await manager.reorderPinned(['bob', 'nonexistent', 'alice']);

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(2);
      expect(pinned[0].id).toBe('bob');
      expect(pinned[1].id).toBe('alice');
    });

    it('should preserve type and pinnedAt', async () => {
      await manager.pinConversation('alice', 'dm');
      const before = await manager.getPinned();
      const originalPinnedAt = before[0].pinnedAt;

      await manager.reorderPinned(['alice']);

      const after = await manager.getPinned();
      expect(after[0].type).toBe('dm');
      expect(after[0].pinnedAt).toBe(originalPinnedAt);
    });
  });

  describe('movePinToIndex', () => {
    beforeEach(async () => {
      // Setup: alice=1, bob=2, carol=3, dave=4
      await manager.pinConversation('alice', 'dm', 1);
      await manager.pinConversation('bob', 'dm', 2);
      await manager.pinConversation('carol', 'dm', 3);
      await manager.pinConversation('dave', 'dm', 4);
    });

    it('should move pin down (lower index to higher)', async () => {
      // Move alice (1) to position 3
      await manager.movePinToIndex('alice', 3);

      const pinned = await manager.getPinned();
      expect(pinned[0].id).toBe('bob'); // was 2, now 1
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].id).toBe('carol'); // was 3, now 2
      expect(pinned[1].index).toBe(2);
      expect(pinned[2].id).toBe('alice'); // was 1, now 3
      expect(pinned[2].index).toBe(3);
      expect(pinned[3].id).toBe('dave'); // unchanged
      expect(pinned[3].index).toBe(4);
    });

    it('should move pin up (higher index to lower)', async () => {
      // Move dave (4) to position 2
      await manager.movePinToIndex('dave', 2);

      const pinned = await manager.getPinned();
      expect(pinned[0].id).toBe('alice'); // unchanged
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].id).toBe('dave'); // was 4, now 2
      expect(pinned[1].index).toBe(2);
      expect(pinned[2].id).toBe('bob'); // was 2, now 3
      expect(pinned[2].index).toBe(3);
      expect(pinned[3].id).toBe('carol'); // was 3, now 4
      expect(pinned[3].index).toBe(4);
    });

    it('should handle moving to same position (no-op)', async () => {
      await manager.movePinToIndex('bob', 2);

      const pinned = await manager.getPinned();
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].index).toBe(2);
      expect(pinned[2].index).toBe(3);
      expect(pinned[3].index).toBe(4);
    });

    it('should throw error if conversation not pinned', async () => {
      await expect(manager.movePinToIndex('nonexistent', 1)).rejects.toThrow(
        'Conversation nonexistent is not pinned'
      );
    });
  });

  // ==================== Utility Methods ====================

  describe('clearPinned', () => {
    it('should clear all pinned conversations', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');
      await manager.clearPinned();

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(0);
    });
  });

  describe('getPinnedCount', () => {
    it('should return 0 for no pins', async () => {
      expect(await manager.getPinnedCount()).toBe(0);
    });

    it('should return correct count', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('bob', 'dm');
      expect(await manager.getPinnedCount()).toBe(2);
    });
  });

  // ==================== Sorting ====================

  describe('getPinned sorting', () => {
    it('should return pins sorted by index', async () => {
      await manager.pinConversation('alice', 'dm', 3);
      await manager.pinConversation('bob', 'dm', 1);
      await manager.pinConversation('carol', 'dm', 2);

      const pinned = await manager.getPinned();
      expect(pinned[0].id).toBe('bob');
      expect(pinned[1].id).toBe('carol');
      expect(pinned[2].id).toBe('alice');
    });

    it('should handle gaps in indices', async () => {
      await manager.pinConversation('alice', 'dm', 1);
      await manager.pinConversation('bob', 'dm', 5);
      await manager.pinConversation('carol', 'dm', 3);

      const pinned = await manager.getPinned();
      expect(pinned[0].index).toBe(1);
      expect(pinned[1].index).toBe(3);
      expect(pinned[2].index).toBe(5);
    });
  });

  // ==================== Mixed DM and Group Pins ====================

  describe('mixed DM and group pins', () => {
    it('should handle both DMs and groups', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('group-1', 'group');
      await manager.pinConversation('bob', 'dm');
      await manager.pinConversation('group-2', 'group');

      const pinned = await manager.getPinned();
      expect(pinned).toHaveLength(4);
      expect(pinned.filter((p) => p.type === 'dm')).toHaveLength(2);
      expect(pinned.filter((p) => p.type === 'group')).toHaveLength(2);
    });

    it('should reorder mixed types', async () => {
      await manager.pinConversation('alice', 'dm');
      await manager.pinConversation('group-1', 'group');

      await manager.reorderPinned(['group-1', 'alice']);

      const pinned = await manager.getPinned();
      expect(pinned[0].id).toBe('group-1');
      expect(pinned[0].type).toBe('group');
      expect(pinned[1].id).toBe('alice');
      expect(pinned[1].type).toBe('dm');
    });
  });
});
