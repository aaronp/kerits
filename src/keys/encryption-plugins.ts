import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import type { EncryptionPlugin } from './types.js';

export namespace EncryptionPlugins {
  /** XOR with secret — trivial, for testing only. Makes encrypted bytes inspectable. */
  export function xor(): EncryptionPlugin {
    return {
      async encrypt(secret: Uint8Array, plaintext: Uint8Array) {
        const ciphertext = new Uint8Array(plaintext.length);
        for (let i = 0; i < plaintext.length; i++) {
          ciphertext[i] = plaintext[i]! ^ secret[i % secret.length]!;
        }
        return { ciphertext, iv: new Uint8Array(0) };
      },
      async decrypt(secret: Uint8Array, ciphertext: Uint8Array, _iv: Uint8Array) {
        const plaintext = new Uint8Array(ciphertext.length);
        for (let i = 0; i < ciphertext.length; i++) {
          plaintext[i] = ciphertext[i]! ^ secret[i % secret.length]!;
        }
        return plaintext;
      },
    };
  }

  /** AES-256-GCM via @noble/ciphers. Production use. Generates random 12-byte IV per encrypt call. */
  export function aesGcm(): EncryptionPlugin {
    return {
      async encrypt(secret: Uint8Array, plaintext: Uint8Array) {
        const iv = randomBytes(12);
        const cipher = gcm(secret, iv);
        const ciphertext = cipher.encrypt(plaintext);
        return { ciphertext, iv };
      },
      async decrypt(secret: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array) {
        const cipher = gcm(secret, iv);
        return cipher.decrypt(ciphertext);
      },
    };
  }
}
