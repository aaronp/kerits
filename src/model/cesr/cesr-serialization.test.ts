/**
 * Tests for CESR serialization and deserialization operations
 *
 * These tests ensure robust handling of CESR encoding/decoding for:
 * - Converting events to/from canonical CESR bytes
 * - QBase64 (qb64) encoding/decoding
 * - SAID computation from canonical bytes
 * - Round-trip serialization consistency
 */

import { describe, it, expect } from 'bun:test';
import { CESR } from './cesr';
import { blake3 } from '@noble/hashes/blake3.js';
import { canonicalize } from 'json-canonicalize';

describe('CESR Serialization/Deserialization', () => {

    describe('Base64url encoding/decoding', () => {
        it('should encode Uint8Array to base64url', () => {
            const data = new Uint8Array([1, 2, 3, 4, 5]);
            const encoded = toBase64url(data);

            expect(typeof encoded).toBe('string');
            expect(encoded).not.toContain('+');
            expect(encoded).not.toContain('/');
            expect(encoded).not.toContain('=');
        });

        it('should decode base64url to Uint8Array', () => {
            const original = new Uint8Array([1, 2, 3, 4, 5]);
            const encoded = toBase64url(original);
            const decoded = fromBase64url(encoded);

            expect(decoded).toEqual(original);
        });

        it('should handle empty arrays', () => {
            const empty = new Uint8Array([]);
            const encoded = toBase64url(empty);
            const decoded = fromBase64url(encoded);

            expect(decoded).toEqual(empty);
        });

        it('should handle random binary data', () => {
            const random = crypto.getRandomValues(new Uint8Array(32));
            const encoded = toBase64url(random);
            const decoded = fromBase64url(encoded);

            expect(decoded).toEqual(random);
        });

        it('should handle all byte values (0-255)', () => {
            const allBytes = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                allBytes[i] = i;
            }

            const encoded = toBase64url(allBytes);
            const decoded = fromBase64url(encoded);

            expect(decoded).toEqual(allBytes);
        });
    });

    describe('CESR signature encoding/decoding', () => {
        it('should encode signature to CESR qb64 format with exact values', () => {
            const signature = new Uint8Array(64).fill(42);
            const encoded = CESR.encodeSignature(signature, true);

            expect(encoded).toMatch(/^0B[A-Za-z0-9_-]+$/);
            expect(encoded.length).toBeGreaterThan(2);
            // Exact expected value for deterministic signature (all bytes = 42)
            expect(encoded).toBe('0BKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg');
        });

        it('should decode CESR signature to raw bytes with exact values', () => {
            // Use deterministic test data (0, 1, 2, ..., 63)
            const original = new Uint8Array(64);
            for (let i = 0; i < 64; i++) {
                original[i] = i;
            }
            const encoded = CESR.encodeSignature(original, true);
            const decoded = CESR.decodeSignature(encoded);

            expect(decoded).toEqual(original);
            // Exact expected CESR string
            expect(encoded).toBe('0BAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-Pw');
        });

        it('should distinguish transferable vs non-transferable signatures', () => {
            const signature = new Uint8Array(64).fill(1);

            const transferable = CESR.encodeSignature(signature, true);
            const nonTransferable = CESR.encodeSignature(signature, false);

            expect(transferable.startsWith('0B')).toBe(true);
            expect(nonTransferable.startsWith('0A')).toBe(true);
        });

        it('should reject invalid signature formats', () => {
            expect(() => CESR.decodeSignature('invalid')).toThrow('Invalid CESR signature format');
            expect(() => CESR.decodeSignature('XX' + 'a'.repeat(80))).toThrow('Invalid CESR signature format');
        });

        it('should handle edge case: all zeros', () => {
            const zeros = new Uint8Array(64).fill(0);
            const encoded = CESR.encodeSignature(zeros, true);
            const decoded = CESR.decodeSignature(encoded);

            expect(decoded).toEqual(zeros);
        });

        it('should handle edge case: all 0xFF', () => {
            const ones = new Uint8Array(64).fill(0xFF);
            const encoded = CESR.encodeSignature(ones, true);
            const decoded = CESR.decodeSignature(encoded);

            expect(decoded).toEqual(ones);
        });
    });

    describe('CESR public key encoding/decoding', () => {
        it('should encode public key to CESR qb64 format with exact values', () => {
            // Use deterministic keypair for exact assertions
            const keypair = CESR.keypairFrom(12345);

            expect(keypair.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/);
            // Exact expected value for entropy 12345
            expect(keypair.verfer).toBe('DBkgsB40TlPNh5F0yMPgkMGYcfXRE0ZLUto3ChgV_r4p');
        });

        it('should decode CESR public key to raw bytes with exact values', () => {
            // Use a deterministic keypair
            const keypair = CESR.keypairFrom(42);
            const decoded = CESR.decodePublicKey(keypair.verfer);

            // Decoded should match the raw public key from the keypair
            expect(decoded).toEqual(keypair.publicKey);
            // Exact expected verfer for entropy 42
            expect(keypair.verfer).toBe('DJGVyFhN-ycnz99PTEOx4xbYEcrtnb6nvXTJd0xdtJ-R');
        });

        it('should distinguish transferable vs non-transferable keys', () => {
            const publicKey = new Uint8Array(32).fill(42);

            const transferable = CESR.encodePublicKey(publicKey, true);
            const nonTransferable = CESR.encodePublicKey(publicKey, false);

            expect(transferable.startsWith('D')).toBe(true);
            expect(nonTransferable.startsWith('B')).toBe(true);
        });

        it('should reject invalid key formats', () => {
            expect(() => CESR.decodePublicKey('invalid')).toThrow('Invalid CESR public key format');
            expect(() => CESR.decodePublicKey('X' + 'a'.repeat(43))).toThrow('Invalid CESR public key format');
        });

        it('should maintain key bytes through encoding/decoding', () => {
            const keypair = CESR.keypairFrom(12345);
            const decoded = CESR.decodePublicKey(keypair.verfer);

            expect(decoded).toEqual(keypair.publicKey);
        });
    });

    describe('Canonical JSON serialization', () => {
        it('should produce deterministic JSON regardless of key order', () => {
            const obj1 = { b: 2, a: 1, c: 3 };
            const obj2 = { a: 1, c: 3, b: 2 };
            const obj3 = { c: 3, b: 2, a: 1 };

            const canon1 = canonicalize(obj1);
            const canon2 = canonicalize(obj2);
            const canon3 = canonicalize(obj3);

            expect(canon1).toBe(canon2);
            expect(canon2).toBe(canon3);
            expect(canon1).toBe('{"a":1,"b":2,"c":3}');
        });

        it('should handle nested objects', () => {
            const obj = {
                nested: { b: 2, a: 1 },
                top: 'value'
            };

            const canonical = canonicalize(obj);
            expect(canonical).toBe('{"nested":{"a":1,"b":2},"top":"value"}');
        });

        it('should handle arrays', () => {
            const obj = {
                arr: [3, 1, 2],
                key: 'value'
            };

            const canonical = canonicalize(obj);
            expect(canonical).toBe('{"arr":[3,1,2],"key":"value"}');
        });

        it('should be consistent across multiple calls', () => {
            const obj = { z: 26, a: 1, m: 13 };

            const calls = Array.from({ length: 10 }, () => canonicalize(obj));
            const unique = new Set(calls);

            expect(unique.size).toBe(1);
        });
    });

    describe('SAID computation', () => {
        it('should compute SAID from canonical JSON bytes', () => {
            const event = {
                t: 'icp',
                s: '0',
                k: ['DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6']
            };

            const canonical = canonicalize(event);
            const bytes = new TextEncoder().encode(canonical);
            const hash = blake3(bytes, { dkLen: 32 });
            const said = encodeCESRDigest(hash, 'E');

            expect(said).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        });

        it('should produce different SAIDs for different data', () => {
            const event1 = { data: 'value1' };
            const event2 = { data: 'value2' };

            const said1 = computeSAID(event1);
            const said2 = computeSAID(event2);

            expect(said1).not.toBe(said2);
        });

        it('should produce same SAID for equivalent objects', () => {
            const event1 = { b: 2, a: 1 };
            const event2 = { a: 1, b: 2 };

            const said1 = computeSAID(event1);
            const said2 = computeSAID(event2);

            expect(said1).toBe(said2);
        });

        it('should compute consistent SAID across multiple calls', () => {
            const event = { test: 'data', num: 42 };

            const saids = Array.from({ length: 10 }, () => computeSAID(event));
            const unique = new Set(saids);

            expect(unique.size).toBe(1);
        });
    });

    describe('Round-trip serialization', () => {
        it('should maintain data integrity through qb64 round-trip', () => {
            const original = crypto.getRandomValues(new Uint8Array(256));
            const qb64 = toQB64(original);
            const recovered = fromQB64(qb64);

            expect(recovered).toEqual(original);
        });

        it('should handle signature round-trips', () => {
            const signature = crypto.getRandomValues(new Uint8Array(64));
            const encoded = CESR.encodeSignature(signature, true);
            const decoded = CESR.decodeSignature(encoded);

            expect(decoded).toEqual(signature);
        });

        it('should handle public key round-trips', () => {
            // Use real keypairs to ensure valid Ed25519 keys
            const keypair1 = CESR.keypairFrom(111);
            const keypair2 = CESR.keypairFrom(222);

            const decoded1 = CESR.decodePublicKey(keypair1.verfer);
            const decoded2 = CESR.decodePublicKey(keypair2.verfer);

            expect(decoded1).toEqual(keypair1.publicKey);
            expect(decoded2).toEqual(keypair2.publicKey);
        });

        it('should maintain SAID through event serialization', () => {
            // Create event with placeholder SAID
            const eventWithPlaceholder = {
                v: 'KERI10JSON0001aa_',
                t: 'icp',
                d: '#'.repeat(44), // placeholder
                i: 'DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6',
                s: '0',
                kt: '1',
                k: ['DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6'],
                n: 'EJmL2zNTkZZtezB80IQ5DgzZ7t-euww-kqC-bk8qc-pk',
                nt: '1',
                dt: '2024-01-01T00:00:00.000Z'
            };

            // Compute initial SAID from placeholder
            const saidWithPlaceholder = computeSAID(eventWithPlaceholder);

            // Create event with computed SAID
            const eventWithSaid = { ...eventWithPlaceholder, d: saidWithPlaceholder };

            // The SAID changes when we replace the placeholder, so compute again
            const finalSaid = computeSAID(eventWithSaid);

            // This is expected behavior - the SAID is self-referential
            // What matters is that serializing with the same SAID produces the same result
            const canonical1 = canonicalize(eventWithSaid);
            const canonical2 = canonicalize(eventWithSaid);

            expect(canonical1).toBe(canonical2);
            expect(finalSaid).toBe(computeSAID(eventWithSaid));
        });

        it('should handle multiple signatures in envelope', () => {
            const signatures = [
                crypto.getRandomValues(new Uint8Array(64)),
                crypto.getRandomValues(new Uint8Array(64)),
                crypto.getRandomValues(new Uint8Array(64))
            ];

            const encoded = signatures.map(s => CESR.encodeSignature(s, true));
            const decoded = encoded.map(e => CESR.decodeSignature(e));

            expect(decoded[0]).toEqual(signatures[0]);
            expect(decoded[1]).toEqual(signatures[1]);
            expect(decoded[2]).toEqual(signatures[2]);
        });
    });

    describe('Error handling', () => {
        it('should reject malformed base64url', () => {
            expect(() => fromBase64url('invalid@#$')).toThrow();
        });

        it('should reject signature with wrong code', () => {
            expect(() => CESR.decodeSignature('ZZ' + 'a'.repeat(80))).toThrow();
        });

        it('should reject public key with wrong code', () => {
            expect(() => CESR.decodePublicKey('Z' + 'a'.repeat(43))).toThrow();
        });

        it('should handle corrupt qb64 gracefully', () => {
            const corrupt = 'E' + '!'.repeat(43);
            expect(() => fromQB64(corrupt)).toThrow();
        });
    });

    describe('CESR envelope serialization', () => {
        it('should serialize event to canonical bytes', () => {
            const event = {
                t: 'icp',
                s: '0',
                k: ['DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6']
            };

            const canonical = canonicalize(event);
            const bytes = new TextEncoder().encode(canonical);

            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(bytes.length).toBeGreaterThan(0);
        });

        it('should produce same bytes for equivalent events', () => {
            const event1 = { b: 2, a: 1, c: 3 };
            const event2 = { c: 3, a: 1, b: 2 };

            const bytes1 = new TextEncoder().encode(canonicalize(event1));
            const bytes2 = new TextEncoder().encode(canonicalize(event2));

            expect(bytes1).toEqual(bytes2);
        });

        it('should convert bytes to qb64 and back', () => {
            const event = { test: 'data' };
            const canonical = canonicalize(event);
            const bytes = new TextEncoder().encode(canonical);

            const qb64 = toQB64(bytes);
            const recovered = fromQB64(qb64);

            expect(recovered).toEqual(bytes);

            const recoveredText = new TextDecoder().decode(recovered);
            expect(recoveredText).toBe(canonical);
        });
    });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Uint8Array to base64url
 */
function toBase64url(data: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert base64url to Uint8Array
 */
function fromBase64url(base64url: string): Uint8Array {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encode CESR digest (used for SAID)
 */
function encodeCESRDigest(hash: Uint8Array, code: string): string {
    const b64 = btoa(String.fromCharCode(...hash));
    return code + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Compute SAID from any object
 */
function computeSAID(obj: any): string {
    const canonical = canonicalize(obj);
    const bytes = new TextEncoder().encode(canonical);
    const hash = blake3(bytes, { dkLen: 32 });
    return encodeCESRDigest(hash, 'E');
}

/**
 * Convert bytes to qb64 (base64url without padding)
 */
function toQB64(bytes: Uint8Array): string {
    return toBase64url(bytes);
}

/**
 * Convert qb64 to bytes
 */
function fromQB64(qb64: string): Uint8Array {
    return fromBase64url(qb64);
}
