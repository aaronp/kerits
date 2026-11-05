// packages/core/src/keys/__tests__/vault.test.ts
import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { digestVerfer } from '../../cesr/digest.js';
import { Vaults } from '../vault.js';
import { AlgoPlugins } from '../algo-plugins.js';
import { EncryptionPlugins } from '../encryption-plugins.js';
import { KeyPersistences } from '../key-persistences.js';
import { UnlockProviders } from '../unlock-providers.js';
import { Keychains } from '../keychain.js';
import { FakeHsmKeyStores } from '../fake-hsm-key-store.js';
import { Algos } from '../types.js';
import { Signers, isEd25519Signer, isSecp256k1Signer } from '../../signature/index.js';
import { toCESRPublicKey } from '../raw-public-key.js';
import { asRawPublicKey } from '../raw-public-key.js';
import type { EncryptionPlugin, Grant, KeyPersistence, RawPublicKey, UnlockProvider, Vault, WithGrantOptions } from '../types.js';
import { UnlockRefs } from '../unlock-ref.js';
import type { UnlockRef } from '../unlock-ref.js';

/** Helper: create a vault with XOR + in-memory persistence for byte-inspection tests */
function createTestVault(provider: UnlockProvider, persistence?: KeyPersistence) {
  const p = persistence ?? KeyPersistences.inMemory();
  const vault = Vaults.create({
    providers: [provider],
    defaultProvider: provider,
    algos: [AlgoPlugins.ed25519(), AlgoPlugins.secp256k1()],
    persistence: p,
    encryption: EncryptionPlugins.xor(),
  });
  return { vault, persistence: p };
}

