// packages/core/src/crypto/envelope/__tests__/envelope.test.ts

import { describe, expect, it } from 'bun:test';
import { x25519 } from '@noble/curves/ed25519.js';
import type { AID } from '../../../common/types.js';
import { encryptEnvelope, decryptEnvelope } from '../jwe.js';
import type { EnvelopeAAD, PublicKeyRef, UnlockProvider } from '../types.js';

const ownerAid = 'EaU6JR2nmwyZ-i0d8JZAoTNZH3ULvYAfSVPzhzS6b5CM' as AID;

// setup: X25519 keypair generation helpers
function generateX25519() {
  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  const publicKey = x25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}

function makeRecipient(aid: AID, keyId: string): { ref: PublicKeyRef; privateKey: Uint8Array } {
  const { privateKey, publicKey } = generateX25519();
  return { ref: { aid, keyId, publicKey }, privateKey };
}

function makeUnlock(keys: Map<string, Uint8Array>): UnlockProvider {
  return {
    async unlock(keyId: string) {
      return keys.get(keyId);
    },
  };
}

const aad: EnvelopeAAD = { path: '/test', ownerAid, contentType: 'application/json' };

describe('encryptEnvelope / decryptEnvelope', () => {
  // round-trip: encrypt then decrypt returns original plaintext
  it('round-trips plaintext through encrypt and decrypt', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('hello envelope');

    // method under test: encrypt then decrypt
    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aad);
    const unlock = makeUnlock(new Map([['key-1', recipient.privateKey]]));
    const decrypted = await decryptEnvelope(envelope, unlock, aad);

    // plaintext should round-trip exactly
    expect(decrypted).toEqual(plaintext);
  });

  // multi-recipient: any recipient can decrypt
  it('allows any of multiple recipients to decrypt', async () => {
    const r1 = makeRecipient(ownerAid, 'device-a');
    const r2 = makeRecipient(ownerAid, 'device-b');
    const plaintext = new TextEncoder().encode('shared secret');

    const envelope = await encryptEnvelope(plaintext, [r1.ref, r2.ref], aad);

    // both recipients should independently decrypt to the same plaintext
    const d1 = await decryptEnvelope(envelope, makeUnlock(new Map([['device-a', r1.privateKey]])), aad);
    expect(d1).toEqual(plaintext);

    const d2 = await decryptEnvelope(envelope, makeUnlock(new Map([['device-b', r2.privateKey]])), aad);
    expect(d2).toEqual(plaintext);
  });

  // AAD mismatch: decrypt rejects when expected AAD differs from embedded
  it('rejects decryption when expected AAD does not match', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('secret');
    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aad);

    // method under test: decrypt with wrong AAD
    const wrongAad: EnvelopeAAD = { path: '/wrong/path', ownerAid, contentType: 'application/json' };
    const unlock = makeUnlock(new Map([['key-1', recipient.privateKey]]));

    // should reject — ciphertext was bound to a different path
    expect(decryptEnvelope(envelope, unlock, wrongAad)).rejects.toThrow();
  });

  // no matching key: decrypt throws when unlock returns undefined for all
  it('throws when no recipient key matches', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('secret');
    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aad);

    const emptyUnlock = makeUnlock(new Map());
    expect(decryptEnvelope(envelope, emptyUnlock, aad)).rejects.toThrow();
  });

  // validation: rejects empty recipients
  it('rejects empty recipients array', () => {
    const plaintext = new TextEncoder().encode('secret');
    expect(encryptEnvelope(plaintext, [], aad)).rejects.toThrow();
  });

  // validation: rejects invalid public key length
  it('rejects public key with wrong length', () => {
    const badRef: PublicKeyRef = { aid: ownerAid, keyId: 'bad', publicKey: new Uint8Array(16) };
    const plaintext = new TextEncoder().encode('secret');
    expect(encryptEnvelope(plaintext, [badRef], aad)).rejects.toThrow();
  });

  // validation: rejects empty contentType
  it('rejects empty contentType in AAD', () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('secret');
    const badAad: EnvelopeAAD = { path: '/test', ownerAid, contentType: '' };
    expect(encryptEnvelope(plaintext, [recipient.ref], badAad)).rejects.toThrow();
  });

  // validation: rejects unlock key with wrong length
  it('rejects unlock key with wrong length', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('secret');
    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aad);

    // provide a 16-byte key instead of 32
    const badUnlock = makeUnlock(new Map([['key-1', new Uint8Array(16)]]));
    expect(decryptEnvelope(envelope, badUnlock, aad)).rejects.toThrow();
  });

  // AAD version mismatch: encrypt with v1, decrypt expecting v2 should fail
  it('rejects decryption when AAD version does not match', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('versioned');
    const aadV1: EnvelopeAAD = { ...aad, version: 'v1' };
    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aadV1);

    // method under test: decrypt with different version
    const unlock = makeUnlock(new Map([['key-1', recipient.privateKey]]));
    const aadV2: EnvelopeAAD = { ...aad, version: 'v2' };

    // should reject — version is part of the AAD binding
    expect(decryptEnvelope(envelope, unlock, aadV2)).rejects.toThrow(/AAD mismatch/);
  });

  // AAD version round-trip: encrypt and decrypt with same version succeeds
  it('round-trips when AAD version matches', async () => {
    const recipient = makeRecipient(ownerAid, 'key-1');
    const plaintext = new TextEncoder().encode('versioned');
    const aadV1: EnvelopeAAD = { ...aad, version: 'v1' };

    const envelope = await encryptEnvelope(plaintext, [recipient.ref], aadV1);
    const unlock = makeUnlock(new Map([['key-1', recipient.privateKey]]));
    const decrypted = await decryptEnvelope(envelope, unlock, aadV1);

    expect(decrypted).toEqual(plaintext);
  });
});
