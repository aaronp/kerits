import { versify, Protocol, VERSION_1_0, Kind } from './versify';
import { numToHex } from './number';
import { Tholder, defaultThreshold, defaultNextThreshold, type ThresholdValue } from './tholder';
import { saidify } from './saidify';
import type { RotationEvent as KeriRotationEvent, DelegatedRotationEvent as KeriDelegatedRotationEvent } from './types/keri';

export type Threshold = ThresholdValue;

export interface RotateOptions {
  pre: string;          // identifier prefix (AID)
  keys: string[];       // new signing keys (verfers)
  dig: string;          // SAID of prior event
  sn?: number;          // sequence number (default: 1)
  isith?: Threshold;    // current signing threshold (numeric or weighted)
  ndigs?: string[];     // next key digests
  nsith?: Threshold;    // next signing threshold (numeric or weighted)
  delpre?: string;      // delegator identifier (for delegated rotation)
}

export interface RotationEvent {
  /** Key Event Dict - conforms to canonical KelEvent type */
  ked: KeriRotationEvent | KeriDelegatedRotationEvent;
  raw: string;
  said: string;
}

/**
 * Create a KERI rotation event
 *
 * Pure function that creates a rotation event for key rotation.
 * The rotation event updates the signing keys and establishes next keys.
 * Supports both numeric and weighted thresholds.
 *
 * @param options - Rotation event options
 * @returns Rotation event with KED, raw serialization, and SAID
 */
export function rotate(options: RotateOptions): RotationEvent {
  const {
    pre,
    keys,
    dig,
    sn = 1,
    isith,
    ndigs = [],
    nsith,
    delpre
  } = options;

  // Validate inputs
  if (!pre) {
    throw new Error('Prefix (pre) is required');
  }

  if (!keys || keys.length === 0) {
    throw new Error('At least one signing key is required');
  }

  if (!dig) {
    throw new Error('Prior event digest (dig) is required');
  }

  if (sn < 1) {
    throw new Error(`Invalid sequence number ${sn}, must be >= 1 for rotation`);
  }

  // Compute thresholds
  const currentThreshold = isith !== undefined ? isith : defaultThreshold(keys.length);
  const nextThreshold = nsith !== undefined ? nsith : defaultNextThreshold(ndigs.length);

  // Validate thresholds
  const tholder = new Tholder({ sith: currentThreshold });
  tholder.validate(keys.length);

  const ntholder = new Tholder({ sith: nextThreshold });
  if (ndigs.length > 0) {
    ntholder.validate(ndigs.length);
  }

  // Create initial version string
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Format thresholds for KED (can be numeric or weighted)
  const ktValue = formatThreshold(currentThreshold);
  const ntValue = formatThreshold(nextThreshold);

  // Build KED (Key Event Dict)
  const ked: Record<string, any> = {
    v: vs,
    t: delpre ? 'drt' : 'rot',  // delegated rotation or regular rotation
    d: '',
    i: pre,
    s: numToHex(sn),
    p: dig,
    kt: ktValue,
    k: keys,
    nt: ntValue,
    n: ndigs,
    bt: numToHex(0),    // witness threshold (0 for now)
    br: [],             // witness cuts (empty for now)
    ba: [],             // witness adds (empty for now)
    a: [],              // anchors/seals (empty for now)
  };

  // Add delegator identifier for delegated rotation
  if (delpre) {
    ked.di = delpre;
  }

  // Compute size first with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID with correct version
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    ked,
    raw: serialized,
    said: ked.d,
  };
}

/**
 * Format threshold value for KED
 * Converts number/string/array to proper format for serialization
 */
function formatThreshold(threshold: Threshold): string | string[] {
  if (Array.isArray(threshold)) {
    // Weighted threshold: keep as array of strings
    return threshold;
  } else if (typeof threshold === 'number') {
    // Numeric threshold: convert to hex string
    return numToHex(threshold);
  } else {
    // Already a string: keep as-is
    return threshold;
  }
}
