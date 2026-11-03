import { ed25519 as ed25519Curve } from '@noble/curves/ed25519.js';
import { secp256k1 as secp256k1Curve } from '@noble/curves/secp256k1.js';

import type { Algo, AlgoPlugin } from './types.js';

export namespace AlgoPlugins {
  /** Real ed25519 using @noble/curves. publicKeyLength = 32. */
  export function ed25519(): AlgoPlugin {
    return {
      algo: 'ed25519',
      publicKeyLength: 32,
      generateKeypair() {
        const privateKey = ed25519Curve.utils.randomSecretKey();
        const publicKey = ed25519Curve.getPublicKey(privateKey);
        return { publicKey, privateKey };
      },
      sign(data, privateKey) {
        return ed25519Curve.sign(data, privateKey);
      },
    };
  }

  /** Real secp256k1. Returns 64-byte compact (r, s). secp256k1.sign does sha256 prehash internally. */
  export function secp256k1(): AlgoPlugin {
    return {
      algo: 'secp256k1',
      publicKeyLength: 33,
      generateKeypair() {
        const privateKey = secp256k1Curve.utils.randomSecretKey();
        const publicKey = secp256k1Curve.getPublicKey(privateKey, true);
        return { publicKey, privateKey };
      },
      sign(data, privateKey) {
        // secp256k1.sign defaults to prehash: true (internal sha256)
        return secp256k1Curve.sign(data, privateKey);
      },
    };
  }

  /** Custom algo for testing or extension. Caller provides all crypto operations. */
  export function create(params: {
    algo: Algo;
    publicKeyLength: number;
    generateKeypair: () => { publicKey: Uint8Array; privateKey: Uint8Array };
    sign: (data: Uint8Array, privateKey: Uint8Array) => Uint8Array | Promise<Uint8Array>;
  }): AlgoPlugin {
    return {
      algo: params.algo,
      publicKeyLength: params.publicKeyLength,
      generateKeypair: params.generateKeypair,
      sign: params.sign,
    };
  }
}
