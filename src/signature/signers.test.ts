import { describe, expect, it, test } from 'bun:test';
import { KeriKeyPairs } from '../crypto/index.js';
import { decodeKey } from '../cesr/keys.js';
import { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from '../crypto/x25519.js';
import { hkdfBlake3 } from '../crypto/hkdf.js';
import { MAX_HKDF_DERIVE_LENGTH } from './key-agreement.js';
import type { SAID, Signature } from '../common/types.js';
import { Signers } from './signers.js';

describe('Signers.fromKeyPair', () => {
  const keyPair = KeriKeyPairs.fromSeedNumber(1);

  test('creates a signer with correct publicKey', () => {
    const signer = Signers.fromKeyPair(keyPair);
    expect(signer.publicKey).toBe(keyPair.publicKey);
  });

  test('signBytes produces a verifiable signature', async () => {
    const signer = Signers.fromKeyPair(keyPair);
    const data = new TextEncoder().encode('test data');
    const sig = await signer.signBytes(data);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });

  test('signSaid signs UTF-8 encoded SAID', async () => {
    const signer = Signers.fromKeyPair(keyPair);
    const said = 'Eabcdef1234567890' as SAID;
    const sig = await signer.signSaid(said);
    expect(typeof sig).toBe('string');
  });

  test('exists returns true for own key, false for others', async () => {
    const signer = Signers.fromKeyPair(keyPair);
    expect(await signer.exists(keyPair.publicKey)).toBe(true);
    const other = KeriKeyPairs.fromSeedNumber(2);
    expect(await signer.exists(other.publicKey)).toBe(false);
  });

  test('getX25519PublicKey returns 32 bytes', async () => {
    const signer = Signers.fromKeyPair(keyPair);
    const x25519Key = await signer.getX25519PublicKey();
    expect(x25519Key).toBeInstanceOf(Uint8Array);
    expect(x25519Key.length).toBe(32);
  });

  test('signature verifies with core verify function', async () => {
    const { verify } = await import('./verify.js');
    const signer = Signers.fromKeyPair(keyPair);
    const data = new TextEncoder().encode('hello KERI');
    const sig = await signer.signBytes(data);
    expect(verify(keyPair.publicKey, sig as Signature, data)).toBe(true);
  });
});

describe('Signers.fromKeyPair deriveX25519HkdfBlake3Key', () => {
  // Deterministic seeds for reproducible test vectors
  const seed = new Uint8Array(32).fill(0xaa);
  const peerSeed = new Uint8Array(32).fill(0xbb);
  const pair = KeriKeyPairs.fromSeed(seed);
  const signer = Signers.fromKeyPair(pair);

  const peerPair = KeriKeyPairs.fromSeed(peerSeed);
  const peerX25519Pub = ed25519ToX25519Public(decodeKey(peerPair.publicKey).raw);

  it('produces identical output to explicit ECDH + HKDF sequence (equivalence)', async () => {
    const info = new TextEncoder().encode('merits-keywrap/1');
    const ownPrivRaw = decodeKey(pair.privateKey).raw;
    const ownX25519Priv = ed25519ToX25519Private(ownPrivRaw);
    const ownX25519Pub = ed25519ToX25519Public(decodeKey(pair.publicKey).raw);
    const shared = deriveSharedSecret(ownX25519Priv, peerX25519Pub);
    const expected = hkdfBlake3(shared, ownX25519Pub, info, 32);

    const result = await signer.deriveX25519HkdfBlake3Key({
      peerPublicKey: peerX25519Pub,
      salt: ownX25519Pub,
      info,
      length: 32,
    });

    expect(result).toEqual(expected);
  });

  it('throws if peerPublicKey is not 32 bytes', async () => {
    await expect(
      signer.deriveX25519HkdfBlake3Key({
        peerPublicKey: new Uint8Array(31),
        salt: new Uint8Array(32),
        info: new Uint8Array(0),
        length: 32,
      }),
    ).rejects.toThrow();
  });

  it('throws if length < 1', async () => {
    await expect(
      signer.deriveX25519HkdfBlake3Key({
        peerPublicKey: peerX25519Pub,
        salt: new Uint8Array(32),
        info: new Uint8Array(0),
        length: 0,
      }),
    ).rejects.toThrow();
  });

  it('throws if length > MAX_HKDF_DERIVE_LENGTH', async () => {
    await expect(
      signer.deriveX25519HkdfBlake3Key({
        peerPublicKey: peerX25519Pub,
        salt: new Uint8Array(32),
        info: new Uint8Array(0),
        length: MAX_HKDF_DERIVE_LENGTH + 1,
      }),
    ).rejects.toThrow();
  });
});
