/**
 * Interaction - Create KERI Interaction Event
 *
 * Interaction events anchor external events (like TEL registries)
 * in the KEL without changing keys or configuration.
 */

import { versify, Protocol, Kind, VERSION_1_0 } from './versify';
import { numToHex } from './number';
import { saidify } from './saidify';
import type { InteractionEvent as KeriInteractionEvent } from './types/keri';

/**
 * Seal structure for anchoring external events
 */
export interface Seal {
  /** Identifier of anchored event */
  i: string;
  /** Sequence number (hex) of anchored event */
  s?: string;
  /** SAID/digest of anchored event */
  d: string;
}

/**
 * Interaction event options
 */
export interface InteractionOptions {
  /** Identifier (AID) */
  pre: string;
  /** Sequence number */
  sn: number;
  /** Prior event digest */
  dig: string;
  /** Data seals (anchored events), default: [] */
  seals?: Seal[];
  /** Additional data, default: [] */
  data?: any[];
}

/**
 * Interaction event result
 */
export interface InteractionEvent {
  /** Key Event Dict - conforms to canonical KelEvent type */
  ked: KeriInteractionEvent;
  /** Serialized event (JSON) */
  raw: string;
  /** SAID (digest) */
  said: string;
}

/**
 * Create a KERI interaction event (ixn)
 *
 * Generates an interaction event that anchors external events (like TEL registries)
 * without changing keys or configuration.
 *
 * @param options - Interaction event options
 * @returns Interaction event with KED, serialization, and SAID
 *
 * @example
 * // Anchor a TEL registry inception
 * const event = interaction({
 *   pre: 'EFcqKw7Zb0z9f5lYHdq4KN5cH8m0C_xHFZhKsKPlAeWj',
 *   sn: 1,
 *   dig: 'EHpD0_lBW4Kn8fG_YdQ5mN_3kP9Lj8cR5sT7aB6dF4hM',
 *   seals: [{
 *     i: 'ELRegistry1234567890abcdefghijklmnopqrs',
 *     d: 'ERegistryVCP1234567890abcdefghijklmnop'
 *   }]
 * })
 */
export function interaction(options: InteractionOptions): InteractionEvent {
  const {
    pre,
    sn,
    dig,
    seals = [],
    data = [],
  } = options;

  // Validate required fields
  if (!pre) {
    throw new Error('Prefix (pre) is required');
  }

  if (sn === undefined || sn < 1) {
    throw new Error('Sequence number (sn) must be >= 1');
  }

  if (!dig) {
    throw new Error('Prior event digest (dig) is required');
  }

  // Build Key Event Dict (KED)
  // Start with version size=0, will be updated after SAID computation
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  const ked: Record<string, any> = {
    v: vs,
    t: 'ixn',          // Interaction event type
    d: '',             // SAID placeholder
    i: pre,            // Identifier
    s: numToHex(sn),   // Sequence number (hex)
    p: dig,            // Prior event digest
    a: seals.concat(data), // Anchored seals + additional data
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    ked: ked as KeriInteractionEvent,
    raw: serialized,
    said: ked.d,
  };
}
