/**
 * Tests for Contacts API (TDD)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { Contacts, Contact, AID } from './types';
import { createSocialNetwork } from './social-network';

describe('Contacts API', () => {
    let contacts: Contacts;

    beforeEach(() => {
        const api = createSocialNetwork();
        contacts = api.contacts;
    });

    describe('add and get', () => {
        it('should add a contact and retrieve it by id', async () => {
            const contact: Contact = {
                id: 'alice-aid' as AID,
                name: 'Alice',
            };

            await contacts.add(contact);
            const retrieved = await contacts.get(contact.id);

            expect(retrieved).toEqual(contact);
        });

        it('should return undefined for non-existent contact', async () => {
            const retrieved = await contacts.get('nonexistent' as AID);

            expect(retrieved).toBeUndefined();
        });

        it('should be idempotent when adding same AID', async () => {
            const contact: Contact = {
                id: 'bob-aid' as AID,
                name: 'Bob',
            };

            await contacts.add(contact);
            await contacts.add(contact);

            const all = await contacts.list();
            expect(all).toHaveLength(1);
            expect(all[0]).toEqual(contact);
        });

        it('should update contact when adding with same AID but different data', async () => {
            const contact1: Contact = {
                id: 'charlie-aid' as AID,
                name: 'Charlie',
            };

            const contact2: Contact = {
                id: 'charlie-aid' as AID,
                name: 'Charles',
            };

            await contacts.add(contact1);
            await contacts.add(contact2);

            const retrieved = await contacts.get(contact1.id);
            expect(retrieved?.name).toBe('Charles');
        });
    });

    describe('list', () => {
        it('should return empty array when no contacts', async () => {
            const all = await contacts.list();

            expect(all).toEqual([]);
        });

        it('should list all contacts', async () => {
            const contact1: Contact = { id: 'alice-aid' as AID, name: 'Alice' };
            const contact2: Contact = { id: 'bob-aid' as AID, name: 'Bob' };
            const contact3: Contact = { id: 'charlie-aid' as AID, name: 'Charlie' };

            await contacts.add(contact1);
            await contacts.add(contact2);
            await contacts.add(contact3);

            const all = await contacts.list();

            expect(all).toHaveLength(3);
            expect(all).toContainEqual(contact1);
            expect(all).toContainEqual(contact2);
            expect(all).toContainEqual(contact3);
        });
    });

    describe('remove', () => {
        it('should remove a contact', async () => {
            const contact: Contact = {
                id: 'david-aid' as AID,
                name: 'David',
            };

            await contacts.add(contact);
            await contacts.remove(contact.id);

            const retrieved = await contacts.get(contact.id);
            expect(retrieved).toBeUndefined();
        });

        it('should handle removing non-existent contact gracefully', async () => {
            // Should not throw
            await contacts.remove('nonexistent' as AID);

            const all = await contacts.list();
            expect(all).toEqual([]);
        });

        it('should remove contact from list', async () => {
            const contact1: Contact = { id: 'eve-aid' as AID, name: 'Eve' };
            const contact2: Contact = { id: 'frank-aid' as AID, name: 'Frank' };

            await contacts.add(contact1);
            await contacts.add(contact2);
            await contacts.remove(contact1.id);

            const all = await contacts.list();
            expect(all).toHaveLength(1);
            expect(all[0]).toEqual(contact2);
        });
    });
});
