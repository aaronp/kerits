/**
 * KELOps — Domain logic for KEL interpretation and validation.
 *
 * Functional core: data-in, answers-out. No I/O, no side effects.
 * KELView methods are synchronous and pure.
 * validateAppend delegates to validateKelChain (now synchronous).
 *
 * @module kel/ops
 */

import {
  type AID,
  type CesrDigest,
  type PublicKey,
  type SAID,
  SequenceNumber,
  type Signature,
  type Threshold,
} from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { verify } from '../signature/verify.js';
import { validateAnchorTargets as _validateAnchorTargets } from './anchor-targets.js';
import { encodeEventBytes } from './event-signing.js';
import { reduceKelState as _reduceKelState } from './kel-state.js';
import type {
  ControllerSignatureValidationError,
  CurrentKeySet,
  EstablishmentEvent,
  EventRef,
  KELView,
  KeyStateResult,
  PreviousNextKeyCommitment,
  ValidateAppendResult,
  ValidateControllerSignatureResult,
  VerifiedKeyState,
} from './ops-types.js';
import {
  buildNextCommitment as _buildNextCommitment,
  matchKeyRevelation as _matchKeyRevelation,
  planRotation as _planRotation,
  resolveCurrentKeys as _resolveCurrentKeys,
} from './rotation.js';
import type { CESREvent, DipEvent, IcpEvent, IxnEvent, KELEvent, KSN } from './types.js';
import { KSNs } from './types.js';
import type { EventValidationDetail, KelValidationOptions, ValidationError } from './validation.js';
import {
  isValidKeriEvent as _isValidKeriEvent,
  validateEventSaid as _validateEventSaid,
  validateKel as _validateKel,
  validateKelChain as _validateKelChain,
  validateKeyChain as _validateKeyChain,
  validateRequiredFields as _validateRequiredFields,
  validateSignedIcp as _validateSignedIcp,
} from './validation.js';

// ─── Internal helpers ───────────────────────────────────────────────────────

function ksnToKeyState(ksn: KSN): VerifiedKeyState {
  return {
    aid: ksn.i as AID,
    seqNo: SequenceNumber.of(ksn.s),
    digest: ksn.d,
    currentKeys: ksn.k as PublicKey[],
    threshold: ksn.kt,
    nextKeyDigests: ksn.n as CesrDigest[],
  };
}

function toEventRef(env: CESREvent, index: number): EventRef {
  return {
    event: env.event,
    index,
    said: env.event.d as SAID,
  };
}

function isEstablishmentType(t: string): boolean {
  return t === 'icp' || t === 'rot' || t === 'dip' || t === 'drt';
}

function isCesrEvent(value: unknown): value is CESREvent {
  if (!value || typeof value !== 'object') return false;
  const event = (value as { event?: unknown }).event;
  if (!_isValidKeriEvent(event)) return false;
  const e = event as { s?: unknown; d?: unknown };
  return typeof e.s === 'string' && typeof e.d === 'string';
}

/** Why a superseding rotation was refused. */
export type SupersedeError =
  | { kind: 'kel-invalid'; reason: string }
  | { kind: 'supersede-unsupported'; case: 'delegated' };

// ─── KELOps ─────────────────────────────────────────────────────────────────

