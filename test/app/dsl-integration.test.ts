/**
 * Integration tests for modular DSL system
 * Tests the complete hierarchy and graph verification
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

// Deterministic test seeds
const SEED_ISSUER = new Uint8Array(32).fill(1);
const SEED_HOLDER = new Uint8Array(32).fill(2);
const SEED_ROTATION = new Uint8Array(32).fill(3);

describe('DSL Hierarchy', () => {
  it('should chain from Kerits → Account → Registry → ACDC', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Top level: Create account
    const issuerMnemonic = dsl.newMnemonic(SEED_ISSUER);
    await dsl.newAccount('issuer', issuerMnemonic);

    // Level 1: Account DSL
    const accountDsl = await dsl.account('issuer');
    expect(accountDsl).not.toBeNull();
    expect(accountDsl!.account.alias).toBe('issuer');

    // Level 2: Registry DSL
    const registryDsl = await accountDsl!.createRegistry('health-records');
    expect(registryDsl.registry.alias).toBe('health-records');
    expect(registryDsl.account.alias).toBe('issuer');

    // Create schema
    const schemaDsl = await dsl.createSchema('health-data', {
      title: 'Health Data',
      properties: {
        bloodType: { type: 'string' },
        allergies: { type: 'string' },
      },
      required: ['bloodType'],
    });

    // Create holder
    const holderMnemonic = dsl.newMnemonic(SEED_HOLDER);
    await dsl.newAccount('holder', holderMnemonic);
    const holder = await dsl.getAccount('holder');

    // Level 3: ACDC DSL
    const acdcDsl = await registryDsl.issue({
      schema: 'health-data',
      holder: holder!.aid,
      data: {
        bloodType: 'O+',
        allergies: 'None',
      },
      alias: 'patient-123-health',
    });

    expect(acdcDsl.acdc.credentialId).toBeDefined();
    expect(acdcDsl.registry.alias).toBe('health-records');

    console.log('✓ Complete hierarchy chain works');
  });
});

describe('Registry DSL Graph Verification', () => {
  it('should show registry anchored in account KEL via ixn event', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account and registry
    const mnemonic = dsl.newMnemonic(SEED_ISSUER);
    await dsl.newAccount('issuer', mnemonic);

    const accountDsl = await dsl.account('issuer');
    await accountDsl!.createRegistry('credentials');

    // Get graph
    const graph = await accountDsl!.graph();

    // Verify IXN event created for anchoring registry
    const ixnEvents = graph.nodes.filter(n =>
      n.kind === 'KEL_EVT' && n.meta?.t === 'ixn'
    );
    expect(ixnEvents.length).toBeGreaterThanOrEqual(1);

    console.log('✓ IXN event in KEL:', ixnEvents.length);

    // Verify TEL registry node
    const registryNodes = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY');
    expect(registryNodes.length).toBeGreaterThanOrEqual(1);

    console.log('✓ Registry nodes:', registryNodes.length);

    // Verify anchor edge
    const anchorEdges = graph.edges.filter(e => e.kind === 'ANCHOR');
    expect(anchorEdges.length).toBeGreaterThanOrEqual(1);

    console.log('✓ Anchor edges:', anchorEdges.length);
  });
});

describe('Key Rotation Graph Verification', () => {
  it('should show rotation event in KEL graph', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const initialMnemonic = dsl.newMnemonic(SEED_ISSUER);
    await dsl.newAccount('alice', initialMnemonic);

    const accountDsl = await dsl.account('alice');

    // Initial graph - only inception
    let graph = await accountDsl!.graph();
    let rotEvents = graph.nodes.filter(n =>
      n.kind === 'KEL_EVT' && n.meta?.t === 'rot'
    );
    expect(rotEvents).toHaveLength(0);

    // Rotate keys
    const newMnemonic = dsl.newMnemonic(SEED_ROTATION);
    await accountDsl!.rotateKeys(newMnemonic);

    // Updated graph - should have rotation
    graph = await accountDsl!.graph();
    rotEvents = graph.nodes.filter(n =>
      n.kind === 'KEL_EVT' && n.meta?.t === 'rot'
    );
    expect(rotEvents).toHaveLength(1);

    console.log('✓ Rotation event in graph');

    // Verify prior edge links rotation to inception
    const priorEdges = graph.edges.filter(e => e.kind === 'PRIOR');
    expect(priorEdges).toHaveLength(1);

    console.log('✓ Prior edge links events');
  });
});

describe('Credential Issuance Graph Verification', () => {
  it('should show iss event in TEL after credential issuance', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create issuer and holder
    await dsl.newAccount('issuer', dsl.newMnemonic(SEED_ISSUER));
    await dsl.newAccount('holder', dsl.newMnemonic(SEED_HOLDER));

    const issuer = await dsl.getAccount('issuer');
    const holder = await dsl.getAccount('holder');

    // Create registry and schema
    const accountDsl = await dsl.account('issuer');
    const registryDsl = await accountDsl!.createRegistry('credentials');

    await dsl.createSchema('badge', {
      title: 'Badge',
      properties: { name: { type: 'string' } },
    });

    // Issue credential
    await registryDsl.issue({
      schema: 'badge',
      holder: holder!.aid,
      data: { name: 'Test Badge' },
    });

    // Get global graph
    const graph = await dsl.graph();

    // Verify ACDC node
    const acdcNodes = graph.nodes.filter(n => n.kind === 'ACDC');
    expect(acdcNodes.length).toBeGreaterThanOrEqual(1);

    console.log('✓ ACDC nodes:', acdcNodes.length);

    // Verify issuance in TEL (TEL_EVT nodes)
    const telEvents = graph.nodes.filter(n => n.kind === 'TEL_EVT');
    expect(telEvents.length).toBeGreaterThanOrEqual(1);

    console.log('✓ TEL event nodes:', telEvents.length);
  });

  it('should show complete credential flow in graph', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Setup
    await dsl.newAccount('issuer', dsl.newMnemonic(SEED_ISSUER));
    await dsl.newAccount('holder', dsl.newMnemonic(SEED_HOLDER));

    const accountDsl = await dsl.account('issuer');
    const registryDsl = await accountDsl!.createRegistry('credentials');

    await dsl.createSchema('kyc', {
      title: 'KYC',
      properties: {
        jurisdiction: { type: 'string' },
        verified: { type: 'boolean' },
      },
      required: ['jurisdiction'],
    });

    const holder = await dsl.getAccount('holder');

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      schema: 'kyc',
      holder: holder!.aid,
      data: {
        jurisdiction: 'US-CA',
        verified: true,
      },
      alias: 'holder-kyc',
    });

    // Get graph scoped to registry
    const graph = await registryDsl.graph();

    // Count node types
    const counts = {
      aids: graph.nodes.filter(n => n.kind === 'AID').length,
      kelEvents: graph.nodes.filter(n => n.kind === 'KEL_EVT').length,
      telRegistry: graph.nodes.filter(n => n.kind === 'TEL_REGISTRY').length,
      telEvents: graph.nodes.filter(n => n.kind === 'TEL_EVT').length,
      acdcs: graph.nodes.filter(n => n.kind === 'ACDC').length,
    };

    console.log('✓ Graph composition:', counts);

    expect(counts.aids).toBeGreaterThanOrEqual(2); // issuer + holder
    expect(counts.telRegistry).toBeGreaterThanOrEqual(1);
    expect(counts.acdcs).toBeGreaterThanOrEqual(1);
  });
});

describe('Contacts DSL', () => {
  it('should manage contacts (witnesses)', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const contactsDsl = dsl.contacts();

    // Add contacts
    await contactsDsl.add('witness-1', 'EWitnessAID123456789', {
      name: 'Primary Witness',
      role: 'witness',
      endpoint: 'https://witness1.example.com',
    });

    await contactsDsl.add('witness-2', 'EWitnessAID987654321', {
      name: 'Secondary Witness',
      role: 'witness',
    });

    // List contacts
    const contactNames = await contactsDsl.list();
    expect(contactNames).toHaveLength(2);
    expect(contactNames).toContain('witness-1');
    expect(contactNames).toContain('witness-2');

    console.log('✓ Added 2 contacts');

    // Get specific contact
    const witness1 = await contactsDsl.get('witness-1');
    expect(witness1).not.toBeNull();
    expect(witness1!.aid).toBe('EWitnessAID123456789');
    expect(witness1!.metadata?.name).toBe('Primary Witness');

    console.log('✓ Retrieved contact by alias');

    // Get all contacts
    const all = await contactsDsl.getAll();
    expect(all).toHaveLength(2);

    console.log('✓ Retrieved all contacts');

    // Remove contact
    await contactsDsl.remove('witness-2');
    const remaining = await contactsDsl.list();
    expect(remaining).toHaveLength(1);
    expect(remaining).not.toContain('witness-2');

    console.log('✓ Removed contact');
  });
});

describe('Schema DSL', () => {
  it('should validate data against schema', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const schemaDsl = await dsl.createSchema('user-profile', {
      title: 'User Profile',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        verified: { type: 'boolean' },
      },
      required: ['name', 'age'],
    });

    // Valid data
    expect(schemaDsl.validate({ name: 'Alice', age: 30 })).toBe(true);
    expect(schemaDsl.validate({ name: 'Bob', age: 25, verified: true })).toBe(true);

    // Invalid data - missing required field
    expect(schemaDsl.validate({ name: 'Charlie' })).toBe(false);

    // Invalid data - wrong type
    expect(schemaDsl.validate({ name: 'Dave', age: '30' })).toBe(false);

    console.log('✓ Schema validation works');
  });
});

describe('Multiple Registries', () => {
  it('should handle multiple registries per account', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    await dsl.newAccount('issuer', dsl.newMnemonic(SEED_ISSUER));
    const accountDsl = await dsl.account('issuer');

    // Create multiple registries
    await accountDsl!.createRegistry('health-records');
    await accountDsl!.createRegistry('education-credentials');
    await accountDsl!.createRegistry('employment-records');

    // List registries
    const registries = await accountDsl!.listRegistries();
    expect(registries).toHaveLength(3);
    expect(registries).toContain('health-records');
    expect(registries).toContain('education-credentials');
    expect(registries).toContain('employment-records');

    console.log('✓ Multiple registries per account');

    // Access specific registry
    const healthDsl = await accountDsl!.registry('health-records');
    expect(healthDsl).not.toBeNull();
    expect(healthDsl!.registry.alias).toBe('health-records');

    console.log('✓ Retrieved specific registry');
  });
});
