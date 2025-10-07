/**
 * Comprehensive IPEX Credential Exchange Test
 *
 * Scenario:
 * 1. Alice and Bob each have their own DiskKv storage (separate directories)
 * 2. Alice creates a 'finance' registry with nested 'public' sub-registry
 * 3. Alice issues a credential to Bob from the 'public' registry
 * 4. Alice exports the credential via IPEX
 * 5. Bob imports the credential into his 'mydata' registry
 * 6. Alice revokes the credential
 * 7. TextGraph shows filesystem-like view and KeriGitGraph shows Mermaid diagrams
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { DiskKv } from '../../src/storage/adapters/disk';
import { createKeritsDSL } from '../../src/app/dsl';
import type { KeritsDSL } from '../../src/app/dsl/types';
import { createTextGraph, createKeriGitGraph } from '../../src/app/graph';
import * as path from 'path';

const SEED_ALICE = new Uint8Array(32).fill(1);
const SEED_BOB = new Uint8Array(32).fill(2);

describe('IPEX Credential Exchange with Graph Visualizations', () => {
  const TEST_DIR = path.join('target', 'ipex-test', `test-${Date.now()}`);
  const ALICE_DIR = path.join(TEST_DIR, 'alice');
  const BOB_DIR = path.join(TEST_DIR, 'bob');

  let aliceDSL: KeritsDSL;
  let bobDSL: KeritsDSL;

  beforeAll(async () => {
    // Create separate storage for Alice and Bob
    const aliceKv = new DiskKv({ baseDir: ALICE_DIR });
    const aliceStore = createKerStore(aliceKv);
    aliceDSL = createKeritsDSL(aliceStore);

    const bobKv = new DiskKv({ baseDir: BOB_DIR });
    const bobStore = createKerStore(bobKv);
    bobDSL = createKeritsDSL(bobStore);
  });

  test('complete IPEX credential exchange workflow', async () => {
    console.log('\n=== IPEX Credential Exchange Test ===\n');

    // === 1. Create Alice's account ===
    console.log('📝 Step 1: Creating Alice\'s account...');
    const aliceMnemonic = aliceDSL.newMnemonic(SEED_ALICE);
    const aliceAccount = await aliceDSL.newAccount('alice', aliceMnemonic);
    console.log(`✓ Alice created with AID: ${aliceAccount.aid.substring(0, 20)}...`);

    const aliceAccountDSL = await aliceDSL.account('alice');
    expect(aliceAccountDSL).toBeDefined();

    // === 2. Create Bob's account ===
    console.log('\n📝 Step 2: Creating Bob\'s account...');
    const bobMnemonic = bobDSL.newMnemonic(SEED_BOB);
    const bobAccount = await bobDSL.newAccount('bob', bobMnemonic);
    console.log(`✓ Bob created with AID: ${bobAccount.aid.substring(0, 20)}...`);

    const bobAccountDSL = await bobDSL.account('bob');
    expect(bobAccountDSL).toBeDefined();

    // === 3. Alice creates 'finance' registry ===
    console.log('\n📝 Step 3: Alice creating \'finance\' registry...');
    const financeRegistry = await aliceAccountDSL!.createRegistry('finance');
    expect(financeRegistry).toBeDefined();
    console.log(`✓ Finance registry created: ${financeRegistry.registry.registryId.substring(0, 20)}...`);

    // === 4. Alice creates nested 'public' registry under 'finance' ===
    console.log('\n📝 Step 4: Alice creating nested \'public\' registry...');
    const publicRegistry = await financeRegistry.createRegistry('public');
    expect(publicRegistry).toBeDefined();
    expect(publicRegistry.registry.parentRegistryId).toBe(financeRegistry.registry.registryId);
    console.log(`✓ Nested 'public' registry created: ${publicRegistry.registry.registryId.substring(0, 20)}...`);
    console.log(`  └─ Parent: ${publicRegistry.registry.parentRegistryId!.substring(0, 20)}...`);

    // === 5. Create credential schema ===
    console.log('\n📝 Step 5: Creating credential schema...');
    const credentialSchema = {
      $id: 'https://example.com/schemas/public-credential',
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
        accountNumber: { type: 'string' },
        balance: { type: 'number' },
      },
      required: ['name', 'accountNumber'],
    };
    const schemaDSL = await aliceDSL.createSchema('public-credential', credentialSchema);
    expect(schemaDSL).toBeDefined();
    console.log(`✓ Schema created: ${schemaDSL.schema.schemaSaid.substring(0, 20)}...`);

    // === 6. Alice issues credential to Bob ===
    console.log('\n📝 Step 6: Alice issuing credential to Bob...');
    const credential = await publicRegistry.issue({
      schema: schemaDSL.schema.schemaSaid,
      holder: bobAccount.aid,
      data: {
        name: 'Bob Smith',
        accountNumber: 'ACC-12345',
        balance: 1000.00,
      },
      alias: 'bob-public-credential',
    });
    expect(credential).toBeDefined();
    console.log(`✓ Credential issued: ${credential.acdc.credentialId.substring(0, 20)}...`);
    console.log(`  └─ Holder: ${credential.acdc.holderAid.substring(0, 20)}...`);

    // Verify credential is active
    let credStatus = await credential.status();
    expect(credStatus.revoked).toBe(false);
    expect(credStatus.status).toBe('issued');
    console.log(`✓ Credential status: ${credStatus.status}`);

    // === 7. Alice exports credential for IPEX ===
    console.log('\n📝 Step 7: Alice exporting credential via IPEX...');
    const exportDSL = await credential.export();
    const bundle = exportDSL.asBundle();
    expect(bundle).toBeDefined();
    expect(bundle.events).toBeDefined();
    expect(bundle.events.length).toBeGreaterThan(0);
    console.log(`✓ Credential exported with ${bundle.events.length} events`);

    // === 8. Bob creates 'mydata' registry ===
    console.log('\n📝 Step 8: Bob creating \'mydata\' registry...');
    const bobRegistry = await bobAccountDSL!.createRegistry('mydata');
    expect(bobRegistry).toBeDefined();
    console.log(`✓ Bob's 'mydata' registry created: ${bobRegistry.registry.registryId.substring(0, 20)}...`);

    // === 9. Bob imports credential ===
    console.log('\n📝 Step 9: Bob importing credential...');
    const importedCred = await bobRegistry.accept({
      credential: {
        v: 'ACDC10JSON',
        d: credential.acdc.credentialId,
        i: aliceAccount.aid,
        ri: publicRegistry.registry.registryId,
        s: schemaDSL.schema.schemaSaid,
        a: {
          d: '',
          i: bobAccount.aid,
          name: 'Bob Smith',
          accountNumber: 'ACC-12345',
          balance: 1000.00,
        },
      },
      alias: 'alice-issued-credential',
    });
    expect(importedCred).toBeDefined();
    expect(importedCred.acdc.credentialId).toBe(credential.acdc.credentialId);
    console.log(`✓ Credential imported by Bob`);

    // Verify credential in Bob's registry
    const bobCredentials = await bobRegistry.listACDCs();
    expect(bobCredentials).toContain('alice-issued-credential');
    console.log(`✓ Credential visible in Bob's registry: ${bobCredentials}`);

    // === 10. Alice revokes credential ===
    console.log('\n📝 Step 10: Alice revoking credential...');
    await credential.revoke();
    console.log(`✓ Credential revoked by Alice`);

    // Verify revocation
    credStatus = await credential.status();
    expect(credStatus.revoked).toBe(true);
    expect(credStatus.status).toBe('revoked');
    console.log(`✓ Credential status: ${credStatus.status}`);

    // Verify revocation event in TEL
    const publicTel = await publicRegistry.getTel();
    const revEvents = publicTel.filter(e => e.t === 'rev');
    expect(revEvents.length).toBe(1);
    expect(revEvents[0].i).toBe(credential.acdc.credentialId);  // 'i' field contains credential SAID
    console.log(`✓ Revocation event found in TEL`);

    // === 11. Generate graph visualizations ===
    console.log('\n📝 Step 11: Generating graph visualizations...\n');

    // Get KEL/TEL data for assertions
    const aliceKel = await aliceAccountDSL!.getKel();
    const financeTel = await financeRegistry.getTel();
    const bobKel = await bobAccountDSL!.getKel();
    const bobTel = await bobRegistry.getTel();

    // === 11a. TextGraph - Filesystem View ===
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ KERI Data Structure - Filesystem View (TextGraph)      │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Alice's data
    console.log('📁 Alice\'s KERI Data:');
    const aliceStore = aliceDSL.getStore(); // Access internal store
    const aliceTextGraph = createTextGraph(aliceStore, aliceDSL);
    const aliceTree = await aliceTextGraph.toTree();
    console.log(aliceTree);
    console.log('');

    const aliceSummary = await aliceTextGraph.toSummary({ storageLocation: ALICE_DIR });
    console.log(aliceSummary);
    console.log('');

    // Bob's data
    console.log('📁 Bob\'s KERI Data:');
    const bobStore = bobDSL.getStore(); // Access internal store
    const bobTextGraph = createTextGraph(bobStore, bobDSL);
    const bobTree = await bobTextGraph.toTree();
    console.log(bobTree);
    console.log('');

    const bobSummary = await bobTextGraph.toSummary({ storageLocation: BOB_DIR });
    console.log(bobSummary);

    // === 11b. KeriGitGraph - Mermaid GitGraph ===
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ KERI Event Chains - Mermaid GitGraph                   │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

    console.log('Alice\'s GitGraph:');
    const aliceGitGraph = createKeriGitGraph(aliceStore, aliceDSL);
    const aliceMermaid = await aliceGitGraph.toMermaid({ includeTel: true });
    console.log(aliceMermaid);
    console.log('');

    console.log('Bob\'s GitGraph:');
    const bobGitGraph = createKeriGitGraph(bobStore, bobDSL);
    const bobMermaid = await bobGitGraph.toMermaid({ includeTel: true });
    console.log(bobMermaid);

    console.log('\n📌 Credential Info:');
    console.log(`  • ID: ${credential.acdc.credentialId.substring(0, 24)}...`);
    console.log(`  • Status: revoked`);

    // === Final Assertions ===
    expect(aliceKel.length).toBeGreaterThanOrEqual(2); // ICP + at least one IXN
    expect(financeTel.length).toBeGreaterThanOrEqual(1); // VCP + ISS for nested registry
    expect(publicTel.length).toBeGreaterThanOrEqual(3); // VCP + ISS + REV
    expect(bobKel.length).toBeGreaterThanOrEqual(2); // ICP + IXN
    expect(bobTel.length).toBeGreaterThanOrEqual(2); // VCP + ISS (accepted credential)

    console.log('\n✅ All assertions passed!\n');
  });
});
