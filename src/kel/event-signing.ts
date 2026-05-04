/**
 * Event Signing - KEL Event Signature Operations
 *
 * Provides deterministic event serialization and signing for KEL events.
 * Implements the KERI event signing specification with proper CESR attachments.
 *
 * Two-level API:
 * - Low-level: signCesrEventWithSigner() - Sign with a specific Signer and keyIndex
 * - High-level: signCesrEventWithVaultAndKEL() - Auto-discover keys from Vault + KEL
 *
 * @module kel/event-signing
 */

import type { Signer } from '../signature/signer.js';
import { canonicalizeEvent } from './event-crypto.js';
import type { KEL } from './kel-interface.js';
import { isEstablishment, isIxn } from './predicates.js';
import type { AID, CESREvent, CesrAttachment, KELEvent, PublicKey } from './types.js';
import type { Vault } from './vault-interface.js';

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

/**
 * Signs a CESR event envelope using a Vault and KEL to auto-discover signing keys.
 *
 * This is the high-level signing API. It:
 * 1. Determines which keys should sign based on event type:
 *    - Establishment events (icp/rot/dip/drt): Use keys from event.k[]
 *    - Interaction events (ixn): Use keys from current KSN.k[]
 * 2. For each key in the signing set:
 *    - Check if Vault has a Signer for that key
 *    - If yes, sign with that key at its proper index
 * 3. Returns the envelope with all available signatures attached
 *
 * Multi-sig principle: Each device signs only with keys it locally controls.
 * External signatures must be collected separately via signature ceremonies.
 *
 * @param kel - The KEL interface (provides access to current state)
 * @param vault - The Vault containing Signers for locally-controlled keys
 * @param env - The CESR event envelope to sign
 * @returns Updated CESR event envelope with all local signatures attached
 */
export async function signCesrEventWithVaultAndKEL(kel: KEL, vault: Vault, env: CESREvent): Promise<CESREvent> {
  const event = env.event;

  // Get the AID from the KEL's current Key State Notice
  const ksn = await kel.ksn();
  if (!ksn) {
    throw new Error('Cannot sign event: No current KSN found in KEL');
  }
  const aid = ksn.i as AID;

  // Determine which keys should sign this event
  let signingKeys: PublicKey[];

  if (isEstablishment(event)) {
    // Establishment events (icp, rot, dip, drt) sign with keys in event.k
    signingKeys = (event as any).k as PublicKey[];
  } else if (isIxn(event)) {
    // Interaction events sign with current KSN keys
    if (!ksn.k || ksn.k.length === 0) {
      throw new Error('Cannot sign interaction event: No current KSN found');
    }
    signingKeys = ksn.k as PublicKey[];
  } else {
    throw new Error(`Unsupported event type for signing: ${(event as any).t || 'unknown'}`);
  }

  // Sign with each key that this vault controls
  let signedEnv = env;

  for (let keyIndex = 0; keyIndex < signingKeys.length; keyIndex++) {
    const publicKey = signingKeys[keyIndex];
    if (!publicKey) continue;

    // Check if vault has a signer for this key
    const hasSigner = await vault.hasSigner(publicKey);
    if (!hasSigner) {
      // This key is not controlled by this vault - skip it
      // (Will be signed by external party in multi-sig ceremony)
      continue;
    }

    // Get the signer for this key
    const signer = await vault.getSigner(publicKey);
    if (!signer) {
      // Should not happen if hasSigner returned true, but check anyway
      continue;
    }

    // Sign with this key
    signedEnv = await signCesrEventWithSigner(signedEnv, signer, aid, keyIndex);
  }

  return signedEnv;
}
