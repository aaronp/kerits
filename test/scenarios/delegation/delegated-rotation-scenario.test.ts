/**
 * Scenario Test: Delegated Key Rotation
 *
 * Real-world scenario demonstrating:
 * - Child rotates keys on delegated AID
 * - Rotation event type is 'drt' (delegated rotation)
 * - Delegation relationship maintained after rotation
 * - Parent must anchor rotation for it to be valid
 *
 * See: docs/DELEGATION-SCENARIOS.md#scenario-3
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../../src/incept';
import { rotate } from '../../../src/rotate';

describe('Scenario: Delegated Key Rotation', () => {
  test('Step 1: Setup - Create parent and delegated child', () => {
    const parent = incept({
      keys: ['DParent_Key'],
      ndigs: ['EParent_Next'],
    });

    const child = incept({
      keys: ['DChild_Key_0'],
      ndigs: ['EChild_Key_1_Digest'],
      delpre: parent.pre,
    });

    expect(parent.ked.t).toBe('icp');
    expect(child.ked.t).toBe('dip');
    expect(child.ked.di).toBe(parent.pre);
  });

  test('Step 2: Child creates delegated rotation event', () => {
    const parent = incept({
      keys: ['DParent_Key'],
      ndigs: ['EParent_Next'],
    });

    const childInception = incept({
      keys: ['DChild_Key_0'],
      ndigs: ['EChild_Key_1_Hash'],
      delpre: parent.pre,
    });

    // Child rotates to pre-committed key
    const childRotation = rotate({
      pre: childInception.pre,
      keys: ['DChild_Key_1_Rotated'],
      dig: childInception.said,
      sn: 1,
      ndigs: ['EChild_Key_2_Hash'],
      delpre: parent.pre,  // Still delegated to parent
    });

    // Verify delegated rotation
    expect(childRotation.ked.t).toBe('drt');  // Delegated rotation
    expect(childRotation.ked.di).toBe(parent.pre);
    expect(childRotation.ked.s).toBe('1');
    expect(childRotation.ked.p).toBe(childInception.said);
  });

  test('Step 3: Verify delegation maintained after rotation', () => {
    const parent = incept({
      keys: ['DParent'],
      ndigs: ['EParent_Next'],
    });

    const childInception = incept({
      keys: ['DChild_0'],
      ndigs: ['EChild_1'],
      delpre: parent.pre,
    });

    const childRotation = rotate({
      pre: childInception.pre,
      keys: ['DChild_1'],
      dig: childInception.said,
      sn: 1,
      ndigs: ['EChild_2'],
      delpre: parent.pre,
    });

    // Delegation identifier consistent
    expect(childInception.ked.di).toBe(parent.pre);
    expect(childRotation.ked.di).toBe(parent.pre);

    // Same child AID throughout
    expect(childRotation.ked.i).toBe(childInception.pre);
  });

  test('Real-world outcome: Keys rotated with delegation intact', () => {
    const parent = incept({
      keys: ['DParent_Alice_Main'],
      ndigs: ['EParent_Alice_Next'],
    });

    const bobRecoveryInception = incept({
      keys: ['DBob_Old_Recovery_Key'],
      ndigs: ['EBob_New_Recovery_Key_Hash'],
      delpre: parent.pre,
    });

    // Bob rotates his recovery AID keys
    const bobRecoveryRotation = rotate({
      pre: bobRecoveryInception.pre,
      keys: ['DBob_New_Recovery_Key'],
      dig: bobRecoveryInception.said,
      sn: 1,
      ndigs: ['EBob_Future_Recovery_Key_Hash'],
      delpre: parent.pre,
    });

    // ✅ Bob rotated keys
    expect(bobRecoveryRotation.ked.k).toContain('DBob_New_Recovery_Key');
    expect(bobRecoveryRotation.ked.k).not.toContain('DBob_Old_Recovery_Key');

    // ✅ Delegation maintained
    expect(bobRecoveryRotation.ked.di).toBe(parent.pre);
    expect(bobRecoveryRotation.ked.t).toBe('drt');

    // ✅ KEL continuity
    expect(bobRecoveryRotation.ked.i).toBe(bobRecoveryInception.pre);
    expect(bobRecoveryRotation.ked.s).toBe('1');
    expect(bobRecoveryRotation.ked.p).toBe(bobRecoveryInception.said);

    // Note: In full implementation, parent would need to anchor this rotation
  });

  test('Multiple rotations maintain delegation', () => {
    const parent = incept({
      keys: ['DParent'],
      ndigs: ['EParent_Next'],
    });

    const childInception = incept({
      keys: ['DChild_0'],
      ndigs: ['EChild_1'],
      delpre: parent.pre,
    });

    const rotation1 = rotate({
      pre: childInception.pre,
      keys: ['DChild_1'],
      dig: childInception.said,
      sn: 1,
      ndigs: ['EChild_2'],
      delpre: parent.pre,
    });

    const rotation2 = rotate({
      pre: childInception.pre,
      keys: ['DChild_2'],
      dig: rotation1.said,
      sn: 2,
      ndigs: ['EChild_3'],
      delpre: parent.pre,
    });

    // All events delegated to same parent
    expect(childInception.ked.di).toBe(parent.pre);
    expect(rotation1.ked.di).toBe(parent.pre);
    expect(rotation2.ked.di).toBe(parent.pre);

    // Event types correct
    expect(childInception.ked.t).toBe('dip');
    expect(rotation1.ked.t).toBe('drt');
    expect(rotation2.ked.t).toBe('drt');

    // KEL chain intact
    expect(rotation1.ked.p).toBe(childInception.said);
    expect(rotation2.ked.p).toBe(rotation1.said);
  });

  test('Edge case: Cannot rotate without delpre if originally delegated', () => {
    const parent = incept({
      keys: ['DParent'],
      ndigs: ['EParent_Next'],
    });

    const childInception = incept({
      keys: ['DChild_0'],
      ndigs: ['EChild_1'],
      delpre: parent.pre,  // Delegated
    });

    // Rotation without delpre would be invalid
    // (This would create regular rotation, breaking delegation)
    const invalidRotation = rotate({
      pre: childInception.pre,
      keys: ['DChild_1'],
      dig: childInception.said,
      sn: 1,
      ndigs: ['EChild_2'],
      // No delpre - breaks delegation
    });

    // Event created, but would fail validation
    expect(invalidRotation.ked.t).toBe('rot');  // Regular rotation, not drt
    expect(invalidRotation.ked.di).toBeUndefined();

    // In real validation, this would be rejected because:
    // - Child started as delegated (dip)
    // - Can't switch to non-delegated (rot)
  });

  test('Edge case: Delegated rotation with threshold change', () => {
    const parent = incept({
      keys: ['DParent'],
      ndigs: ['EParent_Next'],
    });

    const childInception = incept({
      keys: ['DChild_0', 'DChild_1', 'DChild_2'],
      ndigs: ['EChild_Next_0', 'EChild_Next_1', 'EChild_Next_2'],
      isith: '2',  // 2-of-3
      nsith: '2',
      delpre: parent.pre,
    });

    // Rotate with threshold change
    const childRotation = rotate({
      pre: childInception.pre,
      keys: ['DChild_New_0', 'DChild_New_1', 'DChild_New_2'],
      dig: childInception.said,
      sn: 1,
      isith: '3',  // Now 3-of-3 (more restrictive)
      ndigs: ['EChild_Future_0', 'EChild_Future_1', 'EChild_Future_2'],
      nsith: '3',
      delpre: parent.pre,
    });

    expect(childRotation.ked.t).toBe('drt');
    expect(childRotation.ked.di).toBe(parent.pre);
    expect(childRotation.ked.kt).toBe('3');  // Threshold changed
  });
});