export namespace KELOps {
  /**
   * Build a pure, synchronous interpretation surface over a KEL.
   *
   * Events are normalised into `EventRef[]` once at construction time.
   * All returned methods are O(n) scans — suitable for typical KEL sizes.
   *
   * @param aid  - The AID that owns this KEL
   * @param events - Ordered CESREvent envelopes
   */
  export function forKEL(aid: AID, events: CESREvent[]): KELView {
    // Normalise once
    const refs: EventRef[] = events.map(toEventRef);

    return {
      head(): EventRef | undefined {
        return refs.length > 0 ? refs[refs.length - 1] : undefined;
      },

      inception(): EventRef<IcpEvent | DipEvent> | undefined {
        const first = refs[0];
        if (!first) return undefined;
        const t = first.event.t;
        if (t === 'icp' || t === 'dip') {
          return first as EventRef<IcpEvent | DipEvent>;
        }
        return undefined;
      },

      ksn(): KSN | undefined {
        return KSNs.fromKEL(aid, events);
      },

      eventsByType(type: string): EventRef[] {
        return refs.filter((r) => r.event.t === type);
      },

      eventAtSequence(sn: number): EventRef | undefined {
        return refs.find((r) => {
          const parsed = SequenceNumber.parse(r.event.s);
          return parsed.ok && parsed.value === sn;
        });
      },

      length(): number {
        return refs.length;
      },

      isEmpty(): boolean {
        return refs.length === 0;
      },

      lastEstablishment(): EventRef<EstablishmentEvent> | undefined {
        for (let i = refs.length - 1; i >= 0; i--) {
          const ref = refs[i]!;
          if (isEstablishmentType(ref.event.t)) {
            return ref as EventRef<EstablishmentEvent>;
          }
        }
        return undefined;
      },

      currentKeySet(): CurrentKeySet | undefined {
        const lastEst = this.lastEstablishment();
        if (!lastEst) return undefined;
        const evt = lastEst.event as EstablishmentEvent;
        return {
          kt: evt.kt as Threshold,
          k: evt.k as string[],
          nt: evt.nt as Threshold,
          n: evt.n as string[],
          from: evt,
          index: lastEst.index,
        };
      },

      previousNextKeyCommitment(): PreviousNextKeyCommitment | undefined {
        // Find all establishment events, return commitment from the second-to-last
        const establishments: EventRef<EstablishmentEvent>[] = [];
        for (const ref of refs) {
          if (isEstablishmentType(ref.event.t)) {
            establishments.push(ref as EventRef<EstablishmentEvent>);
          }
        }
        if (establishments.length < 2) return undefined;
        const prev = establishments[establishments.length - 2]!;
        const evt = prev.event;
        return {
          threshold: evt.nt as Threshold,
          digests: evt.n as string[],
          establishment: evt,
          establishmentIndex: prev.index,
        };
      },

      interactions(): EventRef<IxnEvent>[] {
        return refs.filter((r) => r.event.t === 'ixn') as EventRef<IxnEvent>[];
      },

      bySAID(said: SAID): EventRef | undefined {
        return refs.find((r) => r.said === said);
      },
    };
  }

  /**
   * Validate a candidate event against an existing KEL chain.
   *
   * Returns a discriminated union so callers branch on `ok` rather
   * than inspecting error array length. Uses core's EventValidationDetail
   * directly without enrichment.
   *
   * @param existingEvents - The current KEL events (already validated)
   * @param candidate - The new event to validate against the chain
   * @returns Discriminated union with `ok` flag and `EventValidationDetail`
   */
  export function validateAppend(
    existingEvents: CESREvent[],
    candidate: CESREvent,
    options?: Pick<KelValidationOptions, 'parentKel' | 'signaturesVerified'>,
  ): ValidateAppendResult {
    const allEvents = [...existingEvents, candidate];
    const startIndex = existingEvents.length;
    const result = _validateKelChain(allEvents, { ...options, startIndex });
    const candidateDetail = result.eventDetails[0];

    if (!candidateDetail) {
      const error: ValidationError = {
        code: 'MISSING_REQUIRED_FIELD',
        scope: 'event',
        severity: 'error',
        message: 'No validation detail',
        eventIndex: startIndex,
      };
      return {
        ok: false,
        errors: [error],
        validation: {
          eventIndex: startIndex,
          eventType: (candidate.event as any).t,
          eventSaid: (candidate.event as any).d,
          checks: {
            isValidKeriEvent: { passed: false, error: 'No detail' },
            saidValid: { passed: false },
            requiredFieldsPresent: { passed: false },
            signaturesValid: { passed: false },
            thresholdMet: { passed: false },
          },
          errors: [error],
        } as any,
      };
    }

    // every rule records its own check and error; a blocking (non-pending) error leads, so an under-signed event
    // that also breaks a chain rule reports that rule first (keripy Kever.update rejects it outright)
    if (candidateDetail.errors.length > 0) {
      const lead = candidateDetail.errors.find((e) => !APPEND_PENDING_ERROR_CODES.has(e.code));
      const errors =
        lead === undefined ? candidateDetail.errors : [lead, ...candidateDetail.errors.filter((e) => e !== lead)];
      return { ok: false, errors, validation: candidateDetail };
    } else {
      return { ok: true, validation: candidateDetail };
    }
  }

