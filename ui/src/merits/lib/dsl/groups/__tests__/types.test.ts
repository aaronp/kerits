/**
 * Group Types Unit Tests
 *
 * Tests for vector clock and quorum utility functions
 */

import { describe, it, expect } from 'vitest';
import { VectorClock, QuorumUtils, DEFAULT_GROUP_SETTINGS } from '../types';

describe('VectorClock', () => {
  describe('init', () => {
    it('should initialize clock with all members at 0', () => {
      const clock = VectorClock.init(['alice', 'bob', 'carol']);
      expect(clock).toEqual({
        alice: 0,
        bob: 0,
        carol: 0,
      });
    });

    it('should handle empty member list', () => {
      const clock = VectorClock.init([]);
      expect(clock).toEqual({});
    });

    it('should handle single member', () => {
      const clock = VectorClock.init(['alice']);
      expect(clock).toEqual({ alice: 0 });
    });
  });

  describe('increment', () => {
    it('should increment own counter', () => {
      const clock = { alice: 5, bob: 3, carol: 2 };
      const updated = VectorClock.increment(clock, 'bob');
      expect(updated).toEqual({
        alice: 5,
        bob: 4,
        carol: 2,
      });
    });

    it('should initialize counter if missing', () => {
      const clock = { alice: 5 };
      const updated = VectorClock.increment(clock, 'bob');
      expect(updated).toEqual({
        alice: 5,
        bob: 1,
      });
    });

    it('should not mutate original clock', () => {
      const clock = { alice: 5 };
      const updated = VectorClock.increment(clock, 'alice');
      expect(clock.alice).toBe(5); // Original unchanged
      expect(updated.alice).toBe(6);
    });
  });

  describe('merge', () => {
    it('should take max of each counter', () => {
      const clock1 = { alice: 5, bob: 2, carol: 3 };
      const clock2 = { alice: 3, bob: 4, carol: 1 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(merged).toEqual({
        alice: 5,
        bob: 4,
        carol: 3,
      });
    });

    it('should add missing keys from clock2', () => {
      const clock1 = { alice: 5 };
      const clock2 = { bob: 3, carol: 2 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(merged).toEqual({
        alice: 5,
        bob: 3,
        carol: 2,
      });
    });

    it('should handle empty clocks', () => {
      const merged = VectorClock.merge({}, { alice: 1 });
      expect(merged).toEqual({ alice: 1 });
    });

    it('should not mutate original clocks', () => {
      const clock1 = { alice: 5 };
      const clock2 = { bob: 3 };
      const merged = VectorClock.merge(clock1, clock2);
      expect(clock1).toEqual({ alice: 5 });
      expect(clock2).toEqual({ bob: 3 });
    });
  });

  describe('happenedBefore', () => {
    it('should detect causal order', () => {
      const clock1 = { alice: 1, bob: 0, carol: 0 };
      const clock2 = { alice: 1, bob: 1, carol: 0 };
      expect(VectorClock.happenedBefore(clock1, clock2)).toBe(true);
      expect(VectorClock.happenedBefore(clock2, clock1)).toBe(false);
    });

    it('should return false for equal clocks', () => {
      const clock1 = { alice: 5, bob: 3 };
      const clock2 = { alice: 5, bob: 3 };
      expect(VectorClock.happenedBefore(clock1, clock2)).toBe(false);
    });

    it('should return false for concurrent events', () => {
      const clock1 = { alice: 2, bob: 1, carol: 0 };
      const clock2 = { alice: 1, bob: 0, carol: 2 };
      expect(VectorClock.happenedBefore(clock1, clock2)).toBe(false);
      expect(VectorClock.happenedBefore(clock2, clock1)).toBe(false);
    });

    it('should handle missing keys (treat as 0)', () => {
      const clock1 = { alice: 1 };
      const clock2 = { alice: 2, bob: 1 };
      expect(VectorClock.happenedBefore(clock1, clock2)).toBe(true);
    });
  });

  describe('concurrent', () => {
    it('should detect concurrent events', () => {
      const clock1 = { alice: 2, bob: 1, carol: 0 };
      const clock2 = { alice: 1, bob: 0, carol: 2 };
      expect(VectorClock.concurrent(clock1, clock2)).toBe(true);
    });

    it('should return false for causally ordered events', () => {
      const clock1 = { alice: 1, bob: 0 };
      const clock2 = { alice: 1, bob: 1 };
      expect(VectorClock.concurrent(clock1, clock2)).toBe(false);
    });

    it('should return false for equal clocks', () => {
      const clock1 = { alice: 5, bob: 3 };
      const clock2 = { alice: 5, bob: 3 };
      expect(VectorClock.concurrent(clock1, clock2)).toBe(false);
    });
  });

  describe('real-world scenario', () => {
    it('should track message causality correctly', () => {
      // Alice starts
      let aliceClock = VectorClock.init(['alice', 'bob', 'carol']);

      // Alice sends M1
      aliceClock = VectorClock.increment(aliceClock, 'alice');
      expect(aliceClock).toEqual({ alice: 1, bob: 0, carol: 0 });

      // Bob receives M1
      let bobClock = VectorClock.init(['alice', 'bob', 'carol']);
      bobClock = VectorClock.merge(bobClock, aliceClock);
      bobClock = VectorClock.increment(bobClock, 'bob');
      expect(bobClock).toEqual({ alice: 1, bob: 1, carol: 0 });

      // Bob sends M2
      bobClock = VectorClock.increment(bobClock, 'bob');
      expect(bobClock).toEqual({ alice: 1, bob: 2, carol: 0 });

      // Carol receives M2
      let carolClock = VectorClock.init(['alice', 'bob', 'carol']);
      carolClock = VectorClock.merge(carolClock, bobClock);
      carolClock = VectorClock.increment(carolClock, 'carol');
      expect(carolClock).toEqual({ alice: 1, bob: 2, carol: 1 });

      // Verify causality: Alice's M1 → Bob's M2
      expect(VectorClock.happenedBefore(aliceClock, bobClock)).toBe(true);
    });
  });
});

describe('QuorumUtils', () => {
  describe('calculateThreshold', () => {
    it('should calculate 50% threshold for 2 members', () => {
      expect(QuorumUtils.calculateThreshold(2, 0.5)).toBe(2); // Majority: floor(2/2)+1 = 2
    });

    it('should calculate 50% threshold for 3 members', () => {
      expect(QuorumUtils.calculateThreshold(3, 0.5)).toBe(2); // Majority: floor(3/2)+1 = 2
    });

    it('should calculate 50% threshold for 4 members', () => {
      expect(QuorumUtils.calculateThreshold(4, 0.5)).toBe(3); // Majority: floor(4/2)+1 = 3
    });

    it('should calculate 50% threshold for 5 members', () => {
      expect(QuorumUtils.calculateThreshold(5, 0.5)).toBe(3); // Majority: floor(5/2)+1 = 3
    });

    it('should handle 100% threshold', () => {
      expect(QuorumUtils.calculateThreshold(4, 1.0)).toBe(4);
    });

    it('should handle 67% threshold', () => {
      expect(QuorumUtils.calculateThreshold(3, 0.67)).toBe(3); // Ceil(3 * 0.67) = 3
    });

    it('should handle single member (always 1)', () => {
      expect(QuorumUtils.calculateThreshold(1, 0.5)).toBe(1);
    });
  });

  describe('hasQuorum', () => {
    it('should detect quorum in 2-member group', () => {
      const votes = { alice: true, bob: true };
      expect(QuorumUtils.hasQuorum(votes, 2, 0.5)).toBe(true);
    });

    it('should detect no quorum in 2-member group (1 vote)', () => {
      const votes = { alice: true };
      expect(QuorumUtils.hasQuorum(votes, 2, 0.5)).toBe(false); // Need 2/2 for majority
    });

    it('should detect quorum in 3-member group (2 votes)', () => {
      const votes = { alice: true, bob: true };
      expect(QuorumUtils.hasQuorum(votes, 3, 0.5)).toBe(true); // 2 >= 2
    });

    it('should detect no quorum in 3-member group (1 vote)', () => {
      const votes = { alice: true };
      expect(QuorumUtils.hasQuorum(votes, 3, 0.5)).toBe(false); // 1 < 2
    });

    it('should detect quorum in 4-member group (3 votes)', () => {
      const votes = { alice: true, bob: true, carol: true };
      expect(QuorumUtils.hasQuorum(votes, 4, 0.5)).toBe(true); // 3 >= 3
    });

    it('should handle negative votes', () => {
      const votes = { alice: true, bob: false, carol: true };
      expect(QuorumUtils.hasQuorum(votes, 3, 0.5)).toBe(true); // 2 positive >= 2
    });

    it('should handle all negative votes', () => {
      const votes = { alice: false, bob: false, carol: false };
      expect(QuorumUtils.hasQuorum(votes, 3, 0.5)).toBe(false); // 0 positive < 2
    });

    it('should handle single-member group (auto-quorum)', () => {
      const votes = { alice: true };
      expect(QuorumUtils.hasQuorum(votes, 1, 0.5)).toBe(true);
    });

    it('should handle 100% threshold', () => {
      const votes = { alice: true, bob: true };
      expect(QuorumUtils.hasQuorum(votes, 3, 1.0)).toBe(false); // 2 < 3
    });

    it('should detect quorum with 100% threshold when all vote', () => {
      const votes = { alice: true, bob: true, carol: true };
      expect(QuorumUtils.hasQuorum(votes, 3, 1.0)).toBe(true); // 3 >= 3
    });
  });

  describe('getVoteSummary', () => {
    it('should count all positive votes', () => {
      const votes = { alice: true, bob: true, carol: true };
      const summary = QuorumUtils.getVoteSummary(votes);
      expect(summary).toEqual({ total: 3, positive: 3, negative: 0 });
    });

    it('should count mixed votes', () => {
      const votes = { alice: true, bob: false, carol: true };
      const summary = QuorumUtils.getVoteSummary(votes);
      expect(summary).toEqual({ total: 3, positive: 2, negative: 1 });
    });

    it('should handle all negative votes', () => {
      const votes = { alice: false, bob: false };
      const summary = QuorumUtils.getVoteSummary(votes);
      expect(summary).toEqual({ total: 2, positive: 0, negative: 2 });
    });

    it('should handle single vote', () => {
      const votes = { alice: true };
      const summary = QuorumUtils.getVoteSummary(votes);
      expect(summary).toEqual({ total: 1, positive: 1, negative: 0 });
    });

    it('should handle empty votes', () => {
      const votes = {};
      const summary = QuorumUtils.getVoteSummary(votes);
      expect(summary).toEqual({ total: 0, positive: 0, negative: 0 });
    });
  });
});

describe('Default Settings', () => {
  it('should have correct default quorum threshold', () => {
    expect(DEFAULT_GROUP_SETTINGS.quorumThreshold).toBe(0.5);
  });

  it('should have correct default member invite setting', () => {
    expect(DEFAULT_GROUP_SETTINGS.allowMemberInvite).toBe(false);
  });
});
