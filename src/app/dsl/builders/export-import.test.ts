/**
 * Tests for KEL/TEL Export and Import
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKerStore } from '../../../storage/core';
import { MemoryKv } from '../../../storage/adapters/memory';
import { createKeritsDSL } from '../';
import { generateKeypairFromSeed } from '../../../signer';

describe('KEL Export/Import', () => {
  let dsl: ReturnType<typeof createKeritsDSL>;

  beforeEach(async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    dsl = createKeritsDSL(store);
  });

  test('should export and import KEL in CESR format', async () => {
    // Create an account
    const mnemonic = dsl.newMnemonic(new Uint8Array(32).fill(1));
    const account = await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    expect(accountDsl).toBeDefined();
    expect(accountDsl.account.aid).toBeDefined();

    const originalAid = accountDsl.account.aid;

    // Export the account's KEL
    const exportDsl = await accountDsl.export();
    expect(exportDsl).toBeDefined();

    // Export as CESR
    const cesr = exportDsl.toCESR();
    expect(cesr).toBeInstanceOf(Uint8Array);
    expect(cesr.length).toBeGreaterThan(0);

    // Verify CESR format contains version strings
    const cesrText = new TextDecoder().decode(cesr);
    expect(cesrText).toContain('KERI10JSON');
    expect(cesrText).toContain('"t":"icp"'); // Inception event

    // Import the KEL into a new DSL instance (simulating contact import)
    const kv2 = new MemoryKv();
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);

    const importDsl = dsl2.import();
    const result = await importDsl.fromCESR(cesr);

    expect(result.imported).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify the events were imported
    const importedKel = await store2.listKel(originalAid);
    expect(importedKel.length).toBeGreaterThan(0);
    expect(importedKel[0].meta.t).toBe('icp');
  });

  test('should handle KEL with rotation events', async () => {
    // Create account
    const mnemonic = dsl.newMnemonic(new Uint8Array(32).fill(2));
    await dsl.newAccount('test-rotation', mnemonic);
    const accountDsl = await dsl.account('test-rotation');

    // Rotate keys
    const newMnemonic = dsl.newMnemonic(new Uint8Array(32).fill(3));
    await accountDsl.rotateKeys(newMnemonic);

    // Export
    const exportDsl = await accountDsl.export();
    const cesr = exportDsl.toCESR();

    // Verify CESR contains rotation event
    const cesrText = new TextDecoder().decode(cesr);
    expect(cesrText).toContain('"t":"rot"');

    // Import
    const kv2 = new MemoryKv();
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);

    const result = await dsl2.import().fromCESR(cesr);

    expect(result.imported).toBe(2); // Inception + rotation
    expect(result.failed).toBe(0);
  });

  test('should export and import as JSON bundle', async () => {
    // Create account
    const mnemonic = dsl.newMnemonic(new Uint8Array(32).fill(4));
    await dsl.newAccount('test-json', mnemonic);
    const accountDsl = await dsl.account('test-json');

    // Export as JSON
    const exportDsl = await accountDsl.export();
    const json = exportDsl.toJSON();

    expect(json).toBeDefined();
    const parsed = JSON.parse(json);
    expect(parsed.type).toBe('kel');
    expect(parsed.events).toBeInstanceOf(Array);

    // Import JSON
    const kv2 = new MemoryKv();
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);

    const result = await dsl2.import().fromJSON(json);

    expect(result.imported).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });

  test('should export bundle with metadata', async () => {
    // Create account
    const mnemonic = dsl.newMnemonic(new Uint8Array(32).fill(5));
    await dsl.newAccount('test-metadata', mnemonic);
    const accountDsl = await dsl.account('test-metadata');

    const exportDsl = await accountDsl.export();
    const bundle = exportDsl.asBundle();

    expect(bundle.type).toBe('kel');
    expect(bundle.version).toBe('1.0');
    expect(bundle.events).toBeInstanceOf(Array);
    expect(bundle.metadata).toBeDefined();
    expect(bundle.metadata.source).toBe(accountDsl.account.aid);
    expect(bundle.metadata.scope?.aid).toBe(accountDsl.account.aid);
  });

  test('should handle export of raw events', async () => {
    // Create account
    const mnemonic = dsl.newMnemonic(new Uint8Array(32).fill(6));
    await dsl.newAccount('test-raw', mnemonic);
    const accountDsl = await dsl.account('test-raw');

    const exportDsl = await accountDsl.export();
    const rawEvents = exportDsl.asRaw();

    expect(rawEvents).toBeInstanceOf(Array);
    expect(rawEvents.length).toBeGreaterThan(0);
    expect(rawEvents[0]).toBeInstanceOf(Uint8Array);

    // Should be able to import raw events
    const kv2 = new MemoryKv();
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);

    const result = await dsl2.import().fromRaw(rawEvents);

    expect(result.imported).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });
});
