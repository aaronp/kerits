/**
 * Incept - Create KERI Inception Event
 *
 * Implementation supporting:
 * - Single or multiple signing keys
 * - Numeric and weighted thresholds
 * - No witnesses (bt=0, b=[])
 * - No configuration (c=[])
 * - No data seals (a=[])
 * - Non-delegated only (no delpre)
 */

import { versify, Protocol, Kind, VERSION_1_0 } from './versify';
import { numToHex } from './number';
import { Tholder, defaultThreshold, defaultNextThreshold, type ThresholdValue } from './tholder';
import { saidify } from './saidify';
import type { InceptionEvent as KeriInceptionEvent, DelegatedInceptionEvent as KeriDelegatedInceptionEvent } from './types/keri';

/**
 * Threshold type - can be numeric or weighted
 */
export type Threshold = ThresholdValue;

/**
 * Inception event options
 */
export interface InceptOptions {
  /** Current signing keys (verfer qb64 strings) */
  keys: string[];
  /** Next key digests (diger qb64 strings), default: [] */
  ndigs?: string[];
  /** Current signing threshold, default: ceil(keys.length/2) */
  isith?: Threshold;
  /** Next signing threshold, default: ceil(ndigs.length/2) */
  nsith?: Threshold;
  /** Delegator identifier prefix (for delegated inception) */
  delpre?: string;
}

/**
 * Inception event result
 */
export interface InceptionEvent {
  /** Key Event Dict - conforms to canonical KelEvent type */
  ked: KeriInceptionEvent | KeriDelegatedInceptionEvent;
  /** Serialized event (JSON) */
  raw: string;
  /** Prefix (identifier) */
  pre: string;
  /** SAID (digest) */
  said: string;
}

/**
 * Create a KERI inception event
 *
 * Generates an inception (icp) event that establishes a new KERI identifier.
 * The event includes current signing keys, next key digests, and thresholds.
 *
 * For a single key with no explicit derivation code, the prefix (i) equals
 * the first key. The SAID (d) is computed from the serialized event.
 *
 * @param options - Inception event options
 * @returns Inception event with KED, serialization, prefix, and SAID
 *
 * @example
 * const event = incept({
 *   keys: ['DSuhyBcPZEZLK-fcw5tzHn2N46wRCG_ZOoeKtWTOunRA'],
 *   ndigs: ['EPiaAesjPkPcUZwuSp9fz6uvPzt7pvBSkLGRs1gANSeA']
 * })
 */
export function incept(options: InceptOptions): InceptionEvent {
  const {
    keys,
    ndigs = [],
    isith,
    nsith,
    delpre,
  } = options;

  // Check if threshold parameters were explicitly provided (even if undefined)
  // This is used to determine derivation mode (basic vs self-addressing)
  const hasExplicitIsith = 'isith' in options;
  const hasExplicitNsith = 'nsith' in options;

  // Validate keys
  if (!keys || keys.length === 0) {
    throw new Error('At least one signing key is required');
  }

  // Determine thresholds
  const currentThreshold = isith !== undefined
    ? isith
    : defaultThreshold(keys.length);

  const nextThreshold = nsith !== undefined
    ? nsith
    : defaultNextThreshold(ndigs.length);

  // Validate thresholds
  const tholder = new Tholder({ sith: currentThreshold });
  tholder.validate(keys.length);

  const ntholder = new Tholder({ sith: nextThreshold });
  if (ndigs.length > 0) {
    ntholder.validate(ndigs.length);
  }

  // Build Key Event Dict (KED)
  // Start with version size=0, will be updated after SAID computation
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Format thresholds for KED
  // Thresholds can be: number, string (numeric), or string[] (weighted)
  const ktValue = formatThreshold(currentThreshold);
  const ntValue = formatThreshold(nextThreshold);

  const ked: Record<string, any> = {
    v: vs,
    t: delpre ? 'dip' : 'icp',  // delegated inception or regular inception
    d: '',     // SAID placeholder
    i: '',     // prefix placeholder
    s: numToHex(0),  // sequence number 0
    kt: ktValue,
    k: keys,
    nt: ntValue,
    n: ndigs,
    bt: numToHex(0),  // witness threshold (no witnesses)
    b: [],   // witnesses (empty)
    c: [],   // configuration (empty)
    a: [],   // data seals (empty)
  };

  // Add delegator identifier for delegated inception
  if (delpre) {
    ked.di = delpre;
  }

  // Prefix derivation mode selection:
  // keripy's eventing.incept() behavior:
  // - If called WITHOUT explicit threshold parameters: uses basic derivation (prefix = first key)
  // - If called WITH explicit threshold parameters (even if None/null): uses self-addressing (prefix = SAID)
  //
  // We match this behavior by checking if threshold properties exist in options object:
  // - Single key + thresholds NOT in options object → basic derivation
  // - Everything else (including explicit undefined/null thresholds) → self-addressing
  const useBasicDerivation = keys.length === 1 &&
    !hasExplicitIsith &&
    !hasExplicitNsith;

  if (useBasicDerivation) {
    // Basic derivation: prefix equals first key
    ked.i = keys[0];
  } else {
    // Self-addressing: prefix will be set to SAID
    ked.i = '';  // Placeholder, will be set to SAID later
  }

  // Compute size with temporary SAID to get correct version string
  ked.d = '#'.repeat(44);  // Temporary SAID placeholder
  if (!useBasicDerivation) {
    ked.i = '#'.repeat(44);  // Temporary prefix placeholder (for self-addressing)
  }

  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version string with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Now compute SAID with the correct version string
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  if (!useBasicDerivation) {
    // Self-addressing: prefix equals SAID
    ked.i = saidified.d;
  }
  // For basic derivation, ked.i already equals keys[0]

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    ked,
    raw: serialized,
    pre: ked.i,
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
    // Already a string: check if it's numeric or weighted
    // If it looks like a hex string or number, keep as-is
    // If it's weighted (contains '/'), keep as-is
    return threshold;
  }
}
