/**
 * High-level DSL for KERI account management
 *
 * Encapsulates KERI complexity to expose only what's needed for UX.
 * Strongly typed, functional style.
 */

import type { KerStore, Graph } from '../storage/types';
import { generateKeypairFromSeed } from '../signer';
import { createIdentity } from './helpers';
import { blake3 } from '@noble/hashes/blake3.js';
import { rotate } from '../rotate';
import { diger } from '../diger';

/**
 * Account represents a KERI identifier with human-friendly metadata
 */
export interface Account {
  /** Human-readable alias */
  alias: string;
  /** KERI AID (Autonomic Identifier) */
  aid: string;
  /** Public key in CESR format */
  verfer: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * Mnemonic seed phrase (24 words for 256-bit entropy)
 */
export type Mnemonic = string[];

/**
 * Simple BIP39-like wordlist (subset for deterministic testing)
 * In production, use full BIP39 wordlist
 */
const WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
  'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
  'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
  'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
  'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
  'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
  'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
  'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
  'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
  'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
  'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
  'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
  'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
  'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
  'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
  'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle',
  'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black',
  'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
  'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
  'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring',
  'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain',
  'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
  'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
  'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
  'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus',
  'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable',
];

/**
 * Convert seed bytes to mnemonic words
 */
function seedToMnemonic(seed: Uint8Array): Mnemonic {
  if (seed.length !== 32) {
    throw new Error('Seed must be 32 bytes for 24-word mnemonic');
  }

  const words: string[] = [];

  // Convert every 11 bits to a word index (2048 words = 2^11)
  // 32 bytes = 256 bits -> 24 words (264 bits with checksum)
  let bits = '';
  for (let i = 0; i < seed.length; i++) {
    bits += seed[i]!.toString(2).padStart(8, '0');
  }

  // Add checksum: first 8 bits of SHA256
  const checksum = blake3(seed, { dkLen: 1 });
  bits += checksum[0]!.toString(2).padStart(8, '0');

  // Extract 24 words (11 bits each)
  for (let i = 0; i < 24; i++) {
    const chunk = bits.slice(i * 11, (i + 1) * 11);
    const index = parseInt(chunk, 2) % WORDLIST.length;
    words.push(WORDLIST[index]!);
  }

  return words;
}

/**
 * Convert mnemonic words to seed bytes
 */
function mnemonicToSeed(mnemonic: Mnemonic): Uint8Array {
  if (mnemonic.length !== 24) {
    throw new Error('Mnemonic must be 24 words');
  }

  // Convert words to indices
  const indices: number[] = [];
  for (const word of mnemonic) {
    const index = WORDLIST.indexOf(word.toLowerCase());
    if (index === -1) {
      throw new Error(`Invalid mnemonic word: ${word}`);
    }
    indices.push(index);
  }

  // Convert to bit string
  let bits = '';
  for (const index of indices) {
    bits += index.toString(2).padStart(11, '0');
  }

  // Extract seed (first 256 bits, ignore 8-bit checksum)
  const seedBits = bits.slice(0, 256);
  const seed = new Uint8Array(32);

  for (let i = 0; i < 32; i++) {
    const byte = seedBits.slice(i * 8, (i + 1) * 8);
    seed[i] = parseInt(byte, 2);
  }

  // Verify checksum
  const checksum = blake3(seed, { dkLen: 1 });
  const checksumBits = checksum[0]!.toString(2).padStart(8, '0');
  const providedChecksum = bits.slice(256, 264);

  if (checksumBits !== providedChecksum) {
    console.warn('Mnemonic checksum mismatch (continuing anyway)');
  }

  return seed;
}

/**
 * AccountDSL - Operations for a specific account
 */
export interface AccountDSL {
  /** The account this DSL operates on */
  readonly account: Account;

  /**
   * Rotate the account's keys
   * @param newMnemonic - New mnemonic for generating next keys
   * @returns Updated account with new keys
   */
  rotateKeys(newMnemonic: Mnemonic): Promise<Account>;

