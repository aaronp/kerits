/**
 * KELOps — Domain logic for KEL interpretation and validation.
 *
 * Functional core: data-in, answers-out. No I/O, no KeyValueView/KeyValueStore,
 * no side effects. KELView methods are synchronous and pure.
 * validateAppend delegates to validateKelChain (now synchronous).
 *
 * @module kel/ops
 */

import { digestVerfer } from '../cesr/digest.js';
import type { AID, PublicKey, SAID, Signature, Threshold } from '../common/types.js';
import { verify } from '../signature/verify.js';
import { encodeEventBytes } from './event-signing.js';
import { reduceKelState as _reduceKelState } from './kel-state.js';
import type {
  ControllerSignatureValidationError,
  CurrentKeySet,
  EstablishmentEvent,
  EventRef,
  KELView,
  MatchKeyRevelationInput,
  MatchKeyRevelationResult,
  PreviousNextKeyCommitment,
  ValidateAppendResult,
  ValidateControllerSignatureResult,
} from './ops-types.js';
import { checkThreshold } from './threshold.js';
import type { CESREvent, DipEvent, IcpEvent, IxnEvent, KELEvent, KSN } from './types.js';
import { KSNs } from './types.js';
import type { ValidationError } from './validation.js';
import {
  isValidKeriEvent as _isValidKeriEvent,
  validateEventSaid as _validateEventSaid,
  validateKel as _validateKel,
  validateKelChain as _validateKelChain,
  validateKeyChain as _validateKeyChain,
  validateRequiredFields as _validateRequiredFields,
} from './validation.js';

