/**
 * Test that credentials (ISS/REV events) are properly signed
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { KeyManager } from '../../src/app/keymanager';
import { createIdentity, createRegistry, createSchema, issueCredential, revokeCredential } from '../../src/app/helpers';
import { generateKeypairFromSeed } from '../../src/signer';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';
import { hasSignatures, verifyEvent } from '../../src/app/verification';
import { parseCesrStream, parseIndexedSignatures } from '../../src/app/signing';

describe('Credential Signing', () => {
  let store: ReturnType<typeof createKerStore>;
  let keyManager: KeyManager;
  let issuerAid: string;
  let issuerKeypair: Awaited<ReturnType<typeof generateKeypairFromSeed>>;
  let holderAid: string;
  let registryId: string;
  let schemaId: string;

  beforeEach(async () => {
    const kv = new MemoryKv();
    store = createKerStore(kv);
    keyManager = new KeyManager({ debug: false });

    // Setup issuer
    const issuerSeed = new Uint8Array(32).fill(1);
    const issuerMnemonic = seedToMnemonic(issuerSeed);
    issuerKeypair = await generateKeypairFromSeed(issuerSeed);
    issuerAid = issuerKeypair.verfer;
    await keyManager.unlock(issuerAid, issuerMnemonic);

    await createIdentity(store, {
      alias: 'issuer',
      keys: [issuerKeypair.verfer],
      nextKeys: [issuerKeypair.verfer],
    }, keyManager);

    // Setup holder
    const holderSeed = new Uint8Array(32).fill(2);
    const holderKeypair = await generateKeypairFromSeed(holderSeed);
    holderAid = holderKeypair.verfer;

    await createIdentity(store, {
      alias: 'holder',
      keys: [holderKeypair.verfer],
      nextKeys: [holderKeypair.verfer],
    });

    // Create registry
    const regResult = await createRegistry(store, {
      alias: 'credentials',
      issuerAid,
    }, keyManager);
    registryId = regResult.registryId;

    // Create schema
    const schemaResult = await createSchema(store, {
      alias: 'test-schema',
      schema: {
        title: 'Test Credential',
        properties: {
          name: { type: 'string' },
          score: { type: 'number' },
        },
      },
    });
    schemaId = schemaResult.schemaId;
  });

  test('should sign ISS event when issuing credential', async () => {
    console.log('\n=== Testing ISS Event Signing ===\n');

    // Issue credential
    const { credentialId } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'Alice Smith',
        score: 95,
      },
    }, keyManager);

    console.log('Credential issued:', credentialId.substring(0, 20) + '...');

    // Get TEL events
    const telEvents = await store.listTel(registryId);
    console.log('TEL events count:', telEvents.length);

    // Find ISS event (should be the last event)
    const issEvent = telEvents.find(e => e.meta.t === 'iss');
    expect(issEvent).toBeDefined();

    console.log('ISS event SAID:', issEvent!.meta.d);

    // Check that ISS event has signatures
    const hasSigs = hasSignatures(issEvent!.raw);
    console.log('ISS event has signatures:', hasSigs);
    expect(hasSigs).toBe(true);

    // Parse signatures
    const { event, signatures } = parseCesrStream(issEvent!.raw);
    expect(signatures).toBeDefined();
    expect(signatures!.length).toBeGreaterThan(0);

    const parsedSigs = parseIndexedSignatures(signatures!);
    console.log('Parsed signatures count:', parsedSigs.length);
    console.log('First signature:', parsedSigs[0].signature.substring(0, 30) + '...');

    // Verify signature
    const verifyResult = await verifyEvent(
      issEvent!.raw,
      [issuerKeypair.verfer],
      1
    );

    console.log('Verification result:', {
      valid: verifyResult.valid,
      verifiedCount: verifyResult.verifiedCount,
      errors: verifyResult.errors,
    });

    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.verifiedCount).toBe(1);

    console.log('✓ ISS event is properly signed and verified\n');
  });

  test('should sign REV event when revoking credential', async () => {
    console.log('\n=== Testing REV Event Signing ===\n');

    // Issue credential first
    const { credentialId } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'Bob Jones',
        score: 88,
      },
    }, keyManager);

    console.log('Credential issued:', credentialId.substring(0, 20) + '...');

    // Revoke credential
    await revokeCredential(store, {
      registryId,
      credentialId,
      issuerAid,
    }, keyManager);

    console.log('Credential revoked');

    // Get TEL events
    const telEvents = await store.listTel(registryId);
    console.log('TEL events count:', telEvents.length);

    // Find REV event (should be the last event)
    const revEvent = telEvents.find(e => e.meta.t === 'rev');
    expect(revEvent).toBeDefined();

    console.log('REV event SAID:', revEvent!.meta.d);

    // Check that REV event has signatures
    const hasSigs = hasSignatures(revEvent!.raw);
    console.log('REV event has signatures:', hasSigs);
    expect(hasSigs).toBe(true);

    // Parse signatures
    const { event, signatures } = parseCesrStream(revEvent!.raw);
    expect(signatures).toBeDefined();
    expect(signatures!.length).toBeGreaterThan(0);

    const parsedSigs = parseIndexedSignatures(signatures!);
    console.log('Parsed signatures count:', parsedSigs.length);
    console.log('First signature:', parsedSigs[0].signature.substring(0, 30) + '...');

    // Verify signature
    const verifyResult = await verifyEvent(
      revEvent!.raw,
      [issuerKeypair.verfer],
      1
    );

    console.log('Verification result:', {
      valid: verifyResult.valid,
      verifiedCount: verifyResult.verifiedCount,
      errors: verifyResult.errors,
    });

    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.verifiedCount).toBe(1);

    console.log('✓ REV event is properly signed and verified\n');
  });

  test('should include public key and signature in ISS event metadata', async () => {
    console.log('\n=== Testing ISS Event Metadata ===\n');

    // Issue credential
    const { iss } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'Charlie Brown',
        score: 92,
      },
    }, keyManager);

    // Check that ISS event includes signatures and public key in metadata
    expect(iss.sad.sigs).toBeDefined();
    expect(iss.sad.k).toBeDefined();
    expect(iss.sad.k).toHaveLength(1);
    expect(iss.sad.k[0]).toBe(issuerKeypair.verfer);

    console.log('Public key in ISS metadata:', iss.sad.k[0].substring(0, 30) + '...');
    console.log('Signature in ISS metadata:', iss.sad.sigs[0].substring(0, 30) + '...');

    console.log('✓ ISS event metadata includes public key and signature\n');
  });
});
