/**
 * Write-Time Indexer Tests
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { KeyManager } from '../../src/app/keymanager';
import { createIdentity } from '../../src/app/helpers';
import { generateKeypairFromSeed } from '../../src/signer';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';
import { WriteTimeIndexer } from '../../src/app/indexer/write-time-indexer';

describe('WriteTimeIndexer', () => {
  let store: ReturnType<typeof createKerStore>;
  let keyManager: KeyManager;
  let indexer: WriteTimeIndexer;

  beforeEach(() => {
    const kv = new MemoryKv();
    store = createKerStore(kv);
    keyManager = new KeyManager({ debug: false });
    indexer = new WriteTimeIndexer(store);
  });

  test('should add KEL event when creating identity', async () => {
    console.log('\n=== Testing KEL Event Indexing ===\n');

    // Setup
    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);
    const aid = keypair.verfer;

    await keyManager.unlock(aid, mnemonic);

    // Create identity (which should update indexer)
    const { aid: resultAid } = await createIdentity(
      store,
      {
        alias: 'test-alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    console.log('✓ Identity created:', resultAid.substring(0, 30) + '...');

    // Verify indexer was updated
    const kelEvents = await indexer.getKelEvents(aid);

    expect(kelEvents).toHaveLength(1);
    expect(kelEvents[0].eventType).toBe('icp');
    expect(kelEvents[0].signers).toHaveLength(1);
    expect(kelEvents[0].signers[0].publicKey).toBe(keypair.verfer);
    expect(kelEvents[0].currentKeys).toEqual([keypair.verfer]);

    console.log('✓ KEL event indexed');
    console.log('  - Event ID:', kelEvents[0].eventId.substring(0, 30) + '...');
    console.log('  - Event type:', kelEvents[0].eventType);
    console.log('  - Signers:', kelEvents[0].signers.length);
    console.log('  - Public key:', kelEvents[0].signers[0].publicKey.substring(0, 30) + '...');
    console.log('  - Signature:', kelEvents[0].signers[0].signature.substring(0, 30) + '...');

    // Verify alias was updated
    const aliases = await indexer.exportState();
    expect(aliases.aliasById.KELs[aid]).toBe('test-alice');
    expect(aliases.idsByAlias.KELs['test-alice']).toBe(aid);

    console.log('✓ Alias indexed: test-alice → AID\n');
  });

  test('should fail if event lacks signature', async () => {
    console.log('\n=== Testing Fail-Fast on Missing Signature ===\n');

    // Create identity WITHOUT keyManager (unsigned)
    const seed = new Uint8Array(32).fill(2);
    const keypair = await generateKeypairFromSeed(seed);

    // This should fail because unsigned events aren't allowed in the indexer
    try {
      await createIdentity(
        store,
        {
          alias: 'test-unsigned',
          keys: [keypair.verfer],
          nextKeys: [keypair.verfer],
        }
        // No keyManager = unsigned event
      );

      // If we get here, the test failed
      throw new Error('Expected integrity error for unsigned event');
    } catch (error: any) {
      expect(error.message).toContain('INTEGRITY ERROR');
      expect(error.message).toContain('no signatures');
      console.log('✓ Correctly rejected unsigned event');
      console.log('  Error:', error.message.substring(0, 100) + '...\n');
    }
  });

  test('should export full state', async () => {
    console.log('\n=== Testing State Export ===\n');

    // Create multiple identities
    for (let i = 0; i < 3; i++) {
      const seed = new Uint8Array(32).fill(i + 1);
      const mnemonic = seedToMnemonic(seed);
      const keypair = await generateKeypairFromSeed(seed);
      const aid = keypair.verfer;

      await keyManager.unlock(aid, mnemonic);

      await createIdentity(
        store,
        {
          alias: `alice-${i}`,
          keys: [keypair.verfer],
          nextKeys: [keypair.verfer],
        },
        keyManager
      );

      console.log(`✓ Created identity ${i + 1}: alice-${i}`);
    }

    // Export state
    const state = await indexer.exportState();

    expect(state.version).toBe('1.0.0');
    expect(Object.keys(state.kels)).toHaveLength(3);
    expect(Object.keys(state.aliasById.KELs)).toHaveLength(3);
    expect(Object.keys(state.idsByAlias.KELs)).toHaveLength(3);

    console.log('\n✓ State exported successfully');
    console.log('  - Version:', state.version);
    console.log('  - KELs:', Object.keys(state.kels).length);
    console.log('  - Aliases:', Object.keys(state.aliasById.KELs).length);
    console.log('  - Generated at:', state.generatedAt);

    // Verify each KEL has events
    for (const [kelId, events] of Object.entries(state.kels)) {
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('icp');
      console.log(`  - KEL ${state.aliasById.KELs[kelId]}: ${events.length} event(s)`);
    }

    console.log();
  });

  test('should verify integrity against KERI storage', async () => {
    console.log('\n=== Testing Integrity Verification ===\n');

    // Create identities
    for (let i = 0; i < 2; i++) {
      const seed = new Uint8Array(32).fill(i + 1);
      const mnemonic = seedToMnemonic(seed);
      const keypair = await generateKeypairFromSeed(seed);
      const aid = keypair.verfer;

      await keyManager.unlock(aid, mnemonic);

      await createIdentity(
        store,
        {
          alias: `bob-${i}`,
          keys: [keypair.verfer],
          nextKeys: [keypair.verfer],
        },
        keyManager
      );
    }

    // Verify integrity
    const report = await indexer.verifyIntegrity();

    console.log('✓ Integrity check completed');
    console.log('  - Valid:', report.valid);
    console.log('  - KEL events:', report.stats.totalKelEvents);
    console.log('  - TEL events:', report.stats.totalTelEvents);
    console.log('  - Events checked:', report.stats.eventsChecked);
    console.log('  - Errors found:', report.stats.errorsFound);

    expect(report.valid).toBe(true);
    expect(report.stats.totalKelEvents).toBe(2);
    expect(report.stats.eventsChecked).toBe(2);
    expect(report.errors).toHaveLength(0);

    console.log('\n✓ Index and KERI storage are consistent\n');
  });

  test('should handle multiple KEL events for same identifier', async () => {
    console.log('\n=== Testing Multiple KEL Events ===\n');

    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);
    const aid = keypair.verfer;

    await keyManager.unlock(aid, mnemonic);

    // Create identity (ICP event)
    await createIdentity(
      store,
      {
        alias: 'charlie',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    console.log('✓ Created identity with ICP event');

    // Verify we have 1 event
    let kelEvents = await indexer.getKelEvents(aid);
    expect(kelEvents).toHaveLength(1);
    expect(kelEvents[0].eventType).toBe('icp');
    expect(kelEvents[0].sequenceNumber).toBe(0);

    console.log('  - Event count:', kelEvents.length);
    console.log('  - First event type:', kelEvents[0].eventType);
    console.log('  - Sequence number:', kelEvents[0].sequenceNumber);

    // TODO: Add ROT event test once rotateKeys() is integrated

    console.log();
  });
});
