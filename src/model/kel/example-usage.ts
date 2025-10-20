/**
 * Example Usage of KEL API
 *
 * This file demonstrates the basic usage of the KEL API for Flow 1: Inception
 */

import { memoryStore, namespace } from '../io/storage';
import { createAccount, getAccount, getKelChain, type KelStores } from './api';

async function exampleInceptionFlow() {
    // 1. Set up storage
    const baseStore = memoryStore();
    const stores: KelStores = {
        aliases: namespace(baseStore, 'alias:kel'),
        kelEvents: namespace(baseStore, 'kel:events'),
        kelCesr: namespace(baseStore, 'kel:cesr'),
        kelMetadata: namespace(baseStore, 'kel:meta'),
        vault: namespace(baseStore, 'vault'),
    };

    // 2. Create a new KERI identifier (inception)
    console.log('Creating new identifier for Alice...');
    const alice = await createAccount({
        alias: 'alice',
        stores,
        // Optional: provide seeds for deterministic keys (for testing)
        // In production, omit these to generate random keys
        currentKeySeed: 1234,
        nextKeySeed: 5678,
    });

    console.log('Alice created:', {
        aid: alice.aid,
        alias: alice.alias,
        sequence: alice.sequence,
    });

    // 3. Retrieve the account by alias
    console.log('\nRetrieving account by alias...');
    const retrieved = await getAccount({ alias: 'alice', stores });
    console.log('Retrieved:', retrieved);

    // 4. Get the KEL chain (should have 1 inception event)
    console.log('\nFetching KEL chain...');
    const chain = await getKelChain(stores.kelMetadata, stores.kelEvents, alice.aid);
    console.log('Chain length:', chain.length);
    console.log('Inception event:', chain[0]);

    // 5. Publish OOBI (simple implementation for now)
    console.log('\nPublishing OOBI...');
    const oobiDoc = JSON.stringify({ events: chain });
    await stores.kelEvents.put(
        `oobi:${alice.aid}` as any,
        new TextEncoder().encode(oobiDoc)
    );
    console.log('OOBI published for AID:', alice.aid);

    return alice;
}

// Run the example if this file is executed directly
if (import.meta.main) {
    exampleInceptionFlow()
        .then(() => console.log('\n✅ Example completed successfully'))
        .catch(err => console.error('❌ Example failed:', err));
}

export { exampleInceptionFlow };
