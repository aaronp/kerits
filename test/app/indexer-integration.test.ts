/**
 * Indexer Integration Tests
 * Tests the full DSL → Indexer → CLI flow
 */

import { describe, test, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl/index.js';
import { createKerStore, MemoryKv } from '../../src/storage/index.js';

const TEST_SEED_ISSUER = new Uint8Array(32).fill(1);
const TEST_SEED_HOLDER = new Uint8Array(32).fill(2);

describe('Indexer Integration', () => {
  test('full flow: create account → registry → credentials → index → explore', async () => {
    // Setup
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    // 1. Create issuer account
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('health-provider', issuerMnemonic);
    const issuerDsl = await dsl.account('health-provider');
    expect(issuerDsl).toBeDefined();

    // 2. Create holder account
    const holderMnemonic = dsl.newMnemonic(TEST_SEED_HOLDER);
    const holderAccount = await dsl.newAccount('patient', holderMnemonic);
    expect(holderAccount).toBeDefined();

    // 3. Create schema
    const schemaDsl = await dsl.createSchema('blood-pressure', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        systolic: { type: 'number' },
        diastolic: { type: 'number' },
        unit: { type: 'string' },
      },
      required: ['systolic', 'diastolic', 'unit'],
    });
    expect(schemaDsl).toBeDefined();

    // 4. Create registry
    const registryDsl = await issuerDsl!.createRegistry('health-records');
    expect(registryDsl).toBeDefined();

    // 5. Issue multiple credentials
    const cred1 = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: holderAccount.aid,
      data: { systolic: 120, diastolic: 80, unit: 'mmHg' },
    });
    expect(cred1).toBeDefined();

    const cred2 = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: holderAccount.aid,
      data: { systolic: 130, diastolic: 85, unit: 'mmHg' },
    });
    expect(cred2).toBeDefined();

    const cred3 = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: holderAccount.aid,
      data: { systolic: 125, diastolic: 82, unit: 'mmHg' },
    });
    expect(cred3).toBeDefined();

    // 6. Revoke one credential
    await cred2.revoke();

    // 7. INDEX THE REGISTRY
    const indexedRegistry = await registryDsl.index();

    // Verify registry index
    expect(indexedRegistry.credentialCount).toBe(3);
    expect(indexedRegistry.issuedCount).toBe(3);
    expect(indexedRegistry.revokedCount).toBe(1);
    expect(indexedRegistry.credentials).toHaveLength(3);

    // 8. LIST CREDENTIALS (with indexed state)
    const credentials = await registryDsl.listCredentials();
    expect(credentials).toHaveLength(3);

    // Verify credential states
    const activeCreds = credentials.filter(c => c.status === 'issued');
    const revokedCreds = credentials.filter(c => c.status === 'revoked');
    expect(activeCreds).toHaveLength(2);
    expect(revokedCreds).toHaveLength(1);

    // 9. EXPLORE SPECIFIC CREDENTIAL
    const cred1Indexed = await cred1.index();

    // Verify indexed ACDC
    expect(cred1Indexed.status).toBe('issued');
    expect(cred1Indexed.holderAid).toBe(holderAccount.aid);
    expect(cred1Indexed.latestData).toEqual({
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg',
    });

    // 10. GET LATEST DATA
    const latestData = await cred1.getLatestData();
    expect(latestData).toEqual({
      systolic: 120,
      diastolic: 80,
      unit: 'mmHg',
    });

    // 11. GET SCHEMAS
    const schemas = await cred1.getSchemas();
    expect(schemas).toHaveLength(1);
    expect(schemas[0].schemaSaid).toBe(schemaDsl.schema.schemaId);

    // 12. GET COUNTERPARTIES
    const counterparties = await cred1.getCounterparties();
    expect(counterparties.length).toBeGreaterThan(0);

    const issuer = counterparties.find(cp => cp.role === 'issuer');
    expect(issuer).toBeDefined();

    const holder = counterparties.find(cp => cp.role === 'holder');
    expect(holder).toBeDefined();
    expect(holder?.aid).toBe(holderAccount.aid);

    // 13. GET HISTORY
    const history = await cred1.getHistory();
    expect(history).toHaveLength(1); // Just issuance
    expect(history[0].eventType).toBe('iss');

    const cred2History = await cred2.getHistory();
    expect(cred2History).toHaveLength(2); // Issuance + revocation
    expect(cred2History[0].eventType).toBe('iss');
    expect(cred2History[1].eventType).toBe('rev');

    // 14. VERIFY TREE NAVIGATION DATA
    // Simulate CLI tree navigation:
    // Registry → Credential → Schema → Fields

    console.log('\n📋 Tree Navigation Simulation:');
    console.log('\nRegistry: health-records');
    console.log(`├── Credentials: ${indexedRegistry.credentialCount}`);
    console.log(`├── Issued: ${indexedRegistry.issuedCount}`);
    console.log(`└── Revoked: ${indexedRegistry.revokedCount}`);

    for (const cred of credentials) {
      console.log(`\n  Credential: ${cred.credentialId.substring(0, 16)}...`);
      console.log(`  ├── Status: ${cred.status}`);
      console.log(`  ├── Issued: ${new Date(cred.issuedAt).toISOString()}`);
      console.log(`  ├── Schemas:`);
      for (const schema of cred.schemas) {
        console.log(`  │   └── ${schema.schemaSaid.substring(0, 16)}...`);
      }
      console.log(`  └── Data:`);
      for (const [key, value] of Object.entries(cred.latestData)) {
        console.log(`      ├── ${key}: ${value}`);
      }
    }

    console.log('\n✅ Full tree navigation successful!\n');
  });

  test('indexer handles empty registry', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    const registryDsl = await issuerDsl!.createRegistry('empty-registry');

    // Index empty registry
    const indexed = await registryDsl.index();

    expect(indexed.credentialCount).toBe(0);
    expect(indexed.issuedCount).toBe(0);
    expect(indexed.revokedCount).toBe(0);
    expect(indexed.credentials).toHaveLength(0);

    // List credentials should also be empty
    const credentials = await registryDsl.listCredentials();
    expect(credentials).toHaveLength(0);
  });

  test('indexer tracks credential lifecycle', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    // Setup
    const issuerMnemonic = dsl.newMnemonic(TEST_SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);
    const issuerDsl = await dsl.account('issuer');

    const schemaDsl = await dsl.createSchema('test', {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: { value: { type: 'number' } },
    });

    const registryDsl = await issuerDsl!.createRegistry('test-registry');

    // Issue credential
    const acdc = await registryDsl.issue({
      schema: schemaDsl.schema.schemaId,
      holder: issuerDsl!.account.aid, // Self-signed
      data: { value: 42 },
    });

    // Check initial state
    let indexed = await acdc.index();
    expect(indexed.status).toBe('issued');
    expect(indexed.revokedAt).toBeUndefined();

    let history = await acdc.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].eventType).toBe('iss');

    // Revoke credential
    await acdc.revoke();

    // Check updated state
    indexed = await acdc.index();
    expect(indexed.status).toBe('revoked');
    expect(indexed.revokedAt).toBeDefined();

    history = await acdc.getHistory();
    expect(history).toHaveLength(2);
    expect(history[1].eventType).toBe('rev');

    // Registry stats should reflect revocation
    const registryIndexed = await registryDsl.index();
    expect(registryIndexed.revokedCount).toBe(1);
  });
});
