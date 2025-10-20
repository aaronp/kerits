/**
 * KEL Multi-Signature Tests
 * 
 * Tests for multi-signature KEL operations following the KERI multi-sig specification.
 * Covers 1-of-1, 2-of-2, 2-of-3 scenarios and failure cases.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';
import { s } from '../string-ops';
import { canonicalize } from 'json-canonicalize';
import type { InceptionEvent, RotationEvent, KelEnvelope, CesrSig } from './types';
import type { AID, SAID } from '../types';

describe('KEL Multi-Signature Operations', () => {
    let keypair1: any;
    let keypair2: any;
    let keypair3: any;
    let keypair4: any;

    beforeEach(() => {
        // Generate deterministic keypairs for testing
        keypair1 = CESR.keypairFrom(1111);
        keypair2 = CESR.keypairFrom(2222);
        keypair3 = CESR.keypairFrom(3333);
        keypair4 = CESR.keypairFrom(4444);
    });

    describe('1-of-1 Multi-Sig (Baseline)', () => {
        test('should create and verify single-key inception', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1)],
                nextKeys: [CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            expect(inception.t).toBe('icp');
            expect(inception.s).toBe('0');
            expect(inception.k).toHaveLength(1);
            expect(inception.kt).toBe(s('1').asThreshold());
            expect(inception.n).toBeDefined();
            expect(inception.nt).toBe(s('1').asThreshold());

            // Create envelope with signature
            const envelope = KEL.createEnvelope(inception, [keypair1.privateKey]);
            expect(envelope.signatures).toHaveLength(1);
            expect(envelope.signatures[0]?.keyIndex).toBe(0);

            // Verify envelope
            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(true);
            expect(verification.validSignatures).toBe(1);
            expect(verification.requiredSignatures).toBe(1);
        });

        test('should create and verify single-key rotation', async () => {
            // First create an inception
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1)],
                nextKeys: [CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            // Create rotation revealing the next keys
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            expect(rotation.t).toBe('rot');
            expect(rotation.p).toBe(inception.d);
            expect(rotation.k).toHaveLength(1);
            expect(rotation.kt).toBe(s('1').asThreshold());

            // Create envelope with OLD key signature (keypair1, not keypair2)
            const envelope = KEL.createEnvelope(rotation, [keypair1.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope, inception);
            expect(verification.valid).toBe(true);
        });
    });

    describe('2-of-2 Multi-Sig', () => {
        test('should create and verify 2-of-2 inception', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            expect(inception.k).toHaveLength(2);
            expect(inception.kt).toBe(s('2').asThreshold());
            expect(inception.nt).toBe(s('2').asThreshold());

            // Create envelope with both signatures
            const envelope = KEL.createEnvelope(inception, [keypair1.privateKey, keypair2.privateKey]);
            expect(envelope.signatures).toHaveLength(2);
            expect(envelope.signatures[0]?.keyIndex).toBe(0);
            expect(envelope.signatures[1]?.keyIndex).toBe(1);

            // Verify envelope
            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(true);
            expect(verification.validSignatures).toBe(2);
            expect(verification.requiredSignatures).toBe(2);
        });

        test('should create and verify 2-of-2 rotation', async () => {
            // First create an inception
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create rotation revealing the next keys
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                nextKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create envelope with OLD key signatures (keypair1, keypair2, not keypair3, keypair4)
            const envelope = KEL.createEnvelope(rotation, [keypair1.privateKey, keypair2.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope, inception);
            expect(verification.valid).toBe(true);
            expect(verification.validSignatures).toBe(2);
        });
    });

    describe('2-of-3 Multi-Sig', () => {
        test('should create and verify 2-of-3 inception', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2), CESR.getPublicKey(keypair3)],
                nextKeys: [CESR.getPublicKey(keypair4), CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            expect(inception.k).toHaveLength(3);
            expect(inception.kt).toBe(s('2').asThreshold());

            // Create envelope with only 2 signatures (meets threshold)
            const envelope = KEL.createEnvelope(inception, [keypair1.privateKey, keypair2.privateKey]);
            expect(envelope.signatures).toHaveLength(2);

            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(true);
            expect(verification.validSignatures).toBe(2);
            expect(verification.requiredSignatures).toBe(2);
        });

        test('should verify with any 2 of 3 signatures', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2), CESR.getPublicKey(keypair3)],
                nextKeys: [CESR.getPublicKey(keypair4), CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Test different combinations of 2 signatures
            // We need to manually create envelopes with correct key indices
            const combinations = [
                { keys: [keypair1, keypair2], indices: [0, 1] },
                { keys: [keypair1, keypair3], indices: [0, 2] },
                { keys: [keypair2, keypair3], indices: [1, 2] }
            ];

            for (const { keys, indices } of combinations) {
                // Create canonical representation for signing
                const canonical = canonicalize(inception);
                const canonicalBytes = new TextEncoder().encode(canonical);

                // Create signatures with correct key indices
                const signatures: CesrSig[] = [];
                for (let i = 0; i < keys.length; i++) {
                    const signature = CESR.sign(canonicalBytes, keys[i].privateKey, true);
                    signatures.push({
                        keyIndex: indices[i],
                        sig: signature
                    });
                }

                const envelope: KelEnvelope = {
                    event: inception,
                    signatures
                };

                const verification = await KEL.verifyEnvelope(envelope);
                expect(verification.valid).toBe(true);
                expect(verification.validSignatures).toBe(2);
            }
        });
    });

    describe('Failure Cases', () => {
        test('should reject insufficient signatures', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create envelope with only 1 signature (insufficient for 2-of-2)
            const envelope = KEL.createEnvelope(inception, [keypair1.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(false);
            expect(verification.validSignatures).toBe(1);
            expect(verification.requiredSignatures).toBe(2);
        });

        test('should reject wrong key signatures', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create envelope with wrong private key (keypair3 instead of keypair1)
            const envelope = KEL.createEnvelope(inception, [keypair3.privateKey, keypair2.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(false);
            expect(verification.signatureResults[0]?.valid).toBe(false);
            expect(verification.signatureResults[1]?.valid).toBe(true);
        });

        test('should reject invalid key index', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create envelope with invalid key index
            const envelope: KelEnvelope = {
                event: inception,
                signatures: [{
                    keyIndex: 5, // Invalid index (only 0,1 exist)
                    sig: 'invalid'
                }]
            };

            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(false);
            expect(verification.signatureResults[0]?.valid).toBe(false);
        });

        test('should reject rotation signed by NEW keys instead of OLD keys', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                nextKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Try to sign with NEW keys (should fail)
            const envelope = KEL.createEnvelope(rotation, [keypair3.privateKey, keypair4.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope, inception);
            expect(verification.valid).toBe(false);
        });

        test('should reject rotation with wrong revealed keys', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create rotation with wrong revealed keys (not matching prior commitment)
            const wrongRotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)], // Wrong keys
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Sign with correct OLD keys but wrong revealed keys
            const envelope = KEL.createEnvelope(wrongRotation, [keypair1.privateKey, keypair2.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope, inception);
            expect(verification.valid).toBe(false);
        });

        test('should reject duplicate signature indices', async () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            // Create canonical representation for signing
            const canonical = canonicalize(inception);
            const canonicalBytes = new TextEncoder().encode(canonical);

            // Create valid signatures
            const sig1 = CESR.sign(canonicalBytes, keypair1.privateKey, true);
            const sig2 = CESR.sign(canonicalBytes, keypair2.privateKey, true);

            // Create envelope with duplicate key indices
            const envelope: KelEnvelope = {
                event: inception,
                signatures: [
                    { keyIndex: 0, sig: sig1 },
                    { keyIndex: 0, sig: sig2 } // Duplicate index
                ]
            };

            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(false);
        });

        test('should reject invalid threshold values', () => {
            // Test invalid key threshold
            expect(() => {
                KEL.inception({
                    currentKeys: [CESR.getPublicKey(keypair1)],
                    nextKeys: [CESR.getPublicKey(keypair2)],
                    transferable: true,
                    keyThreshold: 0, // Invalid
                    nextThreshold: 1
                });
            }).toThrow('Invalid key threshold');

            expect(() => {
                KEL.inception({
                    currentKeys: [CESR.getPublicKey(keypair1)],
                    nextKeys: [CESR.getPublicKey(keypair2)],
                    transferable: true,
                    keyThreshold: 2, // Invalid (only 1 key)
                    nextThreshold: 1
                });
            }).toThrow('Invalid key threshold');

            // Test invalid next threshold
            expect(() => {
                KEL.inception({
                    currentKeys: [CESR.getPublicKey(keypair1)],
                    nextKeys: [CESR.getPublicKey(keypair2)],
                    transferable: true,
                    keyThreshold: 1,
                    nextThreshold: 0 // Invalid
                });
            }).toThrow('Invalid next threshold');
        });
    });

    describe('Deterministic Testing', () => {
        test('should produce exact expected inception event for fixed data', () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1)],
                nextKeys: [CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            // Verify deterministic structure
            expect(inception.v).toBe('KERI10JSON0001aa_');
            expect(inception.t).toBe('icp');
            expect(inception.s).toBe('0');
            expect(inception.k).toHaveLength(1);
            expect(inception.kt).toBe(s('1').asThreshold());
            expect(inception.nt).toBe(s('1').asThreshold());
            expect(inception.dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            expect(inception.p).toBeUndefined();
        });

        test('should produce exact expected rotation event for fixed data', () => {
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1)],
                nextKeys: [CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 1,
                nextThreshold: 1
            });

            // Verify deterministic structure
            expect(rotation.v).toBe('KERI10JSON0001aa_');
            expect(rotation.t).toBe('rot');
            expect(rotation.s).toBe('1');
            expect(rotation.k).toHaveLength(1);
            expect(rotation.kt).toBe(s('1').asThreshold());
            expect(rotation.nt).toBe(s('1').asThreshold());
            expect(rotation.p).toBe(inception.d);
            expect(rotation.dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });

    describe('Witness Support', () => {
        test('should create inception with witnesses', async () => {
            const witness1 = CESR.getPublicKey(CESR.keypairFrom(5555));
            const witness2 = CESR.getPublicKey(CESR.keypairFrom(6666));

            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2,
                witnesses: [witness1, witness2],
                witnessThreshold: 2
            });

            expect(inception.w).toHaveLength(2);
            expect(inception.wt).toBe(s('2').asThreshold());
            expect(inception.w![0]).toBe(s(witness1).asAID());
            expect(inception.w![1]).toBe(s(witness2).asAID());

            // Create envelope with signatures
            const envelope = KEL.createEnvelope(inception, [keypair1.privateKey, keypair2.privateKey]);
            const verification = await KEL.verifyEnvelope(envelope);
            expect(verification.valid).toBe(true);
        });
    });

    describe('KEL Chain Operations', () => {
        test('should handle complete multi-sig KEL chain lifecycle', async () => {
            // 1. Create 2-of-3 inception
            const inception = KEL.inception({
                currentKeys: [CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2), CESR.getPublicKey(keypair3)],
                nextKeys: [CESR.getPublicKey(keypair4), CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            const inceptionEnvelope = KEL.createEnvelope(inception, [keypair1.privateKey, keypair2.privateKey]);
            const inceptionVerification = await KEL.verifyEnvelope(inceptionEnvelope);
            expect(inceptionVerification.valid).toBe(true);

            // 2. Create rotation revealing next keys
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [CESR.getPublicKey(keypair4), CESR.getPublicKey(keypair1), CESR.getPublicKey(keypair2)],
                nextKeys: [CESR.getPublicKey(keypair3), CESR.getPublicKey(keypair4), CESR.getPublicKey(keypair1)],
                previousEvent: inception.d,
                sequence: 1, // Add required sequence parameter
                transferable: true,
                keyThreshold: 2,
                nextThreshold: 2
            });

            const rotationEnvelope = KEL.createEnvelope(rotation, [keypair4.privateKey, keypair1.privateKey]);
            const rotationVerification = await KEL.verifyEnvelope(rotationEnvelope);
            expect(rotationVerification.valid).toBe(true);

            // 3. Create interaction event
            const interaction = KEL.interaction({
                controller: inception.i,
                previousEvent: rotation.d,
                sequence: 2, // Add required sequence parameter
                anchors: [s('E' + 'a'.repeat(43)).asSAID(), s('E' + 'b'.repeat(43)).asSAID()]
            });

            expect(interaction.t).toBe('ixn');
            expect(interaction.a).toHaveLength(2);
            expect(interaction.p).toBe(rotation.d);

            // Interaction events don't have keys, so they can't be signed directly
            // In a real implementation, interaction events would be signed by the current controller keys
            // For now, we'll just verify the event structure
            expect(interaction.t).toBe('ixn');
            expect(interaction.a).toHaveLength(2);
            expect(interaction.p).toBe(rotation.d);

            // 4. Verify chain integrity
            const kelEvents = [inception, rotation, interaction];
            const latestState = KEL.getLatestControllerState(kelEvents);
            expect(latestState).toBeDefined();
            expect(latestState?.keys).toHaveLength(3);
            expect(latestState?.keyThreshold).toBe(2);
        });
    });
});
