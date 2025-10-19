/**
 * Tests for KeyValueStore interface implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { KeyValueStore, NamespacedStore } from './key-value-store';
import type { SAID, Bytes } from './types';

// Mock implementation for testing
class MockKeyValueStore implements KeyValueStore {
    private store = new Map<string, Bytes>();

    async get(id: SAID): Promise<Bytes | null> {
        return this.store.get(id) ?? null;
    }

    async put(id: SAID, data: Bytes): Promise<void> {
        this.store.set(id, data);
    }

    async del(id: SAID): Promise<void> {
        this.store.delete(id);
    }

    async has(id: SAID): Promise<boolean> {
        return this.store.has(id);
    }

    async listKeys(prefix?: string): Promise<SAID[]> {
        const keys = Array.from(this.store.keys());
        if (prefix) {
            return keys.filter(key => key.startsWith(prefix)) as SAID[];
        }
        return keys as SAID[];
    }
}

// Mock namespaced store implementation
class MockNamespacedStore implements NamespacedStore {
    public namespace: string;
    private store: KeyValueStore;

    constructor(store: KeyValueStore, namespace: string) {
        this.store = store;
        this.namespace = namespace;
    }

    private getKey(id: SAID): SAID {
        return `${this.namespace}:${id}` as SAID;
    }

    async get(id: SAID): Promise<Bytes | null> {
        return this.store.get(this.getKey(id));
    }

    async put(id: SAID, data: Bytes): Promise<void> {
        return this.store.put(this.getKey(id), data);
    }

    async del(id: SAID): Promise<void> {
        return this.store.del?.(this.getKey(id));
    }

    async has(id: SAID): Promise<boolean> {
        return this.store.has?.(this.getKey(id)) ?? false;
    }

    async listKeys(prefix?: string): Promise<SAID[]> {
        const fullPrefix = prefix ? `${this.namespace}:${prefix}` : `${this.namespace}:`;
        const keys = await this.store.listKeys?.(fullPrefix) ?? [];
        return keys.map(key => key.replace(`${this.namespace}:`, '') as SAID);
    }
}

describe('KeyValueStore', () => {
    let store: KeyValueStore;

    beforeEach(() => {
        store = new MockKeyValueStore();
    });

    it('should store and retrieve data', async () => {
        const id = 'Etest123' as SAID;
        const data = new TextEncoder().encode('test data');

        await store.put(id, data);
        const retrieved = await store.get(id);

        expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
        const id = 'Enonexistent' as SAID;
        const retrieved = await store.get(id);

        expect(retrieved).toBeNull();
    });

    it('should check if keys exist', async () => {
        const id = 'Etest123' as SAID;
        const data = new TextEncoder().encode('test data');

        expect(await store.has?.(id)).toBeFalse();

        await store.put(id, data);
        expect(await store.has?.(id)).toBeTrue();
    });

    it('should delete keys', async () => {
        const id = 'Etest123' as SAID;
        const data = new TextEncoder().encode('test data');

        await store.put(id, data);
        expect(await store.has?.(id)).toBeTrue();

        await store.del?.(id);
        expect(await store.has?.(id)).toBeFalse();
    });

    it('should list keys with prefix', async () => {
        const id1 = 'Etest123' as SAID;
        const id2 = 'Etest456' as SAID;
        const id3 = 'Eother789' as SAID;
        const data = new TextEncoder().encode('test data');

        await store.put(id1, data);
        await store.put(id2, data);
        await store.put(id3, data);

        const testKeys = await store.listKeys?.('Etest');
        expect(testKeys).toContain(id1);
        expect(testKeys).toContain(id2);
        expect(testKeys).not.toContain(id3);
    });

    it('should list all keys when no prefix provided', async () => {
        const id1 = 'Etest123' as SAID;
        const id2 = 'Etest456' as SAID;
        const data = new TextEncoder().encode('test data');

        await store.put(id1, data);
        await store.put(id2, data);

        const allKeys = await store.listKeys?.();
        expect(allKeys).toContain(id1);
        expect(allKeys).toContain(id2);
    });
});

describe('NamespacedStore', () => {
    let baseStore: KeyValueStore;
    let namespacedStore: NamespacedStore;

    beforeEach(() => {
        baseStore = new MockKeyValueStore();
        namespacedStore = new MockNamespacedStore(baseStore, 'test-namespace');
    });

    it('should have correct namespace', () => {
        expect(namespacedStore.namespace).toBe('test-namespace');
    });

    it('should store and retrieve data with namespace prefix', async () => {
        const id = 'Etest123' as SAID;
        const data = new TextEncoder().encode('test data');

        await namespacedStore.put(id, data);
        const retrieved = await namespacedStore.get(id);

        expect(retrieved).toEqual(data);

        // Verify it's stored with namespace prefix in base store
        const prefixedId = 'test-namespace:Etest123' as SAID;
        const fromBaseStore = await baseStore.get(prefixedId);
        expect(fromBaseStore).toEqual(data);
    });

    it('should not interfere with other namespaces', async () => {
        const otherStore = new MockNamespacedStore(baseStore, 'other-namespace');
        const id = 'Etest123' as SAID;
        const data1 = new TextEncoder().encode('test data 1');
        const data2 = new TextEncoder().encode('test data 2');

        await namespacedStore.put(id, data1);
        await otherStore.put(id, data2);

        expect(await namespacedStore.get(id)).toEqual(data1);
        expect(await otherStore.get(id)).toEqual(data2);
    });

    it('should list keys without namespace prefix', async () => {
        const id1 = 'Etest123' as SAID;
        const id2 = 'Etest456' as SAID;
        const data = new TextEncoder().encode('test data');

        await namespacedStore.put(id1, data);
        await namespacedStore.put(id2, data);

        const keys = await namespacedStore.listKeys?.();
        expect(keys).toContain(id1);
        expect(keys).toContain(id2);
        expect(keys.every(key => !key.includes('test-namespace:'))).toBeTrue();
    });

    it('should filter keys by prefix within namespace', async () => {
        const id1 = 'Etest123' as SAID;
        const id2 = 'Etest456' as SAID;
        const id3 = 'Eother789' as SAID;
        const data = new TextEncoder().encode('test data');

        await namespacedStore.put(id1, data);
        await namespacedStore.put(id2, data);
        await namespacedStore.put(id3, data);

        const testKeys = await namespacedStore.listKeys?.('Etest');
        expect(testKeys).toContain(id1);
        expect(testKeys).toContain(id2);
        expect(testKeys).not.toContain(id3);
    });
});
