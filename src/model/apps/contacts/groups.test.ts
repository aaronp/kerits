/**
 * Tests for Groups API (TDD)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import type { Groups, Group, AID, SAID } from './types';
import { createSocialNetwork } from './social-network';

describe('Groups API', () => {
    let groups: Groups;

    beforeEach(() => {
        const api = createSocialNetwork();
        groups = api.groups;
    });

    describe('save and get', () => {
        it('should save a group and retrieve it', async () => {
            const group: Group = {
                id: 'group-1' as SAID,
                name: 'Friends',
                members: ['alice-aid' as AID, 'bob-aid' as AID],
            };

            await groups.save(group);
            const retrieved = await groups.get(group.id);

            expect(retrieved).toEqual(group);
        });

        it('should return undefined for non-existent group', async () => {
            const retrieved = await groups.get('nonexistent' as SAID);

            expect(retrieved).toBeUndefined();
        });

        it('should update group when saving with same id', async () => {
            const group1: Group = {
                id: 'group-2' as SAID,
                name: 'Team A',
                members: ['alice-aid' as AID],
            };

            const group2: Group = {
                id: 'group-2' as SAID,
                name: 'Team Alpha',
                members: ['alice-aid' as AID, 'bob-aid' as AID],
            };

            await groups.save(group1);
            const saved = await groups.save(group2);

            expect(saved).toEqual(group2);

            const retrieved = await groups.get(group1.id);
            expect(retrieved?.name).toBe('Team Alpha');
            expect(retrieved?.members).toHaveLength(2);
        });
    });

    describe('list', () => {
        it('should return empty array when no groups', async () => {
            const all = await groups.list();

            expect(all).toEqual([]);
        });

        it('should list all groups', async () => {
            const group1: Group = {
                id: 'group-1' as SAID,
                name: 'Friends',
                members: ['alice-aid' as AID],
            };

            const group2: Group = {
                id: 'group-2' as SAID,
                name: 'Family',
                members: ['bob-aid' as AID],
            };

            await groups.save(group1);
            await groups.save(group2);

            const all = await groups.list();

            expect(all).toHaveLength(2);
            expect(all).toContainEqual(group1);
            expect(all).toContainEqual(group2);
        });
    });

    describe('remove', () => {
        it('should remove a group', async () => {
            const group: Group = {
                id: 'group-3' as SAID,
                name: 'Coworkers',
                members: [],
            };

            await groups.save(group);
            await groups.remove(group.id);

            const retrieved = await groups.get(group.id);
            expect(retrieved).toBeUndefined();
        });

        it('should remove group from list', async () => {
            const group1: Group = {
                id: 'group-4' as SAID,
                name: 'Group A',
                members: [],
            };

            const group2: Group = {
                id: 'group-5' as SAID,
                name: 'Group B',
                members: [],
            };

            await groups.save(group1);
            await groups.save(group2);
            await groups.remove(group1.id);

            const all = await groups.list();
            expect(all).toHaveLength(1);
            expect(all[0]).toEqual(group2);
        });
    });

    describe('hierarchical groups', () => {
        it('should support parent-child relationships', async () => {
            const parent: Group = {
                id: 'parent-group' as SAID,
                name: 'All Teams',
                members: [],
            };

            const child: Group = {
                id: 'child-group' as SAID,
                name: 'Team A',
                parentGroup: 'parent-group' as SAID,
                members: ['alice-aid' as AID],
            };

            await groups.save(parent);
            await groups.save(child);

            const retrievedChild = await groups.get(child.id);
            expect(retrievedChild?.parentGroup).toBe(parent.id);
        });

        it('should resolve group hierarchy', async () => {
            const root: Group = {
                id: 'root' as SAID,
                name: 'Organization',
                members: [],
            };

            const team1: Group = {
                id: 'team1' as SAID,
                name: 'Engineering',
                parentGroup: 'root' as SAID,
                members: ['alice-aid' as AID],
            };

            const team2: Group = {
                id: 'team2' as SAID,
                name: 'Design',
                parentGroup: 'root' as SAID,
                members: ['bob-aid' as AID],
            };

            const subteam: Group = {
                id: 'subteam' as SAID,
                name: 'Backend',
                parentGroup: 'team1' as SAID,
                members: ['charlie-aid' as AID],
            };

            await groups.save(root);
            await groups.save(team1);
            await groups.save(team2);
            await groups.save(subteam);

            const resolved = await groups.resolve('root' as SAID);

            expect(resolved.group).toEqual(root);
            expect(resolved.children).toHaveLength(2);

            const engineering = resolved.children.find(c => c.group.id === 'team1');
            expect(engineering).toBeDefined();
            expect(engineering?.children).toHaveLength(1);
            expect(engineering?.children[0].group.id).toBe('subteam');
        });
    });
});
