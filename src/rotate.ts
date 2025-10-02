import { versify, Protocol, VERSION_1_0, Kind } from './versify';
import { numToHex } from './number';
import { Tholder, defaultThreshold, defaultNextThreshold } from './tholder';
import { saidify } from './saidify';

export interface RotateOptions {
  pre: string;          // identifier prefix (AID)
  keys: string[];       // new signing keys (verfers)
  dig: string;          // SAID of prior event
  sn?: number;          // sequence number (default: 1)
  isith?: number;       // current signing threshold
  ndigs?: string[];     // next key digests
  nsith?: number;       // next signing threshold
}

export interface RotationEvent {
  ked: Record<string, any>;
  raw: string;
  said: string;
}

/**
 * Create a KERI rotation event (MVP - no witnesses, numeric thresholds only)
 *
 * Pure function that creates a rotation event for key rotation.
 * The rotation event updates the signing keys and establishes next keys.
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
    nsith
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

  // Build KED (Key Event Dict)
  const ked: Record<string, any> = {
    v: vs,
    t: 'rot',
    d: '',
    i: pre,
    s: numToHex(sn),
    p: dig,
    kt: numToHex(currentThreshold),
    k: keys,
    nt: numToHex(nextThreshold),
    n: ndigs,
    bt: numToHex(0),    // witness threshold (0 for MVP)
    br: [],             // witness cuts (empty for MVP)
    ba: [],             // witness adds (empty for MVP)
    a: [],              // anchors/seals (empty for MVP)
  };

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
