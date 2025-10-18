/**
 * Full integration test: Account creation → Message sending → Verification
 *
 * This test creates two accounts using AccountDSL and sends a message between them
 * using the MessageBus API. The UI should use exactly the same flow.
 *
 * NOTE: This test requires browser APIs (indexedDB) and is skipped in the Bun test environment.
 * Run this test in a browser environment or with proper browser API mocks.
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getDSL } from '../lib/dsl';
import { getMessagingIdentity } from '../lib/messaging-bridge';
import { signPayload } from '../lib/keri-signer';
import { ConvexClient } from 'convex/browser';

const CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://accurate-penguin-901.convex.cloud';

// Skip this test suite - requires browser environment (indexedDB)
describe.skip('Full Message Flow Integration (Browser Only)', () => {
  const aliceUserId = 'test-alice-' + Date.now();
  const bobUserId = 'test-bob-' + Date.now();
  const aliceAccountAlias = 'alice';
  const bobAccountAlias = 'bob';

  let aliceAid: string;
  let bobAid: string;
  let convexClient: ConvexClient;

  beforeAll(async () => {
    convexClient = new ConvexClient(CONVEX_URL);
  });

  afterAll(() => {
    convexClient.close();
  });

  test('Step 1: Create Alice account using AccountDSL', async () => {
    console.log('\n=== Creating Alice Account ===');

    const dsl = await getDSL(aliceUserId);

    // Generate random seed
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const mnemonic = dsl.newMnemonic(seed);

    // Create account
    await dsl.newAccount(aliceAccountAlias, mnemonic);

    // Get account details
    const account = await dsl.getAccount(aliceAccountAlias);
    expect(account).toBeDefined();

    aliceAid = account!.aid;
    console.log('Alice AID:', aliceAid);

    // Verify account has KEL
    const accountDsl = await dsl.account(aliceAccountAlias);
    const kelEvents = await accountDsl!.getKel();
    expect(kelEvents.length).toBe(1); // Inception event

    console.log('✓ Alice account created');
  });

  test('Step 2: Create Bob account using AccountDSL', async () => {
    console.log('\n=== Creating Bob Account ===');

    const dsl = await getDSL(bobUserId);

    // Generate random seed
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const mnemonic = dsl.newMnemonic(seed);

    // Create account
    await dsl.newAccount(bobAccountAlias, mnemonic);

    // Get account details
    const account = await dsl.getAccount(bobAccountAlias);
    expect(account).toBeDefined();

    bobAid = account!.aid;
    console.log('Bob AID:', bobAid);

    console.log('✓ Bob account created');
  });

  test('Step 3: Get Alice messaging identity and verify it', async () => {
    console.log('\n=== Getting Alice Messaging Identity ===');

    const identity = await getMessagingIdentity(aliceUserId, aliceAccountAlias);

    console.log('Alice identity:');
    console.log('  AID:', identity.aid);
    console.log('  Signer public key:', identity.signer.verfer.qb64);
    console.log('  KSN:', identity.ksn);

    // Verify the identity makes sense
    expect(identity.aid).toBe(aliceAid);
    expect(identity.ksn).toBe(0);

    // CRITICAL: Verify signer's public key matches the AID
    // The signer.verfer.qb64 should match a key in the KEL
    const dsl = await getDSL(aliceUserId);
    const accountDsl = await dsl.account(aliceAccountAlias);
    const kelEvents = await accountDsl!.getKel();
    const latestEvent = kelEvents[kelEvents.length - 1];
    const ked = latestEvent.meta?.ked || latestEvent;
    const currentKeys = ked.k || ked.keys || [];

    console.log('  KEL keys:', currentKeys);
    expect(currentKeys).toContain(identity.signer.verfer.qb64);

    console.log('✓ Alice identity verified');
  });

  test('Step 4: Register Alice key state with Convex', async () => {
    console.log('\n=== Registering Alice Key State ===');

    const identity = await getMessagingIdentity(aliceUserId, aliceAccountAlias);

    // Get KEL info
    const dsl = await getDSL(aliceUserId);
    const accountDsl = await dsl.account(aliceAccountAlias);
    const kelEvents = await accountDsl!.getKel();
    const latestEvent = kelEvents[kelEvents.length - 1];
    const ked = latestEvent.meta?.ked || latestEvent;

    // Register with Convex
    await convexClient.mutation('auth:registerKeyState' as any, {
      aid: identity.aid,
      ksn: identity.ksn,
      keys: ked.k || ked.keys || [],
      threshold: ked.kt || '1',
      lastEvtSaid: ked.d || latestEvent.meta?.d || '',
    });

    console.log('✓ Alice key state registered');
  });

  test('Step 5: Register Bob key state with Convex', async () => {
    console.log('\n=== Registering Bob Key State ===');

    const identity = await getMessagingIdentity(bobUserId, bobAccountAlias);

    // Get KEL info
    const dsl = await getDSL(bobUserId);
    const accountDsl = await dsl.account(bobAccountAlias);
    const kelEvents = await accountDsl!.getKel();
    const latestEvent = kelEvents[kelEvents.length - 1];
    const ked = latestEvent.meta?.ked || latestEvent;

    // Register with Convex
    await convexClient.mutation('auth:registerKeyState' as any, {
      aid: identity.aid,
      ksn: identity.ksn,
      keys: ked.k || ked.keys || [],
      threshold: ked.kt || '1',
      lastEvtSaid: ked.d || latestEvent.meta?.d || '',
    });

    console.log('✓ Bob key state registered');
  });

  test('Step 6: Send message from Alice to Bob', async () => {
    console.log('\n=== Sending Message ===');

    const aliceIdentity = await getMessagingIdentity(aliceUserId, aliceAccountAlias);

    // Prepare message
    const messageContent = 'Hello Bob!';
    const ct = btoa(messageContent); // Simple base64 encoding for test
    const ttl = 86400000; // 24 hours

    // Compute ctHash
    const encoder = new TextEncoder();
    const ctData = encoder.encode(ct);
    const ctHashBuffer = await crypto.subtle.digest('SHA-256', ctData);
    const ctHashArray = Array.from(new Uint8Array(ctHashBuffer));
    const ctHash = ctHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Message:', messageContent);
    console.log('CT Hash:', ctHash);

    // Compute args hash
    const args = {
      recpAid: bobAid,
      ctHash,
      ttl,
      alg: '',
      ek: '',
    };
    const argsHash = await convexClient.query('auth:computeHash' as any, { args });
    console.log('Args hash:', argsHash);

    // Issue challenge
    const { challengeId, payload } = await convexClient.mutation('auth:issueChallenge' as any, {
      aid: aliceIdentity.aid,
      purpose: 'send',
      argsHash,
    });

    console.log('Challenge issued:', challengeId);
    console.log('Challenge payload:', payload);

    // Sign the challenge
    const sigs = await signPayload(payload, aliceIdentity.signer, 0);

    console.log('Signature created:', sigs[0].substring(0, 40) + '...');

    // Send the message
    const messageId = await convexClient.mutation('messages:send' as any, {
      recpAid: bobAid,
      ct,
      ttl,
      alg: '',
      ek: '',
      auth: {
        challengeId,
        sigs,
        ksn: aliceIdentity.ksn,
      },
    });

    console.log('✓ Message sent successfully!');
    console.log('  Message ID:', messageId);
    expect(messageId).toBeDefined();
  }, 30000);
});
