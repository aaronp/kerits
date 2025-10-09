/**
 * KERI Event Signing with CESR Indexed Signatures
 *
 * Implements attachment of indexed signatures to KERI events per the CESR spec.
 */

import type { Signer } from '../cesr/signer';
import type { Cigar } from '../cesr/signer';

/**
 * Signed event with CESR-compliant indexed signatures
 */
export interface SignedEvent {
  /** Original event bytes (without signatures) */
  event: Uint8Array;
  /** CESR indexed signature section */
  signatures: Uint8Array;
  /** Combined: event || signatures (ready for storage) */
  combined: Uint8Array;
}

/**
 * Indexed signature entry
 */
export interface IndexedSignature {
  /** Key index (0-63) */
  index: number;
  /** Signature object */
  signature: Cigar;
}

/**
 * Sign a KERI event with indexed signatures
 *
 * Creates CESR-compliant indexed signatures section and attaches to event.
 * Format: -AAD{count}{index}{sig}{index}{sig}...
 *
 * @param eventBytes - Serialized event (CESR-framed)
 * @param signers - Array of signers (typically 1 for single-sig)
 * @param indices - Key indices for each signer (default: [0, 1, 2, ...])
 * @returns Signed event with attached signatures
 *
 * @example
 * const eventBytes = serializeEvent(icp.ked);
 * const signer = keyManager.getSigner(aid);
 * const signed = await signEvent(eventBytes, [signer]);
 * await store.putEvent(signed.combined);
 */
export async function signEvent(
  eventBytes: Uint8Array,
  signers: Signer[],
  indices?: number[]
): Promise<SignedEvent> {
  if (signers.length === 0) {
    throw new Error('At least one signer is required');
  }

  // Default indices: 0, 1, 2, ...
  if (!indices) {
    indices = signers.map((_, i) => i);
  }

  if (indices.length !== signers.length) {
    throw new Error('Number of indices must match number of signers');
  }

  // Validate indices (must be 0-63 for current CESR encoding)
  for (const idx of indices) {
    if (idx < 0 || idx > 63) {
      throw new Error(`Invalid index ${idx}: must be 0-63`);
    }
  }

  const verferQb64 = typeof signers[0].verfer === 'string' ? signers[0].verfer : signers[0].verfer.qb64;

  // Sign with each signer
  const indexedSigs: IndexedSignature[] = [];
  for (let i = 0; i < signers.length; i++) {
    const signature = signers[i].sign(eventBytes);
    indexedSigs.push({ index: indices[i], signature });
  }

  // Build CESR indexed signature section
  const sigSection = buildIndexedSignatureSection(indexedSigs);

  // Combine event + newline + signatures (CESR requires newline separation)
  const newline = new TextEncoder().encode('\n');
  const combined = new Uint8Array(eventBytes.length + newline.length + sigSection.length);
  combined.set(eventBytes, 0);
  combined.set(newline, eventBytes.length);
  combined.set(sigSection, eventBytes.length + newline.length);

  return {
    event: eventBytes,
    signatures: sigSection,
    combined,
  };
}

/**
 * Build CESR indexed signature section
 *
 * Format: -AAD{count}{index}{sig}{index}{sig}...
 *
 * Where:
 * - "-AAD" is the indexed signature group code
 * - {count} is 2-digit hex count of signatures (00-FF)
 * - {index} is single char A-Z, a-z for indices 0-51 (or 0A-0Z for 52-63)
 * - {sig} is the CESR-encoded signature (e.g., 0B prefix for Ed25519)
 *
 * @param sigs - Array of indexed signatures
 * @returns CESR-encoded signature section
 */
function buildIndexedSignatureSection(sigs: IndexedSignature[]): Uint8Array {
  if (sigs.length === 0) {
    throw new Error('At least one signature is required');
  }

  if (sigs.length > 255) {
    throw new Error('Maximum 255 signatures supported');
  }

  // Count as 2-digit uppercase hex
  const countHex = sigs.length.toString(16).toUpperCase().padStart(2, '0');

  // Build signature section
  let sigSection = `-AAD${countHex}`;

  for (const { index, signature } of sigs) {
    // Encode index as single character (A=0, B=1, ..., Z=25, a=26, ..., z=51)
    // For 52-63, use 0A-0Z format
    let indexChar: string;
    if (index < 26) {
      indexChar = String.fromCharCode(65 + index); // A-Z (0-25)
    } else if (index < 52) {
      indexChar = String.fromCharCode(97 + (index - 26)); // a-z (26-51)
    } else {
      // 52-63: use 0A-0Z format
      const offset = index - 52;
      indexChar = '0' + String.fromCharCode(65 + offset);
    }

    sigSection += indexChar + signature.qb64;
  }

  return new TextEncoder().encode(sigSection);
}

