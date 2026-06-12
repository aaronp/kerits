// packages/core/src/crypto/envelope/__tests__/serialization.test.ts

import { describe, expect, it } from 'bun:test';
import { x25519 } from '@noble/curves/ed25519.js';
import type { AID } from '../../../common/types.js';
import { encryptEnvelope } from '../jwe.js';
import { serializeEnvelope, deserializeEnvelope } from '../serialization.js';
import type { EnvelopeAAD, PublicKeyRef } from '../types.js';

const ownerAid = 'EaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM' as AID;

function makeRecipient(keyId: string): PublicKeyRef {
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  const publicKey = x25519.getPublicKey(privateKey);
  return { aid: ownerAid, keyId, publicKey };
}

const aad: EnvelopeAAD = { path: '/test', ownerAid, contentType: 'application/json' };

describe('serializeEnvelope / deserializeEnvelope', () => {
  // round-trip: serialize to JSON then deserialize back preserves the envelope
  it('round-trips an EncryptedEnvelope through JSON serialization', async () => {
    // setup: create an encrypted envelope
    const recipient = makeRecipient('key-1');
    const plaintext = new TextEncoder().encode('test data');
    const envelope = await encryptEnvelope(plaintext, [recipient], aad);

    // method under test: serialize + deserialize
    const serialized = serializeEnvelope(envelope);
    const json = JSON.stringify(serialized);
    expect(json).toBeTruthy();

    const parsed = JSON.parse(json) as Record<string, unknown>;
    const restored = deserializeEnvelope(parsed);

    // restored envelope should have the same tag and ciphertext
    expect(restored._tag).toBe('EncryptedEnvelope');
    expect(restored.jwe.ciphertext).toBe(envelope.jwe.ciphertext);
  });

  // validation: rejects objects that are not valid serialized envelopes
  it('throws on invalid input shape', () => {
    expect(() => deserializeEnvelope({})).toThrow();
    expect(() => deserializeEnvelope({ _tag: 'wrong' })).toThrow();
    expect(() => deserializeEnvelope({ _tag: 'EncryptedEnvelope' })).toThrow();
  });
});