  /**
   * KERI superseding recovery: may `rot` (at sn N) replace `existingFromN` (the stored events at N and after)?
   * Checks: `p` is the SAID at N-1 and `rot` sits at the first superseded sn; every superseded event is an `ixn` (an
   * establishment event is never superseded); `rot` is a fully valid rotation on `kelUpToNminus1` — signed to threshold
   * by the keys the prior establishment event pre-committed (`n`), so a compromised current key cannot produce it.
   */
  export function validateSupersede(
    kelUpToNminus1: readonly CESREvent[],
    existingFromN: readonly CESREvent[],
    rot: CESREvent,
  ): Result<true, SupersedeError> {
    const invalid = (reason: string) => err({ kind: 'kel-invalid' as const, reason });
    if (!isCesrEvent(rot)) return invalid('superseding event is not a KEL event');
    if (kelUpToNminus1.length === 0 || !kelUpToNminus1.every(isCesrEvent)) return invalid('no prior KEL to recover on');
    if (existingFromN.length === 0 || !existingFromN.every(isCesrEvent)) return invalid('nothing to supersede');
    if (!existingFromN.every((e) => e.event.t === 'ixn')) return invalid('only ixn events may be superseded');
    if (rot.event.s !== existingFromN[0]!.event.s) return invalid('rotation is not at the first superseded sn');
    const prior = kelUpToNminus1[kelUpToNminus1.length - 1]!.event.d;
    if ((rot.event as { p?: unknown }).p !== prior) return invalid(`p is not the SAID at sn N-1 (${prior})`);

    const t = rot.event.t;
    // a delegated AID (dip) recovers only with delegator approval, whatever the supplied ilk (a plain rot is refused too)
    if (kelUpToNminus1[0]!.event.t === 'dip') return err({ kind: 'supersede-unsupported', case: 'delegated' });
    if (t === 'drt') return err({ kind: 'supersede-unsupported', case: 'delegated' });
    else if (t === 'icp' || t === 'dip' || t === 'ixn') return invalid(`a ${t} cannot supersede`);
    else if (t !== 'rot') return invalid(`unknown event type ${String(t)}`);

    const appended = validateAppend([...kelUpToNminus1], rot);
    if (!appended.ok) return invalid(appended.errors.map((e) => e.message).join('; '));
    const forged = appended.validation.checks.signaturesValid.dropped?.find((d) => d.reason === 'signature-invalid');
    if (forged) return invalid(`signature at keyIndex ${forged.keyIndex} does not verify`);
    return ok(true);
  }

  /**
   * The only definition of "pending": error codes raised by the signature and delegation checks (thresholdMet,
   * delegationValid), which more signatures or the delegator's approval may still satisfy.
   */
  const APPEND_PENDING_ERROR_CODES = new Set<ValidationError['code']>([
    'THRESHOLD_NOT_MET',
    'KT_UNMET',
    'PRIOR_NT_UNMET',
    'ONDEX_MISMATCH',
    'MISSING_PARENT_KEL',
    'PARENT_SIGNATURE_INVALID',
    'PARENT_THRESHOLD_NOT_MET',
  ]);

