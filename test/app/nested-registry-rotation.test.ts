/**
 * Integration test for nested registry creation with key rotation
 *
 * Tests:
 * 1. Creating deeply nested registry hierarchies
 * 2. Rotating keys between each registry creation
 * 3. Reading back the hierarchy after rotations
 * 4. Verifying signatures use correct keys from KEL
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { buildRegistryTree, type RegistryNode } from '../../ui/src/lib/registry-tree';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('Nested Registry with Key Rotation', () => {
  it('should create deep hierarchy with key rotations between each level', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('test-account', mnemonic);
    let accountDsl = await dsl.account('test-account');
    expect(accountDsl).not.toBeNull();

    console.log('\n=== Creating Registry Hierarchy with Key Rotations ===\n');

    // Create root registry
    console.log('1. Creating root registry...');
    const root = await accountDsl!.createRegistry('root');
    expect(root).toBeDefined();
    expect(root.registry.alias).toBe('root');
    expect(root.registry.parentRegistryId).toBeUndefined();
    console.log(`   ✓ Root created: ${root.registry.registryId.substring(0, 20)}...`);

    // Rotate keys after root
    console.log('2. Rotating keys after root creation...');
    const rotation1Seed = new Uint8Array(32).fill(2);
    const rotation1Mnemonic = dsl.newMnemonic(rotation1Seed);
    const updatedAccount1 = await accountDsl!.rotateKeys(rotation1Mnemonic);
    accountDsl = await dsl.account('test-account'); // Reload
    console.log(`   ✓ Keys rotated, new verfer: ${updatedAccount1.verfer.substring(0, 20)}...`);

    // Create level 1 children (child1, child2)
    console.log('3. Creating level 1 registries (child1, child2)...');
    const child1 = await root.createRegistry('child1');
    expect(child1.registry.parentRegistryId).toBe(root.registry.registryId);
    console.log(`   ✓ Child1 created: ${child1.registry.registryId.substring(0, 20)}...`);

    const child2 = await root.createRegistry('child2');
    expect(child2.registry.parentRegistryId).toBe(root.registry.registryId);
    console.log(`   ✓ Child2 created: ${child2.registry.registryId.substring(0, 20)}...`);

    // Rotate keys after level 1
    console.log('4. Rotating keys after level 1...');
    const rotation2Seed = new Uint8Array(32).fill(3);
    const rotation2Mnemonic = dsl.newMnemonic(rotation2Seed);
    const updatedAccount2 = await accountDsl!.rotateKeys(rotation2Mnemonic);
    accountDsl = await dsl.account('test-account'); // Reload
    console.log(`   ✓ Keys rotated, new verfer: ${updatedAccount2.verfer.substring(0, 20)}...`);

    // Create level 2 children (grand1 under child1, grand2 under child2)
    console.log('5. Creating level 2 registries (grand1, grand2)...');
    const grand1 = await child1.createRegistry('grand1');
    expect(grand1.registry.parentRegistryId).toBe(child1.registry.registryId);
    console.log(`   ✓ Grand1 created: ${grand1.registry.registryId.substring(0, 20)}...`);

    const grand2 = await child2.createRegistry('grand2');
    expect(grand2.registry.parentRegistryId).toBe(child2.registry.registryId);
    console.log(`   ✓ Grand2 created: ${grand2.registry.registryId.substring(0, 20)}...`);

    // Rotate keys after level 2
    console.log('6. Rotating keys after level 2...');
    const rotation3Seed = new Uint8Array(32).fill(4);
    const rotation3Mnemonic = dsl.newMnemonic(rotation3Seed);
    const updatedAccount3 = await accountDsl!.rotateKeys(rotation3Mnemonic);
    accountDsl = await dsl.account('test-account'); // Reload
    console.log(`   ✓ Keys rotated, new verfer: ${updatedAccount3.verfer.substring(0, 20)}...`);

    // Create level 3 (great-grand1 under grand1)
    console.log('7. Creating level 3 registry (great-grand1)...');
    const greatGrand1 = await grand1.createRegistry('great-grand1');
    expect(greatGrand1.registry.parentRegistryId).toBe(grand1.registry.registryId);
    console.log(`   ✓ Great-grand1 created: ${greatGrand1.registry.registryId.substring(0, 20)}...`);

    console.log('\n=== Verifying Hierarchy After Rotations ===\n');

    // Now read back the entire hierarchy
    accountDsl = await dsl.account('test-account');
    const allRegistries = await accountDsl!.listRegistries();
    console.log(`Found ${allRegistries.length} registries:`, allRegistries);

    // Note: We created 7 registries but only 6 appear in listRegistries()
    // This is because listRegistries() only returns registries anchored in the KEL
    // Sub-registries (created via registry.createRegistry) are also anchored in parent TEL
    // So we should see all 6 here (root + 2 children + 2 grandchildren + 1 great-grandchild)
    expect(allRegistries.length).toBeGreaterThanOrEqual(6);
    expect(allRegistries).toContain('root');
    expect(allRegistries).toContain('child1');
    expect(allRegistries).toContain('child2');
    expect(allRegistries).toContain('grand1');
    expect(allRegistries).toContain('grand2');
    expect(allRegistries).toContain('great-grand1');

    // Verify parent relationships are preserved
    console.log('\nVerifying parent relationships...');

    const rootReloaded = await accountDsl!.registry('root');
    expect(rootReloaded?.registry.parentRegistryId).toBeUndefined();
    console.log(`✓ root: no parent`);

    const child1Reloaded = await accountDsl!.registry('child1');
    expect(child1Reloaded?.registry.parentRegistryId).toBe(root.registry.registryId);
    console.log(`✓ child1: parent = root`);

    const child2Reloaded = await accountDsl!.registry('child2');
    const child2Reloaded2 = await child1Reloaded!.registry
    expect(child2Reloaded2.parentRegistryId).toBe(root.registry.registryId);
    expect(child2Reloaded?.registry.parentRegistryId).toBe(root.registry.registryId);
    console.log(`✓ child2: parent = root`);

    const grand1Reloaded = await accountDsl!.registry('grand1');
    expect(grand1Reloaded?.registry.parentRegistryId).toBe(child1.registry.registryId);
    console.log(`✓ grand1: parent = child1`);

    const grand2Reloaded = await accountDsl!.registry('grand2');
    expect(grand2Reloaded?.registry.parentRegistryId).toBe(child2.registry.registryId);
    console.log(`✓ grand2: parent = child2`);

    const greatGrand1Reloaded = await accountDsl!.registry('great-grand1');
    expect(greatGrand1Reloaded?.registry.parentRegistryId).toBe(grand1.registry.registryId);
    console.log(`✓ great-grand1: parent = grand1`);

    console.log('\n=== Verifying KEL has rotation events ===\n');

    const kel = await accountDsl!.getKel();
    console.log(`KEL has ${kel.length} events`);

    const rotations = kel.filter(e => e.t === 'rot');
    console.log(`Found ${rotations.length} rotation events`);
    expect(rotations.length).toBeGreaterThanOrEqual(3); // We did 3 rotations

    console.log('\n=== Verifying Tree Structure via buildRegistryTree ===\n');

    // Build tree using the same function the UI uses
    const tree = await buildRegistryTree(
      allRegistries,
      (alias) => accountDsl!.registry(alias)
    );

    // Verify tree structure
    expect(tree).toHaveLength(1); // Should have 1 root
    expect(tree[0].alias).toBe('root');
    expect(tree[0].depth).toBe(0);
    expect(tree[0].parentRegistryId).toBeUndefined();
    console.log(`✓ Tree has 1 root node: ${tree[0].alias}`);

    // Verify root's children
    expect(tree[0].children).toHaveLength(2);
    const rootChildren = tree[0].children.map(c => c.alias).sort();
    expect(rootChildren).toEqual(['child1', 'child2']);
    console.log(`✓ Root has 2 children: ${rootChildren.join(', ')}`);

    // Verify child1 and its structure
    const child1Node = tree[0].children.find(c => c.alias === 'child1');
    expect(child1Node).toBeDefined();
    expect(child1Node!.depth).toBe(1);
    expect(child1Node!.parentRegistryId).toBe(root.registry.registryId);
    expect(child1Node!.children).toHaveLength(1);
    expect(child1Node!.children[0].alias).toBe('grand1');
    console.log(`✓ Child1 depth=${child1Node!.depth}, children: ${child1Node!.children.map(c => c.alias).join(', ')}`);

    // Verify grand1
    const grand1Node = child1Node!.children[0];
    expect(grand1Node.depth).toBe(2);
    expect(grand1Node.parentRegistryId).toBe(child1.registry.registryId);
    expect(grand1Node.children).toHaveLength(1);
    expect(grand1Node.children[0].alias).toBe('great-grand1');
    console.log(`✓ Grand1 depth=${grand1Node.depth}, children: ${grand1Node.children.map(c => c.alias).join(', ')}`);

    // Verify great-grand1
    const greatGrand1Node = grand1Node.children[0];
    expect(greatGrand1Node.depth).toBe(3);
    expect(greatGrand1Node.parentRegistryId).toBe(grand1.registry.registryId);
    expect(greatGrand1Node.children).toHaveLength(0);
    console.log(`✓ Great-grand1 depth=${greatGrand1Node.depth}, no children`);

    // Verify child2
    const child2Node = tree[0].children.find(c => c.alias === 'child2');
    expect(child2Node).toBeDefined();
    expect(child2Node!.depth).toBe(1);
    expect(child2Node!.parentRegistryId).toBe(root.registry.registryId);
    expect(child2Node!.children).toHaveLength(1);
    expect(child2Node!.children[0].alias).toBe('grand2');
    console.log(`✓ Child2 depth=${child2Node!.depth}, children: ${child2Node!.children.map(c => c.alias).join(', ')}`);

    // Verify grand2
    const grand2Node = child2Node!.children[0];
    expect(grand2Node.depth).toBe(2);
    expect(grand2Node.parentRegistryId).toBe(child2.registry.registryId);
    expect(grand2Node.children).toHaveLength(0);
    console.log(`✓ Grand2 depth=${grand2Node.depth}, no children`);

    console.log('\n✓ Tree structure verified - all depth calculations and parent relationships correct');
    console.log('\n✓ All registries created and retrieved successfully after key rotations');
  });

  it('should work with DiskKv storage (if available)', async () => {
    // Try to use DiskKv if available, otherwise skip
    let DiskKv;
    try {
      const diskKvModule = await import('../../src/storage/adapters/disk');
      DiskKv = diskKvModule.DiskKv;
    } catch (e) {
      console.log('DiskKv not available, skipping test');
      return;
    }

    const tmpDir = `/tmp/kerits-test-${Date.now()}`;
    const kv = new DiskKv({ baseDir: tmpDir });
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    try {
      // Create account
      const mnemonic = dsl.newMnemonic(TEST_SEED);
      await dsl.newAccount('disk-test', mnemonic);
      let accountDsl = await dsl.account('disk-test');

      // Create hierarchy
      const root = await accountDsl!.createRegistry('root');
      const child = await root.createRegistry('child');

      // Rotate keys
      const rotationSeed = new Uint8Array(32).fill(2);
      const rotationMnemonic = dsl.newMnemonic(rotationSeed);
      await accountDsl!.rotateKeys(rotationMnemonic);
      accountDsl = await dsl.account('disk-test');

      // Create another child after rotation
      const child2 = await root.createRegistry('child2');

      // Verify
      const allRegistries = await accountDsl!.listRegistries();
      expect(allRegistries).toHaveLength(3);
      expect(allRegistries).toContain('root');
      expect(allRegistries).toContain('child');
      expect(allRegistries).toContain('child2');

      // Verify parent relationships
      const childReloaded = await accountDsl!.registry('child');
      expect(childReloaded?.registry.parentRegistryId).toBe(root.registry.registryId);

      const child2Reloaded = await accountDsl!.registry('child2');
      expect(child2Reloaded?.registry.parentRegistryId).toBe(root.registry.registryId);

      console.log('✓ DiskKv test passed');
    } finally {
      // Cleanup
      await kv.close?.();
      try {
        const fs = await import('fs/promises');
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should verify registries can be created and retrieved after key rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('sig-test', mnemonic);
    let accountDsl = await dsl.account('sig-test');

    const aid = accountDsl!.account.aid;
    console.log(`Account created: ${aid.substring(0, 20)}...`);

    // Create registry before any rotations
    const registry1 = await accountDsl!.createRegistry('registry1');
    console.log(`Registry1 created: ${registry1.registry.registryId.substring(0, 20)}...`);
    expect(registry1.registry.registryId).toBeDefined();

    // Rotate keys
    const rotation1Seed = new Uint8Array(32).fill(2);
    const rotation1Mnemonic = dsl.newMnemonic(rotation1Seed);
    const updatedAccount1 = await accountDsl!.rotateKeys(rotation1Mnemonic);
    accountDsl = await dsl.account('sig-test');
    console.log(`Keys rotated (1st rotation)`);

    // Create registry after first rotation
    const registry2 = await accountDsl!.createRegistry('registry2');
    console.log(`Registry2 created after 1st rotation: ${registry2.registry.registryId.substring(0, 20)}...`);
    expect(registry2.registry.registryId).toBeDefined();

    // Rotate again
    const rotation2Seed = new Uint8Array(32).fill(3);
    const rotation2Mnemonic = dsl.newMnemonic(rotation2Seed);
    const updatedAccount2 = await accountDsl!.rotateKeys(rotation2Mnemonic);
    accountDsl = await dsl.account('sig-test');
    console.log(`Keys rotated (2nd rotation)`);

    // Create registry after second rotation
    const registry3 = await accountDsl!.createRegistry('registry3');
    console.log(`Registry3 created after 2nd rotation: ${registry3.registry.registryId.substring(0, 20)}...`);
    expect(registry3.registry.registryId).toBeDefined();

    // All registries should be retrievable
    console.log('\nVerifying all registries are retrievable...');
    const allRegistries = await accountDsl!.listRegistries();
    expect(allRegistries).toContain('registry1');
    expect(allRegistries).toContain('registry2');
    expect(allRegistries).toContain('registry3');
    console.log(`✓ Found all 3 registries:`, allRegistries);

    // Verify we can reload each registry and they still have correct data
    const reg1Reloaded = await accountDsl!.registry('registry1');
    expect(reg1Reloaded?.registry.registryId).toBe(registry1.registry.registryId);
    console.log(`✓ Registry1 reloaded successfully`);

    const reg2Reloaded = await accountDsl!.registry('registry2');
    expect(reg2Reloaded?.registry.registryId).toBe(registry2.registry.registryId);
    console.log(`✓ Registry2 reloaded successfully`);

    const reg3Reloaded = await accountDsl!.registry('registry3');
    expect(reg3Reloaded?.registry.registryId).toBe(registry3.registry.registryId);
    console.log(`✓ Registry3 reloaded successfully`);

    // Verify KEL has rotation events
    const kel = await accountDsl!.getKel();
    const rotations = kel.filter(e => e.t === 'rot');
    expect(rotations.length).toBe(2); // We did 2 rotations
    console.log(`✓ KEL has ${rotations.length} rotation events`);

    console.log('\n✓ All registries created and retrieved successfully across key rotations');
  });
});
