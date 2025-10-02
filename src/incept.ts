/**
 * Incept - Create KERI Inception Event
 *
 * MVP implementation supporting:
 * - Single or multiple signing keys
 * - Numeric thresholds only
 * - No witnesses (bt=0, b=[])
 * - No configuration (c=[])
 * - No data seals (a=[])
 * - Non-delegated only (no delpre)
 */

import { versify, Protocol, Kind, VERSION_1_0 } from './versify';
import { numToHex } from './number';
import { Tholder, defaultThreshold, defaultNextThreshold } from './tholder';
import { saidify } from './saidify';

/**
 * Inception event options
 */
export interface InceptOptions {
  /** Current signing keys (verfer qb64 strings) */
  keys: string[];
  /** Next key digests (diger qb64 strings), default: [] */
  ndigs?: string[];
  /** Current signing threshold, default: ceil(keys.length/2) */
  isith?: number;
  /** Next signing threshold, default: ceil(ndigs.length/2) */
  nsith?: number;
}

/**
 * Inception event result
 */
export interface InceptionEvent {
  /** Key Event Dict */
  ked: Record<string, any>;
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
  } = options;

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

  const ked: Record<string, any> = {
    v: vs,
    t: 'icp',  // inception
    d: '',     // SAID placeholder
    i: '',     // prefix placeholder
    s: numToHex(0),  // sequence number 0
    kt: numToHex(currentThreshold),
    k: keys,
    nt: numToHex(nextThreshold),
    n: ndigs,
    bt: numToHex(0),  // witness threshold (MVP: no witnesses)
    b: [],   // witnesses (MVP: empty)
    c: [],   // configuration (MVP: empty)
    a: [],   // data seals (MVP: empty)
  };

  // For single key with no explicit code, use first key as prefix
  // (MVP: only support this case)
  if (keys.length === 1 && currentThreshold === 1) {
    ked.i = keys[0];
  } else {
    throw new Error('MVP: Only single key with threshold=1 supported for now');
  }

  // Compute size with temporary SAID to get correct version string
  ked.d = '#'.repeat(44);  // Temporary placeholder
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version string with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Now compute SAID with the correct version string
  // saidify will use placeholder for 'd' and compute digest
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    ked,
    raw: serialized,
    pre: ked.i,
    said: ked.d,
  };
}
