/**
 * Cross-Entity Chain Synchronization Tests
 *
 * Tests for sharing KELs, TELs, and ACDCs between entities with:
 * - Aliasing imported chains
 * - SAID verification
 * - Skip existing events
 * - Graph visualization across entities
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MemoryKv, createKerStore, DefaultJsonCesrParser, CesrHasher } from '../../src/storage';
import { createKeritsDSL } from '../../src/app/dsl';

describe('Cross-Entity Sync', () => {
  const hasher = new CesrHasher();
  const parser = new DefaultJsonCesrParser(hasher);

  const seed1 = new Uint8Array(32).fill(1);
  const seed2 = new Uint8Array(32).fill(2);

  let bobStore: ReturnType<typeof createKerStore>;
  let aliceStore: ReturnType<typeof createKerStore>;

  beforeEach(() => {
    bobStore = createKerStore(new MemoryKv(), { parser, hasher });
    aliceStore = createKerStore(new MemoryKv(), { parser, hasher });
  });

  it('should sync Bob\'s registry to Alice with alias', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity and registry
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    const bob = await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');
    const bobRegistryDsl = await bobAccountDsl!.createRegistry('health');

    // Bob exports his KEL and registry TEL
    const bobKelExport = await bobAccountDsl!.export();
    const bobTelExport = await bobRegistryDsl.export();

    // Alice imports Bob's KEL and TEL with custom aliases
    const aliceImport = aliceDSL.import();

    const kelResult = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(kelResult.imported).toBeGreaterThan(0);
    expect(kelResult.failed).toBe(0);
    expect(kelResult.aid).toBe(bob.aid);

    const telResult = await aliceImport.fromBundle(bobTelExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-health-registry',
    });
    // TEL import count may be 0 if events were skipped, but should not fail
    if (telResult.failed > 0) {
      console.log('TEL import errors:', telResult.errors);
    }
    expect(telResult.failed).toBe(0);
    expect(telResult.registryId).toBe(bobRegistryDsl.registry.registryId);
    // At least imported or skipped should be > 0
    expect(telResult.imported + telResult.skipped).toBeGreaterThan(0);

    // Verify Alice can access Bob's registry by alias
    const registryId = await aliceStore.aliasToId('tel', 'bobs-health-registry');
    expect(registryId).toBe(bobRegistryDsl.registry.registryId);

    // Verify Bob's KEL exists in Alice's store
    const bobKelInAlice = await aliceStore.listKel(bob.aid);
    expect(bobKelInAlice.length).toBeGreaterThan(0);

    console.log('✓ Bob\'s registry synced to Alice with alias');
  });

  it('should sync Bob\'s credential to Alice', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob sets up identity, schema, and registry
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    const bob = await bobDSL.newAccount('bob', bobMnemonic);

    const schemaDsl = await bobDSL.createSchema('running-record', {
      title: 'Running Record',
      properties: {
        distance: { type: 'number' },
        time: { type: 'number' },
      },
      required: ['distance', 'time'],
    });

    const bobAccountDsl = await bobDSL.account('bob');
    const bobRegistryDsl = await bobAccountDsl!.createRegistry('health');

    // Bob issues himself a credential
    const acdcDsl = await bobRegistryDsl.issue({
      schema: 'running-record',
      holder: bob.aid,
      data: { distance: 5, time: 30 },
    });

    // Bob exports KEL, TEL, schema, and credential
    const bobKelExport = await bobAccountDsl!.export();
    const bobTelExport = await bobRegistryDsl.export();
    const bobAcdcExport = await acdcDsl.export();
    const bobSchemaExport = schemaDsl.getSchema();

    // Alice imports everything
    const aliceImport = aliceDSL.import();

    // Import Bob's KEL
    await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });

    // Import Bob's TEL with alias
    await aliceImport.fromBundle(bobTelExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-health',
    });

    // Import schema (for now, recreate it in Alice's store)
    await aliceDSL.createSchema('running-record', bobSchemaExport);

    // Import Bob's credential with alias
    const acdcResult = await aliceImport.fromBundle(bobAcdcExport.asBundle(), {
      skipExisting: true,
      verify: true,
      alias: 'bobs-running-record',
    });

    if (acdcResult.failed > 0) {
      console.log('ACDC import errors:', acdcResult.errors);
    }
    expect(acdcResult.failed).toBe(0);
    expect(acdcResult.credentialId).toBe(acdcDsl.acdc.credentialId);
    expect(acdcResult.imported + acdcResult.skipped).toBeGreaterThan(0);

    // Verify credential exists in Alice's store
    const credStored = await aliceStore.getEvent(acdcDsl.acdc.credentialId);
    expect(credStored).toBeDefined();

    console.log('✓ Bob\'s credential synced to Alice');
  });

  it.skip('should show Bob\'s chain in Alice\'s graph', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity and rotates keys
    const bobMnemonic1 = bobDSL.newMnemonic(seed1);
    const bobMnemonic2 = bobDSL.newMnemonic(seed2);
    const bob = await bobDSL.newAccount('bob', bobMnemonic1);
    const bobAccountDsl = await bobDSL.account('bob');
    await bobAccountDsl!.rotateKeys(bobMnemonic2);

    // Bob exports KEL
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports Bob's KEL
    await aliceDSL.import().fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });

    // Verify Bob's KEL exists in Alice's store
    const bobKelInAlice = await aliceStore.listKel(bob.aid);
    expect(bobKelInAlice.length).toBe(2); // icp + rot
    expect(bobKelInAlice[0].meta.t).toBe('icp');
    expect(bobKelInAlice[1].meta.t).toBe('rot');
    expect(bobKelInAlice[0].meta.i).toBe(bob.aid);
    expect(bobKelInAlice[1].meta.i).toBe(bob.aid);

    // Alice views global graph (includes Bob's events)
    const graph = await aliceDSL.graph();

    // Verify specific KEL event nodes exist
    const kelEvtNodes = graph.nodes.filter((n: any) => n.kind === 'KEL_EVT');
    expect(kelEvtNodes.length).toBeGreaterThanOrEqual(2);

    // Find Bob's icp and rot event nodes
    const bobIcpNode = kelEvtNodes.find((n: any) => n.meta?.t === 'icp');
    const bobRotNode = kelEvtNodes.find((n: any) => n.meta?.t === 'rot');

    expect(bobIcpNode).toBeDefined();
    expect(bobRotNode).toBeDefined();

    // Verify AID node exists for Bob
    const aidNodes = graph.nodes.filter((n: any) => n.kind === 'AID');
    const bobAidNode = aidNodes.find((n: any) => n.id === bob.aid);
    expect(bobAidNode).toBeDefined();

    // Verify prior edge exists linking rot to icp
    const priorEdges = graph.edges.filter((e: any) =>
      e.kind === 'PRIOR' && e.to === bobRotNode?.id
    );
    expect(priorEdges.length).toBe(1);
    expect(priorEdges[0].from).toBe(bobIcpNode?.id);

    console.log('✓ Bob\'s chain visible in Alice\'s graph with correct structure');
    console.log(`  KEL events: ${kelEvtNodes.length}, AID nodes: ${aidNodes.length}, Prior edges: ${priorEdges.length}`);
  });

  it('should re-import Bob\'s chain and skip existing events', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');

    // Bob exports KEL
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports Bob's KEL
    const aliceImport = aliceDSL.import();
    const firstImport = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(firstImport.imported).toBeGreaterThan(0);
    expect(firstImport.skipped).toBe(0);

    // Alice re-imports same KEL - should skip all events
    const secondImport = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });
    expect(secondImport.imported).toBe(0);
    expect(secondImport.skipped).toBe(firstImport.imported);

    console.log('✓ Re-import skipped existing events');
    console.log(`  First import: ${firstImport.imported}, Second import skipped: ${secondImport.skipped}`);
  });

  it('should verify SAIDs during import', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Bob creates identity
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    await bobDSL.newAccount('bob', bobMnemonic);
    const bobAccountDsl = await bobDSL.account('bob');

    // Bob exports KEL
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports with verification
    const aliceImport = aliceDSL.import();
    const result = await aliceImport.fromBundle(bobKelExport.asBundle(), {
      verify: true
    });

    expect(result.failed).toBe(0);
    expect(result.errors.length).toBe(0);
    expect(result.imported).toBeGreaterThan(0);

    console.log('✓ SAID verification passed for all events');
  });

  it.skip('should support cross-entity credential issuance in graph', async () => {
    const bobDSL = createKeritsDSL(bobStore);
    const aliceDSL = createKeritsDSL(aliceStore);

    // Setup Bob (issuer)
    const bobMnemonic = bobDSL.newMnemonic(seed1);
    const bob = await bobDSL.newAccount('bob', bobMnemonic);
    await bobDSL.createSchema('badge', {
      title: 'Badge',
      properties: { name: { type: 'string' } },
    });
    const bobAccountDsl = await bobDSL.account('bob');
    const bobRegistryDsl = await bobAccountDsl!.createRegistry('badges');

    // Setup Alice (holder)
    const aliceMnemonic = aliceDSL.newMnemonic(seed2);
    const alice = await aliceDSL.newAccount('alice', aliceMnemonic);

    // Alice exports her KEL to Bob
    const aliceAccountDsl = await aliceDSL.account('alice');
    const aliceKelExport = await aliceAccountDsl!.export();

    // Bob imports Alice's KEL
    await bobDSL.import().fromBundle(aliceKelExport.asBundle(), {
      skipExisting: true,
      verify: true
    });

    // Bob issues credential to Alice
    const acdcDsl = await bobRegistryDsl.issue({
      schema: 'badge',
      holder: alice.aid,
      data: { name: 'Alice Badge' },
    });

    // Bob exports credential and TEL
    const bobTelExport = await bobRegistryDsl.export();
    const bobAcdcExport = await acdcDsl.export();
    const bobKelExport = await bobAccountDsl!.export();

    // Alice imports Bob's data
    const aliceImport = aliceDSL.import();
    await aliceImport.fromBundle(bobKelExport.asBundle(), { skipExisting: true, verify: true });
    await aliceImport.fromBundle(bobTelExport.asBundle(), { skipExisting: true, verify: true });
    await aliceDSL.createSchema('badge', { title: 'Badge', properties: { name: { type: 'string' } } });
    await aliceImport.fromBundle(bobAcdcExport.asBundle(), { skipExisting: true, verify: true });

    // Verify TEL events in Alice's store
    const bobTelInAlice = await aliceStore.listTel(bobRegistryDsl.registry.registryId);
    expect(bobTelInAlice.length).toBeGreaterThanOrEqual(2); // vcp (registry inception) + iss (issuance)

    const vcpEvent = bobTelInAlice.find((e: any) => e.meta.t === 'vcp');
    const issEvent = bobTelInAlice.find((e: any) => e.meta.t === 'iss');
    expect(vcpEvent).toBeDefined();
    expect(issEvent).toBeDefined();
    expect(issEvent?.meta.i).toBe(acdcDsl.acdc.credentialId); // iss event should reference credential

    // Verify credential exists in Alice's store
    const credStored = await aliceStore.getEvent(acdcDsl.acdc.credentialId);
    expect(credStored).toBeDefined();

    // Verify KEL events
    const bobKelInAlice = await aliceStore.listKel(bob.aid);
    const aliceKel = await aliceStore.listKel(alice.aid);
    expect(bobKelInAlice.length).toBeGreaterThanOrEqual(2); // icp + ixn (registry anchor)
    expect(aliceKel.length).toBe(1); // icp

    // Find registry anchoring ixn in Bob's KEL
    const bobIxnEvent = bobKelInAlice.find((e: any) => e.meta.t === 'ixn');
    expect(bobIxnEvent).toBeDefined();

    // Alice's graph should show complete structure
    const graph = await aliceDSL.graph();

    // Verify AID nodes for both Bob and Alice
    const aidNodes = graph.nodes.filter((n: any) => n.kind === 'AID');
    expect(aidNodes.some((n: any) => n.id === bob.aid)).toBe(true);
    expect(aidNodes.some((n: any) => n.id === alice.aid)).toBe(true);

    // Verify KEL event nodes
    const kelEvtNodes = graph.nodes.filter((n: any) => n.kind === 'KEL_EVT');
    expect(kelEvtNodes.length).toBeGreaterThanOrEqual(3); // Bob: icp+ixn, Alice: icp

    // Verify Bob's ixn event exists (registry anchor)
    const bobIxnNode = kelEvtNodes.find((n: any) => n.meta?.t === 'ixn');
    expect(bobIxnNode).toBeDefined();

    // Verify TEL registry node exists
    const registryNodes = graph.nodes.filter((n: any) => n.kind === 'TEL_REGISTRY');
    expect(registryNodes.length).toBeGreaterThanOrEqual(1);
    const bobRegistryNode = registryNodes.find((n: any) =>
      n.id === bobRegistryDsl.registry.registryId
    );
    expect(bobRegistryNode).toBeDefined();

    // Verify TEL event nodes (iss event)
    const telEvtNodes = graph.nodes.filter((n: any) => n.kind === 'TEL_EVT');
    expect(telEvtNodes.length).toBeGreaterThanOrEqual(1);
    const issNode = telEvtNodes.find((n: any) => n.meta?.t === 'iss');
    expect(issNode).toBeDefined();

    // Verify ACDC node exists
    const acdcNodes = graph.nodes.filter((n: any) => n.kind === 'ACDC');
    expect(acdcNodes.length).toBeGreaterThanOrEqual(1);
    const credNode = acdcNodes.find((n: any) => n.id === acdcDsl.acdc.credentialId);
    expect(credNode).toBeDefined();

    // Verify ISSUES edge exists (iss -> acdc)
    const issuesEdges = graph.edges.filter((e: any) =>
      e.kind === 'ISSUES' && e.to === credNode?.id
    );
    expect(issuesEdges.length).toBe(1);

    // Verify ANCHOR edge exists (AID -> registry)
    const anchorEdges = graph.edges.filter((e: any) =>
      e.kind === 'ANCHOR' && e.to === bobRegistryNode?.id
    );
    expect(anchorEdges.length).toBeGreaterThan(0);

    console.log('✓ Cross-entity credential issuance with complete graph structure');
    console.log(`  Bob KEL: ${bobKelInAlice.length} events, Alice KEL: ${aliceKel.length} events`);
    console.log(`  TEL: ${bobTelInAlice.length} events (vcp + iss)`);
    console.log(`  Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    console.log(`  AID nodes: ${aidNodes.length}, KEL events: ${kelEvtNodes.length}, TEL events: ${telEvtNodes.length}, ACDCs: ${acdcNodes.length}`);
  });
});
