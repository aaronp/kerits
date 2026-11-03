/**
 * JWE stays independent of ACL types (no @kerits/core/acl imports).
 */
import { describe, expect, it } from 'bun:test';
import { x25519 } from '@noble/curves/ed25519.js';
import type { AID } from '../../../common/types.js';
import { decryptEnvelope, encryptEnvelope } from '../jwe.js';
import type { EnvelopeAAD, PublicKeyRef, UnlockProvider } from '../types.js';

describe('JWE decoupled from ACL', () => {
  it('encrypt/decrypt with concrete recipient keys (no ACL types)', async () => {
    // setup
    const privateKey = new Uint8Array(32);
    crypto.getRandomValues(privateKey);
    const publicKey = x25519.getPublicKey(privateKey);
    const aid = 'EaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM' as AID;
    const ref: PublicKeyRef = { aid, keyId: 'k1', publicKey };
    const aad: EnvelopeAAD = { path: '/t', ownerAid: aid, contentType: 'text/plain' };
    const plaintext = new TextEncoder().encode('secret');
    const unlock: UnlockProvider = {
      async unlock(keyId) {
        return keyId === 'k1' ? privateKey : undefined;
      },
    };

    // method under test
    const envelope = await encryptEnvelope(plaintext, [ref], aad);
    const out = await decryptEnvelope(envelope, unlock, aad);

    // assertions
    expect(out).toEqual(plaintext);
  });
});
