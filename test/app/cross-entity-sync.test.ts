/**
 * Cross-Entity Chain Synchronization Tests
 *
 * Tests for sharing KELs, TELs, and ACDCs between entities with:
 * - Aliasing imported chains
 * - SAID verification
 * - Skip existing events
 * - Graph visualization across entities
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MemoryKv, createKerStore, DefaultJsonCesrParser, CesrHasher } from '../../src/storage';
import { createKeritsDSL } from '../../src/app/dsl';

describe('Cross-Entity Sync', () => {
  const hasher = new CesrHasher();
  const parser = new DefaultJsonCesrParser(hasher);

  const seed1 = new Uint8Array(32).fill(1);
  const seed2 = new Uint8Array(32).fill(2);

  let bobStore: ReturnType<typeof createKerStore>;
  let aliceStore: ReturnType<typeof createKerStore>;

  beforeEach(() => {
    bobStore = createKerStore(new MemoryKv(), { parser, hasher });
    aliceStore = createKerStore(new MemoryKv(), { parser, hasher });
  });

  it('should sync Bob\'s registry to Alice with alias', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity and registry
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    const bob = await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');
    const bobRegistryDsl = await bobAccountDsl!.createRegistry('health');

    // Bob exports his KEL and registry TEL
    const bobKelExport = await bobAccountDsl!.export();
    const bobTelExport = await bobRegistryDsl.export();

    // Alice imports Bob's KEL and TEL with custom aliases
    const aliceImport = aliceDSL.import();

    const kelResult = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(kelResult.imported).toBeGreaterThan(0);
    expect(kelResult.failed).toBe(0);
    expect(kelResult.aid).toBe(bob.aid);

    const telResult = await aliceImport.fromBundle(bobTelExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-health-registry',
    });
    // TEL import count may be 0 if events were skipped, but should not fail
    if (telResult.failed > 0) {
      console.log('TEL import errors:', telResult.errors);
    }
    expect(telResult.failed).toBe(0);
    expect(telResult.registryId).toBe(bobRegistryDsl.registry.registryId);
    // At least imported or skipped should be > 0
    expect(telResult.imported + telResult.skipped).toBeGreaterThan(0);

    // Verify Alice can access Bob's registry by alias
    const registryId = await aliceStore.aliasToId('tel', 'bobs-health-registry');
    expect(registryId).toBe(bobRegistryDsl.registry.registryId);

    // Verify Bob's KEL exists in Alice's store
    const bobKelInAlice = await aliceStore.listKel(bob.aid);
    expect(bobKelInAlice.length).toBeGreaterThan(0);

    console.log('✓ Bob\'s registry synced to Alice with alias');
  });

  it('should sync Bob\'s credential to Alice', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob sets up identity, schema, and registry
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    const bob = await bobDSL.newAccount('bob', bobMnemonic);

    const schemaDsl = await bobDSL.createSchema('running-record', {
      title: 'Running Record',
      properties: {
        distance: { type: 'number' },
        time: { type: 'number' },
      },
      required: ['distance', 'time'],
    });

    const bobAccountDsl = await bobDSL.account('bob');
    const bobRegistryDsl = await bobAccountDsl!.createRegistry('health');

    // Bob issues himself a credential
    const acdcDsl = await bobRegistryDsl.issue({
      schema: 'running-record',
      holder: bob.aid,
      data: { distance: 5, time: 30 },
    });

    // Bob exports KEL, TEL, schema, and credential
    const bobKelExport = await bobAccountDsl!.export();
    const bobTelExport = await bobRegistryDsl.export();
    const bobAcdcExport = await acdcDsl.export();
    const bobSchemaExport = schemaDsl.getSchema();

    // Alice imports everything
    const aliceImport = aliceDSL.import();

    // Import Bob's KEL
    await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });

    // Import Bob's TEL with alias
    await aliceImport.fromBundle(bobTelExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-health',
    });

    // Import schema (for now, recreate it in Alice's store)
    await aliceDSL.createSchema('running-record', bobSchemaExport);

    // Import Bob's credential with alias
    const acdcResult = await aliceImport.fromBundle(bobAcdcExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-running-record',
    });

    if (acdcResult.failed > 0) {
      console.log('ACDC import errors:', acdcResult.errors);
    }
    expect(acdcResult.failed).toBe(0);
    expect(acdcResult.credentialId).toBe(acdcDsl.acdc.credentialId);
    expect(acdcResult.imported + acdcResult.skipped).toBeGreaterThan(0);

    // Verify credential exists in Alice's store
    const credStored = await aliceStore.getEvent(acdcDsl.acdc.credentialId);
    expect(credStored).toBeDefined();

    console.log('✓ Bob\'s credential synced to Alice');
  });

  it('should re-import Bob\'s chain and skip existing events', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');

    // Bob exports KEL
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports Bob's KEL
    const aliceImport = aliceDSL.import();
    const firstImport = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(firstImport.imported).toBeGreaterThan(0);
    expect(firstImport.skipped).toBe(0);

    // Alice re-imports same KEL - should skip all events
    const secondImport = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(secondImport.imported).toBe(0);
    expect(secondImport.skipped).toBe(firstImport.imported);

    console.log('✓ Re-import skipped existing events');
    console.log(`  First import: ${firstImport.imported}, Second import skipped: ${secondImport.skipped}`);
  });

  it('should verify SAIDs during import', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');

    // Bob exports KEL
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports with verification
    const aliceImport = aliceDSL.import();
    const result = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      verify: true
    });

    expect(result.failed).toBe(0);
    expect(result.errors.length).toBe(0);
    expect(result.imported).toBeGreaterThan(0);

    console.log('✓ SAID verification passed for all events');
  });
});
