/**
 * Group Chat Types
 *
 * Type definitions for distributed P2P group chat using gossip protocol.
 * See docs/GROUP-CHAT.md for full protocol specification.
 */

/**
 * Group metadata
 */
export interface Group {
  groupId: string;              // UUID (not an AID)
  name: string;
  createdAt: number;
  createdBy: string;            // Creator's AID
  parentGroupId?: string;       // For hierarchical groups
  members: GroupMember[];
  settings: GroupSettings;
  lastReadMessageId?: string | null;  // Last read canonical message ID (for unread tracking)
}

/**
 * Group member information
 */
export interface GroupMember {
  aid: string;
  role: 'creator' | 'member';
  joinedAt: number;
  lastSeenMessageId: string | null;  // Their HEAD
  vectorClock: Record<string, number>;
  lastOnlineAt: number;
  isOnline: boolean;
}

/**
 * Group settings (configurable behavior)
 */
export interface GroupSettings {
  quorumThreshold: number;      // Default: 0.5 (50%+1)
  allowMemberInvite: boolean;   // Default: false (creator only)
}

/**
 * Default group settings
 */
export const DEFAULT_GROUP_SETTINGS: GroupSettings = {
  quorumThreshold: 0.5,
  allowMemberInvite: false,
};

/**
 * Message status in group consensus
 */
export type GroupMessageStatus = 'pending' | 'canonical' | 'discarded';

/**
 * Group message with consensus metadata
 */
export interface GroupMessage {
  id: string;                   // SHA-256 hash of message
  groupId: string;              // Group UUID
  from: string;                 // Sender's AID
  prevId: string | null;        // Parent message (blockchain)
  content: string;
  timestamp: number;            // Sender's local time
  lamportClock: number;         // Logical clock for ordering
  vectorClock: Record<string, number>;  // {alice: 5, bob: 3}
  votes: Record<string, boolean>;       // {alice: true, bob: true}
  status: GroupMessageStatus;
  seq: number | null;           // Position in canonical chain (null if pending)
}

/**
 * Control message types for group coordination
 */
export type GroupControlMessage =
  | VoteMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | MetadataUpdateMessage;

/**
 * Vote on a group message
 */
export interface VoteMessage {
  type: 'group_vote';
  groupId: string;
  messageId: string;
  vote: boolean;                // true = accept, false = reject
  vectorClock: Record<string, number>;
}

/**
 * Request missing messages from peer
 */
export interface SyncRequestMessage {
  type: 'group_sync_request';
  groupId: string;
  myHEAD: string | null;        // My current HEAD message ID
  myVectorClock: Record<string, number>;
}

/**
 * Response with missing messages
 */
export interface SyncResponseMessage {
  type: 'group_sync_response';
  groupId: string;
  messages: GroupMessage[];     // Missing messages
  myHEAD: string | null;
  myVectorClock: Record<string, number>;
}

/**
 * Update group metadata (creator only)
 */
export interface MetadataUpdateMessage {
  type: 'group_metadata_update';
  groupId: string;
  operation: 'add_member' | 'rename' | 'update_settings';
  payload: any;
  from: string;                 // Must be creator
}

/**
 * Group chain state
 */
export interface GroupChainState {
  canonicalChain: string[];     // Ordered message IDs
  pendingMessages: string[];    // Messages awaiting quorum
  discardedMessages: string[];  // Conflicting messages that lost
  canonicalHEAD: string | null; // Current HEAD of canonical chain
  localHEAD: string | null;     // My view of HEAD (may differ)
}

/**
 * Vector clock utilities
 */
export class VectorClock {
  /**
   * Initialize vector clock for group members
   */
  static init(memberAids: string[]): Record<string, number> {
    const clock: Record<string, number> = {};
    for (const aid of memberAids) {
      clock[aid] = 0;
    }
    return clock;
  }

  /**
   * Increment own counter
   */
  static increment(clock: Record<string, number>, myAid: string): Record<string, number> {
    return {
      ...clock,
      [myAid]: (clock[myAid] || 0) + 1,
    };
  }

  /**
   * Merge two vector clocks (take max of each counter)
   */
  static merge(
    clock1: Record<string, number>,
    clock2: Record<string, number>
  ): Record<string, number> {
    const merged: Record<string, number> = { ...clock1 };
    for (const aid in clock2) {
      merged[aid] = Math.max(merged[aid] || 0, clock2[aid]);
    }
    return merged;
  }

  /**
   * Check if clock1 happened-before clock2 (causally ordered)
   */
  static happenedBefore(
    clock1: Record<string, number>,
    clock2: Record<string, number>
  ): boolean {
    let allLessOrEqual = true;
    let atLeastOneLess = false;

    for (const aid in clock1) {
      const c1 = clock1[aid] || 0;
      const c2 = clock2[aid] || 0;
      if (c1 > c2) {
        allLessOrEqual = false;
        break;
      }
      if (c1 < c2) {
        atLeastOneLess = true;
      }
    }

    return allLessOrEqual && atLeastOneLess;
  }

  /**
   * Check if two clocks are concurrent (neither happened-before the other)
   */
  static concurrent(
    clock1: Record<string, number>,
    clock2: Record<string, number>
  ): boolean {
    // Special case: equal clocks are not concurrent
    const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
    const allEqual = Array.from(allKeys).every(
      (aid) => (clock1[aid] || 0) === (clock2[aid] || 0)
    );
    if (allEqual) return false;

    return (
      !VectorClock.happenedBefore(clock1, clock2) &&
      !VectorClock.happenedBefore(clock2, clock1)
    );
  }
}

/**
 * Quorum calculation utilities
 */
export class QuorumUtils {
  /**
   * Calculate quorum threshold for group
   * For >50% majority: need Math.floor(total/2) + 1
   */
  static calculateThreshold(totalMembers: number, threshold: number): number {
    if (threshold === 0.5) {
      // Special case: >50% means majority
      return Math.floor(totalMembers / 2) + 1;
    }
    return Math.ceil(totalMembers * threshold);
  }

  /**
   * Check if message has reached quorum
   */
  static hasQuorum(
    votes: Record<string, boolean>,
    totalMembers: number,
    threshold: number
  ): boolean {
    const positiveVotes = Object.values(votes).filter((v) => v).length;
    const required = QuorumUtils.calculateThreshold(totalMembers, threshold);
    return positiveVotes >= required;
  }

  /**
   * Get vote count summary
   */
  static getVoteSummary(votes: Record<string, boolean>): {
    total: number;
    positive: number;
    negative: number;
  } {
    const total = Object.keys(votes).length;
    const positive = Object.values(votes).filter((v) => v).length;
    const negative = total - positive;
    return { total, positive, negative };
  }
}

/**
 * Message validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Sync strategy options
 */
export interface SyncOptions {
  strategy: 'broadcast' | 'sequential' | 'round-robin';
  timeout: number;              // Timeout in ms
}

/**
 * Default sync options
 */
export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  strategy: 'broadcast',
  timeout: 5000,
};
