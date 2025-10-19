/**
 * Tests for SocialNetworkApi facade and schemas
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { SocialNetworkApi, Schema, SAID } from './types';
import { createSocialNetwork } from './social-network';

describe('SocialNetworkApi', () => {
    let api: SocialNetworkApi;

    beforeEach(() => {
        api = createSocialNetwork();
    });

    describe('schemas', () => {
        it('should add and retrieve schema', async () => {
            const schema: Schema = {
                id: 'schema-email' as SAID,
                title: 'Email Address',
                description: 'A valid email address',
            };

            await api.schemas.add(schema);
            const retrieved = await api.schemas.get(schema.id);

            expect(retrieved).toEqual(schema);
        });

        it('should list all schemas', async () => {
            const schema1: Schema = {
                id: 'schema-1' as SAID,
                title: 'Schema 1',
            };

            const schema2: Schema = {
                id: 'schema-2' as SAID,
                title: 'Schema 2',
            };

            await api.schemas.add(schema1);
            await api.schemas.add(schema2);

            const all = await api.schemas.list();
            expect(all).toHaveLength(2);
            expect(all).toContainEqual(schema1);
            expect(all).toContainEqual(schema2);
        });
    });

    describe('graph export', () => {
        it('should export contact nodes', async () => {
            await api.contacts.add({ id: 'alice-aid' as any, name: 'Alice' });
            await api.contacts.add({ id: 'bob-aid' as any, name: 'Bob' });

            const nodes = await api.graph.nodes();

            expect(nodes).toHaveLength(2);
            expect(nodes).toContainEqual({
                type: 'contact',
                id: 'alice-aid',
                label: 'Alice',
            });
            expect(nodes).toContainEqual({
                type: 'contact',
                id: 'bob-aid',
                label: 'Bob',
            });
        });

        it('should export group nodes', async () => {
            await api.groups.save({
                id: 'group-1' as SAID,
                name: 'Friends',
                members: [],
            });

            const nodes = await api.graph.nodes();

            expect(nodes).toContainEqual({
                type: 'group',
                id: 'group-1',
                label: 'Friends',
            });
        });

        it('should export memberOf edges', async () => {
            await api.contacts.add({ id: 'alice-aid' as any, name: 'Alice' });
            await api.groups.save({
                id: 'group-1' as SAID,
                name: 'Friends',
                members: ['alice-aid' as any],
            });

            const edges = await api.graph.edges();

            expect(edges).toContainEqual({
                type: 'memberOf',
                from: 'alice-aid',
                to: 'group-1',
            });
        });

        it('should export childOf edges', async () => {
            await api.groups.save({
                id: 'parent' as SAID,
                name: 'Parent',
                members: [],
            });

            await api.groups.save({
                id: 'child' as SAID,
                name: 'Child',
                parentGroup: 'parent' as SAID,
                members: [],
            });

            const edges = await api.graph.edges();

            expect(edges).toContainEqual({
                type: 'childOf',
                from: 'child',
                to: 'parent',
            });
        });

        it('should export hasFact edges', async () => {
            await api.contacts.add({ id: 'alice-aid' as any, name: 'Alice' });

            const details = await api.details('alice-aid' as any);
            const chainInfo = await details.createFactChain('profile');
            const chain = await details.getFactChain(chainInfo.id);

            await chain.addFact({
                id: 'fact-1' as SAID,
                schemaId: 'schema-1' as SAID,
                label: 'email',
                data: { email: 'alice@example.com' },
                createdAt: new Date().toISOString(),
            });

            const edges = await api.graph.edges();

            expect(edges).toContainEqual({
                type: 'hasFact',
                from: 'alice-aid',
                to: 'fact-1',
            });
        });
    });
});
