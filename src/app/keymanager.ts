/**
 * KeyManager - Key management for KERI signing operations
 *
 * Stores mnemonics in KV store for persistence across sessions.
 * Keys are derived from mnemonics and cached in memory for performance.
 */

import { Signer } from '../model/cesr/cesr';
import type { Kv } from '../storage/types';
import type { Mnemonic } from './dsl/types/common';
import { mnemonicToSeed } from './dsl/utils/mnemonic';

/**
 * KeyManager configuration options
 */
export interface KeyManagerOptions {
  /** KV store for persisting mnemonics */
  store?: Kv;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * KeyManager - Manages signing keys with KV store persistence
 *
 * Usage:
 *   const km = new KeyManager({ store });
 *   await km.unlock(aid, mnemonic);  // Stores mnemonic in KV
 *   const signer = km.getSigner(aid);
 *   // ... sign events ...
 *   km.lock(aid);  // Removes from memory but keeps in KV
 */
export class KeyManager {
  private signers = new Map<string, Signer>();
  private store?: Kv;
  private debug: boolean;

  constructor(options: KeyManagerOptions = {}) {
    this.store = options.store;
    this.debug = options.debug || false;
  }

  /**
   * Unlock an account by loading its signing key from mnemonic or seed
   * If mnemonic is provided, it will be stored in KV for future use.
   *
   * @param aid - Account identifier (AID)
   * @param mnemonic - BIP39 mnemonic phrase OR raw 32-byte seed
   */
  async unlock(aid: string, mnemonic: Mnemonic | Uint8Array): Promise<void> {
    if (this.signers.has(aid)) {
      if (this.debug) console.log(`[KeyManager] Account already unlocked: ${aid}`);
      return;
    }

    // Convert mnemonic to seed (or use seed directly if Uint8Array)
    const seed = mnemonic instanceof Uint8Array ? mnemonic : mnemonicToSeed(mnemonic);

    // Create signer from seed using browser-compatible CESR implementation
    const signer = new Signer({ raw: seed, transferable: true });

    this.signers.set(aid, signer);

    // Store mnemonic in KV if provided (not raw seed)
    if (this.store && typeof mnemonic === 'string') {
      const key = `keymanager/${aid}/mnemonic`;
      const value = new TextEncoder().encode(mnemonic);
      await this.store.put(key, value);
      if (this.debug) console.log(`[KeyManager] Stored mnemonic for ${aid}`);
    }

    if (this.debug) {
      console.log(`[KeyManager] Unlocked account: ${aid}`);
      console.log(`[KeyManager] Verfer: ${signer.verfer}`);
    }
  }

  /**
   * Unlock account from stored mnemonic in KV
   * Useful for restoring keys across sessions.
   *
   * @param aid - Account identifier (AID)
   * @returns True if unlocked from storage, false if not found
   */
  async unlockFromStore(aid: string): Promise<boolean> {
    if (!this.store) {
      throw new Error('KeyManager not configured with KV store');
    }

    if (this.signers.has(aid)) {
      if (this.debug) console.log(`[KeyManager] Account already unlocked: ${aid}`);
      return true;
    }

    const key = `keymanager/${aid}/mnemonic`;
    const value = await this.store.get(key);

    if (!value) {
      if (this.debug) console.log(`[KeyManager] No stored mnemonic found for ${aid}`);
      return false;
    }

    const mnemonic = new TextDecoder().decode(value);
    await this.unlock(aid, mnemonic);
    return true;
  }

  /**
   * Lock an account by removing its signing key from memory
   *
   * @param aid - Account identifier (AID)
   */
  lock(aid: string): void {
    const removed = this.signers.delete(aid);
    if (this.debug) {
      if (removed) {
        console.log(`[KeyManager] Locked account: ${aid}`);
      } else {
        console.log(`[KeyManager] Account not unlocked: ${aid}`);
      }
    }
  }

  /**
   * Lock all accounts
   */
  lockAll(): void {
    const count = this.signers.size;
    this.signers.clear();
    if (this.debug) {
      console.log(`[KeyManager] Locked all accounts (${count} total)`);
    }
  }

  /**
   * Check if an account is unlocked
   *
   * @param aid - Account identifier (AID)
   * @returns True if account is unlocked
   */
  isUnlocked(aid: string): boolean {
    return this.signers.has(aid);
  }

  /**
   * Get the signer for an account
   *
   * @param aid - Account identifier (AID)
   * @returns Signer instance or null if not unlocked
   */
  getSigner(aid: string): Signer | null {
    return this.signers.get(aid) || null;
  }

  /**
   * Get all unlocked account AIDs
   *
   * @returns Array of unlocked AIDs
   */
  getUnlockedAccounts(): string[] {
    return Array.from(this.signers.keys());
  }
}
