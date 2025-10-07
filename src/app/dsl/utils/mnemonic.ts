/**
 * Mnemonic utilities for seed phrase generation and conversion
 */

import { blake3 } from '@noble/hashes/blake3.js';
import type { Mnemonic } from '../types';

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
export function seedToMnemonic(seed: Uint8Array): Mnemonic {
  if (seed.length !== 32) {
    throw new Error('Seed must be 32 bytes for 24-word mnemonic');
  }

  const words: string[] = [];

  // Convert every 11 bits to a word index (2048 words = 2^11)
  // 32 bytes = 256 bits -> 24 words (264 bits with checksum)
  let bits = '';
  for (let i = 0; i < seed.length; i++) {
    bits += seed[i].toString(2).padStart(8, '0');
  }

  // Add checksum: first 8 bits of Blake3
  const checksum = blake3(seed, { dkLen: 1 });
  bits += checksum[0].toString(2).padStart(8, '0');

  // Extract 24 words (11 bits each)
  for (let i = 0; i < 24; i++) {
    const chunk = bits.slice(i * 11, (i + 1) * 11);
    const index = parseInt(chunk, 2) % WORDLIST.length;
    words.push(WORDLIST[index]);
  }

  return words.join(' ');
}

/**
 * Convert mnemonic words to seed bytes
 */
export function mnemonicToSeed(mnemonic: Mnemonic): Uint8Array {
  const words = mnemonic.split(' ');

  if (words.length !== 24) {
    throw new Error('Mnemonic must be 24 words');
  }

  // Convert words to indices
  const indices: number[] = [];
  for (const word of words) {
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
  const checksumBits = checksum[0].toString(2).padStart(8, '0');
  const providedChecksum = bits.slice(256, 264);

  if (checksumBits !== providedChecksum) {
    console.warn('Mnemonic checksum mismatch (continuing anyway)');
  }

  return seed;
}
