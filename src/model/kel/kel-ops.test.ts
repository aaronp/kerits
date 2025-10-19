/**
 * Tests for KEL operations
 */

import { describe, expect, test } from 'bun:test';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';
import { s } from '../string-ops';
import type { InceptionEvent } from './types';

describe('KEL Operations', () => {
    describe('KEL.inceptionFrom', () => {
        test('should create inception event with provided seeds', () => {
            const event = KEL.inceptionFrom(123, 456, true);

            expect(event.t).toBe('icp');
            expect(event.s).toBe('0');
            expect(event.kt).toBe(s('1').asThreshold());
            expect(event.k).toHaveLength(1);
            expect(event.n).toBeDefined();
            expect(typeof event.n).toBe('string');
            expect(event.nt).toBe(s('1').asThreshold());
            expect(event.k[0]).toMatch(/^D[A-Za-z0-9_-]{43}$/);
            expect(event.n).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        });

        test('should create inception event with random seeds when not provided', () => {
            const event1 = KEL.inceptionFrom();
            const event2 = KEL.inceptionFrom();

            expect(event1.t).toBe('icp');
            expect(event1.s).toBe('0');
            expect(event1.kt).toBe(s('1').asThreshold());
            expect(event1.k).toHaveLength(1);
            expect(event1.n).toBeDefined();
            expect(typeof event1.n).toBe('string');
            expect(event1.nt).toBe(s('1').asThreshold());

            // Should be different each time due to random seeds
            expect(event1.k[0]).not.toBe(event2.k[0]);
            expect(event1.n).not.toBe(event2.n);
            expect(event1.d).not.toBe(event2.d);
        });

        test('should create non-transferable inception when specified', () => {
            const event = KEL.inceptionFrom(789, 101112, false);

            expect(event.t).toBe('icp');
            expect(event.k[0]).toMatch(/^B[A-Za-z0-9_-]{43}$/); // Non-transferable key
            expect(event.n).toMatch(/^E[A-Za-z0-9_-]{43}$/); // Next key commitment (always E)
        });

        test('should be deterministic with same seeds', () => {
            const fixedTime = '2024-01-01T00:00:00.000Z';
            const event1 = KEL.inceptionFrom(111, 222, true, fixedTime);
            const event2 = KEL.inceptionFrom(111, 222, true, fixedTime);

            // With fixed timestamps, everything should be identical
            expect(event1).toEqual(event2);
            expect(event1.d).toBe(event2.d); // SAIDs should be identical
            expect(event1.k).toEqual(event2.k);
            expect(event1.kt).toBe(event2.kt);
            expect(event1.nt).toBe(event2.nt);
            expect(event1.t).toBe(event2.t);
            expect(event1.s).toBe(event2.s);
            expect(event1.k[0]).toBe(event2.k[0]);
            expect(event1.n).toBe(event2.n);
            expect(event1.dt).toBe(event2.dt);
        });

        test('should produce exact expected inception event for fixed seeds', () => {
            const fixedTime = '2024-01-01T00:00:00.000Z';
            const event = KEL.inceptionFrom(1234, 5678, true, fixedTime);

            // With fixed timestamp, we can assert exact equality
            const expectedEvent = {
                v: 'KERI10JSON0001aa_',
                t: 'icp' as const,
                d: s('EFn-5-Uw5PY1stSyBYZIT9vpyPeK8WyauHq9Rhi0vh7w').asSAID(),
                i: s('DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6').asAID(),
                s: '0' as const,
                kt: s('1').asThreshold(),
                k: ['DGyRkHQbJ6lafpzLpxaIa5ctBm50rNcXCqlmJQdTDqQ6'],
                n: s('EJmL2zNTkZZtezB80IQ5DgzZ7t-euww-kqC-bk8qc-pk').asSAID(),
                nt: s('1').asThreshold(),
                dt: fixedTime
            };

            expect(event).toEqual(expectedEvent);
        });
    });

    describe('KEL.inception', () => {
        test('should create inception event with transferable keys', () => {
            const current = CESR.keypairFrom(123);
            const next = CESR.keypairFrom(234);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            expect(event.t).toBe('icp');
            expect(event.s).toBe('0');
            expect(event.kt).toBe(s('1').asThreshold());
            expect(event.k).toEqual([CESR.getPublicKey(current)]);
            expect(event.n).toBeDefined();
            expect(typeof event.n).toBe('string');
            expect(event.nt).toBe(s('1').asThreshold());
            expect(event.i).toBe(s(CESR.getPublicKey(current)).asAID());
        });

        test('should create inception event with non-transferable keys', () => {
            const current = CESR.randomKeypair(false);
            const next = CESR.randomKeypair(false);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: false,
            });

            expect(event.t).toBe('icp');
            expect(event.s).toBe('0');
            expect(event.kt).toBe(s('1').asThreshold());
            expect(event.k).toEqual([CESR.getPublicKey(current)]);
            expect(event.n).toBeDefined();
            expect(typeof event.n).toBe('string');
            expect(event.nt).toBe(s('1').asThreshold());
            expect(event.i).toBe(s(CESR.getPublicKey(current)).asAID());
        });

        test('should use first public key as identifier for transferable inception', () => {
            const current = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            expect(event.i).toBe(s(CESR.getPublicKey(current)).asAID());
        });

        test('should generate deterministic SAID for same data', () => {
            const current = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event1 = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
                currentTime: fixedTime,
            });

            const event2 = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
                currentTime: fixedTime,
            });

            expect(event1.d).toBe(event2.d);
            expect(event1).toEqual(event2); // Should be completely identical
        });

        test('should generate different SAIDs for different keys', () => {
            const current1 = CESR.randomKeypair(true);
            const current2 = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);

            const event1 = KEL.inception({
                currentKeys: [CESR.getPublicKey(current1)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            const event2 = KEL.inception({
                currentKeys: [CESR.getPublicKey(current2)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            expect(event1.d).not.toBe(event2.d);
            expect(event1.i).not.toBe(event2.i);
        });

        test('should support multiple current keys with threshold', () => {
            const current1 = CESR.randomKeypair(true);
            const current2 = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current1), CESR.getPublicKey(current2)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
                keyThreshold: 2,
            });

            expect(event.kt).toBe(s('2').asThreshold());
            expect(event.k).toEqual([CESR.getPublicKey(current1), CESR.getPublicKey(current2)]);
        });

        test('should support witnesses', () => {
            const current = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);
            const witness1 = CESR.randomKeypair(true);
            const witness2 = CESR.randomKeypair(true);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
                witnesses: [CESR.getPublicKey(witness1), CESR.getPublicKey(witness2)],
                witnessThreshold: 1,
            });

            expect(event.w).toEqual([s(CESR.getPublicKey(witness1)).asAID(), s(CESR.getPublicKey(witness2)).asAID()]);
            expect(event.wt).toBe(s('1').asThreshold());
        });

        test('should default key threshold to 1 for single key', () => {
            const current = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            expect(event.kt).toBe(s('1').asThreshold());
        });

        test('should default key threshold to number of keys for multiple keys', () => {
            const current1 = CESR.randomKeypair(true);
            const current2 = CESR.randomKeypair(true);
            const current3 = CESR.randomKeypair(true);
            const next = CESR.randomKeypair(true);

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current1), CESR.getPublicKey(current2), CESR.getPublicKey(current3)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
            });

            expect(event.kt).toBe(s('3').asThreshold());
        });

        test('should produce exact expected inception event for deterministic keys', () => {
            // Use deterministic keypairs for exact assertions
            const current = CESR.keypairFrom(9999);
            const next = CESR.keypairFrom(8888);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [CESR.getPublicKey(current)],
                nextKeys: [CESR.getPublicKey(next)],
                transferable: true,
                currentTime: fixedTime,
            });

            // With fixed timestamp, we can assert exact equality
            const expectedEvent = {
                v: 'KERI10JSON0001aa_',
                t: 'icp' as const,
                d: s('EtkWov1YRn1HtpCtGK9ATlUss849VkW1XDsqq9Yp9gvE').asSAID(),
                i: s('DAkUfF5sq_3c_QKtQF8Gr-uGC57uE77LNgC20gPPl5kW').asAID(),
                s: '0' as const,
                kt: s('1').asThreshold(),
                k: ['DAkUfF5sq_3c_QKtQF8Gr-uGC57uE77LNgC20gPPl5kW'],
                n: s('EzNONqsuxqbvY7gJN6VB9iYvIAA9tlTWdkEsaSW8SggU').asSAID(),
                nt: s('1').asThreshold(),
                dt: fixedTime
            };

            expect(event).toEqual(expectedEvent);
        });
    });
});
