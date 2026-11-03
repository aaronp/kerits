import { digestVerfer } from '../cesr/digest.js';
import { decodeKey, encodeKey } from '../cesr/keys.js';
import type { Algo } from '../common/algo.js';
import type { CesrDigest, PublicKey } from '../common/types.js';
import type { RawPublicKey } from './types.js';

export namespace PublicKeys {
  export function parse(qb64: string): PublicKey {
    decodeKey(qb64);
    return qb64 as PublicKey;
  }

  export function fromRaw(raw: RawPublicKey): PublicKey {
    const bytes = raw as Uint8Array;
    if (bytes.length === 32) {
      return encodeKey(bytes, true, 'ed25519').qb64 as PublicKey;
    }
    if (bytes.length === 33) {
      return encodeKey(bytes, true, 'secp256k1').qb64 as PublicKey;
    }
    throw new Error(`PublicKeys.fromRaw: unsupported key length ${bytes.length}`);
  }

  export function toRaw(key: PublicKey): RawPublicKey {
    return decodeKey(key).raw as RawPublicKey;
  }

  export function algo(key: PublicKey): Algo {
    return decodeKey(key).algo;
  }

  export function digest(key: PublicKey): CesrDigest {
    return digestVerfer(key) as CesrDigest;
  }
}
