/**
 * Mnemonic utilities for seed phrase generation and conversion
 *
 * Uses BIP39 standard with proper 2048-word English wordlist
 */

import { generateMnemonic, mnemonicToEntropy, entropyToMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import type { Mnemonic } from '../types';

/**
 * Convert 32-byte seed to BIP39 mnemonic (24 words)
 *
 * @param seed - 32-byte seed (256 bits)
 * @returns 24-word mnemonic phrase
 */
export function seedToMnemonic(seed: Uint8Array): Mnemonic {
  if (seed.length !== 32) {
    throw new Error('Seed must be 32 bytes for 24-word mnemonic');
  }

  // Convert 256-bit entropy to 24-word mnemonic
  return entropyToMnemonic(seed, englishWordlist);
}

/**
 * Convert BIP39 mnemonic to 32-byte seed
 *
 * @param mnemonic - BIP39 mnemonic phrase (12 or 24 words)
 * @returns 32-byte seed
 */
export function mnemonicToSeed(mnemonic: Mnemonic): Uint8Array {
  // Validate mnemonic
  if (!validateMnemonic(mnemonic, englishWordlist)) {
    throw new Error('Invalid BIP39 mnemonic');
  }

  // Convert mnemonic to entropy
  const entropy = mnemonicToEntropy(mnemonic, englishWordlist);

  // For 24-word mnemonic, entropy is 32 bytes (256 bits)
  // For 12-word mnemonic, entropy is 16 bytes (128 bits)
  if (entropy.length === 16) {
    // Extend 16 bytes to 32 bytes by repeating (not secure, but for compatibility)
    const seed = new Uint8Array(32);
    seed.set(entropy, 0);
    seed.set(entropy, 16);
    return seed;
  }

  return entropy;
}

/**
 * Generate a random 24-word BIP39 mnemonic
 *
 * @returns Random 24-word mnemonic
 */
export function generateRandomMnemonic(): Mnemonic {
  // 256 bits = 24 words
  return generateMnemonic(englishWordlist, 256);
}

/**
 * Validate a BIP39 mnemonic
 *
 * @param mnemonic - Mnemonic to validate
 * @returns true if valid
 */
export function isValidMnemonic(mnemonic: Mnemonic): boolean {
  return validateMnemonic(mnemonic, englishWordlist);
}
