import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { InMemoryKeyStores } from '../in-memory-key-store.js';
import { Signers, isEd25519Signer } from '../../signature/index.js';
import { asRawPublicKey, publicKeyHex, toCESRPublicKey } from '../raw-public-key.js';
import type { Ed25519Signer } from '../../signature/signer.js';

describe('InMemoryKeyStore', () => {
  test('generate ed25519 → hasKey → resolve → sign → verify', async () => {
    // setup
    const store = InMemoryKeyStores.create();

    // method under test: generate
    const genResult = await store.generate('ed25519');
    expect(genResult.ok).toBe(true);
    if (!genResult.ok) return;
    const { publicKey, algo } = genResult.value;
    expect(algo).toBe('ed25519');
    expect(publicKey.length).toBe(32);

    // method under test: hasKey
    expect(await store.hasKey(publicKey)).toBe(true);

    // method under test: resolve → withSigner → sign
    const resolveResult = await store.resolve(publicKey);
    expect(resolveResult.ok).toBe(true);
    if (!resolveResult.ok) return;

    const data = new TextEncoder().encode('test message');
    const sig = await resolveResult.value.withSigner(async (signer) => {
      expect(signer.algo).toBe('ed25519');
      return signer.signBytes(data);
    });

    // assertions: signature verifies
    expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
  });

  test('ed25519 signer is an Ed25519Signer with key agreement', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const key = (await store.generate('ed25519')).value!;
    const result = await store.resolve(key.publicKey);
    if (!result.ok) return;

    // method under test: signer should pass isEd25519Signer type guard
    await result.value.withSigner(async (signer) => {
      expect(isEd25519Signer(signer)).toBe(true);
      if (isEd25519Signer(signer)) {
        // assertions: key agreement methods work
        const x25519Pub = await signer.getX25519PublicKey();
        expect(x25519Pub).toBeInstanceOf(Uint8Array);
        expect(x25519Pub.length).toBe(32);
      }
    });
  });

  test('generateBatch creates multiple keys, all produce valid signatures', async () => {
    // setup
    const store = InMemoryKeyStores.create();

    // method under test
    const batchResult = await store.generateBatch('ed25519', 3);
    expect(batchResult.ok).toBe(true);
    if (!batchResult.ok) return;

    // assertions: all 3 keys exist and each withSigner produces valid signatures
    expect(batchResult.value.length).toBe(3);
    const data = new TextEncoder().encode('batch test');
    for (const key of batchResult.value) {
      expect(await store.hasKey(key.publicKey)).toBe(true);
      const r = await store.resolve(key.publicKey);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const sig = await r.value.withSigner(async (signer) => signer.signBytes(data));
      expect(Signers.verify(toCESRPublicKey(key.publicKey), sig, data)).toBe(true);
    }
  });

  test('resolve unknown key returns key-not-found', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const unknownKey = asRawPublicKey(new Uint8Array(32));

    // method under test
    const result = await store.resolve(unknownKey);

    // assertions
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('key-not-found');
  });

  test('hasKey returns false for unknown key', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const unknownKey = asRawPublicKey(new Uint8Array(32));

    // method under test + assertions
    expect(await store.hasKey(unknownKey)).toBe(false);
  });

  test('supports() returns ed25519 and secp256k1', () => {
    // setup
    const store = InMemoryKeyStores.create();

    // method under test + assertions
    const algos = store.supports();
    expect(algos.has('ed25519')).toBe(true);
    expect(algos.has('secp256k1')).toBe(true);
  });

  test('generate unsupported algo returns algo-not-supported', async () => {
    // setup
    const store = InMemoryKeyStores.create();

    // method under test
    const result = await store.generate('rsa' as any);

    // assertions
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('algo-not-supported');
  });

  test('id is in-memory', () => {
    const store = InMemoryKeyStores.create();
    expect(store.id).toBe('in-memory');
  });

  test('generate secp256k1 → sign → verify', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const genResult = await store.generate('secp256k1');
    expect(genResult.ok).toBe(true);
    if (!genResult.ok) return;
    const { publicKey, algo } = genResult.value;
    expect(algo).toBe('secp256k1');
    expect(publicKey.length).toBe(33);

    // method under test: resolve → withSigner → sign
    const resolveResult = await store.resolve(publicKey);
    expect(resolveResult.ok).toBe(true);
    if (!resolveResult.ok) return;

    const data = new TextEncoder().encode('secp256k1 test');
    const sig = await resolveResult.value.withSigner(async (signer) => {
      expect(signer.algo).toBe('secp256k1');
      return signer.signBytes(data);
    });

    // assertions: signature verifies via Signers.verify (handles CESR decode + prehash internally)
    expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
  });

  test('deriveX25519HkdfBlake3Key produces matching shared key for two parties', async () => {
    // setup: Alice and Bob each generate ed25519 keys
    const store = InMemoryKeyStores.create();
    const aliceKey = (await store.generate('ed25519')).value!;
    const bobKey = (await store.generate('ed25519')).value!;

    // get each party's x25519 public key
    const aliceResult = await store.resolve(aliceKey.publicKey);
    const bobResult = await store.resolve(bobKey.publicKey);
    if (!aliceResult.ok || !bobResult.ok) return;

    let aliceX25519Pub!: Uint8Array;
    let bobX25519Pub!: Uint8Array;
    await aliceResult.value.withSigner(async (signer) => {
      aliceX25519Pub = await (signer as Ed25519Signer).getX25519PublicKey();
    });
    await bobResult.value.withSigner(async (signer) => {
      bobX25519Pub = await (signer as Ed25519Signer).getX25519PublicKey();
    });

    const salt = new Uint8Array(16);
    const info = new TextEncoder().encode('test-key-agreement');

    // method under test: Alice derives with Bob's public key, Bob derives with Alice's
    const aliceResolve2 = await store.resolve(aliceKey.publicKey);
    const bobResolve2 = await store.resolve(bobKey.publicKey);
    if (!aliceResolve2.ok || !bobResolve2.ok) return;

    const aliceDerived = await aliceResolve2.value.withSigner(async (signer) =>
      (signer as Ed25519Signer).deriveX25519HkdfBlake3Key({
        peerPublicKey: bobX25519Pub,
        salt,
        info,
        length: 32,
      }),
    );

    const bobDerived = await bobResolve2.value.withSigner(async (signer) =>
      (signer as Ed25519Signer).deriveX25519HkdfBlake3Key({
        peerPublicKey: aliceX25519Pub,
        salt,
        info,
        length: 32,
      }),
    );

    // assertions: both parties derive the same shared key
    expect(aliceDerived).toEqual(bobDerived);
    expect(aliceDerived.length).toBe(32);
  });
});

