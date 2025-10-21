/**
 * Golden file regression tests for KEL operations
 *
 * These tests capture the complete state of the KEL system after various operations
 * and store them as golden files for visual inspection and regression testing.
 *
 * To update golden files when intentionally changing behavior:
 *   UPDATE_GOLDEN=1 bun test src/model/kel/kel-golden.test.ts
 */

import { describe, it } from 'bun:test';
import { KelStores } from './api';
import { assertMatchesGolden, assertRoundTrip } from './test-helpers/golden';

describe('KEL Golden File Tests', () => {
    it('should create single-key inception', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create a simple inception with deterministic keys
        await api.createAccount({
            alias: 'alice',
            currentKeySpec: 12345,
            nextKeySpec: 67890,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Dump state
        const snapshot = await api.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Assert matches golden file (explicit path is grep-able and obvious)
        await assertMatchesGolden('test/golden/kel/inception-single-key.json', snapshot);

        // Verify round-trip
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);
        await api2.loadState(snapshot);
        const snapshot2 = await api2.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });
        assertRoundTrip(snapshot, snapshot2);
    });

    it('should rotate keys and update chain', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create account
        const account = await api.createAccount({
            alias: 'bob',
            currentKeySpec: 11111,
            nextKeySpec: 22222,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Rotate keys
        await api.rotateKeys({
            aid: account.aid,
            nextKeySpec: 33333,
            timestamp: '2024-01-02T00:00:00.000Z'
        });

        // Dump state
        const snapshot = await api.dumpState({ timestamp: '2024-01-03T00:00:00.000Z' });

        // Assert matches golden file (explicit path is grep-able and obvious)
        await assertMatchesGolden('test/golden/kel/rotation-with-chain.json', snapshot);

        // Verify round-trip
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);
        await api2.loadState(snapshot);
        const snapshot2 = await api2.dumpState({ timestamp: '2024-01-03T00:00:00.000Z' });
        assertRoundTrip(snapshot, snapshot2);
    });

    it('should generate event proof', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create account
        const account = await api.createAccount({
            alias: 'charlie',
            currentKeySpec: 99999,
            nextKeySpec: 111111,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Get the chain to find the inception SAID
        const chain = await api.getKelChain(account.aid);
        const inceptionSaid = chain[0]?.d;

        if (!inceptionSaid) {
            throw new Error('Inception event not found');
        }

        // Get event proof
        const proof = await api.getEventProof(inceptionSaid);

        if (!proof) {
            throw new Error('Event proof not found');
        }

        // Dump state (includes the envelope with proof data)
        const snapshot = await api.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Assert matches golden file (explicit path is grep-able and obvious)
        await assertMatchesGolden('test/golden/kel/inception-with-proof.json', snapshot);

        // Verify round-trip
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);
        await api2.loadState(snapshot);
        const snapshot2 = await api2.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });
        assertRoundTrip(snapshot, snapshot2);
    });
});
