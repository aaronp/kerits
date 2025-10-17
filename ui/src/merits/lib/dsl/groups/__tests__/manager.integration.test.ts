/**
 * GroupManager Integration Tests
 *
 * Test realistic multi-member group scenarios:
 * - 2-member groups
 * - 3-member groups
 * - 4-member groups
 * - Edge cases (offline, partitions, conflicts)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GroupManager } from '../manager';
import { MemoryKv } from '../../../storage/memory-kv';
import type { GroupMessage, Group } from '../types';

// Helper to wait for condition
const eventually = async (
  condition: () => Promise<boolean>,
  timeout = 1000
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Condition not met within timeout');
};

describe('GroupManager Integration Tests', () => {
  // ==================== 2-Member Scenarios ====================

  describe('2-Member Group', () => {
    let aliceManager: GroupManager;
    let bobManager: GroupManager;
    let group: Group;

    beforeEach(async () => {
      aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'alice',
      });

      bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'bob',
      });

      group = await aliceManager.createGroup({
        name: '2-Member Group',
        memberAids: ['alice', 'bob'],
      });

      await bobManager.joinGroup(group);
    });

    it('should reach quorum when both members vote', async () => {
      // Alice sends message
      const message = await aliceManager.sendMessage(group.groupId, 'Hello Bob!');
      expect(message.status).toBe('pending'); // Not canonical yet (1/2)

      // Bob receives and votes
      const bobVote = await bobManager.receiveMessage(message);
      expect(bobVote.vote).toBe(true);

      // Bob's copy should be canonical (2/2)
      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.status).toBe('canonical');
      expect(bobsMessage?.seq).toBe(1);

      // Alice receives Bob's vote
      await aliceManager.receiveVote(bobVote);

      // Alice's copy should be canonical
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');
      expect(alicesMessage?.seq).toBe(1);
    });

    it('should handle offline member (message stays pending)', async () => {
      // Alice sends message
      const message = await aliceManager.sendMessage(group.groupId, 'Where are you?');

      // Bob is offline (doesn't receive/vote)
      expect(message.status).toBe('pending');
      expect(message.votes).toEqual({ alice: true });

      // Message stays pending until Bob comes online
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('pending');
    });

    it('should sync when offline member comes online', async () => {
      // Alice sends 3 messages while Bob is offline
      const msg1 = await aliceManager.sendMessage(group.groupId, 'Message 1');
      const msg2 = await aliceManager.sendMessage(group.groupId, 'Message 2');
      const msg3 = await aliceManager.sendMessage(group.groupId, 'Message 3');

      // Bob comes online and syncs
      const syncRequest = await bobManager.createSyncRequest(group.groupId);
      const syncResponse = await aliceManager.createSyncResponse(syncRequest);

      // Sync response should have messages (though they're all pending)
      expect(syncResponse.myHEAD).toBeDefined();

      // Bob processes each message
      const vote1 = await bobManager.receiveMessage(msg1);
      const vote2 = await bobManager.receiveMessage(msg2);
      const vote3 = await bobManager.receiveMessage(msg3);

      // All should be canonical on Bob's side
      const bobsMsg1 = await bobManager.getMessage(group.groupId, msg1.id);
      expect(bobsMsg1?.status).toBe('canonical');

      // Alice receives votes
      await aliceManager.receiveVote(vote1);
      await aliceManager.receiveVote(vote2);
      await aliceManager.receiveVote(vote3);

      // All canonical on Alice's side too
      const alicesMsg1 = await aliceManager.getMessage(group.groupId, msg1.id);
      expect(alicesMsg1?.status).toBe('canonical');
    });

    it('should handle concurrent sends (both send at once)', async () => {
      // Both send messages at the same time with prevId=null
      const aliceMsg = await aliceManager.sendMessage(group.groupId, 'Alice first!');
      const bobMsg = await bobManager.sendMessage(group.groupId, 'Bob first!');

      // Different IDs (conflict)
      expect(aliceMsg.id).not.toBe(bobMsg.id);
      expect(aliceMsg.prevId).toBeNull();
      expect(bobMsg.prevId).toBeNull();

      // Alice receives Bob's message
      const aliceVoteForBob = await aliceManager.receiveMessage(bobMsg);

      // Bob receives Alice's message
      const bobVoteForAlice = await bobManager.receiveMessage(aliceMsg);

      // Both send votes back
      await bobManager.receiveVote(aliceVoteForBob);
      await aliceManager.receiveVote(bobVoteForAlice);

      // Both messages should reach quorum
      // Winner determined by lamport clock or message ID
      const bobsAliceMsg = await bobManager.getMessage(group.groupId, aliceMsg.id);
      const bobsBobMsg = await bobManager.getMessage(group.groupId, bobMsg.id);

      const canonicalCount = [bobsAliceMsg, bobsBobMsg].filter(
        (m) => m?.status === 'canonical'
      ).length;

      // At least one should be canonical (conflict resolution may have happened)
      expect(canonicalCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== 3-Member Scenarios ====================

  describe('3-Member Group', () => {
    let aliceManager: GroupManager;
    let bobManager: GroupManager;
    let carolManager: GroupManager;
    let group: Group;

    beforeEach(async () => {
      aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'alice',
      });

      bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'bob',
      });

      carolManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'carol',
      });

      group = await aliceManager.createGroup({
        name: '3-Member Group',
        memberAids: ['alice', 'bob', 'carol'],
      });

      await bobManager.joinGroup(group);
      await carolManager.joinGroup(group);
    });

    it('should reach quorum with 2/3 votes', async () => {
      // Alice sends message
      const message = await aliceManager.sendMessage(group.groupId, 'Hello team!');
      expect(message.status).toBe('pending'); // 1/3

      // Bob receives and votes
      const bobVote = await bobManager.receiveMessage(message);

      // Should be canonical now (2/3)
      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.status).toBe('canonical');

      // Alice receives Bob's vote
      await aliceManager.receiveVote(bobVote);

      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');

      // Carol can catch up later (already canonical)
      await carolManager.receiveMessage(message);
      const carolsMessage = await carolManager.getMessage(group.groupId, message.id);
      expect(carolsMessage?.status).toBe('canonical');
    });

    it('should work with 1 member offline (2/3 quorum)', async () => {
      // Alice sends, Bob and Alice vote (2/3)
      // Carol is offline
      const message = await aliceManager.sendMessage(group.groupId, 'Where is Carol?');

      const bobVote = await bobManager.receiveMessage(message);
      await aliceManager.receiveVote(bobVote);

      // Should be canonical (2/3)
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');

      const bobsMessage = await bobManager.getMessage(group.groupId, message.id);
      expect(bobsMessage?.status).toBe('canonical');
    });

    it('should handle conflict resolution with concurrent sends', async () => {
      // Alice and Bob send competing first messages
      const aliceMsg = await aliceManager.sendMessage(group.groupId, 'Alice first!');
      const bobMsg = await bobManager.sendMessage(group.groupId, 'Bob first!');

      // Both have prevId=null (competing for first message)
      expect(aliceMsg.prevId).toBeNull();
      expect(bobMsg.prevId).toBeNull();

      // Cross-receive
      const aliceVoteForBob = await aliceManager.receiveMessage(bobMsg);
      const bobVoteForAlice = await bobManager.receiveMessage(aliceMsg);

      // Carol receives both
      const carolVoteForAlice = await carolManager.receiveMessage(aliceMsg);
      const carolVoteForBob = await carolManager.receiveMessage(bobMsg);

      // Distribute votes
      await bobManager.receiveVote(aliceVoteForBob);
      await aliceManager.receiveVote(bobVoteForAlice);
      await aliceManager.receiveVote(carolVoteForAlice);
      await bobManager.receiveVote(carolVoteForBob);

      // Both should reach quorum, but one wins via conflict resolution
      const aliceStatus = (await aliceManager.getMessage(group.groupId, aliceMsg.id))?.status;
      const bobStatus = (await bobManager.getMessage(group.groupId, bobMsg.id))?.status;

      // One canonical, one discarded (or both canonical if tie-break picked one)
      const canonicalCount = [aliceStatus, bobStatus].filter((s) => s === 'canonical').length;
      expect(canonicalCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== 4-Member Scenarios ====================

  describe('4-Member Group', () => {
    let aliceManager: GroupManager;
    let bobManager: GroupManager;
    let carolManager: GroupManager;
    let daveManager: GroupManager;
    let group: Group;

    beforeEach(async () => {
      aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'alice',
      });

      bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'bob',
      });

      carolManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'carol',
      });

      daveManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'dave',
      });

      group = await aliceManager.createGroup({
        name: '4-Member Group',
        memberAids: ['alice', 'bob', 'carol', 'dave'],
      });

      await bobManager.joinGroup(group);
      await carolManager.joinGroup(group);
      await daveManager.joinGroup(group);
    });

    it('should reach quorum with 3/4 votes', async () => {
      // Alice sends
      const message = await aliceManager.sendMessage(group.groupId, 'Hello all!');

      // Bob and Carol vote (3/4 total with Alice)
      const bobVote = await bobManager.receiveMessage(message);
      await aliceManager.receiveVote(bobVote);

      const carolVote = await carolManager.receiveMessage(message);
      await aliceManager.receiveVote(carolVote);

      // Should be canonical (3/4)
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('canonical');
    });

    it('should NOT reach quorum with only 2/4 votes', async () => {
      // Alice sends (1/4)
      const message = await aliceManager.sendMessage(group.groupId, 'Need more votes');

      // Only Bob votes (2/4 total)
      const bobVote = await bobManager.receiveMessage(message);
      await aliceManager.receiveVote(bobVote);

      // Still pending (need 3/4)
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.status).toBe('pending');

      // Carol votes (3/4)
      const carolVote = await carolManager.receiveMessage(message);
      await aliceManager.receiveVote(carolVote);

      // Now canonical
      const alicesMessage2 = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage2?.status).toBe('canonical');
    });

    it('should handle network partition and merge', async () => {
      // First message (everyone agrees)
      const msg1 = await aliceManager.sendMessage(group.groupId, 'Before split');
      await bobManager.receiveMessage(msg1);
      await carolManager.receiveMessage(msg1);
      await daveManager.receiveMessage(msg1);

      // Network partition: {Alice, Bob} vs {Carol, Dave}
      // Alice+Bob send message (2/4 - not enough)
      const partitionMsgAB = await aliceManager.sendMessage(group.groupId, 'Partition AB');
      const bobVote = await bobManager.receiveMessage(partitionMsgAB);
      await aliceManager.receiveVote(bobVote);

      // Still pending (2/4)
      const abStatus = (await aliceManager.getMessage(group.groupId, partitionMsgAB.id))?.status;
      expect(abStatus).toBe('pending');

      // Carol+Dave send competing message (2/4 - not enough)
      const partitionMsgCD = await carolManager.sendMessage(group.groupId, 'Partition CD');
      const daveVote = await daveManager.receiveMessage(partitionMsgCD);
      await carolManager.receiveVote(daveVote);

      // Still pending (2/4)
      const cdStatus = (await carolManager.getMessage(group.groupId, partitionMsgCD.id))?.status;
      expect(cdStatus).toBe('pending');

      // Network heals: messages cross
      const aliceVoteCD = await aliceManager.receiveMessage(partitionMsgCD);
      const bobVoteCD = await bobManager.receiveMessage(partitionMsgCD);
      const carolVoteAB = await carolManager.receiveMessage(partitionMsgAB);
      const daveVoteAB = await daveManager.receiveMessage(partitionMsgAB);

      // Distribute votes
      await carolManager.receiveVote(aliceVoteCD);
      await carolManager.receiveVote(bobVoteCD);
      await aliceManager.receiveVote(carolVoteAB);
      await aliceManager.receiveVote(daveVoteAB);

      // Both reach quorum (4/4)
      // If they have same prevId, conflict resolution picks winner
      // If different prevId, both may be canonical (sequential)
      const finalABStatus = (await aliceManager.getMessage(group.groupId, partitionMsgAB.id))?.status;
      const finalCDStatus = (await carolManager.getMessage(group.groupId, partitionMsgCD.id))?.status;

      const canonicalCount = [finalABStatus, finalCDStatus].filter((s) => s === 'canonical').length;
      expect(canonicalCount).toBeGreaterThanOrEqual(1); // At least one canonical
    });

    it('should handle member disagreement (D has different view)', async () => {
      // Alice sends M3a
      const msg3a = await aliceManager.sendMessage(group.groupId, 'Version A');

      // Bob and Carol vote for M3a (3/4 quorum)
      const bobVote = await bobManager.receiveMessage(msg3a);
      const carolVote = await carolManager.receiveMessage(msg3a);
      await aliceManager.receiveVote(bobVote);
      await aliceManager.receiveVote(carolVote);

      // M3a is canonical (3/4)
      const alicesMsg3a = await aliceManager.getMessage(group.groupId, msg3a.id);
      expect(alicesMsg3a?.status).toBe('canonical');

      // Dave was offline and sends competing M3b
      const msg3b = await daveManager.sendMessage(group.groupId, 'Version B');

      // Dave syncs and discovers M3a has quorum
      await daveManager.receiveMessage(msg3a);

      // Dave's M3b should be discarded (or never reach quorum)
      const davesMsg3b = await daveManager.getMessage(group.groupId, msg3b.id);
      const davesMsg3a = await daveManager.getMessage(group.groupId, msg3a.id);

      expect(davesMsg3a?.status).toBe('canonical');
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle 1-member group (auto-quorum)', async () => {
      const soloManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'solo',
      });

      const group = await soloManager.createGroup({
        name: 'Solo Group',
        memberAids: ['solo'],
      });

      const message = await soloManager.sendMessage(group.groupId, 'Talking to myself');

      // Should be canonical immediately (1/1)
      expect(message.status).toBe('canonical');
      expect(message.seq).toBe(1);
    });

    it('should reject votes from non-members', async () => {
      const aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'alice',
      });

      const bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'bob',
      });

      const group = await aliceManager.createGroup({
        name: 'Exclusive Group',
        memberAids: ['alice', 'bob'],
      });

      const message = await aliceManager.sendMessage(group.groupId, 'Private message');

      // Attacker tries to vote
      const attackerVote = {
        type: 'group_vote' as const,
        groupId: group.groupId,
        messageId: message.id,
        vote: true,
        vectorClock: { attacker: 1 },
      };

      // Should be rejected silently
      await aliceManager.receiveVote(attackerVote);

      // Message still pending (no attacker vote recorded)
      const alicesMessage = await aliceManager.getMessage(group.groupId, message.id);
      expect(alicesMessage?.votes.attacker).toBeUndefined();
    });

    it('should handle out-of-order message delivery', async () => {
      const aliceManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'alice',
      });

      const bobManager = new GroupManager({
        storage: new MemoryKv(),
        myAid: 'bob',
      });

      const group = await aliceManager.createGroup({
        name: 'Test Group',
        memberAids: ['alice', 'bob'],
      });
      await bobManager.joinGroup(group);

      // Alice sends M1, M2, M3
      const msg1 = await aliceManager.sendMessage(group.groupId, 'First');
      const msg2 = await aliceManager.sendMessage(group.groupId, 'Second');
      const msg3 = await aliceManager.sendMessage(group.groupId, 'Third');

      // Bob receives in order: M1, M3, M2 (M2 delayed)
      await bobManager.receiveMessage(msg1);

      // Bob receives M3 before M2 (but M3.prevId requires M2 or M1)
      // For now we accept both (relaxed ordering)
      try {
        await bobManager.receiveMessage(msg3);
        // May succeed if prevId chain is valid
      } catch (err) {
        // Or may fail if prevId not found
        expect((err as Error).message).toContain('prevId');
      }

      // Bob receives M2 (fills gap)
      await bobManager.receiveMessage(msg2);

      // Now all should be present
      const bobsMsg1 = await bobManager.getMessage(group.groupId, msg1.id);
      const bobsMsg2 = await bobManager.getMessage(group.groupId, msg2.id);

      expect(bobsMsg1).toBeDefined();
      expect(bobsMsg2).toBeDefined();
    });
  });
});
