/**
 * TEL Events - Factory functions for building TEL events
 *
 * Provides pure, testable functions for constructing TEL events with proper structure.
 * Centralizes event construction logic to ensure consistency across commands.
 *
 * Pattern:
 * 1. Build unsigned event with placeholder fields (v, d, i)
 * 2. Compute SAID and finalize event (set d, i, v)
 *
 * @module tel/events
 */

import { SAID_PLACEHOLDER } from '../common/data.js';
import type { DerivationSurface } from '../common/derivation-surface.js';
import { deriveSaid, serializeForSigning } from '../common/derivation-surface.js';
import type { AID, SAID } from '../common/types.js';
import {
  TEL_BIS_SURFACE,
  TEL_BRV_SURFACE,
  TEL_ISS_SURFACE,
  TEL_REV_SURFACE,
  TEL_VCP_SURFACE,
  TEL_VCP_WITH_NONCE_SURFACE,
  TEL_VRT_SURFACE,
} from '../said/surfaces.js';
import type { TelEvent } from './types.js';

// ── Param interfaces ────────────────────────────────────────────────

export interface VcpParams {
  issuerAid: AID;
  backers: AID[];
  backerThreshold?: string;
  config?: string[];
  nonce?: string;
}

export interface VrtParams {
  registryId: SAID;
  sequence: string;
  priorEventSaid: SAID;
  backerThreshold: string;
  backersRemoved: AID[];
  backersAdded: AID[];
}

export interface IssParams {
  credentialSaid: SAID;
  registryId: SAID;
  sequence: string;
  datetime: string;
}

export interface RevParams {
  credentialSaid: SAID;
  registryId: SAID;
  sequence: string;
  priorEventSaid: SAID;
  datetime: string;
}

export interface BisParams {
  credentialSaid: SAID;
  issuerAid: AID;
  registrySeal: { i: string; s: string; d: string };
  sequence: string;
  datetime: string;
}

export interface BrvParams {
  credentialSaid: SAID;
  registrySeal: { i: string; s: string; d: string };
  sequence: string;
  priorEventSaid: SAID;
  datetime: string;
}

// ── Result types ────────────────────────────────────────────────────

export interface FinalizedTelEventResult {
  event: TelEvent;
  canonFinal: { raw: Uint8Array; text: string };
  canonUnsigned: { raw: Uint8Array; text: string };
  said: SAID;
}

// ── Internal helpers ────────────────────────────────────────────────

function selectSurface(ilk: string, hasNonce: boolean): DerivationSurface {
  switch (ilk) {
    case 'vcp':
      return hasNonce ? TEL_VCP_WITH_NONCE_SURFACE : TEL_VCP_SURFACE;
    case 'vrt':
      return TEL_VRT_SURFACE;
    case 'iss':
      return TEL_ISS_SURFACE;
    case 'rev':
      return TEL_REV_SURFACE;
    case 'bis':
      return TEL_BIS_SURFACE;
    case 'brv':
      return TEL_BRV_SURFACE;
    default:
      throw new Error(`selectSurface: unknown TEL ilk '${ilk}'`);
  }
}

// ── TELEvents namespace ─────────────────────────────────────────────

export namespace TELEvents {
  /**
   * Build unsigned VCP (Registry Inception) event.
   * Canonical field order: v, t, d, i, ii, s, c, bt, b (+ n if nonce)
   */
  export function buildVcp(params: VcpParams): { unsignedEvent: any } {
    const unsignedEvent: Record<string, unknown> = {
      v: 'KERI10JSON000000_',
      t: 'vcp' as const,
      d: '',
      i: '',
      ii: params.issuerAid,
      s: '0' as const,
      c: params.config ?? [],
      bt: params.backerThreshold ?? '0',
      b: params.backers,
    };
    if (params.nonce !== undefined) {
      unsignedEvent.n = params.nonce;
    }
    return { unsignedEvent };
  }

  /**
   * Build unsigned VRT (Registry Rotation) event.
   * Canonical field order: v, t, d, i, p, s, bt, br, ba
   */
  export function buildVrt(params: VrtParams): { unsignedEvent: any } {
    const unsignedEvent = {
      v: 'KERI10JSON000000_',
      t: 'vrt' as const,
      d: '',
      i: params.registryId,
      p: params.priorEventSaid,
      s: params.sequence,
      bt: params.backerThreshold,
      br: params.backersRemoved,
      ba: params.backersAdded,
    };
    return { unsignedEvent };
  }

