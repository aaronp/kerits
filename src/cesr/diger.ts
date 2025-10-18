/**
 * CESR Diger - Digest/SAID generation
 *
 * Creates cryptographic digests encoded in CESR format
 */

import { Matter, type MatterParams } from './matter.js';
import { MatterCodex, DigDex } from './codex.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { sha3_256, sha3_512 } from '@noble/hashes/sha3.js';
import { blake2b, blake2s } from '@noble/hashes/blake2.js';

export interface DigerParams extends MatterParams {
  ser?: Uint8Array | string;  // Serialization to digest
}

/**
 * Diger - Cryptographic digest primitive
 *
 * Computes and verifies cryptographic digests (SAIDs)
 */
export class Diger extends Matter {
  constructor(params: DigerParams = {}) {
    // If ser provided, compute digest
    if (params.ser !== undefined && params.raw === undefined) {
      const code = params.code || DigDex.Blake3_256;
      const serBytes = typeof params.ser === 'string'
        ? new TextEncoder().encode(params.ser)
        : params.ser;

      params.raw = Diger._digest(serBytes, code);
      params.code = code;
    }

    super(params);
  }

  /**
   * Default code for Diger is Blake3-256
   */
  protected defaultCode(): string {
    return DigDex.Blake3_256;
  }

  /**
   * Compute cryptographic digest
   *
   * @param ser - Serialized data to digest
   * @param code - Digest algorithm code
   * @returns Raw digest bytes
   */
  static _digest(ser: Uint8Array, code: string): Uint8Array {
    switch (code) {
      case DigDex.Blake3_256:
      case MatterCodex.Blake3_256:
        return blake3(ser, { dkLen: 32 });

      case DigDex.Blake3_512:
      case MatterCodex.Blake3_512:
        return blake3(ser, { dkLen: 64 });

      case DigDex.Blake2b_256:
      case MatterCodex.Blake2b_256:
        return blake2b(ser, { dkLen: 32 });

      case DigDex.Blake2b_512:
      case MatterCodex.Blake2b_512:
        return blake2b(ser, { dkLen: 64 });

      case MatterCodex.Blake2s_256:
        return blake2s(ser, { dkLen: 32 });

      case DigDex.SHA3_256:
      case MatterCodex.SHA3_256:
        return sha3_256(ser);

      case DigDex.SHA3_512:
      case MatterCodex.SHA3_512:
        return sha3_512(ser);

      case DigDex.SHA2_256:
      case MatterCodex.SHA2_256:
        return sha256(ser);

      case DigDex.SHA2_512:
      case MatterCodex.SHA2_512:
        return sha512(ser);

      default:
        throw new Error(`Unsupported digest code: ${code}`);
    }
  }

  /**
   * Verify that this digest matches a serialization
   *
   * @param ser - Serialized data to verify
   * @returns true if digest matches
   */
  verify(ser: Uint8Array | string): boolean {
    const serBytes = typeof ser === 'string'
      ? new TextEncoder().encode(ser)
      : ser;

    const computed = Diger._digest(serBytes, this._code);

    if (computed.length !== this._raw.length) {
      return false;
    }

    for (let i = 0; i < computed.length; i++) {
      if (computed[i] !== this._raw[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compare SAIDs (alias for equals)
   */
  compare(said: string): boolean {
    return this.qb64 === said;
  }
}
