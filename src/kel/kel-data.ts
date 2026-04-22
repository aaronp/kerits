/**
 * KELData — Event types, schemas, and factory/builder functions for KEL events.
 *
 * Per guidance.md naming conventions: <Name>Data holds types, schemas,
 * factory functions, parse/encode. Pure data construction — no domain
 * logic, no I/O.
 *
 * This is an additive alias layer. Builders are re-exported from KELEvents
 * as the first migration step. Domain logic (computeSaid, finalize, etc.)
 * stays in KELOps.
 *
 * @module kel/kel-data
 */
import type { DipParams, DrtParams, IcpParams, IxnParams, RotParams, UnsignedEventResult } from './events.js';
import { KELEvents } from './events.js';
import type { IcpEvent } from './types.js';

export namespace KELData {
  // Builder functions only — no domain logic
  export const buildIcp = KELEvents.buildIcp;
  export const buildDip = KELEvents.buildDip;
  export const buildRot = KELEvents.buildRot;
  export const buildDrt = KELEvents.buildDrt;
  export const buildIxn = KELEvents.buildIxn;

  /**
   * Build an inception event and compute its SAID in one step.
   *
   * Returns the finalized event (with i and d fields set) and canonical
   * bytes ready for signing. Does not validate signatures or thresholds.
   */
  export function prepareIcp(params: IcpParams): { event: IcpEvent; bytes: Uint8Array } {
    const { unsignedEvent } = KELEvents.buildIcp(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, true);
    return { event: event as IcpEvent, bytes: canonFinal.raw };
  }
}

// Re-export builder param/result types
export type { DipParams, DrtParams, IcpParams, IxnParams, RotParams, UnsignedEventResult };
