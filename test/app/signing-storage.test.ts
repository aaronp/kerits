/**
 * Test signing through storage layer
 */

import { describe, expect, test } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { KeyManager } from '../../src/app/keymanager';
import { generateKeypairFromSeed } from '../../src/signer';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';
import { createIdentity } from '../../src/app/helpers';
import { parseCesrStream } from '../../src/app/signing';
import { verifyEvent } from '../../src/app/verification';

describe('Signing Through Storage', () => {
  test('sign, store, retrieve, and verify', async () => {
    console.log('\n=== STORAGE ROUND-TRIP TEST (BIP39) ===\n');

    // Setup
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const keyManager = new KeyManager();

    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);

    console.log('Mnemonic:', mnemonic.split(' ').slice(0, 6).join(' ') + '...');

    const aid = keypair.verfer;
    // Now using proper BIP39 implementation
    await keyManager.unlock(aid, mnemonic);

    console.log('1. Created and unlocked account:', aid.substring(0, 20) + '...');

    // Create signed identity
    console.log('\n2. Creating signed identity...');
    const { aid: resultAid, icp } = await createIdentity(
      store,
      {
        alias: 'alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    console.log('   AID:', resultAid.substring(0, 20) + '...');
    console.log('   ICP SAID:', icp.said);

    // Retrieve from storage
    console.log('\n3. Retrieving from storage...');
    const kelEvents = await store.listKel(aid);
    console.log('   Retrieved', kelEvents.length, 'events');

    const icpEvent = kelEvents[0];
    console.log('   Raw bytes length:', icpEvent.raw.length);
    console.log('   Event type:', icpEvent.meta.t);
    console.log('   Event SAID:', icpEvent.meta.d);

    // Verify signatures
    console.log('4. Verifying signatures...');
    const result = await verifyEvent(
      icpEvent.raw,
      [keypair.verfer],
      1
    );

    console.log('   ✓ Valid:', result.valid);
    console.log('   ✓ Verified count:', result.verifiedCount);

    expect(result.valid).toBe(true);
    expect(result.verifiedCount).toBe(1);
  });
});
