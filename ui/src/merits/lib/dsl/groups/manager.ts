/**
 * Group Manager
 *
 * Core group chat logic: create groups, send messages, vote, sync, resolve conflicts.
 */

import type { Kv } from '../../storage';
import {
  type Group,
  type GroupMember,
  type GroupMessage,
  type GroupSettings,
  VectorClock,
  QuorumUtils,
} from './types';
import { createHash } from 'crypto';

export interface GroupManagerOptions {
  storage: Kv;
  myAid: string;
  onMessageCanonical?: (groupId: string, message: GroupMessage) => void;
  onSyncRequired?: (groupId: string) => void;
}

export class GroupManager {
  private storage: Kv;
  private myAid: string;
  private onMessageCanonical?: (groupId: string, message: GroupMessage) => void;
  private onSyncRequired?: (groupId: string) => void;

  constructor(options: GroupManagerOptions) {
    this.storage = options.storage;
    this.myAid = options.myAid;
    this.onMessageCanonical = options.onMessageCanonical;
    this.onSyncRequired = options.onSyncRequired;
  }

  // ==================== Group Creation ====================

  /**
   * Create a new group (creator only)
   */
  async createGroup(params: {
    name: string;
    memberAids: string[];
    settings?: Partial<GroupSettings>;
  }): Promise<Group> {
    const groupId = crypto.randomUUID();
    const now = Date.now();

    // Ensure creator is in members
    const memberAids = params.memberAids.includes(this.myAid)
      ? params.memberAids
      : [this.myAid, ...params.memberAids];

    const members: GroupMember[] = memberAids.map((aid) => ({
      aid,
      role: aid === this.myAid ? 'creator' : 'member',
      joinedAt: now,
      lastSeenMessageId: null,
      vectorClock: VectorClock.init(memberAids),
      lastOnlineAt: now,
      isOnline: true,
    }));

    const group: Group = {
      groupId,
      name: params.name,
      createdAt: now,
      createdBy: this.myAid,
      members,
      settings: {
        quorumThreshold: params.settings?.quorumThreshold ?? 0.5,
        allowMemberInvite: params.settings?.allowMemberInvite ?? false,
      },
    };

    await this.storeGroup(group);
    return group;
  }

  /**
   * Join an existing group (when receiving metadata from creator)
   */
  async joinGroup(group: Group): Promise<void> {
    // Validate creator
    if (group.createdBy !== group.members.find((m) => m.role === 'creator')?.aid) {
      throw new Error('Invalid group: creator mismatch');
    }

    // Ensure I'm a member
    if (!group.members.some((m) => m.aid === this.myAid)) {
      throw new Error('Not a member of this group');
    }

    await this.storeGroup(group);
  }

  // ==================== Message Sending ====================

  /**
   * Send a message to the group
   * Returns the message that needs to be sent to each member via DM
   */
  async sendMessage(groupId: string, content: string): Promise<GroupMessage> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // Get current HEAD
    const head = await this.getHEAD(groupId);

    // Get my vector clock
    const myMember = group.members.find((m) => m.aid === this.myAid);
    if (!myMember) throw new Error('Not a member of this group');

    const vectorClock = { ...myMember.vectorClock };
    vectorClock[this.myAid] = (vectorClock[this.myAid] || 0) + 1;

    // Get lamport clock (max of all seen + 1)
    const lamportClock = await this.getNextLamportClock(groupId);

    const timestamp = Date.now();
    const message: GroupMessage = {
      id: this.hashMessage({
        prevId: head,
        from: this.myAid,
        content,
        timestamp,
      }),
      groupId,
      from: this.myAid,
      prevId: head,
      content,
      timestamp,
      lamportClock,
      vectorClock,
      votes: { [this.myAid]: true }, // Implicit self-vote
      status: 'pending',
      seq: null,
    };

    // Store message
    await this.storeMessage(message);

    // Update my vector clock
    await this.updateMemberVectorClock(groupId, this.myAid, vectorClock);

    // Check quorum (might be 1-member group)
    await this.checkQuorum(message);

