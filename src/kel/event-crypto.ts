/**
 * Shared KEL event cryptographic utilities.
 *
 * Provides canonicalization and signature verification for KEL events.
 * Used by both validation.ts and validation-predicates.ts.
 */

import type { DerivationSurface } from '../common/derivation-surface.js';
import { serializeForSigning } from '../common/derivation-surface.js';
import type { PublicKey, Signature } from '../common/types.js';
import {
  KEL_DIP_SURFACE,
  KEL_DRT_SURFACE,
  KEL_ICP_SURFACE,
  KEL_IXN_SURFACE,
  KEL_ROT_SURFACE,
} from '../said/surfaces.js';
import { verify } from '../signature/verify.js';
import type { KELEvent } from './types.js';

function selectSurface(ilk: string): DerivationSurface {
  switch (ilk) {
    case 'icp':
      return KEL_ICP_SURFACE;
    case 'rot':
      return KEL_ROT_SURFACE;
    case 'ixn':
      return KEL_IXN_SURFACE;
    case 'dip':
      return KEL_DIP_SURFACE;
    case 'drt':
      return KEL_DRT_SURFACE;
    default:
      throw new Error(`canonicalizeEvent: unknown ilk '${ilk}'`);
  }
}

/**
 * Canonicalize a KEL event to its insertion-order JSON bytes.
 *
 * KERI signatures are created over these canonical bytes, using the
 * surface's derivedFieldsInOrder for consistent field ordering.
 */
export function canonicalizeEvent(event: KELEvent): Uint8Array {
  const surface = selectSurface(event.t);
  const { raw } = serializeForSigning(event as Record<string, unknown>, surface);
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
