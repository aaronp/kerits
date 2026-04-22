import { describe, expect, test } from 'bun:test';
import { KeriKeyPairs } from '../crypto/index.js';
import type { AID, SAID, Signature } from '../common/types.js';
import { Signers } from './signers.js';

describe('Signers.fromKeyPair', () => {
  const keyPair = KeriKeyPairs.fromSeedNumber(1);
  const aid = 'Etest_aid_placeholder' as AID;

  test('creates a signer with correct publicKey and aid', () => {
    const signer = Signers.fromKeyPair(keyPair, aid);
    expect(signer.publicKey).toBe(keyPair.publicKey);
    expect(signer.aid).toBe(aid);
  });

  test('signBytes produces a verifiable signature', async () => {
    const signer = Signers.fromKeyPair(keyPair, aid);
    const data = new TextEncoder().encode('test data');
    const sig = await signer.signBytes(data);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  test('signSaid signs UTF-8 encoded SAID', async () => {
    const signer = Signers.fromKeyPair(keyPair, aid);
    const said = 'Eabcdef1234567890' as SAID;
    const sig = await signer.signSaid(said);
    expect(typeof sig).toBe('string');
  });

  test('exists returns true for own key, false for others', async () => {
    const signer = Signers.fromKeyPair(keyPair, aid);
    expect(await signer.exists(keyPair.publicKey)).toBe(true);
    const other = KeriKeyPairs.fromSeedNumber(2);
    expect(await signer.exists(other.publicKey)).toBe(false);
  });

  test('getX25519PublicKey returns 32 bytes', async () => {
    const signer = Signers.fromKeyPair(keyPair, aid);
    const x25519Key = await signer.getX25519PublicKey();
    expect(x25519Key).toBeInstanceOf(Uint8Array);
    expect(x25519Key.length).toBe(32);
  });

  test('signature verifies with core verify function', async () => {
    const { verify } = await import('./verify.js');
    const signer = Signers.fromKeyPair(keyPair, aid);
    const data = new TextEncoder().encode('hello KERI');
    const sig = await signer.signBytes(data);
    expect(verify(keyPair.publicKey, sig as Signature, data)).toBe(true);
  });
});