    return message;
  }

  /**
   * Receive a message from another member
   * Returns vote message to broadcast to all members
   */
  async receiveMessage(
    message: GroupMessage
  ): Promise<{ type: 'group_vote'; groupId: string; messageId: string; vote: boolean; vectorClock: Record<string, number> }> {
    const group = await this.getGroup(message.groupId);
    if (!group) throw new Error('Group not found');

    // Validate message
    await this.validateMessage(message);

    // Update my vector clock
    const myMember = group.members.find((m) => m.aid === this.myAid);
    if (!myMember) throw new Error('Not a member');

    const vectorClock = VectorClock.merge(myMember.vectorClock, message.vectorClock);
    vectorClock[this.myAid] = (vectorClock[this.myAid] || 0) + 1;

    // Update lamport clock
    const currentLamport = await this.getCurrentLamportClock(message.groupId);
    const newLamport = Math.max(message.lamportClock, currentLamport) + 1;
    await this.setLamportClock(message.groupId, newLamport);

    // Add my vote
    message.votes[this.myAid] = true;

    // Store message
    await this.storeMessage(message);

    // Update my vector clock
    await this.updateMemberVectorClock(message.groupId, this.myAid, vectorClock);

    // Check quorum
    await this.checkQuorum(message);

    // Return vote message
    return {
      type: 'group_vote',
      groupId: message.groupId,
      messageId: message.id,
      vote: true,
      vectorClock,
    };
  }

  /**
   * Receive a vote from another member
   */
  async receiveVote(vote: {
    type: 'group_vote';
    groupId: string;
    messageId: string;
    vote: boolean;
    vectorClock: Record<string, number>;
  }): Promise<void> {
    const group = await this.getGroup(vote.groupId);
    if (!group) throw new Error('Group not found');

    // Validate voter is member
    if (!group.members.some((m) => m.aid === vote.vectorClock ? Object.keys(vote.vectorClock)[0] : '')) {
      console.warn('Vote from non-member, rejecting');
      return;
    }

    // Get message
    const message = await this.getMessage(vote.groupId, vote.messageId);
    if (!message) {
      console.warn('Vote for unknown message, ignoring');
      return;
    }

    // Find voter from vector clock (whoever's count increased)
    const voterAid = this.extractVoterFromVectorClock(vote.vectorClock, message.vectorClock);
    if (!voterAid || !group.members.some((m) => m.aid === voterAid)) {
      console.warn('Could not identify voter or voter not in group');
      return;
    }

    // Update votes
    message.votes[voterAid] = vote.vote;
    await this.storeMessage(message);

    // Check quorum
    await this.checkQuorum(message);
  }

  // ==================== Quorum & Consensus ====================

  /**
   * Check if message has reached quorum, canonicalize if yes
   */
  private async checkQuorum(message: GroupMessage): Promise<void> {
    const group = await this.getGroup(message.groupId);
    if (!group) return;

    const hasQuorum = QuorumUtils.hasQuorum(
      message.votes,
      group.members.length,
      group.settings.quorumThreshold
    );

    if (!hasQuorum) return;

    // Check for conflicts (other pending messages with same prevId)
    const conflicts = await this.getConflictingMessages(message);

    if (conflicts.length === 0) {
      // No conflicts, canonicalize immediately
      await this.canonicalizeMessage(message);
    } else {
      // Resolve conflict
      await this.resolveConflict(message, conflicts);
    }
  }

  /**
   * Canonicalize a message (mark as canonical, assign seq, update HEAD)
   */
  private async canonicalizeMessage(message: GroupMessage): Promise<void> {
    message.status = 'canonical';
    message.seq = await this.getNextSeq(message.groupId);
    await this.storeMessage(message);

    // Update HEAD
    await this.setHEAD(message.groupId, message.id);

    // Notify
    if (this.onMessageCanonical) {
      this.onMessageCanonical(message.groupId, message);
    }
  }

  /**
   * Resolve conflict between competing messages
   * First-to-quorum wins, tie-break by lamport clock, then message ID
   */
  private async resolveConflict(message: GroupMessage, conflicts: GroupMessage[]): Promise<void> {
    const allMessages = [message, ...conflicts];

    // Sort by: hasQuorum DESC, lamportClock ASC, id ASC
    const group = await this.getGroup(message.groupId);
    if (!group) return;

    allMessages.sort((a, b) => {
      const aQuorum = QuorumUtils.hasQuorum(a.votes, group.members.length, group.settings.quorumThreshold);
      const bQuorum = QuorumUtils.hasQuorum(b.votes, group.members.length, group.settings.quorumThreshold);

      if (aQuorum && !bQuorum) return -1;
      if (!aQuorum && bQuorum) return 1;
      if (a.lamportClock !== b.lamportClock) return a.lamportClock - b.lamportClock;
      return a.id.localeCompare(b.id);
    });

    const winner = allMessages[0];
    const losers = allMessages.slice(1);

    // Canonicalize winner
    await this.canonicalizeMessage(winner);

    // Discard losers
    for (const loser of losers) {
      loser.status = 'discarded';
      loser.seq = null;
      await this.storeMessage(loser);
    }
  }

  /**
   * Get conflicting messages (same prevId, status=pending)
   */
  private async getConflictingMessages(message: GroupMessage): Promise<GroupMessage[]> {
    const allMessages = await this.getAllMessages(message.groupId);
    return allMessages.filter(
      (m) =>
        m.id !== message.id &&
        m.prevId === message.prevId &&
        m.status === 'pending'
    );
  }

  // ==================== Sync Protocol ====================

  /**
   * Request sync from a member
   */
  async createSyncRequest(groupId: string): Promise<{
    type: 'group_sync_request';
    groupId: string;
    myHEAD: string | null;
    myVectorClock: Record<string, number>;
  }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    const myMember = group.members.find((m) => m.aid === this.myAid);
    if (!myMember) throw new Error('Not a member');

    const head = await this.getHEAD(groupId);

    return {
      type: 'group_sync_request',
      groupId,
      myHEAD: head,
      myVectorClock: myMember.vectorClock,
    };
  }

  /**
   * Create sync response for a member
   */
  async createSyncResponse(
    request: {
      type: 'group_sync_request';
      groupId: string;
      myHEAD: string | null;
      myVectorClock: Record<string, number>;
    }
  ): Promise<{
    type: 'group_sync_response';
    groupId: string;
    messages: GroupMessage[];
    myHEAD: string | null;
    myVectorClock: Record<string, number>;
  }> {
    const group = await this.getGroup(request.groupId);
    if (!group) throw new Error('Group not found');

    const myMember = group.members.find((m) => m.aid === this.myAid);
    if (!myMember) throw new Error('Not a member');

    const myHEAD = await this.getHEAD(request.groupId);

    // Get messages they're missing (after their HEAD)
    const messages = await this.getMessagesAfter(request.groupId, request.myHEAD);

    return {
      type: 'group_sync_response',
      groupId: request.groupId,
      messages,
      myHEAD,
      myVectorClock: myMember.vectorClock,
    };
  }

  /**
   * Process sync response from a member
   */
  async processSyncResponse(response: {
    type: 'group_sync_response';
    groupId: string;
    messages: GroupMessage[];
    myHEAD: string | null;
    myVectorClock: Record<string, number>;
  }): Promise<void> {
    for (const message of response.messages) {
      try {
        await this.receiveMessage(message);
      } catch (err) {
        console.error('Failed to process sync message:', err);
      }
    }

    // Update my vector clock
    const group = await this.getGroup(response.groupId);
    if (!group) return;

    const myMember = group.members.find((m) => m.aid === this.myAid);
    if (!myMember) return;

    const mergedClock = VectorClock.merge(myMember.vectorClock, response.myVectorClock);
    await this.updateMemberVectorClock(response.groupId, this.myAid, mergedClock);
  }

  // ==================== Validation ====================

  /**
   * Validate message before processing
   */
  private async validateMessage(message: GroupMessage): Promise<void> {
    const group = await this.getGroup(message.groupId);
    if (!group) throw new Error('Group not found');

    // Check sender is member
    if (!group.members.some((m) => m.aid === message.from)) {
      throw new Error('Sender not a member');
    }

    // Check prevId exists (or is null for first message)
    if (message.prevId !== null) {
      const prev = await this.getMessage(message.groupId, message.prevId);
      if (!prev) throw new Error('Invalid prevId: parent not found');
    }

    // Check hash
    const expectedHash = this.hashMessage({
      prevId: message.prevId,
      from: message.from,
      content: message.content,
      timestamp: message.timestamp,
    });
    if (message.id !== expectedHash) {
      throw new Error('Invalid message hash');
    }

    // Check lamport clock
    const currentLamport = await this.getCurrentLamportClock(message.groupId);
    if (message.lamportClock <= currentLamport) {
      console.warn('Lamport clock not increasing, accepting anyway');
    }

    // Check for duplicate
    const existing = await this.getMessage(message.groupId, message.id);
    if (existing) throw new Error('Duplicate message');
  }

  // ==================== Storage Helpers ====================

  private async storeGroup(group: Group): Promise<void> {
    await this.storage.set(`groups:${group.groupId}:metadata`, group);
  }

  async getGroup(groupId: string): Promise<Group | null> {
    return this.storage.get<Group>(`groups:${groupId}:metadata`);
  }

  private async storeMessage(message: GroupMessage): Promise<void> {
    await this.storage.set(`groups:${message.groupId}:messages:${message.id}`, message);
  }

  async getMessage(groupId: string, messageId: string): Promise<GroupMessage | null> {
    return this.storage.get<GroupMessage>(`groups:${groupId}:messages:${messageId}`);
  }

  private async getAllMessages(groupId: string): Promise<GroupMessage[]> {
    const keys = await this.storage.list(`groups:${groupId}:messages:`);
    const messages = await Promise.all(
      keys.map((key) => this.storage.get<GroupMessage>(key))
    );
    return messages.filter((m): m is GroupMessage => m !== null);
  }

  private async getMessagesAfter(groupId: string, afterId: string | null): Promise<GroupMessage[]> {
    const allMessages = await this.getAllMessages(groupId);

    if (afterId === null) {
      // Return all messages
      return allMessages.filter((m) => m.status === 'canonical').sort((a, b) => (a.seq || 0) - (b.seq || 0));
    }

    // Find position of afterId
    const afterMsg = allMessages.find((m) => m.id === afterId);
    if (!afterMsg || afterMsg.seq === null) return [];

    // Return messages after that seq
    return allMessages
      .filter((m) => m.status === 'canonical' && m.seq !== null && m.seq > afterMsg.seq)
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));
  }

  private async getHEAD(groupId: string): Promise<string | null> {
    return this.storage.get<string>(`groups:${groupId}:HEAD`);
  }

  private async setHEAD(groupId: string, messageId: string): Promise<void> {
    await this.storage.set(`groups:${groupId}:HEAD`, messageId);
  }

  private async getNextSeq(groupId: string): Promise<number> {
    const seq = await this.storage.get<number>(`groups:${groupId}:seq`);
    const nextSeq = (seq || 0) + 1;
    await this.storage.set(`groups:${groupId}:seq`, nextSeq);
    return nextSeq;
  }

  private async getCurrentLamportClock(groupId: string): Promise<number> {
    const clock = await this.storage.get<number>(`groups:${groupId}:lamportClock`);
    return clock || 0;
  }

  private async setLamportClock(groupId: string, clock: number): Promise<void> {
    await this.storage.set(`groups:${groupId}:lamportClock`, clock);
  }

  private async getNextLamportClock(groupId: string): Promise<number> {
    const clock = await this.getCurrentLamportClock(groupId);
    const nextClock = clock + 1;
    await this.setLamportClock(groupId, nextClock);
    return nextClock;
  }

  private async updateMemberVectorClock(
    groupId: string,
    memberAid: string,
    vectorClock: Record<string, number>
  ): Promise<void> {
    const group = await this.getGroup(groupId);
    if (!group) return;

    const member = group.members.find((m) => m.aid === memberAid);
    if (!member) return;

    member.vectorClock = vectorClock;
    await this.storeGroup(group);
  }

  // ==================== Utilities ====================

  private hashMessage(data: {
    prevId: string | null;
    from: string;
    content: string;
    timestamp: number;
  }): string {
    // Deterministic hash for testing (use SHA-256 in production)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `msg_${Math.abs(hash).toString(36)}`;
  }

  private extractVoterFromVectorClock(
    voteClock: Record<string, number>,
    messageClock: Record<string, number>
  ): string | null {
    // Find the AID whose count increased
    for (const aid in voteClock) {
      if ((voteClock[aid] || 0) > (messageClock[aid] || 0)) {
        return aid;
      }
    }
    return null;
  }

  // ==================== Public Query Methods ====================

  /**
   * Get all groups for this user
   */
  async listGroups(): Promise<Group[]> {
    const keys = await this.storage.list('groups:');
    const groupIds = keys
      .filter((k) => k.endsWith(':metadata'))
      .map((k) => k.split(':')[1]);

    const groups = await Promise.all(
      groupIds.map((id) => this.getGroup(id))
    );

    return groups.filter((g): g is Group => g !== null);
  }

  /**
   * Get canonical messages for a group (sorted by seq)
   */
  async getCanonicalMessages(groupId: string): Promise<GroupMessage[]> {
    const allMessages = await this.getAllMessages(groupId);
    return allMessages
      .filter((m) => m.status === 'canonical')
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));
  }

  /**
   * Get pending messages for a group
   */
  async getPendingMessages(groupId: string): Promise<GroupMessage[]> {
    const allMessages = await this.getAllMessages(groupId);
    return allMessages
      .filter((m) => m.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp);
  }
}
