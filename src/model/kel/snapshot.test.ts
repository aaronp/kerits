/**
 * Tests for snapshot dump/load functionality
 */

import { describe, it, expect } from 'bun:test';
import { KelStores } from './api';
import { assertRoundTrip } from './test-helpers/golden';

describe('KEL Snapshot', () => {
    it('should dump and load empty state', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        const snapshot = await api.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        expect(snapshot.version).toBe(1);
        expect(snapshot.createdAt).toBe('2024-01-01T00:00:00.000Z');
        expect(snapshot.digest).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        expect(snapshot.stores.aliases.aliasToAid).toEqual({});
        expect(snapshot.stores.kelEvents).toEqual({});
        expect(snapshot.stores.kelCesr).toEqual({});
        expect(snapshot.stores.kelMetadata).toEqual({});
        expect(snapshot.stores.vault).toEqual({});
    });

    it('should dump state with one account', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account
        const account = await api.createAccount({
            alias: 'alice',
            currentKeySpec: 12345,
            nextKeySpec: 67890,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        const snapshot = await api.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Verify alias mapping
        expect(snapshot.stores.aliases.aliasToAid['alice']).toBe(account.aid);
        expect(snapshot.stores.aliases.aidToAlias[account.aid]).toEqual({
            key: 'alice',
            display: 'alice'
        });

        // Verify KEL event exists and is inception
        expect(Object.keys(snapshot.stores.kelEvents).length).toBe(1);
        const inceptionEvent = snapshot.stores.kelEvents[account.latestEvent];
        expect(inceptionEvent).toBeDefined();
        expect(inceptionEvent?.t).toBe('icp');
        expect(inceptionEvent?.i).toBe(account.aid);
        expect(inceptionEvent?.s).toBe('0');
        expect(inceptionEvent?.k).toBeDefined();
        expect(inceptionEvent?.k?.length).toBe(1);

        // Verify envelope with signature
        expect(Object.keys(snapshot.stores.kelCesr).length).toBe(1);
        const envelope = snapshot.stores.kelCesr[account.latestEvent];
        expect(envelope).toBeDefined();
        expect(envelope?.event).toEqual(inceptionEvent);
        expect(envelope?.signatures.length).toBe(1);
        expect(envelope?.signatures[0]?.keyIndex).toBe(0);
        expect(envelope?.eventCesr).toBeDefined();

        // Verify chain metadata
        const chainKey = `chain:${account.aid}`;
        const metadata = snapshot.stores.kelMetadata[chainKey];
        expect(metadata).toBeDefined();
        expect(metadata?.aid).toBe(account.aid);
        expect(metadata?.sequence).toBe(0);
        expect(metadata?.latestEvent).toBe(account.latestEvent);
        expect(metadata?.chain).toEqual([account.latestEvent]);

        // Verify vault (public keys only)
        expect(Object.keys(snapshot.stores.vault).length).toBe(1);
        const vaultKey = `keys:${account.aid}`;
        const vaultEntry = snapshot.stores.vault[vaultKey];
        expect(vaultEntry).toBeDefined();
        expect(vaultEntry?.current.publicKey).toBe(inceptionEvent?.k?.[0]);
        expect(vaultEntry?.current.privateKeySeed).toBeUndefined();
        expect(vaultEntry?.next.publicKey).toBeDefined();
        expect(vaultEntry?.next.privateKeySeed).toBeUndefined();
    });

    it('should support round-trip dump -> load -> dump', async () => {
        const stores1 = KelStores.inMemory();
        const api1 = KelStores.ops(stores1);

        // Create an account
        await api1.createAccount({
            alias: 'bob',
            currentKeySpec: 11111,
            nextKeySpec: 22222,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Dump
        const snapshot1 = await api1.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Load into fresh stores
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);
        await api2.loadState(snapshot1);

        // Dump again
        const snapshot2 = await api2.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Should be identical
        assertRoundTrip(snapshot1, snapshot2);
    });

    it('should not include secrets by default', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        const account = await api.createAccount({
            alias: 'charlie',
            currentKeySpec: 33333,
            nextKeySpec: 44444,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        const snapshot = await api.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Verify vault structure but no secrets
        const vaultKey = `keys:${account.aid}`;
        const vaultEntry = snapshot.stores.vault[vaultKey];

        expect(vaultEntry).toBeDefined();

        // Current key should be present but not secret
        expect(vaultEntry.current.publicKey).toBeDefined();
        expect(vaultEntry.current.publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/); // Ed25519 public key
        expect(vaultEntry.current.privateKeySeed).toBeUndefined();

        // Next key should be present but not secret
        expect(vaultEntry.next.publicKey).toBeDefined();
        expect(vaultEntry.next.publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        expect(vaultEntry.next.privateKeySeed).toBeUndefined();
    });

    it('should include secrets when requested', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        const account = await api.createAccount({
            alias: 'dave',
            currentKeySpec: 55555,
            nextKeySpec: 66666,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        const snapshot = await api.dumpState({
            includeSecrets: true,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Verify vault includes secrets when requested
        const vaultKey = `keys:${account.aid}`;
        const vaultEntry = snapshot.stores.vault[vaultKey];

        expect(vaultEntry).toBeDefined();

        // Current key and secret should both be present
        expect(vaultEntry.current.publicKey).toBeDefined();
        expect(vaultEntry.current.publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        expect(vaultEntry.current.privateKeySeed).toBeDefined();
        expect(vaultEntry.current.privateKeySeed).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
        expect(vaultEntry.current.privateKeySeed?.length).toBeGreaterThan(0);

        // Next key and secret should both be present
        expect(vaultEntry.next.publicKey).toBeDefined();
        expect(vaultEntry.next.publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        expect(vaultEntry.next.privateKeySeed).toBeDefined();
        expect(vaultEntry.next.privateKeySeed).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(vaultEntry.next.privateKeySeed?.length).toBeGreaterThan(0);

        // Current and next secrets should be different
        expect(vaultEntry.current.privateKeySeed).not.toBe(vaultEntry.next.privateKeySeed);
    });

    it('should verify digest on load', async () => {
        const stores1 = KelStores.inMemory();
        const api1 = KelStores.ops(stores1);

        await api1.createAccount({
            alias: 'eve',
            currentKeySpec: 77777,
            nextKeySpec: 88888,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        const snapshot = await api1.dumpState({ timestamp: '2024-01-01T00:00:00.000Z' });

        // Tamper with the snapshot
        const tampered = {
            ...snapshot,
            stores: {
                ...snapshot.stores,
                aliases: {
                    aliasToAid: { 'eve': 'TAMPERED' as any },
                    aidToAlias: {}
                }
            }
        };

        // Loading should fail
        const stores2 = KelStores.inMemory();
        const api2 = KelStores.ops(stores2);

        await expect(api2.loadState(tampered)).rejects.toThrow('digest mismatch');
    });

    it('should produce deterministic snapshots for same state', async () => {
        const createAccount = async () => {
            const stores = KelStores.inMemory();
            const api = KelStores.ops(stores);
            await api.createAccount({
                alias: 'frank',
                currentKeySpec: 99999,
                nextKeySpec: 111111,
                timestamp: '2024-01-01T00:00:00.000Z'
            });
            return api.dumpState({ timestamp: '2024-01-02T00:00:00.000Z' });
        };

        const snapshot1 = await createAccount();
        const snapshot2 = await createAccount();

        // Should be identical (including digest)
        expect(snapshot1).toEqual(snapshot2);
    });
});
