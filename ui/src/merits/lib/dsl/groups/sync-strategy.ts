/**
 * Sync Strategy Module
 *
 * Handles synchronization between group members:
 * - Broadcast sync requests to all online members
 * - Take first response (Promise.race)
 * - Process sync responses
 * - Handle offline queues
 */

import type { GroupManager } from './manager';
import type { Group, GroupMessage } from './types';

export interface SyncOptions {
  timeout?: number; // Default: 5000ms
  retryCount?: number; // Default: 3
  retryDelay?: number; // Default: 1000ms
}

export class SyncStrategy {
  private manager: GroupManager;
  private pendingSyncs: Map<string, Promise<void>> = new Map();

  constructor(manager: GroupManager) {
    this.manager = manager;
  }

  /**
   * Sync a group with online members
   * Broadcasts to all, takes first response
   */
  async syncGroup(
    groupId: string,
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    options: SyncOptions = {}
  ): Promise<{ synced: boolean; messagesReceived: number; source?: string }> {
    const {
      timeout = 5000,
      retryCount = 3,
      retryDelay = 1000,
    } = options;

    // Prevent concurrent syncs for same group
    if (this.pendingSyncs.has(groupId)) {
      await this.pendingSyncs.get(groupId);
      return { synced: true, messagesReceived: 0 };
    }

    const syncPromise = this._syncGroup(groupId, sendSyncRequest, timeout, retryCount, retryDelay);
    this.pendingSyncs.set(groupId, syncPromise);

    try {
      const result = await syncPromise;
      return result;
    } finally {
      this.pendingSyncs.delete(groupId);
    }
  }

  private async _syncGroup(
    groupId: string,
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    timeout: number,
    retryCount: number,
    retryDelay: number
  ): Promise<{ synced: boolean; messagesReceived: number; source?: string }> {
    const group = await this.manager.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Create sync request
    const syncRequest = await this.manager.createSyncRequest(groupId);

    // Get online members (exclude self)
    const onlineMembers = group.members.filter(
      (m) => m.isOnline && m.aid !== group.members.find((mem) => mem.role === 'creator')?.aid // Filter self
    );

    if (onlineMembers.length === 0) {
      return { synced: false, messagesReceived: 0 };
    }

    // Broadcast to all online members
    const syncRequests = onlineMembers.map(async (member) => {
      try {
        const response = await Promise.race([
          sendSyncRequest(member.aid, syncRequest),
          this._timeout(timeout, `Sync request to ${member.aid} timed out`),
        ]);
        return { response, source: member.aid };
      } catch (err) {
        return null;
      }
    });

    // Take first successful response
    const results = await Promise.all(syncRequests);
    const firstSuccess = results.find((r) => r !== null);

    if (!firstSuccess) {
      // Retry if no responses
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this._syncGroup(
          groupId,
          sendSyncRequest,
          timeout,
          retryCount - 1,
          retryDelay
        );
      }
      return { synced: false, messagesReceived: 0 };
    }

    // Process sync response
    await this.manager.processSyncResponse(firstSuccess.response);

    return {
      synced: true,
      messagesReceived: firstSuccess.response.messages.length,
      source: firstSuccess.source,
    };
  }

  /**
   * Sync all groups for the current user
   */
  async syncAllGroups(
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    options: SyncOptions = {}
  ): Promise<Map<string, { synced: boolean; messagesReceived: number }>> {
    const groups = await this.manager.listGroups();
    const results = new Map<string, { synced: boolean; messagesReceived: number }>();

    // Sync all groups in parallel
    await Promise.all(
      groups.map(async (group) => {
        try {
          const result = await this.syncGroup(group.groupId, sendSyncRequest, options);
          results.set(group.groupId, result);
        } catch (err) {
          results.set(group.groupId, { synced: false, messagesReceived: 0 });
        }
      })
    );

    return results;
  }

  /**
   * Periodic sync (call this on interval)
   */
  startPeriodicSync(
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    interval: number = 30000, // Default: 30 seconds
    options: SyncOptions = {}
  ): () => void {
    const timer = setInterval(async () => {
      try {
        await this.syncAllGroups(sendSyncRequest, options);
      } catch (err) {
        console.error('Periodic sync failed:', err);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(timer);
  }

  /**
   * Queue message for offline send
   */
  async queueMessage(groupId: string, content: string): Promise<void> {
    const key = `groups:${groupId}:queue`;
    const queue = (await this.manager['storage'].get<Array<{ content: string; timestamp: number }>>(key)) || [];

    queue.push({
      content,
      timestamp: Date.now(),
    });

    await this.manager['storage'].set(key, queue);
  }

  /**
   * Flush queued messages (when coming online)
   */
  async flushQueue(
    groupId: string,
    sendMessage: (content: string) => Promise<GroupMessage>
  ): Promise<number> {
    const key = `groups:${groupId}:queue`;
    const queue = (await this.manager['storage'].get<Array<{ content: string; timestamp: number }>>(key)) || [];

    let sent = 0;
    for (const item of queue) {
      try {
        await sendMessage(item.content);
        sent++;
      } catch (err) {
        console.error('Failed to send queued message:', err);
      }
    }

    // Clear queue
    await this.manager['storage'].delete(key);

    return sent;
  }

  /**
   * Get queue size
   */
  async getQueueSize(groupId: string): Promise<number> {
    const key = `groups:${groupId}:queue`;
    const queue = (await this.manager['storage'].get<Array<any>>(key)) || [];
    return queue.length;
  }

  // ==================== Private Helpers ====================

  private _timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }
}

/**
 * Smart sync strategy that detects when to sync
 */
export class SmartSyncStrategy extends SyncStrategy {
  private lastSyncTimes: Map<string, number> = new Map();
  private syncThreshold: number = 60000; // 1 minute

  /**
   * Sync only if enough time has passed since last sync
   */
  async smartSyncGroup(
    groupId: string,
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    options: SyncOptions = {}
  ): Promise<{ synced: boolean; messagesReceived: number; source?: string }> {
    const lastSync = this.lastSyncTimes.get(groupId) || 0;
    const now = Date.now();

    if (now - lastSync < this.syncThreshold) {
      // Too soon, skip
      return { synced: false, messagesReceived: 0 };
    }

    const result = await this.syncGroup(groupId, sendSyncRequest, options);
    this.lastSyncTimes.set(groupId, now);
    return result;
  }

  /**
   * Force immediate sync (bypass threshold)
   */
  async forceSyncGroup(
    groupId: string,
    sendSyncRequest: (memberAid: string, request: any) => Promise<any>,
    options: SyncOptions = {}
  ): Promise<{ synced: boolean; messagesReceived: number; source?: string }> {
    const result = await this.syncGroup(groupId, sendSyncRequest, options);
    this.lastSyncTimes.set(groupId, Date.now());
    return result;
  }
}
