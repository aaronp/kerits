/**
 * Tests for OOBIResolver interface implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { OOBIResolver } from './oobi-resolver';
import type { Bytes } from './types';

// Mock implementation for testing
class MockOOBIResolver implements OOBIResolver {
    private documents = new Map<string, Bytes>();

    async resolve(id: string): Promise<Bytes | null> {
        return this.documents.get(id) ?? null;
    }

    // Helper method for testing
    addDocument(id: string, data: Bytes): void {
        this.documents.set(id, data);
    }
}

// Another mock implementation that simulates network delays
class DelayedOOBIResolver implements OOBIResolver {
    private documents = new Map<string, Bytes>();
    private delay: number;

    constructor(delay: number = 100) {
        this.delay = delay;
    }

    async resolve(id: string): Promise<Bytes | null> {
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return this.documents.get(id) ?? null;
    }

    addDocument(id: string, data: Bytes): void {
        this.documents.set(id, data);
    }
}

describe('OOBIResolver', () => {
    let resolver: MockOOBIResolver;

    beforeEach(() => {
        resolver = new MockOOBIResolver();
    });

    it('should resolve existing documents', async () => {
        const id = 'Etest123';
        const data = new TextEncoder().encode('{"name": "Alice", "age": 30}');

        resolver.addDocument(id, data);
        const resolved = await resolver.resolve(id);

        expect(resolved).toEqual(data);
    });

    it('should return null for non-existent documents', async () => {
        const id = 'Enonexistent';
        const resolved = await resolver.resolve(id);

        expect(resolved).toBeNull();
    });

    it('should handle empty string IDs', async () => {
        const id = '';
        const resolved = await resolver.resolve(id);

        expect(resolved).toBeNull();
    });

    it('should handle special characters in IDs', async () => {
        const id = 'Etest-123_abc.def';
        const data = new TextEncoder().encode('{"special": "characters"}');

        resolver.addDocument(id, data);
        const resolved = await resolver.resolve(id);

        expect(resolved).toEqual(data);
    });

    it('should handle large documents', async () => {
        const id = 'Elarge123';
        const largeData = new Uint8Array(10000).fill(42);

        resolver.addDocument(id, largeData);
        const resolved = await resolver.resolve(id);

        expect(resolved).toEqual(largeData);
    });

    it('should handle binary data', async () => {
        const id = 'Ebinary123';
        const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);

        resolver.addDocument(id, binaryData);
        const resolved = await resolver.resolve(id);

        expect(resolved).toEqual(binaryData);
    });

    it('should handle multiple documents', async () => {
        const id1 = 'Edoc1';
        const id2 = 'Edoc2';
        const data1 = new TextEncoder().encode('Document 1');
        const data2 = new TextEncoder().encode('Document 2');

        resolver.addDocument(id1, data1);
        resolver.addDocument(id2, data2);

        const resolved1 = await resolver.resolve(id1);
        const resolved2 = await resolver.resolve(id2);

        expect(resolved1).toEqual(data1);
        expect(resolved2).toEqual(data2);
    });

    it('should handle concurrent resolution requests', async () => {
        const id = 'Econcurrent123';
        const data = new TextEncoder().encode('Concurrent test');

        resolver.addDocument(id, data);

        // Make multiple concurrent requests
        const promises = Array.from({ length: 10 }, () => resolver.resolve(id));
        const results = await Promise.all(promises);

        // All should return the same data
        results.forEach(result => {
            expect(result).toEqual(data);
        });
    });

    it('should work with delayed resolver', async () => {
        const delayedResolver = new DelayedOOBIResolver(50);
        const id = 'Edelayed123';
        const data = new TextEncoder().encode('Delayed test');

        delayedResolver.addDocument(id, data);

        const startTime = Date.now();
        const resolved = await delayedResolver.resolve(id);
        const endTime = Date.now();

        expect(resolved).toEqual(data);
        expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });

    it('should handle resolution errors gracefully', async () => {
        // Create a resolver that throws errors
        const errorResolver: OOBIResolver = {
            async resolve(id: string): Promise<Bytes | null> {
                if (id === 'Eerror') {
                    throw new Error('Network error');
                }
                return null;
            }
        };

        // Should not throw for non-error IDs
        const normalResult = await errorResolver.resolve('Enormal');
        expect(normalResult).toBeNull();

        // Should throw for error IDs
        await expect(errorResolver.resolve('Eerror')).rejects.toThrow('Network error');
    });

    it('should handle different document formats', async () => {
        const jsonId = 'Ejson123';
        const xmlId = 'Exml123';
        const csvId = 'Ecsv123';

        const jsonData = new TextEncoder().encode('{"type": "json", "data": "value"}');
        const xmlData = new TextEncoder().encode('<root><type>xml</type><data>value</data></root>');
        const csvData = new TextEncoder().encode('type,data\ncsv,value');

        resolver.addDocument(jsonId, jsonData);
        resolver.addDocument(xmlId, xmlData);
        resolver.addDocument(csvId, csvData);

        const jsonResult = await resolver.resolve(jsonId);
        const xmlResult = await resolver.resolve(xmlId);
        const csvResult = await resolver.resolve(csvId);

        expect(jsonResult).toEqual(jsonData);
        expect(xmlResult).toEqual(xmlData);
        expect(csvResult).toEqual(csvData);
    });
});
