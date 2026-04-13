import { DigiDex, Matter, MtrDex } from 'cesr-ts/src/matter';
import type { Qb64 } from './types.js';

export interface PrefixInfo {
  code: string; // CESR code (e.g. "D", "0B", "E")
  length: number; // total length (prefix + payload)
  kind: 'key' | 'sig' | 'digest' | 'other';
}

/**
 * Inspect a CESR qb64 value and classify it.
 * Uses cesr-ts Matter to decode and classify the primitive.
 */
export function inspect(qb64: Qb64): PrefixInfo {
  try {
    const matter = new Matter({ qb64 });

    let kind: PrefixInfo['kind'] = 'other';

    // Check if it's a key
    if (
      matter.code === MtrDex.Ed25519 ||
      matter.code === MtrDex.Ed25519N ||
      matter.code === MtrDex.X25519 ||
      matter.code === 'C'
    ) {
      kind = 'key';
    }
    // Check if it's a signature
    else if (
      matter.code === MtrDex.Ed25519_Sig ||
      matter.code === '0A' ||
      matter.code === MtrDex.ECDSA_256k1_Sig ||
      matter.code === MtrDex.ECDSA_256r1_Sig
    ) {
      kind = 'sig';
    }
    // Check if it's a digest using DigiDex
    else if (DigiDex.has(matter.code)) {
      kind = 'digest';
    }

    return {
      code: matter.code,
      length: qb64.length,
      kind,
    };
  } catch (_error) {
    // If parsing fails, return unknown
    return {
      code: qb64.slice(0, 4),
      length: qb64.length,
      kind: 'other',
    };
  }
}
