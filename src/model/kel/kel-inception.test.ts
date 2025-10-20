/**
 * KEL Inception API Test
 *
 * TDD-style test to drive out the first end-to-end flow:
 * Flow 1: Inception (Create New Identifier)
 * Flow 2: Key Rotation
 */

import { describe, expect, test } from 'bun:test';
import { KelStores } from './api';
import { CESR } from '../cesr/cesr';

describe('KEL Inception Flow', () => {

    test('should create a new identifier with inception event', async () => {
        // Given: Alice wants to create a new identifier
        const alias = 'alice';
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // When: Alice creates an account (incepting a new identifier)
        const account = await api.createAccount({
            alias,
            // Optional: provide keys for deterministic testing
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // Then: The account should have an AID
        expect(account.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // Then: The alias should be stored
        const storedAid = await api.getAidByAlias(alias);
        expect(storedAid).toBe(account.aid);

        // Then: The inception event should be stored
        const events = await api.getKelChain(account.aid);
        expect(events).toHaveLength(1);
        expect(events[0]?.t).toBe('icp');
        expect(events[0]?.s).toBe('0');
        expect(events[0]?.i).toBe(account.aid);

        // Then: The keys should be stored in the vault
        const keys = await api.getKeys(account.aid);
        expect(keys?.currentKeys).toBeDefined();
        expect(keys?.nextKeys).toBeDefined();
    });

    test('should publish OOBI for discoverability', async () => {
        // Given: Alice has created an identifier
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);
        const account = await api.createAccount({
            alias: 'alice',
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: Alice publishes her OOBI
        // For now, we'll use a simple OOBI that just stores the inception event
        // We can iterate on the OOBI format later as mentioned in the plan
        const inceptionEvents = await api.getKelChain(account.aid);
        const oobiDoc = JSON.stringify({ events: inceptionEvents });

        // Store OOBI in a simple key-value store (we can use kelEvents for now)
        const oobiStore = stores.kelEvents;
        await oobiStore.put(
            `oobi:${account.aid}` as any,
            new TextEncoder().encode(oobiDoc)
        );

        // Then: The OOBI should be resolvable
        const retrievedBytes = await oobiStore.get(`oobi:${account.aid}` as any);
        expect(retrievedBytes).toBeDefined();

        const retrievedDoc = JSON.parse(new TextDecoder().decode(retrievedBytes!));
        expect(retrievedDoc.events).toHaveLength(1);
        expect(retrievedDoc.events[0].i).toBe(account.aid);
    });

    test('should retrieve account by alias', async () => {
        // Given: Alice has created an identifier
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);
        const account = await api.createAccount({
            alias: 'alice',
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: We retrieve the account by alias
        const retrieved = await api.getAccount({ alias: 'alice' });

        // Then: We should get the same account
        expect(retrieved?.aid).toBe(account.aid);
        expect(retrieved?.sequence).toBe(0);
    });

    test('should compute sequence number from chain', async () => {
        // Given: Alice has created an identifier (sequence 0)
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);
        const account = await api.createAccount({
            alias: 'alice',
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: We get the latest sequence number
        const sequence = await api.getLatestSequence(account.aid);

        // Then: The sequence should be 0 (inception)
        expect(sequence).toBe(0);
    });

    test('should rotate keys and verify exact stored data', async () => {
        // Given: Alice has created an identifier with deterministic keys
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);
        const account = await api.createAccount({
            alias: 'alice',
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // Verify initial state
        expect(account.sequence).toBe(0);
        expect(account.alias).toBe('alice');

        // Get initial keys
        const initialKeys = await api.getKeys(account.aid);
        expect(initialKeys).toBeDefined();
        expect(initialKeys?.currentKeys).toHaveLength(1);
        expect(initialKeys?.nextKeys).toHaveLength(1);

        const initialCurrentKey = initialKeys!.currentKeys[0]!.publicKey;
        const initialNextKey = initialKeys!.nextKeys[0]!.publicKey;

        // When: Alice rotates her keys
        const rotatedAccount = await api.rotateKeys({
            aid: account.aid,
            timestamp: '2025-01-01T12:00:00Z',
            nextSeed: 9999, // deterministic next key for testing
        });

        // Then: The sequence should increment
        expect(rotatedAccount.sequence).toBe(1);
        expect(rotatedAccount.aid).toBe(account.aid);
        expect(rotatedAccount.alias).toBe('alice');

        // Then: The chain should have 2 events (inception + rotation)
        const events = await api.getKelChain(account.aid);
        expect(events).toHaveLength(2);

        // Verify inception event
        const inceptionEvent = events[0]!;
        expect(inceptionEvent.t).toBe('icp');
        expect(inceptionEvent.s).toBe('0');
        expect(inceptionEvent.i).toBe(account.aid);

        // Verify rotation event
        const rotationEvent = events[1]!;
        expect(rotationEvent.t).toBe('rot');
        expect(rotationEvent.s).toBe('1');
        expect(rotationEvent.i).toBe(account.aid);
        expect(rotationEvent.p).toBe(inceptionEvent.d); // previous event SAID

        // Verify key rotation: current keys should be the previous next keys
        expect(rotationEvent.k).toContain(initialNextKey);
        expect(rotationEvent.k).not.toContain(initialCurrentKey);

        // Then: The keyset should be updated
        const rotatedKeys = await api.getKeys(account.aid);
        expect(rotatedKeys).toBeDefined();
        expect(rotatedKeys?.currentKeys).toHaveLength(1);
        expect(rotatedKeys?.nextKeys).toHaveLength(1);

        // Current key should be the previous next key
        expect(rotatedKeys!.currentKeys[0]!.publicKey).toBe(initialNextKey);

        // Next key should be new (generated from nextSeed: 9999)
        expect(rotatedKeys!.nextKeys[0]!.publicKey).not.toBe(initialNextKey);
        expect(rotatedKeys!.nextKeys[0]!.publicKey).not.toBe(initialCurrentKey);

        // Then: The alias mapping should still work
        const retrievedByAlias = await api.getAccount({ alias: 'alice' });
        expect(retrievedByAlias?.aid).toBe(account.aid);
        expect(retrievedByAlias?.sequence).toBe(1);

        // Then: The latest sequence should be updated
        const latestSequence = await api.getLatestSequence(account.aid);
        expect(latestSequence).toBe(1);

        // Then: Verify CESR envelope is stored
        const envelope = await stores.kelCesr.get(rotationEvent.d);
        expect(envelope).toBeDefined();

        const envelopeData = JSON.parse(new TextDecoder().decode(envelope!));
        expect(envelopeData.event.t).toBe('rot');
        expect(envelopeData.event.s).toBe('1');
        expect(envelopeData.signatures).toBeDefined();
        expect(envelopeData.signatures.length).toBeGreaterThan(0);

        // Then: Verify the rotation event SAID matches stored data
        expect(rotatedAccount.latestEvent).toBe(rotationEvent.d);
    });

    test('should support flexible key specifications', async () => {
        // Test different ways to specify keys

        // 1. Numeric seed (existing functionality)
        const stores1 = KelStores.inMemory();
        const api1 = KelStores.ops(stores1);
        const account1 = await api1.createAccount({
            alias: 'alice-numeric',
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });
        expect(account1.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // 2. Mnemonic phrase
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);
        const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const account2 = await api2.createAccount({
            alias: 'alice-mnemonic',
            currentKeySeed: mnemonic,
            nextKeySeed: mnemonic,
        });
        expect(account2.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // 3. Pre-generated keypair
        const stores3 = KelStores.inMemory();
        const api3 = KelStores.ops(stores3);
        const keypair = CESR.keypairFrom(9999, true);
        const account3 = await api3.createAccount({
            alias: 'alice-keypair',
            currentKeySeed: keypair,
            nextKeySeed: keypair,
        });
        expect(account3.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // 4. Mixed specifications
        const stores4 = KelStores.inMemory();
        const api4 = KelStores.ops(stores4);
        const account4 = await api4.createAccount({
            alias: 'alice-mixed',
            currentKeySeed: 1111,  // numeric
            nextKeySeed: mnemonic, // mnemonic
        });
        expect(account4.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // 5. Undefined (random generation)
        const stores5 = KelStores.inMemory();
        const api5 = KelStores.ops(stores5);
        const account5 = await api5.createAccount({
            alias: 'alice-random',
            // currentKeySeed and nextKeySeed are undefined, so random keys will be generated
        });
        expect(account5.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // All accounts should be different (different keys)
        const aids = [account1.aid, account2.aid, account3.aid, account4.aid, account5.aid];
        const uniqueAids = new Set(aids);
        expect(uniqueAids.size).toBe(5); // All should be unique

        // Test rotation with different key specifications
        const rotatedAccount = await api1.rotateKeys({
            aid: account1.aid,
            nextSeed: 9999, // numeric seed for rotation
        });
        expect(rotatedAccount.sequence).toBe(1);

        const rotatedAccount2 = await api2.rotateKeys({
            aid: account2.aid,
            nextSeed: mnemonic, // mnemonic for rotation
        });
        expect(rotatedAccount2.sequence).toBe(1);

        const rotatedAccount3 = await api3.rotateKeys({
            aid: account3.aid,
            nextSeed: keypair, // keypair for rotation
        });
        expect(rotatedAccount3.sequence).toBe(1);
    });
});
