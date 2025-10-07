/**
 * Test to reproduce UI registry tree issues
 * This simulates what the UI is doing to build the tree
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { buildRegistryTree } from '../../ui/src/lib/registry-tree';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('UI Registry Tree Building', () => {
  it('should build correct tree matching actual parent relationships', async () => {
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
     *     |
     *  grand1
     */
    const root = await accountDsl!.createRegistry('root');
    console.log('Created root:', {
      alias: root.registry.alias,
      id: root.registry.registryId,
      parentId: root.registry.parentRegistryId,
    });

    const child1 = await root.createRegistry('child1');
    console.log('Created child1:', {
      alias: child1.registry.alias,
      id: child1.registry.registryId,
      parentId: child1.registry.parentRegistryId,
    });

    const child2 = await root.createRegistry('child2');
    console.log('Created child2:', {
      alias: child2.registry.alias,
      id: child2.registry.registryId,
      parentId: child2.registry.parentRegistryId,
    });

    const grand1 = await child1.createRegistry('grand1');
    console.log('Created grand1:', {
      alias: grand1.registry.alias,
      id: grand1.registry.registryId,
      parentId: grand1.registry.parentRegistryId,
    });

    // Now build the tree exactly as the UI does
    const registryAliases = await accountDsl!.listRegistries();
    console.log('\nAll registry aliases:', registryAliases);

    const tree = await buildRegistryTree(
      registryAliases,
      (alias) => accountDsl!.registry(alias)
    );

    console.log('\nBuilt tree structure:');
    const printTree = (nodes: any[], indent = '') => {
      for (const node of nodes) {
        console.log(`${indent}${node.alias} (depth: ${node.depth}, id: ${node.registryId.substring(0, 20)}..., parent: ${node.parentRegistryId?.substring(0, 20) || 'none'}...)`);
        if (node.children.length > 0) {
          printTree(node.children, indent + '  ');
        }
      }
    };
    printTree(tree);

    // Verify tree structure
    expect(tree).toHaveLength(1); // Should have 1 root
    expect(tree[0].alias).toBe('root');
    expect(tree[0].depth).toBe(0);
    expect(tree[0].parentRegistryId).toBeUndefined();

    // Check root's children
    expect(tree[0].children).toHaveLength(2);
    const rootChildren = tree[0].children.map(c => c.alias).sort();
    expect(rootChildren).toEqual(['child1', 'child2']);

    // Verify child1
    const child1Node = tree[0].children.find(c => c.alias === 'child1');
    expect(child1Node).toBeDefined();
    expect(child1Node!.depth).toBe(1);
    expect(child1Node!.parentRegistryId).toBe(root.registry.registryId);
    expect(child1Node!.children).toHaveLength(1);
    expect(child1Node!.children[0].alias).toBe('grand1');

    // Verify grand1
    const grand1Node = child1Node!.children[0];
    expect(grand1Node.depth).toBe(2);
    expect(grand1Node.parentRegistryId).toBe(child1.registry.registryId);

    // Verify child2
    const child2Node = tree[0].children.find(c => c.alias === 'child2');
    expect(child2Node).toBeDefined();
    expect(child2Node!.depth).toBe(1);
    expect(child2Node!.parentRegistryId).toBe(root.registry.registryId);
    expect(child2Node!.children).toHaveLength(0);

    console.log('\n✓ Tree structure matches actual parent relationships');
  });

  it('should preserve parent registry after creating sub-registry', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    const accountDsl = await dsl.account('test-account');

    // Create parent
    const parent = await accountDsl!.createRegistry('parent');
    const originalParentId = parent.registry.registryId;
    const originalParentAlias = parent.registry.alias;

    console.log('Before creating child - Parent:', {
      alias: parent.registry.alias,
      id: parent.registry.registryId,
    });

    // Create child
    const child = await parent.createRegistry('child');

    console.log('After creating child - Child:', {
      alias: child.registry.alias,
      id: child.registry.registryId,
      parentId: child.registry.parentRegistryId,
    });

    // Re-retrieve parent from DSL
    const parentAfter = await accountDsl!.registry('parent');

    console.log('After creating child - Parent re-retrieved:', {
      alias: parentAfter!.registry.alias,
      id: parentAfter!.registry.registryId,
      parentId: parentAfter!.registry.parentRegistryId,
    });

    // Parent should be unchanged
    expect(parentAfter!.registry.alias).toBe(originalParentAlias);
    expect(parentAfter!.registry.registryId).toBe(originalParentId);
    expect(parentAfter!.registry.parentRegistryId).toBeUndefined();

    // Child should have correct parent
    expect(child.registry.alias).toBe('child');
    expect(child.registry.registryId).not.toBe(originalParentId);
    expect(child.registry.parentRegistryId).toBe(originalParentId);

    // Build tree and verify
    const registryAliases = await accountDsl!.listRegistries();
    const tree = await buildRegistryTree(
      registryAliases,
      (alias) => accountDsl!.registry(alias)
    );

    expect(tree).toHaveLength(1);
    expect(tree[0].alias).toBe('parent');
    expect(tree[0].registryId).toBe(originalParentId);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].alias).toBe('child');
    expect(tree[0].children[0].parentRegistryId).toBe(originalParentId);

    console.log('✓ Parent registry preserved after creating child');
  });
});
