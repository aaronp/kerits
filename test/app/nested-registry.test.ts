/**
 * Tests for nested registry (TEL) creation
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('Nested Registry Creation', () => {
  it('should create top-level registry', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');
    expect(accountDsl).toBeDefined();

    // Create top-level registry
    const registryDsl = await accountDsl!.createRegistry('top-level-registry');

    expect(registryDsl.registry.alias).toBe('top-level-registry');
    expect(registryDsl.registry.registryId).toBeDefined();
    expect(registryDsl.registry.parentRegistryId).toBeUndefined();

    console.log('✓ Created top-level registry:', {
      alias: registryDsl.registry.alias,
      id: registryDsl.registry.registryId,
      parentId: registryDsl.registry.parentRegistryId,
    });
  });

  it('should create nested sub-registry', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create top-level registry
    const parentRegistry = await accountDsl!.createRegistry('parent-registry');
    console.log('✓ Created parent registry:', {
      alias: parentRegistry.registry.alias,
      id: parentRegistry.registry.registryId,
    });

    // Create nested sub-registry
    const subRegistry = await parentRegistry.createRegistry('sub-registry');

    console.log('✓ Created sub-registry:', {
      alias: subRegistry.registry.alias,
      id: subRegistry.registry.registryId,
      parentId: subRegistry.registry.parentRegistryId,
    });

    // Verify sub-registry has correct parent
    expect(subRegistry.registry.alias).toBe('sub-registry');
    expect(subRegistry.registry.registryId).toBeDefined();
    expect(subRegistry.registry.parentRegistryId).toBe(parentRegistry.registry.registryId);
    expect(subRegistry.registry.registryId).not.toBe(parentRegistry.registry.registryId);
  });

  it('should list all registries including nested ones', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create parent registry
    const parent = await accountDsl!.createRegistry('parent');

    // Create two sub-registries
    await parent.createRegistry('sub-a');
    await parent.createRegistry('sub-b');

    // List all registries
    const registries = await accountDsl!.listRegistries();
    console.log('✓ Listed registries:', registries);

    // Should have parent + 2 children = 3 total
    expect(registries).toHaveLength(3);
    expect(registries).toContain('parent');
    expect(registries).toContain('sub-a');
    expect(registries).toContain('sub-b');
  });

  it('should retrieve nested registry by alias', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create parent and sub-registry
    const parent = await accountDsl!.createRegistry('parent');
    const sub = await parent.createRegistry('nested-child');

    // Retrieve the sub-registry by alias
    const retrieved = await accountDsl!.registry('nested-child');

    expect(retrieved).toBeDefined();
    expect(retrieved!.registry.alias).toBe('nested-child');
    expect(retrieved!.registry.registryId).toBe(sub.registry.registryId);
    expect(retrieved!.registry.parentRegistryId).toBe(parent.registry.registryId);

    console.log('✓ Retrieved nested registry by alias:', {
      alias: retrieved!.registry.alias,
      id: retrieved!.registry.registryId,
      parentId: retrieved!.registry.parentRegistryId,
    });
  });

  it('should not rename parent when creating sub-registry', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create parent registry
    const parent = await accountDsl!.createRegistry('original-parent-name');
    const originalParentId = parent.registry.registryId;

    console.log('Before creating sub-registry - Parent:', {
      alias: parent.registry.alias,
      id: parent.registry.registryId,
    });

    // Create sub-registry
    const sub = await parent.createRegistry('child-name');

    console.log('After creating sub-registry - Sub:', {
      alias: sub.registry.alias,
      id: sub.registry.registryId,
      parentId: sub.registry.parentRegistryId,
    });

    // Re-retrieve parent to verify it wasn't renamed
    const parentAfter = await accountDsl!.registry('original-parent-name');

    console.log('After creating sub-registry - Parent retrieved:', {
      alias: parentAfter!.registry.alias,
      id: parentAfter!.registry.registryId,
    });

    // Parent should still have original name and ID
    expect(parentAfter).toBeDefined();
    expect(parentAfter!.registry.alias).toBe('original-parent-name');
    expect(parentAfter!.registry.registryId).toBe(originalParentId);

    // Sub should have different name and ID, with correct parent
    expect(sub.registry.alias).toBe('child-name');
    expect(sub.registry.registryId).not.toBe(originalParentId);
    expect(sub.registry.parentRegistryId).toBe(originalParentId);
  });
});
