import { ed25519 } from '@noble/curves/ed25519.js';
import { decodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { KeriKeyPair, PublicKey, SAID, Signature } from '../common/types.js';
import { hkdfBlake3 } from '../crypto/hkdf.js';
import { deriveSharedSecret, ed25519ToX25519Private } from '../crypto/x25519.js';
import type { KeyAgreementInput } from './key-agreement.js';
import { MAX_HKDF_DERIVE_LENGTH } from './key-agreement.js';
import type { Signer } from './signer.js';
import { verify as verifySignature } from './verify.js';

export namespace Signers {
  /**
   * Create a Signer from a KeriKeyPair.
   *
   * Pure implementation using only core primitives.
   * No I/O, no storage — suitable for testing and lightweight signing.
   */
  export function fromKeyPair(keypair: KeriKeyPair): Signer {
    return {
      publicKey: keypair.publicKey,

      async getX25519PublicKey(): Promise<Uint8Array> {
        const publicKeyBytes = decodeKey(keypair.publicKey).raw;
        return ed25519.utils.toMontgomery(publicKeyBytes);
      },

      async deriveX25519HkdfBlake3Key(input: KeyAgreementInput): Promise<Uint8Array> {
        if (input.peerPublicKey.length !== 32) {
          throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
        }
        if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
          throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
        }
        const privateKeyBytes = decodeKey(keypair.privateKey).raw;
        const x25519PrivateKey = ed25519ToX25519Private(privateKeyBytes);
        const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
        return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
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

  /**
   * Verify a signature against data using a public key.
   *
   * @param publicKey - Public key in CESR qb64 format
   * @param signature - Signature in CESR qb64 format
   * @param data - Raw bytes that were signed
   * @returns true if signature is valid, false otherwise
   */
  export function verify(publicKey: PublicKey, signature: Signature, data: Uint8Array): boolean {
    return verifySignature(publicKey, signature, data);
  }
}
