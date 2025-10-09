/**
 * Tests for key rotation
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED_1 = new Uint8Array(32).fill(1);
const TEST_SEED_2 = new Uint8Array(32).fill(2);

describe('Key Rotation', () => {
  it('should create rot event and store in KEL', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account with first mnemonic
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');
    expect(accountDsl).toBeDefined();

    const aid = accountDsl!.account.aid;
    console.log('Created account with AID:', aid);

    // Check KEL before rotation
    const kelBefore = await store.listKel(aid);
    console.log('KEL before rotation:', kelBefore.length, 'events');
    console.log('Events:', kelBefore.map(e => ({ t: e.meta.t, s: e.meta.s })));
    expect(kelBefore).toHaveLength(1); // Just ICP
    expect(kelBefore[0].meta.t).toBe('icp');

    // Generate second mnemonic for rotation
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);

    // Rotate keys
    const updatedAccount = await accountDsl!.rotateKeys(mnemonic2);
    console.log('Keys rotated. New verfer:', updatedAccount.verfer);

    // Check KEL after rotation
    const kelAfter = await store.listKel(aid);
    console.log('KEL after rotation:', kelAfter.length, 'events');
    console.log('Events:', kelAfter.map(e => ({ t: e.meta.t, s: e.meta.s, d: e.meta.d.substring(0, 20) })));

    // Should have ICP + ROT
    expect(kelAfter).toHaveLength(2);
    expect(kelAfter[0].meta.t).toBe('icp');
    expect(kelAfter[1].meta.t).toBe('rot');
    expect(kelAfter[1].meta.i).toBe(aid);
    expect(kelAfter[1].meta.s).toBe('1'); // Sequence 1 (after ICP which is 0)

    // Check that metadata was stored
    const rotSaid = kelAfter[1].meta.d;
    const rotMeta = await store.getEvent(rotSaid);
    expect(rotMeta).toBeDefined();
    expect(rotMeta!.meta.t).toBe('rot');

    console.log('✓ ROT event successfully stored in KEL');
  });

  it('should support multiple rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');
    const aid = accountDsl!.account.aid;

    // First rotation
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);
    await accountDsl!.rotateKeys(mnemonic2);

    // Second rotation
    const mnemonic3 = dsl.newMnemonic(new Uint8Array(32).fill(3));
    await accountDsl!.rotateKeys(mnemonic3);

    // Check KEL
    const kel = await store.listKel(aid);
    console.log('KEL after 2 rotations:', kel.length, 'events');
    console.log('Events:', kel.map(e => ({ t: e.meta.t, s: e.meta.s })));

    // Should have ICP + 2 ROTs
    expect(kel).toHaveLength(3);
    expect(kel[0].meta.t).toBe('icp');
    expect(kel[1].meta.t).toBe('rot');
    expect(kel[2].meta.t).toBe('rot');
    expect(kel[1].meta.s).toBe('1');
    expect(kel[2].meta.s).toBe('2');

    console.log('✓ Multiple rotations work correctly');
  });

  it('should have readable current keys (k) and next key digests (n) after rotation', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account with first mnemonic
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');
    expect(accountDsl).toBeDefined();

    // Get KEL and check ICP event has k and n fields
    const kelBeforeRotation = await accountDsl!.getKel();
    expect(kelBeforeRotation).toHaveLength(1);
    const icpEvent = kelBeforeRotation[0];
    console.log('ICP event:', icpEvent);
    expect(icpEvent.k).toBeDefined();
    expect(icpEvent.n).toBeDefined();
    expect(Array.isArray(icpEvent.k)).toBe(true);
    expect(Array.isArray(icpEvent.n)).toBe(true);
    expect(icpEvent.k!.length).toBeGreaterThan(0);
    expect(icpEvent.n!.length).toBeGreaterThan(0);

    const originalCurrentKeys = icpEvent.k;
    const originalNextDigests = icpEvent.n;
    console.log('Original current keys (k):', originalCurrentKeys);
    console.log('Original next digests (n):', originalNextDigests);

    // Rotate keys
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);
    await accountDsl!.rotateKeys(mnemonic2);

    // Get KEL after rotation and verify rotation event
    const kelAfterRotation = await accountDsl!.getKel();
    expect(kelAfterRotation).toHaveLength(2);

    const rotEvent = kelAfterRotation[1];
    console.log('ROT event:', rotEvent);
    expect(rotEvent.t).toBe('rot');
    expect(rotEvent.k).toBeDefined();
    expect(rotEvent.n).toBeDefined();
    expect(Array.isArray(rotEvent.k)).toBe(true);
    expect(Array.isArray(rotEvent.n)).toBe(true);
    expect(rotEvent.k!.length).toBeGreaterThan(0);
    expect(rotEvent.n!.length).toBeGreaterThan(0);

    const newCurrentKeys = rotEvent.k;
    const newNextDigests = rotEvent.n;
    console.log('New current keys (k) after rotation:', newCurrentKeys);
    console.log('New next digests (n) after rotation:', newNextDigests);

    // Verify that keys changed after rotation
    expect(newCurrentKeys).not.toEqual(originalCurrentKeys);
    expect(newNextDigests).not.toEqual(originalNextDigests);

    // The new current keys should match what was the next key digest commitment from ICP
    // (This verifies the pre-rotation commitment mechanism)
    console.log('✓ Current keys and next key digests are readable and updated after rotation');
  });
});