  /**
   * Build unsigned ISS (Simple Credential Issuance) event.
   * Canonical field order: v, t, d, i, s, ri, dt
   * Note: ISS has NO p field.
   */
  export function buildIss(params: IssParams): { unsignedEvent: any } {
    const unsignedEvent = {
      v: 'KERI10JSON000000_',
      t: 'iss' as const,
      d: '',
      i: params.credentialSaid,
      s: params.sequence,
      ri: params.registryId,
      dt: params.datetime,
    };
    return { unsignedEvent };
  }

  /**
   * Build unsigned REV (Simple Credential Revocation) event.
   * Canonical field order: v, t, d, i, s, ri, p, dt
   * Note: REV HAS a p field.
   */
  export function buildRev(params: RevParams): { unsignedEvent: any } {
    const unsignedEvent = {
      v: 'KERI10JSON000000_',
      t: 'rev' as const,
      d: '',
      i: params.credentialSaid,
      s: params.sequence,
      ri: params.registryId,
      p: params.priorEventSaid,
      dt: params.datetime,
    };
    return { unsignedEvent };
  }

  /**
   * Build unsigned BIS (Backer Credential Issuance) event.
   * Canonical field order: v, t, d, i, ii, s, ra, dt
   */
  export function buildBis(params: BisParams): { unsignedEvent: any } {
    const unsignedEvent = {
      v: 'KERI10JSON000000_',
      t: 'bis' as const,
      d: '',
      i: params.credentialSaid,
      ii: params.issuerAid,
      s: params.sequence,
      ra: params.registrySeal,
      dt: params.datetime,
    };
    return { unsignedEvent };
  }

  /**
   * Build unsigned BRV (Backer Credential Revocation) event.
   * Canonical field order: v, t, d, i, s, p, ra, dt
   * Note: BRV HAS a p field.
   */
  export function buildBrv(params: BrvParams): { unsignedEvent: any } {
    const unsignedEvent = {
      v: 'KERI10JSON000000_',
      t: 'brv' as const,
      d: '',
      i: params.credentialSaid,
      s: params.sequence,
      p: params.priorEventSaid,
      ra: params.registrySeal,
      dt: params.datetime,
    };
    return { unsignedEvent };
  }

  /**
   * Compute SAID and finalize a TEL event.
   *
   * Takes an unsigned event and:
   * 1. Selects the correct TEL surface based on the t field
   * 2. Canonicalizes the unsigned event
   * 3. Computes the SAID
   * 4. Sets d field to SAID
   * 5. For VCP inception events (isInception=true), sets i = d = said
   * 6. Computes correct version string
   * 7. Returns finalized event and canonical representations
   *
   * @param unsignedEvent - Unsigned event with placeholder d, i, v
   * @param isInception - Whether this is a VCP inception event where i=d
   * @returns Finalized event, canonical representations, and SAID
   */
  export function computeSaid(unsignedEvent: any, isInception = false): FinalizedTelEventResult {
    const hasNonce = 'n' in unsignedEvent && unsignedEvent.n !== undefined;
    const surface = selectSurface(unsignedEvent.t, hasNonce);

    // For VCP inception events, keripy substitutes BOTH d and i with
    // the 44-char placeholder before computing the SAID.
    const eventForDerivation = isInception ? { ...unsignedEvent, i: SAID_PLACEHOLDER } : unsignedEvent;

    // Compute canonical unsigned bytes (pre-SAID form, with placeholders)
    const canonUnsigned = serializeForSigning(eventForDerivation, surface);

    // Derive SAID using keripy-compatible insertion-order serialization
    const { sealed, said } = deriveSaid(eventForDerivation, surface);

    // For VCP inception events, set i = d = said (registry AID === its SAID)
    const event: TelEvent = isInception ? { ...sealed, i: said } : (sealed as TelEvent);

    // Compute canonical final bytes (for signing)
    const canonFinal = serializeForSigning(event, surface);

    return {
      event: event as TelEvent,
      canonFinal,
      canonUnsigned,
      said: said as SAID,
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
}