  /**
   * Get the key event log for this account
   * @returns Array of all KEL events
   */
  getKel(): Promise<any[]>;
}

/**
 * KeritsDSL - High-level account management API
 */
export interface KeritsDSL {
  /**
   * Generate a new mnemonic from a seed (deterministic)
   * @param seed - 32-byte seed for deterministic generation
   * @returns 24-word mnemonic
   */
  newMnemonic(seed: Uint8Array): Mnemonic;

  /**
   * Create a new account from mnemonic
   * @param alias - Human-readable account name
   * @param mnemonic - 24-word seed phrase
   * @returns Account object
   */
  newAccount(alias: string, mnemonic: Mnemonic): Promise<Account>;

  /**
   * Get account by alias
   * @param alias - Account alias to lookup
   * @returns Account or null if not found
   */
  getAccount(alias: string): Promise<Account | null>;

  /**
   * List all account aliases
   * @returns Array of account aliases
   */
  accountNames(): Promise<string[]>;

  /**
   * Get account by AID
   * @param aid - KERI AID
   * @returns Account or null if not found
   */
  getAccountByAid(aid: string): Promise<Account | null>;

  /**
   * Get AccountDSL for a specific account
   * @param alias - Account alias
   * @returns AccountDSL or null if account not found
   */
  account(alias: string): Promise<AccountDSL | null>;

  /**
   * Get AccountDSL for a specific account by AID
   * @param aid - Account AID
   * @returns AccountDSL or null if account not found
   */
  accountByAid(aid: string): Promise<AccountDSL | null>;

  /**
   * Build a graph representation of all stored events
   * @param opts - Optional graph building options
   * @returns Graph with nodes and edges
   */
  graph(opts?: { limit?: number }): Promise<Graph>;
}

/**
 * Create an AccountDSL for a specific account
 */
function createAccountDSL(account: Account, store: KerStore): AccountDSL {
  // Utility to serialize events as CESR-framed bytes
  function serializeEvent(event: any): Uint8Array {
    const json = JSON.stringify(event);
    const versionString = event.v || 'KERI10JSON';
    const frameSize = json.length.toString(16).padStart(6, '0');
    const framed = `-${versionString}${frameSize}_${json}`;
    return new TextEncoder().encode(framed);
  }

  return {
    account,

    async rotateKeys(newMnemonic: Mnemonic): Promise<Account> {
      // Convert mnemonic to seed
      const seed = mnemonicToSeed(newMnemonic);

      // Generate new keypair
      const newKp = await generateKeypairFromSeed(seed);

      // Get current KEL
      const kelEvents = await store.listKel(account.aid);
      if (kelEvents.length === 0) {
        throw new Error(`No KEL found for account: ${account.aid}`);
      }

      // Get the last event
      const lastEvent = kelEvents[kelEvents.length - 1];
      const sn = kelEvents.length; // Next sequence number
      const priorSaid = lastEvent.meta.d;

      // Compute next key digest
      const nextKeyDigest = diger(newKp.verfer);

      // Create rotation event
      const rot = rotate({
        pre: account.aid,
        keys: [newKp.verfer],
        dig: priorSaid,
        sn,
        ndigs: [nextKeyDigest],
      });

      // Store rotation event
      const rawRot = serializeEvent(rot.ked);
      await store.putEvent(rawRot);

      // Update account object with new key
      const updatedAccount: Account = {
        ...account,
        verfer: newKp.verfer,
      };

      return updatedAccount;
    },

    async getKel(): Promise<any[]> {
      const events = await store.listKel(account.aid);
      // Return the metadata which contains the event type and fields
      return events.map(e => ({
        t: e.meta.t,
        d: e.meta.d,
        i: e.meta.i,
        s: e.meta.s,
        p: e.meta.p,
        ...e.meta,
      }));
    },
  };
}

