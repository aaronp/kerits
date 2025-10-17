/**
 * Groups Store
 *
 * React state for group chats using DSL layer.
 * Manages GroupManager with IndexedDBKv storage.
 */

import { create } from 'zustand';
import type { Group, GroupMessage, GroupSettings } from '../lib/dsl/groups/types';
import { GroupManager } from '../lib/dsl/groups/manager';
import { IndexedDBKv } from '../lib/storage';

interface GroupsState {
  // State
  groups: Group[];
  selectedGroupId: string | null;
  loading: boolean;
  error: string | null;

  // Manager (scoped to current user)
  groupManager: GroupManager | null;
  myAid: string | null;

  // Actions
  initialize: (userAid: string) => Promise<void>;
  createGroup: (name: string, memberAids: string[], settings?: Partial<GroupSettings>) => Promise<Group>;
  listGroups: () => Promise<Group[]>;
  getGroup: (groupId: string) => Promise<Group | null>;
  selectGroup: (groupId: string | null) => void;
  refreshGroups: () => Promise<void>;

  // Message operations
  sendMessage: (groupId: string, content: string) => Promise<GroupMessage>;
  getCanonicalMessages: (groupId: string) => Promise<GroupMessage[]>;
  getPendingMessages: (groupId: string) => Promise<GroupMessage[]>;
  receiveMessage: (groupId: string, message: GroupMessage) => Promise<void>;
  receiveVote: (groupId: string, messageId: string, vote: boolean) => Promise<void>;

  // Sync operations
  processSyncResponse: (groupId: string, messages: GroupMessage[]) => Promise<void>;
}

export const useGroups = create<GroupsState>((set, get) => ({
  // Initial state
  groups: [],
  selectedGroupId: null,
  loading: false,
  error: null,
  groupManager: null,
  myAid: null,

  // Initialize group manager for user
  initialize: async (userAid: string) => {
    try {
      set({ loading: true, error: null, myAid: userAid });

      const storage = new IndexedDBKv({ namespace: `groups:${userAid}` });
      await storage.init();
      const manager = new GroupManager({ storage, myAid: userAid });

      set({ groupManager: manager });

      // Load groups
      const groups = await manager.listGroups();
      set({ groups, loading: false });
    } catch (error) {
      console.error('[GroupsStore] Initialize error:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Create a new group
  createGroup: async (name: string, memberAids: string[], settings?: Partial<GroupSettings>) => {
    const { groupManager, myAid } = get();
    if (!groupManager || !myAid) {
      throw new Error('GroupManager not initialized');
    }

    try {
      const group = await groupManager.createGroup({ name, memberAids, settings });
      await get().refreshGroups();
      return group;
    } catch (error) {
      console.error('[GroupsStore] Create group error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // List all groups
  listGroups: async () => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      const groups = await groupManager.listGroups();
      set({ groups });
      return groups;
    } catch (error) {
      console.error('[GroupsStore] List groups error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Get a specific group
  getGroup: async (groupId: string) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      return await groupManager.getGroup(groupId);
    } catch (error) {
      console.error('[GroupsStore] Get group error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Select a group (for UI)
  selectGroup: (groupId: string | null) => {
    set({ selectedGroupId: groupId });
  },

  // Refresh groups from storage
  refreshGroups: async () => {
    const { groupManager } = get();
    if (!groupManager) return;

    try {
      const groups = await groupManager.listGroups();
      set({ groups });
    } catch (error) {
      console.error('[GroupsStore] Refresh error:', error);
      set({ error: (error as Error).message });
    }
  },

  // Send a message to a group
  sendMessage: async (groupId: string, content: string) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      const message = await groupManager.sendMessage(groupId, content);

      // Broadcast message to all group members via MERITS
      const group = await groupManager.getGroup(groupId);
      if (group) {
        const { useConnection } = await import('./connection');
        const client = useConnection.getState().client;

        if (client) {
          // Send to each member (except self)
          const otherMembers = group.members.filter(m => m.aid !== groupManager['myAid']);
          for (const member of otherMembers) {
            await client.sendMessage({
              to: member.aid,
              from: groupManager['myAid'],
              payload: JSON.stringify({
                type: 'group_message',
                groupId,
                message
              })
            });
          }
        }
      }

      await get().refreshGroups(); // Update group metadata
      return message;
    } catch (error) {
      console.error('[GroupsStore] Send message error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Get canonical messages for a group
  getCanonicalMessages: async (groupId: string) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      return await groupManager.getCanonicalMessages(groupId);
    } catch (error) {
      console.error('[GroupsStore] Get canonical messages error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Get pending messages for a group
  getPendingMessages: async (groupId: string) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      return await groupManager.getPendingMessages(groupId);
    } catch (error) {
      console.error('[GroupsStore] Get pending messages error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Receive a message from another member
  receiveMessage: async (groupId: string, message: GroupMessage) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      const voteMessage = await groupManager.receiveMessage(groupId, message);

      // Broadcast vote to all group members
      const group = await groupManager.getGroup(groupId);
      if (group) {
        const { useConnection } = await import('./connection');
        const client = useConnection.getState().client;

        if (client) {
          // Send vote to each member (except self)
          const otherMembers = group.members.filter(m => m.aid !== groupManager['myAid']);
          for (const member of otherMembers) {
            await client.sendMessage({
              to: member.aid,
              from: groupManager['myAid'],
              payload: JSON.stringify({
                type: 'group_vote',
                groupId: voteMessage.groupId,
                messageId: voteMessage.messageId,
                vote: voteMessage.vote,
                vectorClock: voteMessage.vectorClock
              })
            });
          }
        }
      }

      await get().refreshGroups();
    } catch (error) {
      console.error('[GroupsStore] Receive message error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Receive a vote from another member
  receiveVote: async (groupId: string, messageId: string, vote: boolean) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      await groupManager.receiveVote({ groupId, messageId, vote });
      await get().refreshGroups();
    } catch (error) {
      console.error('[GroupsStore] Receive vote error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },

  // Process sync response from peer
  processSyncResponse: async (groupId: string, messages: GroupMessage[]) => {
    const { groupManager } = get();
    if (!groupManager) {
      throw new Error('GroupManager not initialized');
    }

    try {
      await groupManager.processSyncResponse(groupId, messages);
      await get().refreshGroups();
    } catch (error) {
      console.error('[GroupsStore] Process sync error:', error);
      set({ error: (error as Error).message });
      throw error;
    }
  },
}));
