/**
 * KEL Events - Factory functions for building KEL events
 *
 * Provides pure, testable functions for constructing KEL events with proper structure.
 * Centralizes event construction logic to ensure consistency across commands.
 *
 * Pattern:
 * 1. Build unsigned event with placeholder fields (v, d, i)
 * 2. Compute SAID and finalize event (set d, i, v)
 * 3. Sign event and create KelAppend
 *
 * @module kel/events
 */

import { SAID_PLACEHOLDER } from '../common/data.js';
import type { DerivationSurface } from '../common/derivation-surface.js';
import { deriveSaid, serializeForSigning } from '../common/derivation-surface.js';
import type { AID, PublicKey, SAID, Threshold } from '../common/types.js';
import {
  KEL_DIP_SURFACE,
  KEL_DRT_SURFACE,
  KEL_ICP_SURFACE,
  KEL_IXN_SURFACE,
  KEL_ROT_SURFACE,
} from '../said/surfaces.js';
import type { KELEvent } from './types.js';

/**
 * Parameters for building an inception event (icp)
 */
export interface IcpParams {
  keys: PublicKey[];
  nextKeyDigests: string[];
  signingThreshold?: Threshold;
  nextThreshold?: Threshold;
  witnesses?: string[];
  witnessThreshold?: string;
  config?: string[];
  anchors?: unknown[];
}

/**
 * Parameters for building a delegated inception event (dip)
 */
export interface DipParams extends IcpParams {
  parentAid: AID;
}

/**
 * Parameters for building a rotation event (rot)
 */
export interface RotParams {
  aid: AID;
  sequence: string;
  priorEventSaid: SAID;
  keys: PublicKey[];
  nextKeyDigests: string[];
  signingThreshold: Threshold;
  nextThreshold: Threshold;
  /** Witness threshold (bt field) — defaults to '0' */
  witnessThreshold?: string;
  /** Backers removed (br field) — defaults to [] */
  witnessesRemoved?: AID[];
  /** Backers added (ba field) — defaults to [] */
  witnessesAdded?: AID[];
  /** Configuration traits (c field) — defaults to [] */
  config?: string[];
  /** Anchors (a field) — defaults to [] */
  anchors?: unknown[];
}

/**
 * Parameters for building a delegated rotation event (drt)
 * Same structure as RotParams — DRT does not carry `di` per canonical spec.
 */
export interface DrtParams extends RotParams {}

/**
 * Parameters for building an interaction event (ixn)
 */
export interface IxnParams {
  aid: AID;
  sequence: string;
  priorEventSaid: SAID;
  anchors?: unknown[];
}

/**
 * Result of building an unsigned event
 */
export interface UnsignedEventResult {
  unsignedEvent: any;
  isDelegated: boolean;
}

/**
 * Result of computing SAID and finalizing event
 */
export interface FinalizedEventResult {
  event: KELEvent;
  canonFinal: { raw: Uint8Array; text: string };
  canonUnsigned: { raw: Uint8Array; text: string };
  said: SAID;
}

/**
 * KEL Events namespace - Factory functions for building KEL events
 */
const INCEPTION_ILKS = new Set(['icp', 'dip']);

function selectSurface(ilk: string): DerivationSurface {
  switch (ilk) {
    case 'icp':
      return KEL_ICP_SURFACE;
    case 'rot':
      return KEL_ROT_SURFACE;
    case 'ixn':
      return KEL_IXN_SURFACE;
    case 'dip':
      return KEL_DIP_SURFACE;
    case 'drt':
      return KEL_DRT_SURFACE;
    default:
      throw new Error(`selectSurface: unknown ilk '${ilk}'`);
  }
}

export namespace KELEvents {
  /**
   * Build unsigned inception event (icp)
   *
   * Creates the base structure for an inception event with placeholder fields.
   *
   * @param params - Inception parameters
   * @returns Unsigned event and isDelegated flag (false for icp)
   */
  export function buildIcp(params: IcpParams): UnsignedEventResult {
    const unsignedEvent = {
      v: 'KERI10JSON000000_', // Placeholder, will be computed
      t: 'icp' as const,
      d: '', // SAID placeholder
      i: '', // AID placeholder
      s: '0' as const,
      kt: params.signingThreshold ?? '1',
      k: params.keys,
      nt: params.nextThreshold ?? params.signingThreshold ?? '1',
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? '0',
      b: params.witnesses ?? [],
      c: params.config ?? [],
      a: params.anchors ?? [],
    };

    return { unsignedEvent, isDelegated: false };
  }

