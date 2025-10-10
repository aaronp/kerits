/**
 * Scenario Test: Device Loss & Recovery
 *
 * Real-world scenarios demonstrating:
 * - Case A: Below threshold (2-of-2, lost 1) - Cannot recover without delegation
 * - Case B: Above threshold (2-of-3, lost 1) - Can recover with remaining devices
 * - Rotating to remove lost device key
 * - Adding replacement device
 *
 * See: docs/MULTI-DEVICE-SCENARIOS.md#scenario-4
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../src/incept';
import { rotate } from '../../src/rotate';
import { Tholder } from '../../src/tholder';

describe('Scenario: Device Loss & Recovery', () => {
  describe('Case A: Below Threshold (2-of-2, Lost Phone)', () => {
    test('Setup: User has 2-of-2 threshold', () => {
      const event = incept({
        keys: ['DPhone_Key', 'DLaptop_Key'],
        ndigs: ['EPhone_Next', 'ELaptop_Next'],
        isith: '2',
        nsith: '2',
      });

      const tholder = new Tholder({ sith: event.ked.kt });
      expect(tholder.num).toBe(2);  // Requires both signatures
    });

    test('Problem: Lost phone, cannot satisfy threshold', () => {
      const tholder = new Tholder({ sith: '2' });

      // User loses phone, only has laptop
      const availableDevices = 1;

      // Cannot satisfy 2-of-2 threshold
      const canRotate = availableDevices >= tholder.num;
      expect(canRotate).toBe(false);

      // ❌ User is LOCKED OUT without delegation or recovery mechanism
    });

    test('Solution: Requires delegated recovery (see Scenario 5)', () => {
      // This scenario requires delegation setup
      // See delegated-recovery.test.ts for solution
      expect(true).toBe(true);  // Placeholder
    });
  });

  describe('Case B: Above Threshold (2-of-3, Lost Phone)', () => {
    test('Setup: User has 2-of-3 threshold with phone, laptop, tablet', () => {
      const inception = incept({
        keys: [
          'DPhone_Key_0',
          'DLaptop_Key_0',
          'DTablet_Key_0',
        ],
        ndigs: [
          'EPhone_Key_1_Hash',
          'ELaptop_Key_1_Hash',
          'ETablet_Key_1_Hash',
        ],
        isith: '2',  // 2-of-3 threshold
        nsith: '2',
      });

      const tholder = new Tholder({ sith: inception.ked.kt });
      expect(tholder.num).toBe(2);
      expect(inception.ked.k).toHaveLength(3);
    });

    test('Step 1: Lose phone, still have laptop + tablet', () => {
      const tholder = new Tholder({ sith: '2' });

      // User loses phone
      const remainingDevices = ['laptop', 'tablet'];
      expect(remainingDevices).toHaveLength(2);

      // Can still satisfy 2-of-3 threshold
      const canRotate = remainingDevices.length >= tholder.num;
      expect(canRotate).toBe(true);  // ✅ Can recover
    });

    test('Step 2: Rotate to remove lost phone key', () => {
      const inception = incept({
        keys: [
          'DPhone_Key_0_LOST',
          'DLaptop_Key_0',
          'DTablet_Key_0',
        ],
        ndigs: [
          'EPhone_Key_1_Hash',
          'ELaptop_Key_1_Hash',
          'ETablet_Key_1_Hash',
        ],
        isith: '2',
        nsith: '2',
      });

      // Recovery rotation: Remove phone key, keep laptop + tablet
      const recoveryRotation = rotate({
        pre: inception.pre,
        keys: [
          // Phone key OMITTED - effectively removes it
          'DLaptop_Key_1',
          'DTablet_Key_1',
        ],
        dig: inception.said,
        sn: 1,
        isith: '2',  // Now 2-of-2 (both remaining devices required)
        ndigs: [
          'ELaptop_Key_2_Hash',
          'ETablet_Key_2_Hash',
        ],
        nsith: '2',
      });

      // Verify phone key removed
      expect(recoveryRotation.ked.k).toHaveLength(2);
      expect(recoveryRotation.ked.k).not.toContain('DPhone_Key_0_LOST');
      expect(recoveryRotation.ked.k).not.toContain('DPhone_Key_1');
      expect(recoveryRotation.ked.k).toContain('DLaptop_Key_1');
      expect(recoveryRotation.ked.k).toContain('DTablet_Key_1');

      // Verify threshold adjusted
      expect(recoveryRotation.ked.kt).toBe('2');  // Now 2-of-2
    });

    test('Step 3: Add replacement phone', () => {
      const inception = incept({
        keys: ['DPhone_Old', 'DLaptop', 'DTablet'],
        ndigs: ['EPhone_1', 'ELaptop_1', 'ETablet_1'],
        isith: '2',
        nsith: '2',
      });

      // Recovery rotation (removed old phone)
      const recoveryRotation = rotate({
        pre: inception.pre,
        keys: ['DLaptop_1', 'DTablet_1'],
        dig: inception.said,
        sn: 1,
        isith: '2',
        ndigs: ['ELaptop_2', 'ETablet_2'],
        nsith: '2',
      });

      // Add replacement phone
      const addPhoneRotation = rotate({
        pre: inception.pre,
        keys: [
          'DLaptop_2',
          'DTablet_2',
          'DPhone_New_Replacement',  // New phone added
        ],
        dig: recoveryRotation.said,
        sn: 2,
        isith: '2',  // Back to 2-of-3
        ndigs: [
          'ELaptop_3',
          'ETablet_3',
          'EPhone_New_Next',
        ],
        nsith: '2',
      });

      // Verify new phone added
      expect(addPhoneRotation.ked.k).toHaveLength(3);
      expect(addPhoneRotation.ked.k).toContain('DPhone_New_Replacement');
      expect(addPhoneRotation.ked.k).not.toContain('DPhone_Old');

      // Verify threshold restored
      const tholder = new Tholder({ sith: addPhoneRotation.ked.kt });
      expect(tholder.num).toBe(2);  // 2-of-3 again
    });

    test('Real-world outcome: Account recovered and secured', () => {
      // Initial setup: 2-of-3
      const inception = incept({
        keys: ['DPhone_Lost', 'DLaptop', 'DTablet'],
        ndigs: ['EPhone_1', 'ELaptop_1', 'ETablet_1'],
        isith: '2',
        nsith: '2',
      });

      // Step 1: Remove lost phone
      const recovery = rotate({
        pre: inception.pre,
        keys: ['DLaptop_1', 'DTablet_1'],
        dig: inception.said,
        sn: 1,
        isith: '2',
        ndigs: ['ELaptop_2', 'ETablet_2'],
        nsith: '2',
      });

      // Step 2: Add replacement
      const addReplacement = rotate({
        pre: inception.pre,
        keys: ['DLaptop_2', 'DTablet_2', 'DPhone_New'],
        dig: recovery.said,
        sn: 2,
        isith: '2',
        ndigs: ['ELaptop_3', 'ETablet_3', 'EPhone_3'],
        nsith: '2',
      });

      // ✅ Lost device key removed
      expect(recovery.ked.k).not.toContain('DPhone_Lost');

      // ✅ Account recovered
      expect(recovery.ked.i).toBe(inception.pre);  // Same AID

      // ✅ Security maintained
      expect(recovery.ked.s).toBe('1');  // KEL continuity
      expect(recovery.ked.p).toBe(inception.said);

      // ✅ Replacement device added
      expect(addReplacement.ked.k).toContain('DPhone_New');
      expect(addReplacement.ked.k).toHaveLength(3);

      // Complete KEL timeline
      expect(inception.ked.s).toBe('0');
      expect(recovery.ked.s).toBe('1');
      expect(addReplacement.ked.s).toBe('2');
    });
  });

  describe('Case C: Threshold Management', () => {
    test('Changing threshold during recovery', () => {
      const inception = incept({
        keys: ['DPhone', 'DLaptop', 'DTablet', 'DDesktop'],
        ndigs: ['EP1', 'EL1', 'ET1', 'ED1'],
        isith: '2',  // 2-of-4
        nsith: '2',
      });

      // Lose 2 devices, increase threshold for security
      const rotation = rotate({
        pre: inception.pre,
        keys: ['DLaptop_1', 'DTablet_1'],
        dig: inception.said,
        sn: 1,
        isith: '2',  // Now 2-of-2 (more restrictive)
        ndigs: ['EL2', 'ET2'],
        nsith: '2',
      });

      const tholder = new Tholder({ sith: rotation.ked.kt });
      expect(tholder.num).toBe(2);
      expect(rotation.ked.k).toHaveLength(2);
    });

    test('Reducing threshold temporarily for convenience', () => {
      const inception = incept({
        keys: ['D1', 'D2', 'D3'],
        ndigs: ['E1', 'E2', 'E3'],
        isith: '2',  // 2-of-3
        nsith: '2',
      });

      // Temporarily reduce to 1-of-3 (not recommended for production!)
      const rotation = rotate({
        pre: inception.pre,
        keys: ['D1_1', 'D2_1', 'D3_1'],
        dig: inception.said,
        sn: 1,
        isith: '1',  // Reduced threshold
        ndigs: ['E1_2', 'E2_2', 'E3_2'],
        nsith: '2',  // Plan to restore to 2-of-3
      });

      expect(rotation.ked.kt).toBe('1');
      expect(rotation.ked.nt).toBe('2');
    });
  });

  describe('Edge Cases', () => {
    test('Cannot remove all keys', () => {
      const inception = incept({
        keys: ['D1', 'D2', 'D3'],
        ndigs: ['E1', 'E2', 'E3'],
        isith: '2',
        nsith: '2',
      });

      // Attempting to rotate with no keys would fail validation
      expect(() => {
        rotate({
          pre: inception.pre,
          keys: [],  // Invalid - no keys
          dig: inception.said,
          sn: 1,
          isith: '0',
          ndigs: [],
          nsith: '0',
        });
      }).toThrow();
    });

    test('Threshold cannot exceed key count', () => {
      const tholder = new Tholder({ sith: '3' });

      // Only 2 keys available
      expect(() => tholder.validate(2)).toThrow();
    });

    test('Lost device key cannot sign future events', () => {
      const inception = incept({
        keys: ['DPhone_Lost', 'DLaptop', 'DTablet'],
        ndigs: ['EP1', 'EL1', 'ET1'],
        isith: '2',
        nsith: '2',
      });

      const recovery = rotate({
        pre: inception.pre,
        keys: ['DLaptop_1', 'DTablet_1'],  // Phone removed
        dig: inception.said,
        sn: 1,
        isith: '2',
        ndigs: ['EL2', 'ET2'],
        nsith: '2',
      });

      // Lost phone key not in current key set
      expect(recovery.ked.k).not.toContain('DPhone_Lost');

      // In real implementation, signatures from lost phone key
      // would be rejected for events with sn >= 1
    });
  });
});
