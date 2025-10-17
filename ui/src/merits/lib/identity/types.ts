/**
 * MERITS Identity Types
 *
 * Minimal identity interface for standalone MERITS usage.
 * When integrated with KERITS, these interfaces will be implemented
 * by KERI-backed identity providers.
 */

export interface MeritsUser {
  /** Unique identifier (fake SAID for now, real KERI AID later) */
  aid: string;

  /** Display name chosen by user */
  username: string;

  /** ED25519 public key (base64url encoded) */
  publicKey: string;

  /** ED25519 private key (base64url encoded, encrypted at rest) */
  privateKey: string;

  /** Timestamp when user was created */
  createdAt: number;

  /** Timestamp when user last logged in */
  lastLoginAt: number;
}

export interface IdentityProvider {
  /** Provider name (e.g., "SimpleIdentity", "KERI") */
  name: string;

  /** Provider version */
  version: string;

  /** Get current user */
  getCurrentUser(): Promise<MeritsUser | null>;

  /** Get all users */
  getAllUsers(): Promise<MeritsUser[]>;

  /** Create new user */
  createUser(username: string): Promise<MeritsUser>;

  /** Switch to different user */
  switchUser(aid: string): Promise<MeritsUser>;

  /** Remove user */
  removeUser(aid: string): Promise<void>;

  /** Sign data with current user's private key */
  sign(data: Uint8Array): Promise<string>;

  /** Verify signature */
  verify(signature: string, data: Uint8Array, publicKey: string): Promise<boolean>;

  /** Get public key for current user */
  getPublicKey(): Promise<string>;
}
