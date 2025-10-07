/**
 * Test KEL-based registry discovery via seals
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('KEL Registry Seals', () => {
  it('should find registries from KEL seals', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('alice', mnemonic);
    const account = await dsl.account('alice');
    expect(account).toBeDefined();

    console.log('Created account with AID:', account!.account.aid);

    // Create first registry
    const registry1 = await account!.createRegistry('registry-one');
    console.log('Created registry 1:', registry1.registry.registryId);

    // Create second registry
    const registry2 = await account!.createRegistry('registry-two');
    console.log('Created registry 2:', registry2.registry.registryId);

    // List registries - should find both via KEL seals
    const registryAliases = await account!.listRegistries();
    console.log('Found registries:', registryAliases);

    expect(registryAliases.length).toBe(2);
    expect(registryAliases).toContain('registry-one');
    expect(registryAliases).toContain('registry-two');

    // Check KEL contains IXN events with seals
    const kel = await account!.getKel();
    console.log(`KEL has ${kel.length} events`);

    const ixnEvents = kel.filter(e => e.t === 'ixn');
    console.log(`KEL has ${ixnEvents.length} IXN events`);

    expect(ixnEvents.length).toBe(2); // One IXN per registry

    console.log('✓ Registries discoverable via KEL seals');
  });

  it('should find nested registries from KEL seals', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('bob', mnemonic);
    const account = await dsl.account('bob');
    expect(account).toBeDefined();

    // Create parent registry
    const parent = await account!.createRegistry('parent');
    console.log('Created parent registry:', parent.registry.registryId);

    // Create nested registry
    const child = await account!.createRegistry('child', {
      parentRegistryId: parent.registry.registryId,
    });
    console.log('Created child registry:', child.registry.registryId);

    // List registries - should find both via KEL seals
    const registryAliases = await account!.listRegistries();
    console.log('Found registries:', registryAliases);

    expect(registryAliases.length).toBe(2);
    expect(registryAliases).toContain('parent');
    expect(registryAliases).toContain('child');

    // Check KEL contains IXN events for BOTH registries
    const kel = await account!.getKel();
    const ixnEvents = kel.filter(e => e.t === 'ixn');
    console.log(`KEL has ${ixnEvents.length} IXN events (should be 2 for nested registries)`);

    expect(ixnEvents.length).toBe(2); // One IXN per registry (parent + child)

    // Verify child has parent edge in VCP
    const childVcp = await store.getEvent(child.registry.registryId);
    expect(childVcp).toBeTruthy();

    // Parse VCP to check for parent edge
    if (childVcp) {
      const text = new TextDecoder().decode(childVcp.raw);
      const jsonStart = text.indexOf('{');
      const json = text.substring(jsonStart);
      const event = JSON.parse(json);

      console.log('Child VCP event:', {
        t: event.t,
        hasParentEdge: !!event.e?.parent,
        parentId: event.e?.parent?.n,
      });

      expect(event.t).toBe('vcp');
      expect(event.e?.parent?.n).toBe(parent.registry.registryId);
    }

    console.log('✓ Nested registries have KEL seals AND parent edges');
  });

  it('should include parent edge in nested registry VCP', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('carol', mnemonic);
    const account = await dsl.account('carol');
    expect(account).toBeDefined();

    // Create parent
    const parent = await account!.createRegistry('parent');

    // Create child
    const child = await account!.createRegistry('child', {
      parentRegistryId: parent.registry.registryId,
    });

    // Get child VCP and verify parent edge
    const childVcp = await store.getEvent(child.registry.registryId);
    expect(childVcp).toBeTruthy();

    const text = new TextDecoder().decode(childVcp!.raw);
    const jsonStart = text.indexOf('{');
    const json = text.substring(jsonStart);
    const event = JSON.parse(json);

    expect(event.e).toBeTruthy();
    expect(event.e.parent).toBeTruthy();
    expect(event.e.parent.n).toBe(parent.registry.registryId);

    console.log('✓ Parent edge correctly stored in VCP:', event.e.parent.n);
  });
});
