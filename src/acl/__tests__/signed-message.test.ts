/**
 * kerits-acl-msg/1 canonical encoding + digest binding.
 */
import { describe, expect, it } from 'bun:test';
import { KeriKeyPairs } from '../../crypto/keypairs.js';
import type { PublicKey, SAID } from '../../common/types.js';
import {
  ACL_MSG_V1,
  canonicalSignedAclBytes,
  payloadDigestOf,
  signAclMessage,
  verifyAclMessageSignature,
} from '../signed-message.js';

describe('signed-message v1', () => {
  it('canonical bytes are stable and exclude signature/payload', async () => {
    const kp = KeriKeyPairs.fromSeedNumber(10);
    const fields = {
      v: ACL_MSG_V1,
      system: 'demo',
      operation: 'write' as const,
      aclHash: 'E'.padEnd(44, 'A') as SAID,
      payloadDigest: 'E'.padEnd(44, 'B') as SAID,
      messageId: 'm1',
      expiresAt: 1_700_000_000_000,
      signerPublicKey: kp.publicKey as PublicKey,
    };
    const a = canonicalSignedAclBytes(fields);
    const b = canonicalSignedAclBytes({ ...fields });
    expect(a).toEqual(b);
    const text = new TextDecoder().decode(a);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect('signature' in parsed).toBe(false);
    expect('payload' in parsed).toBe(false);
    expect('payloadDigest' in parsed).toBe(true);
  });

  it('sign + verify round-trip', async () => {
    const kp = KeriKeyPairs.fromSeedNumber(11);
    const payload = new TextEncoder().encode('hello');
    const msg = await signAclMessage(
      {
        system: 'demo',
        operation: 'write',
        aclHash: 'E'.padEnd(44, 'C') as SAID,
        messageId: 'm2',
        expiresAt: Date.now() + 60_000,
        signerPublicKey: kp.publicKey as PublicKey,
      },
      payload,
      kp,
    );
    expect(msg.payloadDigest).toBe(payloadDigestOf(payload));
    expect(verifyAclMessageSignature(msg)).toBe(true);
  });
});
