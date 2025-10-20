/**
 * Tests for KelApi.getEventProof() method
 */

import { describe, it, expect } from 'bun:test';
import { KelStores } from './api';
import { KEL } from './kel-ops';
import { CESR } from '../cesr/cesr';

describe('KelApi.getEventProof()', () => {

    it('should get event proof for inception event', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account
        const account = await api.createAccount({
            alias: 'test-proof',
            currentKeySpec: 50000,
            nextKeySpec: 51000,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Get the proof for the inception event
        const proof = await api.getEventProof(account.latestEvent);

        expect(proof).toBeTruthy();
        expect(proof!.said).toBe(account.latestEvent);
        expect(proof!.eventCesr).toBeTruthy();
        expect(proof!.event.t).toBe('icp');
        expect(proof!.signers).toHaveLength(1);
        expect(proof!.signers[0].signerSet.kind).toBe('current');
    });

    it('should get event proof for rotation event', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account
        const account = await api.createAccount({
            alias: 'test-rotation',
            currentKeySpec: 52000,
            nextKeySpec: 53000,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Rotate keys
        const rotated = await api.rotateKeys({
            aid: account.aid,
            nextKeySpec: 54000,
            timestamp: '2024-01-02T00:00:00.000Z'
        });

        // Get the proof for the rotation event
        const proof = await api.getEventProof(rotated.latestEvent);

        expect(proof).toBeTruthy();
        expect(proof!.said).toBe(rotated.latestEvent);
        expect(proof!.event.t).toBe('rot');
        expect(proof!.signers).toHaveLength(1);
        expect(proof!.signers[0].signerSet.kind).toBe('prior');
        expect(proof!.signers[0].signerSet.sn).toBe(0);
    });

    it('should return null for non-existent event', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        const proof = await api.getEventProof('ENonExistentSAID');

        expect(proof).toBeNull();
    });

    it('should generate verifiable proof', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account
        const account = await api.createAccount({
            alias: 'test-verify',
            currentKeySpec: 55000,
            nextKeySpec: 56000,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Get the proof
        const proof = await api.getEventProof(account.latestEvent);
        expect(proof).toBeTruthy();

        // Verify the proof using KEL.verifyEventProof
        const result = await KEL.verifyEventProof(proof!);

        expect(result.saidMatches).toBe(true);
        expect(result.signaturesValid).toBe(true);
        expect(result.validCount).toBe(1);
        expect(result.failures).toBeUndefined();
    });

    it('should generate proof that can be transported and verified', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account with rotation
        const account = await api.createAccount({
            alias: 'test-transport',
            currentKeySpec: 57000,
            nextKeySpec: 58000,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        const rotated = await api.rotateKeys({
            aid: account.aid,
            nextKeySpec: 59000,
            timestamp: '2024-01-02T00:00:00.000Z'
        });

        // Get proof for rotation
        const proof = await api.getEventProof(rotated.latestEvent);
        expect(proof).toBeTruthy();

        // Simulate transport via JSON serialization
        const transported = JSON.parse(JSON.stringify(proof));

        // Verify the transported proof
        const result = await KEL.verifyEventProof(transported);

        expect(result.saidMatches).toBe(true);
        expect(result.signaturesValid).toBe(true);
    });

    it('should include eventCesr in proof from createEnvelope', async () => {
        const stores = KelStores.inMemory();
        const api = KelStores.ops(stores);

        // Create an account
        const account = await api.createAccount({
            alias: 'test-cesr',
            currentKeySpec: 60000,
            nextKeySpec: 61000,
            timestamp: '2024-01-01T00:00:00.000Z'
        });

        // Get the proof
        const proof = await api.getEventProof(account.latestEvent);

        expect(proof).toBeTruthy();
        expect(proof!.eventCesr).toBeTruthy();

        // Verify eventCesr can be decoded
        const raw = CESR.fromQB64(proof!.eventCesr);
        expect(raw).toBeInstanceOf(Uint8Array);
        expect(raw.length).toBeGreaterThan(0);

        // Verify SAID can be recomputed
        const recomputedSAID = KEL.computeSAID(raw);
        expect(recomputedSAID).toMatch(/^E[A-Za-z0-9_-]{43}$/);
    });
});
