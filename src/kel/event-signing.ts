/**
 * Event Signing - KEL Event Signature Operations
 *
 * Provides deterministic event serialization and signing for KEL events.
 * Implements the KERI event signing specification with proper CESR attachments.
 *
 * @module kel/event-signing
 */

import type { Signer } from '../signature/signer.js';
import { canonicalizeEvent } from './event-crypto.js';
import type { AID, CESREvent, CesrAttachment, KELEvent } from './types.js';

/**
 * Encodes a KEL event to canonical bytes for signing.
 *
 * Uses surface-based insertion-order JSON serialization (keripy-compatible).
 * Future: Add CBOR and MGPK support.
 *
 * @param event - The KEL event to encode
 * @param encoding - The encoding format ('JSON', 'CBOR', 'MGPK')
 * @returns Canonical byte representation for signing
 * @throws Error if encoding is not supported
 */
export function encodeEventBytes(event: KELEvent, encoding: 'JSON' | 'CBOR' | 'MGPK' = 'JSON'): Uint8Array {
  if (encoding !== 'JSON') {
    throw new Error(`Encoding ${encoding} not yet supported. Only JSON is currently implemented.`);
  }

  // Use surface-based insertion-order serialization (keripy-compatible)
  return canonicalizeEvent(event);
}

/**
 * Signs a CESR event envelope with a specific Signer at a specific key index.
 *
 * This is the low-level signing primitive. It:
 * 1. Encodes the event to canonical bytes based on env.enc
 * 2. Signs the bytes using the provided Signer
 * 3. Attaches the signature to the envelope with the specified keyIndex
 *
 * The caller is responsible for:
 * - Ensuring the Signer controls the key at the specified index
 * - Providing the correct keyIndex for the key being used
 *
 * @param env - The CESR event envelope to sign
 * @param signer - The Signer instance to use for signing
 * @param aid - The AID of the controller signing this event
 * @param keyIndex - The index of the key in the event's k[] array (default: 0)
 * @returns Updated CESR event envelope with signature attached
 */
export async function signCesrEventWithSigner(
  env: CESREvent,
  signer: Signer,
  aid: AID,
  keyIndex = 0,
): Promise<CESREvent> {
  // Encode event to canonical bytes
  const eventBytes = encodeEventBytes(env.event, env.enc);

  // Sign the canonical bytes
  const signature = await signer.signBytes(eventBytes);

  // Create indexed signature attachment
  const sigAttachment: CesrAttachment = {
    kind: 'sig',
    form: 'indexed',
    signerAid: aid,
    keyIndex,
    sig: signature,
  };

  // Return updated envelope with signature attached
  return {
    ...env,
    attachments: [...env.attachments, sigAttachment],
  };
}
