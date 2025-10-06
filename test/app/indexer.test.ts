/**
 * TEL Indexer Tests
 */

import { describe, test, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl/index.js';
import { createKerStore, MemoryKv } from '../../src/storage/index.js';
import { TELIndexer } from '../../src/app/indexer/index.js';

// Deterministic test seeds
const TEST_SEED_ISSUER = new Uint8Array(32).fill(1);
const TEST_SEED_HOLDER = new Uint8Array(32).fill(2);

describe('TELIndexer', () => {
  test('should index empty registry', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Create issuer account
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    // Create registry
    const registryDsl = await issuerDsl!.createRegistry('test-registry');
    const registry = registryDsl.registry;

    // Index empty registry
    const indexed = await indexer.indexRegistry(registry.registryId);

    expect(indexed.registryId).toBe(registry.registryId);
    expect(indexed.issuerAid).toBeDefined();
    expect(indexed.credentialCount).toBe(0);
    expect(indexed.issuedCount).toBe(0);
    expect(indexed.revokedCount).toBe(0);
    expect(indexed.credentials).toHaveLength(0);
  });

  test('should index registry with single credential', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Create accounts
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    const holderMnemonic = dsl.newMnemonic(TEST_SEED_HOLDER);
    const holderAccount = await dsl.newAccount('holder', holderMnemonic);

    // Create schema
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    });
    const schema = schemaDsl.schema;

    // Create registry and issue credential
    const registryDsl = await issuerDsl!.createRegistry('health-records');
    const acdcDsl = await registryDsl.issue({
      schema: schema.schemaId,
      holder: holderAccount.aid,
      data: { name: 'Alice', age: 30 },
    });

    // Index registry
    const indexed = await indexer.indexRegistry(registryDsl.registry.registryId);

    expect(indexed.credentialCount).toBe(1);
    expect(indexed.issuedCount).toBe(1);
    expect(indexed.revokedCount).toBe(0);
    expect(indexed.credentials).toHaveLength(1);

    const indexedCred = indexed.credentials[0];
    expect(indexedCred.credentialId).toBe(acdcDsl.acdc.credentialId);
    expect(indexedCred.status).toBe('issued');
    expect(indexedCred.holderAid).toBe(holderAccount.aid);
    expect(indexedCred.latestData).toEqual({ name: 'Alice', age: 30 });
    expect(indexedCred.schemas).toHaveLength(1);
    expect(indexedCred.schemas[0].schemaSaid).toBe(schema.schemaId);
  });

  test('should track credential revocation', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Create issuer
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    // Create schema
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create registry, issue, and revoke
    const registryDsl = await issuerDsl!.createRegistry('test-registry');
    const acdcDsl = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: issuerDsl!.account.aid, // Self-signed
      data: { name: 'Bob' },
    });

    await acdcDsl.revoke();

    // Index registry
    const indexed = await indexer.indexRegistry(registryDsl.registry.registryId);

    expect(indexed.credentialCount).toBe(1);
    expect(indexed.issuedCount).toBe(1);
    expect(indexed.revokedCount).toBe(1);

    const indexedCred = indexed.credentials[0];
    expect(indexedCred.status).toBe('revoked');
    expect(indexedCred.revokedAt).toBeDefined();
    expect(indexedCred.revocationEventSaid).toBeDefined();
    expect(indexedCred.telEvents).toHaveLength(2);
    expect(indexedCred.telEvents[0].eventType).toBe('iss');
    expect(indexedCred.telEvents[1].eventType).toBe('rev');
  });

  test('should track multiple credentials', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Create issuer
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    // Create schema
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'number' },
      },
    });

    // Create registry
    const registryDsl = await issuerDsl!.createRegistry('multi-registry');

    // Issue multiple credentials
    const acdc1 = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: issuerDsl!.account.aid, // Self-signed
      data: { name: 'First', value: 100 },
    });

    const acdc2 = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: issuerDsl!.account.aid, // Self-signed
      data: { name: 'Second', value: 200 },
    });

    // Index registry
    const indexed = await indexer.indexRegistry(registryDsl.registry.registryId);

    expect(indexed.credentialCount).toBe(2);
    expect(indexed.issuedCount).toBe(2);
    expect(indexed.revokedCount).toBe(0);
    expect(indexed.credentials).toHaveLength(2);

    const cred1 = indexed.credentials.find(c => c.credentialId === acdc1.acdc.credentialId);
    expect(cred1).toBeDefined();
    expect(cred1!.latestData).toEqual({ name: 'First', value: 100 });

    const cred2 = indexed.credentials.find(c => c.credentialId === acdc2.acdc.credentialId);
    expect(cred2).toBeDefined();
    expect(cred2!.latestData).toEqual({ name: 'Second', value: 200 });
  });

  test('should index specific ACDC', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Setup
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    const holderMnemonic = dsl.newMnemonic(TEST_SEED_HOLDER);
    const holderAccount = await dsl.newAccount('holder', holderMnemonic);

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { test: { type: 'string' } },
    });

    const registryDsl = await issuerDsl!.createRegistry('test-registry');
    const acdcDsl = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: holderAccount.aid,
      data: { test: 'value' },
    });

    // Index specific ACDC
    const indexed = await indexer.indexACDC(
      acdcDsl.acdc.credentialId,
      registryDsl.registry.registryId
    );

    expect(indexed.credentialId).toBe(acdcDsl.acdc.credentialId);
    expect(indexed.status).toBe('issued');
    expect(indexed.holderAid).toBe(holderAccount.aid);
    expect(indexed.counterparties.length).toBeGreaterThan(0);
  });

  test('should throw error for non-existent registry', async () => {
    const store = createKerStore(new MemoryKv());
    const indexer = new TELIndexer(store);

    await expect(
      indexer.indexRegistry('EInvalidRegistry123')
    ).rejects.toThrow('no inception event');
  });

  test('should throw error for non-existent ACDC', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);
    const indexer = new TELIndexer(store);

    // Create empty registry
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');
    const registryDsl = await issuerDsl!.createRegistry('test-registry');

    await expect(
      indexer.indexACDC('EInvalidACDC123', registryDsl.registry.registryId)
    ).rejects.toThrow('not found in registry');
  });
});
