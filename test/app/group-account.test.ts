/**
 * Group Multi-Signature Account Tests
 *
 * Tests for group identifier creation and partial signing coordination
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GroupAccountBuilder } from '../../src/app/dsl/builders/group-account';
import { Counselor } from '../../src/app/counselor';
import { MemoryGroupEscrow } from '../../src/app/memory-group-escrow';
import type { ExchangeMessage } from '../../src/app/group-account';

describe('GroupAccount', () => {
  let builder: GroupAccountBuilder;
  let escrow: MemoryGroupEscrow;
  let counselor: Counselor;

  beforeEach(() => {
    escrow = new MemoryGroupEscrow();
    counselor = new Counselor({ escrow });
    builder = new GroupAccountBuilder(counselor);
  });

  describe('Group Inception', () => {
    test('creates 2-of-3 multi-sig group', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob', 'Carol'])
        .localMember('Alice')
        .threshold('2')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
          ],
          ndigs: [
            'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
            'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
            'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
          ],
        });

      expect(group.smids).toEqual(['Alice', 'Bob', 'Carol']);
      expect(group.mhab).toBe('Alice');
      expect(group.kt).toBe('2');
      expect(group.k).toHaveLength(3);
      expect(group.sn).toBe(0);
      expect(event.ked.t).toBe('icp');
    });

    test('creates group with weighted thresholds', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob', 'Carol'])
        .localMember('Bob')
        .threshold(['1/2', '1/2', '1/2'])
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
          ],
          ndigs: [
            'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
            'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
            'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
          ],
        });

      expect(group.kt).toEqual(['1/2', '1/2', '1/2']);
      expect(event.ked.kt).toEqual(['1/2', '1/2', '1/2']);
    });

    test('creates group with witnesses', async () => {
      const { group } = await builder
        .group()
        .members(['Alice', 'Bob'])
        .localMember('Alice')
        .withWitnesses(['WitnessA', 'WitnessB'], 2)
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          ],
          ndigs: [
            'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
            'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
          ],
        });

      expect(group.b).toEqual(['WitnessA', 'WitnessB']);
      expect(group.bt).toBe('2');
    });

    test('creates delegated group', async () => {
      const { group } = await builder
        .group()
        .members(['Alice', 'Bob'])
        .localMember('Alice')
        .delegatedBy('EParentIdentifier123...')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          ],
          ndigs: [
            'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
            'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
          ],
        });

      expect(group.delpre).toBe('EParentIdentifier123...');
    });

    test('throws error if members not specified', async () => {
      expect(async () => {
        await builder.group().localMember('Alice').incept({
          keys: ['DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK'],
          ndigs: ['EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ'],
        });
      }).toThrow('Group members are required');
    });

    test('throws error if local member not specified', async () => {
      expect(async () => {
        await builder
          .group()
          .members(['Alice', 'Bob'])
          .incept({
            keys: [
              'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
              'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            ],
            ndigs: [
              'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
              'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
            ],
          });
      }).toThrow('Local member identifier is required');
    });
  });

  describe('Partial Signing Coordination', () => {
    test('collects signatures from group members', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob', 'Carol'])
        .localMember('Alice')
        .threshold('2')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
          ],
          ndigs: [],
        });

      // Alice signs
      const msg1: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: {
            d: event.said,
            raw: event.raw,
          },
          s: ['0BSignatureFromAlice...'],
        },
        i: 'Alice',
        dt: new Date().toISOString(),
      };

      const state1 = await counselor.processExchangeMessage(msg1, group);
      expect(state1.stage).toBe('collecting');
      expect(state1.event.sigs.size).toBe(1);

      // Bob signs - should reach threshold
      const msg2: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: {
            d: event.said,
            raw: event.raw,
          },
          s: ['0BSignatureFromBob...'],
        },
        i: 'Bob',
        dt: new Date().toISOString(),
      };

      const state2 = await counselor.processExchangeMessage(msg2, group);
      expect(state2.stage).toBe('completed');
      expect(state2.event.sigs.size).toBe(2);

      // Verify event is in completed escrow
      const completed = await escrow.getCompleted(event.said);
      expect(completed).toBeDefined();
      expect(completed?.sigs.size).toBe(2);
    });

    test('handles partial signing with witnesses', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob'])
        .localMember('Alice')
        .threshold('2')
        .withWitnesses(['WitnessA', 'WitnessB'], 2)
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          ],
          ndigs: [],
        });

      // Both members sign
      const msg1: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: { d: event.said, raw: event.raw },
          s: ['0BSignatureFromAlice...'],
        },
        i: 'Alice',
        dt: new Date().toISOString(),
      };

      const msg2: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: { d: event.said, raw: event.raw },
          s: ['0BSignatureFromBob...'],
        },
        i: 'Bob',
        dt: new Date().toISOString(),
      };

      let state = await counselor.processExchangeMessage(msg1, group);
      state = await counselor.processExchangeMessage(msg2, group);

      // Should move to witnessing stage
      expect(state.stage).toBe('witnessing');

      // Get partial event from witness escrow
      const partial = await escrow.getPartialWitness(event.said);
      expect(partial).toBeDefined();

      // Add witness receipts
      state = await counselor.processPartialWitnessEscrow(
        partial!,
        group,
        { witness: 'WitnessA', signature: '0BReceiptA...' }
      );
      expect(state.stage).toBe('witnessing');

      state = await counselor.processPartialWitnessEscrow(
        state.event,
        group,
        { witness: 'WitnessB', signature: '0BReceiptB...' }
      );
      expect(state.stage).toBe('completed');
      expect(state.event.receipts?.size).toBe(2);
    });

    test('handles delegated group coordination', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob'])
        .localMember('Alice')
        .threshold('2')
        .delegatedBy('EParentIdentifier...')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          ],
          ndigs: [],
        });

      // Both members sign
      const msg1: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: { d: event.said, raw: event.raw },
          s: ['0BSignatureFromAlice...'],
        },
        i: 'Alice',
        dt: new Date().toISOString(),
      };

      const msg2: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: { d: event.said, raw: event.raw },
          s: ['0BSignatureFromBob...'],
        },
        i: 'Bob',
        dt: new Date().toISOString(),
      };

      let state = await counselor.processExchangeMessage(msg1, group);
      state = await counselor.processExchangeMessage(msg2, group);

      // Should move to delegating stage
      expect(state.stage).toBe('delegating');
      expect(state.stage === 'delegating' && state.anchor).toBe(
        'EParentIdentifier...'
      );

      // Get partial event from delegatee escrow
      const partial = await escrow.getDelegatee(event.said);
      expect(partial).toBeDefined();

      // Process with delegator approval
      state = await counselor.processDelegateEscrow(
        partial!,
        group,
        '0BDelegatorApproval...'
      );
      expect(state.stage).toBe('completed');
    });
  });

  describe('Group Rotation', () => {
    test('rotates group keys', async () => {
      const { group: group1, event: event1 } = await builder
        .group()
        .members(['Alice', 'Bob', 'Carol'])
        .localMember('Alice')
        .threshold('2')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
          ],
          ndigs: [
            'EO2TlKHBKRlaDy-JQyb8z5iNbqmQZZ0xkPrVzs5WuCdQ',
            'EBkrFrXEZFQNvfE8Ej4eJVnTg7Bvk3d3YGXRY8y0WVPE',
            'EGl7WXEDfm4pTXvN0lePvXrQX6c3M3EYXU8kEWWN6Flk',
          ],
        });

      // Rotate to next keys
      const { group: group2, event: event2 } = await builder
        .group()
        .members(['Alice', 'Bob', 'Carol'])
        .localMember('Alice')
        .threshold('2')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
            'DNvYeGmjC8HMGFo8e2xCqVCmXJJJhqB6j3q9yNTjzrGE',
          ],
          ndigs: [
            'ENewDig1...',
            'ENewDig2...',
            'ENewDig3...',
          ],
        });

      expect(group2.sn).toBe(0);
      expect(event2.ked.s).toBe('0');
    });
  });

  describe('Escrow Cleanup', () => {
    test('cleans up expired escrow events', async () => {
      const { group, event } = await builder
        .group()
        .members(['Alice', 'Bob'])
        .localMember('Alice')
        .threshold('2')
        .incept({
          keys: [
            'DKbM0N2cdCR7M5BpGhU8z1GRSrgPLs4dZP0IiHHEfhiK',
            'DCUELUv7MbF5Dv2fHqQfvfVdMRi-XjxVN_0hgDZ3a6K0',
          ],
          ndigs: [],
        });

      // Alice signs but Bob never signs
      const msg: ExchangeMessage = {
        t: 'exn',
        r: '/multisig/icp',
        a: {
          e: { d: event.said, raw: event.raw },
          s: ['0BSignatureFromAlice...'],
        },
        i: 'Alice',
        dt: new Date().toISOString(),
      };

      await counselor.processExchangeMessage(msg, group);

      // Verify event is in escrow
      let partial = await escrow.getPartialSigned(event.said);
      expect(partial).toBeDefined();

      // Fast-forward time and cleanup
      const counselorWithShortTimeout = new Counselor({
        escrow,
        timeout: 100, // 100ms timeout
      });

      await new Promise((resolve) => setTimeout(resolve, 150));
      await counselorWithShortTimeout.cleanupExpired();

      // Verify event was removed
      partial = await escrow.getPartialSigned(event.said);
      expect(partial).toBeNull();
    });
  });
});
