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
    console.log('\n=== STORAGE ROUND-TRIP TEST ===\n');
    (globalThis as any).DEBUG_SIGNING = true;

    // Setup
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const keyManager = new KeyManager();

    const seed = new Uint8Array(32).fill(1);
    const keypair = await generateKeypairFromSeed(seed);

    const aid = keypair.verfer;
    // Pass seed directly instead of round-tripping through mnemonic (which has bugs)
    await keyManager.unlock(aid, seed);

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

    // Parse the retrieved event
    console.log('\n4. Parsing retrieved event...');
    const { event, signatures } = parseCesrStream(icpEvent.raw);
    console.log('   Event bytes:', event.length);
    console.log('   Signatures:', signatures ? signatures.length : 0);

    if (signatures) {
      const sigText = new TextDecoder().decode(signatures);
      console.log('   Signature section:', sigText.substring(0, 50) + '...');
    }

    // Show what we're verifying
    console.log('\n5. Event content:');
    const eventText = new TextDecoder().decode(event);
    console.log('   First 150 chars:', eventText.substring(0, 150));
    console.log('   Last 50 chars:', eventText.slice(-50));

    // Debug: Check if event has the double framing issue
    const jsonStart = eventText.indexOf('{');
    if (jsonStart > 0) {
      const frame = eventText.substring(0, jsonStart);
      const jsonStr = eventText.substring(jsonStart);
      console.log('   Frame part:', frame);
      console.log('   JSON starts with:', jsonStr.substring(0, 50));

      // Check if JSON also contains 'v' field
      const jsonObj = JSON.parse(jsonStr);
      console.log('   JSON.v field:', jsonObj.v);
      console.log('   Frame and JSON.v match:', frame.includes(jsonObj.v));
    }

    // Recreate the same event locally to compare
    console.log('\n6. Recreating event locally...');
    const { incept } = await import('../../src/incept');
    const { diger } = await import('../../src/diger');
    const nextDigests = [keypair.verfer].map(key => diger(key));
    const localIcp = incept({
      keys: [keypair.verfer],
      ndigs: nextDigests,
    });
    const localJson = JSON.stringify(localIcp.ked);
    const localEventBytes = new TextEncoder().encode(`-${localIcp.ked.v}${localJson}`);
    console.log('   Local event length:', localEventBytes.length);
    console.log('   Retrieved event length:', event.length);
    console.log('   Lengths match:', localEventBytes.length === event.length);

    // Compare bytes
    if (localEventBytes.length === event.length) {
      let firstDiff = -1;
      for (let i = 0; i < localEventBytes.length; i++) {
        if (localEventBytes[i] !== event[i]) {
          firstDiff = i;
          break;
        }
      }
      if (firstDiff >= 0) {
        console.log('   First difference at byte:', firstDiff);
        const context = 20;
        const start = Math.max(0, firstDiff - context);
        const end = Math.min(localEventBytes.length, firstDiff + context);
        console.log('   Local bytes around diff:', new TextDecoder().decode(localEventBytes.slice(start, end)));
        console.log('   Retrieved bytes around diff:', new TextDecoder().decode(event.slice(start, end)));
      } else {
        console.log('   Bytes are IDENTICAL!');
      }
    }

    // Verify
    console.log('\n7. Verifying signatures...');
    const result = await verifyEvent(
      icpEvent.raw,
      [keypair.verfer],
      1
    );

    console.log('   Valid:', result.valid);
    console.log('   Verified count:', result.verifiedCount);
    console.log('   Required count:', result.requiredCount);
    if (result.errors.length > 0) {
      console.log('   Errors:', result.errors);
    }

    expect(result.valid).toBe(true);
  });
});
