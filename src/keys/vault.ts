// packages/core/src/keys/vault.ts
import { ed25519 as ed25519Curve } from '@noble/curves/ed25519.js';
import { secp256k1 as secp256k1Curve } from '@noble/curves/secp256k1.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { digestVerfer } from '../cesr/digest.js';
import { encodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { SigAlgo } from '../cesr/types.js';
import type { KeriKeyPair, PublicKey, SAID, Signature, Timestamp } from '../common/types.js';
import { hkdfBlake3 } from '../crypto/hkdf.js';
import { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from '../crypto/x25519.js';
import type { Result } from '../result.js';
import { err, ok } from '../result.js';
import type { KeyAgreementInput } from '../signature/key-agreement.js';
import { MAX_HKDF_DERIVE_LENGTH } from '../signature/key-agreement.js';
import type { Ed25519Signer, Secp256k1Signer, Signer, UnexpectedAlgoError } from '../signature/signer.js';
import { isEd25519Signer } from '../signature/signer.js';
import { AlgoPlugins } from './algo-plugins.js';
import { EncryptionPlugins } from './encryption-plugins.js';
import { KeyPersistences } from './key-persistences.js';
import { asRawPublicKey, toCESRPublicKey } from './raw-public-key.js';
import type {
  Algo,
  AlgoPlugin,
  EncryptedKeyEntry,
  GeneratedKey,
  GenerateKeyError,
  Grant,
  KeyGenerator,
  KeyPersistence,
  KeyScope,
  KeyStore,
  RawPublicKey,
  ResolveKeyError,
  ResolveProviderError,
  UnlockProvider,
  UnlockResolver,
  UnlockResolvers,
  Vault,
  VaultConfig,
} from './types.js';
import type { UnlockRef } from './unlock-ref.js';
import { UnlockRefs } from './unlock-ref.js';

/** Next-key commitment digest (KERI n[] entry) of the key, so lookupByDigest resolves n[] digests. */
function computeDigest(publicKey: RawPublicKey): string {
  return digestVerfer(toCESRPublicKey(publicKey));
}

const VAULT_HKDF_INFO = new TextEncoder().encode('vault-key-encryption');

/** When grant has a salt, derive a per-identity encryption key. Otherwise use raw secret. */
function deriveEncryptionKey(grant: Grant): Uint8Array {
  if (!grant.salt || grant.salt.length === 0) return grant.secret;
  return hkdf(sha256, grant.secret, grant.salt, VAULT_HKDF_INFO, 32);
}

/** Provider's ref, or undefined when its getter throws (e.g. a passkey provider before its first credential). */
function refOf(provider: UnlockProvider): UnlockRef | undefined {
  try {
    return provider.ref;
  } catch {
    return undefined;
  }
}

function matchesRef(provider: UnlockProvider, ref: UnlockRef): boolean {
  const own = refOf(provider);
  return own !== undefined && UnlockRefs.equals(own, ref);
}

/** Exhaustive per mechanism; `unused` never resolves. */
function resolverFor(resolvers: UnlockResolvers, ref: UnlockRef): UnlockResolver | undefined {
  switch (ref.mechanism) {
    case 'passkey-prf':
      return resolvers['passkey-prf'];
    case 'passphrase':
      return resolvers.passphrase;
    case 'unused':
      return undefined;
    default: {
      const unknown: never = ref;
      throw new Error(`Unsupported unlock mechanism: ${JSON.stringify(unknown)}`);
    }
  }
}

function createVault(config: VaultConfig): Vault {
  const persistence = config.persistence ?? KeyPersistences.inMemory();
  const encryption = config.encryption ?? EncryptionPlugins.aesGcm();
  const algos = new Map<Algo, AlgoPlugin>(
    (config.algos ?? [AlgoPlugins.ed25519(), AlgoPlugins.secp256k1()]).map((p) => [p.algo, p]),
  );
  const resolvers = config.resolvers ?? {};
  const providers: UnlockProvider[] = [...config.providers];

  if (!providers.some((p) => matchesRef(p, config.defaultProvider.ref))) {
    throw new Error(
      `defaultProvider '${UnlockRefs.describe(config.defaultProvider.ref)}' is not in the providers list`,
    );
  }

  /** Decrypt the entry; any cipher failure means the grant's secret is wrong (ciphertext is our own). */
  async function decryptEntry(grant: Grant, entry: EncryptedKeyEntry): Promise<Result<Uint8Array, ResolveKeyError>> {
    if (!UnlockRefs.equals(entry.ref, grant.ref)) {
      return err({ kind: 'wrong-unlock', publicKey: entry.publicKey, expected: entry.ref, actual: grant.ref });
    }
    let encKey: Uint8Array;
    try {
      encKey = deriveEncryptionKey(grant);
    } catch (cause) {
      return err({ kind: 'store-error', storeId: 'vault', cause });
    }
    try {
      return ok(await encryption.decrypt(encKey, entry.encryptedPrivateKey, entry.iv));
    } catch {
      return err({ kind: 'wrong-secret', publicKey: entry.publicKey, ref: entry.ref });
    }
  }

  function makeSigner(publicKey: RawPublicKey, privateKey: Uint8Array, algo: Algo): Signer {
    const algoPlugin = algos.get(algo);
    if (!algoPlugin) throw new Error(`No plugin for algo '${algo}' — vault was constructed without it`);

    const cesrPub = toCESRPublicKey(publicKey);
    const textEncoder = new TextEncoder();

    const signBytes = async (data: Uint8Array): Promise<Signature> => {
      const rawSig = await algoPlugin.sign(data, privateKey);
      return encodeSig(rawSig, algo as SigAlgo).qb64 as Signature;
    };

    const signSaid = async (said: SAID): Promise<Signature> => {
      return signBytes(textEncoder.encode(said));
    };

    const exists = async (pk: PublicKey) => pk === cesrPub;

    if (algo === 'ed25519') {
      const signer: Ed25519Signer = {
        publicKey: cesrPub,
        algo: 'ed25519',
        exists,
        signBytes,
        signSaid,
        getX25519PublicKey: async () => {
          return ed25519ToX25519Public(ed25519Curve.getPublicKey(privateKey));
        },
        deriveX25519HkdfBlake3Key: async (input: KeyAgreementInput) => {
          if (input.peerPublicKey.length !== 32) {
            throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
          }
          if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
            throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
          }
          const x25519PrivateKey = ed25519ToX25519Private(privateKey);
          const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
          return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
        },
      };
      return signer;
    }

    if (algo === 'secp256k1') {
      const signer: Secp256k1Signer = {
        publicKey: cesrPub,
        algo: 'secp256k1',
        compressedPublicKey: publicKey as Uint8Array,
        exists,
        signBytes,
        signSaid,
        signDigest: async (digest: Uint8Array): Promise<Uint8Array> => {
          return secp256k1Curve.sign(digest, privateKey, { prehash: false });
        },
      };
      return signer;
    }

    // Generic algo — base Signer only
    return { publicKey: cesrPub, algo, exists, signBytes, signSaid };
  }

  function makeKeyStore(grant: Grant): KeyStore {
    return {
      id: 'vault',

      async hasKey(publicKey: RawPublicKey): Promise<boolean> {
        return (await persistence.lookup(publicKey)) !== undefined;
      },

      async resolve(publicKey: RawPublicKey): Promise<Result<KeyScope, ResolveKeyError>> {
        const entry = await persistence.lookup(publicKey);
        if (!entry) return err({ kind: 'key-not-found', publicKey });

        const decrypted = await decryptEntry(grant, entry);
        if (!decrypted.ok) return decrypted;
        const privateKey = decrypted.value;

        const withSignerFn = async <A>(fn: (signer: Signer) => Promise<A>): Promise<A> => {
          try {
            return await fn(makeSigner(publicKey, privateKey, entry.algo));
          } finally {
            privateKey.fill(0);
          }
        };

        return ok({
          withSigner: withSignerFn,
          withEd25519Signer: async <A>(
            fn: (signer: Ed25519Signer) => Promise<A>,
          ): Promise<Result<A, UnexpectedAlgoError>> => {
            return withSignerFn(async (signer) => {
              if (!isEd25519Signer(signer)) {
                return err({ kind: 'unexpected-algo' as const, expected: 'ed25519' as Algo, actual: signer.algo });
              }
              return ok(await fn(signer));
            });
          },
        });
      },

      // FIXME: TECH-DEBT — vault escape hatch for merits per-request signing.
      // Remove when merits moves to session tokens.
      async exportKeyPair(publicKey: RawPublicKey): Promise<Result<KeriKeyPair, ResolveKeyError>> {
        const entry = await persistence.lookup(publicKey);
        if (!entry) return err({ kind: 'key-not-found', publicKey });

        const decrypted = await decryptEntry(grant, entry);
        if (!decrypted.ok) return decrypted;
        const privateKey = decrypted.value;

        try {
          const pair: KeriKeyPair = {
            publicKey: encodeKey(publicKey as Uint8Array, true, entry.algo === 'secp256k1' ? 'secp256k1' : 'ed25519')
              .qb64,
            privateKey: encodeKey(privateKey, true).qb64,
            transferable: true,
            algo: entry.algo as KeriKeyPair['algo'],
          };
          return ok(pair);
        } catch (cause) {
          return err({ kind: 'store-error', storeId: 'vault', cause });
        }
      },
    };
  }

  function makeGenerator(grant: Grant): KeyGenerator {
    const supportedAlgos = (): Set<Algo> => new Set(algos.keys());

    async function generate(algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>> {
      const plugin = algos.get(algo);
      if (!plugin) return err({ kind: 'algo-not-supported', algo });

      const { publicKey: pubBytes, privateKey } = plugin.generateKeypair();
      return storeEncryptedKey(grant, asRawPublicKey(pubBytes), privateKey, algo);
    }

    return {
      id: 'vault',
      supports() {
        return supportedAlgos();
      },
      generate,

      async generateBatch(algo: Algo, count: number): Promise<Result<readonly GeneratedKey[], GenerateKeyError>> {
        const plugin = algos.get(algo);
        if (!plugin) return err({ kind: 'algo-not-supported', algo });
        if (count === 0) return ok([]);

        const pairs: { publicKey: RawPublicKey; privateKey: Uint8Array; algo: Algo }[] = [];
        for (let i = 0; i < count; i++) {
          const { publicKey, privateKey } = plugin.generateKeypair();
          pairs.push({ publicKey: asRawPublicKey(publicKey), privateKey, algo });
        }
        return storeEncryptedKeys(grant, pairs);
      },
    };
  }

  async function storeEncryptedKey(
    grant: Grant,
    publicKey: RawPublicKey,
    privateKey: Uint8Array,
    algo: Algo,
  ): Promise<Result<GeneratedKey, GenerateKeyError>> {
    const stored = await storeEncryptedKeys(grant, [{ publicKey, privateKey, algo }]);
    if (!stored.ok) return stored;
    return ok(stored.value[0]!);
  }

  async function storeEncryptedKeys(
    grant: Grant,
    pairs: readonly { publicKey: RawPublicKey; privateKey: Uint8Array; algo: Algo }[],
  ): Promise<Result<readonly GeneratedKey[], GenerateKeyError>> {
    const fresh: EncryptedKeyEntry[] = [];
    const out: GeneratedKey[] = [];
    const encKey = pairs.length > 0 ? deriveEncryptionKey(grant) : undefined;
    for (const pair of pairs) {
      const existing = await persistence.lookup(pair.publicKey);
      if (existing) {
        out.push({ publicKey: pair.publicKey, algo: pair.algo });
        continue;
      }
      const { ciphertext, iv } = await encryption.encrypt(encKey!, pair.privateKey);
      fresh.push({
        publicKey: pair.publicKey,
        algo: pair.algo,
        encryptedPrivateKey: ciphertext,
        iv,
        ref: grant.ref,
        publicKeyDigest: computeDigest(pair.publicKey),
        createdAt: new Date().toISOString() as Timestamp,
      });
      out.push({ publicKey: pair.publicKey, algo: pair.algo });
    }
    if (fresh.length > 0) await persistence.storeMany(fresh);
    return ok(out);
  }

  async function importKey(
    grant: Grant,
    privateKey: Uint8Array,
    algo: Algo,
  ): Promise<Result<GeneratedKey, GenerateKeyError>> {
    const plugin = algos.get(algo);
    if (!plugin) return err({ kind: 'algo-not-supported', algo });

    let pubBytes: Uint8Array;
    if (algo === 'ed25519') {
      pubBytes = ed25519Curve.getPublicKey(privateKey);
    } else if (algo === 'secp256k1') {
      pubBytes = secp256k1Curve.getPublicKey(privateKey, true);
    } else {
      return err({ kind: 'algo-not-supported', algo });
    }

    return storeEncryptedKey(grant, asRawPublicKey(pubBytes), privateKey, algo);
  }

  return {
    defaultProvider: config.defaultProvider,

    async hasKey(publicKey: RawPublicKey) {
      return (await persistence.lookup(publicKey)) !== undefined;
    },

    async getProviderForKey(publicKey: RawPublicKey) {
      const entry = await persistence.lookup(publicKey);
      if (!entry) return undefined;
      return providers.find((p) => matchesRef(p, entry.ref));
    },

    async resolveProviderForKey(
      publicKey: RawPublicKey,
      context: { readonly profileId: string },
    ): Promise<Result<UnlockProvider, ResolveProviderError>> {
      const entry = await persistence.lookup(publicKey);
      if (!entry) return err({ kind: 'key-not-found' });
      const resolver = resolverFor(resolvers, entry.ref);
      if (!resolver) return err({ kind: 'no-resolver', mechanism: entry.ref.mechanism });
      const provider = await resolver(entry.ref, context);
      return provider ? ok(provider) : err({ kind: 'resolver-declined', ref: entry.ref });
    },

    async describeKey(publicKey: RawPublicKey) {
      const entry = await persistence.lookup(publicKey);
      if (!entry) return undefined;
      return {
        ref: entry.ref,
        algo: entry.algo,
        publicKeyDigest: entry.publicKeyDigest,
      };
    },

    registerProvider(provider: UnlockProvider) {
      const ref = refOf(provider);
      const i = ref === undefined ? -1 : providers.findIndex((p) => matchesRef(p, ref));
      if (i >= 0) providers[i] = provider;
      else providers.push(provider);
    },

    async lookupByDigest(digest: string) {
      return persistence.lookupByDigest(digest);
    },

    keyStore(grant: Grant) {
      return makeKeyStore(grant);
    },

    generator(grant: Grant) {
      return makeGenerator(grant);
    },

    importKey,
  };
}

export namespace Vaults {
  /** Full control — caller specifies everything. */
  export function create(config: VaultConfig): Vault {
    return createVault(config);
  }

  /** Convenience: single provider, batteries-included (ed25519 + secp256k1, AES-GCM, in-memory). */
  export function withDefaults(provider: UnlockProvider): Vault {
    return createVault({
      providers: [provider],
      defaultProvider: provider,
    });
  }

  /** Convenience: single provider + custom persistence, batteries-included (ed25519 + secp256k1, AES-GCM). */
  export function withPersistence(provider: UnlockProvider, persistence: KeyPersistence): Vault {
    return createVault({
      providers: [provider],
      defaultProvider: provider,
      persistence,
    });
  }
}
