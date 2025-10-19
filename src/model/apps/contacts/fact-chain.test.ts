/**
 * Tests for FactChain API (TDD)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { ContactDetails, FactChain, Fact, AID, SAID } from './types';
import { createSocialNetwork } from './social-network';

describe('FactChain API', () => {
    let details: ContactDetails;
    const contactId = 'alice-aid' as AID;

    beforeEach(async () => {
        const api = createSocialNetwork();
        // Add contact first
        await api.contacts.add({ id: contactId, name: 'Alice' });
        details = await api.details(contactId);
    });

    describe('createFactChain', () => {
        it('should create a fact chain for a contact', async () => {
            const chainInfo = await details.createFactChain('profile');

            expect(chainInfo.id).toBeDefined();
            expect(chainInfo.label).toBe('profile');
            expect(chainInfo.contactId).toBe(contactId);
        });

        it('should list created fact chains', async () => {
            await details.createFactChain('profile');
            await details.createFactChain('contact-details');

            const chains = await details.listFactChains();

            expect(chains).toHaveLength(2);
            expect(chains.map(c => c.label)).toContain('profile');
            expect(chains.map(c => c.label)).toContain('contact-details');
        });
    });

    describe('getFactChain', () => {
        it('should retrieve a fact chain by id', async () => {
            const chainInfo = await details.createFactChain('profile');
            const chain = await details.getFactChain(chainInfo.id);

            expect(chain.info).toEqual(chainInfo);
        });
    });

    describe('addFact', () => {
        it('should add a fact to a chain', async () => {
            const chainInfo = await details.createFactChain('profile');
            const chain = await details.getFactChain(chainInfo.id);

            const fact: Fact<{ fullName: string }> = {
                id: 'fact-1' as SAID,
                schemaId: 'schema-profile' as SAID,
                label: 'profile.name',
                data: { fullName: 'Alice Johnson' },
                createdAt: new Date().toISOString(),
            };

            await chain.addFact(fact);

            const retrieved = await chain.getFact(fact.id);
            expect(retrieved).toEqual(fact);
        });

        it('should list all facts in chain', async () => {
            const chainInfo = await details.createFactChain('emails');
            const chain = await details.getFactChain(chainInfo.id);

            const fact1: Fact<{ email: string }> = {
                id: 'fact-1' as SAID,
                schemaId: 'schema-email' as SAID,
                label: 'email.home',
                data: { email: 'alice@home.com' },
                createdAt: new Date().toISOString(),
            };

            const fact2: Fact<{ email: string }> = {
                id: 'fact-2' as SAID,
                schemaId: 'schema-email' as SAID,
                label: 'email.work',
                data: { email: 'alice@work.com' },
                createdAt: new Date().toISOString(),
            };

            await chain.addFact(fact1);
            await chain.addFact(fact2);

            const facts = await chain.listFacts();
            expect(facts).toHaveLength(2);
            expect(facts).toContainEqual(fact1);
            expect(facts).toContainEqual(fact2);
        });
    });

    describe('removeFact', () => {
        it('should remove a fact from chain (tombstone)', async () => {
            const chainInfo = await details.createFactChain('profile');
            const chain = await details.getFactChain(chainInfo.id);

            const fact: Fact = {
                id: 'fact-1' as SAID,
                schemaId: 'schema-1' as SAID,
                label: 'test',
                data: { value: 'test' },
                createdAt: new Date().toISOString(),
            };

            await chain.addFact(fact);
            await chain.removeFact(fact.id);

            const retrieved = await chain.getFact(fact.id);
            expect(retrieved).toBeUndefined();
        });

        it('should not list removed facts', async () => {
            const chainInfo = await details.createFactChain('data');
            const chain = await details.getFactChain(chainInfo.id);

            const fact1: Fact = {
                id: 'fact-1' as SAID,
                schemaId: 'schema-1' as SAID,
                label: 'test1',
                data: { value: 'test1' },
                createdAt: new Date().toISOString(),
            };

            const fact2: Fact = {
                id: 'fact-2' as SAID,
                schemaId: 'schema-1' as SAID,
                label: 'test2',
                data: { value: 'test2' },
                createdAt: new Date().toISOString(),
            };

            await chain.addFact(fact1);
            await chain.addFact(fact2);
            await chain.removeFact(fact1.id);

            const facts = await chain.listFacts();
            expect(facts).toHaveLength(1);
            expect(facts[0]).toEqual(fact2);
        });
    });

    describe('getFactsForSchema', () => {
        it('should filter facts by schema id', async () => {
            const chainInfo = await details.createFactChain('mixed');
            const chain = await details.getFactChain(chainInfo.id);

            const emailFact: Fact = {
                id: 'fact-1' as SAID,
                schemaId: 'schema-email' as SAID,
                label: 'email',
                data: { email: 'test@example.com' },
                createdAt: new Date().toISOString(),
            };

            const phoneFact: Fact = {
                id: 'fact-2' as SAID,
                schemaId: 'schema-phone' as SAID,
                label: 'phone',
                data: { phone: '555-1234' },
                createdAt: new Date().toISOString(),
            };

            const emailFact2: Fact = {
                id: 'fact-3' as SAID,
                schemaId: 'schema-email' as SAID,
                label: 'email.work',
                data: { email: 'work@example.com' },
                createdAt: new Date().toISOString(),
            };

            await chain.addFact(emailFact);
            await chain.addFact(phoneFact);
            await chain.addFact(emailFact2);

            const emailFacts = await chain.getFactsForSchema('schema-email' as SAID);
            expect(emailFacts).toHaveLength(2);
            expect(emailFacts).toContainEqual(emailFact);
            expect(emailFacts).toContainEqual(emailFact2);
        });
    });
});
