/**
 * Tests for registry hierarchy traversal and depth calculation
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('Registry Hierarchy and Depth', () => {
  it('should correctly calculate depth by traversing parent chain', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create hierarchy: root -> child1 -> grandchild1
    const root = await accountDsl!.createRegistry('root');
    const child1 = await root.createRegistry('child1');
    const grandchild1 = await child1.createRegistry('grandchild1');

    console.log('Created hierarchy:', {
      root: { id: root.registry.registryId, parent: root.registry.parentRegistryId },
      child1: { id: child1.registry.registryId, parent: child1.registry.parentRegistryId },
      grandchild1: { id: grandchild1.registry.registryId, parent: grandchild1.registry.parentRegistryId },
    });

    // Verify parent relationships
    expect(root.registry.parentRegistryId).toBeUndefined();
    expect(child1.registry.parentRegistryId).toBe(root.registry.registryId);
    expect(grandchild1.registry.parentRegistryId).toBe(child1.registry.registryId);

    // Retrieve and verify relationships are preserved
    const rootRetrieved = await accountDsl!.registry('root');
    const child1Retrieved = await accountDsl!.registry('child1');
    const grandchild1Retrieved = await accountDsl!.registry('grandchild1');

    expect(rootRetrieved!.registry.parentRegistryId).toBeUndefined();
    expect(child1Retrieved!.registry.parentRegistryId).toBe(root.registry.registryId);
    expect(grandchild1Retrieved!.registry.parentRegistryId).toBe(child1.registry.registryId);

    console.log('✓ Parent relationships preserved after retrieval');
  });

  it('should build correct tree structure with multiple branches', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    /**
     * Create tree:
     *        root
     *       /    \
     *   child1  child2
     *     |       |
     * grand1   grand2
     */
    const root = await accountDsl!.createRegistry('root');
    const child1 = await root.createRegistry('child1');
    const child2 = await root.createRegistry('child2');
    const grand1 = await child1.createRegistry('grand1');
    const grand2 = await child2.createRegistry('grand2');

    // Verify structure
    expect(child1.registry.parentRegistryId).toBe(root.registry.registryId);
    expect(child2.registry.parentRegistryId).toBe(root.registry.registryId);
    expect(grand1.registry.parentRegistryId).toBe(child1.registry.registryId);
    expect(grand2.registry.parentRegistryId).toBe(child2.registry.registryId);

    // List all registries
    const allRegistries = await accountDsl!.listRegistries();
    expect(allRegistries).toHaveLength(5);
    expect(allRegistries).toContain('root');
    expect(allRegistries).toContain('child1');
    expect(allRegistries).toContain('child2');
    expect(allRegistries).toContain('grand1');
    expect(allRegistries).toContain('grand2');

    console.log('✓ Multi-branch tree structure correct');
  });

  it('should calculate correct depth by traversing parent chain', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create deep hierarchy: level0 -> level1 -> level2 -> level3 -> level4
    const level0 = await accountDsl!.createRegistry('level0');
    const level1 = await level0.createRegistry('level1');
    const level2 = await level1.createRegistry('level2');
    const level3 = await level2.createRegistry('level3');
    const level4 = await level3.createRegistry('level4');

    // Function to calculate depth by traversing parent chain
    async function calculateDepth(registryAlias: string): Promise<number> {
      let depth = 0;
      let currentAlias = registryAlias;

      while (true) {
        const reg = await accountDsl!.registry(currentAlias);
        if (!reg) break;

        if (!reg.registry.parentRegistryId) {
          // Reached root (no parent)
          break;
        }

        depth++;

        // Find parent alias by looking up parent registry ID
        const allAliases = await accountDsl!.listRegistries();
        let parentAlias: string | null = null;
        for (const alias of allAliases) {
          const candidate = await accountDsl!.registry(alias);
          if (candidate?.registry.registryId === reg.registry.parentRegistryId) {
            parentAlias = alias;
            break;
          }
        }

        if (!parentAlias) break;
        currentAlias = parentAlias;
      }

      return depth;
    }

    const depth0 = await calculateDepth('level0');
    const depth1 = await calculateDepth('level1');
    const depth2 = await calculateDepth('level2');
    const depth3 = await calculateDepth('level3');
    const depth4 = await calculateDepth('level4');

    console.log('Calculated depths:', { depth0, depth1, depth2, depth3, depth4 });

    expect(depth0).toBe(0); // Root has depth 0
    expect(depth1).toBe(1);
    expect(depth2).toBe(2);
    expect(depth3).toBe(3);
    expect(depth4).toBe(4);

    console.log('✓ Depth calculation correct');
  });

  it('should handle creating siblings at the same level', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create parent with 3 children
    const parent = await accountDsl!.createRegistry('parent');
    const sibling1 = await parent.createRegistry('sibling1');
    const sibling2 = await parent.createRegistry('sibling2');
    const sibling3 = await parent.createRegistry('sibling3');

    // All siblings should have same parent
    expect(sibling1.registry.parentRegistryId).toBe(parent.registry.registryId);
    expect(sibling2.registry.parentRegistryId).toBe(parent.registry.registryId);
    expect(sibling3.registry.parentRegistryId).toBe(parent.registry.registryId);

    // All siblings should have different IDs
    expect(sibling1.registry.registryId).not.toBe(sibling2.registry.registryId);
    expect(sibling1.registry.registryId).not.toBe(sibling3.registry.registryId);
    expect(sibling2.registry.registryId).not.toBe(sibling3.registry.registryId);

    console.log('✓ Siblings created correctly');
  });
});
