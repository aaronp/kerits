/**
 * KERI Event Verification
 *
 * Verify CESR indexed signatures on KERI events.
 */

import { Verfer, Cigar } from '../model/cesr/cesr';
import { parseCesrStream, parseIndexedSignatures } from './signing';
import type { KeyState } from './keystate';

/**
 * Verification result for an event
 */
export interface VerificationResult {
  /** Overall validity */
  valid: boolean;
  /** Number of valid signatures */
  verifiedCount: number;
  /** Required signature count (threshold) */
  requiredCount: number;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

/**
 * Verify signatures on a signed CESR event
 *
 * @param signedCesr - Combined CESR stream (event + signatures)
 * @param expectedKeys - Expected signing keys (verfers in CESR format)
 * @param threshold - Required number of valid signatures
 * @returns Verification result
 *
 * @example
 * const result = await verifyEvent(signedCesr, keyState.currentKeys, keyState.currentThreshold);
 * if (!result.valid) {
 *   console.error('Invalid signatures:', result.errors);
 * }
 */
export async function verifyEvent(
  signedCesr: Uint8Array,
  expectedKeys: string[],
  threshold: number
): Promise<VerificationResult> {
  const result: VerificationResult = {
    valid: false,
    verifiedCount: 0,
    requiredCount: threshold,
    errors: [],
    warnings: [],
  };

  try {
    // Parse CESR stream to separate event and signatures
    const { event, signatures } = parseCesrStream(signedCesr);

    if (!signatures) {
      result.errors.push('No signatures found in CESR stream');
      return result;
    }

    // Parse indexed signatures
    let indexedSigs: Array<{ index: number; signature: string }>;
    try {
      indexedSigs = parseIndexedSignatures(signatures);
    } catch (error: any) {
      result.errors.push(`Failed to parse signatures: ${error.message}`);
      return result;
    }

    if (indexedSigs.length === 0) {
      result.errors.push('No signatures found');
      return result;
    }

    // Verify each signature
    let validCount = 0;
    for (const { index, signature } of indexedSigs) {
      // Check index bounds
      if (index >= expectedKeys.length) {
        result.errors.push(`Invalid key index: ${index} (only ${expectedKeys.length} keys available)`);
        continue;
      }

      // Get expected key
      const expectedKey = expectedKeys[index];

      try {
        // Create verfer from expected key
        const verfer = new Verfer({ qb64: expectedKey });

        // Create cigar from signature
        const cigar = new Cigar({ qb64: signature });

        // Verify signature
        const valid = verfer.verify(cigar, event);

        if (valid) {
          validCount++;
        } else {
          result.errors.push(`Signature verification failed for key index ${index}`);
        }
      } catch (error: any) {
        result.errors.push(`Error verifying signature at index ${index}: ${error.message}`);
      }
    }

    // Check if threshold is met
    result.verifiedCount = validCount;
    result.valid = validCount >= threshold;

    if (!result.valid) {
      result.errors.push(
        `Insufficient valid signatures: ${validCount}/${threshold} required`
      );
    }

    // Warnings
    if (validCount > threshold) {
      result.warnings.push(
        `More signatures than required: ${validCount} valid, only ${threshold} needed`
      );
    }

    return result;
  } catch (error: any) {
    result.errors.push(`Verification error: ${error.message}`);
    return result;
  }
}

/**
 * Verify a KEL event using key state
 *
 * For inception and interaction events, uses current keys.
 * For rotation events, uses next keys from prior event (pre-rotation).
 *
 * @param signedCesr - Signed CESR event
 * @param keyState - Current key state
 * @param eventType - Event type (icp, rot, ixn)
 * @param priorNextKeys - For rotation: next keys from prior event
 * @returns Verification result
 */
export async function verifyKelEvent(
  signedCesr: Uint8Array,
  keyState: KeyState,
  eventType: string,
  priorNextKeys?: string[]
): Promise<VerificationResult> {
  // For rotation events, verify with NEXT keys from prior event
  if (eventType === 'rot') {
    if (!priorNextKeys || priorNextKeys.length === 0) {
      return {
        valid: false,
        verifiedCount: 0,
        requiredCount: keyState.currentThreshold,
        errors: ['Rotation event requires prior next keys for verification'],
        warnings: [],
      };
    }

    // Verify with prior next keys (pre-rotation commitment)
    return verifyEvent(signedCesr, priorNextKeys, keyState.nextThreshold);
  }

  // For inception and interaction, use current keys
  return verifyEvent(signedCesr, keyState.currentKeys, keyState.currentThreshold);
}

/**
 * Verify a TEL event using issuer's key state
 *
 * TEL events (VCP, ISS, REV, IXN) are signed by the issuer's current keys.
 *
 * @param signedCesr - Signed CESR event
 * @param issuerKeyState - Issuer's key state
 * @returns Verification result
 */
export async function verifyTelEvent(
  signedCesr: Uint8Array,
  issuerKeyState: KeyState
): Promise<VerificationResult> {
  return verifyEvent(
    signedCesr,
    issuerKeyState.currentKeys,
    issuerKeyState.currentThreshold
  );
}

/**
 * Verify an entire KEL chain
 *
 * Replays KEL and verifies signatures on each event.
 *
 * @param kelEvents - Array of signed KEL events
 * @returns Verification result for the chain
 */
export async function verifyKelChain(
  kelEvents: Array<{ raw: Uint8Array; meta: any }>
): Promise<VerificationResult> {
  const result: VerificationResult = {
    valid: true,
    verifiedCount: 0,
    requiredCount: kelEvents.length,
    errors: [],
    warnings: [],
  };

  if (kelEvents.length === 0) {
    result.errors.push('Empty KEL chain');
    result.valid = false;
    return result;
  }

  let keyState: KeyState | null = null;
  let priorKeyState: KeyState | null = null;

  for (let i = 0; i < kelEvents.length; i++) {
    const event = kelEvents[i];
    const meta = event.meta;

    // For first event (inception), we need to extract keys from metadata
    if (i === 0) {
      if (meta.t !== 'icp') {
        result.errors.push('First event must be inception (icp)');
        result.valid = false;
        return result;
      }

      keyState = {
        aid: meta.i,
        sn: 0,
        currentKeys: meta.keys || [],
        nextDigests: meta.nextDigests || [],
        currentThreshold: meta.threshold || 1,
        nextThreshold: meta.nextThreshold || 1,
        lastEventDigest: meta.d,
      };
    }

    if (!keyState) {
      result.errors.push(`No key state available for event ${i}`);
      result.valid = false;
      return result;
    }

    // Verify event signature
    const verifyResult = await verifyKelEvent(
      event.raw,
      keyState,
      meta.t,
      priorKeyState?.nextDigests
    );

    if (!verifyResult.valid) {
      result.errors.push(`Event ${i} (sn=${meta.s}, type=${meta.t}) verification failed: ${verifyResult.errors.join(', ')}`);
      result.valid = false;
    } else {
      result.verifiedCount++;
    }

    // Update key state for next event
    priorKeyState = keyState;

    if (meta.t === 'rot') {
      keyState = {
        ...keyState,
        sn: meta.s,
        currentKeys: meta.keys || [],
        nextDigests: meta.nextDigests || [],
        currentThreshold: meta.threshold || 1,
        nextThreshold: meta.nextThreshold || 1,
        lastEventDigest: meta.d,
      };
    } else if (meta.t === 'ixn') {
      keyState = {
        ...keyState,
        sn: meta.s,
        lastEventDigest: meta.d,
      };
    }
  }

  return result;
}

/**
 * Quick check if event has signatures attached
 *
 * @param cesrStream - CESR stream to check
 * @returns True if signatures are present
 */
export function hasSignatures(cesrStream: Uint8Array): boolean {
  const text = new TextDecoder().decode(cesrStream);
  return text.includes('-AAD');
}

/**
 * Extract event bytes without signatures
 *
 * Useful for re-signing or inspecting unsigned events.
 *
 * @param signedCesr - Signed CESR stream
 * @returns Event bytes without signatures
 */
export function extractEventBytes(signedCesr: Uint8Array): Uint8Array {
  const { event } = parseCesrStream(signedCesr);
  return event;
}
