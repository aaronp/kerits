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
import type { AID, SAID } from '../common/types.js';
import type { DipParams, DrtParams, IcpParams, IxnParams, RotParams, UnsignedEventResult } from './events.js';
import { KELEvents } from './events.js';
import type { DipEvent, IcpEvent, IxnEvent } from './types.js';

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

  /**
   * Build a delegated inception event and compute its SAID in one step.
   *
   * Returns the finalized event (with i, d, and di fields set) and canonical
   * bytes ready for signing. Does not validate signatures or thresholds.
   */
  export function prepareDip(params: DipParams): { event: DipEvent; bytes: Uint8Array } {
    const { unsignedEvent } = KELEvents.buildDip(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, true);
    return { event: event as DipEvent, bytes: canonFinal.raw };
  }

  /**
   * Build an interaction event and compute its SAID in one step.
   *
   * Returns the finalized event and canonical bytes ready for signing.
   */
  export function prepareIxn(params: IxnParams): { event: IxnEvent; bytes: Uint8Array } {
    const { unsignedEvent } = KELEvents.buildIxn(params);
    const { event, canonFinal } = KELEvents.computeSaid(unsignedEvent, false);
    return { event: event as IxnEvent, bytes: canonFinal.raw };
  }

  /**
   * Build an IXN that anchors a child delegation event into the parent KEL.
   *
   * Computes sequence number from head.sn + 1 and sets the anchor seal.
   */
  export function prepareDelegationAnchorIxn(input: {
    readonly parentAid: AID;
    readonly head: { readonly sn: number; readonly said: SAID };
    readonly childAid: AID;
    readonly childEventSaid: SAID;
    readonly childEventSn?: string;
  }): { event: IxnEvent; bytes: Uint8Array } {
    return prepareIxn({
      aid: input.parentAid,
      sequence: input.head.sn + 1,
      priorEventSaid: input.head.said,
      anchors: [{ i: input.childAid, s: input.childEventSn ?? '0', d: input.childEventSaid }],
    });
  }
}

// Re-export builder param/result types
export type { DipParams, DrtParams, IcpParams, IxnParams, RotParams, UnsignedEventResult };
