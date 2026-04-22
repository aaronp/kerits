/**
 * Pure key generation factories for KERI Ed25519 key pairs.
 *
 * Ported from packages/kerits/src/types/crypto.ts into core as pure primitives.
 * No I/O, no ambient state (except the monotonic keyGenCounter for uniqueness).
 */

import { ed25519 } from '@noble/curves/ed25519.js';
import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { encodeKey } from '../cesr/keys.js';
import type { KeriKeyPair } from '../common/types.js';

export namespace KeriKeyPairs {
  export const forPrivateKey = (privateKey: Uint8Array): KeriKeyPair => {
    const publicKeyRaw = ed25519.getPublicKey(privateKey);
    return {
      publicKey: encodeKey(publicKeyRaw, true).qb64,
      privateKey: encodeKey(privateKey, true).qb64,
      transferable: true,
      algo: 'ed25519',
    };
  };

  function entropyToSeed(entropy: number): Uint8Array {
    const seed = new Uint8Array(32);
    const view = new DataView(seed.buffer);
    for (let i = 0; i < 32; i += 4) {
      view.setUint32(i, entropy + i, false);
    }
    return seed;
  }

  function mnemonicToSeed(mnemonic: string): Uint8Array {
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid BIP39 mnemonic');
    }
    const entropy = mnemonicToEntropy(mnemonic, wordlist);
    if (entropy.length === 32) return entropy;
    if (entropy.length === 16) {
      const seed = new Uint8Array(32);
      seed.set(entropy, 0);
      seed.set(entropy, 16);
      return seed;
    }
    throw new Error(`Unsupported entropy length: ${entropy.length} bytes`);
  }

  /**
   * Create a key pair from a 32-byte seed (Uint8Array).
   * Throws if the seed is not exactly 32 bytes.
   */
  export const fromSeed = (seed: Uint8Array): KeriKeyPair => {
    if (seed.length !== 32) {
      throw new Error(`Expected 32-byte seed, got ${seed.length} bytes`);
    }
    return forPrivateKey(seed);
  };

  /**
   * Create a key pair from a numeric entropy value.
   * Deterministic — same number always produces the same key pair.
   * Intended for test/dev use only.
   */
  export const fromSeedNumber = (seed: number): KeriKeyPair => {
    const privateKey = entropyToSeed(seed);
    return forPrivateKey(privateKey);
  };

  export const fromMnemonic = (mnemonic: string): KeriKeyPair => {
    const seed = mnemonicToSeed(mnemonic);
    return forPrivateKey(seed);
  };

  /**
   * Generate a random BIP39 mnemonic (24 words by default).
   *
   * WARNING: Non-pure — uses cryptographic randomness.
   */
  export function randomMnemonic(bits: number = 256): string {
    return generateMnemonic(wordlist, bits);
  }

  let keyGenCounter = 0;

  /**
   * Create a new key pair with cryptographically secure random seed.
   *
   * WARNING: Non-pure — uses cryptographic randomness.
   * Each call generates a unique, unpredictable key pair.
   */
  export const create = (): KeriKeyPair => {
    const randomBytes = ed25519.utils.randomSecretKey();
    const counter = keyGenCounter++;
    const counterBytes = new Uint8Array(8);
    new DataView(counterBytes.buffer).setBigUint64(0, BigInt(counter), false);
    for (let i = 0; i < 8; i++) {
      const rb = randomBytes[24 + i];
      const cb = counterBytes[i];
      if (rb !== undefined && cb !== undefined) {
        randomBytes[24 + i] = rb ^ cb;
      }
    }
    return forPrivateKey(randomBytes);
  };
}
