/**
 * isValidRotation binds an admin message to the ACL being installed, independent of field order.
 */
import { describe, expect, it } from 'bun:test';
import type { PublicKey, SAID } from '../../common/types.js';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import { isValidRotation } from '../check.js';
import { aclPayloadOf, signAclMessage } from '../signed-message.js';

const admin = KeriKeyPairs.fromSeedNumber(31);
const other = KeriKeyPairs.fromSeedNumber(32);
const adminPk = admin.publicKey as PublicKey;
const version = 'EAdminSlotVersion_rotation_000000000000000000' as SAID;
const slot = { keys: [adminPk], version };
const now = 1_700_000_000_000;

describe('isValidRotation', () => {
  it('accepts the signed ACL in any field order and refuses a substituted one', async () => {
    // setup: an admin message signed over `next`
    const next = { read: slot, write: slot, admin: slot };
    const msg = await signAclMessage(
      { system: 's', operation: 'admin', aclHash: version, messageId: 'm', expiresAt: now + 1, signerPublicKey: adminPk },
      aclPayloadOf(next),
      admin,
    );
    const reordered = { admin: slot, write: slot, read: slot };
    const swapped = { ...next, write: { keys: [adminPk, other.publicKey as PublicKey], version } };

    // call out our method under test
    const same = isValidRotation(slot, msg, reordered, { now });
    const substituted = isValidRotation(slot, msg, swapped, { now });

    // assertions: order is irrelevant; another ACL is a digest mismatch even though msg.payload is valid
    expect(same.ok).toBe(true);
    expect(substituted).toEqual({ ok: false, error: { kind: 'digest-mismatch' } });
  });
});
