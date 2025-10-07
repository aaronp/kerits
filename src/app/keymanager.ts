/**
 * KeyManager - In-memory key management for KERI signing operations
 *
 * Provides secure, ephemeral storage of signing keys during a session.
 * Keys are derived from mnemonics and held in memory only.
 */

import { Signer } from '../cesr/signer';
import { MatterCodex } from '../cesr/codex';
import type { Mnemonic } from './dsl/types/common';
import { mnemonicToSeed } from './dsl/utils/mnemonic';

/**
 * KeyManager configuration options
 */
export interface KeyManagerOptions {
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * KeyManager - Manages signing keys in memory during a session
 *
 * Usage:
 *   const km = new KeyManager();
 *   await km.unlock(aid, mnemonic);
 *   const signer = km.getSigner(aid);
 *   // ... sign events ...
 *   km.lock(aid);
 */
export class KeyManager {
  private signers = new Map<string, Signer>();
  private debug: boolean;

  constructor(options: KeyManagerOptions = {}) {
    this.debug = options.debug || false;
  }

  /**
   * Unlock an account by loading its signing key from mnemonic
   *
   * @param aid - Account identifier (AID)
   * @param mnemonic - BIP39 mnemonic phrase
   */
  async unlock(aid: string, mnemonic: Mnemonic): Promise<void> {
    if (this.signers.has(aid)) {
      if (this.debug) console.log(`[KeyManager] Account already unlocked: ${aid}`);
      return;
    }

    // Convert mnemonic to seed
    const seed = mnemonicToSeed(mnemonic);

    // Create signer from seed
    const signer = new Signer({
      raw: seed,
      code: MatterCodex.Ed25519_Seed,
      transferable: true,
    });

    this.signers.set(aid, signer);

    if (this.debug) {
      console.log(`[KeyManager] Unlocked account: ${aid}`);
      console.log(`[KeyManager] Verfer: ${signer.verfer.qb64}`);
    }
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