  /**
   * True when the event failed and every error it raised is a pending code (each rule records its own error, so
   * a chain-rule failure beside an under-signature makes this false). Used by KELAPI.append and replayChain.
   */
  export function isOnlyPendingSignatureFailures(validation: EventValidationDetail): boolean {
    return validation.errors.length > 0 && validation.errors.every((e) => APPEND_PENDING_ERROR_CODES.has(e.code));
  }

  /** The signature codes among the pending ones: more controller signatures may still satisfy kt and the prior nt. */
  const SIGNATURE_PENDING_ERROR_CODES = new Set<ValidationError['code']>([
    'THRESHOLD_NOT_MET',
    'KT_UNMET',
    'PRIOR_NT_UNMET',
    'ONDEX_MISMATCH',
  ]);

  /**
   * True when a persisted event still awaits controller signatures: validation says its kt or its prior nt (counted by
   * revealed keys' ondex) is unmet. Signature presence is not enough (spec §2: signatures satisfy thresholds).
   */
  export function isAwaitingSignatures(validation: EventValidationDetail): boolean {
    return validation.errors.some((e) => SIGNATURE_PENDING_ERROR_CODES.has(e.code));
  }

  /** Delegate to rotation.ts — single source of truth for key resolution. */
  export const resolveCurrentKeys = _resolveCurrentKeys;

  /** Delegate to rotation.ts — single source of truth for key revelation matching. */
  export const matchKeyRevelation = _matchKeyRevelation;

  /** Delegate to rotation.ts — pure rotation planner (k, n and who signs). */
  export const planRotation = _planRotation;

  /**
   * Check whether a KEL's inception event declares the "DND" (do-not-delegate)
   * configuration trait.
   *
   * Returns `true` if the first event is an inception (`icp`/`dip`) whose `c[]`
   * contains `"DND"`, meaning this identifier must not serve as a delegator.
   *
   * @param events - Ordered CESR events (only the first is inspected)
   */
  export function isDoNotDelegate(events: CESREvent[]): boolean {
    if (events.length === 0) return false;
    const first = events[0]!.event;
    if (first.t !== 'icp' && first.t !== 'dip') return false;
    const c = (first as IcpEvent | DipEvent).c;
    return Array.isArray(c) && c.includes('DND');
  }

  /**
   * Check whether a KEL's inception event is non-transferable.
   *
   * An identifier is non-transferable when its inception (`icp`/`dip`) has
   * an empty next key digest array (`n: []`). A non-transferable identifier
   * cannot have any subsequent events — no rotations, no interactions.
   *
   * @param events - Ordered CESR events (only the first is inspected)
   */
  export function isNonTransferable(events: CESREvent[]): boolean {
    if (events.length === 0) return false;
    const first = events[0]!.event;
    if (first.t !== 'icp' && first.t !== 'dip') return false;
    const n = (first as IcpEvent | DipEvent).n;
    return Array.isArray(n) && n.length === 0;
  }

  /** Delegate to rotation.ts — single source of truth for next-key commitment. */
  export const buildNextCommitment = _buildNextCommitment;

  // ─── Validation ──────────────────────────────────────────────────────────

  /** Derive per-event state from a KEL (pass 1 of two-pass validation). */
  export const reduceKelState = _reduceKelState;

  /** Validate a KEL against pre-computed derived state (pass 2). */
  export const validateKel = _validateKel;

  /** Convenience: derive state then validate in one call. */
  export const validateKelChain = _validateKelChain;

  /** Validate one signed inception envelope (ICP + signatures). */
  export const validateSignedIcp = _validateSignedIcp;

  /** Check whether a raw object is a structurally valid KERI event. */
  export const isValidKeriEvent = _isValidKeriEvent;

  /** Validate that an event's SAID matches its canonical serialization. */
  export const validateEventSaid = _validateEventSaid;