  /**
   * Build unsigned delegated inception event (dip)
   *
   * Creates the base structure for a delegated inception event with placeholder fields.
   *
   * @param params - Delegated inception parameters
   * @returns Unsigned event and isDelegated flag (true for dip)
   */
  export function buildDip(params: DipParams): UnsignedEventResult {
    const unsignedEvent = {
      v: 'KERI10JSON000000_', // Placeholder, will be computed
      t: 'dip' as const,
      d: '', // SAID placeholder
      i: '', // AID placeholder
      s: '0' as const,
      kt: params.signingThreshold ?? '1',
      k: params.keys,
      nt: params.nextThreshold ?? params.signingThreshold ?? '1',
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? '0',
      b: params.witnesses ?? [],
      c: params.config ?? [],
      a: params.anchors ?? [],
      di: params.parentAid, // Parent AID for delegation
    };

    return { unsignedEvent, isDelegated: true };
  }

  /**
   * Build unsigned rotation event (rot)
   *
   * Creates the base structure for a rotation event with placeholder fields.
   *
   * @param params - Rotation parameters
   * @returns Unsigned event and isDelegated flag (false for rot)
   */
  export function buildRot(params: RotParams): UnsignedEventResult {
    const unsignedEvent = {
      v: 'KERI10JSON000000_', // Placeholder, will be computed
      t: 'rot' as const,
      d: '', // SAID placeholder
      i: params.aid,
      s: params.sequence,
      p: params.priorEventSaid,
      kt: params.signingThreshold,
      k: params.keys,
      nt: params.nextThreshold,
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? '0',
      br: params.witnessesRemoved ?? [],
      ba: params.witnessesAdded ?? [],
      ...(params.config !== undefined ? { c: params.config } : {}),
      a: params.anchors ?? [],
    };

    return { unsignedEvent, isDelegated: false };
  }

  /**
   * Build unsigned delegated rotation event (drt)
   *
   * Creates the base structure for a delegated rotation event with placeholder fields.
   *
   * @param params - Delegated rotation parameters
   * @returns Unsigned event and isDelegated flag (true for drt)
   */
  export function buildDrt(params: DrtParams): UnsignedEventResult {
    const unsignedEvent = {
      v: 'KERI10JSON000000_', // Placeholder, will be computed
      t: 'drt' as const,
      d: '', // SAID placeholder
      i: params.aid,
      s: params.sequence,
      p: params.priorEventSaid,
      kt: params.signingThreshold,
      k: params.keys,
      nt: params.nextThreshold,
      n: params.nextKeyDigests,
      bt: params.witnessThreshold ?? '0',
      br: params.witnessesRemoved ?? [],
      ba: params.witnessesAdded ?? [],
      ...(params.config !== undefined ? { c: params.config } : {}),
      a: params.anchors ?? [],
    };

    return { unsignedEvent, isDelegated: true };
  }

  /**
   * Build unsigned interaction event (ixn)
   *
   * Creates the base structure for an interaction event with placeholder fields.
   * Interaction events are used for non-establishment operations like anchoring.
   *
   * @param params - Interaction parameters
   * @returns Unsigned event and isDelegated flag (always false for ixn)
   *
   * @example
   * ```typescript
   * // Build ixn for delegating child event approval
   * const { unsignedEvent } = KELEvents.buildIxn({
   *   aid: parentAid,
   *   sequence: '1',
   *   priorEventSaid: parentIcpSaid,
   *   anchors: [{ i: childAid, s: '0', d: childDipSaid }],
   * });
   * ```
   */
  export function buildIxn(params: IxnParams): UnsignedEventResult {
    const unsignedEvent = {
      v: 'KERI10JSON000000_', // Placeholder, will be computed
      t: 'ixn' as const,
      d: '', // SAID placeholder
      i: params.aid,
      s: params.sequence,
      p: params.priorEventSaid,
      a: params.anchors ?? [],
    };

    return { unsignedEvent, isDelegated: false };
  }

