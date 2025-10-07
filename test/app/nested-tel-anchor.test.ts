/**
 * Test that nested TEL registries are anchored in parent TEL
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED = new Uint8Array(32).fill(1);

describe('Nested TEL Anchoring', () => {
  it('should anchor nested registry in parent TEL with IXN event', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('alice', mnemonic);
    const account = await dsl.account('alice');
    expect(account).toBeDefined();

    // Create parent registry
    const parent = await account!.createRegistry('parent');
    console.log('Created parent registry:', parent.registry.registryId);

    // Get parent TEL before creating child
    const parentTelBefore = await store.listTel(parent.registry.registryId);
    console.log('Parent TEL before child:', {
      eventCount: parentTelBefore.length,
      events: parentTelBefore.map(e => ({ t: e.meta.t, s: e.meta.s })),
    });

    expect(parentTelBefore.length).toBe(1); // Only VCP

    // Create nested registry
    const child = await account!.createRegistry('child', {
      parentRegistryId: parent.registry.registryId,
    });
    console.log('Created child registry:', child.registry.registryId);

    // Get parent TEL after creating child
    const parentTelAfter = await store.listTel(parent.registry.registryId);
    console.log('Parent TEL after child:', {
      eventCount: parentTelAfter.length,
      events: parentTelAfter.map(e => ({
        t: e.meta.t,
        s: e.meta.s,
        acdcSaid: e.meta.acdcSaid,
      })),
    });

    // Should have 2 events: VCP + IXN
    expect(parentTelAfter.length).toBe(2);

    // Check the anchoring event
    const anchorEvent = parentTelAfter[1];
    console.log('Anchor event:', {
      type: anchorEvent.meta.t,
      sequence: anchorEvent.meta.s,
      i: anchorEvent.meta.i,  // TEL IXN uses 'i' field
      ri: anchorEvent.meta.ri,
    });

    // Verify it's an IXN event (not ISS)
    expect(anchorEvent.meta.t).toBe('ixn');

    // Verify it points to the child registry (in 'i' field for IXN)
    expect(anchorEvent.meta.i).toBe(child.registry.registryId);

    console.log('✓ Nested registry anchored in parent TEL with IXN event');
  });

  it('should allow querying child registry via parent TEL', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED);
    await dsl.newAccount('bob', mnemonic);
    const account = await dsl.account('bob');
    expect(account).toBeDefined();

    // Create parent
    const parent = await account!.createRegistry('parent');

    // Create multiple children
    const child1 = await account!.createRegistry('child1', {
      parentRegistryId: parent.registry.registryId,
    });
    const child2 = await account!.createRegistry('child2', {
      parentRegistryId: parent.registry.registryId,
    });

    // Get parent TEL
    const parentTel = await store.listTel(parent.registry.registryId);
    console.log('Parent TEL events:', parentTel.map(e => ({
      t: e.meta.t,
      s: e.meta.s,
      i: e.meta.i,  // Child registry ID for IXN events
    })));

    // Should have: VCP + IXN + IXN
    expect(parentTel.length).toBe(3);

    // Extract child registry IDs from parent TEL (IXN uses 'i' field)
    const childRegistryIds = parentTel
      .filter(e => e.meta.t === 'ixn')
      .map(e => e.meta.i);

    console.log('Child registries found in parent TEL:', childRegistryIds);

    expect(childRegistryIds.length).toBe(2);
    expect(childRegistryIds).toContain(child1.registry.registryId);
    expect(childRegistryIds).toContain(child2.registry.registryId);

    console.log('✓ Can query child registries via parent TEL');
  });

  it('should preserve sequence numbers in parent TEL', async () => {
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

    // Create children
    const child1 = await account!.createRegistry('child1', {
      parentRegistryId: parent.registry.registryId,
    });
    const child2 = await account!.createRegistry('child2', {
      parentRegistryId: parent.registry.registryId,
    });

    // Get parent TEL
    const parentTel = await store.listTel(parent.registry.registryId);

    // Check sequence numbers
    const sequences = parentTel.map(e => parseInt(e.meta.s, 16));
    console.log('Parent TEL sequences:', sequences);

    expect(sequences).toEqual([0, 1, 2]); // VCP=0, IXN=1, IXN=2

    console.log('✓ Sequence numbers preserved in parent TEL');
  });
});
