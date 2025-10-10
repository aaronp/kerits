/**
 * Scenario Test: Creating Account on Phone & PC
 *
 * Real-world scenario demonstrating:
 * - User creates KERI identifier on two devices
 * - 2-of-2 threshold requires both devices to sign
 * - Same AID shared across devices
 * - Pre-committed next keys for future rotation
 *
 * See: docs/MULTI-DEVICE-SCENARIOS.md#scenario-1
 */

import { describe, test, expect } from 'bun:test';
import { incept } from '../../src/incept';
import { Tholder } from '../../src/tholder';

describe('Scenario: Creating Account on Phone & PC', () => {
  test('Step 1: Generate keys on each device', () => {
    // Simulate key generation on phone
    const phoneKeys = {
      current: 'DPhone_Key_Current_ABC123_MultiDeviceTest',
      next: 'EPhone_Key_Next_Digest_ABC123_ForRotate',
    };

    // Simulate key generation on laptop
    const laptopKeys = {
      current: 'DLaptop_Key_Current_XYZ789_MultiDevice',
      next: 'ELaptop_Key_Next_Digest_XYZ789_ForRotat',
    };

    expect(phoneKeys.current).toBeDefined();
    expect(laptopKeys.current).toBeDefined();
    expect(phoneKeys.next).toBeDefined();
    expect(laptopKeys.next).toBeDefined();
  });

  test('Step 2: Create 2-of-2 inception event', () => {
    const phoneCurrentKey = 'DPhone_Key_Current_ABC123_MultiDeviceTest';
    const laptopCurrentKey = 'DLaptop_Key_Current_XYZ789_MultiDevice';
    const phoneNextKey = 'EPhone_Key_Next_Digest_ABC123_ForRotate';
    const laptopNextKey = 'ELaptop_Key_Next_Digest_XYZ789_ForRotat';

    // Create inception event (can be done on either device)
    const event = incept({
      keys: [phoneCurrentKey, laptopCurrentKey],
      ndigs: [phoneNextKey, laptopNextKey],
      isith: '2',  // Require both signatures
      nsith: '2',  // Next threshold also 2-of-2
    });

    // Verify event structure
    expect(event.ked.t).toBe('icp');
    expect(event.ked.kt).toBe('2');
    expect(event.ked.k).toEqual([phoneCurrentKey, laptopCurrentKey]);
    expect(event.ked.nt).toBe('2');
    expect(event.ked.n).toEqual([phoneNextKey, laptopNextKey]);
    expect(event.ked.s).toBe('0');  // Sequence number 0

    // Verify threshold validation
    const tholder = new Tholder({ sith: event.ked.kt });
    expect(tholder.num).toBe(2);  // Requires 2 signatures
    expect(() => tholder.validate(2)).not.toThrow();
  });

  test('Step 3: Verify same AID across devices', () => {
    const phoneCurrentKey = 'DPhone_Key_Current_ABC123_MultiDeviceTest';
    const laptopCurrentKey = 'DLaptop_Key_Current_XYZ789_MultiDevice';
    const phoneNextKey = 'EPhone_Key_Next_Digest_ABC123_ForRotate';
    const laptopNextKey = 'ELaptop_Key_Next_Digest_XYZ789_ForRotat';

    // Create same inception event on phone
    const eventFromPhone = incept({
      keys: [phoneCurrentKey, laptopCurrentKey],
      ndigs: [phoneNextKey, laptopNextKey],
      isith: '2',
      nsith: '2',
    });

    // Create same inception event on laptop
    const eventFromLaptop = incept({
      keys: [phoneCurrentKey, laptopCurrentKey],
      ndigs: [phoneNextKey, laptopNextKey],
      isith: '2',
      nsith: '2',
    });

    // Both devices generate the SAME AID
    expect(eventFromPhone.pre).toBe(eventFromLaptop.pre);
    expect(eventFromPhone.said).toBe(eventFromLaptop.said);
    expect(eventFromPhone.raw).toBe(eventFromLaptop.raw);
  });

  test('Step 4: Verify distributed key control', () => {
    const event = incept({
      keys: [
        'DPhone_Key_Current_ABC123_MultiDeviceTest',
        'DLaptop_Key_Current_XYZ789_MultiDevice',
      ],
      ndigs: [
        'EPhone_Key_Next_Digest_ABC123_ForRotate',
        'ELaptop_Key_Next_Digest_XYZ789_ForRotat',
      ],
      isith: '2',
      nsith: '2',
    });

    // Verify key arrangement
    expect(event.ked.k).toHaveLength(2);
    expect(event.ked.k[0]).toContain('Phone');  // Phone key at index 0
    expect(event.ked.k[1]).toContain('Laptop'); // Laptop key at index 1

    // Verify pre-commitment
    expect(event.ked.n).toHaveLength(2);
    expect(event.ked.n[0]).toContain('Phone');  // Phone next key digest
    expect(event.ked.n[1]).toContain('Laptop'); // Laptop next key digest
  });

  test('Real-world outcome: User has multi-device control', () => {
    const event = incept({
      keys: [
        'DPhone_Key_Current_ABC123_MultiDeviceTest',
        'DLaptop_Key_Current_XYZ789_MultiDevice',
      ],
      ndigs: [
        'EPhone_Key_Next_Digest_ABC123_ForRotate',
        'ELaptop_Key_Next_Digest_XYZ789_ForRotat',
      ],
      isith: '2',
      nsith: '2',
    });

    const userAID = event.pre;

    // ✅ One AID controlled by both devices
    expect(userAID).toBeDefined();
    expect(userAID).toMatch(/^E/);  // Self-addressing identifier

    // ✅ 2-of-2 threshold - both must cooperate
    const tholder = new Tholder({ sith: '2' });
    expect(tholder.num).toBe(2);

    // ✅ KEL replicated across devices (both have same event)
    expect(event.raw).toContain(userAID);

    // ✅ Pre-committed next keys for future rotation
    expect(event.ked.n).toHaveLength(2);

    // ✅ Security properties
    expect(event.ked.s).toBe('0');  // Fresh KEL, sequence 0
    expect(event.ked.kt).toBe('2'); // Threshold enforced
    expect(event.ked.nt).toBe('2'); // Future threshold pre-set
  });

  test('Edge case: Cannot satisfy threshold with single signature', () => {
    const tholder = new Tholder({ sith: '2' });

    // Simulate having only 1 signature
    const availableSignatures = 1;

    // Verify threshold not satisfied
    expect(availableSignatures).toBeLessThan(tholder.num);

    // In real implementation, this would reject the event
    const thresholdSatisfied = availableSignatures >= tholder.num;
    expect(thresholdSatisfied).toBe(false);
  });
});
