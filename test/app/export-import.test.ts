/**
 * Export/Import DSL Tests
 *
 * Tests for syncing KEL/TEL data between stores using CESR bundles
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MemoryKv, createKerStore, DefaultJsonCesrParser, CesrHasher } from '../../src/storage';
import { createKeritsDSL } from '../../src/app/dsl';

describe('Export/Import DSL', () => {
  const parser = new DefaultJsonCesrParser();
  const hasher = new CesrHasher();

  const seed1 = new Uint8Array(32).fill(1);
  const seed2 = new Uint8Array(32).fill(2);

  let issuerStore: ReturnType<typeof createKerStore>;
  let holderStore: ReturnType<typeof createKerStore>;

  beforeEach(() => {
    // Create separate stores for issuer and holder
    issuerStore = createKerStore(new MemoryKv(), parser, hasher);
    holderStore = createKerStore(new MemoryKv(), parser, hasher);
  });

  it('should export and import KEL events', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Create account in issuer store
    const mnemonic = issuerDSL.newMnemonic(seed1);
    const issuer = await issuerDSL.newAccount('issuer', mnemonic);

    // Export KEL
    const accountDsl = await issuerDSL.account('issuer');
    const exportDsl = await accountDsl!.export();
    const bundle = exportDsl.asBundle();

    // Verify bundle
    expect(bundle.type).toBe('kel');
    expect(bundle.events.length).toBe(1); // Inception event
    expect(bundle.metadata.scope?.aid).toBe(issuer.aid);

    // Import into holder store
    const importDsl = holderDSL.import();
    const result = await importDsl.fromBundle(bundle);

    // Verify import
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);

    // Verify KEL exists in holder store
    const kelEvents = await holderStore.listKel(issuer.aid);
    expect(kelEvents.length).toBe(1);
    expect(kelEvents[0].meta.t).toBe('icp');
    expect(kelEvents[0].meta.i).toBe(issuer.aid);
  });

  it('should export and import TEL events', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Setup issuer with registry
    const mnemonic = issuerDSL.newMnemonic(seed1);
    const issuer = await issuerDSL.newAccount('issuer', mnemonic);
    const accountDsl = await issuerDSL.account('issuer');
    const registryDsl = await accountDsl!.createRegistry('health-records');

    // Export KEL (account) and TEL (registry)
    const kelExport = await accountDsl!.export();
    const telExport = await registryDsl.export();

    // Import KEL first (must exist before TEL)
    const importDsl = holderDSL.import();
    const kelResult = await importDsl.fromBundle(kelExport.asBundle());
    expect(kelResult.imported).toBe(2); // icp + ixn (anchoring registry)

    // Import TEL
    const telResult = await importDsl.fromBundle(telExport.asBundle());
    expect(telResult.imported).toBe(1); // vcp event

    // Verify TEL exists in holder store
    const telEvents = await holderStore.listTel(registryDsl.registry.registryId);
    expect(telEvents.length).toBe(1);
    expect(telEvents[0].meta.t).toBe('vcp');
  });

  it('should export and import ACDC with issuance event', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Setup issuer, holder, schema, and registry
    const issuerMnemonic = issuerDSL.newMnemonic(seed1);
    const holderMnemonic = issuerDSL.newMnemonic(seed2);
    const issuer = await issuerDSL.newAccount('issuer', issuerMnemonic);
    const holder = await issuerDSL.newAccount('holder', holderMnemonic);

    const schemaDsl = await issuerDSL.createSchema('health-data', {
      title: 'Health Data',
      properties: {
        bloodType: { type: 'string' },
        allergies: { type: 'string' },
      },
    });

    const accountDsl = await issuerDSL.account('issuer');
    const registryDsl = await accountDsl!.createRegistry('health-records');

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      alias: 'holder-health',
      schema: 'health-data',
      holder: holder.aid,
      data: { bloodType: 'O+', allergies: 'None' },
    });

    // Export ACDC (includes credential + issuance event)
    const acdcExport = await acdcDsl.export();
    const acdcBundle = acdcExport.asBundle();

    // Verify bundle
    expect(acdcBundle.type).toBe('acdc');
    expect(acdcBundle.events.length).toBe(2); // ACDC + issuance event
    expect(acdcBundle.metadata.scope?.credentialId).toBe(acdcDsl.acdc.credentialId);

    // Import prerequisite events first
    const importDsl = holderDSL.import();
    await importDsl.fromBundle((await accountDsl!.export()).asBundle()); // KEL
    await importDsl.fromBundle((await registryDsl.export()).asBundle()); // TEL

    // Note: In a real scenario, schema would also be exported/imported
    // For this test, we skip schema import as it's not critical to test ACDC import

    // Import ACDC
    const acdcResult = await importDsl.fromBundle(acdcBundle);
    expect(acdcResult.imported).toBe(2); // ACDC + issuance

    // Verify ACDC exists in holder store
    const credStored = await holderStore.getEvent(acdcDsl.acdc.credentialId);
    expect(credStored).toBeDefined();
  });

  it('should skip existing events when skipExisting is true', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);

    // Create account
    const mnemonic = issuerDSL.newMnemonic(seed1);
    await issuerDSL.newAccount('issuer', mnemonic);

    // Export KEL
    const accountDsl = await issuerDSL.account('issuer');
    const exportDsl = await accountDsl!.export();
    const bundle = exportDsl.asBundle();

    // Import once
    const importDsl = issuerDSL.import();
    const firstResult = await importDsl.fromBundle(bundle);
    expect(firstResult.imported).toBe(1);

    // Import again with skipExisting
    const secondResult = await importDsl.fromBundle(bundle, { skipExisting: true });
    expect(secondResult.imported).toBe(0);
    expect(secondResult.skipped).toBe(1);
  });

  it('should export as JSON and import from JSON', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Create account
    const mnemonic = issuerDSL.newMnemonic(seed1);
    const issuer = await issuerDSL.newAccount('issuer', mnemonic);

    // Export as JSON
    const accountDsl = await issuerDSL.account('issuer');
    const exportDsl = await accountDsl!.export();
    const json = exportDsl.toJSON();

    // Verify JSON is valid
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('kel');
    expect(parsed.events).toBeArray();

    // Import from JSON
    const importDsl = holderDSL.import();
    const result = await importDsl.fromJSON(json);

    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);

    // Verify KEL exists
    const kelEvents = await holderStore.listKel(issuer.aid);
    expect(kelEvents.length).toBe(1);
  });

  it('should export as raw CESR and import from raw', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Create account
    const mnemonic = issuerDSL.newMnemonic(seed1);
    const issuer = await issuerDSL.newAccount('issuer', mnemonic);

    // Export as raw CESR
    const accountDsl = await issuerDSL.account('issuer');
    const exportDsl = await accountDsl!.export();
    const rawEvents = exportDsl.asRaw();

    expect(rawEvents).toBeArray();
    expect(rawEvents.length).toBe(1);
    expect(rawEvents[0]).toBeInstanceOf(Uint8Array);

    // Import from raw
    const importDsl = holderDSL.import();
    const result = await importDsl.fromRaw(rawEvents);

    expect(result.imported).toBe(1);

    // Verify KEL exists
    const kelEvents = await holderStore.listKel(issuer.aid);
    expect(kelEvents.length).toBe(1);
  });

  it('should handle import errors gracefully', async () => {
    const holderDSL = createKeritsDSL(holderStore);

    // Try to import invalid JSON
    const importDsl = holderDSL.import();
    const result = await importDsl.fromJSON('{ invalid json }');

    expect(result.imported).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should maintain event order during export/import', async () => {
    const issuerDSL = createKeritsDSL(issuerStore);
    const holderDSL = createKeritsDSL(holderStore);

    // Create account and rotate keys
    const mnemonic1 = issuerDSL.newMnemonic(seed1);
    const mnemonic2 = issuerDSL.newMnemonic(seed2);
    await issuerDSL.newAccount('issuer', mnemonic1);

    const accountDsl = await issuerDSL.account('issuer');
    await accountDsl!.rotateKeys(mnemonic2);

    // Export KEL
    const exportDsl = await accountDsl!.export();
    const bundle = exportDsl.asBundle();

    expect(bundle.events.length).toBe(2); // icp + rot

    // Import
    const importDsl = holderDSL.import();
    const result = await importDsl.fromBundle(bundle);

    expect(result.imported).toBe(2);

    // Verify event order
    const issuer = (await issuerDSL.getAccount('issuer'))!;
    const kelEvents = await holderStore.listKel(issuer.aid);
    expect(kelEvents.length).toBe(2);
    expect(kelEvents[0].meta.t).toBe('icp');
    expect(kelEvents[1].meta.t).toBe('rot');
    expect(kelEvents[1].meta.s).toBe('1'); // Sequence number 1 (hex string)
  });
});
