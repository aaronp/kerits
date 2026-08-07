import { describe, expect, test } from 'bun:test';
import { Value } from '@sinclair/typebox/value';
import type { AID } from '../../common/types.js';
import {
  buildPublishedMembershipDirectory,
  memberRole,
  type MemberDirectoryEntry,
  PublishedMembershipDirectorySchema,
} from '../membership-directory.js';

describe('buildPublishedMembershipDirectory', () => {
  const alice = 'EAliceAID_0000000000000000000000000000000000000000000' as AID;
  const bob = 'EBobAID_00000000000000000000000000000000000000000000000' as AID;
  const groupAid = 'EGroupAID_0000000000000000000000000000000000000000000' as AID;

  test('builds a valid directory from coupled member inputs', () => {
    // setup: two members with their contributing keys
    const members = [
      { aid: alice, contributingKey: 'DAliceKey123' },
      { aid: bob, contributingKey: 'DBobKey456' },
    ];

    // method under test
    const directory = buildPublishedMembershipDirectory({
      subjectAid: groupAid,
      members,
      kelSequenceNumber: 0,
    });

    // assertions: correct shape, validates against schema, branded AIDs preserved
    expect(directory.v).toBe('kerits-members/1');
    expect(directory.subjectAid).toBe(groupAid);
    expect(directory.kelSequenceNumber).toBe(0);
    expect(directory.members).toHaveLength(2);
    expect(directory.members[0]).toEqual({ aid: alice, contributingKey: 'DAliceKey123' });
    expect(directory.members[1]).toEqual({ aid: bob, contributingKey: 'DBobKey456' });
    expect(typeof directory.updatedAt).toBe('string');
    expect(Value.Check(PublishedMembershipDirectorySchema, directory)).toBe(true);
  });

  test('preserves kelSequenceNumber for rotated groups', () => {
    // setup: single member at sequence number 3 (after rotations)
    const directory = buildPublishedMembershipDirectory({
      subjectAid: groupAid,
      members: [{ aid: alice, contributingKey: 'DAliceRotatedKey' }],
      kelSequenceNumber: 3,
    });

    // assertions: sequence number threaded through
    expect(directory.kelSequenceNumber).toBe(3);
    expect(Value.Check(PublishedMembershipDirectorySchema, directory)).toBe(true);
  });
});

describe('memberRole', () => {
  const aid = 'ETestAID_00000000000000000000000000000000000000000000000' as AID;

  test('admin when contributingKey is present', () => {
    // setup: KEL contributor — has a signing key in the group k[]
    const entry: MemberDirectoryEntry = { aid, contributingKey: 'DTestKey123' };

    // method under test
    const role = memberRole(entry);

    // assertions: contributing a key makes you an admin
    expect(role).toBe('admin');
  });

  test('member when contributingKey is absent', () => {
    // setup: non-signing participant — no key in the group k[]
    const entry: MemberDirectoryEntry = { aid };

    // method under test
    const role = memberRole(entry);

    // assertions: no key contribution means member-level role
    expect(role).toBe('member');
  });
});
