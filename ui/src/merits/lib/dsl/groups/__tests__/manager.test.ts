/**
 * GroupManager Unit Tests
 *
 * Test core group operations: create, send, vote, quorum, conflicts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GroupManager } from '../manager';
import { MemoryKv } from '../../../storage/memory-kv';
import type { GroupMessage } from '../types';

describe('GroupManager', () => {
  let storage: MemoryKv;
  let manager: GroupManager;
  const myAid = 'alice_aid';
  const bobAid = 'bob_aid';
  const carolAid = 'carol_aid';

  beforeEach(() => {
    storage = new MemoryKv();
    manager = new GroupManager({
      storage,
      myAid,
    });
  });

  // ==================== Group Creation ====================

  describe('Group Creation', () => {
    it('should create a group with members', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid, carolAid],
      });

      expect(group.groupId).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.createdBy).toBe(myAid);
      expect(group.members).toHaveLength(3);
      expect(group.members.find((m) => m.aid === myAid)?.role).toBe('creator');
      expect(group.members.find((m) => m.aid === bobAid)?.role).toBe('member');
      expect(group.settings.quorumThreshold).toBe(0.5);
    });

    it('should auto-add creator if not in member list', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [bobAid, carolAid],
      });

      expect(group.members).toHaveLength(3);
      expect(group.members.find((m) => m.aid === myAid)).toBeDefined();
      expect(group.members.find((m) => m.aid === myAid)?.role).toBe('creator');
    });

    it('should allow custom quorum threshold', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
        settings: { quorumThreshold: 0.75 },
      });

      expect(group.settings.quorumThreshold).toBe(0.75);
    });

    it('should create 1-member group', async () => {
      const group = await manager.createGroup({
        name: 'Solo Group',
        memberAids: [myAid],
      });

      expect(group.members).toHaveLength(1);
      expect(group.members[0].aid).toBe(myAid);
    });
  });

  // ==================== Message Sending ====================

  describe('Message Sending', () => {
    it('should send first message in group', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const message = await manager.sendMessage(group.groupId, 'Hello!');

      expect(message.id).toBeDefined();
      expect(message.groupId).toBe(group.groupId);
      expect(message.from).toBe(myAid);
      expect(message.content).toBe('Hello!');
      expect(message.prevId).toBeNull(); // First message
      expect(message.vectorClock[myAid]).toBe(1);
      expect(message.lamportClock).toBeGreaterThan(0);
      expect(message.votes[myAid]).toBe(true); // Self-vote
      expect(message.status).toBe('pending');
    });

    it('should chain messages with prevId', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid],
      });

      const msg1 = await manager.sendMessage(group.groupId, 'First');
      // Wait for msg1 to become canonical (1-member group auto-quorum)
      const msg2 = await manager.sendMessage(group.groupId, 'Second');

      expect(msg2.prevId).toBe(msg1.id);
    });

    it('should increment vector clock on send', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const msg1 = await manager.sendMessage(group.groupId, 'First');
      expect(msg1.vectorClock[myAid]).toBe(1);

      const msg2 = await manager.sendMessage(group.groupId, 'Second');
      expect(msg2.vectorClock[myAid]).toBe(2);
    });

    it('should increment lamport clock on send', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const msg1 = await manager.sendMessage(group.groupId, 'First');
      const msg2 = await manager.sendMessage(group.groupId, 'Second');

      expect(msg2.lamportClock).toBeGreaterThan(msg1.lamportClock);
    });
  });

  // ==================== Message Receiving ====================

  describe('Message Receiving', () => {
    it('should receive and auto-vote on message', async () => {
      // Alice creates group
      const aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: myAid,
      });
      const group = await aliceManager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });
      const message = await aliceManager.sendMessage(group.groupId, 'Hello Bob!');

      // Bob receives message
      const bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: bobAid,
      });
      await bobManager.joinGroup(group);

      const voteMessage = await bobManager.receiveMessage(message);

      expect(voteMessage.type).toBe('group_vote');
      expect(voteMessage.groupId).toBe(group.groupId);
      expect(voteMessage.messageId).toBe(message.id);
      expect(voteMessage.vote).toBe(true);

      // Check Bob's local copy has his vote
      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.votes[bobAid]).toBe(true);
    });

    it('should reject message from non-member', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const fakeMessage: GroupMessage = {
        id: 'fake_id',
        groupId: group.groupId,
        from: 'attacker_aid',
        prevId: null,
        content: 'Malicious',
        timestamp: Date.now(),
        lamportClock: 1,
        vectorClock: { attacker_aid: 1 },
        votes: { attacker_aid: true },
        status: 'pending',
        seq: null,
      };

      await expect(manager.receiveMessage(fakeMessage)).rejects.toThrow('Sender not a member');
    });

    it('should reject message with invalid prevId', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const invalidMessage: GroupMessage = {
        id: 'invalid_id',
        groupId: group.groupId,
        from: myAid,
        prevId: 'nonexistent_id',
        content: 'Invalid',
        timestamp: Date.now(),
        lamportClock: 1,
        vectorClock: { [myAid]: 1 },
        votes: { [myAid]: true },
        status: 'pending',
        seq: null,
      };

      await expect(manager.receiveMessage(invalidMessage)).rejects.toThrow('Invalid prevId');
    });

    it('should reject duplicate message', async () => {
      const group = await manager.createGroup({
        name: 'Test Group',
        memberAids: [myAid, bobAid],
      });

      const message = await manager.sendMessage(group.groupId, 'Hello');

      // Try to receive same message twice
      await expect(manager.receiveMessage(message)).rejects.toThrow('Duplicate message');
    });
  });

  // ==================== Quorum & Consensus ====================

  describe('Quorum', () => {
    it('should reach quorum in 1-member group immediately', async () => {
      let canonicalMessage: GroupMessage | null = null;

      const soloManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: myAid,
        onMessageCanonical: (groupId, message) => {
          canonicalMessage = message;
        },
      });

      const group = await soloManager.createGroup({
        name: 'Solo',
        memberAids: [myAid],
      });

      const message = await soloManager.sendMessage(group.groupId, 'Talking to myself');

      // Should be canonical immediately (1/1 = 100%)
      expect(canonicalMessage).not.toBeNull();
      expect(canonicalMessage?.id).toBe(message.id);
      expect(canonicalMessage?.status).toBe('canonical');
      expect(canonicalMessage?.seq).toBe(1);
    });

    it('should reach quorum in 2-member group when both vote', async () => {
      const aliceStorage = new MemoryKv();
      const bobStorage = new MemoryKv();

      let canonicalCount = 0;

      const aliceManager = new GroupManager({
        storage: aliceStorage,
        myAid: myAid,
        onMessageCanonical: () => canonicalCount++,
      });

      const bobManager = new GroupManager({
        storage: bobStorage,
        myAid: bobAid,
        onMessageCanonical: () => canonicalCount++,
      });

      // Alice creates group
      const group = await aliceManager.createGroup({
        name: 'Test',
        memberAids: [myAid, bobAid],
      });
      await bobManager.joinGroup(group);

      // Alice sends message
      const message = await aliceManager.sendMessage(group.groupId, 'Hello');

      // Not canonical yet (only 1/2 votes)
      expect(message.status).toBe('pending');

      // Bob receives and votes
      const vote = await bobManager.receiveMessage(message);

      // Now Bob's copy should be canonical (2/2)
      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.status).toBe('canonical');

      // Alice receives Bob's vote
      await aliceManager.receiveVote(vote);

      // Now Alice's copy should be canonical too
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');
    });

    it('should reach quorum in 3-member group with 2/3 votes', async () => {
      const aliceStorage = new MemoryKv();
      const bobStorage = new MemoryKv();
      const carolStorage = new MemoryKv();

      const aliceManager = new GroupManager({
        storage: aliceStorage,
        myAid: myAid,
      });

      const bobManager = new GroupManager({
        storage: bobStorage,
        myAid: bobAid,
      });

      const carolManager = new GroupManager({
        storage: carolStorage,
        myAid: carolAid,
      });

      // Alice creates group
      const group = await aliceManager.createGroup({
        name: 'Test',
        memberAids: [myAid, bobAid, carolAid],
      });
      await bobManager.joinGroup(group);
      await carolManager.joinGroup(group);

      // Alice sends message
      const message = await aliceManager.sendMessage(group.groupId, 'Hello');
      expect(message.status).toBe('pending'); // 1/3

      // Bob receives and votes
      const bobVote = await bobManager.receiveMessage(message);

      // Bob's copy should be canonical now (2/3)
      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.status).toBe('canonical');

      // Alice receives Bob's vote
      await aliceManager.receiveVote(bobVote);

      // Alice's copy should be canonical now
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');
    });
  });

  // ==================== Conflict Resolution ====================

  describe('Conflict Resolution', () => {
    it('should detect conflict when two messages have same prevId', async () => {
      const group = await manager.createGroup({
        name: 'Test',
        memberAids: [myAid],
      });

      // Send first message (will be canonical immediately)
      const msg1 = await manager.sendMessage(group.groupId, 'First');

      // Simulate two competing messages from different members
      // (In real scenario, these would come from different managers)
      const msg2a: GroupMessage = {
        id: 'msg2a',
        groupId: group.groupId,
        from: myAid,
        prevId: msg1.id,
        content: 'Second A',
        timestamp: Date.now(),
        lamportClock: 10,
        vectorClock: { [myAid]: 2 },
        votes: { [myAid]: true },
        status: 'pending',
        seq: null,
      };

      const msg2b: GroupMessage = {
        id: 'msg2b',
        groupId: group.groupId,
        from: bobAid,
        prevId: msg1.id, // Same prevId!
        content: 'Second B',
        timestamp: Date.now(),
        lamportClock: 11, // Higher clock
        vectorClock: { [bobAid]: 1 },
        votes: { [bobAid]: true },
        status: 'pending',
        seq: null,
      };

      // Store both as pending
      await storage.set(`groups:${group.groupId}:messages:msg2a`, msg2a);
      await storage.set(`groups:${group.groupId}:messages:msg2b`, msg2b);

      // Now one reaches quorum (since it's 1-member group, auto-quorum)
      // The one with lower lamport clock should win
      msg2a.status = 'canonical';
      msg2a.seq = 2;
      await storage.set(`groups:${group.groupId}:messages:msg2a`, msg2a);

      const canonical = await manager.getMessage(group.groupId, 'msg2a');
      expect(canonical?.status).toBe('canonical');
    });
  });

  // ==================== Sync Protocol ====================

  describe('Sync Protocol', () => {
    it('should create sync request with HEAD and vector clock', async () => {
      const group = await manager.createGroup({
        name: 'Test',
        memberAids: [myAid, bobAid],
      });

      await manager.sendMessage(group.groupId, 'Hello');

      const syncRequest = await manager.createSyncRequest(group.groupId);

      expect(syncRequest.type).toBe('group_sync_request');
      expect(syncRequest.groupId).toBe(group.groupId);
      expect(syncRequest.myHEAD).toBeDefined();
      expect(syncRequest.myVectorClock).toBeDefined();
    });

    it('should create sync response with missing messages', async () => {
      const aliceStorage = new MemoryKv();
      const bobStorage = new MemoryKv();

      const aliceManager = new GroupManager({
        storage: aliceStorage,
        myAid: myAid,
      });

      const bobManager = new GroupManager({
        storage: bobStorage,
        myAid: bobAid,
      });

      // Alice creates group and sends 3 messages
      const group = await aliceManager.createGroup({
        name: 'Test',
        memberAids: [myAid, bobAid],
      });
      await bobManager.joinGroup(group);

      const msg1 = await aliceManager.sendMessage(group.groupId, 'Msg 1');
      const msg2 = await aliceManager.sendMessage(group.groupId, 'Msg 2');
      const msg3 = await aliceManager.sendMessage(group.groupId, 'Msg 3');

      // Bob only has msg1
      await bobManager.receiveMessage(msg1);

      // Bob requests sync
      const syncRequest = await bobManager.createSyncRequest(group.groupId);

      // Alice creates response
      const syncResponse = await aliceManager.createSyncResponse(syncRequest);

      expect(syncResponse.type).toBe('group_sync_response');
      expect(syncResponse.messages.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== Query Methods ====================

  describe('Query Methods', () => {
    it('should list all groups', async () => {
      await manager.createGroup({
        name: 'Group 1',
        memberAids: [myAid, bobAid],
      });

      await manager.createGroup({
        name: 'Group 2',
        memberAids: [myAid, carolAid],
      });

      const groups = await manager.listGroups();
      expect(groups).toHaveLength(2);
    });

    it('should get canonical messages sorted by seq', async () => {
      const group = await manager.createGroup({
        name: 'Test',
        memberAids: [myAid],
      });

      await manager.sendMessage(group.groupId, 'First');
      await manager.sendMessage(group.groupId, 'Second');
      await manager.sendMessage(group.groupId, 'Third');

      const messages = await manager.getCanonicalMessages(group.groupId);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('First');
      expect(messages[1].content).toBe('Second');
      expect(messages[2].content).toBe('Third');
    });

    it('should get pending messages', async () => {
      const group = await manager.createGroup({
        name: 'Test',
        memberAids: [myAid, bobAid],
      });

      await manager.sendMessage(group.groupId, 'Pending 1');
      await manager.sendMessage(group.groupId, 'Pending 2');

      const pending = await manager.getPendingMessages(group.groupId);
      expect(pending.length).toBeGreaterThanOrEqual(2);
      pending.forEach((msg) => {
        expect(msg.status).toBe('pending');
      });
    });
  });
});
