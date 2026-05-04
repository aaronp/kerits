/**
 * Vault Interface
 *
 * Pure interface defining the contract for a collection of signers indexed by public key.
 * Partial port from kv4 packages/kerits/src/api/vault.ts — interface only;
 * Vaults impl factory stays in kv4 until Phase 2 (B-004).
 */

import type { Signature } from '../common/types.js';
import type { Signer } from '../signature/signer.js';
import type { KeriKeyPair, PublicKey, VaultAppend } from './types.js';

/** Purpose annotation for vault entries. Matches VaultAppend['purpose']. */
export type VaultPurpose = VaultAppend['purpose'];

/** Result of Vault.create — enough to build and sign an inception event, no AID required. */
export interface CreatedKey {
  publicKey: PublicKey;
  signBytes(data: Uint8Array): Promise<Signature>;
}

/** Options for Vault.create — pass-through to KeriKeyPairs factories. */
export type KeyCreateOptions =
  | { method: 'random'; purpose?: VaultPurpose }
  | { method: 'seed'; seed: Uint8Array; purpose?: VaultPurpose }
  | { method: 'mnemonic'; mnemonic: string; purpose?: VaultPurpose }
  | { method: 'privateKey'; privateKey: Uint8Array; purpose?: VaultPurpose };

/**
 * Vault - A collection of signers indexed by public key
 *
 * Provides higher-level access to key material without exposing the underlying
 * KeyValueStore. A vault can contain multiple keypairs (current, next, rotation keys, etc.)
 * and provides methods to check ownership and retrieve signers for specific public keys.
 */
export interface Vault {
  /**
   * Check if this vault contains a keypair for the given public key
   * @param publicKey - The public key to check
   * @returns true if the vault contains this public key
   */
  hasSigner(publicKey: PublicKey): Promise<boolean>;

  /**
   * Get a signer for a specific public key
   * @param publicKey - The public key to get a signer for
   * @returns Signer instance or undefined if public key not in vault
   */
  getSigner(publicKey: PublicKey): Promise<Signer | undefined>;

  /**
   * Find a public key by its digest
   *
   * Used during key rotation to resolve the "current" keys from prior next
   * commitments. The digest is a KERI-style digest of the public key.
   *
   * @param digest - The digest to search for (KERI digest of public key)
   * @returns The matching public key if found, undefined otherwise
   */
  findPublicKeyByDigest(digest: string): Promise<PublicKey | undefined>;

  /**
   * Find a signer by the digest of its public key.
   *
   * Convenience combining findPublicKeyByDigest + getSigner in one call.
   * Used during rotation to resolve next-key commitments to signers.
   *
   * @param digest - The digest to search for (KERI digest of public key)
   * @returns Signer if found and vault holds the key, undefined otherwise
   */
  getSignerByDigest(digest: string): Promise<Signer | undefined>;

  /**
   * Get metadata for a keypair by its public key
   * @param publicKey - The public key to look up
   * @returns The metadata record, or undefined if not found
   */
  getKeypairMeta<T = unknown>(publicKey: PublicKey): Promise<T | undefined>;

  /**
   * Append a key pair to the vault
   * @param append - The key pair to append with metadata
   * @returns Promise resolving to unknown (implementation-specific result)
   */
  append(append: VaultAppend): Promise<unknown>;

  /**
   * Batch append multiple key pairs in a single transaction (optional optimization)
   * If not implemented, falls back to calling append() for each key pair.
   * @param appends - Array of key pairs to append
   * @returns Promise resolving to a record of results by public key
   */
  appendAll?(appends: VaultAppend[]): Promise<Record<string, unknown>>;

  /**
   * Store a keypair in the vault. Pure persistence — no generation.
   * @param keyPair - The keypair to store
   * @param purpose - Optional purpose annotation
   * @returns The public key of the stored keypair
   */
  store(keyPair: KeriKeyPair, purpose?: VaultPurpose): Promise<PublicKey>;

  /**
   * Generate a keypair and store it. Returns a CreatedKey for signing the inception event.
   * @param options - Key generation options (pass-through to KeriKeyPairs)
   * @returns CreatedKey with publicKey and signBytes (no AID required)
   */
  create(options: KeyCreateOptions): Promise<CreatedKey>;
}