// ─── Internal helpers ───────────────────────────────────────────────────────

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
        const target = String(sn);
        return refs.find((r) => r.event.s === target);
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
  export function validateAppend(existingEvents: CESREvent[], candidate: CESREvent): ValidateAppendResult {
    const allEvents = [...existingEvents, candidate];
    const startIndex = existingEvents.length;
    const result = _validateKelChain(allEvents, { startIndex });
    const candidateDetail = result.eventDetails[0];

    if (!candidateDetail) {
      return {
        ok: false,
        errors: [
          {
            code: 'MISSING_REQUIRED_FIELD',
            scope: 'event',
            severity: 'error',
            message: 'No validation detail',
            eventIndex: startIndex,
          },
        ],
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
        } as any,
      };
    }

    const failedChecks = Object.entries(candidateDetail.checks).filter(([_, check]) => check && !check.passed);
    if (failedChecks.length > 0) {
      const errors: ValidationError[] = failedChecks.map(([name, check]) => ({
        code: 'MISSING_REQUIRED_FIELD' as const,
        scope: 'event' as const,
        severity: 'error' as const,
        message: `${name}: ${(check as any).error ?? 'failed'}`,
        eventIndex: startIndex,
      }));
      return { ok: false, errors, validation: candidateDetail };
    }

    return { ok: true, validation: candidateDetail };
  }

  /**
   * Resolve the current signing keys for a rotation event by looking up the
   * public keys that match the prior event's next key digest commitments.
   *
   * Accepts an injected lookup function — no persistence handle required.
   *
   * @param priorKsn - The prior event's next key commitments (n[] digests + nt threshold)
   * @param lookupKey - Async function resolving a digest to its public key
   * @returns Resolved signing keys and threshold for the rotation event
   * @throws Error if any committed digest cannot be resolved
   */
  export async function resolveCurrentKeys(
    priorKsn: { n: string[]; nt: Threshold },
    lookupKey: (digest: string) => Promise<string | undefined>,
  ): Promise<{ k: string[]; kt: Threshold }> {
    const k: string[] = [];

    for (const digest of priorKsn.n) {
      const publicKey = await lookupKey(digest);
      if (publicKey === undefined) {
        throw new Error(
          `Cannot resolve next key digest: ${digest}. The public key for this committed digest was not found.`,
        );
      }
      k.push(publicKey);
    }

    return { k, kt: priorKsn.nt };
  }

  /**
   * Match proposed signing keys against the prior event's next key digest
   * commitments, supporting subset revelation and key augmentation.
   *
   * Keys whose digest matches an entry in priorN are "revealed".
   * Keys with no matching digest are "augmented".
   * Only revealed keys count toward satisfying priorNt.
   */
  export function matchKeyRevelation(input: MatchKeyRevelationInput): MatchKeyRevelationResult {
    const { priorN, priorNt, proposedK } = input;
    const errors: string[] = [];

    // Reject duplicate digests in priorN
    const digestSet = new Set<string>();
    for (const digest of priorN) {
      if (digestSet.has(digest)) {
        errors.push(`Ambiguous prior n[]: duplicate digest ${digest}`);
        return { revealed: [], augmented: [], priorNtSatisfied: false, errors };
      }
      digestSet.add(digest);
    }

    // Build digest→nIndex map for O(1) lookup
    const digestToNIndex = new Map<string, number>();
    for (let i = 0; i < priorN.length; i++) {
      digestToNIndex.set(priorN[i]!, i);
    }

    const revealed: { kIndex: number; nIndex: number }[] = [];
    const augmented: number[] = [];
    const matchedNIndices = new Set<number>();

    for (let kIdx = 0; kIdx < proposedK.length; kIdx++) {
      const keyDigest = digestVerfer(proposedK[kIdx]!);
      const nIdx = digestToNIndex.get(keyDigest);

      if (nIdx !== undefined && !matchedNIndices.has(nIdx)) {
        revealed.push({ kIndex: kIdx, nIndex: nIdx });
        matchedNIndices.add(nIdx);
      } else if (nIdx !== undefined && matchedNIndices.has(nIdx)) {
        errors.push(`Key at k[${kIdx}] matches n[${nIdx}] which was already matched by another key`);
      } else {
        augmented.push(kIdx);
      }
    }

    if (errors.length > 0) {
      return { revealed, augmented, priorNtSatisfied: false, errors };
    }

    // Check threshold satisfaction using matched nIndex values against priorN.length
    const matchedIndices = revealed.map((r) => r.nIndex);
    let priorNtSatisfied = false;
    if (matchedIndices.length > 0) {
      const thresholdResult = checkThreshold(priorNt, matchedIndices, priorN.length);
      priorNtSatisfied = thresholdResult.satisfied;
    }

    return { revealed, augmented, priorNtSatisfied, errors };
  }

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

  /**
   * Hash next public keys into their blake3 CESR qb64 digests to form
   * the next key commitment for an establishment event.
   *
   * @param nextPublicKeys - The public keys to commit to
   * @param nextThreshold - The signing threshold for the next key set
   * @returns The n[] digests and nt threshold for inclusion in an establishment event
   */
  export function buildNextCommitment(
    nextPublicKeys: string[],
    nextThreshold: Threshold,
  ): { n: string[]; nt: Threshold } {
    const n = nextPublicKeys.map((key) => digestVerfer(key));
    return { n, nt: nextThreshold };
  }

  /**
   * Check whether a simple numeric threshold kt is satisfiable given the
   * number of signing keys.
   *
   * Returns a result union instead of throwing, so callers can decide how
   * to handle an unsatisfiable threshold.
   */
  export function assertThresholdSatisfiable(
    kt: Threshold,
    keyCount: number,
  ): { ok: true } | { ok: false; error: string } {
    const numericKt = typeof kt === 'string' ? parseInt(kt, 10) : NaN;
    if (!Number.isNaN(numericKt) && numericKt > keyCount) {
      return {
        ok: false,
        error: `Current threshold not satisfiable: kt=${kt} but only ${keyCount} signing keys provided`,
      };
    }
    return { ok: true };
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  /** Derive per-event state from a KEL (pass 1 of two-pass validation). */
  export const reduceKelState = _reduceKelState;

  /** Validate a KEL against pre-computed derived state (pass 2). */
  export const validateKel = _validateKel;

  /** Convenience: derive state then validate in one call. */
  export const validateKelChain = _validateKelChain;

  /** Check whether a raw object is a structurally valid KERI event. */
  export const isValidKeriEvent = _isValidKeriEvent;

  /** Validate that an event's SAID matches its canonical serialization. */
  export const validateEventSaid = _validateEventSaid;

  /** Validate that all required fields are present on a KERI event. */
  export const validateRequiredFields = _validateRequiredFields;

  /** Validate key chain continuity (k[] keys hash to prior n[] digests). */
  export const validateKeyChain = _validateKeyChain;

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
