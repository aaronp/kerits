/**
 * CESR Signer and Verfer - Ed25519 signing and verification
 *
 * Implements cryptographic signing and verification primitives
 */

import { Matter, type MatterParams } from './matter.js';
import { MatterCodex } from './codex.js';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { concatBytes } from '@noble/hashes/utils.js';

// Configure noble/ed25519 for both v2.x and v3.x APIs
(ed as any).etc.sha512Sync = (...m: any[]) => sha512(concatBytes(...m));
(ed as any).hashes.sha512 = (...m: Uint8Array[]) => sha512(concatBytes(...m));
(ed as any).hashes.sha512Async = async (...m: Uint8Array[]) => sha512(concatBytes(...m));

export interface SignerParams extends MatterParams {
  transferable?: boolean;
}

export interface VerferParams extends MatterParams {
  transferable?: boolean;
}

/**
 * Signer - Ed25519 private signing key
 *
 * Stores a 32-byte Ed25519 seed and generates keypair
 */
export class Signer extends Matter {
  private _verfer!: Verfer;

  constructor(params: SignerParams = {}) {
    // Default code is Ed25519_Seed
    if (params.code === undefined && params.raw !== undefined) {
      params.code = MatterCodex.Ed25519_Seed;
    }

    super(params);

    // Generate verfer from seed
    this._generateVerfer(params.transferable ?? true);
  }

  protected defaultCode(): string {
    return MatterCodex.Ed25519_Seed;
  }

  /**
   * Generate verification key from seed
   */
  private _generateVerfer(transferable: boolean): void {
    if (this._code === MatterCodex.Ed25519_Seed) {
      // Generate public key from seed
      const publicKey = ed.getPublicKey(this._raw);

      this._verfer = new Verfer({
        raw: publicKey,
        code: transferable ? MatterCodex.Ed25519 : MatterCodex.Ed25519N,
      });
    } else {
      throw new Error(`Unsupported signer code: ${this._code}`);
    }
  }

  /**
   * Get the verifier (public key)
   */
  get verfer(): Verfer {
    return this._verfer;
  }

  /**
   * Sign data and return signature
   *
   * @param ser - Data to sign
   * @param index - Optional index for indexed signatures
   * @returns Cigar (non-indexed) or Siger (indexed) signature
   */
  sign(ser: Uint8Array, index?: number): Cigar {
    if (this._code === MatterCodex.Ed25519_Seed) {
      const signature = ed.sign(ser, this._raw);

      return new Cigar({
        raw: signature,
        code: MatterCodex.Ed25519_Sig,
      });
    } else {
      throw new Error(`Unsupported signer code: ${this._code}`);
    }
  }
}

/**
 * Verfer - Ed25519 public verification key
 *
 * Stores a 32-byte Ed25519 public key
 */
export class Verfer extends Matter {
  constructor(params: VerferParams = {}) {
    super(params);
  }

  protected defaultCode(): string {
    return MatterCodex.Ed25519;
  }

  /**
   * Verify a signature
   *
   * @param sig - Signature to verify (Cigar or raw bytes or qb64)
   * @param ser - Data that was signed
   * @returns true if signature is valid
   */
  verify(
    sig: Cigar | Uint8Array | string,
    ser: Uint8Array
  ): boolean {
    let sigBytes: Uint8Array;

    if (sig instanceof Cigar) {
      sigBytes = sig.raw;
    } else if (typeof sig === 'string') {
      const cigar = new Cigar({ qb64: sig });
      sigBytes = cigar.raw;
    } else {
      sigBytes = sig;
    }

    if (
      this._code === MatterCodex.Ed25519 ||
      this._code === MatterCodex.Ed25519N
    ) {
      try {
        return ed.verify(sigBytes, ser, this._raw);
      } catch (error) {
        return false;
      }
    } else {
      throw new Error(`Unsupported verfer code: ${this._code}`);
    }
  }
}

/**
 * Cigar - Non-indexed signature
 *
 * Ed25519 signature without controller index
 */
export class Cigar extends Matter {
  constructor(params: MatterParams = {}) {
    super(params);
  }

  protected defaultCode(): string {
    return MatterCodex.Ed25519_Sig;
  }
}

/**
 * Create a new signer with random seed
 */
export function newSigner(transferable: boolean = true): Signer {
  const seed = (ed as any).etc.randomPrivateKey();
  return new Signer({ raw: seed, transferable });
}