describe('Vault', () => {
  // Scenario 1: Generate → resolve → sign → verify (baseline)
  test('scenario 1: generate → resolve → sign → verify', async () => {
    const provider = UnlockProviders.passphrase('hunter2');
    const { vault } = createTestVault(provider);

    const result = await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      expect(genResult.ok).toBe(true);
      if (!genResult.ok) return;
      const { publicKey } = genResult.value;

      const resolveResult = await vault.keyStore(grant).resolve(publicKey);
      expect(resolveResult.ok).toBe(true);
      if (!resolveResult.ok) return;

      const data = new TextEncoder().encode('vault test');
      const sig = await resolveResult.value.withSigner(async (signer) => {
        expect(signer.algo).toBe('ed25519');
        return signer.signBytes(data);
      });

      expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
      return publicKey;
    });

    expect(result).toBeDefined();
  });

  // Scenario 2: Encrypted material is actually encrypted in storage
  test('scenario 2: encrypted material differs from plaintext private key', async () => {
    const persistence = KeyPersistences.inMemory();
    const fixedSecret = new Uint8Array(32).fill(0x42);
    const provider = UnlockProviders.fixed(fixedSecret);
    const { vault } = createTestVault(provider, persistence);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) return;

      const entries = await persistence.list();
      expect(entries.length).toBe(1);
      const entry = entries[0]!;

      expect(entry.encryptedPrivateKey.length).toBe(32);
      expect(entry.ref).toEqual(provider.ref);
      expect(entry.publicKeyDigest.length).toBeGreaterThan(0);
      expect(entry.algo).toBe('ed25519');

      // XOR decrypt manually to recover plaintext private key
      const plaintextKey = new Uint8Array(entry.encryptedPrivateKey.length);
      for (let i = 0; i < plaintextKey.length; i++) {
        plaintextKey[i] = entry.encryptedPrivateKey[i]! ^ fixedSecret[i % fixedSecret.length]!;
      }

      expect(entry.encryptedPrivateKey).not.toEqual(plaintextKey);

      const data = new TextEncoder().encode('round-trip');
      const sig = ed25519.sign(data, plaintextKey);
      expect(ed25519.verify(sig, data, genResult.value.publicKey as Uint8Array)).toBe(true);
    });
  });

  // Scenario 3a (XOR observation): corrupted ciphertext produces invalid signatures
  test('scenario 3a: corrupted ciphertext with XOR produces invalid signature', async () => {
    const persistence = KeyPersistences.inMemory();
    const provider = UnlockProviders.passphrase('hunter2');
    const { vault } = createTestVault(provider, persistence);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) return;
      const { publicKey } = genResult.value;

      const entries = await persistence.list();
      const entry = entries[0]!;
      const corrupted = { ...entry, encryptedPrivateKey: new Uint8Array(32).fill(0xff) };
      await persistence.store(corrupted);

      const resolveResult = await vault.keyStore(grant).resolve(publicKey);

      expect(resolveResult.ok).toBe(true);
      if (!resolveResult.ok) return;

      const data = new TextEncoder().encode('test');
      const sig = await resolveResult.value.withSigner(async (s) => s.signBytes(data));
      expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(false);
    });
  });

  // Scenario 3 (spec): corrupted ciphertext with AES-GCM fails decrypt → wrong-secret
  // (ciphertext comes from our own storage, so any decrypt failure is reported as the secret being wrong)
  test('scenario 3: corrupted ciphertext with AES-GCM returns wrong-secret', async () => {
    const persistence = KeyPersistences.inMemory();
    const provider = UnlockProviders.passphrase('hunter2');
    const vault = Vaults.create({
      providers: [provider],
      defaultProvider: provider,
      algos: [AlgoPlugins.ed25519()],
      persistence,
      encryption: EncryptionPlugins.aesGcm(),
    });

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) return;
      const { publicKey } = genResult.value;

      const entries = await persistence.list();
      const entry = entries[0]!;
      const corrupted = { ...entry, encryptedPrivateKey: new Uint8Array(entry.encryptedPrivateKey.length).fill(0xff) };
      await persistence.store(corrupted);

      const resolveResult = await vault.keyStore(grant).resolve(publicKey);

      expect(resolveResult.ok).toBe(false);
      if (!resolveResult.ok) {
        expect(resolveResult.error.kind).toBe('wrong-secret');
      }
    });
  });

  // Scenario 4: Grant for a different ref returns wrong-unlock
  test('scenario 4: wrong provider returns wrong-unlock error', async () => {
    const passphraseProvider = UnlockProviders.passphrase('hunter2');
    const fixedProvider = UnlockProviders.fixed(new Uint8Array(32).fill(0x99));
    const vault = Vaults.create({
      providers: [passphraseProvider, fixedProvider],
      defaultProvider: passphraseProvider,
      algos: [AlgoPlugins.ed25519(), AlgoPlugins.secp256k1()],
      persistence: KeyPersistences.inMemory(),
      encryption: EncryptionPlugins.xor(),
    });

    const publicKey = await passphraseProvider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) throw new Error('gen failed');
      return genResult.value.publicKey;
    });

    const result = await fixedProvider.withGrant(async (grant) => {
      return vault.keyStore(grant).resolve(publicKey);
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('wrong-unlock');
      if (result.error.kind === 'wrong-unlock') {
        expect(result.error.expected).toEqual(passphraseProvider.ref);
        expect(result.error.actual).toEqual(fixedProvider.ref);
      }
    }
  });

  // Scenario 5: Multiple providers, keys route to correct provider
  test('scenario 5: getProviderForKey routes to correct provider', async () => {
    // setup
    const providerA = UnlockProviders.passphrase('alice');
    const providerB = UnlockProviders.fixed(new Uint8Array(32).fill(0xbb));
    const vault = Vaults.create({
      providers: [providerA, providerB],
      defaultProvider: providerA,
      algos: [AlgoPlugins.ed25519(), AlgoPlugins.secp256k1()],
      persistence: KeyPersistences.inMemory(),
      encryption: EncryptionPlugins.xor(),
    });

    // Generate key1 with providerA, key2 with providerB
    const key1 = await providerA.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      return r.ok ? r.value.publicKey : undefined;
    });
    const key2 = await providerB.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      return r.ok ? r.value.publicKey : undefined;
    });

    // method under test
    const p1 = await vault.getProviderForKey(key1!);
    const p2 = await vault.getProviderForKey(key2!);

    // assertions
    expect(p1).toBe(providerA);
    expect(p2).toBe(providerB);
  });

  // Scenario 6: Multiple algos, same provider
  test('scenario 6: ed25519 and secp256k1 with same provider', async () => {
    // setup
    const provider = UnlockProviders.passphrase('multi-algo');
    const { vault } = createTestVault(provider);

    await provider.withGrant(async (grant) => {
      // Generate one of each algo
      const ed = await vault.generator(grant).generate(Algos.Ed25519);
      const sec = await vault.generator(grant).generate(Algos.Secp256k1);
      expect(ed.ok).toBe(true);
      expect(sec.ok).toBe(true);
      if (!ed.ok || !sec.ok) return;

      const data = new TextEncoder().encode('multi-algo test');
      const store = vault.keyStore(grant);

      // method under test: both resolvable and produce valid signatures
      const edResult = await store.resolve(ed.value.publicKey);
      expect(edResult.ok).toBe(true);
      if (edResult.ok) {
        const sig = await edResult.value.withSigner(async (s) => s.signBytes(data));
        expect(Signers.verify(toCESRPublicKey(ed.value.publicKey), sig, data)).toBe(true);
      }

      const secResult = await store.resolve(sec.value.publicKey);
      expect(secResult.ok).toBe(true);
      if (secResult.ok) {
        const sig = await secResult.value.withSigner(async (s) => s.signBytes(data));
        expect(Signers.verify(toCESRPublicKey(sec.value.publicKey), sig, data)).toBe(true);
      }
    });
  });

  // Scenario 7: External KeyStore alongside vault (Keychain)
  test('scenario 7: keychain with vault + external store', async () => {
    // setup
    const provider = UnlockProviders.passphrase('keychain-test');
    const { vault } = createTestVault(provider);
    const externalStore = FakeHsmKeyStores.create();
    const genResult = await externalStore.generate('ed25519');
    if (!genResult.ok) throw new Error('gen failed');
    const externalKey = genResult.value;

    await provider.withGrant(async (grant) => {
      // Generate vault key
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) return;
      const vaultKey = genResult.value;

      // Register both stores on keychain
      const keychain = Keychains.create();
      keychain.register(vault.keyStore(grant), vault.generator(grant));
      keychain.register(externalStore, externalStore);

      const data = new TextEncoder().encode('keychain dispatch');

      // method under test: resolve vault key through keychain
      const vaultResult = await keychain.resolve(vaultKey.publicKey);
      expect(vaultResult.ok).toBe(true);
      if (vaultResult.ok) {
        const sig = await vaultResult.value.withSigner(async (s) => s.signBytes(data));
        expect(Signers.verify(toCESRPublicKey(vaultKey.publicKey), sig, data)).toBe(true);
      }

      // method under test: resolve external key through keychain
      const extResult = await keychain.resolve(externalKey.publicKey);
      expect(extResult.ok).toBe(true);
      if (extResult.ok) {
        const sig = await extResult.value.withSigner(async (s) => s.signBytes(data));
        expect(Signers.verify(toCESRPublicKey(externalKey.publicKey), sig, data)).toBe(true);
      }
    });
  });

  // Scenario 8: Login lifecycle — grant produces session material, grant closes
  test('scenario 8: login lifecycle — session material outlives grant', async () => {
    // setup
    const provider = UnlockProviders.passphrase('login');
    const { vault } = createTestVault(provider);

    // Generate key first
    const publicKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // method under test: login lifecycle — extract X25519 pub, grant closes
    const sessionMaterial = await provider.withGrant(async (grant) => {
      const result = await vault.keyStore(grant).resolve(publicKey);
      if (!result.ok) throw new Error(result.error.kind);

      return result.value.withSigner(async (signer) => {
        expect(isEd25519Signer(signer)).toBe(true);
        if (!isEd25519Signer(signer)) throw new Error('expected ed25519');
        const x25519Pub = await signer.getX25519PublicKey();
        return { x25519Pub };
      });
    });
    // Grant is closed now

    // assertions: session material accessible after grant closes
    expect(sessionMaterial.x25519Pub).toBeInstanceOf(Uint8Array);
    expect(sessionMaterial.x25519Pub.length).toBe(32);
  });

  // Scenario 9: Protected action lifecycle — one-shot signing
  test('scenario 9: protected action lifecycle — one-shot signing', async () => {
    // setup
    const provider = UnlockProviders.passphrase('protected');
    const { vault } = createTestVault(provider);

    const publicKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    const data = new TextEncoder().encode('KEL event bytes');

    // method under test: one-shot signing in a fresh grant
    const sig = await provider.withGrant(async (grant) => {
      const result = await vault.keyStore(grant).resolve(publicKey);
      if (!result.ok) throw new Error(result.error.kind);
      return result.value.withSigner(async (signer) => signer.signBytes(data));
    });

    // assertions: signature valid after grant closed
    expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
  });

  // Scenario 10: Digest lookup
  test('scenario 10: lookupByDigest finds key by its next-key commitment digest', async () => {
    // setup
    const provider = UnlockProviders.passphrase('digest');
    const { vault } = createTestVault(provider);

    const publicKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // the KERI n[] commitment of the key (Blake3 of its qb64)
    const expectedDigest = digestVerfer(toCESRPublicKey(publicKey));

    // method under test
    const found = await vault.lookupByDigest(expectedDigest);

    // assertions
    expect(found).toBeDefined();
    expect(found).toEqual(publicKey);

    // Verify it's resolvable through the vault
    await provider.withGrant(async (grant) => {
      const result = await vault.keyStore(grant).resolve(found!);
      expect(result.ok).toBe(true);
    });
  });

  // Scenario 11: Key agreement (two-party ECDH)
  test('scenario 11: two-party ECDH — derived keys match', async () => {
    // setup
    const provider = UnlockProviders.passphrase('ecdh');
    const { vault } = createTestVault(provider);

    // Generate Alice and Bob keys
    const [aliceKey, bobKey] = await provider.withGrant(async (grant) => {
      const a = await vault.generator(grant).generate(Algos.Ed25519);
      const b = await vault.generator(grant).generate(Algos.Ed25519);
      if (!a.ok || !b.ok) throw new Error('gen failed');
      return [a.value.publicKey, b.value.publicKey] as const;
    });

    await provider.withGrant(async (grant) => {
      const store = vault.keyStore(grant);

      // Get X25519 public keys
      const aliceResult = await store.resolve(aliceKey);
      const bobResult = await store.resolve(bobKey);
      if (!aliceResult.ok || !bobResult.ok) throw new Error('resolve failed');

      const aliceX25519Pub = await aliceResult.value.withSigner(async (s) => {
        if (!isEd25519Signer(s)) throw new Error('expected ed25519');
        return s.getX25519PublicKey();
      });
      const bobX25519Pub = await bobResult.value.withSigner(async (s) => {
        if (!isEd25519Signer(s)) throw new Error('expected ed25519');
        return s.getX25519PublicKey();
      });

      const salt = new Uint8Array(16);
      const info = new TextEncoder().encode('test-ecdh');

      // method under test: Alice derives with Bob's pub, Bob derives with Alice's pub
      const aliceResolve2 = await store.resolve(aliceKey);
      const bobResolve2 = await store.resolve(bobKey);
      if (!aliceResolve2.ok || !bobResolve2.ok) throw new Error('resolve2 failed');

      const aliceDerived = await aliceResolve2.value.withSigner(async (s) => {
        if (!isEd25519Signer(s)) throw new Error('expected ed25519');
        return s.deriveX25519HkdfBlake3Key({ peerPublicKey: bobX25519Pub, salt, info, length: 32 });
      });
      const bobDerived = await bobResolve2.value.withSigner(async (s) => {
        if (!isEd25519Signer(s)) throw new Error('expected ed25519');
        return s.deriveX25519HkdfBlake3Key({ peerPublicKey: aliceX25519Pub, salt, info, length: 32 });
      });

      // assertions: both derive the same shared key
      expect(aliceDerived).toEqual(bobDerived);
      expect(aliceDerived.length).toBe(32);
    });
  });

  // Scenario 12: Generate with unregistered algo returns algo-not-supported
  test('scenario 12: unregistered algo returns algo-not-supported', async () => {
    // setup: vault with NO algos registered
    const provider = UnlockProviders.fixed(new Uint8Array(32));
    const vault = Vaults.create({
      providers: [provider],
      defaultProvider: provider,
      algos: [],
      persistence: KeyPersistences.inMemory(),
      encryption: EncryptionPlugins.xor(),
    });

    await provider.withGrant(async (grant) => {
      // method under test: generate with unregistered algo
      const result = await vault.generator(grant).generate(Algos.Ed25519);

      // assertions
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('algo-not-supported');
      }
    });

    // A second vault WITH algos registered succeeds
    const vault2 = Vaults.create({
      providers: [provider],
      defaultProvider: provider,
      algos: [AlgoPlugins.ed25519()],
      persistence: KeyPersistences.inMemory(),
      encryption: EncryptionPlugins.xor(),
    });
    await provider.withGrant(async (grant) => {
      const result = await vault2.generator(grant).generate(Algos.Ed25519);
      expect(result.ok).toBe(true);
    });
  });

  // Scenario 13: Account creation lifecycle — generate keys, close grant, re-open
  test('scenario 13: account creation lifecycle — generate, close, re-open', async () => {
    // setup
    const provider = UnlockProviders.passphrase('new-account');
    const { vault } = createTestVault(provider);

    // method under test: generate keys in grant scope
    const keys = await provider.withGrant(async (grant) => {
      const result = await vault.generator(grant).generateBatch(Algos.Ed25519, 3);
      if (!result.ok) throw new Error('gen failed');
      return result.value;
    });
    // Grant closed

    // assertions: 3 keys generated
    expect(keys.length).toBe(3);

    // assertions: all keys route to the correct provider
    for (const key of keys) {
      const p = await vault.getProviderForKey(key.publicKey);
      expect(p).toBe(provider);
    }

    // assertions: re-opening grant with same provider resolves all keys
    await provider.withGrant(async (grant) => {
      const store = vault.keyStore(grant);
      for (const key of keys) {
        const result = await store.resolve(key.publicKey);
        expect(result.ok).toBe(true);
      }
    });
  });

  // Smoke test: Vaults.withDefaults() — batteries-included convenience factory
  test('Vaults.withDefaults() generates and signs without manual plugin registration', async () => {
    // setup: withDefaults() registers ed25519 + secp256k1, AES-GCM, in-memory persistence
    const provider = UnlockProviders.passphrase('smoke-test');
    const vault = Vaults.withDefaults(provider);

    await provider.withGrant(async (grant) => {
      // method under test: generate and sign with default plugins
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      expect(genResult.ok).toBe(true);
      if (!genResult.ok) return;

      const data = new TextEncoder().encode('Vaults.withDefaults smoke');
      const result = await vault.keyStore(grant).resolve(genResult.value.publicKey);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const sig = await result.value.withSigner(async (s) => s.signBytes(data));
      // assertions: signature verifies
      expect(Signers.verify(toCESRPublicKey(genResult.value.publicKey), sig, data)).toBe(true);
    });
  });

  // Smoke test: Vaults.withPersistence() — custom persistence, default plugins
  test('Vaults.withPersistence() uses provided persistence', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();
    const provider = UnlockProviders.passphrase('persistence-smoke');
    const vault = Vaults.withPersistence(provider, persistence);

    await provider.withGrant(async (grant) => {
      await vault.generator(grant).generate(Algos.Ed25519);
    });

    // assertions: key was stored in the provided persistence
    const entries = await persistence.list();
    expect(entries.length).toBe(1);
  });

  // Keychain.hasKey — checks all registered stores
  test('keychain.hasKey checks across all registered stores', async () => {
    // setup: vault key + external key
    const provider = UnlockProviders.passphrase('keychain-haskey');
    const { vault } = createTestVault(provider);
    const externalStore = FakeHsmKeyStores.create();
    const extGen = await externalStore.generate('ed25519');
    if (!extGen.ok) throw new Error('gen failed');

    const vaultKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    const keychain = Keychains.create();
    await provider.withGrant(async (grant) => {
      keychain.register(vault.keyStore(grant));
    });
    keychain.register(externalStore);

    // method under test
    expect(await keychain.hasKey(vaultKey)).toBe(true);
    expect(await keychain.hasKey(extGen.value.publicKey)).toBe(true);
    expect(await keychain.hasKey(asRawPublicKey(new Uint8Array(32)))).toBe(false);
  });

  // Scenario: vault.hasKey without grant
  test('vault.hasKey checks key existence without requiring a grant', async () => {
    // setup
    const provider = UnlockProviders.passphrase('has-key-test');
    const { vault } = createTestVault(provider);

    const publicKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // method under test: hasKey on vault directly, no grant needed
    expect(await vault.hasKey(publicKey)).toBe(true);
    expect(await vault.hasKey(asRawPublicKey(new Uint8Array(32)))).toBe(false);
  });

  // Scenario 14: HKDF salt — same passphrase, different salts → different encryption keys
  test('scenario 14: same passphrase + different salt → keys not cross-resolvable', async () => {
    // setup: two vaults sharing the same persistence (simulates shared storage)
    const persistence = KeyPersistences.inMemory();
    const provider = UnlockProviders.passphrase('shared-passphrase');
    const vaultA = Vaults.create({
      providers: [provider],
      defaultProvider: provider,
      algos: [AlgoPlugins.ed25519()],
      persistence,
      encryption: EncryptionPlugins.aesGcm(),
    });
    const vaultB = Vaults.create({
      providers: [provider],
      defaultProvider: provider,
      algos: [AlgoPlugins.ed25519()],
      persistence,
      encryption: EncryptionPlugins.aesGcm(),
    });

    const saltAlice = new TextEncoder().encode('profile-alice-uuid');
    const saltBob = new TextEncoder().encode('profile-bob-uuid');

    // Generate key with Alice's salt
    const aliceKey = await provider.withGrant({ salt: saltAlice }, async (grant) => {
      const r = await vaultA.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // method under test: resolve with Alice's salt succeeds
    const aliceResult = await provider.withGrant({ salt: saltAlice }, async (grant) => {
      return vaultA.keyStore(grant).resolve(aliceKey);
    });
    expect(aliceResult.ok).toBe(true);

    // method under test: resolve with Bob's salt fails (wrong encryption key → AES-GCM auth failure)
    const bobResult = await provider.withGrant({ salt: saltBob }, async (grant) => {
      return vaultB.keyStore(grant).resolve(aliceKey);
    });
    expect(bobResult.ok).toBe(false);
    if (!bobResult.ok) {
      expect(bobResult.error.kind).toBe('wrong-secret');
    }
  });

  // Scenario 15: HKDF salt — same salt round-trips correctly
  test('scenario 15: salt round-trip — generate with salt, resolve with same salt', async () => {
    // setup
    const provider = UnlockProviders.passphrase('salted');
    const { vault } = createTestVault(provider);
    const salt = new TextEncoder().encode('my-profile-id');

    // Generate with salt
    const publicKey = await provider.withGrant({ salt }, async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // method under test: sign with same salt
    const data = new TextEncoder().encode('salted signing');
    const sig = await provider.withGrant({ salt }, async (grant) => {
      const result = await vault.keyStore(grant).resolve(publicKey);
      if (!result.ok) throw new Error(result.error.kind);
      return result.value.withSigner(async (s) => s.signBytes(data));
    });

    // assertions
    expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
  });

  // Scenario 16: Memory zeroing — private key zeroed after withSigner callback completes
  test('scenario 16: private key zeroed after withSigner completes', async () => {
    // setup
    const persistence = KeyPersistences.inMemory();
    const fixedSecret = new Uint8Array(32).fill(0x42);
    const provider = UnlockProviders.fixed(fixedSecret);
    const { vault } = createTestVault(provider, persistence);

    const publicKey = await provider.withGrant(async (grant) => {
      const r = await vault.generator(grant).generate(Algos.Ed25519);
      if (!r.ok) throw new Error('gen failed');
      return r.value.publicKey;
    });

    // method under test: capture signer reference, verify key is zeroed after callback
    let capturedSigner: { signBytes(data: Uint8Array): Promise<any> } | undefined;
    await provider.withGrant(async (grant) => {
      const result = await vault.keyStore(grant).resolve(publicKey);
      if (!result.ok) throw new Error(result.error.kind);

      await result.value.withSigner(async (signer) => {
        // Signing works inside the callback
        const data = new TextEncoder().encode('before zero');
        const sig = await signer.signBytes(data);
        expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(true);
        capturedSigner = signer;
      });
    });

    // assertions: signer captured outside callback produces invalid signatures (key is zeroed)
    expect(capturedSigner).toBeDefined();
    const data = new TextEncoder().encode('after zero');
    const sig = await capturedSigner!.signBytes(data);
    expect(Signers.verify(toCESRPublicKey(publicKey), sig, data)).toBe(false);
  });

  test('vault signer produces CESR signBytes verifiable via Signers.verify', async () => {
    // setup: create vault and generate ed25519 key
    const provider = UnlockProviders.passphrase('cesr-native');
    const { vault } = createTestVault(provider);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) throw new Error('gen failed');
      const { publicKey } = genResult.value;

      const resolveResult = await vault.keyStore(grant).resolve(publicKey);
      if (!resolveResult.ok) throw new Error('resolve failed');

      const data = new TextEncoder().encode('cesr native test');

      // method under test
      const sig = await resolveResult.value.withSigner(async (signer) => {
        expect(signer.algo).toBe('ed25519');
        expect(isEd25519Signer(signer)).toBe(true);
        return signer.signBytes(data);
      });

      // assertions
      const cesrPub = toCESRPublicKey(publicKey);
      expect(Signers.verify(cesrPub, sig, data)).toBe(true);
    });
  });

  test('vault secp256k1 signer produces CESR signBytes', async () => {
    // setup: create vault and generate secp256k1 key
    const provider = UnlockProviders.passphrase('secp-cesr');
    const { vault } = createTestVault(provider);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Secp256k1);
      if (!genResult.ok) throw new Error('gen failed');
      const { publicKey } = genResult.value;

      const resolveResult = await vault.keyStore(grant).resolve(publicKey);
      if (!resolveResult.ok) throw new Error('resolve failed');

      const data = new TextEncoder().encode('secp cesr test');

      // method under test
      const sig = await resolveResult.value.withSigner(async (signer) => {
        expect(signer.algo).toBe('secp256k1');
        expect(isSecp256k1Signer(signer)).toBe(true);
        return signer.signBytes(data);
      });

      // assertions
      const cesrPub = toCESRPublicKey(publicKey);
      expect(Signers.verify(cesrPub, sig, data)).toBe(true);
    });
  });

  test('vault withEd25519Signer returns ok for ed25519 key', async () => {
    // setup: create vault and generate ed25519 key
    const provider = UnlockProviders.passphrase('typed-ed');
    const { vault } = createTestVault(provider);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Ed25519);
      if (!genResult.ok) throw new Error('gen failed');

      const resolveResult = await vault.keyStore(grant).resolve(genResult.value.publicKey);
      if (!resolveResult.ok) throw new Error('resolve failed');

      // method under test
      const result = await resolveResult.value.withEd25519Signer(async (signer) => {
        const x25519Pub = await signer.getX25519PublicKey();
        return x25519Pub.length;
      });

      // assertions
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe(32);
    });
  });

  test('vault withEd25519Signer returns unexpected-algo for secp256k1 key', async () => {
    // setup: create vault and generate secp256k1 key
    const provider = UnlockProviders.passphrase('typed-sec');
    const { vault } = createTestVault(provider);

    await provider.withGrant(async (grant) => {
      const genResult = await vault.generator(grant).generate(Algos.Secp256k1);
      if (!genResult.ok) throw new Error('gen failed');

      const resolveResult = await vault.keyStore(grant).resolve(genResult.value.publicKey);
      if (!resolveResult.ok) throw new Error('resolve failed');

      // method under test
      const result = await resolveResult.value.withEd25519Signer(async () => 'should not reach');

      // assertions
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('unexpected-algo');
        expect(result.error.expected).toBe('ed25519');
        expect(result.error.actual).toBe('secp256k1');
      }
    });
  });
});

