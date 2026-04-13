/**
 * Vault Interface
 *
 * Pure interface defining the contract for a collection of signers indexed by public key.
 * Partial port from kv4 packages/kerits/src/api/vault.ts — interface only;
 * Vaults impl factory stays in kv4 until Phase 2 (B-004).
 */

import type { Signer } from '../signature/signer.js';
import type { KeriKeyPair, PublicKey, VaultAppend } from './types.js';

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
   * Get the primary signer (the one associated with the vault's AID)
   * @returns The primary signer for this vault
   */
  getPrimarySigner(): Promise<Signer>;

  /**
   * Find a keypair by its digest
   *
   * Used during key rotation to resolve the "current" keys from prior next
   * commitments. The digest is a KERI-style digest of the public key.
   *
   * @param digest - The digest to search for (KERI digest of public key)
   * @returns The matching keypair if found, undefined otherwise
   */
  findKeyPairByDigest(digest: string): Promise<KeriKeyPair | undefined>;

  /**
   * Get metadata for a keypair by its public key
   * @param publicKey - The public key to look up
   * @returns The metadata record, or undefined if not found
   */
  getKeypairMeta<T = unknown>(publicKey: PublicKey): Promise<T | undefined>;

  /**
   * Get the private key for a keypair by its public key
   * @param publicKey - The public key to look up
   * @returns The private key, or undefined if not found
   */
  getKeypairPrivate<T = unknown>(publicKey: PublicKey): Promise<T | undefined>;

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
}
