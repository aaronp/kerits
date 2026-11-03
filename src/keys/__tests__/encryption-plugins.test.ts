import { describe, expect, test } from 'bun:test';
import { EncryptionPlugins } from '../encryption-plugins.js';

describe('EncryptionPlugins', () => {
  describe('xor', () => {
    test('encrypt then decrypt produces original plaintext', async () => {
      // setup: create plugin with a known secret and plaintext
      const plugin = EncryptionPlugins.xor();
      const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const plaintext = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);

      // method under test: encrypt then decrypt round-trip
      const { ciphertext, iv } = await plugin.encrypt(secret, plaintext);
      const decrypted = await plugin.decrypt(secret, ciphertext, iv);

      // assertions: round-trip produces original
      expect(decrypted).toEqual(plaintext);
    });

    test('ciphertext differs from plaintext', async () => {
      // setup: secret of all 0xff, plaintext of all 0x00
      const plugin = EncryptionPlugins.xor();
      const secret = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
      const plaintext = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

      // method under test: encrypt
      const { ciphertext } = await plugin.encrypt(secret, plaintext);

      // assertions: encrypted bytes are NOT the original plaintext; XOR with 0xff flips all bits
      expect(ciphertext).not.toEqual(plaintext);
      expect(ciphertext).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
    });

    test('xor with longer plaintext than secret wraps secret cyclically', async () => {
      // setup: single-byte secret, multi-byte plaintext
      const plugin = EncryptionPlugins.xor();
      const secret = new Uint8Array([0xab]);
      const plaintext = new Uint8Array([0x01, 0x02, 0x03]);

      // method under test: encrypt
      const { ciphertext } = await plugin.encrypt(secret, plaintext);

      // assertions: each byte XORed with 0xab cyclically
      expect(ciphertext[0]).toBe(0x01 ^ 0xab);
      expect(ciphertext[1]).toBe(0x02 ^ 0xab);
      expect(ciphertext[2]).toBe(0x03 ^ 0xab);
    });
  });

  describe('aesGcm', () => {
    test('encrypt then decrypt produces original plaintext', async () => {
      // setup: 256-bit key and short plaintext
      const plugin = EncryptionPlugins.aesGcm();
      const secret = new Uint8Array(32);
      secret.fill(0x42);
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

      // method under test: encrypt then decrypt round-trip
      const { ciphertext, iv } = await plugin.encrypt(secret, plaintext);
      const decrypted = await plugin.decrypt(secret, ciphertext, iv);

      // assertions: round-trip restores plaintext; IV is AES-GCM standard 12 bytes
      expect(decrypted).toEqual(plaintext);
      expect(ciphertext).not.toEqual(plaintext);
      expect(iv.length).toBe(12);
    });

    test('wrong secret fails decryption', async () => {
      // setup: encrypt with one key, attempt decrypt with another
      const plugin = EncryptionPlugins.aesGcm();
      const secret = new Uint8Array(32).fill(0x42);
      const wrongSecret = new Uint8Array(32).fill(0x99);
      const plaintext = new Uint8Array([1, 2, 3]);

      // method under test: decrypt with wrong key
      const { ciphertext, iv } = await plugin.encrypt(secret, plaintext);

      // assertions: wrong key throws
      await expect(plugin.decrypt(wrongSecret, ciphertext, iv)).rejects.toThrow();
    });

    test('two encrypts of same plaintext produce different ciphertext (random IV)', async () => {
      // setup: same key and plaintext encrypted twice
      const plugin = EncryptionPlugins.aesGcm();
      const secret = new Uint8Array(32).fill(0x42);
      const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

      // method under test: encrypt twice
      const result1 = await plugin.encrypt(secret, plaintext);
      const result2 = await plugin.encrypt(secret, plaintext);

      // assertions: different IVs → different ciphertext (semantic security)
      expect(result1.iv).not.toEqual(result2.iv);
    });
  });
});
