import { Serials } from 'cesr-ts/src/core';
import { MtrDex } from 'cesr-ts/src/matter';
import { Saider } from 'cesr-ts/src/saider';
import type { Qb64, SaidAlgo } from '../cesr/types.js';
import { Data } from '../common/data.js';
import type { SAID } from '../common/types.js';

/**
 * Deterministically compute SAID for a JSON-like object.
 * - Stable canonicalization
 * - Stable hashing (e.g. BLAKE3-256)
 *
 * @param value - Object with a 'd' field (or label specified) to compute SAID for
 * @param algo - Hash algorithm (default: blake3-256)
 * @param label - Field name for the SAID (default: 'd')
 * @returns The SAID qb64 string
 */
export function encodeSAID(value: Record<string, any>, algo: SaidAlgo = 'blake3-256', label: string = 'd'): Qb64 {
  const code = algo === 'blake3-256' ? MtrDex.Blake3_256 : MtrDex.Blake3_256;
  const [saider, _] = Saider.saidify(value, code, Serials.JSON, label);
  return saider.qb64;
}

/**
 * Verify that the given SAID matches the given content.
 *
 * @param said - The SAID qb64 string to verify
 * @param value - The object to verify against
 * @param algo - Hash algorithm (default: blake3-256)
 * @param label - Field name for the SAID (default: 'd')
 * @returns true if SAID is valid
 */
export function validateSAID(
  said: Qb64,
  value: Record<string, any>,
  algo: SaidAlgo = 'blake3-256',
  label: string = 'd',
): boolean {
  try {
    const _code = algo === 'blake3-256' ? MtrDex.Blake3_256 : MtrDex.Blake3_256;

    // Create a Saider from the given SAID
    const saider = new Saider({ qb64: said });

    // Verify it matches the value
    const valueCopy = { ...value, [label]: said };
    return saider.verify(valueCopy, false);
  } catch {
    return false;
  }
}

/**
 * Compute SAID for a JSON object using the project's canonicalization + digest rules.
 *
 * IMPORTANT: This must match how the rest of the codebase computes SAIDs.
 * If you already have a canonical SAID primitive elsewhere (e.g. KELEvents.computeSaid),
 * switch this implementation to call that instead.
 */
export function saidFromJson(obj: unknown): SAID {
  const canon = Data.fromJson(obj).canonicalize();
  // If Data.digest returns qb64 digest used as SAID in this codebase, keep it.
  // Otherwise replace with your existing SAID primitive.
  return Data.digest(canon.raw) as SAID;
}
