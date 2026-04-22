import { ed25519 } from '@noble/curves/ed25519.js';
import { decodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { AID, KeriKeyPair, PublicKey, SAID, Signature } from '../common/types.js';
import type { Signer } from './signer.js';

export namespace Signers {
  /**
   * Create a Signer from a KeriKeyPair and AID.
   *
   * Pure implementation using only core primitives.
   * No I/O, no storage — suitable for testing and lightweight signing.
   */
  export function fromKeyPair(keypair: KeriKeyPair, aid: AID): Signer {
    return {
      aid,
      publicKey: keypair.publicKey,

      async getX25519PublicKey(): Promise<Uint8Array> {
        const publicKeyBytes = decodeKey(keypair.publicKey).raw;
        return ed25519.utils.toMontgomery(publicKeyBytes);
      },

      async exists(publicKey: PublicKey): Promise<boolean> {
        return keypair.publicKey === publicKey;
      },

      async signBytes(data: Uint8Array): Promise<Signature> {
        const privateKeyBytes = decodeKey(keypair.privateKey).raw;
        const signatureBytes = ed25519.sign(data, privateKeyBytes);
        const transferable = keypair.transferable ?? true;
        return encodeSig(signatureBytes, transferable).qb64 as Signature;
      },

      async signSaid(said: SAID): Promise<Signature> {
        const saidBytes = new TextEncoder().encode(said);
        return this.signBytes(saidBytes);
      },
    };
  }
}
