/**
 * Tests for AccountDSL - Account-specific operations including key rotation
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

// Deterministic test seeds
const TEST_SEED_INITIAL = new Uint8Array(32).fill(1);
const TEST_SEED_ROTATED = new Uint8Array(32).fill(2);
const TEST_SEED_SECOND_ROTATION = new Uint8Array(32).fill(3);

describe('AccountDSL', () => {
  it('should get AccountDSL for an account by alias', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    const account = await dsl.newAccount('alice', mnemonic);

    // Get AccountDSL
    const accountDsl = await dsl.account('alice');
    expect(accountDsl).not.toBeNull();
    expect(accountDsl?.account.aid).toBe(account.aid);
    expect(accountDsl?.account.alias).toBe('alice');

    console.log('✓ Got AccountDSL for account by alias');
  });

  it('should get AccountDSL for an account by AID', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const mnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    const account = await dsl.newAccount('bob', mnemonic);

    // Get AccountDSL by AID
    const accountDsl = await dsl.accountByAid(account.aid);
    expect(accountDsl).not.toBeNull();
    expect(accountDsl?.account.aid).toBe(account.aid);
    expect(accountDsl?.account.alias).toBe('bob');

    console.log('✓ Got AccountDSL for account by AID');
  });

  it('should return null for non-existent account', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const accountDsl = await dsl.account('non-existent');
    expect(accountDsl).toBeNull();

    console.log('✓ Returns null for non-existent account');
  });

  it('should rotate account keys', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account with initial keys
    const initialMnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    const account = await dsl.newAccount('alice', initialMnemonic);
    const initialVerfer = account.verfer;

    console.log('✓ Created account with initial keys');
    console.log('  Initial verfer:', initialVerfer);

    // Get AccountDSL
    const accountDsl = await dsl.account('alice');
    expect(accountDsl).not.toBeNull();

    // Rotate keys
    const newMnemonic = dsl.newMnemonic(TEST_SEED_ROTATED);
    const rotatedAccount = await accountDsl!.rotateKeys(newMnemonic);

    console.log('  Rotated verfer:', rotatedAccount.verfer);

    // Verify keys were rotated
    expect(rotatedAccount.verfer).not.toBe(initialVerfer);
    expect(rotatedAccount.aid).toBe(account.aid); // AID stays same

    console.log('✓ Keys rotated successfully');
  });

  it('should have KEL with rotation event after key rotation', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const initialMnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    const account = await dsl.newAccount('alice', initialMnemonic);

    // Get initial KEL
    const accountDsl = await dsl.account('alice');
    let kel = await accountDsl!.getKel();
    expect(kel).toHaveLength(1);
    expect(kel[0].t).toBe('icp'); // Inception event

    console.log('✓ Initial KEL has 1 event (icp)');

    // Rotate keys
    const newMnemonic = dsl.newMnemonic(TEST_SEED_ROTATED);
    await accountDsl!.rotateKeys(newMnemonic);

    // Get updated KEL
    kel = await accountDsl!.getKel();
    expect(kel).toHaveLength(2);
    expect(kel[0].t).toBe('icp');
    expect(kel[1].t).toBe('rot'); // Rotation event

    console.log('✓ KEL has 2 events after rotation (icp, rot)');
    console.log('  KEL events:', kel.map(e => e.t));
  });

  it('should support multiple key rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const initialMnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    await dsl.newAccount('alice', initialMnemonic);

    const accountDsl = await dsl.account('alice');

    // First rotation
    const firstRotation = dsl.newMnemonic(TEST_SEED_ROTATED);
    await accountDsl!.rotateKeys(firstRotation);

    // Second rotation
    const secondRotation = dsl.newMnemonic(TEST_SEED_SECOND_ROTATION);
    await accountDsl!.rotateKeys(secondRotation);

    // Get KEL
    const kel = await accountDsl!.getKel();
    expect(kel).toHaveLength(3);
    expect(kel[0].t).toBe('icp');
    expect(kel[1].t).toBe('rot');
    expect(kel[2].t).toBe('rot');

    console.log('✓ Multiple rotations successful');
    console.log('  KEL events:', kel.map(e => e.t));
  });

  it('should verify graph created from account creation and key rotation', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const initialMnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    const account = await dsl.newAccount('alice', initialMnemonic);

    console.log('✓ Created account:', account.alias);

    // Get initial graph
    let graph = await dsl.graph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    // No edges yet - inception event has no prior
    expect(graph.edges.length).toBe(0);

    const initialNodeCount = graph.nodes.length;
    const initialEdgeCount = graph.edges.length;

    console.log('✓ Initial graph (before rotation):', {
      nodes: initialNodeCount,
      edges: initialEdgeCount,
    });

    // Rotate keys
    const accountDsl = await dsl.account('alice');
    const newMnemonic = dsl.newMnemonic(TEST_SEED_ROTATED);
    await accountDsl!.rotateKeys(newMnemonic);

    console.log('✓ Rotated keys');

    // Get updated graph
    graph = await dsl.graph();

    console.log('✓ Updated graph:', {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    });

    // Verify graph structure
    expect(graph.nodes.length).toBeGreaterThanOrEqual(initialNodeCount);
    expect(graph.edges.length).toBeGreaterThanOrEqual(initialEdgeCount);

    // Find AID node
    const aidNodes = graph.nodes.filter(n => n.kind === 'AID');
    expect(aidNodes.length).toBeGreaterThanOrEqual(1);

    const aliceNode = aidNodes.find(n => n.id === account.aid);
    expect(aliceNode).toBeDefined();

    console.log('✓ Graph contains account node:', aliceNode?.id);

    // Find KEL event nodes
    const kelNodes = graph.nodes.filter(n => n.kind === 'KEL_EVT');
    expect(kelNodes.length).toBeGreaterThanOrEqual(2); // icp + rot

    console.log('✓ Graph contains KEL events:', kelNodes.length);

    // Find prior event edges (linking rotation to inception)
    const priorEdges = graph.edges.filter(e => e.kind === 'PRIOR');
    expect(priorEdges.length).toBeGreaterThanOrEqual(1);

    console.log('✓ Graph contains prior edges:', priorEdges.length);
  });

  it('should show graph evolution through multiple rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create account
    const initialMnemonic = dsl.newMnemonic(TEST_SEED_INITIAL);
    await dsl.newAccount('alice', initialMnemonic);

    const accountDsl = await dsl.account('alice');

    // Perform multiple rotations
    const rotations = [
      dsl.newMnemonic(TEST_SEED_ROTATED),
      dsl.newMnemonic(TEST_SEED_SECOND_ROTATION),
    ];

    for (const [index, mnemonic] of rotations.entries()) {
      await accountDsl!.rotateKeys(mnemonic);
      const graph = await dsl.graph();

      console.log(`After rotation ${index + 1}:`, {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        kelEvents: graph.nodes.filter(n => n.kind === 'KEL_EVT').length,
        priorEdges: graph.edges.filter(e => e.kind === 'PRIOR').length,
      });
    }

    // Final graph check
    const finalGraph = await dsl.graph();
    const kelEvents = finalGraph.nodes.filter(n => n.kind === 'KEL_EVT');
    expect(kelEvents.length).toBe(3); // icp + 2 rotations

    const priorEdges = finalGraph.edges.filter(e => e.kind === 'PRIOR');
    expect(priorEdges.length).toBe(2); // 2 prior links

    console.log('✓ Graph correctly shows all rotations');
  });

  it('should maintain graph correctness with multiple accounts and rotations', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create two accounts
    const alice = await dsl.newAccount('alice', dsl.newMnemonic(TEST_SEED_INITIAL));
    const bob = await dsl.newAccount('bob', dsl.newMnemonic(TEST_SEED_ROTATED));

    // Rotate Alice's keys
    const aliceDsl = await dsl.account('alice');
    await aliceDsl!.rotateKeys(dsl.newMnemonic(TEST_SEED_SECOND_ROTATION));

    // Get graph
    const graph = await dsl.graph();

    // Verify both accounts in graph
    const aidNodes = graph.nodes.filter(n => n.kind === 'AID');
    expect(aidNodes.length).toBe(2);

    const aliceNode = aidNodes.find(n => n.id === alice.aid);
    const bobNode = aidNodes.find(n => n.id === bob.aid);

    expect(aliceNode).toBeDefined();
    expect(bobNode).toBeDefined();

    // Verify KEL events
    const kelEvents = graph.nodes.filter(n => n.kind === 'KEL_EVT');
    expect(kelEvents.length).toBe(3); // alice: icp+rot, bob: icp

    console.log('✓ Graph correctly represents multiple accounts');
    console.log('  AIDs:', aidNodes.length);
    console.log('  KEL events:', kelEvents.length);
  });
});