  /**
   * Compute SAID and finalize event
   *
   * Takes an unsigned event and:
   * 1. Canonicalizes the unsigned event
   * 2. Computes the SAID
   * 3. Sets d field to SAID
   * 4. For inception events (icp/dip), sets i field to SAID
   * 5. Computes correct version string
   * 6. Returns finalized event and canonical representations
   *
   * @param unsignedEvent - Unsigned event with placeholder d, i, v
   * @param isInception - Whether this is an inception event (icp/dip) where i=d
   * @returns Finalized event, canonical representations, and SAID
   *
   * @example
   * ```typescript
   * const { unsignedEvent } = KELEvents.buildIxn({ ... });
   * const { event, canonFinal, said } = KELEvents.computeSaid(unsignedEvent, false);
   * // event now has d, i, v properly set
   * ```
   */
  export function computeSaid(unsignedEvent: any, isInception = false): FinalizedEventResult {
    const surface = selectSurface(unsignedEvent.t);
    const ilkIsInception = INCEPTION_ILKS.has(unsignedEvent.t);

    // Runtime guard: isInception must agree with ilk
    if (isInception !== ilkIsInception) {
      throw new Error(
        `computeSaid: isInception=${isInception} but ilk '${unsignedEvent.t}' ` +
          `${ilkIsInception ? 'is' : 'is not'} an inception event`,
      );
    }

    // For inception events (icp/dip), keripy substitutes BOTH d and i with
    // the 44-char placeholder before computing the SAID. deriveSaid only
    // substitutes the saidField (d), so we must set i = SAID_PLACEHOLDER
    // on the input before derivation.
    const eventForDerivation = isInception ? { ...unsignedEvent, i: SAID_PLACEHOLDER } : unsignedEvent;

    // Compute canonical unsigned bytes (pre-SAID form, with placeholders)
    const canonUnsigned = serializeForSigning(eventForDerivation, surface);

    // Derive SAID using keripy-compatible insertion-order serialization
    const { sealed, said } = deriveSaid(eventForDerivation, surface);

    // For inception events, set i = d = said (both are SAIDified)
    const event: KELEvent = isInception ? { ...sealed, i: said } : (sealed as KELEvent);

    // Compute canonical final bytes (for signing)
    const canonFinal = serializeForSigning(event, surface);

    return {
      event: event as KELEvent,
      canonFinal,
      canonUnsigned,
      said: said as SAID,
    };
  }

  /**
   * Convenience function: Build and finalize event in one step
   *
   * Combines buildIxn/buildIcp/etc with computeSaid for common use case.
   *
   * @param unsignedEvent - Unsigned event from build* function
   * @param isInception - Whether this is an inception event
   * @returns Finalized event result
   */
  export function finalize(unsignedEvent: any, isInception = false): FinalizedEventResult {
    return computeSaid(unsignedEvent, isInception);
  }

  /**
   * Compute witness delta (ba/br) between prior and desired witness sets.
   *
   * @param priorB - Prior witness set (b[] from prior establishment event)
   * @param desiredB - Full desired witness set after this rotation
   * @returns added (ba) and removed (br) witness arrays
   */
  export function computeWitnessDelta(priorB: AID[], desiredB: AID[]): { added: AID[]; removed: AID[] } {
    const priorSet = new Set(priorB.map(String));
    const desiredSet = new Set(desiredB.map(String));
    return {
      added: desiredB.filter((w) => !priorSet.has(String(w))),
      removed: priorB.filter((w) => !desiredSet.has(String(w))),
    };
  }

  /**
   * Increment a sequence number string by 1.
   *
   * @param priorSeq - Prior sequence number as string (e.g. '0', '42')
   * @returns Next sequence number as string (e.g. '1', '43')
   */
  export function nextSequence(priorSeq: string): string {
    return String(Number.parseInt(priorSeq, 10) + 1);
  }

  /**
   * Assemble a signed CESREvent from a finalized event + indexed signatures.
   *
   * Signatures must be CESR qb64-encoded strings (use encodeSig from cesr/sigs.js).
   * Structural assembly only — does not verify signatures match event keys.
   * Validation happens in KELOps.validateAppend.
   */
  export function assembleSignedEvent(params: {
    event: KELEvent;
    signatures: Array<{ keyIndex: number; sig: string }>;
  }): import('./types.js').CESREvent {
    const attachments: import('./types.js').CesrAttachment[] = params.signatures.map((s) => ({
      kind: 'sig' as const,
      form: 'indexed' as const,
      keyIndex: s.keyIndex,
      sig: s.sig,
    }));
    return { event: params.event, attachments, enc: 'JSON' };
  }
}
