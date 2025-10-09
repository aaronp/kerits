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
import { KeyManager } from '../../src/app/keymanager';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';

// Deterministic test seeds
const TEST_SEED_ISSUER = new Uint8Array(32).fill(1);
const TEST_SEED_HOLDER = new Uint8Array(32).fill(2);
const TEST_SEED_3 = new Uint8Array(32).fill(3);

describe('KERI Storage Integration', () => {
  it('should handle retrieval by alias across scopes', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Generate deterministic keys
    const kp = await generateKeypairFromSeed(TEST_SEED_3);
    const mnemonic = seedToMnemonic(TEST_SEED_3);
    const keyManager = new KeyManager();
    await keyManager.unlock(kp.verfer, mnemonic);

    // Create entities in different scopes
    const { aid } = await createIdentity(store, {
      alias: 'test-identity',
      keys: [kp.verfer],
      nextKeys: [kp.verfer],
    }, keyManager);

    const { registryId } = await createRegistry(store, {
      alias: 'test-registry',
      issuerAid: aid,
    }, keyManager);

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
    const mnemonic = seedToMnemonic(TEST_SEED_3);
    const keyManager = new KeyManager();
    await keyManager.unlock(kp.verfer, mnemonic);

    // Create identity
    const { aid } = await createIdentity(store, {
      alias: 'test',
      keys: [kp.verfer],
      nextKeys: [kp.verfer],
    }, keyManager);

    // Create registry (adds interaction event)
    await createRegistry(store, {
      alias: 'test-reg',
      issuerAid: aid,
    }, keyManager);

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

