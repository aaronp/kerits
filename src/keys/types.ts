import type { Brand } from '../common/brand.js';
import type { KeriKeyPair, Timestamp } from '../common/types.js';
import type { Result } from '../result.js';
import type { Ed25519Signer, Signer, UnexpectedAlgoError } from '../signature/signer.js';

/**
 * Raw public key bytes. 32 bytes for ed25519, 33 bytes for secp256k1 (compressed).
 */
export type RawPublicKey = Brand<'RawPublicKey', Uint8Array>;

import type { Algo as _Algo } from '../common/algo.js';

export type { Algo } from '../common/algo.js';
export { Algos } from '../common/algo.js';

// Local alias so the type is available within this file.
type Algo = _Algo;

/** Opaque provider identifier — e.g. 'passphrase:ab1234cd', 'passkey:abc123'. Core stores and compares, never interprets. */
export type UnlockProviderId = Brand<'UnlockProviderId', string>;

/**
 * Decryption material for vault-stored keys, scoped to a single withGrant callback.
 * The secret is the raw key used by EncryptionPlugin to decrypt private keys.
 * External key stores ignore the grant entirely.
 *
 * When `salt` is provided, the vault derives the actual encryption key via
 * HKDF-SHA256(secret, salt, "vault-key-encryption", 32) before passing to the
 * EncryptionPlugin. This ensures different wallets using the same passphrase
 * get different encryption keys. SDK passes **walletSeed** bytes as salt
 * (shared by all Profiles in a wallet).
 */
export type Grant = {
  readonly unlockProviderId: UnlockProviderId;
  readonly secret: Uint8Array;
  /** Wallet-scoped salt for HKDF key derivation. When present, vault derives encryption key from secret + salt. */
  readonly salt?: Uint8Array;
};

/** Options for withGrant — salt is the wallet-scoped HKDF salt (walletSeed bytes). */
export type WithGrantOptions = {
  /** Wallet-scoped salt. Included on the Grant so the vault derives a unique encryption key. */
  readonly salt?: Uint8Array;
};

/**
 * Produces short-lived Grants via a challenge/unlock mechanism.
 * The grant (and its secret) only exist within the withGrant callback — no escape hatch.
 * Platform packages implement concrete providers (passkey PRF, iOS Keychain, etc.).
 */
export type UnlockProvider = {
  readonly id: UnlockProviderId;
  withGrant<A>(fn: (grant: Grant) => Promise<A>): Promise<A>;
  withGrant<A>(options: WithGrantOptions, fn: (grant: Grant) => Promise<A>): Promise<A>;
};

/**
 * Pluggable algorithm support. Each plugin provides key generation and signing for one algorithm.
 * The vault dispatches to the appropriate plugin based on the algo tag stored with each key.
 */
export type AlgoPlugin = {
  readonly algo: Algo;
  /** Expected byte length of public keys for this algorithm (32 for ed25519, 33 for compressed secp256k1). */
  readonly publicKeyLength: number;
  generateKeypair(): { publicKey: Uint8Array; privateKey: Uint8Array };
  /** Returns raw fixed-length signature bytes. ed25519: 64 bytes. secp256k1: 64 bytes compact (r, s). */
  sign(data: Uint8Array, privateKey: Uint8Array): Uint8Array | Promise<Uint8Array>;
};

/**
 * Encrypted key entry stored by the vault. The private key is encrypted with the grant secret
 * via EncryptionPlugin and tagged with the UnlockProviderId that produced the grant.
 * The vault never stores plaintext private keys.
 */
export type EncryptedKeyEntry = {
  readonly publicKey: RawPublicKey;
  readonly algo: Algo;
  readonly encryptedPrivateKey: Uint8Array;
  /** Initialization vector used by EncryptionPlugin. Stored alongside ciphertext for decryption. */
  readonly iv: Uint8Array;
  /** Which UnlockProvider's grant was used to encrypt this key. Used to route re-auth challenges. */
  readonly unlockProviderId: UnlockProviderId;
  /** Blake3 hash of publicKey bytes, hex-encoded. Always computed by generator at key creation time. */
  readonly publicKeyDigest: string;
  readonly createdAt: Timestamp;
};

/**
 * Thin storage interface for encrypted key entries. No business logic, no decryption.
 * No delete — key retirement is a future concern.
 */
export type KeyPersistence = {
  store(entry: EncryptedKeyEntry): Promise<void>;
  /** One write for every entry. Empty is a no-op. */
  storeMany(entries: readonly EncryptedKeyEntry[]): Promise<void>;
  lookup(publicKey: RawPublicKey): Promise<EncryptedKeyEntry | undefined>;
  lookupByDigest(digest: string): Promise<RawPublicKey | undefined>;
  list(): Promise<readonly EncryptedKeyEntry[]>;
};