describe('InMemoryKeyStores.fromPrivateKey', () => {
  test('wraps a known ed25519 private key as a KeyStore', async () => {
    // setup: generate a known key pair
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKeyRaw = ed25519.getPublicKey(privateKey);
    const publicKey = asRawPublicKey(publicKeyRaw);

    // method under test: create store from private key bytes
    const store = InMemoryKeyStores.fromPrivateKey(privateKey, 'ed25519');

    // assertions: store recognizes the key
    expect(await store.hasKey(publicKey)).toBe(true);

    // assertions: store can sign and the signature is valid
    const resolveR = await store.resolve(publicKey);
    expect(resolveR.ok).toBe(true);
    if (resolveR.ok) {
      const message = new TextEncoder().encode('test-message');
      await resolveR.value.withSigner(async (signer) => {
        const sig = await signer.signBytes(message);
        expect(sig).toBeDefined();
      });
    }
  });

  test('returns key-not-found for unknown key', async () => {
    // setup: create store from one key, look up a different key
    const privateKey = ed25519.utils.randomSecretKey();
    const store = InMemoryKeyStores.fromPrivateKey(privateKey, 'ed25519');

    const otherKey = asRawPublicKey(ed25519.getPublicKey(ed25519.utils.randomSecretKey()));
    expect(await store.hasKey(otherKey)).toBe(false);

    // method under test: resolve unknown key
    const resolveR = await store.resolve(otherKey);

    // assertions: key-not-found error
    expect(resolveR.ok).toBe(false);
  });

  test('is not a KeyGenerator (no generate method)', () => {
    // setup: create a KeyStore-only instance
    const privateKey = ed25519.utils.randomSecretKey();
    const store = InMemoryKeyStores.fromPrivateKey(privateKey, 'ed25519');

    // assertions: it's a KeyStore only, not a KeyGenerator
    expect('generate' in store).toBe(false);
  });

  test('throws on unsupported algo', () => {
    // setup: use an unknown algo string
    const privateKey = ed25519.utils.randomSecretKey();

    // method under test + assertions: throws synchronously
    expect(() => InMemoryKeyStores.fromPrivateKey(privateKey, 'unknown-algo')).toThrow('Unsupported algo');
  });
});