/** XOR plugin that counts decrypt calls. */
function countingXor(): { plugin: EncryptionPlugin; decrypts: () => number } {
  const inner = EncryptionPlugins.xor();
  let count = 0;
  return {
    plugin: {
      encrypt: inner.encrypt,
      async decrypt(secret, ciphertext, iv) {
        count++;
        return inner.decrypt(secret, ciphertext, iv);
      },
    },
    decrypts: () => count,
  };
}

/** Provider stamping `ref` on grants carrying an arbitrary `secret` (ref and secret deliberately decoupled). */
function providerWith(ref: UnlockRef, secret: Uint8Array): UnlockProvider {
  return {
    ref,
    withGrant<A>(
      optionsOrFn: WithGrantOptions | ((grant: Grant) => Promise<A>),
      maybeFn?: (grant: Grant) => Promise<A>,
    ): Promise<A> {
      const [options, fn] = typeof optionsOrFn === 'function' ? [{}, optionsOrFn] : [optionsOrFn, maybeFn!];
      return fn({ ref, secret, salt: options.salt });
    },
  };
}

async function generateUnder(vault: Vault, provider: UnlockProvider): Promise<RawPublicKey> {
  return provider.withGrant(async (grant) => {
    const r = await vault.generator(grant).generate(Algos.Ed25519);
    if (!r.ok) throw new Error('gen failed');
    return r.value.publicKey;
  });
}