  /** Validate that all required fields are present on a KERI event. */
  export const validateRequiredFields = _validateRequiredFields;

  /** Validate key chain continuity (k[] keys hash to prior n[] digests). */
  export const validateKeyChain = _validateKeyChain;

  /**
   * Pure check: every `a[]` seal resolves to a matching event in `referencedEvents`.
   */
  export const validateAnchorTargets = _validateAnchorTargets;

  // ─── Comparison helpers ───────────────────────────────────────────────────

  /**
   * Two events are equal iff they have the same self-addressing identifier.
   * KERI events are content-addressable: same SAID ⟹ identical event body.
   */
  export function eventsEqual(a: CESREvent, b: CESREvent): boolean {
    return a.event.d === b.event.d;
  }

  /**
   * Two KELs are equal iff they have the same length and pairwise-matching SAIDs.
   */
  export function kelEqual(a: readonly CESREvent[], b: readonly CESREvent[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((evt, i) => eventsEqual(evt, b[i]!));
  }

  /**
   * Validate a KEL chain and derive the current key state.
   *
   * Composes `validateKelChain` + `KSNs.fromKEL`. The AID is derived from the
   * inception event — callers check AID separately if needed.
   *
   * @param events - Ordered CESR events forming the KEL
   * @returns KeyStateResult with the validated key state, or an error
   */
  export function extractKeyState(events: CESREvent[]): KeyStateResult {
    if (events.length === 0) {
      return { ok: false, error: { kind: 'missing-inception' } };
    }

    const validation = _validateKelChain(events);
    if (!validation.valid) {
      const err = validation.firstError;
      return {
        ok: false,
        error: {
          kind: 'broken-chain',
          seqNo: err?.eventIndex ?? 0,
          reason: err?.code ?? 'unknown validation failure',
        },
      };
    }

    const inceptionAid = events[0]!.event.i as AID;
    const ksn = KSNs.fromKEL(inceptionAid, events);
    if (!ksn) {
      return { ok: false, error: { kind: 'missing-inception' } };
    }

    return { ok: true, keyState: ksnToKeyState(ksn) };
  }

  /**
   * Validate a single controller signature against a KEL event body and signing keys.
   *
   * Pure function — no I/O, no DAO awareness.
   *
   * Checks:
   * - keyIndex is in range of signingKeys
   * - keyIndex is not already present in existingSignatures
   * - signature verifies against signingKeys[keyIndex] over the event's canonical bytes
   */
  export function validateControllerSignature(
    event: KELEvent,
    existingSignatures: ReadonlyArray<{ keyIndex: number }>,
    signature: { keyIndex: number; sig: string },
    signingKeys: ReadonlyArray<string>,
  ): ValidateControllerSignatureResult {
    const errors: ControllerSignatureValidationError[] = [];

    // 1. Range check
    if (signature.keyIndex < 0 || signature.keyIndex >= signingKeys.length) {
      errors.push({
        code: 'KEY_INDEX_OUT_OF_RANGE',
        message: `keyIndex ${signature.keyIndex} is out of range for ${signingKeys.length} signing keys`,
      });
      return { ok: false, errors };
    }

    // 2. Duplicate check
    if (existingSignatures.some((s) => s.keyIndex === signature.keyIndex)) {
      errors.push({
        code: 'DUPLICATE_SIGNATURE',
        message: `keyIndex ${signature.keyIndex} already has a signature`,
      });
      return { ok: false, errors };
    }

    // 3. Cryptographic verification
    const eventBytes = encodeEventBytes(event);
    const publicKey = signingKeys[signature.keyIndex] as PublicKey;
    const valid = verify(publicKey, signature.sig as Signature, eventBytes);
    if (!valid) {
      errors.push({
        code: 'SIGNATURE_INVALID',
        message: `Signature at keyIndex ${signature.keyIndex} does not verify against signing key`,
      });
      return { ok: false, errors };
    }

    return { ok: true };
  }
}
