/**
 * Tests for KEL proof generation and verification
 *
 * Tests the complete flow of:
 * - Creating event proofs with getEventProof()
 * - Verifying event proofs with verifyEventProof()
 * - Round-trip proof workflows
 */

import { describe, it, expect } from 'bun:test';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';
import type { EventProof } from './types';

describe('KEL Proof Generation and Verification', () => {

    describe('KEL.getEventProof()', () => {
        it('should generate proof for inception event', () => {
            const currentKp = CESR.keypairFrom(1000);
            const nextKp = CESR.keypairFrom(2000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);
            const proof = KEL.getEventProof(envelope);

            expect(proof.said).toBe(event.d);
            expect(proof.eventCesr).toBeTruthy();
            expect(proof.event).toEqual(event);
            expect(proof.signers).toHaveLength(1);
            expect(proof.signers[0].keyIndex).toBe(0);
            expect(proof.signers[0].publicKey).toBe(currentKp.verfer);
            expect(proof.signers[0].signerSet.kind).toBe('current');
        });

        it('should generate proof for rotation event', () => {
            const kp1 = CESR.keypairFrom(3000);
            const kp2 = CESR.keypairFrom(4000);
            const kp3 = CESR.keypairFrom(5000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // Inception
            const inception = KEL.inception({
                currentKeys: [kp1.verfer],
                nextKeys: [kp2.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // Rotation
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [kp2.verfer],
                nextKeys: [kp3.verfer],
                previousEvent: inception.d,
                sequence: 1,
                transferable: true,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(rotation, [kp1.privateKey]);
            const proof = KEL.getEventProof(envelope, inception);

            expect(proof.said).toBe(rotation.d);
            expect(proof.eventCesr).toBeTruthy();
            expect(proof.signers).toHaveLength(1);
            expect(proof.signers[0].publicKey).toBe(kp1.verfer); // Prior key
            expect(proof.signers[0].signerSet.kind).toBe('prior');
            expect(proof.signers[0].signerSet.sn).toBe(0);
        });

        it('should generate proof for interaction event', () => {
            const currentKp = CESR.keypairFrom(6000);
            const nextKp = CESR.keypairFrom(7000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // Inception
            const inception = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // Interaction
            const interaction = KEL.interaction({
                controller: inception.i,
                previousEvent: inception.d,
                sequence: 1,
                anchors: ['EAnchor1', 'EAnchor2'],
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(interaction, [currentKp.privateKey]);
            const proof = KEL.getEventProof(envelope, inception);

            expect(proof.said).toBe(interaction.d);
            expect(proof.signers).toHaveLength(1);
            expect(proof.signers[0].publicKey).toBe(currentKp.verfer);
            expect(proof.signers[0].signerSet.kind).toBe('prior');
        });

        it('should throw error for rotation without prior event', () => {
            const kp1 = CESR.keypairFrom(8000);
            const kp2 = CESR.keypairFrom(9000);

            const rotation = KEL.rotation({
                controller: 'DAnyAID',
                currentKeys: [kp2.verfer],
                nextKeys: [kp1.verfer],
                previousEvent: 'EPriorSAID',
                sequence: 1,
                transferable: true
            });

            const envelope = KEL.createEnvelope(rotation, [kp1.privateKey]);

            expect(() => KEL.getEventProof(envelope)).toThrow('Rotation events require prior event');
        });
    });

    describe('KEL.verifyEventProof()', () => {
        it('should verify valid inception proof', async () => {
            const currentKp = CESR.keypairFrom(10000);
            const nextKp = CESR.keypairFrom(11000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);
            const proof = KEL.getEventProof(envelope);

            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(true);
            expect(result.validCount).toBe(1);
            expect(result.requiredCount).toBe(1);
            expect(result.failures).toBeUndefined();
        });

        it('should verify valid rotation proof', async () => {
            const kp1 = CESR.keypairFrom(12000);
            const kp2 = CESR.keypairFrom(13000);
            const kp3 = CESR.keypairFrom(14000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const inception = KEL.inception({
                currentKeys: [kp1.verfer],
                nextKeys: [kp2.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [kp2.verfer],
                nextKeys: [kp3.verfer],
                previousEvent: inception.d,
                sequence: 1,
                transferable: true,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(rotation, [kp1.privateKey]);
            const proof = KEL.getEventProof(envelope, inception);

            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(true);
            expect(result.validCount).toBe(1);
        });

        it('should detect invalid signature', async () => {
            const currentKp = CESR.keypairFrom(15000);
            const nextKp = CESR.keypairFrom(16000);
            const wrongKp = CESR.keypairFrom(99999);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // Sign with wrong key
            const envelope = KEL.createEnvelope(event, [wrongKp.privateKey]);

            // But claim it's signed by currentKp
            const proof: EventProof = {
                said: event.d,
                eventCesr: KEL.serialize(event).qb64,
                event,
                signers: [{
                    keyIndex: 0,
                    signerSet: { kind: 'current', sn: 0 },
                    signature: envelope.signatures[0].sig,
                    publicKey: currentKp.verfer, // Wrong public key
                    signerAid: event.i
                }]
            };

            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(false);
            expect(result.validCount).toBe(0);
            expect(result.failures).toBeDefined();
            expect(result.failures?.length).toBeGreaterThan(0);
        });

        it('should handle multi-sig inception', async () => {
            const kp1 = CESR.keypairFrom(17000);
            const kp2 = CESR.keypairFrom(18000);
            const nextKp = CESR.keypairFrom(19000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [kp1.verfer, kp2.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                keyThreshold: 2,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(event, [kp1.privateKey, kp2.privateKey]);
            const proof = KEL.getEventProof(envelope);

            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(true);
            expect(result.validCount).toBe(2);
            expect(result.requiredCount).toBe(2);
        });

        it('should reject insufficient signatures in multi-sig', async () => {
            const kp1 = CESR.keypairFrom(20000);
            const kp2 = CESR.keypairFrom(21000);
            const nextKp = CESR.keypairFrom(22000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            const event = KEL.inception({
                currentKeys: [kp1.verfer, kp2.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                keyThreshold: 2,
                currentTime: fixedTime
            });

            // Only sign with one key
            const envelope = KEL.createEnvelope(event, [kp1.privateKey]);
            const proof = KEL.getEventProof(envelope);

            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(false);
            expect(result.validCount).toBe(1);
            expect(result.requiredCount).toBe(2);
            expect(result.failures).toContain('Insufficient signatures: 1/2');
        });
    });

    describe('End-to-end proof workflows', () => {
        it('should complete full proof generation and verification for inception', async () => {
            const currentKp = CESR.keypairFrom(23000);
            const nextKp = CESR.keypairFrom(24000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // 1. Create event
            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            // 2. Create envelope (automatically includes eventCesr)
            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);

            // 3. Verify envelope has eventCesr
            expect(envelope.eventCesr).toBeTruthy();
            expect(envelope.event).toEqual(event);
            expect(envelope.signatures).toHaveLength(1);

            // 4. Generate proof
            const proof = KEL.getEventProof(envelope);

            // 5. Verify proof
            const result = await KEL.verifyEventProof(proof);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(true);
            expect(result.failures).toBeUndefined();
        });

        it('should complete full proof workflow for rotation chain', async () => {
            const kp1 = CESR.keypairFrom(25000);
            const kp2 = CESR.keypairFrom(26000);
            const kp3 = CESR.keypairFrom(27000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // 1. Inception
            const inception = KEL.inception({
                currentKeys: [kp1.verfer],
                nextKeys: [kp2.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const inceptionEnv = KEL.createEnvelope(inception, [kp1.privateKey]);
            const inceptionProof = KEL.getEventProof(inceptionEnv);
            const inceptionResult = await KEL.verifyEventProof(inceptionProof);

            expect(inceptionResult.saidMatches).toBe(true);
            expect(inceptionResult.signaturesValid).toBe(true);

            // 2. Rotation
            const rotation = KEL.rotation({
                controller: inception.i,
                currentKeys: [kp2.verfer],
                nextKeys: [kp3.verfer],
                previousEvent: inception.d,
                sequence: 1,
                transferable: true,
                currentTime: fixedTime
            });

            const rotationEnv = KEL.createEnvelope(rotation, [kp1.privateKey]);
            const rotationProof = KEL.getEventProof(rotationEnv, inception);
            const rotationResult = await KEL.verifyEventProof(rotationProof);

            expect(rotationResult.saidMatches).toBe(true);
            expect(rotationResult.signaturesValid).toBe(true);

            // Verify signerSet references
            expect(rotationProof.signers[0].signerSet.kind).toBe('prior');
            expect(rotationProof.signers[0].publicKey).toBe(kp1.verfer);
        });

        it('should transport proof and verify remotely', async () => {
            const currentKp = CESR.keypairFrom(28000);
            const nextKp = CESR.keypairFrom(29000);
            const fixedTime = '2024-01-01T00:00:00.000Z';

            // Local: Create and sign event
            const event = KEL.inception({
                currentKeys: [currentKp.verfer],
                nextKeys: [nextKp.verfer],
                transferable: true,
                currentTime: fixedTime
            });

            const envelope = KEL.createEnvelope(event, [currentKp.privateKey]);
            const proof = KEL.getEventProof(envelope);

            // Simulate serialization for transport
            const serialized = JSON.stringify(proof);
            const transported: EventProof = JSON.parse(serialized);

            // Remote: Verify without access to private keys
            const result = await KEL.verifyEventProof(transported);

            expect(result.saidMatches).toBe(true);
            expect(result.signaturesValid).toBe(true);
            expect(result.validCount).toBeGreaterThan(0);
        });
    });
});
