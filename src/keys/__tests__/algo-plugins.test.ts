import { describe, expect, test } from 'bun:test';
import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';

import { AlgoPlugins } from '../algo-plugins.js';

describe('AlgoPlugins', () => {
  describe('ed25519', () => {
    test('generateKeypair produces valid key pair', () => {
      // setup: instantiate the ed25519 plugin
      const plugin = AlgoPlugins.ed25519();
      const { publicKey, privateKey } = plugin.generateKeypair();
      // function under test: generateKeypair on ed25519 plugin
      expect(plugin.algo).toBe('ed25519');
      expect(plugin.publicKeyLength).toBe(32);
      // assertions: key lengths match spec and public key is derivable from private key
      expect(publicKey.length).toBe(32);
      expect(privateKey.length).toBe(32);
      expect(ed25519.getPublicKey(privateKey)).toEqual(publicKey);
    });

    test('sign produces verifiable signature', async () => {
      // setup: generate a fresh ed25519 key pair
      const plugin = AlgoPlugins.ed25519();
      const { publicKey, privateKey } = plugin.generateKeypair();
      const data = new TextEncoder().encode('test message');
      // function under test: sign with ed25519 plugin
      const sig = await plugin.sign(data, privateKey);
      // assertions: signature is 64 bytes and verifiable against the public key
      expect(sig).toBeInstanceOf(Uint8Array);
      expect(sig.length).toBe(64);
      expect(ed25519.verify(sig, data, publicKey)).toBe(true);
    });
  });

  describe('secp256k1', () => {
    test('generateKeypair produces valid compressed key pair', () => {
      // setup: instantiate the secp256k1 plugin
      const plugin = AlgoPlugins.secp256k1();
      const { publicKey, privateKey } = plugin.generateKeypair();
      // function under test: generateKeypair on secp256k1 plugin
      expect(plugin.algo).toBe('secp256k1');
      expect(plugin.publicKeyLength).toBe(33);
      // assertions: compressed public key is 33 bytes, private key is 32 bytes
      expect(publicKey.length).toBe(33);
      expect(privateKey.length).toBe(32);
    });

    test('sign produces verifiable compact signature', async () => {
      // setup: generate a fresh secp256k1 key pair
      const plugin = AlgoPlugins.secp256k1();
      const { publicKey, privateKey } = plugin.generateKeypair();
      const data = new TextEncoder().encode('secp test');
      // function under test: sign with secp256k1 plugin (secp256k1.sign prehashes internally)
      const sig = await plugin.sign(data, privateKey);
      // assertions: signature is 64-byte compact and verifiable
      expect(sig).toBeInstanceOf(Uint8Array);
      expect(sig.length).toBe(64);
      expect(secp256k1.verify(sig, data, publicKey)).toBe(true);
    });
  });

  describe('create', () => {
    test('custom algo plugin with provided functions', async () => {
      // setup: build a trivial custom plugin with deterministic stub functions
      const plugin = AlgoPlugins.create({
        algo: 'ed25519',
        publicKeyLength: 4,
        generateKeypair: () => ({
          publicKey: new Uint8Array([1, 2, 3, 4]),
          privateKey: new Uint8Array([5, 6, 7, 8]),
        }),
        sign: (data, _privateKey) => new Uint8Array(data).reverse(),
      });
      // function under test: generateKeypair and sign on custom plugin
      const { publicKey } = plugin.generateKeypair();
      const sig = await plugin.sign(new Uint8Array([10, 20, 30]), new Uint8Array(0));
      // assertions: stub outputs are passed through unchanged
      expect(publicKey).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(sig).toEqual(new Uint8Array([30, 20, 10]));
    });
  });
});