/**
 * Injected encrypt/decrypt — keeps the vault decoupled from any specific cipher.
 * Tests use XOR (inspectable bytes). Production uses AES-256-GCM.
 */
export type EncryptionPlugin = {
  encrypt(secret: Uint8Array, plaintext: Uint8Array): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }>;
  decrypt(secret: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
};

/** Encapsulates the lifecycle of an unlocked key. Signer only accessible within callback. */
export type KeyScope = {
  withSigner<A>(fn: (signer: Signer) => Promise<A>): Promise<A>;
  withEd25519Signer<A>(fn: (signer: Ed25519Signer) => Promise<A>): Promise<Result<A, UnexpectedAlgoError>>;
};

/** A source of keys that can produce signers. */
export type KeyStore = {
  readonly id: string;
  hasKey(publicKey: RawPublicKey): Promise<boolean>;
  resolve(publicKey: RawPublicKey): Promise<Result<KeyScope, ResolveKeyError>>;
  // FIXME: TECH-DEBT — vault escape hatch for merits per-request signing.
  // Remove when merits moves to session tokens.
  exportKeyPair?(publicKey: RawPublicKey): Promise<Result<KeriKeyPair, ResolveKeyError>>;
};

/** Result of key generation. */
export type GeneratedKey = {
  readonly publicKey: RawPublicKey;
  readonly algo: Algo;
};

/** Creates new keys. Separate from KeyStore — not all stores can generate. */
export type KeyGenerator = {
  readonly id: string;
  supports(): Set<Algo>;
  generate(algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>>;
  generateBatch(algo: Algo, count: number): Promise<Result<readonly GeneratedKey[], GenerateKeyError>>;
};

export type VaultConfig = {
  /** UnlockProviders known to this vault. At least one required. */
  readonly providers: readonly UnlockProvider[];
  /** Default provider — used by KeyManagement for withSigner convenience. Must be in providers list. */
  readonly defaultProvider: UnlockProvider;
  /** Algorithm plugins. Defaults to [ed25519, secp256k1] if omitted (undefined). Pass [] for no algos. */
  readonly algos?: readonly AlgoPlugin[];
  /** Key storage backend. Defaults to in-memory if omitted. */
  readonly persistence?: KeyPersistence;
  /** Encryption strategy. Defaults to AES-256-GCM if omitted. */
  readonly encryption?: EncryptionPlugin;
};

/** Returned by Vaults.* factories. Long-lived, holds registered algos and providers. */
export type Vault = {
  /** The default provider specified at construction time. */
  readonly defaultProvider: UnlockProvider;
  /** Check whether a key exists in the vault. No grant needed — reads public metadata only. */
  hasKey(publicKey: RawPublicKey): Promise<boolean>;
  /** Look up which UnlockProvider encrypted a given key. Returns undefined if key not in vault or provider not registered. */
  getProviderForKey(publicKey: RawPublicKey): Promise<UnlockProvider | undefined>;
  /**
   * Public vault key metadata (unlockProviderId, algo, digest). No grant —
   * does not require the UnlockProvider instance to be registered.
   */
  describeKey(
    publicKey: RawPublicKey,
  ): Promise<
    { readonly unlockProviderId: UnlockProviderId; readonly algo: Algo; readonly publicKeyDigest: string } | undefined
  >;
  /**
   * Bind or replace a live UnlockProvider instance (e.g. passkey + credentialId on profile open).
   * Keys stamped with `provider.id` resolve via {@link getProviderForKey}.
   */
  registerProvider(provider: UnlockProvider): void;
  /** Find a public key by its pre-computed digest (Blake3 hex). O(n) scan, sufficient for typical key counts. */
  lookupByDigest(digest: string): Promise<RawPublicKey | undefined>;
  /** Grant-scoped KeyStore. resolve checks provider mismatch before decryption. */
  keyStore(grant: Grant): KeyStore;
  /** Grant-scoped KeyGenerator. Generated keys encrypted with grant.secret, tagged with grant.unlockProviderId. */
  generator(grant: Grant): KeyGenerator;
  /**
   * Encrypt and store an existing private key under the grant (same path as generate).
   * Idempotent when the public key is already present.
   */
  importKey(grant: Grant, privateKey: Uint8Array, algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>>;
};

export type ResolveKeyError =
  | { readonly kind: 'key-not-found'; readonly publicKey: RawPublicKey }
  | {
      readonly kind: 'wrong-provider';
      readonly publicKey: RawPublicKey;
      readonly expected: UnlockProviderId;
      readonly actual: UnlockProviderId;
    }
  | { readonly kind: 'store-error'; readonly storeId: string; readonly cause: unknown };

export type GenerateKeyError =
  | { readonly kind: 'algo-not-supported'; readonly algo: Algo }
  | { readonly kind: 'generation-failed'; readonly reason: string }
  | { readonly kind: 'generator-not-found'; readonly generatorId: string };