/**
 * Parse a CESR stream to separate event and signatures
 *
 * @param cesrStream - Combined CESR stream (event + signatures)
 * @returns Object with event and signature sections
 */
export function parseCesrStream(cesrStream: Uint8Array): {
  event: Uint8Array;
  signatures: Uint8Array | null;
} {
  const text = new TextDecoder().decode(cesrStream);

  // Look for indexed signature section (starts with "-AAD")
  const sigStart = text.indexOf('-AAD');

  if (sigStart === -1) {
    // No signatures found
    return {
      event: cesrStream,
      signatures: null,
    };
  }

  // Split at signature boundary
  // The event includes everything up to (but not including) the newline before -AAD
  let eventEnd = sigStart;
  // Check if there's a newline just before -AAD and exclude it
  if (sigStart > 0 && (text[sigStart - 1] === '\n' || text[sigStart - 1] === '\r')) {
    eventEnd = sigStart - 1;
    // Check for \r\n
    if (eventEnd > 0 && text[eventEnd - 1] === '\r') {
      eventEnd--;
    }
  }

  const event = cesrStream.slice(0, eventEnd);
  const signatures = cesrStream.slice(sigStart);

  return { event, signatures };
}

/**
 * Parse indexed signatures from CESR section
 *
 * @param sigSection - CESR indexed signature section
 * @returns Array of parsed signatures with indices
 */
export function parseIndexedSignatures(sigSection: Uint8Array): Array<{
  index: number;
  signature: string;
}> {
  const text = new TextDecoder().decode(sigSection);

  if (!text.startsWith('-AAD')) {
    throw new Error('Invalid indexed signature section: must start with -AAD');
  }

  // Parse count (2 hex digits after -AAD)
  const countHex = text.substring(4, 6);
  const count = parseInt(countHex, 16);

  if (isNaN(count) || count === 0) {
    throw new Error(`Invalid signature count: ${countHex}`);
  }

  // Parse signatures
  const results: Array<{ index: number; signature: string }> = [];
  let pos = 6; // Start after "-AAD{count}"

  for (let i = 0; i < count; i++) {
    // Parse index
    let index: number;
    let indexLen: number;

    if (text[pos] === '0' && pos + 1 < text.length) {
      // Two-character index (0A-0Z for 52-63)
      const secondChar = text[pos + 1];
      if (secondChar >= 'A' && secondChar <= 'Z') {
        index = 52 + (secondChar.charCodeAt(0) - 65);
        indexLen = 2;
      } else {
        throw new Error(`Invalid two-character index at position ${pos}: 0${secondChar}`);
      }
    } else {
      // Single character index
      const char = text[pos];
      if (char >= 'A' && char <= 'Z') {
        index = char.charCodeAt(0) - 65; // A=0, B=1, ..., Z=25
      } else if (char >= 'a' && char <= 'z') {
        index = 26 + (char.charCodeAt(0) - 97); // a=26, b=27, ..., z=51
      } else {
        throw new Error(`Invalid index character at position ${pos}: ${char}`);
      }
      indexLen = 1;
    }

    pos += indexLen;

    // Parse signature (Ed25519 signature is "0B" prefix + 86 base64 chars = 88 total)
    // For now, we'll extract the signature code and determine length
    if (pos + 2 > text.length) {
      throw new Error(`Unexpected end of signature section at position ${pos}`);
    }

    const sigCode = text.substring(pos, pos + 2);
    let sigLen: number;

    if (sigCode === '0B') {
      // Ed25519 signature: 88 chars total (0B + 86 base64)
      sigLen = 88;
    } else if (sigCode === '0C') {
      // ECDSA signature: 88 chars total
      sigLen = 88;
    } else {
      throw new Error(`Unknown signature code: ${sigCode}`);
    }

    if (pos + sigLen > text.length) {
      throw new Error(`Signature extends beyond section boundary at position ${pos}`);
    }

    const signature = text.substring(pos, pos + sigLen);
    results.push({ index, signature });

    pos += sigLen;
  }

  return results;
}

/**
 * Sign a KEL event (ICP, ROT, IXN)
 *
 * Convenience wrapper for signEvent that enforces single-signer for current keys.
 *
 * @param eventBytes - Serialized KEL event
 * @param signer - Current key signer
 * @returns Signed event
 */
export async function signKelEvent(
  eventBytes: Uint8Array,
  signer: Signer
): Promise<SignedEvent> {
  return signEvent(eventBytes, [signer], [0]);
}

/**
 * Sign a TEL event (VCP, ISS, REV, IXN)
 *
 * Convenience wrapper for signEvent that enforces single-signer for issuer.
 *
 * @param eventBytes - Serialized TEL event
 * @param signer - Issuer key signer
 * @returns Signed event
 */
export async function signTelEvent(
  eventBytes: Uint8Array,
  signer: Signer
): Promise<SignedEvent> {
  return signEvent(eventBytes, [signer], [0]);
}
