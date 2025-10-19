/**
 * Tests for CESR operations
 */

import { describe, it, expect } from 'bun:test';
import { CESR } from './cesr';

describe('CESR Operations', () => {
    describe('CESR.generateMnemonic', () => {
        it('should generate a valid mnemonic phrase', () => {
            const mnemonic = CESR.generateMnemonic();

            expect(typeof mnemonic).toBe('string');
            expect(mnemonic.split(' ')).toHaveLength(24); // 24 words for 256-bit entropy
            expect(CESR.validateMnemonic(mnemonic)).toBe(true);
        });

        it('should generate different mnemonics each time', () => {
            const mnemonic1 = CESR.generateMnemonic();
            const mnemonic2 = CESR.generateMnemonic();

            expect(mnemonic1).not.toBe(mnemonic2);
        });
    });

    describe('CESR.keypairFromMnemonic', () => {
        it('should create keypair from valid mnemonic', () => {
            const mnemonic = CESR.generateMnemonic();

            const result = CESR.keypairFromMnemonic(mnemonic);

            expect(result.privateKey).toBeInstanceOf(Uint8Array);
            expect(result.publicKey).toBeInstanceOf(Uint8Array);
            expect(result.mnemonic).toBe(mnemonic);
            expect(result.verfer).toBeDefined();
            expect(result.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/); // CESR format
        });

        it('should fail with invalid mnemonic', () => {
            const invalidMnemonic = 'invalid mnemonic phrase';

            expect(() => CESR.keypairFromMnemonic(invalidMnemonic)).toThrow('Invalid mnemonic phrase');
        });

        it('should create transferable keys by default', () => {
            const mnemonic = CESR.generateMnemonic();

            const result = CESR.keypairFromMnemonic(mnemonic);

            expect(result.verfer).toMatch(/^D/); // Transferable key starts with 'D'
        });

        it('should create non-transferable keys when specified', () => {
            const mnemonic = CESR.generateMnemonic();

            const result = CESR.keypairFromMnemonic(mnemonic, false);

            expect(result.verfer).toMatch(/^B/); // Non-transferable key starts with 'B'
        });
    });

    describe('CESR.keypairFromSeed', () => {
        it('should create keypair from raw seed', () => {
            const seed = new Uint8Array(32).fill(1);

            const result = CESR.keypairFromSeed(seed);

            expect(result.privateKey).toEqual(seed);
            expect(result.publicKey).toBeInstanceOf(Uint8Array);
            expect(result.verfer).toBeDefined();
        });

        it('should fail with invalid seed length', () => {
            const invalidSeed = new Uint8Array(16); // Wrong length

            expect(() => CESR.keypairFromSeed(invalidSeed)).toThrow('Seed must be exactly 32 bytes');
        });

        it('should create deterministic keypairs from same seed', () => {
            const seed = new Uint8Array(32).fill(42);

            const result1 = CESR.keypairFromSeed(seed);
            const result2 = CESR.keypairFromSeed(seed);

            expect(result1.verfer).toBe(result2.verfer);
        });
    });

    describe('CESR.randomKeypairWithMnemonic', () => {
        it('should create random keypair with mnemonic', () => {
            const result = CESR.randomKeypairWithMnemonic();

            expect(result.privateKey).toBeInstanceOf(Uint8Array);
            expect(result.publicKey).toBeInstanceOf(Uint8Array);
            expect(result.mnemonic).toBeDefined();
            expect(result.verfer).toBeDefined();
            expect(result.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        });

        it('should create different keypairs each time', () => {
            const result1 = CESR.randomKeypairWithMnemonic();
            const result2 = CESR.randomKeypairWithMnemonic();

            expect(result1.verfer).not.toBe(result2.verfer);
            expect(result1.privateKey).not.toEqual(result2.privateKey);
        });

        it('should create non-transferable keys when specified', () => {
            const result = CESR.randomKeypairWithMnemonic(false);

            expect(result.verfer).toMatch(/^B/); // Non-transferable key starts with 'B'
        });
    });

    describe('CESR.createMultiple', () => {
        it('should create multiple keypairs', () => {
            const count = 3;

            const results = CESR.createMultiple(count);

            expect(results).toHaveLength(count);
            results.forEach(result => {
                expect(result.privateKey).toBeInstanceOf(Uint8Array);
                expect(result.verfer).toBeDefined();
            });
        });

        it('should create unique keypairs', () => {
            const count = 5;

            const results = CESR.createMultiple(count);
            const verfers = results.map(r => r.verfer);

            // All verfers should be unique
            const uniqueVerfers = new Set(verfers);
            expect(uniqueVerfers.size).toBe(count);
        });
    });

    describe('CESR.createForInception', () => {
        it('should create current and next keypairs', () => {
            const result = CESR.createForInception();

            expect(result.current).toBeDefined();
            expect(result.next).toBeDefined();
            expect(result.current.verfer).toBeDefined();
            expect(result.next.verfer).toBeDefined();
            expect(result.current.verfer).not.toBe(result.next.verfer);
        });

        it('should create non-transferable keys when specified', () => {
            const result = CESR.createForInception(false);

            expect(result.current.verfer).toMatch(/^B/);
            expect(result.next.verfer).toMatch(/^B/);
        });
    });

    describe('CESR validation and conversion', () => {
        it('should validate correct mnemonic', () => {
            const mnemonic = CESR.generateMnemonic();

            expect(CESR.validateMnemonic(mnemonic)).toBe(true);
        });

        it('should reject invalid mnemonic', () => {
            const invalidMnemonic = 'invalid mnemonic phrase';

            expect(CESR.validateMnemonic(invalidMnemonic)).toBe(false);
        });

        it('should convert mnemonic to seed', () => {
            const mnemonic = CESR.generateMnemonic();

            const seed = CESR.mnemonicToSeed(mnemonic);

            expect(seed).toBeInstanceOf(Uint8Array);
            expect(seed).toHaveLength(32);
        });

        it('should convert seed to mnemonic', () => {
            const seed = new Uint8Array(32).fill(1);

            const mnemonic = CESR.seedToMnemonic(seed);

            expect(typeof mnemonic).toBe('string');
            expect(mnemonic.split(' ')).toHaveLength(24);
            expect(CESR.validateMnemonic(mnemonic)).toBe(true);
        });
    });

    describe('CESR.keypairFrom', () => {
        it('should create deterministic keypair from numeric entropy', () => {
            const entropy = 1234;

            const keypair1 = CESR.keypairFrom(entropy);
            const keypair2 = CESR.keypairFrom(entropy);

            // Should be identical
            expect(keypair1.privateKey).toEqual(keypair2.privateKey);
            expect(keypair1.publicKey).toEqual(keypair2.publicKey);
            expect(keypair1.verfer).toBe(keypair2.verfer);
            expect(keypair1.mnemonic).toBe(keypair2.mnemonic);

            // Should have valid structure
            expect(keypair1.privateKey).toBeInstanceOf(Uint8Array);
            expect(keypair1.publicKey).toBeInstanceOf(Uint8Array);
            expect(keypair1.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/);
            expect(keypair1.mnemonic).toBeDefined();
            expect(keypair1.mnemonic!.split(' ')).toHaveLength(24);
        });

        it('should create different keypairs for different entropy values', () => {
            const keypair1 = CESR.keypairFrom(1234);
            const keypair2 = CESR.keypairFrom(5678);

            expect(keypair1.privateKey).not.toEqual(keypair2.privateKey);
            expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
            expect(keypair1.verfer).not.toBe(keypair2.verfer);
            expect(keypair1.mnemonic).not.toBe(keypair2.mnemonic);
        });

        it('should create non-transferable keys when specified', () => {
            const keypair = CESR.keypairFrom(1234, false);

            expect(keypair.verfer).toMatch(/^B[A-Za-z0-9_-]{43}$/); // Non-transferable key starts with 'B'
        });

        it('should create transferable keys by default', () => {
            const keypair = CESR.keypairFrom(1234);

            expect(keypair.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/); // Transferable key starts with 'D'
        });

        it('should produce exact expected keypair for fixed entropy', () => {
            const entropy = 1234;
            const keypair = CESR.keypairFrom(entropy);

            // Exact expected values for entropy 1234 - this ensures deterministic behavior
            const expectedVerfer = 'DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6';
            const expectedMnemonic = 'abandon ability cruel abandon able help abandon above sure abandon abuse rose abandon act marine abandon agent copy abandon antenna parade abandon beauty steak';

            // Assert exact values
            expect(keypair.verfer).toBe(expectedVerfer);
            expect(keypair.mnemonic).toBe(expectedMnemonic);

            // Verify the keypair is valid
            expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
            expect(keypair.privateKey).toHaveLength(32);
            expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
            expect(keypair.publicKey).toHaveLength(32);
            expect(keypair.verfer).toMatch(/^D[A-Za-z0-9_-]{43}$/);
            expect(keypair.mnemonic).toBeDefined();
            expect(keypair.mnemonic!.split(' ')).toHaveLength(24);
            expect(CESR.validateMnemonic(keypair.mnemonic!)).toBe(true);
        });
    });

    describe('CESR.getPublicKey', () => {
        it('should extract public key from keypair', () => {
            const keypair = CESR.keypairFrom(1234);

            const publicKey = CESR.getPublicKey(keypair);

            expect(publicKey).toBe(keypair.verfer);
            expect(publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        });

        it('should work with transferable keys', () => {
            const keypair = CESR.keypairFrom(5678, true);

            const publicKey = CESR.getPublicKey(keypair);

            expect(publicKey).toBe(keypair.verfer);
            expect(publicKey).toMatch(/^D[A-Za-z0-9_-]{43}$/);
        });

        it('should work with non-transferable keys', () => {
            const keypair = CESR.keypairFrom(9999, false);

            const publicKey = CESR.getPublicKey(keypair);

            expect(publicKey).toBe(keypair.verfer);
            expect(publicKey).toMatch(/^B[A-Za-z0-9_-]{43}$/);
        });

        it('should work with keypairs from different sources', () => {
            const keypair1 = CESR.keypairFrom(1111);
            const keypair2 = CESR.randomKeypairWithMnemonic();
            const keypair3 = CESR.keypairFromMnemonic(CESR.generateMnemonic());

            const publicKey1 = CESR.getPublicKey(keypair1);
            const publicKey2 = CESR.getPublicKey(keypair2);
            const publicKey3 = CESR.getPublicKey(keypair3);

            expect(publicKey1).toBe(keypair1.verfer);
            expect(publicKey2).toBe(keypair2.verfer);
            expect(publicKey3).toBe(keypair3.verfer);

            // All should be different
            expect(publicKey1).not.toBe(publicKey2);
            expect(publicKey1).not.toBe(publicKey3);
            expect(publicKey2).not.toBe(publicKey3);
        });
    });


});
