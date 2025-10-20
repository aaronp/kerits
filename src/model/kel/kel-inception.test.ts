/**
 * KEL Inception API Test
 *
 * TDD-style test to drive out the first end-to-end flow:
 * Flow 1: Inception (Create New Identifier)
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import { memoryStore, namespace } from '../io/storage';
import type { KeyValueStore } from '../io/key-value-store';
import {
    createAccount,
    getAccount,
    getAidByAlias,
    getKelChain,
    getLatestSequence,
    getKeys,
    KelStores
} from './api';

describe('KEL Inception Flow', () => {

    test('should create a new identifier with inception event', async () => {
        // Given: Alice wants to create a new identifier
        const alias = 'alice';

        const stores = KelStores.inMemory();

        // When: Alice creates an account (incepting a new identifier)
        const account = await createAccount({
            alias,
            stores,
            // Optional: provide keys for deterministic testing
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // Then: The account should have an AID
        expect(account.aid).toMatch(/^D[A-Za-z0-9_-]{43}$/);

        // Then: The alias should be stored
        const storedAid = await getAidByAlias(stores.aliases, alias);
        expect(storedAid).toBe(account.aid);

        // Then: The inception event should be stored
        const events = await getKelChain(stores.kelMetadata, stores.kelEvents, account.aid);
        expect(events).toHaveLength(1);
        expect(events[0].t).toBe('icp');
        expect(events[0].s).toBe('0');
        expect(events[0].i).toBe(account.aid);

        // Then: The keys should be stored in the vault
        const keys = await getKeys(stores.vault, account.aid);
        expect(keys?.currentKeys).toBeDefined();
        expect(keys?.nextKeys).toBeDefined();
    });

    test('should publish OOBI for discoverability', async () => {
        // Given: Alice has created an identifier
        const account = await createAccount({
            alias: 'alice',
            stores,
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: Alice publishes her OOBI
        // For now, we'll use a simple OOBI that just stores the inception event
        // We can iterate on the OOBI format later as mentioned in the plan
        const inceptionEvents = await getKelChain(stores.kelMetadata, stores.kelEvents, account.aid);
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
        const account = await createAccount({
            alias: 'alice',
            stores,
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: We retrieve the account by alias
        const retrieved = await getAccount({ alias: 'alice', stores });

        // Then: We should get the same account
        expect(retrieved?.aid).toBe(account.aid);
        expect(retrieved?.sequence).toBe(0);
    });

    test('should compute sequence number from chain', async () => {
        // Given: Alice has created an identifier (sequence 0)
        const account = await createAccount({
            alias: 'alice',
            stores,
            currentKeySeed: 1234,
            nextKeySeed: 5678,
        });

        // When: We get the latest sequence number
        const sequence = await getLatestSequence(stores.kelMetadata, account.aid);

        // Then: The sequence should be 0 (inception)
        expect(sequence).toBe(0);
    });
});
