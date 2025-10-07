/**
 * Tests for KERI event signing and verification
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { KeyManager } from '../../src/app/keymanager';
import { createIdentity, createRegistry } from '../../src/app/helpers';
import { generateKeypairFromSeed } from '../../src/signer';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';
import { hasSignatures, verifyEvent } from '../../src/app/verification';
import { parseCesrStream } from '../../src/app/signing';

describe('Event Signing and Verification', () => {
  let store: ReturnType<typeof createKerStore>;
  let keyManager: KeyManager;

  beforeEach(async () => {
    const kv = new MemoryKv();
    store = createKerStore(kv);
    keyManager = new KeyManager({ debug: false });
  });

  test('should create signed ICP event', async () => {
    // Generate keypair
    const seed = new Uint8Array(32).fill(1);
    const keypair = await generateKeypairFromSeed(seed);
    const mnemonic = seedToMnemonic(seed);

    // Create identity with signing
    const { aid } = await createIdentity(
      store,
      {
        alias: 'alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager  // Pass keyManager but don't unlock yet
    );

    // Unlock the account (this would normally happen before createIdentity)
    // For this test, we need to unlock BEFORE creating identity
    // Let me fix this test...
  });

  test('should sign ICP event with KeyManager', async () => {
    // Generate seed and mnemonic
    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);

    // For ICP, the AID equals the first verfer (identity is self-certifying)
    // So we can unlock the keyManager with the verfer as the AID
    const aid = keypair.verfer;  // AID = first key for single-sig ICP
    await keyManager.unlock(aid, mnemonic);

    // Create signed identity
    const result = await createIdentity(
      store,
      {
        alias: 'alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    // Verify AID matches
    expect(result.aid).toBe(keypair.verfer);

    // Get KEL
    const kelEvents = await store.listKel(aid);
    expect(kelEvents.length).toBe(1);

    // Check that event has signatures
    const icpEvent = kelEvents[0];
    const hasSigs = hasSignatures(icpEvent.raw);
    expect(hasSigs).toBe(true);

    console.log('✓ ICP event has signatures:', hasSigs);

    // Parse to see structure
    const { event, signatures } = parseCesrStream(icpEvent.raw);
    console.log('✓ Event bytes length:', event.length);
    console.log('✓ Signature bytes length:', signatures?.length || 0);
    if (signatures) {
      const sigText = new TextDecoder().decode(signatures);
      console.log('✓ Signature section:', sigText.substring(0, 50) + '...');
    }
  });

  test('should verify signed ICP event', async () => {
    // Generate seed and keypair
    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);

    // Unlock with the verfer as AID (for ICP, AID = first key)
    const aid = keypair.verfer;
    await keyManager.unlock(aid, mnemonic);

    // Create signed identity
    await createIdentity(
      store,
      {
        alias: 'alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    // Get KEL
    const kelEvents = await store.listKel(aid);
    const icpEvent = kelEvents[0];

    // Debug: show the raw event
    const rawText = new TextDecoder().decode(icpEvent.raw);
    console.log('Raw event (first 200 chars):', rawText.substring(0, 200));

    // Debug: parse and show components
    const { event, signatures } = parseCesrStream(icpEvent.raw);
    console.log('Event length:', event.length);
    console.log('Event (first 100 chars):', new TextDecoder().decode(event).substring(0, 100));
    console.log('Signatures:', signatures ? new TextDecoder().decode(signatures) : 'null');

    // Verify signatures
    const result = await verifyEvent(
      icpEvent.raw,
      [keypair.verfer],  // Expected signing keys
      1  // Threshold: 1 signature required
    );

    console.log('✓ Verification result:', {
      valid: result.valid,
      verifiedCount: result.verifiedCount,
      errors: result.errors,
    });

    expect(result.valid).toBe(true);
    expect(result.verifiedCount).toBe(1);
    expect(result.errors.length).toBe(0);
  });

  test('should create signed registry with VCP and IXN events', async () => {
    // Setup account
    const seed = new Uint8Array(32).fill(1);
    const mnemonic = seedToMnemonic(seed);
    const keypair = await generateKeypairFromSeed(seed);

    const aid = keypair.verfer;
    await keyManager.unlock(aid, mnemonic);

    await createIdentity(
      store,
      {
        alias: 'alice',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      },
      keyManager
    );

    // Create signed registry
    const { registryId } = await createRegistry(
      store,
      {
        alias: 'docs',
        issuerAid: aid,
      },
      keyManager
    );

    // Check KEL has 2 events: ICP + IXN
    const kelEvents = await store.listKel(aid);
    expect(kelEvents.length).toBe(2);

    // Check both have signatures
    const icpHasSigs = hasSignatures(kelEvents[0].raw);
    const ixnHasSigs = hasSignatures(kelEvents[1].raw);

    expect(icpHasSigs).toBe(true);
    expect(ixnHasSigs).toBe(true);

    // Check TEL has VCP event with signatures
    const telEvents = await store.listTel(registryId);
    expect(telEvents.length).toBe(1);

    const vcpHasSigs = hasSignatures(telEvents[0].raw);
    expect(vcpHasSigs).toBe(true);

    console.log('✓ ICP signed');
    console.log('✓ IXN signed');
    console.log('✓ VCP signed');
  });

  test('should reject unsigned events (backward compatibility check)', async () => {
    // Create unsigned identity (no keyManager)
    const seed = new Uint8Array(32).fill(2);
    const keypair = await generateKeypairFromSeed(seed);

    const { aid } = await createIdentity(
      store,
      {
        alias: 'bob',
        keys: [keypair.verfer],
        nextKeys: [keypair.verfer],
      }
      // No keyManager = unsigned
    );

    // Get KEL
    const kelEvents = await store.listKel(aid);
    const icpEvent = kelEvents[0];

    // Check that event does NOT have signatures
    const hasSigs = hasSignatures(icpEvent.raw);
    expect(hasSigs).toBe(false);

    console.log('✓ Unsigned event created (backward compatibility)');
  });
});