describe('Vault UnlockRef matching', () => {
  test('a grant for another passphrase gets wrong-unlock before any decrypt', async () => {
    // setup: keys A and B under different passphrases in one vault, counting decrypts
    const a = UnlockProviders.passphrase('a');
    const b = UnlockProviders.passphrase('b');
    const { plugin, decrypts } = countingXor();
    const vault = Vaults.create({ providers: [a, b], defaultProvider: a, encryption: plugin });
    await generateUnder(vault, a);
    const keyB = await generateUnder(vault, b);

    // call out our method under test
    const result = await a.withGrant((grant) => vault.keyStore(grant).resolve(keyB));

    // assertions: typed wrong-unlock naming both refs; the cipher was never touched
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual({ kind: 'wrong-unlock', publicKey: keyB, expected: b.ref, actual: a.ref });
    }
    expect(decrypts()).toBe(0);
  });

  test('right ref, wrong secret → wrong-secret', async () => {
    // setup: key A under passphrase 'a' with AES-GCM; impostor has A's ref but other secret bytes
    const a = UnlockProviders.passphrase('a');
    const vault = Vaults.create({ providers: [a], defaultProvider: a, encryption: EncryptionPlugins.aesGcm() });
    const keyA = await generateUnder(vault, a);
    const impostor = providerWith(a.ref, new Uint8Array(32).fill(0x07));

    // call out our method under test
    const result = await impostor.withGrant((grant) => vault.keyStore(grant).resolve(keyA));
    const exported = await impostor.withGrant((grant) => vault.keyStore(grant).exportKeyPair!(keyA));

    // assertions: authentication failure is reported as wrong-secret for A's ref
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toEqual({ kind: 'wrong-secret', publicKey: keyA, ref: a.ref });
    expect(exported.ok).toBe(false);
    if (!exported.ok) expect(exported.error).toEqual({ kind: 'wrong-secret', publicKey: keyA, ref: a.ref });
  });

  test('getProviderForKey matches by ref equality', async () => {
    // setup: passphrase 'a' built twice (two instances); key B under 'b' (not registered)
    const a1 = UnlockProviders.passphrase('a');
    const a2 = UnlockProviders.passphrase('a');
    const b = UnlockProviders.passphrase('b');
    const vault = Vaults.create({ providers: [a1], defaultProvider: a1, encryption: EncryptionPlugins.xor() });
    vault.registerProvider(a2);
    const keyA = await generateUnder(vault, a1);
    const keyB = await generateUnder(vault, b);

    // call out our method under test
    const forA = await vault.getProviderForKey(keyA);
    const forB = await vault.getProviderForKey(keyB);

    // assertions: an equal-ref instance is found for A; nothing registered for B
    expect(forA === a1 || forA === a2).toBe(true);
    expect(forB).toBeUndefined();
  });

  test('registerProvider replaces a provider with an equal ref', async () => {
    // setup
    const a1 = UnlockProviders.passphrase('a');
    const a2 = UnlockProviders.passphrase('a');
    const vault = Vaults.create({ providers: [a1], defaultProvider: a1, encryption: EncryptionPlugins.xor() });
    const keyA = await generateUnder(vault, a1);

    // call out our method under test
    vault.registerProvider(a2);

    // assertions: the newer instance wins
    expect(await vault.getProviderForKey(keyA)).toBe(a2);
  });

  test('getProviderForKey skips a provider whose ref getter throws', async () => {
    // setup: a registered provider with no ref yet (e.g. passkey before its credential exists)
    const a = UnlockProviders.passphrase('a');
    const pending: UnlockProvider = {
      get ref(): UnlockRef {
        throw new Error('no credential yet');
      },
      withGrant: a.withGrant,
    };
    const vault = Vaults.create({ providers: [a], defaultProvider: a, encryption: EncryptionPlugins.xor() });
    vault.registerProvider(pending);
    const keyA = await generateUnder(vault, a);

    // call out our method under test
    const found = await vault.getProviderForKey(keyA);

    // assertions
    expect(found).toBe(a);
  });

  test('resolveProviderForKey calls the mechanism resolver and does not register', async () => {
    // setup: key B under 'b'; passphrase resolver records calls
    const a = UnlockProviders.passphrase('a');
    const b = UnlockProviders.passphrase('b');
    const calls: [UnlockRef, { readonly profileId: string }][] = [];
    const vault = Vaults.create({
      providers: [a],
      defaultProvider: a,
      encryption: EncryptionPlugins.xor(),
      resolvers: {
        passphrase: async (ref, context) => {
          calls.push([ref, context]);
          return UnlockProviders.passphrase('b');
        },
      },
    });
    const keyB = await generateUnder(vault, b);

    // call out our method under test
    const result = await vault.resolveProviderForKey(keyB, { profileId: 'p-ben' });

    // assertions: ok, resolver called once with (refB, context), registry untouched
    expect(result.ok).toBe(true);
    expect(calls).toEqual([[b.ref, { profileId: 'p-ben' }]]);
    expect(await vault.getProviderForKey(keyB)).toBeUndefined();
  });

  test('resolveProviderForKey without a resolver → no-resolver naming the mechanism', async () => {
    // setup
    const a = UnlockProviders.passphrase('a');
    const vault = Vaults.create({ providers: [a], defaultProvider: a, encryption: EncryptionPlugins.xor() });
    const keyA = await generateUnder(vault, a);

    // call out our method under test
    const result = await vault.resolveProviderForKey(keyA, { profileId: 'p' });

    // assertions
    expect(result).toEqual({ ok: false, error: { kind: 'no-resolver', mechanism: 'passphrase' } });
  });

  test('resolveProviderForKey when the resolver returns undefined → resolver-declined', async () => {
    // setup
    const a = UnlockProviders.passphrase('a');
    const vault = Vaults.create({
      providers: [a],
      defaultProvider: a,
      encryption: EncryptionPlugins.xor(),
      resolvers: { passphrase: async () => undefined },
    });
    const keyA = await generateUnder(vault, a);

    // call out our method under test
    const result = await vault.resolveProviderForKey(keyA, { profileId: 'p' });

    // assertions
    expect(result).toEqual({ ok: false, error: { kind: 'resolver-declined', ref: a.ref } });
  });

  test('resolveProviderForKey for an unknown key → key-not-found', async () => {
    // setup
    const a = UnlockProviders.passphrase('a');
    const vault = Vaults.create({ providers: [a], defaultProvider: a, encryption: EncryptionPlugins.xor() });

    // call out our method under test
    const result = await vault.resolveProviderForKey(asRawPublicKey(new Uint8Array(32).fill(9)), { profileId: 'p' });

    // assertions
    expect(result).toEqual({ ok: false, error: { kind: 'key-not-found' } });
  });
});
