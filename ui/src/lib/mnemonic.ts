/**
 * BIP39 Mnemonic utilities for key generation
 */

import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Generate a new 24-word BIP39 mnemonic
 */
export function createMnemonic(): string {
  return generateMnemonic(256); // 256 bits = 24 words
}

/**
 * Validate a BIP39 mnemonic
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic);
}

/**
 * Derive a seed from a mnemonic and optional path
 */
export function deriveSeed(mnemonic: string, path: string = ''): Uint8Array {
  const seed = mnemonicToSeedSync(mnemonic, path);
  return sha256(seed).slice(0, 32); // 32 bytes for ed25519
}

/**
 * Format mnemonic for display (4 words per line)
 */
export function formatMnemonic(mnemonic: string): string {
  const words = mnemonic.split(' ');
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += 4) {
    lines.push(words.slice(i, i + 4).join(' '));
  }
  return lines.join('\n');
}
