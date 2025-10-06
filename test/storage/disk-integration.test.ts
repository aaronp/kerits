/**
 * Integration test for DiskKv with full KERI storage system
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DiskKv } from '../../src/storage/adapters/disk';
import { createKerStore } from '../../src/storage/core';
import { createKeritsDSL } from '../../src/app/dsl';
import { generateKeypairFromSeed } from '../../src/signer';
import {
  createIdentity,
  createRegistry,
  createSchema,
  issueCredential,
} from '../../src/app/helpers';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join('/tmp', 'kerits-test-disk-integration');
const TEST_SEED_1 = new Uint8Array(32).fill(1);
const TEST_SEED_2 = new Uint8Array(32).fill(2);

describe('DiskKv Integration', () => {
  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should persist KERI events to disk', async () => {
    // Create store with DiskKv
    const kv = new DiskKv({ baseDir: TEST_DIR });
    const store = createKerStore(kv);

    // Generate keys
    const kp = await generateKeypairFromSeed(TEST_SEED_1);

    // Create identity
    const { aid } = await createIdentity(store, {
      alias: 'alice',
      keys: [kp.verfer],
      nextKeys: [kp.verfer],
    });

    // Verify stored on disk
    expect(await kv.size()).toBeGreaterThan(0);
    console.log('✓ Events persisted to disk:', await kv.size(), 'keys');

    // Create new store instance pointing to same directory
    const kv2 = new DiskKv({ baseDir: TEST_DIR });
    const store2 = createKerStore(kv2);

    // Verify data is accessible from new instance
    const resolvedAid = await store2.aliasToId('kel', 'alice');
    expect(resolvedAid).toBe(aid);

    const kelEvents = await store2.listKel(aid);
    expect(kelEvents).toHaveLength(1);
    expect(kelEvents[0].meta.t).toBe('icp');

    console.log('✓ Data accessible from new store instance');
  });

  it('should persist complete workflow to disk', async () => {
    const kv = new DiskKv({ baseDir: TEST_DIR });
    const store = createKerStore(kv);

    // Create issuer and holder
    const issuerKp = await generateKeypairFromSeed(TEST_SEED_1);
    const holderKp = await generateKeypairFromSeed(TEST_SEED_2);

    const { aid: issuerAid } = await createIdentity(store, {
      alias: 'issuer',
      keys: [issuerKp.verfer],
      nextKeys: [issuerKp.verfer],
    });

    const { aid: holderAid } = await createIdentity(store, {
      alias: 'holder',
      keys: [holderKp.verfer],
      nextKeys: [holderKp.verfer],
    });

    // Create registry
    const { registryId } = await createRegistry(store, {
      alias: 'credentials',
      issuerAid,
    });

    // Create schema
    const { schemaId } = await createSchema(store, {
      alias: 'badge',
      schema: {
        title: 'Badge',
        properties: { name: { type: 'string' } },
      },
    });

    // Issue credential
    const { credentialId } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: { name: 'Test Badge' },
    });

    console.log('✓ Complete workflow stored to disk');

    // Create new store instance
    const kv2 = new DiskKv({ baseDir: TEST_DIR });
    const store2 = createKerStore(kv2);

    // Verify all data persisted
    expect(await store2.aliasToId('kel', 'issuer')).toBe(issuerAid);
    expect(await store2.aliasToId('kel', 'holder')).toBe(holderAid);
    expect(await store2.aliasToId('tel', 'credentials')).toBe(registryId);
    expect(await store2.aliasToId('schema', 'badge')).toBe(schemaId);

    const telEvents = await store2.listTel(registryId);
    expect(telEvents).toHaveLength(2); // vcp + iss

    const credential = await store2.getEvent(credentialId);
    expect(credential).toBeDefined();

    console.log('✓ All workflow data persisted and accessible');
  });

  it('should work with KeritsDSL and persist accounts', async () => {
    // Create DSL with disk storage
    const kv = new DiskKv({ baseDir: TEST_DIR });
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create accounts
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_1);
    const account1 = await dsl.newAccount('alice', mnemonic1);

    const mnemonic2 = dsl.newMnemonic(TEST_SEED_2);
    const account2 = await dsl.newAccount('bob', mnemonic2);

    console.log('✓ Created 2 accounts with disk storage');

    // Create new DSL instance with same directory
    const kv2 = new DiskKv({ baseDir: TEST_DIR });
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);

    // Verify accounts persisted
    const names = await dsl2.accountNames();
    expect(names).toEqual(['alice', 'bob']);

    const retrievedAlice = await dsl2.getAccount('alice');
    expect(retrievedAlice?.aid).toBe(account1.aid);

    const retrievedBob = await dsl2.getAccount('bob');
    expect(retrievedBob?.aid).toBe(account2.aid);

    console.log('✓ Accounts persisted and accessible from new DSL instance');
  });

  it('should handle large numbers of events on disk', async () => {
    const kv = new DiskKv({ baseDir: TEST_DIR });
    const store = createKerStore(kv);

    // Create multiple identities
    const numIdentities = 10;
    const aids: string[] = [];

    for (let i = 0; i < numIdentities; i++) {
      const seed = new Uint8Array(32).fill(i + 1);
      const kp = await generateKeypairFromSeed(seed);

      const { aid } = await createIdentity(store, {
        alias: `user-${i}`,
        keys: [kp.verfer],
        nextKeys: [kp.verfer],
      });

      aids.push(aid);
    }

    console.log(`✓ Created ${numIdentities} identities on disk`);

    // Verify all persisted
    const aliases = await store.listAliases('kel');
    expect(aliases).toHaveLength(numIdentities);

    // Create new instance and verify
    const kv2 = new DiskKv({ baseDir: TEST_DIR });
    const store2 = createKerStore(kv2);

    for (let i = 0; i < numIdentities; i++) {
      const aid = await store2.aliasToId('kel', `user-${i}`);
      expect(aid).toBe(aids[i]);
    }

    console.log(`✓ All ${numIdentities} identities accessible from disk`);
  });

  it('should maintain data integrity across multiple sessions', async () => {
    const kp = await generateKeypairFromSeed(TEST_SEED_1);
    let aid: string;

    // Session 1: Create identity
    {
      const kv = new DiskKv({ baseDir: TEST_DIR });
      const store = createKerStore(kv);

      const result = await createIdentity(store, {
        alias: 'persistent',
        keys: [kp.verfer],
        nextKeys: [kp.verfer],
      });
      aid = result.aid;
    }

    // Session 2: Create registry
    {
      const kv = new DiskKv({ baseDir: TEST_DIR });
      const store = createKerStore(kv);

      await createRegistry(store, {
        alias: 'registry-1',
        issuerAid: aid,
      });
    }

    // Session 3: Verify everything
    {
      const kv = new DiskKv({ baseDir: TEST_DIR });
      const store = createKerStore(kv);

      const resolvedAid = await store.aliasToId('kel', 'persistent');
      expect(resolvedAid).toBe(aid);

      const kelEvents = await store.listKel(aid);
      expect(kelEvents).toHaveLength(2); // icp + ixn (anchor)

      const registryId = await store.aliasToId('tel', 'registry-1');
      expect(registryId).toBeDefined();
    }

    console.log('✓ Data integrity maintained across sessions');
  });
});
