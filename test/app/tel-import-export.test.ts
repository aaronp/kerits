/**
 * TEL Import/Export Test
 *
 * Tests importing external TEL data for credential edge resolution.
 * Scenario: User A issues credentials with edges. User B receives one credential
 * but cannot resolve its edges. User B then imports User A's TEL to resolve edges.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { DiskKv } from '../../src/storage/adapters/disk';
import { createKerStore } from '../../src/storage/core';
import type { KerStore } from '../../src/storage/types';
import * as fs from 'fs';
import * as path from 'path';

describe('TEL Import/Export for Edge Resolution', () => {
  const testDir = path.join('/tmp', 'kerits-test-tel-import-' + Date.now());
  let userAStore: KerStore;
  let userBStore: KerStore;
  let userADSL: Awaited<ReturnType<typeof createKeritsDSL>>;
  let userBDSL: Awaited<ReturnType<typeof createKeritsDSL>>;

  beforeEach(async () => {
    // Clean test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Create separate stores for User A and User B
    const userADir = path.join(testDir, 'userA');
    const userBDir = path.join(testDir, 'userB');

    const userAKv = new DiskKv({ baseDir: userADir, createIfMissing: true });
    const userBKv = new DiskKv({ baseDir: userBDir, createIfMissing: true });

    userAStore = createKerStore(userAKv);
    userBStore = createKerStore(userBKv);

    userADSL = createKeritsDSL(userAStore);
    userBDSL = createKeritsDSL(userBStore);
  });

  test('User B can resolve credential edges after importing User A TEL', async () => {
    // ========================================
    // STEP 1: Setup User A account and registry
    // ========================================

    const userASeed = new Uint8Array(32).fill(1);
    const userAMnemonic = userADSL.newMnemonic(userASeed);
    await userADSL.newAccount('userA', userAMnemonic);

    const userAAccount = await userADSL.account('userA');
    if (!userAAccount) throw new Error('User A account not found');

    const userARegistry = await userAAccount.createRegistry('userA-registry');

    // ========================================
    // STEP 2: Setup User B account and registry
    // ========================================

    const userBSeed = new Uint8Array(32).fill(2);
    const userBMnemonic = userBDSL.newMnemonic(userBSeed);
    await userBDSL.newAccount('userB', userBMnemonic);

    const userBAccount = await userBDSL.account('userB');
    if (!userBAccount) throw new Error('User B account not found');

    const userBRegistry = await userBAccount.createRegistry('userB-registry');

    // ========================================
    // STEP 3: Create schemas
    // ========================================

    const educationSchema = await userADSL.createSchema('education', {
      title: 'Education Credential',
      properties: {
        degree: { type: 'string' },
        institution: { type: 'string' },
      },
      required: ['degree', 'institution'],
    });

    const employmentSchema = await userADSL.createSchema('employment', {
      title: 'Employment Credential',
      properties: {
        employer: { type: 'string' },
        position: { type: 'string' },
        educationRef: { type: 'string' }, // Will reference education credential
      },
      required: ['employer', 'position'],
    });

    // ========================================
    // STEP 4: User A issues Credential 1 (Education)
    // ========================================

    const credential1 = await userARegistry.issue({
      alias: 'bsc-degree',
      schema: 'education',
      holder: userBAccount.account.aid,
      data: {
        degree: 'Bachelor of Science',
        institution: 'Example University',
      },
    });

    console.log(`✓ User A issued Credential 1: ${credential1.acdc.credentialId.substring(0, 12)}...`);

    // ========================================
    // STEP 5: User A issues Credential 2 with edge to Credential 1
    // ========================================

    const credential2 = await userARegistry.issue({
      alias: 'employment',
      schema: 'employment',
      holder: userBAccount.account.aid,
      data: {
        employer: 'Tech Corp',
        position: 'Software Engineer',
        educationRef: credential1.acdc.credentialId,
      },
      edges: {
        education: {
          n: credential1.acdc.credentialId, // SAID of Credential 1
          s: educationSchema.schema.schemaId, // Schema constraint
        },
      },
    });

    console.log(`✓ User A issued Credential 2 with edge: ${credential2.acdc.credentialId.substring(0, 12)}...`);
    console.log(`  └─ Edge points to: ${credential1.acdc.credentialId.substring(0, 12)}...`);

    // ========================================
    // STEP 6: User B accepts Credential 2 (without Credential 1)
    // ========================================

    // Export Credential 2 only
    const credential2Export = await credential2.export();
    const credential2Bundle = credential2Export.asBundle();

    // Get ACDC event (first event in bundle)
    const acdcEventBytes = credential2Bundle.events[0];
    const acdcEventText = new TextDecoder().decode(acdcEventBytes);
    const acdcEventJson = JSON.parse(acdcEventText.substring(acdcEventText.indexOf('{')));

    // Accept into User B's registry (this will store the credential)
    const acceptedCred2 = await userBRegistry.accept({
      credential: acdcEventJson,
      alias: 'my-employment-credential',
    });

    console.log(`✓ User B accepted Credential 2`);

    // ========================================
    // STEP 7: Verify User B cannot resolve edge (Credential 1 not found)
    // ========================================

    // Try to get the edge credential
    const credential1IdFromEdge = acdcEventJson.e?.education?.n;
    expect(credential1IdFromEdge).toBe(credential1.acdc.credentialId);

    // User B tries to get Credential 1 - should not exist yet
    const credential1InUserB = await userBStore.getACDC(credential1IdFromEdge);
    expect(credential1InUserB).toBeNull();

    console.log(`✓ Verified: User B cannot resolve edge to Credential 1 yet`);

    // ========================================
    // STEP 8: User A exports TEL with ACDCs
    // ========================================

    const userATelExport = await userARegistry.export({ includeACDCs: true });
    const exportBundle = userATelExport.asBundle();

    console.log(`✓ User A exported TEL with ${exportBundle.events.length} events (TEL + ACDCs)`);
    expect(exportBundle.type).toBe('mixed'); // TEL + ACDC
    expect(exportBundle.events.length).toBeGreaterThan(2); // VCP, ISS, ISS, ACDC, ACDC

    // ========================================
    // STEP 9: User B imports User A's TEL
    // ========================================

    const importResult = await userBAccount.importTEL(userATelExport);

    console.log(`✓ User B imported TEL:`);
    console.log(`  └─ TEL events: ${importResult.eventsImported}`);
    console.log(`  └─ ACDCs: ${importResult.acdcsImported}`);
    console.log(`  └─ Registry ID: ${importResult.registryId?.substring(0, 12)}...`);

    expect(importResult.eventsImported).toBeGreaterThanOrEqual(2); // VCP + ISS events
    expect(importResult.acdcsImported).toBe(2); // Both credentials
    expect(importResult.registryId).toBe(userARegistry.registry.registryId);

    // ========================================
    // STEP 10: Verify User B can now resolve edge
    // ========================================

    // User B should now be able to get Credential 1
    const credential1AfterImport = await userBStore.getACDC(credential1IdFromEdge);
    expect(credential1AfterImport).toBeTruthy();
    expect(credential1AfterImport!.d).toBe(credential1.acdc.credentialId);
    expect(credential1AfterImport!.a.degree).toBe('Bachelor of Science');
    expect(credential1AfterImport!.a.institution).toBe('Example University');

    console.log(`✓ User B can now resolve edge to Credential 1`);
    console.log(`  └─ Degree: ${credential1AfterImport!.a.degree}`);
    console.log(`  └─ Institution: ${credential1AfterImport!.a.institution}`);

    // ========================================
    // STEP 11: Verify User A's TEL is accessible to User B
    // ========================================

    // User B should be able to list User A's TEL
    const userATelInUserB = await userBStore.listTel(userARegistry.registry.registryId);
    expect(userATelInUserB.length).toBeGreaterThanOrEqual(3); // VCP + 2 ISS

    console.log(`✓ User B can access User A's TEL (${userATelInUserB.length} events)`);

    console.log(`\n✅ TEL import/export test passed!`);
  });

  test('User can export TEL without ACDCs', async () => {
    // Setup
    const userSeed = new Uint8Array(32).fill(1);
    const userMnemonic = userADSL.newMnemonic(userSeed);
    await userADSL.newAccount('user', userMnemonic);

    const userAccount = await userADSL.account('user');
    if (!userAccount) throw new Error('User account not found');

    const registry = await userAccount.createRegistry('registry');

    const schema = await userADSL.createSchema('test-schema', {
      title: 'Test Schema',
      properties: {
        field: { type: 'string' },
      },
    });

    const credential = await registry.issue({
      alias: 'test-cred',
      schema: 'test-schema',
      holder: userAccount.account.aid,
      data: { field: 'value' },
    });

    // Export TEL without ACDCs (default)
    const telExport = await registry.export();
    const bundle = telExport.asBundle();

    expect(bundle.type).toBe('tel'); // Just TEL, not mixed
    expect(bundle.events.length).toBe(2); // VCP + ISS only

    console.log(`✓ Exported TEL without ACDCs: ${bundle.events.length} events`);

    // Export TEL with ACDCs
    const telWithACDCs = await registry.export({ includeACDCs: true });
    const bundleWithACDCs = telWithACDCs.asBundle();

    expect(bundleWithACDCs.type).toBe('mixed');
    expect(bundleWithACDCs.events.length).toBe(3); // VCP + ISS + ACDC

    console.log(`✓ Exported TEL with ACDCs: ${bundleWithACDCs.events.length} events`);
  });
});
