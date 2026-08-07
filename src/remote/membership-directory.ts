import { Type } from '@sinclair/typebox';
import type { AID } from '../common/types.js';

// ---------------------------------------------------------------------------
// Member directory entry
// ---------------------------------------------------------------------------

/**
 * A member of an MSIG group directory.
 *
 * When {@link contributingKey} is present, this member contributed a signing
 * key to the group's KEL (`k[]`) — a **KEL member** (logical role: admin).
 * When absent, this is a non-signing member — application-level membership
 * without a KERI identity contribution (logical role: member).
 *
 * For MSIG AIDs, at least one entry MUST have a `contributingKey`.
 * Use {@link memberRole} to derive the logical role from an entry.
 */
export type MemberDirectoryEntry = {
  readonly aid: AID;
  readonly contributingKey?: string;
};

/** Wire-validation schema for {@link MemberDirectoryEntry}. */
export const MemberDirectoryEntrySchema = Type.Object(
  {
    aid: Type.String(),
    contributingKey: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

// ---------------------------------------------------------------------------
// Member role (derived)
// ---------------------------------------------------------------------------

/** Logical role derived from a {@link MemberDirectoryEntry}. */
export type MemberRole = 'admin' | 'member';

/**
 * Derive the logical role of a member directory entry.
 *
 * - **admin** — contributed a signing key to the group KEL (`k[]`).
 * - **member** — non-signing participant; application-level membership only.
 */
export function memberRole(entry: MemberDirectoryEntry): MemberRole {
  return entry.contributingKey !== undefined ? 'admin' : 'member';
}

// ---------------------------------------------------------------------------
// Published membership directory
// ---------------------------------------------------------------------------

/**
 * The published membership directory for an MSIG group.
 *
 * Stored on R2 at the canonical path `aid:<subjectAid>/members`.
 * Contains the authoritative AID→key attribution for the group.
 *
 * {@link kelSequenceNumber} tracks which KEL version this directory
 * corresponds to — the R2 worker rejects publishes with a lower
 * sequence number than the existing directory (monotonicity).
 */
export type PublishedMembershipDirectory = {
  readonly v: 'kerits-members/1';
  readonly subjectAid: AID;
  readonly members: readonly MemberDirectoryEntry[];
  readonly kelSequenceNumber: number;
  readonly updatedAt: string;
};

/** Wire-validation schema for {@link PublishedMembershipDirectory}. */
export const PublishedMembershipDirectorySchema = Type.Object(
  {
    v: Type.Literal('kerits-members/1'),
    subjectAid: Type.String(),
    members: Type.Array(MemberDirectoryEntrySchema, { minItems: 1 }),
    kelSequenceNumber: Type.Integer({ minimum: 0 }),
    updatedAt: Type.String(),
  },
  { additionalProperties: false },
);

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Input for a group member that contributes a signing key.
 * Use this for inception — all signing members have a {@link contributingKey}.
 */
export type GroupMemberInput = {
  readonly aid: AID;
  readonly contributingKey: string;
};

/** Build a {@link PublishedMembershipDirectory} from coupled member inputs. */
export function buildPublishedMembershipDirectory(input: {
  readonly subjectAid: AID;
  readonly members: readonly GroupMemberInput[];
  readonly kelSequenceNumber: number;
}): PublishedMembershipDirectory {
  return {
    v: 'kerits-members/1',
    subjectAid: input.subjectAid,
    members: input.members.map((m) => ({
      aid: m.aid,
      contributingKey: m.contributingKey,
    })),
    kelSequenceNumber: input.kelSequenceNumber,
    updatedAt: new Date().toISOString(),
  };
}
