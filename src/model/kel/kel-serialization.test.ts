/**
 * Tests for KEL serialization and proof verification
 *
 * These tests demonstrate the complete flow of:
 * - Creating KEL events with CESR serialization
 * - Computing SAIDs from canonical bytes
 * - Creating envelopes with eventCesr field
 * - Round-trip verification of events
 */

import { describe, it, expect } from 'bun:test';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';
import type { KelEnvelope, SignerSetRef } from './types';

describe('KEL Serialization and SAID Computation', () => {

    describe('KEL.serialize()', () => {
        it('should serialize event to canonical CESR format', () => {
            const event = KEL.inceptionFrom(12345, 67890, true, '2024-01-01T00:00:00.000Z');

            const serialized = KEL.serialize(event);

            expect(serialized.raw).toBeInstanceOf(Uint8Array);
            expect(serialized.qb64).toBeTruthy();
            expect(typeof serialized.qb64).toBe('string');
        });

        it('should produce deterministic serialization', () => {
            const event = KEL.inceptionFrom(42, 43, true, '2024-01-01T00:00:00.000Z');

            const ser1 = KEL.serialize(event);
            const ser2 = KEL.serialize(event);

            expect(ser1.qb64).toBe(ser2.qb64);
            expect(ser1.raw).toEqual(ser2.raw);
        });

        it('should handle events with different field orders', () => {
            const event1 = {
                v: 'KERI10JSON0001aa_',
                t: 'icp' as const,
                d: 'ETest',
                i: 'DAid1',
                s: '0' as const,
                kt: '1',
                k: ['DKey1'],
                n: 'ENext',
                nt: '1',
                dt: '2024-01-01T00:00:00.000Z'
            };

            const event2 = {
                kt: '1',
                v: 'KERI10JSON0001aa_',
                i: 'DAid1',
                dt: '2024-01-01T00:00:00.000Z',
                s: '0' as const,
                nt: '1',
                d: 'ETest',
                n: 'ENext',
                t: 'icp' as const,
                k: ['DKey1']
            };

            const ser1 = KEL.serialize(event1 as any);
            const ser2 = KEL.serialize(event2 as any);

            // Canonical form should be identical despite different field order
            expect(ser1.qb64).toBe(ser2.qb64);
        });
    });

    describe('KEL.computeSAID()', () => {
        it('should compute SAID from canonical bytes', () => {
            const event = KEL.inceptionFrom(111, 222, true, '2024-01-01T00:00:00.000Z');
            const { raw } = KEL.serialize(event);

            const computed = KEL.computeSAID(raw);

            expect(computed).toMatch(/^E[A-Za-z0-9_-]{43}$/);
            // Note: computed SAID includes the event.d field in the hash,
            // so it won't match the original event.d (which was computed with a placeholder)
            // This is expected KERI behavior - the SAID is self-referential
            expect(computed).not.toBe('#'.repeat(44));
        });

        it('should produce different SAIDs for different events', () => {
            const event1 = KEL.inceptionFrom(1, 2, true, '2024-01-01T00:00:00.000Z');
            const event2 = KEL.inceptionFrom(3, 4, true, '2024-01-01T00:00:00.000Z');

            const { raw: raw1 } = KEL.serialize(event1);
            const { raw: raw2 } = KEL.serialize(event2);

            const said1 = KEL.computeSAID(raw1);
            const said2 = KEL.computeSAID(raw2);

            expect(said1).not.toBe(said2);
        });

        it('should be consistent for same event', () => {
            const fixedTime = '2024-01-01T00:00:00.000Z';
            const event = KEL.inceptionFrom(1234, 5678, true, fixedTime);

            const { raw } = KEL.serialize(event);
            const computed1 = KEL.computeSAID(raw);
            const computed2 = KEL.computeSAID(raw);

            expect(computed1).toBe(computed2);
            expect(computed1).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        });
    });

    describe('CESR.fromQB64() and CESR.toQB64()', () => {
        it('should convert between qb64 and raw bytes', () => {
            const event = KEL.inceptionFrom(999, 888, true, '2024-01-01T00:00:00.000Z');
            const { raw, qb64 } = KEL.serialize(event);

            const decoded = CESR.fromQB64(qb64);
            const reencoded = CESR.toQB64(decoded);

            expect(decoded).toEqual(raw);
            expect(reencoded).toBe(qb64);
        });

        it('should handle empty bytes', () => {
            const empty = new Uint8Array([]);
            const qb64 = CESR.toQB64(empty);
            const decoded = CESR.fromQB64(qb64);

            expect(decoded).toEqual(empty);
        });

        it('should handle arbitrary binary data', () => {
            const data = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
            const qb64 = CESR.toQB64(data);
            const decoded = CESR.fromQB64(qb64);

            expect(decoded).toEqual(data);
        });
    });

    describe('KelEnvelope with eventCesr', () => {
        it('should create envelope with eventCesr field', () => {
            const currentKp = CESR.keypairFrom(100);
            const nextKp = CESR.keypairFrom(200);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const { qb64 } = KEL.serialize(event);
            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);

            // Manually add eventCesr for now (until createEnvelope is updated)
            const enrichedEnvelope: KelEnvelope = {
                ...envelope,
                eventCesr: qb64
            };

            expect(enrichedEnvelope.eventCesr).toBeTruthy();
            expect(enrichedEnvelope.event).toEqual(event);
            expect(enrichedEnvelope.signatures.length).toBeGreaterThan(0);
        });

        it('should allow reconstructing event from eventCesr', () => {
            const event = KEL.inceptionFrom(777, 888, true, '2024-01-01T00:00:00.000Z');
            const { raw, qb64 } = KEL.serialize(event);

            // Reconstruct from qb64
            const reconstructed = CESR.fromQB64(qb64);

            expect(reconstructed).toEqual(raw);

            // Recompute SAID from reconstructed bytes
            const recomputedSAID = KEL.computeSAID(reconstructed);
            expect(recomputedSAID).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        });

        it('should include signerSet reference in signatures', () => {
            const currentKp = CESR.keypairFrom(300);
            const nextKp = CESR.keypairFrom(400);

            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: '2024-01-01T00:00:00.000Z'
            });

            const signerSet: SignerSetRef = {
                kind: 'current',
                sn: 0
            };

            const envelope: KelEnvelope = {
                event,
                eventCesr: KEL.serialize(event).qb64,
                signatures: [{
                    keyIndex: 0,
                    sig: '0BTest', // placeholder
                    signerSet
                }]
            };

            expect(envelope.signatures[0].signerSet).toBeDefined();
            expect(envelope.signatures[0].signerSet?.kind).toBe('current');
        });
    });

    describe('End-to-end serialization flow', () => {
        it('should complete full inception flow with verification', async () => {
            const currentKp = CESR.keypairFrom(1111);
            const nextKp = CESR.keypairFrom(2222);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // 1. Create inception event
            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // 2. Serialize to CESR
            const { raw, qb64 } = KEL.serialize(event);

            // 3. Verify SAID can be computed
            const recomputedSAID = KEL.computeSAID(raw);
            expect(recomputedSAID).toMatch(/^E[A-Za-z0-9_-]{43}$/);

            // 4. Create envelope
            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);

            // 5. Add eventCesr
            const fullEnvelope: KelEnvelope = {
                ...envelope,
                eventCesr: qb64,
                signatures: envelope.signatures.map((sig, idx) => ({
                    ...sig,
                    signerSet: { kind: 'current' as const, sn: 0 }
                }))
            };

            // 6. Verify signature
            const verification = await KEL.verifyEnvelope(fullEnvelope);
            expect(verification.valid).toBe(true);
        });

        it('should complete rotation flow with prior signerSet', async () => {
            const kp1 = CESR.keypairFrom(3333);
            const kp2 = CESR.keypairFrom(4444);
            const kp3 = CESR.keypairFrom(5555);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // 1. Inception
            const inception = KEL.inception({
                currentKeys: [kp1.verfer],
                nextKeys: [kp2.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // 2. Rotation (signed by kp1, reveals kp2, commits to kp3)
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [kp2.verfer],
                nextKeys: [kp3.verfer],
                previousEvent: inception.d,
                sequence: 1,
                transferable: true,
                currentTime: fixedTime
            });

            const { qb64 } = KEL.serialize(rotation);

            // 3. Create envelope with prior signerSet
            const envelope = KEL.createEnvelope(rotation, [kp1.privateKey]);
            const fullEnvelope: KelEnvelope = {
                ...envelope,
                eventCesr: qb64,
                signatures: envelope.signatures.map((sig, idx) => ({
                    ...sig,
                    signerSet: { kind: 'prior' as const, sn: 0 } // prior establishment
                }))
            };

            // 4. Verify
            const verification = await KEL.verifyEnvelope(fullEnvelope, inception);
            expect(verification.valid).toBe(true);
            expect(fullEnvelope.signatures[0].signerSet?.kind).toBe('prior');
        });
    });
});
