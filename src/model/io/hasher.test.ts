/**
 * Tests for Hasher interface implementations
 */

import { describe, it, expect } from 'bun:test';
import type { Hasher } from './hasher';
import type { SAID, Bytes } from './types';

// Mock implementation for testing
class MockHasher implements Hasher {
    saidOf(data: Bytes): SAID {
        // Simple mock implementation that creates deterministic SAIDs
        const hash = Buffer.from(data).toString('base64').padEnd(43, '0').slice(0, 43);
        return `E${hash}` as SAID;
    }
}

// Another mock implementation for testing different behavior
class CounterHasher implements Hasher {
    private counter = 0;

    saidOf(data: Bytes): SAID {
        this.counter++;
        return `E${this.counter.toString().padStart(43, '0')}` as SAID;
    }
}

// Deterministic hasher for testing
class DeterministicHasher implements Hasher {
    saidOf(data: Bytes): SAID {
        // Create a deterministic hash based on data content
        const str = new TextDecoder().decode(data);
        const hash = Buffer.from(str).toString('base64').padEnd(43, '0').slice(0, 43);
        return `E${hash}` as SAID;
    }
}

describe('Hasher', () => {
    it('should generate SAIDs from data', () => {
        const hasher = new MockHasher();
        const data = new TextEncoder().encode('test data');
        const said = hasher.saidOf(data);

        expect(said).toMatch(/^E[A-Za-z0-9+/]{43}$/);
    });

    it('should generate consistent SAIDs for same data', () => {
        const hasher = new MockHasher();
        const data = new TextEncoder().encode('test data');

        const said1 = hasher.saidOf(data);
        const said2 = hasher.saidOf(data);

        expect(said1).toBe(said2);
    });

    it('should generate different SAIDs for different data', () => {
        const hasher = new MockHasher();
        const data1 = new TextEncoder().encode('test data 1');
        const data2 = new TextEncoder().encode('test data 2');

        const said1 = hasher.saidOf(data1);
        const said2 = hasher.saidOf(data2);

        expect(said1).not.toBe(said2);
    });

    it('should handle empty data', () => {
        const hasher = new MockHasher();
        const data = new Uint8Array(0);
        const said = hasher.saidOf(data);

        expect(said).toMatch(/^E[A-Za-z0-9+/]{43}$/);
    });

    it('should handle large data', () => {
        const hasher = new MockHasher();
        const data = new Uint8Array(10000).fill(42);
        const said = hasher.saidOf(data);

        expect(said).toMatch(/^E[A-Za-z0-9+/]{43}$/);
    });

    it('should work with different hasher implementations', () => {
        const hasher1 = new MockHasher();
        const hasher2 = new CounterHasher();
        const data = new TextEncoder().encode('test data');

        const said1 = hasher1.saidOf(data);
        const said2 = hasher2.saidOf(data);

        // Different implementations should produce different SAIDs
        expect(said1).not.toBe(said2);

        // But each should be valid SAID format
        expect(said1).toMatch(/^E[A-Za-z0-9+/]{43}$/);
        expect(said2).toMatch(/^E[0-9]{43}$/);
    });

    it('should generate deterministic SAIDs for same data with deterministic hasher', () => {
        const hasher = new DeterministicHasher();
        const data = new TextEncoder().encode('test data');

        const said1 = hasher.saidOf(data);
        const said2 = hasher.saidOf(data);

        expect(said1).toBe(said2);
        expect(said1).toMatch(/^E[A-Za-z0-9+/]{43}$/);
    });

    it('should generate unique SAIDs for counter hasher', () => {
        const hasher = new CounterHasher();
        const data1 = new TextEncoder().encode('data 1');
        const data2 = new TextEncoder().encode('data 2');

        const said1 = hasher.saidOf(data1);
        const said2 = hasher.saidOf(data2);

        expect(said1).toBe('E0000000000000000000000000000000000000000001');
        expect(said2).toBe('E0000000000000000000000000000000000000000002');
    });
});
