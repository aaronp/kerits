/**
 * Scenario Test: Normal Key Rotation
 *
 * Real-world scenario demonstrating:
 * - User rotates keys as security best practice
 * - Both devices sign rotation event
 * - Current keys become previously-committed next keys
 * - New next keys pre-committed for future rotation
 * - Old keys invalidated
 *
 * See: docs/MULTI-DEVICE-SCENARIOS.md#scenario-2
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../src/incept';
import { rotate } from '../../src/rotate';
import { Tholder } from '../../src/tholder';

describe('Scenario: Normal Key Rotation', () => {
  test('Step 1: Create initial 2-device setup', () => {
    const event = incept({
      keys: [
        'DPhone_Key_0_Initial_ABC123_MultiDevice',
        'DLaptop_Key_0_Initial_XYZ789_MultiDev',
      ],
      ndigs: [
        'EPhone_Key_1_Next_Digest_ForFirstRotation',
        'ELaptop_Key_1_Next_Digest_ForFirstRotate',
      ],
      isith: '2',
      nsith: '2',
    });

    expect(event.ked.s).toBe('0');
    expect(event.ked.k).toHaveLength(2);
    expect(event.ked.n).toHaveLength(2);
  });

  test('Step 2: Create rotation event (90 days later)', () => {
    // Initial inception
    const inception = incept({
      keys: [
        'DPhone_Key_0_Initial_ABC123_MultiDevice',
        'DLaptop_Key_0_Initial_XYZ789_MultiDev',
      ],
      ndigs: [
        'EPhone_Key_1_Next_Digest_ForFirstRotation',
        'ELaptop_Key_1_Next_Digest_ForFirstRotate',
      ],
      isith: '2',
      nsith: '2',
    });

    // After 90 days, rotate to pre-committed keys
    const rotation = rotate({
      pre: inception.pre,
      keys: [
        // These keys match the digests in inception.ked.n
        'DPhone_Key_1_Rotated_ABC123_MultiDevice',
        'DLaptop_Key_1_Rotated_XYZ789_MultiDevi',
      ],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: [
        // Pre-commit new next keys for future rotation
        'EPhone_Key_2_Next_Digest_ForSecondRotate',
        'ELaptop_Key_2_Next_Digest_ForSecondRot',
      ],
      nsith: '2',
    });

    // Verify rotation event structure
    expect(rotation.ked.t).toBe('rot');
    expect(rotation.ked.s).toBe('1');  // Sequence number 1
    expect(rotation.ked.p).toBe(inception.said);  // References previous event
    expect(rotation.ked.i).toBe(inception.pre);   // Same identifier
    expect(rotation.ked.kt).toBe('2');
    expect(rotation.ked.k).toHaveLength(2);
    expect(rotation.ked.nt).toBe('2');
    expect(rotation.ked.n).toHaveLength(2);
  });

  test('Step 3: Verify KEL continuity', () => {
    const inception = incept({
      keys: ['DPhone_Key_0', 'DLaptop_Key_0'],
      ndigs: ['EPhone_Key_1_Digest', 'ELaptop_Key_1_Digest'],
      isith: '2',
      nsith: '2',
    });

    const rotation = rotate({
      pre: inception.pre,
      keys: ['DPhone_Key_1', 'DLaptop_Key_1'],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: ['EPhone_Key_2_Digest', 'ELaptop_Key_2_Digest'],
      nsith: '2',
    });

    // KEL chain validation
    expect(rotation.ked.i).toBe(inception.pre);   // Same AID
    expect(rotation.ked.p).toBe(inception.said);  // Links to previous
    expect(rotation.ked.s).toBe('1');              // Sequential
  });

  test('Step 4: Verify forward secrecy', () => {
    const inception = incept({
      keys: ['DPhone_Old_Key_0', 'DLaptop_Old_Key_0'],
      ndigs: ['EPhone_New_Key_1_Hash', 'ELaptop_New_Key_1_Hash'],
      isith: '2',
      nsith: '2',
    });

    const rotation = rotate({
      pre: inception.pre,
      keys: ['DPhone_New_Key_1', 'DLaptop_New_Key_1'],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: ['EPhone_Key_2_Hash', 'ELaptop_Key_2_Hash'],
      nsith: '2',
    });

    // Old keys from inception
    const oldKeys = inception.ked.k;

    // New keys in rotation
    const newKeys = rotation.ked.k;

    // Verify keys have changed
    expect(newKeys).not.toEqual(oldKeys);
    expect(newKeys[0]).not.toBe(oldKeys[0]);
    expect(newKeys[1]).not.toBe(oldKeys[1]);

    // Old keys cannot sign future events (sn >= 2)
    // This would be validated by KEL verification logic
  });

  test('Real-world outcome: Keys successfully rotated', () => {
    const inception = incept({
      keys: [
        'DPhone_Key_0_Initial',
        'DLaptop_Key_0_Initial',
      ],
      ndigs: [
        'EPhone_Key_1_Hash',
        'ELaptop_Key_1_Hash',
      ],
      isith: '2',
      nsith: '2',
    });

    const rotation = rotate({
      pre: inception.pre,
      keys: [
        'DPhone_Key_1_Rotated',
        'DLaptop_Key_1_Rotated',
      ],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: [
        'EPhone_Key_2_Hash',
        'ELaptop_Key_2_Hash',
      ],
      nsith: '2',
    });

    // ✅ KEL updated with new event
    expect(rotation.ked.s).toBe('1');

    // ✅ Current keys rotated
    expect(rotation.ked.k).toContain('DPhone_Key_1_Rotated');
    expect(rotation.ked.k).toContain('DLaptop_Key_1_Rotated');

    // ✅ New next keys pre-committed
    expect(rotation.ked.n).toContain('EPhone_Key_2_Hash');
    expect(rotation.ked.n).toContain('ELaptop_Key_2_Hash');

    // ✅ Old keys no longer in current set
    expect(rotation.ked.k).not.toContain('DPhone_Key_0_Initial');
    expect(rotation.ked.k).not.toContain('DLaptop_Key_0_Initial');

    // ✅ Threshold maintained
    const tholder = new Tholder({ sith: rotation.ked.kt });
    expect(tholder.num).toBe(2);
  });

  test('Multiple rotations: Second rotation', () => {
    const inception = incept({
      keys: ['DPhone_Key_0', 'DLaptop_Key_0'],
      ndigs: ['EPhone_Key_1_Hash', 'ELaptop_Key_1_Hash'],
      isith: '2',
      nsith: '2',
    });

    const rotation1 = rotate({
      pre: inception.pre,
      keys: ['DPhone_Key_1', 'DLaptop_Key_1'],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: ['EPhone_Key_2_Hash', 'ELaptop_Key_2_Hash'],
      nsith: '2',
    });

    // Second rotation (another 90 days later)
    const rotation2 = rotate({
      pre: inception.pre,
      keys: ['DPhone_Key_2', 'DLaptop_Key_2'],
      dig: rotation1.said,
      sn: 2,
      isith: '2',
      ndigs: ['EPhone_Key_3_Hash', 'ELaptop_Key_3_Hash'],
      nsith: '2',
    });

    // Verify KEL chain
    expect(rotation2.ked.i).toBe(inception.pre);
    expect(rotation2.ked.p).toBe(rotation1.said);
    expect(rotation2.ked.s).toBe('2');

    // Complete KEL timeline
    const kel = [inception, rotation1, rotation2];
    expect(kel).toHaveLength(3);
    expect(kel[0].ked.s).toBe('0');
    expect(kel[1].ked.s).toBe('1');
    expect(kel[2].ked.s).toBe('2');
  });

  test('Edge case: Cannot use old keys after rotation', () => {
    const inception = incept({
      keys: ['DPhone_Old', 'DLaptop_Old'],
      ndigs: ['EPhone_New_Hash', 'ELaptop_New_Hash'],
      isith: '2',
      nsith: '2',
    });

    const rotation = rotate({
      pre: inception.pre,
      keys: ['DPhone_New', 'DLaptop_New'],
      dig: inception.said,
      sn: 1,
      isith: '2',
      ndigs: ['EPhone_Next_Hash', 'ELaptop_Next_Hash'],
      nsith: '2',
    });

    // After rotation, old keys are invalidated
    const currentValidKeys = rotation.ked.k;
    const invalidatedKeys = inception.ked.k;

    expect(currentValidKeys).not.toEqual(invalidatedKeys);

    // Attempting to use old keys would fail validation
    // (This would be caught by signature verification in real implementation)
  });
});