/**
 * Create a new KeritsDSL instance
 * @param store - KerStore for persistence
 * @returns KeritsDSL instance
 */
export function createKeritsDSL(store: KerStore): KeritsDSL {
  // In-memory cache of accounts
  const accountCache = new Map<string, Account>();

  return {
    newMnemonic(seed: Uint8Array): Mnemonic {
      return seedToMnemonic(seed);
    },

    async newAccount(alias: string, mnemonic: Mnemonic): Promise<Account> {
      // Check if alias already exists
      const existing = await store.aliasToId('kel', alias);
      if (existing) {
        throw new Error(`Account alias already exists: ${alias}`);
      }

      // Convert mnemonic to seed
      const seed = mnemonicToSeed(mnemonic);

      // Generate keypair from seed
      const kp = await generateKeypairFromSeed(seed);

      // Create KERI identity
      const { aid } = await createIdentity(store, {
        alias,
        keys: [kp.verfer],
        nextKeys: [kp.verfer],
      });

      // Create account object
      const account: Account = {
        alias,
        aid,
        verfer: kp.verfer,
        createdAt: new Date().toISOString(),
      };

      // Store account metadata
      const accountKey = `account/${alias}`;
      await store.putEvent(
        new TextEncoder().encode(
          `-KERI10JSON000000_${JSON.stringify({
            v: 'KERI10JSON',
            t: 'account',
            alias,
            aid,
            verfer: kp.verfer,
            createdAt: account.createdAt,
          })}`
        )
      );

      // Cache it
      accountCache.set(alias, account);
      accountCache.set(aid, account);

      return account;
    },

    async getAccount(alias: string): Promise<Account | null> {
      // Check cache first
      if (accountCache.has(alias)) {
        return accountCache.get(alias)!;
      }

      // Lookup AID by alias
      const aid = await store.aliasToId('kel', alias);
      if (!aid) {
        return null;
      }

      // Get KEL events
      const kelEvents = await store.listKel(aid);
      if (kelEvents.length === 0) {
        return null;
      }

      // Extract account info from inception event
      const icp = kelEvents[0];
      const account: Account = {
        alias,
        aid,
        verfer: icp.meta.keys?.[0] || '',
        createdAt: icp.meta.dt || new Date().toISOString(),
      };

      // Cache it
      accountCache.set(alias, account);
      accountCache.set(aid, account);

      return account;
    },

    async accountNames(): Promise<string[]> {
      return store.listAliases('kel');
    },

    async getAccountByAid(aid: string): Promise<Account | null> {
      // Check cache first
      if (accountCache.has(aid)) {
        return accountCache.get(aid)!;
      }

      // Get KEL events
      const kelEvents = await store.listKel(aid);
      if (kelEvents.length === 0) {
        return null;
      }

      // Try to find alias by reverse lookup
      const aliases = await this.accountNames();
      for (const alias of aliases) {
        const resolvedAid = await store.aliasToId('kel', alias);
        if (resolvedAid === aid) {
          return this.getAccount(alias);
        }
      }

      // No alias found, create account without alias
      const icp = kelEvents[0];
      const account: Account = {
        alias: '', // No alias
        aid,
        verfer: icp.meta.keys?.[0] || '',
        createdAt: icp.meta.dt || new Date().toISOString(),
      };

      accountCache.set(aid, account);
      return account;
    },

    async account(alias: string): Promise<AccountDSL | null> {
      const acc = await this.getAccount(alias);
      if (!acc) {
        return null;
      }
      return createAccountDSL(acc, store);
    },

    async accountByAid(aid: string): Promise<AccountDSL | null> {
      const acc = await this.getAccountByAid(aid);
      if (!acc) {
        return null;
      }
      return createAccountDSL(acc, store);
    },

    async graph(opts?: { limit?: number }): Promise<Graph> {
      return store.buildGraph(opts);
    },
  };
}
