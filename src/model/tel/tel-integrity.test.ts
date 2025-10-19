/**
 * TEL Integrity Tests
 * 
 * This test suite demonstrates the security guarantees of our TEL implementation
 * by showing how tampering attempts are detected and reported.
 */

import { describe, expect, test, beforeEach } from 'bun:test';
import { TEL } from './tel-ops';
import { KEL } from '../kel/kel-ops';
import { CESR } from '../cesr/cesr';
import { s } from '../string-ops';
import type { AID, SAID } from '../types';
import type { TelEvent, TelEnvelope, CESRSignature } from './types';
import type { KelControllerState } from '../kel/kel-ops';

describe('TEL Integrity Guarantees', () => {
    // Helper function to create a complete test setup
    function createTestSetup() {
        // Create deterministic keypairs for KEL
        const currentKeypair = CESR.keypairFrom(1111);
        const nextKeypair = CESR.keypairFrom(2222);

        // Create KEL inception event
        const kelInception = KEL.inception({
            currentKeys: [currentKeypair.verfer],
            nextKeys: [nextKeypair.verfer],
            transferable: true
        });

        // Extract controller state from KEL
        const controllerState = KEL.extractControllerState(kelInception);

        // Create TEL anchors from KEL events
        const testAnchors: SAID[] = [kelInception.d];

        // Create TEL inception event
        const telEvent = TEL.inception({
            aid: controllerState.aid,
            eventData: {
                profile: {
                    name: 'Alice',
                    bio: 'Test user',
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z'
                }
            },
            anchors: testAnchors
        });

        // Create TEL envelope with signatures
        const telEnvelope = TEL.createEnvelope(telEvent, controllerState, [currentKeypair.privateKey]);

        return {
            kelInception,
            controllerState,
            testAnchors,
            telEvent,
            telEnvelope,
            privateKey: currentKeypair.privateKey,
            publicKey: currentKeypair.verfer,
            keypair: currentKeypair
        };
    }

    describe('Event Data Visibility', () => {
        test('should provide comprehensive event inspection capabilities', () => {
            const setup = createTestSetup();
            const history = TEL.createEventHistory([setup.telEvent], [setup.telEnvelope]);
            const entry = history[0];
            expect(entry).toBeDefined();

            // Verify we can see all critical data
            expect(entry!.event).toEqual(setup.telEvent);
            expect(entry!.said).toBe(setup.telEvent.d);
            expect(entry!.signatures).toBeDefined();
            expect(entry!.signatures).toHaveLength(1);
            expect(entry!.rawEvent).toContain('"t": "tcp"');
            expect(entry!.anchors).toHaveLength(1);

            // Verify signature details
            const signature = entry!.signatures![0];
            expect(signature).toBeDefined();
            expect(signature!.keyIndex).toBe(0);
            expect(signature!.publicKey).toBe(setup.publicKey);
            expect(signature!.signature).toMatch(/^[A-Za-z0-9_-]+$/);

            // Verify raw event contains all expected fields
            const rawEventObj = JSON.parse(entry!.rawEvent);
            expect(rawEventObj.v).toBe('KERI10JSON0001aa_');
            expect(rawEventObj.t).toBe('tcp');
            expect(rawEventObj.i).toBe(setup.controllerState.aid);
            expect(rawEventObj.s).toBe('0');
            expect(rawEventObj.a).toEqual(setup.testAnchors);
            expect(rawEventObj.e).toEqual(setup.telEvent.e);
            expect(rawEventObj.dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });

        test('should show CESR encoding details', () => {
            const setup = createTestSetup();
            const history = TEL.createEventHistory([setup.telEvent], [setup.telEnvelope]);
            const entry = history[0];
            expect(entry).toBeDefined();

            // Verify SAID format (CESR-encoded BLAKE3 hash)
            expect(entry!.said).toMatch(/^E[A-Za-z0-9_-]{43}$/);

            // Verify signature format (CESR-encoded signature)
            const signature = entry!.signatures![0];
            expect(signature).toBeDefined();
            expect(signature!.signature).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(signature!.publicKey).toMatch(/^[A-Za-z0-9_-]+$/);

            // Verify we can reconstruct the event from raw data
            const reconstructedEvent = JSON.parse(entry!.rawEvent);
            expect(reconstructedEvent.d).toBe(entry!.said);
        });
    });

    describe('Data Tampering Detection', () => {
        test('should detect event data modification via SAID mismatch', () => {
            const setup = createTestSetup();

            // Create a tampered event by modifying the profile data
            const tamperedEvent: TelEvent = {
                ...setup.telEvent,
                e: {
                    profile: {
                        name: 'Eve', // Changed from 'Alice'
                        bio: 'Malicious user',
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: '2024-01-01T00:00:00Z'
                    }
                }
            };

            // Verify SAID validation fails
            const saidResult = TEL.verifyEventDetailed(tamperedEvent, 0);
            expect(saidResult.valid).toBe(false);
            expect(saidResult.error).toBeDefined();
            expect(saidResult.error?.type).toBe('invalid_said');
            const error = saidResult.error as any;
            expect(error?.eventSaid).toBe(tamperedEvent.d);
            expect(error?.expectedSaid).not.toBe(tamperedEvent.d);
        });

        test('should detect timestamp modification', () => {
            const setup = createTestSetup();

            const tamperedEvent: TelEvent = {
                ...setup.telEvent,
                dt: '2024-12-31T23:59:59.999Z' // Changed timestamp
            };

            const saidResult = TEL.verifyEventDetailed(tamperedEvent, 0);
            expect(saidResult.valid).toBe(false);
            expect(saidResult.error?.type).toBe('invalid_said');
        });

        test('should detect anchor modification', () => {
            const setup = createTestSetup();

            const tamperedEvent: TelEvent = {
                ...setup.telEvent,
                a: [s('E' + 'x'.repeat(43)).asSAID()] // Changed anchors
            };

            const saidResult = TEL.verifyEventDetailed(tamperedEvent, 0);
            expect(saidResult.valid).toBe(false);
            expect(saidResult.error?.type).toBe('invalid_said');
        });

        test('should detect sequence number modification', () => {
            const setup = createTestSetup();

            const tamperedEvent: TelEvent = {
                ...setup.telEvent,
                s: '1' // Changed from '0'
            };

            const saidResult = TEL.verifyEventDetailed(tamperedEvent, 0);
            expect(saidResult.valid).toBe(false);
            expect(saidResult.error?.type).toBe('invalid_said');
        });
    });

    describe('Signature Tampering Detection', () => {
        test('should detect signature modification', async () => {
            // CESR signature verification is now working
            const setup = createTestSetup();

            const tamperedEnvelope: TelEnvelope = {
                event: setup.telEvent,
                signatures: [{
                    signature: '0' + 'x'.repeat(87), // Invalid signature
                    keyIndex: 0,
                    publicKey: setup.publicKey
                }]
            };

            const verification = await TEL.verifyEnvelope(tamperedEnvelope, setup.controllerState, [setup.keypair]);
            expect(verification.valid).toBe(false);
            expect(verification.validSignatures).toBe(0);
            expect(verification.requiredSignatures).toBe(1);
            expect(verification.signatureResults[0]?.valid).toBe(false);
        });

        test('should detect public key modification', async () => {
            // CESR signature verification is now working
            const setup = createTestSetup();

            const tamperedEnvelope: TelEnvelope = {
                event: setup.telEvent,
                signatures: [{
                    signature: setup.telEnvelope.signatures[0]?.signature || '',
                    keyIndex: 0,
                    publicKey: 'E' + 'y'.repeat(43) // Wrong public key
                }]
            };

            const verification = await TEL.verifyEnvelope(tamperedEnvelope, setup.controllerState, [setup.keypair]);
            expect(verification.valid).toBe(false);
            expect(verification.signatureResults[0]?.valid).toBe(false);
        });

        test('should detect insufficient signatures for threshold', async () => {
            const setup = createTestSetup();

            // Create a controller state that requires 2 signatures
            const highThresholdState: KelControllerState = {
                ...setup.controllerState,
                keyThreshold: 2 // Require 2 signatures
            };

            const verification = await TEL.verifyEnvelope(setup.telEnvelope, highThresholdState, [setup.keypair]);
            expect(verification.valid).toBe(false);
            expect(verification.validSignatures).toBe(1);
            expect(verification.requiredSignatures).toBe(2);
        });

        test('should detect wrong controller state', async () => {
            const setup = createTestSetup();

            // Create a different controller state with different keys
            const wrongControllerState: KelControllerState = {
                aid: setup.controllerState.aid,
                keys: ['E' + 'z'.repeat(43)], // Different keys
                keyThreshold: 1,
                sequence: 0,
                active: true
            };

            const verification = await TEL.verifyEnvelope(setup.telEnvelope, wrongControllerState, [setup.keypair]);
            expect(verification.valid).toBe(false);
            expect(verification.signatureResults[0]?.valid).toBe(false);
        });
    });

    describe('Chain Integrity Detection', () => {
        test('should detect sequence number tampering in chain', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: inception.d,
                eventData: { name: 'Updated' },
                anchors: setup.testAnchors,
                sequence: 1
            });

            // Tamper with sequence number
            const tamperedTransaction: TelEvent = {
                ...transaction,
                s: '2' // Wrong sequence number
            };

            const events = [inception, tamperedTransaction];
            const result = TEL.verifyChainDetailed(events);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
            const seqError = result.errors.find(e => e.type === 'invalid_sequence');
            expect(seqError).toBeDefined();
            expect(seqError?.eventIndex).toBe(1);
            expect(seqError?.expectedSeq).toBe(1);
            expect(seqError?.actualSeq).toBe(2);
        });

        test('should detect previous event reference tampering', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: inception.d,
                eventData: { name: 'Updated' },
                anchors: setup.testAnchors,
                sequence: 1
            });

            // Tamper with previous event reference
            const tamperedTransaction: TelEvent = {
                ...transaction,
                p: s('E' + 'x'.repeat(43)).asSAID() // Wrong previous event
            };

            const events = [inception, tamperedTransaction];
            const result = TEL.verifyChainDetailed(events);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
            const prevError = result.errors.find(e => e.type === 'invalid_previous_reference');
            expect(prevError).toBeDefined();
            expect(prevError?.eventIndex).toBe(1);
            expect(prevError?.expectedPrevious).toBe(inception.d);
            expect(prevError?.actualPrevious).toBe(s('E' + 'x'.repeat(43)).asSAID());
        });

        test('should detect missing inception event', () => {
            const setup = createTestSetup();

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: s('E' + 'x'.repeat(43)).asSAID(),
                eventData: { name: 'Test' },
                anchors: setup.testAnchors,
                sequence: 0
            });

            const events = [transaction];
            const result = TEL.verifyChainDetailed(events);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
            expect(result.errors.some(e => e.type === 'missing_inception')).toBe(true);
            const error = result.errors[0] as any;
            expect(error?.message).toBe('First event must be a TEL inception event (tcp)');
        });

        test('should detect chain breaks', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: inception.d,
                eventData: { name: 'Updated' },
                anchors: setup.testAnchors,
                sequence: 1
            });

            // Create chain with missing middle event
            const events = [inception, null as any, transaction];
            const result = TEL.verifyChainDetailed(events);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(1);
            expect(result.errors.some(e => e.type === 'chain_break')).toBe(true);
            const error = result.errors[0] as any;
            expect(error?.eventIndex).toBe(1);
            expect(error?.message).toBe('Missing event at index 1');
        });
    });

    describe('Comprehensive Tampering Scenarios', () => {
        test('should detect multiple simultaneous tampering attempts', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            // Create event with multiple tampered fields
            const tamperedEvent: TelEvent = {
                v: 'KERI10JSON0001aa_',
                t: 'txn',
                d: s('E' + 'x'.repeat(43)).asSAID(), // Wrong SAID
                i: setup.controllerState.aid,
                s: '2', // Wrong sequence
                p: s('E' + 'y'.repeat(43)).asSAID(), // Wrong previous event
                a: [s('E' + 'z'.repeat(43)).asSAID()], // Wrong anchors
                e: { name: 'Tampered' }, // Wrong data
                dt: '2024-12-31T23:59:59.999Z' // Wrong timestamp
            };

            const events = [inception, tamperedEvent];
            const result = TEL.verifyChainDetailed(events);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);

            // Should detect multiple types of errors
            const errorTypes = result.errors.map(e => e.type);
            expect(errorTypes).toContain('invalid_said');
            expect(errorTypes).toContain('invalid_sequence');
            expect(errorTypes).toContain('invalid_previous_reference');
        });

        test('should provide detailed error context for debugging', () => {
            const setup = createTestSetup();

            const tamperedEvent: TelEvent = {
                ...setup.telEvent,
                e: { name: 'Eve' } // Tampered data
            };

            const saidResult = TEL.verifyEventDetailed(tamperedEvent, 0);

            expect(saidResult.valid).toBe(false);
            expect(saidResult.error).toBeDefined();

            const error = saidResult.error as any;
            expect(error?.type).toBe('invalid_said');
            expect(error?.eventIndex).toBe(0);
            expect(error?.eventSaid).toBe(tamperedEvent.d);
            expect(error?.expectedSaid).not.toBe(tamperedEvent.d);
            expect(error?.expectedSaid).toMatch(/^E[A-Za-z0-9_-]{43}$/);
        });
    });

    describe('Event History Security', () => {
        test('should maintain integrity of event history', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: inception.d,
                eventData: { name: 'Updated' },
                anchors: setup.testAnchors,
                sequence: 1
            });

            const events = [inception, transaction];
            const history = TEL.createEventHistory(events);

            // Verify each event in history maintains its integrity
            history.forEach((entry, index) => {
                const saidResult = TEL.verifyEventDetailed(entry.event, index);
                expect(saidResult.valid).toBe(true);
                expect(entry.said).toBe(entry.event.d);
                expect(entry.rawEvent).toContain(entry.event.t);
            });

            // Verify chain integrity
            const chainResult = TEL.verifyChainDetailed(events);
            expect(chainResult.valid).toBe(true);
        });

        test('should detect tampering in event history', () => {
            const setup = createTestSetup();

            const inception = TEL.inception({
                aid: setup.controllerState.aid,
                eventData: { name: 'Initial' },
                anchors: setup.testAnchors
            });

            const transaction = TEL.transaction({
                aid: setup.controllerState.aid,
                previousEvent: inception.d,
                eventData: { name: 'Updated' },
                anchors: setup.testAnchors,
                sequence: 1
            });

            // Tamper with one event in the history
            const tamperedTransaction: TelEvent = {
                ...transaction,
                e: { name: 'Tampered' }
            };

            const events = [inception, tamperedTransaction];
            const history = TEL.createEventHistory(events);

            // Verify tampered event is detected
            const tamperedEntry = history[1];
            expect(tamperedEntry).toBeDefined();
            const saidResult = TEL.verifyEventDetailed(tamperedEntry!.event, 1);
            expect(saidResult.valid).toBe(false);
            expect(saidResult.error?.type).toBe('invalid_said');

            // Verify chain validation fails
            const chainResult = TEL.verifyChainDetailed(events);
            expect(chainResult.valid).toBe(false);
        });
    });
});
