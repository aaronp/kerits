// packages/core/src/keys/__tests__/keychain.test.ts
import { describe, expect, test } from 'bun:test';
import { Keychains } from '../keychain.js';
import { InMemoryKeyStores } from '../in-memory-key-store.js';
import { FakeHsmKeyStores } from '../fake-hsm-key-store.js';
import { asRawPublicKey, toCESRPublicKey } from '../raw-public-key.js';
import { Signers } from '../../signature/index.js';

const testPurpose = { purpose: { type: 'test' }, purposeText: 'test' };

describe('Keychain', () => {
  test('resolve routes to correct store and signs with correct key', async () => {
    // setup: two stores, each with one key
    const storeA = InMemoryKeyStores.create();
    const storeB = FakeHsmKeyStores.create();
    const keyA = (await storeA.generate('ed25519')).value!;
    const keyB = (await storeB.generate('ed25519')).value!;

    const keychain = Keychains.create();
    keychain.register(storeA, storeA);
    keychain.register(storeB, storeB);

    const data = new TextEncoder().encode('routing test');

    // method under test: resolve keyA → sign → verify with keyA's public key
    const resultA = await keychain.resolve(keyA.publicKey, testPurpose);
    expect(resultA.ok).toBe(true);
    if (!resultA.ok) return;
    const sigA = await resultA.value.withSigner(async (s) => s.signBytes(data));
    expect(Signers.verify(toCESRPublicKey(keyA.publicKey), sigA, data)).toBe(true);
    // wrong key must NOT verify
    expect(Signers.verify(toCESRPublicKey(keyB.publicKey), sigA, data)).toBe(false);

    // method under test: resolve keyB → sign → verify with keyB's public key
    const resultB = await keychain.resolve(keyB.publicKey, testPurpose);
    expect(resultB.ok).toBe(true);
    if (!resultB.ok) return;
    const sigB = await resultB.value.withSigner(async (s) => s.signBytes(data));
    expect(Signers.verify(toCESRPublicKey(keyB.publicKey), sigB, data)).toBe(true);
    expect(Signers.verify(toCESRPublicKey(keyA.publicKey), sigB, data)).toBe(false);
  });

  test('resolve caches index for O(1) second lookup', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const key = (await store.generate('ed25519')).value!;
    const keychain = Keychains.create();
    keychain.register(store, store);

    // method under test: first resolve (iterates), second resolve (indexed)
    const r1 = await keychain.resolve(key.publicKey, testPurpose);
    const r2 = await keychain.resolve(key.publicKey, testPurpose);

    // assertions: both succeed
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  test('resolve unknown key returns key-not-found', async () => {
    // setup
    const keychain = Keychains.create();
    const unknownKey = asRawPublicKey(new Uint8Array(32));

    // method under test
    const result = await keychain.resolve(unknownKey, testPurpose);

    // assertions
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('key-not-found');
  });

  test('getStore returns registered store by id', () => {
    // setup
    const store = InMemoryKeyStores.create();
    const keychain = Keychains.create();
    keychain.register(store);

    // method under test
    expect(keychain.getStore(store.id)).toBe(store);
    expect(keychain.getStore('nonexistent')).toBeUndefined();
  });

  test('getGeneratorFor returns generator supporting algo', () => {
    // setup
    const store = InMemoryKeyStores.create();
    const keychain = Keychains.create();
    keychain.register(store, store);

    // method under test
    expect(keychain.getGeneratorFor('ed25519')).toBe(store);
    expect(keychain.getGeneratorFor('secp256k1')).toBe(store);
  });

  test('getGeneratorFor returns undefined when no generators', () => {
    // setup: keychain with no generators
    const keychain = Keychains.create();

    // method under test
    expect(keychain.getGeneratorFor('ed25519')).toBeUndefined();
  });

  test('resolve produces working signer through keychain', async () => {
    // setup
    const store = InMemoryKeyStores.create();
    const key = (await store.generate('ed25519')).value!;
    const keychain = Keychains.create();
    keychain.register(store, store);

    // method under test: full chain — keychain → store → scope → signer → sign
    const result = await keychain.resolve(key.publicKey, testPurpose);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const data = new TextEncoder().encode('keychain test');
    const sig = await result.value.withSigner(async (signer) => signer.signBytes(data));

    // assertions: signature verifies
    expect(Signers.verify(toCESRPublicKey(key.publicKey), sig, data)).toBe(true);
  });

  test('register store without generator', () => {
    // setup: a store-only registration (like FileKeyStore)
    const store = InMemoryKeyStores.create();
    const keychain = Keychains.create();

    // method under test: register without generator
    keychain.register(store);

    // assertions: store accessible, no generator for its algos
    expect(keychain.getStore(store.id)).toBe(store);
    // getGeneratorFor returns undefined since we didn't pass a generator
    expect(keychain.getGeneratorFor('ed25519')).toBeUndefined();
  });

  test('getGenerator returns registered generator by id', () => {
    // setup: register store+generator
    const store = InMemoryKeyStores.create();
    const keychain = Keychains.create();
    keychain.register(store, store);

    // method under test
    expect(keychain.getGenerator(store.id)).toBe(store);
  });

  test('getGenerator returns undefined for unknown id', () => {
    // setup: empty keychain
    const keychain = Keychains.create();

    // method under test
    expect(keychain.getGenerator('nonexistent')).toBeUndefined();
  });

  test('listGeneratorIds returns ids of all registered generators', () => {
    // setup: register two generators
    const storeA = InMemoryKeyStores.create();
    const storeB = FakeHsmKeyStores.create();
    const keychain = Keychains.create();
    keychain.register(storeA, storeA);
    keychain.register(storeB, storeB);

    // method under test
    const ids = keychain.listGeneratorIds();

    // assertions: both generator IDs present
    expect(ids).toContain(storeA.id);
    expect(ids).toContain(storeB.id);
    expect(ids.length).toBe(2);
  });

  test('listGeneratorIds returns empty when no generators registered', () => {
    // setup: keychain with store-only registration
    const store = InMemoryKeyStores.create();
    const keychain = Keychains.create();
    keychain.register(store); // no generator

    // method under test
    expect(keychain.listGeneratorIds()).toEqual([]);
  });
});
