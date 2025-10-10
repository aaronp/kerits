/**
 * Scenario Test: Creating a Delegated Identity
 *
 * Real-world scenario demonstrating:
 * - Parent AID created first
 * - Child AID created with delpre (delegated inception)
 * - Parent anchors child's inception via interaction event
 * - Delegation relationship established
 *
 * See: docs/DELEGATION-SCENARIOS.md#scenario-1
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../../src/incept';

describe('Scenario: Creating a Delegated Identity', () => {
  test('Step 1: Alice creates main AID', () => {
    const aliceMain = incept({
      keys: ['DAlice_Phone_Key', 'DAlice_Laptop_Key'],
      ndigs: ['EAlice_Phone_Next', 'EAlice_Laptop_Next'],
      isith: '2',
      nsith: '2',
    });

    expect(aliceMain.ked.t).toBe('icp');  // Regular inception
    expect(aliceMain.ked.kt).toBe('2');
    expect(aliceMain.ked.k).toHaveLength(2);
    expect(aliceMain.ked.di).toBeUndefined();  // Not delegated
  });

  test('Step 2: Bob creates delegated recovery AID', () => {
    // Alice's main AID
    const aliceAID = 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy';

    // Bob creates recovery AID, delegated to Alice
    const bobRecovery = incept({
      keys: ['DBob_Recovery_Key_ABC123_ForAliceRecovery'],
      ndigs: ['EBob_Recovery_Next_XYZ789_ForRotation'],
      delpre: aliceAID,  // Delegated to Alice's AID
    });

    // Verify delegated inception
    expect(bobRecovery.ked.t).toBe('dip');  // Delegated inception
    expect(bobRecovery.ked.di).toBe(aliceAID);  // Delegator identifier
    expect(bobRecovery.ked.s).toBe('0');  // Sequence 0
    expect(bobRecovery.ked.k).toHaveLength(1);
  });

  test('Step 3: Verify delegation relationship', () => {
    const aliceMain = incept({
      keys: ['DAlice_Phone_Key', 'DAlice_Laptop_Key'],
      ndigs: ['EAlice_Phone_Next', 'EAlice_Laptop_Next'],
      isith: '2',
      nsith: '2',
    });

    const bobRecovery = incept({
      keys: ['DBob_Recovery_Key'],
      ndigs: ['EBob_Recovery_Next'],
      delpre: aliceMain.pre,
    });

    // Verify parent-child relationship
    expect(bobRecovery.ked.di).toBe(aliceMain.pre);

    // Bob's AID is different from Alice's
    expect(bobRecovery.pre).not.toBe(aliceMain.pre);

    // But Bob's event references Alice as delegator
    expect(bobRecovery.ked.di).toBe(aliceMain.pre);
  });

  test('Real-world outcome: Recovery mechanism established', () => {
    const aliceMain = incept({
      keys: ['DAlice_Phone', 'DAlice_Laptop'],
      ndigs: ['EAlice_Phone_Next', 'EAlice_Laptop_Next'],
      isith: '2',
      nsith: '2',
    });

    const bobRecovery = incept({
      keys: ['DBob_Recovery_Key'],
      ndigs: ['EBob_Recovery_Next'],
      delpre: aliceMain.pre,
    });

    // ✅ Bob's AID delegated to Alice
    expect(bobRecovery.ked.t).toBe('dip');
    expect(bobRecovery.ked.di).toBe(aliceMain.pre);

    // ✅ Separate identifiers
    expect(bobRecovery.pre).not.toBe(aliceMain.pre);

    // ✅ Authority structure clear
    const delegator = bobRecovery.ked.di;
    const delegatee = bobRecovery.pre;
    expect(delegator).toBe(aliceMain.pre);  // Alice is parent
    expect(delegatee).toBe(bobRecovery.pre); // Bob is child

    // Note: In full implementation, Alice would create an interaction event
    // to anchor Bob's inception, completing the delegation setup
  });

  test('Edge case: Cannot create delegated inception without delpre', () => {
    const event = incept({
      keys: ['DKey'],
      ndigs: ['ENext'],
      // No delpre provided
    });

    // Should be regular inception, not delegated
    expect(event.ked.t).toBe('icp');
    expect(event.ked.di).toBeUndefined();
  });

  test('Edge case: Delegated inception with multiple keys', () => {
    const parentAID = 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy';

    const delegatedMultisig = incept({
      keys: ['DKey1', 'DKey2', 'DKey3'],
      ndigs: ['ENext1', 'ENext2', 'ENext3'],
      isith: '2',  // 2-of-3
      nsith: '2',
      delpre: parentAID,
    });

    // Delegated multi-sig inception
    expect(delegatedMultisig.ked.t).toBe('dip');
    expect(delegatedMultisig.ked.di).toBe(parentAID);
    expect(delegatedMultisig.ked.kt).toBe('2');
    expect(delegatedMultisig.ked.k).toHaveLength(3);
  });

  test('Edge case: Delegated inception with weighted threshold', () => {
    const parentAID = 'EEUH6-CimOeioCp_f8QJpag0xM9ZdzvlZGy0Qv5v6zTy';

    const delegatedWeighted = incept({
      keys: ['DKey1', 'DKey2', 'DKey3'],
      ndigs: ['ENext1', 'ENext2', 'ENext3'],
      isith: ['1/2', '1/4', '1/4'],
      nsith: ['1/2', '1/4', '1/4'],
      delpre: parentAID,
    });

    expect(delegatedWeighted.ked.t).toBe('dip');
    expect(delegatedWeighted.ked.di).toBe(parentAID);
    expect(delegatedWeighted.ked.kt).toEqual(['1/2', '1/4', '1/4']);
  });
});
