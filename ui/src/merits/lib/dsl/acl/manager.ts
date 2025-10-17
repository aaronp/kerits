/**
 * ACL Manager DSL
 *
 * Separate concern from contacts - handles visibility/permissions only.
 * ACL is per-user (namespace = user's AID).
 */

import type { Kv } from '../../storage';
import type { ACLEntry } from './types';

export class ACLManager {
  private kv: Kv;
  private prefix = 'acl';

  constructor(kv: Kv) {
    this.kv = kv;
  }

  /**
   * Get ACL entry for contact
   * Returns default (all allowed) if not explicitly set.
   */
  async getACL(aid: string): Promise<ACLEntry> {
    const entry = await this.kv.get<ACLEntry>(`${this.prefix}:${aid}`);

    if (!entry) {
      // Default: all permissions allowed
      return {
        aid,
        blocked: false,
        muted: false,
        hidden: false,
        updatedAt: Date.now(),
      };
    }

    return entry;
  }

  /**
   * Set ACL entry
   */
  async setACL(
    aid: string,
    updates: Partial<Omit<ACLEntry, 'aid' | 'updatedAt'>>
  ): Promise<ACLEntry> {
    const current = await this.getACL(aid);
    const updated: ACLEntry = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.kv.set(`${this.prefix}:${aid}`, updated);
    return updated;
  }

  /**
   * Block contact (reject all messages)
   */
  async blockContact(aid: string): Promise<void> {
    await this.setACL(aid, { blocked: true });
  }

  /**
   * Unblock contact
   */
  async unblockContact(aid: string): Promise<void> {
    await this.setACL(aid, { blocked: false });
  }

  /**
   * Mute contact (no notifications)
   */
  async muteContact(aid: string): Promise<void> {
    await this.setACL(aid, { muted: true });
  }

  /**
   * Unmute contact
   */
  async unmuteContact(aid: string): Promise<void> {
    await this.setACL(aid, { muted: false });
  }

  /**
   * Hide contact from list
   */
  async hideContact(aid: string): Promise<void> {
    await this.setACL(aid, { hidden: true });
  }

  /**
   * Show contact in list
   */
  async showContact(aid: string): Promise<void> {
    await this.setACL(aid, { hidden: false });
  }

  /**
   * Check if contact is blocked
   */
  async isBlocked(aid: string): Promise<boolean> {
    const acl = await this.getACL(aid);
    return acl.blocked;
  }

  /**
   * Check if contact is muted
   */
  async isMuted(aid: string): Promise<boolean> {
    const acl = await this.getACL(aid);
    return acl.muted;
  }

  /**
   * Check if contact is hidden
   */
  async isHidden(aid: string): Promise<boolean> {
    const acl = await this.getACL(aid);
    return acl.hidden;
  }

  /**
   * List all ACL entries (only explicitly set ones)
   */
  async listACLs(): Promise<ACLEntry[]> {
    const keys = await this.kv.list(this.prefix);
    const entries: ACLEntry[] = [];

    for (const key of keys) {
      const entry = await this.kv.get<ACLEntry>(key);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Clear ACL for contact (reset to defaults)
   */
  async clearACL(aid: string): Promise<void> {
    await this.kv.delete(`${this.prefix}:${aid}`);
  }
}
