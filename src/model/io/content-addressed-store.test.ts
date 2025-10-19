/**
 * Tests for ContentAddressedStore interface implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ContentAddressedStore } from './content-addressed-store';
import type { KeyValueStore } from './key-value-store';
import type { SAID, Bytes } from './types';

// Mock implementation for testing
class MockContentAddressedStore implements ContentAddressedStore {
    constructor(
        private store: KeyValueStore,
        private hasher: { saidOf: (data: Bytes) => SAID }
    ) { }

    async putObject<T>(obj: T, encode: (o: T) => Bytes = (o) => new TextEncoder().encode(JSON.stringify(o))): Promise<SAID> {
        const bytes = encode(obj);
        const said = this.hasher.saidOf(bytes);
        await this.store.put(said, bytes);
        return said;
    }

    async getObject<T>(id: SAID, decode: (b: Bytes) => T = (b) => JSON.parse(new TextDecoder().decode(b)) as T): Promise<T | null> {
        const bytes = await this.store.get(id);
        if (!bytes) return null;
        return decode(bytes);
    }
}

// Mock key-value store for testing
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

// Mock hasher for testing
class MockHasher {
    saidOf(data: Bytes): SAID {
        // Create deterministic SAID based on data content
        const str = new TextDecoder().decode(data);
        const hash = Buffer.from(str).toString('base64').padEnd(43, '0').slice(0, 43);
        return `E${hash}` as SAID;
    }
}

describe('ContentAddressedStore', () => {
    let store: KeyValueStore;
    let hasher: MockHasher;
    let contentStore: ContentAddressedStore;

    beforeEach(() => {
        store = new MockKeyValueStore();
        hasher = new MockHasher();
        contentStore = new MockContentAddressedStore(store, hasher);
    });

    it('should store and retrieve objects with default JSON encoding', async () => {
        const obj = { name: 'Alice', age: 30 };
        const said = await contentStore.putObject(obj);
        const retrieved = await contentStore.getObject<typeof obj>(said);

        expect(retrieved).toEqual(obj);
    });

    it('should use custom encoding and decoding', async () => {
        const obj = { name: 'Alice', age: 30 };
        const customEncode = (o: typeof obj) => new TextEncoder().encode(`NAME:${o.name},AGE:${o.age}`);
        const customDecode = (b: Bytes) => {
            const str = new TextDecoder().decode(b);
            const match = str.match(/NAME:([^,]+),AGE:(\d+)/);
            if (!match) throw new Error('Invalid format');
            return { name: match[1], age: parseInt(match[2]) };
        };

        const said = await contentStore.putObject(obj, customEncode);
        const retrieved = await contentStore.getObject<typeof obj>(said, customDecode);

        expect(retrieved).toEqual(obj);
    });

    it('should return null for non-existent objects', async () => {
        const nonExistentSaid = 'Enonexistent' as SAID;
        const retrieved = await contentStore.getObject(nonExistentSaid);

        expect(retrieved).toBeNull();
    });

    it('should generate deterministic SAIDs for same objects', async () => {
        const obj = { name: 'Alice', age: 30 };

        const said1 = await contentStore.putObject(obj);
        const said2 = await contentStore.putObject(obj);

        expect(said1).toBe(said2);
    });

    it('should generate different SAIDs for different objects', async () => {
        const obj1 = { name: 'Alice', age: 30 };
        const obj2 = { name: 'Bob', age: 25 };

        const said1 = await contentStore.putObject(obj1);
        const said2 = await contentStore.putObject(obj2);

        expect(said1).not.toBe(said2);
    });

    it('should handle complex nested objects', async () => {
        const obj = {
            name: 'Alice',
            profile: {
                avatar: 'https://example.com/avatar.jpg',
                bio: 'Software engineer'
            },
            tags: ['developer', 'typescript'],
            metadata: {
                created: '2023-01-01T00:00:00Z',
                version: 1
            }
        };

        const said = await contentStore.putObject(obj);
        const retrieved = await contentStore.getObject<typeof obj>(said);

        expect(retrieved).toEqual(obj);
    });

    it('should handle arrays', async () => {
        const obj = [1, 2, 3, { nested: true }];

        const said = await contentStore.putObject(obj);
        const retrieved = await contentStore.getObject<typeof obj>(said);

        expect(retrieved).toEqual(obj);
    });

    it('should handle primitive values', async () => {
        const stringValue = 'Hello, World!';
        const numberValue = 42;
        const booleanValue = true;

        const stringSaid = await contentStore.putObject(stringValue);
        const numberSaid = await contentStore.putObject(numberValue);
        const booleanSaid = await contentStore.putObject(booleanValue);

        const retrievedString = await contentStore.getObject<string>(stringSaid);
        const retrievedNumber = await contentStore.getObject<number>(numberSaid);
        const retrievedBoolean = await contentStore.getObject<boolean>(booleanSaid);

        expect(retrievedString).toBe(stringValue);
        expect(retrievedNumber).toBe(numberValue);
        expect(retrievedBoolean).toBe(booleanValue);
    });

    it('should handle null and undefined values', async () => {
        const nullValue = null;
        const undefinedValue = undefined;

        // Use custom encoding for null/undefined since JSON.stringify doesn't handle them well
        const nullSaid = await contentStore.putObject(nullValue, () => new TextEncoder().encode('null'));
        const undefinedSaid = await contentStore.putObject(undefinedValue, () => new TextEncoder().encode('undefined'));

        const retrievedNull = await contentStore.getObject<null>(nullSaid, (bytes) => {
            const str = new TextDecoder().decode(bytes);
            return str === 'null' ? null : JSON.parse(str);
        });
        const retrievedUndefined = await contentStore.getObject<undefined>(undefinedSaid, (bytes) => {
            const str = new TextDecoder().decode(bytes);
            return str === 'undefined' ? undefined : JSON.parse(str);
        });

        expect(retrievedNull).toBeNull();
        expect(retrievedUndefined).toBeUndefined();
    });

    it('should handle binary data with custom encoding', async () => {
        const binaryData = new Uint8Array([1, 2, 3, 4, 5]);

        const said = await contentStore.putObject(binaryData, (data) => data);
        const retrieved = await contentStore.getObject<Uint8Array>(said, (bytes) => bytes);

        expect(retrieved).toEqual(binaryData);
    });

    it('should handle encoding errors gracefully', async () => {
        const obj = { circular: {} as any };
        obj.circular = obj; // Create circular reference

        // This should throw an error during JSON.stringify
        await expect(contentStore.putObject(obj)).rejects.toThrow();
    });

    it('should handle decoding errors gracefully', async () => {
        const obj = { name: 'Alice' };
        const said = await contentStore.putObject(obj);

        // Try to decode as wrong type
        const retrieved = await contentStore.getObject<number>(said, (bytes) => {
            const str = new TextDecoder().decode(bytes);
            return JSON.parse(str) as number;
        });

        // Should not throw, but return the parsed value (which might be wrong type)
        expect(typeof retrieved).toBe('object');
    });
});
