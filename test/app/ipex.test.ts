/**
 * IPEX (Issuance and Presentation Exchange) Test
 *
 * Tests the full IPEX credential exchange workflow:
 * 1. Issuer exports credential in IPEX grant format
 * 2. Holder imports IPEX grant and seals it in their TEL
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { DiskKv } from '../../src/storage/adapters/disk';
import { createKerStore } from '../../src/storage/core';
import type { KerStore } from '../../src/storage/types';
import { createGrant, parseExchangeMessage } from '../../src/ipex';
import * as fs from 'fs';
import * as path from 'path';

describe('IPEX Credential Exchange', () => {
  const testDir = path.join('/tmp', 'kerits-test-ipex-' + Date.now());
  let issuerStore: KerStore;
  let holderStore: KerStore;
  let issuerDSL: Awaited<ReturnType<typeof createKeritsDSL>>;
  let holderDSL: Awaited<ReturnType<typeof createKeritsDSL>>;

  beforeEach(async () => {
    // Clean test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Create separate stores for issuer and holder
    const issuerDir = path.join(testDir, 'issuer');
    const holderDir = path.join(testDir, 'holder');

    const issuerKv = new DiskKv({ baseDir: issuerDir, createIfMissing: true });
    const holderKv = new DiskKv({ baseDir: holderDir, createIfMissing: true });

    issuerStore = createKerStore(issuerKv);
    holderStore = createKerStore(holderKv);

    issuerDSL = await createKeritsDSL(issuerStore);
    holderDSL = await createKeritsDSL(holderStore);
  });

  test('Full IPEX workflow: issue → export → import → seal', async () => {
    // ========================================
    // STEP 1: Setup issuer account and schema
    // ========================================

    // Create issuer mnemonic and account
    const issuerSeed = new Uint8Array(32).fill(1);
    const issuerMnemonic = issuerDSL.newMnemonic(issuerSeed);
    await issuerDSL.newAccount('issuer', issuerMnemonic);

    // Get account DSL
    const issuerAccount = await issuerDSL.account('issuer');
    if (!issuerAccount) throw new Error('Issuer account not found');

    const schemaContent = {
      title: 'Test Schema',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };

    const issuerSchema = await issuerDSL.createSchema('test-schema', schemaContent);

    // Create TEL registry for issuer
    const issuerRegistry = await issuerAccount.createRegistry('issuer-registry');

    // ========================================
    // STEP 2: Setup holder account
    // ========================================

    // Create holder mnemonic and account
    const holderSeed = new Uint8Array(32).fill(2);
    const holderMnemonic = holderDSL.newMnemonic(holderSeed);
    await holderDSL.newAccount('holder', holderMnemonic);

    // Get account DSL
    const holderAccount = await holderDSL.account('holder');
    if (!holderAccount) throw new Error('Holder account not found');

    // Holder creates their own registry to seal received credentials
    const holderRegistry = await holderAccount.createRegistry('holder-registry');

    // ========================================
    // STEP 3: Issuer creates and issues credential
    // ========================================

    const credential = await issuerRegistry.issue({
      alias: 'test-credential',
      schema: 'test-schema',
      holder: holderAccount.account.aid,
      data: {
        name: 'Alice',
        age: 30,
      },
    });

    // Verify credential was created
    expect(credential.acdc.credentialId).toBeTruthy();
    expect(credential.acdc.issuerAid).toBe(issuerAccount.account.aid);
    expect(credential.acdc.holderAid).toBe(holderAccount.account.aid);

    // ========================================
    // STEP 4: Export credential in IPEX grant format
    // ========================================

    // Use the new exportIPEX method
    const grantJSON = await credential.exportIPEX();
    expect(grantJSON).toBeTruthy();
    expect(grantJSON.includes('ipex/grant')).toBe(true);

    const grantMessage = JSON.parse(grantJSON);
    console.log('✓ Generated IPEX grant message:', grantMessage.d.substring(0, 12) + '...');

    // Verify anchoring event includes public keys
    expect(grantMessage.e.anc).toBeTruthy();
    expect(grantMessage.e.anc.k).toBeTruthy();
    expect(Array.isArray(grantMessage.e.anc.k)).toBe(true);
    expect(grantMessage.e.anc.k.length).toBeGreaterThan(0);
    console.log('✓ Anchoring event includes', grantMessage.e.anc.k.length, 'public key(s)');

    // Verify ISS event includes signatures
    expect(grantMessage.e.iss.sigs).toBeTruthy();
    expect(Array.isArray(grantMessage.e.iss.sigs)).toBe(true);
    expect(grantMessage.e.iss.sigs.length).toBeGreaterThan(0);
    console.log('✓ ISS event includes', grantMessage.e.iss.sigs.length, 'signature(s)');

    // ========================================
    // STEP 5: Holder imports IPEX grant
    // ========================================

    // Parse the received grant message
    const receivedGrant = parseExchangeMessage(grantJSON);
    expect(receivedGrant.r).toBe('/ipex/grant');
    expect(receivedGrant.i).toBe(issuerAccount.account.aid);
    expect(receivedGrant.a.i).toBe(holderAccount.account.aid);

    // Extract embedded credential and events
    expect(receivedGrant.e).toBeTruthy();
    expect(receivedGrant.e!.acdc).toBeTruthy();
    expect(receivedGrant.e!.iss).toBeTruthy();

    const receivedACDC = receivedGrant.e!.acdc;
    const receivedIssEvent = receivedGrant.e!.iss;

    console.log('✓ Received credential:', receivedACDC.d.substring(0, 12) + '...');

    // Verify the credential SAID matches
    expect(receivedACDC.d).toBe(credential.acdc.credentialId);

    // ========================================
    // STEP 6: Holder seals credential in their TEL
    // ========================================

    // Use the accept method to import and seal the credential
    const acceptedCred = await holderRegistry.accept({
      credential: receivedACDC,
      issEvent: receivedIssEvent,
      alias: 'received-credential',
    });

    console.log('✓ Sealed credential in holder TEL');

    // ========================================
    // STEP 7: Verify holder can access the credential
    // ========================================

    // List holder's credentials
    const holderCredentialAliases = await holderRegistry.listACDCs();
    expect(holderCredentialAliases.length).toBeGreaterThan(0);
    expect(holderCredentialAliases).toContain('received-credential');

    // Get the received credential
    const holderACDCDSL = await holderRegistry.acdc('received-credential');
    expect(holderACDCDSL).toBeTruthy();
    expect(holderACDCDSL!.acdc.credentialId).toBe(credential.acdc.credentialId);

    // Verify credential data
    const holderACDCData = await holderStore.getACDC(credential.acdc.credentialId);
    expect(holderACDCData).toBeTruthy();
    expect(holderACDCData!.a.name).toBe('Alice');
    expect(holderACDCData!.a.age).toBe(30);

    console.log('✓ Holder successfully imported and sealed credential');
    console.log('✓ IPEX workflow complete!');
  });
});
