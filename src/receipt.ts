import { versify, Protocol, VERSION_1_0, Kind } from './versify';

/**
 * Receipt (rct) Events for KERI
 *
 * Receipts are non-repudiable cryptographic commitments that acknowledge
 * receipt and validation of a KERI event. They can be used for:
 * - Witnessing KEL events
 * - Accepting credentials
 * - Confirming event processing
 */

/**
 * Receipt options
 */
export interface ReceiptOptions {
  pre: string;    // Prefix (AID) of event being receipted
  sn: number;     // Sequence number of event being receipted
  said: string;   // SAID of event being receipted
}

/**
 * Receipt result
 */
export interface Receipt {
  sad: Record<string, any>;  // Receipt as JSON object
  raw: string;               // Serialized receipt
  said: string;              // SAID of receipted event (same as input said)
}

/**
 * Create a receipt event (rct)
 *
 * Creates a non-repudiable receipt for a KERI event. Receipts acknowledge
 * that an entity has received and validated an event.
 *
 * @param options - Receipt options
 * @returns Receipt event
 */
export function receipt(options: ReceiptOptions): Receipt {
  const { pre, sn, said } = options;

  // Validate required fields
  if (!pre) {
    throw new Error('Prefix (pre) is required');
  }

  if (sn < 0) {
    throw new Error('Sequence number (sn) must be >= 0');
  }

  if (!said) {
    throw new Error('SAID of receipted event is required');
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create receipt structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'rct',          // Receipt ilk
    d: said,           // SAID of receipted event
    i: pre,            // Prefix of receipted event
    s: sn.toString(16), // Sequence number (hex, no leading zeros)
  };

  // Compute size with placeholder values
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: said,  // Receipt SAID is the SAID of the receipted event
  };
}

/**
 * Parse a receipt from raw JSON
 *
 * @param raw - Serialized receipt JSON
 * @returns Parsed receipt
 */
export function parseReceipt(raw: string): Receipt {
  const sad = JSON.parse(raw);

  if (!sad.d) {
    throw new Error('Receipt must have d (SAID) field');
  }

  if (!sad.v || !sad.v.startsWith('KERI')) {
    throw new Error('Invalid receipt version string');
  }

  if (sad.t !== 'rct') {
    throw new Error('Invalid receipt type, expected "rct"');
  }

  if (!sad.i) {
    throw new Error('Receipt must have i (prefix) field');
  }

  if (sad.s === undefined) {
    throw new Error('Receipt must have s (sequence number) field');
  }

  return {
    sad,
    raw,
    said: sad.d,
  };
}
