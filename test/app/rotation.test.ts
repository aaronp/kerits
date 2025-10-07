/**
 * Tests for key rotation
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

const TEST_SEED_1 = new Uint8Array(32).fill(1);
const TEST_SEED_2 = new Uint8Array(32).fill(2);

describe('Key Rotation', () => {
  it('should create rot event and store in KEL', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account with first mnemonic
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');
    expect(accountDsl).toBeDefined();

    const aid = accountDsl!.account.aid;
    console.log('Created account with AID:', aid);

    // Check KEL before rotation
    const kelBefore = await store.listKel(aid);
    console.log('KEL before rotation:', kelBefore.length, 'events');
    console.log('Events:', kelBefore.map(e => ({ t: e.meta.t, s: e.meta.s })));
    expect(kelBefore).toHaveLength(1); // Just ICP
    expect(kelBefore[0].meta.t).toBe('icp');

    // Generate second mnemonic for rotation
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);

    // Rotate keys
    const updatedAccount = await accountDsl!.rotateKeys(mnemonic2);
    console.log('Keys rotated. New verfer:', updatedAccount.verfer);

    // Check KEL after rotation
    const kelAfter = await store.listKel(aid);
    console.log('KEL after rotation:', kelAfter.length, 'events');
    console.log('Events:', kelAfter.map(e => ({ t: e.meta.t, s: e.meta.s, d: e.meta.d.substring(0, 20) })));

    // Should have ICP + ROT
    expect(kelAfter).toHaveLength(2);
    expect(kelAfter[0].meta.t).toBe('icp');
    expect(kelAfter[1].meta.t).toBe('rot');
    expect(kelAfter[1].meta.i).toBe(aid);
    expect(kelAfter[1].meta.s).toBe('1'); // Sequence 1 (after ICP which is 0)

    // Check that metadata was stored
    const rotSaid = kelAfter[1].meta.d;
    const rotMeta = await store.getEvent(rotSaid);
    expect(rotMeta).toBeDefined();
    expect(rotMeta!.meta.t).toBe('rot');

    console.log('✓ ROT event successfully stored in KEL');
  });

  it('should build graph including rot event', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');

    // Rotate keys
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);
    await accountDsl!.rotateKeys(mnemonic2);

    // Build graph
    const graph = await dsl.graph();

    console.log('Graph nodes:', graph.nodes.length);
    console.log('Graph edges:', graph.edges.length);

    // Debug: show all nodes
    console.log('All nodes:', graph.nodes.map(n => ({ kind: n.kind, label: n.label, metaT: (n.meta as any)?.t })));

    // Find ROT node - check meta.t not type
    const rotNodes = graph.nodes.filter(n => n.meta && (n.meta as any).t === 'rot');
    console.log('ROT nodes found:', rotNodes.length);

    if (rotNodes.length > 0) {
      console.log('ROT node:', {
        id: rotNodes[0].id.substring(0, 20),
        kind: rotNodes[0].kind,
        label: rotNodes[0].label,
        metaT: (rotNodes[0].meta as any)?.t,
      });
    }

    // Should have at least one rot node
    expect(rotNodes.length).toBeGreaterThan(0);

    // Should have ICP node
    const icpNodes = graph.nodes.filter(n => n.meta && (n.meta as any).t === 'icp');
    expect(icpNodes.length).toBeGreaterThan(0);

    // Should have edge from ICP to ROT (via prior link)
    const rotNode = rotNodes[0];
    console.log('Looking for edges to ROT node:', rotNode.id.substring(0, 20));
    console.log('All edges:', graph.edges.map(e => ({ kind: e.kind, from: e.from.substring(0, 12), to: e.to.substring(0, 12) })));

    const edgesToRot = graph.edges.filter(e => e.to === rotNode.id);
    console.log('Edges to ROT:', edgesToRot.length);
    expect(edgesToRot.length).toBeGreaterThan(0);

    console.log('✓ Graph includes ROT event with proper connections');
  });

  it('should support multiple rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    await dsl.newAccount('test-account', mnemonic1);
    const accountDsl = await dsl.account('test-account');
    const aid = accountDsl!.account.aid;

    // First rotation
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);
    await accountDsl!.rotateKeys(mnemonic2);

    // Second rotation
    const mnemonic3 = dsl.newMnemonic(new Uint8Array(32).fill(3));
    await accountDsl!.rotateKeys(mnemonic3);

    // Check KEL
    const kel = await store.listKel(aid);
    console.log('KEL after 2 rotations:', kel.length, 'events');
    console.log('Events:', kel.map(e => ({ t: e.meta.t, s: e.meta.s })));

    // Should have ICP + 2 ROTs
    expect(kel).toHaveLength(3);
    expect(kel[0].meta.t).toBe('icp');
    expect(kel[1].meta.t).toBe('rot');
    expect(kel[2].meta.t).toBe('rot');
    expect(kel[1].meta.s).toBe('1');
    expect(kel[2].meta.s).toBe('2');

    console.log('✓ Multiple rotations work correctly');
  });
});
