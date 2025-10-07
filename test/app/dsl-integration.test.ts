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

  it('should store and retrieve schema with all fields', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create schema with title, description, and properties
    const schemaDsl = await dsl.createSchema('employee', {
      title: 'Employee Record',
      description: 'Schema for employee information',
      properties: {
        name: { type: 'string' },
        department: { type: 'string' },
        salary: { type: 'number' },
      },
      required: ['name', 'department'],
    });

    expect(schemaDsl.schema.schema.title).toBe('Employee Record');
    expect(schemaDsl.schema.schema.description).toBe('Schema for employee information');
    expect(Object.keys(schemaDsl.schema.schema.properties).length).toBe(3);

    // Retrieve schema by alias
    const retrievedSchemaDsl = await dsl.schema('employee');
    expect(retrievedSchemaDsl).not.toBeNull();

    // Verify retrieved schema has all fields
    expect(retrievedSchemaDsl!.schema.schema.title).toBe('Employee Record');
    expect(retrievedSchemaDsl!.schema.schema.description).toBe('Schema for employee information');
    expect(retrievedSchemaDsl!.schema.schema.properties).toEqual({
      name: { type: 'string' },
      department: { type: 'string' },
      salary: { type: 'number' },
    });
    expect(retrievedSchemaDsl!.schema.schema.required).toEqual(['name', 'department']);

    console.log('✓ Schema stored and retrieved with all fields');
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
