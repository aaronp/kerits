/**
 * Test navigation from ACDC/TEL back to KEL inception
 */

import { describe, expect, test } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { KeyManager } from '../../src/app/keymanager';
import { createIdentity, createRegistry, createSchema, issueCredential } from '../../src/app/helpers';
import { generateKeypairFromSeed } from '../../src/signer';
import { seedToMnemonic } from '../../src/app/dsl/utils/mnemonic';
import { parseCesrStream } from '../../src/app/signing';

describe('Event Navigation', () => {
  test('should navigate from ACDC to KEL inception via issuer AID', async () => {
    console.log('\n=== Testing ACDC → KEL Navigation ===\n');

    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const keyManager = new KeyManager({ debug: false });

    // Setup issuer
    const issuerSeed = new Uint8Array(32).fill(1);
    const issuerMnemonic = seedToMnemonic(issuerSeed);
    const issuerKeypair = await generateKeypairFromSeed(issuerSeed);
    const issuerAid = issuerKeypair.verfer;
    await keyManager.unlock(issuerAid, issuerMnemonic);

    const { icp } = await createIdentity(store, {
      alias: 'issuer',
      keys: [issuerKeypair.verfer],
      nextKeys: [issuerKeypair.verfer],
    }, keyManager);

    console.log('Issuer AID:', issuerAid.substring(0, 30) + '...');
    console.log('ICP SAID:', icp.said);

    // Setup holder
    const holderSeed = new Uint8Array(32).fill(2);
    const holderKeypair = await generateKeypairFromSeed(holderSeed);
    const holderAid = holderKeypair.verfer;

    await createIdentity(store, {
      alias: 'holder',
      keys: [holderKeypair.verfer],
      nextKeys: [holderKeypair.verfer],
    });

    // Create registry
    const { registryId } = await createRegistry(store, {
      alias: 'credentials',
      issuerAid,
    }, keyManager);

    // Create schema
    const { schemaId } = await createSchema(store, {
      alias: 'test-schema',
      schema: {
        title: 'Test Credential',
        properties: {
          name: { type: 'string' },
        },
      },
    });

    // Issue credential
    const { credentialId } = await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'Alice Smith',
      },
    }, keyManager);

    console.log('Credential ID:', credentialId.substring(0, 30) + '...');

    // Navigate from ACDC to KEL inception
    // Step 1: Get ACDC event
    const acdcEvent = await store.getEvent(credentialId);
    expect(acdcEvent).toBeDefined();

    console.log('\n1. Retrieved ACDC event');

    // Step 2: Parse ACDC to get issuer AID
    const { event: acdcBytes } = parseCesrStream(acdcEvent!.raw);
    const acdcText = new TextDecoder().decode(acdcBytes);
    const acdcJson = JSON.parse(acdcText.substring(acdcText.indexOf('{')));

    const issuerAidFromAcdc = acdcJson.i;
    console.log('2. Extracted issuer AID from ACDC:', issuerAidFromAcdc.substring(0, 30) + '...');
    expect(issuerAidFromAcdc).toBe(issuerAid);

    // Step 3: Navigate to issuer's KEL
    const kelEvents = await store.listKel(issuerAidFromAcdc);
    expect(kelEvents.length).toBeGreaterThan(0);

    console.log('3. Retrieved issuer KEL:', kelEvents.length, 'events');

    // Step 4: Get ICP event (first event in KEL)
    const icpEvent = kelEvents[0];
    expect(icpEvent.meta.t).toBe('icp');
    expect(icpEvent.meta.i).toBe(issuerAid);

    console.log('4. Found ICP event');
    console.log('   - Event type:', icpEvent.meta.t);
    console.log('   - Identifier:', icpEvent.meta.i.substring(0, 30) + '...');
    console.log('   - SAID:', icpEvent.meta.d.substring(0, 30) + '...');

    console.log('\n✓ Successfully navigated from ACDC to KEL inception\n');
  });

  test('should navigate from TEL registry to KEL inception via issuer AID', async () => {
    console.log('\n=== Testing TEL → KEL Navigation ===\n');

    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const keyManager = new KeyManager({ debug: false });

    // Setup issuer
    const issuerSeed = new Uint8Array(32).fill(1);
    const issuerMnemonic = seedToMnemonic(issuerSeed);
    const issuerKeypair = await generateKeypairFromSeed(issuerSeed);
    const issuerAid = issuerKeypair.verfer;
    await keyManager.unlock(issuerAid, issuerMnemonic);

    const { icp } = await createIdentity(store, {
      alias: 'issuer',
      keys: [issuerKeypair.verfer],
      nextKeys: [issuerKeypair.verfer],
    }, keyManager);

    console.log('Issuer AID:', issuerAid.substring(0, 30) + '...');

    // Create registry
    const { registryId, vcp } = await createRegistry(store, {
      alias: 'credentials',
      issuerAid,
    }, keyManager);

    console.log('Registry ID:', registryId.substring(0, 30) + '...');

    // Navigate from TEL to KEL inception
    // Step 1: Get VCP event (registry inception)
    const vcpEvent = await store.getEvent(registryId);
    expect(vcpEvent).toBeDefined();

    console.log('\n1. Retrieved VCP event');

    // Step 2: Parse VCP to get issuer AID
    const { event: vcpBytes } = parseCesrStream(vcpEvent!.raw);
    const vcpText = new TextDecoder().decode(vcpBytes);
    const vcpJson = JSON.parse(vcpText.substring(vcpText.indexOf('{')));

    const issuerAidFromVcp = vcpJson.ii;
    console.log('2. Extracted issuer AID from VCP:', issuerAidFromVcp.substring(0, 30) + '...');
    expect(issuerAidFromVcp).toBe(issuerAid);

    // Step 3: Navigate to issuer's KEL
    const kelEvents = await store.listKel(issuerAidFromVcp);
    expect(kelEvents.length).toBeGreaterThan(0);

    console.log('3. Retrieved issuer KEL:', kelEvents.length, 'events');

    // Step 4: Get ICP event (first event in KEL)
    const icpEvent = kelEvents[0];
    expect(icpEvent.meta.t).toBe('icp');
    expect(icpEvent.meta.i).toBe(issuerAid);

    console.log('4. Found ICP event');
    console.log('   - Event type:', icpEvent.meta.t);
    console.log('   - Identifier:', icpEvent.meta.i.substring(0, 30) + '...');
    console.log('   - SAID:', icpEvent.meta.d.substring(0, 30) + '...');

    console.log('\n✓ Successfully navigated from TEL to KEL inception\n');
  });

  test('should navigate from TEL ISS event to KEL via registry VCP', async () => {
    console.log('\n=== Testing TEL ISS → VCP → KEL Navigation ===\n');

    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const keyManager = new KeyManager({ debug: false });

    // Setup issuer
    const issuerSeed = new Uint8Array(32).fill(1);
    const issuerMnemonic = seedToMnemonic(issuerSeed);
    const issuerKeypair = await generateKeypairFromSeed(issuerSeed);
    const issuerAid = issuerKeypair.verfer;
    await keyManager.unlock(issuerAid, issuerMnemonic);

    await createIdentity(store, {
      alias: 'issuer',
      keys: [issuerKeypair.verfer],
      nextKeys: [issuerKeypair.verfer],
    }, keyManager);

    // Setup holder
    const holderSeed = new Uint8Array(32).fill(2);
    const holderKeypair = await generateKeypairFromSeed(holderSeed);
    const holderAid = holderKeypair.verfer;

    await createIdentity(store, {
      alias: 'holder',
      keys: [holderKeypair.verfer],
      nextKeys: [holderKeypair.verfer],
    });

    // Create registry
    const { registryId } = await createRegistry(store, {
      alias: 'credentials',
      issuerAid,
    }, keyManager);

    console.log('Registry ID:', registryId.substring(0, 30) + '...');

    // Create schema
    const { schemaId } = await createSchema(store, {
      alias: 'test-schema',
      schema: {
        title: 'Test Credential',
        properties: {
          name: { type: 'string' },
        },
      },
    });

    // Issue credential
    await issueCredential(store, {
      registryId,
      schemaId,
      issuerAid,
      holderAid,
      credentialData: {
        name: 'Bob Jones',
      },
    }, keyManager);

    // Navigate from ISS event to KEL
    // Step 1: Get TEL events for registry
    const telEvents = await store.listTel(registryId);
    expect(telEvents.length).toBeGreaterThan(0);

    console.log('\n1. Retrieved TEL events:', telEvents.length);

    // Step 2: Find ISS event
    const issEvent = telEvents.find(e => e.meta.t === 'iss');
    expect(issEvent).toBeDefined();

    console.log('2. Found ISS event');

    // Step 3: Get registry ID from ISS event
    const registryIdFromIss = issEvent!.meta.ri;
    console.log('3. Extracted registry ID from ISS:', registryIdFromIss.substring(0, 30) + '...');
    expect(registryIdFromIss).toBe(registryId);

    // Step 4: Get VCP event (first event in TEL, which is the registry ID)
    const vcpEvent = await store.getEvent(registryIdFromIss);
    expect(vcpEvent).toBeDefined();

    console.log('4. Retrieved VCP event');

    // Step 5: Parse VCP to get issuer AID
    const { event: vcpBytes } = parseCesrStream(vcpEvent!.raw);
    const vcpText = new TextDecoder().decode(vcpBytes);
    const vcpJson = JSON.parse(vcpText.substring(vcpText.indexOf('{')));

    const issuerAidFromVcp = vcpJson.ii;
    console.log('5. Extracted issuer AID from VCP:', issuerAidFromVcp.substring(0, 30) + '...');

    // Step 6: Navigate to issuer's KEL
    const kelEvents = await store.listKel(issuerAidFromVcp);
    expect(kelEvents.length).toBeGreaterThan(0);

    console.log('6. Retrieved issuer KEL:', kelEvents.length, 'events');

    // Step 7: Get ICP event
    const icpEvent = kelEvents[0];
    expect(icpEvent.meta.t).toBe('icp');

    console.log('7. Found ICP event');
    console.log('   - Event type:', icpEvent.meta.t);
    console.log('   - Identifier:', icpEvent.meta.i.substring(0, 30) + '...');

    console.log('\n✓ Successfully navigated from ISS event to KEL inception via VCP\n');
  });
});
