/**
 * Integration test for KERI storage system
 *
 * Tests the complete flow:
 * 1. Create a new identifier (KEL) with alias
 * 2. Create a credential registry (TEL) with anchor in KEL
 * 3. Create a schema with alias
 * 4. Issue a credential (ACDC) against the schema
 * 5. Verify storage and retrieval
 */

import { describe, it, expect } from 'bun:test';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { createKerStore } from '../../src/storage/core';
import { CesrHasher, DefaultJsonCesrParser } from '../../src/storage/parser';
import {
  createIdentity,
  createRegistry,
  createSchema,
  issueCredential,
  listIdentityEvents,
  listRegistryEvents,
  getByAlias,
} from '../../src/app/helpers';
import { generateKeypairFromSeed } from '../../src/signer';

// Deterministic test seeds
const TEST_SEED_ISSUER = new Uint8Array(32).fill(1);
const TEST_SEED_HOLDER = new Uint8Array(32).fill(2);
const TEST_SEED_3 = new Uint8Array(32).fill(3);

describe('KERI Storage Integration', () => {
  it.skip('should handle complete workflow: identity -> registry -> schema -> credential', async () => {
    // Setup storage
    const kv = new MemoryKv();
    const hasher = new CesrHasher();
    const parser = new DefaultJsonCesrParser(hasher);
    const store = createKerStore(kv, { hasher, parser });

    // Generate deterministic keys
    const issuerKp = await generateKeypairFromSeed(TEST_SEED_ISSUER);

    // Step 1: Create a new identifier with alias
    const { aid: issuerAid, icp } = await createIdentity(store, {
      alias: 'acme-corp',
      keys: [issuerKp.verfer],
      nextKeys: [issuerKp.verfer],
    });

    expect(issuerAid).toBeDefined();
    expect(icp).toBeDefined();
    console.log('✓ Created identity:', issuerAid);

    // Verify alias mapping
    const resolvedAid = await getByAlias(store, 'kel', 'acme-corp');
    expect(resolvedAid).toBe(issuerAid);
    console.log('✓ Alias mapping works:', 'acme-corp', '->', issuerAid);

    // Verify KEL storage
    const kelEvents = await listIdentityEvents(store, issuerAid);
    expect(kelEvents).toHaveLength(1);
    expect(kelEvents[0].meta.t).toBe('icp');
    expect(kelEvents[0].meta.i).toBe(issuerAid);
    console.log('✓ KEL inception stored and retrieved');

    // Step 2: Create a credential registry with anchor in KEL
    const { registryId, vcp, ixn } = await createRegistry(store, {
      alias: 'employee-credentials',
      issuerAid,
      backers: [],
    });

    expect(registryId).toBeDefined();
    expect(vcp).toBeDefined();
    expect(ixn).toBeDefined();
    console.log('✓ Created registry:', registryId);

    // Verify registry alias
    const resolvedRegistryId = await getByAlias(store, 'tel', 'employee-credentials');
    expect(resolvedRegistryId).toBe(registryId);
    console.log('✓ Registry alias mapping works:', 'employee-credentials', '->', registryId);

    // Verify anchor in KEL
    const kelAfterAnchor = await listIdentityEvents(store, issuerAid);
    expect(kelAfterAnchor).toHaveLength(2);
    expect(kelAfterAnchor[1].meta.t).toBe('ixn');
    console.log('✓ Registry anchored in KEL via interaction event');

    // Verify TEL storage
    const telEvents = await listRegistryEvents(store, registryId);
    expect(telEvents).toHaveLength(1);
    expect(telEvents[0].meta.t).toBe('vcp');
    expect(telEvents[0].meta.i).toBe(registryId);
    console.log('✓ TEL inception stored and retrieved');

    // Step 3: Create a schema with alias
    const { schemaId, schema } = await createSchema(store, {
      alias: 'employee-badge-schema',
      schema: {
        title: 'Employee Badge',
        description: 'Schema for employee identification badges',
        properties: {
          name: { type: 'string' },
          employeeId: { type: 'string' },
          department: { type: 'string' },
          validUntil: { type: 'string', format: 'date-time' },
        },
        required: ['name', 'employeeId'],
      },
    });

    expect(schemaId).toBeDefined();
    expect(schema).toHaveProperty('d');
    console.log('✓ Created schema:', schemaId);

    // Verify schema alias
    const resolvedSchemaId = await getByAlias(store, 'schema', 'employee-badge-schema');
    expect(resolvedSchemaId).toBe(schemaId);
    console.log('✓ Schema alias mapping works:', 'employee-badge-schema', '->', schemaId);

    // Step 4: Create a holder identity
    const holderKp = await generateKeypairFromSeed(TEST_SEED_HOLDER);
    const { aid: holderAid } = await createIdentity(store, {
      alias: 'john-doe',
      keys: [holderKp.verfer],
      nextKeys: [holderKp.verfer],
    });

    console.log('✓ Created holder identity:', holderAid);

    // Step 5: Issue a credential against the schema
    const { credentialId, acdc, iss } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'John Doe',
        employeeId: 'EMP-12345',
        department: 'Engineering',
        validUntil: '2026-12-31T23:59:59Z',
      },
    });

    expect(credentialId).toBeDefined();
    expect(acdc).toHaveProperty('d');
    expect(acdc).toHaveProperty('s', schemaId);
    expect(acdc).toHaveProperty('i', issuerAid);
    expect(acdc.a).toHaveProperty('i', holderAid);
    expect(iss).toBeDefined();
    console.log('✓ Issued credential:', credentialId);

    // Verify issuance in TEL
    const telAfterIssuance = await listRegistryEvents(store, registryId);
    expect(telAfterIssuance).toHaveLength(2);
    expect(telAfterIssuance[1].meta.t).toBe('iss');
    expect(telAfterIssuance[1].meta.acdcSaid).toBe(credentialId);
    console.log('✓ Issuance event recorded in TEL');

    // Step 6: Build and verify graph
    const graph = await store.buildGraph();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    // Verify graph contains our entities
    const aidNodes = graph.nodes.filter(n => n.kind === 'AID');
    expect(aidNodes.length).toBeGreaterThanOrEqual(2); // issuer + holder

    const registryNodes = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY');
    expect(registryNodes.length).toBeGreaterThanOrEqual(1);

    const acdcNodes = graph.nodes.filter(n => n.kind === 'ACDC');
    expect(acdcNodes.length).toBeGreaterThanOrEqual(1);

    console.log('✓ Graph built successfully:');
    console.log('  - Nodes:', graph.nodes.length);
    console.log('  - Edges:', graph.edges.length);
    console.log('  - AIDs:', aidNodes.length);
    console.log('  - Registries:', registryNodes.length);
    console.log('  - ACDCs:', acdcNodes.length);

    // Final verification: storage state
    console.log('\n✓ All tests passed!');
    console.log('\nStorage summary:');
    console.log('  - KEL events for issuer:', kelAfterAnchor.length);
    console.log('  - TEL events for registry:', telAfterIssuance.length);
    console.log('  - Total storage keys:', kv.size());
  });

  it('should handle retrieval by alias across scopes', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Generate deterministic keys
    const kp = await generateKeypairFromSeed(TEST_SEED_3);

    // Create entities in different scopes
    const { aid } = await createIdentity(store, {
      alias: 'test-identity',
      keys: [kp.verfer],
      nextKeys: [kp.verfer],
    });

    const { registryId } = await createRegistry(store, {
      alias: 'test-registry',
      issuerAid: aid,
    });

    const { schemaId } = await createSchema(store, {
      alias: 'test-schema',
      schema: {
        title: 'Test Schema',
        properties: { test: { type: 'string' } },
      },
    });

    // Verify each scope works independently
    expect(await getByAlias(store, 'kel', 'test-identity')).toBe(aid);
    expect(await getByAlias(store, 'tel', 'test-registry')).toBe(registryId);
    expect(await getByAlias(store, 'schema', 'test-schema')).toBe(schemaId);

    // Verify no cross-scope pollution
    expect(await getByAlias(store, 'kel', 'test-registry')).toBeNull();
    expect(await getByAlias(store, 'tel', 'test-schema')).toBeNull();
    expect(await getByAlias(store, 'schema', 'test-identity')).toBeNull();

    console.log('✓ Alias scoping works correctly');
  });

  it('should handle prior event linking', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Generate deterministic keys
    const kp = await generateKeypairFromSeed(TEST_SEED_3);

    // Create identity
    const { aid } = await createIdentity(store, {
      alias: 'test',
      keys: [kp.verfer],
      nextKeys: [kp.verfer],
    });

    // Create registry (adds interaction event)
    await createRegistry(store, {
      alias: 'test-reg',
      issuerAid: aid,
    });

    // Get KEL events
    const events = await listIdentityEvents(store, aid);
    expect(events).toHaveLength(2);

    // Verify prior linking
    const icp = events[0];
    const ixn = events[1];
    expect(ixn.meta.p).toBe(icp.meta.d);

    // Test getByPrior
    const nextEvents = await store.getByPrior(icp.meta.d);
    expect(nextEvents).toHaveLength(1);
    expect(nextEvents[0].meta.d).toBe(ixn.meta.d);

    console.log('✓ Prior event linking works correctly');
  });
});

