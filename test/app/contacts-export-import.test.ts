/**
 * Tests for Contact Export/Import functionality
 * Validates that contacts can be exported as CESR KEL and imported back
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const ALICE_SEED = new Uint8Array(32).fill(1);
const BOB_SEED = new Uint8Array(32).fill(2);

describe('Contact Export/Import', () => {
  it('should export a contact KEL in CESR format', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice's account
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const alice = await dsl.getAccount('alice');
    expect(alice).not.toBeNull();

    console.log('Created Alice with AID:', alice!.aid);

    // Add Alice as a contact
    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid, {
      name: 'Alice Smith',
      role: 'colleague',
    });

    // Export Alice's KEL
    const kelCesr = await contactsDsl.exportKEL('alice-contact');
    expect(kelCesr).toBeInstanceOf(Uint8Array);
    expect(kelCesr.length).toBeGreaterThan(0);

    // Verify CESR format contains expected data
    const cesrText = new TextDecoder().decode(kelCesr);
    console.log('Exported CESR length:', cesrText.length, 'chars');
    expect(cesrText).toContain('{'); // Contains JSON
    expect(cesrText).toContain(alice!.aid); // Contains AID

    console.log('✓ Successfully exported contact KEL in CESR format');
  });

  it('should import a contact from CESR KEL data', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice's account
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const alice = await dsl.getAccount('alice');
    expect(alice).not.toBeNull();

    // Add Alice as contact and export her KEL
    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid, {
      name: 'Alice Smith',
    });
    const kelCesr = await contactsDsl.exportKEL('alice-contact');

    // Create Bob's separate storage (simulating another user)
    const bobKv = new MemoryKv();
    const bobStore = createKerStore(bobKv);
    const bobDsl = createKeritsDSL(bobStore);

    // Bob imports Alice's KEL
    const bobContactsDsl = bobDsl.contacts();
    const importedContact = await bobContactsDsl.importKEL(kelCesr, 'alice-imported');

    expect(importedContact).not.toBeNull();
    expect(importedContact.alias).toBe('alice-imported');
    expect(importedContact.aid).toBe(alice!.aid);

    console.log('✓ Imported contact:', importedContact);

    // Verify the contact is stored
    const retrievedContact = await bobContactsDsl.get('alice-imported');
    expect(retrievedContact).not.toBeNull();
    expect(retrievedContact!.aid).toBe(alice!.aid);

    // Verify KEL was imported
    const kelEvents = await bobStore.listKel(alice!.aid);
    expect(kelEvents.length).toBeGreaterThan(0);

    console.log('✓ Successfully imported contact KEL and created alias mapping');
  });

  it('should create both contact and KEL alias mappings on import', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create and export Alice
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const alice = await dsl.getAccount('alice');
    expect(alice).not.toBeNull();

    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid);
    const kelCesr = await contactsDsl.exportKEL('alice-contact');

    // Import into Bob's storage
    const bobKv = new MemoryKv();
    const bobStore = createKerStore(bobKv);
    const bobDsl = createKeritsDSL(bobStore);
    const bobContactsDsl = bobDsl.contacts();

    await bobContactsDsl.importKEL(kelCesr, 'alice');

    // Check contact alias mapping
    const contactAid = await bobStore.aliasToId('contact', 'alice');
    expect(contactAid).toBe(alice!.aid);
    console.log('✓ Contact alias mapping created: alice ->', contactAid);

    // Check KEL alias mapping
    const kelAid = await bobStore.aliasToId('kel', 'alice');
    expect(kelAid).toBe(alice!.aid);
    console.log('✓ KEL alias mapping created: alice ->', kelAid);

    // Verify we can access via both aliases
    const viaContact = await bobContactsDsl.get('alice');
    expect(viaContact).not.toBeNull();
    expect(viaContact!.aid).toBe(alice!.aid);

    console.log('✓ Both alias mappings work correctly');
  });

  it('should handle account with key rotation in export/import', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice and rotate keys
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const aliceAccount = await dsl.account('alice');
    expect(aliceAccount).not.toBeNull();

    // Rotate Alice's keys
    const rotationMnemonic = dsl.newMnemonic(new Uint8Array(32).fill(99));
    await aliceAccount!.rotateKeys(rotationMnemonic);

    const alice = await dsl.getAccount('alice');
    console.log('Alice AID after rotation:', alice!.aid);

    // Export KEL (should include rotation event)
    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid);
    const kelCesr = await contactsDsl.exportKEL('alice-contact');

    // Import into Bob's storage
    const bobKv = new MemoryKv();
    const bobStore = createKerStore(bobKv);
    const bobDsl = createKeritsDSL(bobStore);
    const bobContactsDsl = bobDsl.contacts();

    const importedContact = await bobContactsDsl.importKEL(kelCesr, 'alice-rotated');
    expect(importedContact.aid).toBe(alice!.aid);

    // Verify KEL contains rotation event
    const kelEvents = await bobStore.listKel(alice!.aid);
    expect(kelEvents.length).toBe(2); // ICP + ROT
    expect(kelEvents[0].meta.t).toBe('icp');
    expect(kelEvents[1].meta.t).toBe('rot');

    console.log('✓ Successfully exported/imported KEL with key rotation');
  });

  it('should reject import if contact alias already exists', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const alice = await dsl.getAccount('alice');
    expect(alice).not.toBeNull();

    // Export Alice's KEL
    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid);
    const kelCesr = await contactsDsl.exportKEL('alice-contact');

    // Create Bob
    const bobMnemonic = dsl.newMnemonic(BOB_SEED);
    await dsl.newAccount('bob', bobMnemonic);
    const bob = await dsl.getAccount('bob');

    // Add Bob as contact with alias 'colleague'
    await contactsDsl.add('colleague', bob!.aid);

    // Try to import Alice with same alias 'colleague'
    let errorThrown = false;
    try {
      await contactsDsl.importKEL(kelCesr, 'colleague');
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('already exists');
      console.log('✓ Correctly rejected duplicate alias:', (error as Error).message);
    }

    expect(errorThrown).toBe(true);
  });

  it('should reject export if contact not found', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const contactsDsl = dsl.contacts();

    let errorThrown = false;
    try {
      await contactsDsl.exportKEL('nonexistent');
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('not found');
      console.log('✓ Correctly rejected export of nonexistent contact');
    }

    expect(errorThrown).toBe(true);
  });

  it('should handle multiple contact imports', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice and Bob
    const aliceMnemonic = dsl.newMnemonic(ALICE_SEED);
    await dsl.newAccount('alice', aliceMnemonic);
    const alice = await dsl.getAccount('alice');

    const bobMnemonic = dsl.newMnemonic(BOB_SEED);
    await dsl.newAccount('bob', bobMnemonic);
    const bob = await dsl.getAccount('bob');

    // Export both KELs
    const contactsDsl = dsl.contacts();
    await contactsDsl.add('alice-contact', alice!.aid);
    await contactsDsl.add('bob-contact', bob!.aid);

    const aliceKel = await contactsDsl.exportKEL('alice-contact');
    const bobKel = await contactsDsl.exportKEL('bob-contact');

    // Create Carol's storage and import both
    const carolKv = new MemoryKv();
    const carolStore = createKerStore(carolKv);
    const carolDsl = createKeritsDSL(carolStore);
    const carolContactsDsl = carolDsl.contacts();

    await carolContactsDsl.importKEL(aliceKel, 'alice');
    await carolContactsDsl.importKEL(bobKel, 'bob');

    // Verify both contacts exist
    const contacts = await carolContactsDsl.getAll();
    expect(contacts.length).toBe(2);
    expect(contacts.map(c => c.alias).sort()).toEqual(['alice', 'bob']);

    // Verify both KELs are stored
    const aliceKelEvents = await carolStore.listKel(alice!.aid);
    const bobKelEvents = await carolStore.listKel(bob!.aid);
    expect(aliceKelEvents.length).toBeGreaterThan(0);
    expect(bobKelEvents.length).toBeGreaterThan(0);

    console.log('✓ Successfully imported multiple contacts');
  });
});
