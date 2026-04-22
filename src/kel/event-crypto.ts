/**
 * Shared KEL event cryptographic utilities.
 *
 * Provides canonicalization and signature verification for KEL events.
 * Used by both validation.ts and validation-predicates.ts.
 */

import { Data } from '../common/data.js';
import type { PublicKey, Signature } from '../common/types.js';
import { verify } from '../signature/verify.js';
import type { KELEvent } from './types.js';

/**
 * Canonicalize a KEL event to its RFC8785 JSON bytes.
 *
 * KERI signatures are created over these canonical bytes.
 */
export function canonicalizeEvent(event: KELEvent): Uint8Array {
  const { raw } = Data.fromJson(event).canonicalize();
  return raw;
}

/**
 * Verify a signature against a KEL event's canonical bytes.
 *
 * @param event - The KEL event
 * @param publicKey - Public key to verify with (CESR qb64 encoded)
 * @param signature - Signature to verify (CESR qb64 encoded)
 * @returns true if signature is valid
 */
export function verifyEventSignature(event: KELEvent, publicKey: PublicKey, signature: Signature): boolean {
  return verify(publicKey, signature, canonicalizeEvent(event));
}
