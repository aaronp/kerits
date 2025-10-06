/**
 * Example: Using different storage adapters
 *
 * Demonstrates MemoryKv (in-memory) and DiskKv (persistent) adapters
 */

import { createKerStore, MemoryKv, DiskKv } from '../src/storage';
import { createKeritsDSL } from '../src/app/dsl';

// Example 1: In-memory storage (for testing, temporary data)
async function exampleMemoryStorage() {
  console.log('\n=== In-Memory Storage Example ===\n');

  const kv = new MemoryKv();
  const store = createKerStore(kv);
  const dsl = createKeritsDSL(store);

  // Create account
  const seed = new Uint8Array(32).fill(1);
  const mnemonic = dsl.newMnemonic(seed);
  const account = await dsl.newAccount('alice', mnemonic);

  console.log('Created account:', account.alias);
  console.log('AID:', account.aid);
  console.log('Storage size:', kv.size(), 'keys');

  // Data only exists in memory - will be lost when process exits
  console.log('\n✓ Data stored in memory only');
}

// Example 2: On-disk storage (for production, persistent data)
async function exampleDiskStorage() {
  console.log('\n=== On-Disk Storage Example ===\n');

  const kv = new DiskKv({ baseDir: '/tmp/kerits-example' });
  const store = createKerStore(kv);
  const dsl = createKeritsDSL(store);

  // Create account
  const seed = new Uint8Array(32).fill(2);
  const mnemonic = dsl.newMnemonic(seed);
  const account = await dsl.newAccount('bob', mnemonic);

  console.log('Created account:', account.alias);
  console.log('AID:', account.aid);
  console.log('Storage location:', kv.getBaseDir());
  console.log('Storage size:', await kv.size(), 'keys');

  // Data persists to disk - will survive process restarts
  console.log('\n✓ Data persisted to disk at:', kv.getBaseDir());
}

// Example 3: Switching between adapters
async function exampleSwitchingAdapters() {
  console.log('\n=== Switching Adapters Example ===\n');

  // Start with memory storage
  const memKv = new MemoryKv();
  const memStore = createKerStore(memKv);
  const memDsl = createKeritsDSL(memStore);

  const seed = new Uint8Array(32).fill(3);
  const mnemonic = memDsl.newMnemonic(seed);
  await memDsl.newAccount('charlie', mnemonic);

  console.log('Created account in memory');
  console.log('Memory accounts:', await memDsl.accountNames());

  // Switch to disk storage (data won't transfer automatically)
  const diskKv = new DiskKv({ baseDir: '/tmp/kerits-example-2' });
  const diskStore = createKerStore(diskKv);
  const diskDsl = createKeritsDSL(diskStore);

  console.log('Disk accounts (empty):', await diskDsl.accountNames());

  // Recreate account on disk with same mnemonic
  await diskDsl.newAccount('charlie', mnemonic);
  console.log('Disk accounts (after migration):', await diskDsl.accountNames());

  console.log('\n✓ Same account recreated on disk from mnemonic');
}

// Example 4: Multiple disk stores (different directories)
async function exampleMultipleStores() {
  console.log('\n=== Multiple Disk Stores Example ===\n');

  // Create two separate stores
  const store1 = createKerStore(new DiskKv({ baseDir: '/tmp/kerits-store-1' }));
  const store2 = createKerStore(new DiskKv({ baseDir: '/tmp/kerits-store-2' }));

  const dsl1 = createKeritsDSL(store1);
  const dsl2 = createKeritsDSL(store2);

  // Create different accounts in each store
  const seed1 = new Uint8Array(32).fill(4);
  const mnemonic1 = dsl1.newMnemonic(seed1);
  await dsl1.newAccount('alice', mnemonic1);

  const seed2 = new Uint8Array(32).fill(5);
  const mnemonic2 = dsl2.newMnemonic(seed2);
  await dsl2.newAccount('bob', mnemonic2);

  console.log('Store 1 accounts:', await dsl1.accountNames());
  console.log('Store 2 accounts:', await dsl2.accountNames());

  console.log('\n✓ Two independent stores with different data');
}

// Run all examples
async function main() {
  await exampleMemoryStorage();
  await exampleDiskStorage();
  await exampleSwitchingAdapters();
  await exampleMultipleStores();

  console.log('\n=== All examples completed ===\n');
}

main().catch(console.error);
