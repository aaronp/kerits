/**
 * KEL Validation Module
 *
 * Provides comprehensive KEL chain validation including:
 * - Key chain validation (each event's k keys must hash to previous event's n digest)
 * - Signature validation (signatures must verify against event and keys)
 * - Threshold validation (enough valid signatures to meet threshold)
 * - Delegate validation (parent signature verification)
 *
 * Uses existing threshold.ts utilities - does NOT reimplement threshold parsing.
 *
 * @module kel/validation
 */

import { digestVerfer } from '../cesr/digest.js';
import { Data } from '../common/data.js';
import type { PublicKey, Signature, Threshold } from '../common/types.js';
import { verify } from '../signature/verify.js';
import { type DerivedState, reduceKelState } from './kel-state.js';
import { matchKeyRevelation } from './rotation.js';
import { checkThreshold, type ThresholdSpec } from './threshold.js';
import { checkNormalizedThreshold } from './threshold-normalize.js';
import type { AID, CESREvent, CesrAttachment, DipEvent, DrtEvent, IcpEvent, KELEvent, RotEvent } from './types.js';

/**
 * Error codes for KEL validation failures
 */
export type ValidationErrorCode =
  | 'NEXT_KEY_MISMATCH'
  | 'PREVIOUS_EVENT_MISMATCH'
  | 'SIGNATURE_INVALID'
  | 'THRESHOLD_NOT_MET'
  | 'MISSING_PARENT_KEL'
  | 'PARENT_SIGNATURE_INVALID'
  | 'SAID_MISMATCH'
  | 'MISSING_REQUIRED_FIELD'
  | 'SEQUENCE_INVALID'
  | 'AID_DERIVATION_INVALID'
  | 'AID_INCONSISTENT'
  | 'FIRST_EVENT_NOT_INCEPTION'
  | 'NON_TRANSFERABLE_VIOLATION'
  | 'CONFIG_TRAIT_VIOLATION'
  | 'CONFIG_TRAIT_REMOVED'
  | 'WITNESS_THRESHOLD_UNSATISFIABLE'
  | 'WITNESS_DELTA_INVALID'
  | 'WITNESS_RECEIPT_THRESHOLD_NOT_MET'
  | 'DUPLICATE_KEYS'
  | 'DUPLICATE_NEXT_DIGESTS'
  | 'INCEPTION_INVALID';

/**
 * Validation error with details
 */
export interface ValidationError {
  code: ValidationErrorCode;
  scope: 'event' | 'chain' | 'attachment';
  severity: 'error' | 'warning';
  message: string;
  eventIndex?: number;
  missingAid?: AID;
}

/**
 * Result of KEL chain validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
}

/**
 * Result of a single validation check
 */
export interface CheckResult {
  passed: boolean;
  error?: string;
}

/**
 * Signature validation details
 */
export interface SignatureDetail {
  keyIndex: number;
  publicKey: string;
  valid: boolean;
  error?: string;
}

/** Valid KEL event types */
export type KelEventType = 'icp' | 'rot' | 'ixn' | 'dip' | 'drt';

/**
 * Per-event validation breakdown
 */
export interface EventValidationDetail {
  eventIndex: number;
  eventType: KelEventType;
  eventSaid: string;

  checks: {
    /** Event matches KELEventSchema (icp|rot|ixn|dip|drt union) */
    isValidKeriEvent: CheckResult;

    /** Event's d field matches computed SAID of event body */
    saidValid: CheckResult & {
      expected?: string;
      actual?: string;
    };

    /** All required fields present for this event type */
    requiredFieldsPresent: CheckResult & {
      missing?: string[];
    };

    /** All signatures verify against their keys */
    signaturesValid: CheckResult & {
      details?: SignatureDetail[];
    };

    /** Enough valid signatures to meet threshold */
    thresholdMet: CheckResult & {
      required?: string | number; // threshold spec
      validSignatureCount?: number;
    };

    /** For non-inception events: p field matches previous event's SAID */
    previousEventValid?: CheckResult & {
      expectedSaid?: string;
      actualPField?: string;
    };

    /** For rotation events: keys hash to previous event's next key commitments */
    keyChainValid?: CheckResult & {
      expectedDigests?: string[];
      actualDigests?: string[];
    };

    /** For delegated events (dip/drt): parent approval is valid */
    delegationValid?: CheckResult & {
      parentAid?: string;
      missingParentKel?: boolean;
    };
  };
}

/**
 * Rich validation result with per-event details
 */
export interface RichValidationResult {
  /** Overall chain validity */
  valid: boolean;

  /** Per-event validation details */
  eventDetails: EventValidationDetail[];

  /** First error encountered (for backward compatibility) */
  firstError?: ValidationError;
}

/**
 * Validation presets control which checks are enforced
 */
export type ValidationPreset = 'structural' | 'fully-witnessed' | 'strict';

/**
 * Options for KEL chain validation
 */
export interface KelValidationOptions {
  /** Parent KEL for delegation validation (dip/drt events) */
  parentKel?: CESREvent[];

  /** Start validation from this index (for incremental validation) */
  startIndex?: number;

  /** Validation mode (default: 'structural') */
  mode?: ValidationPreset;
}

// --------------------------------------------------------------------------------------
// Helper Functions for Rich Validation
// --------------------------------------------------------------------------------------

/**
 * Compute the SAID for an event body
 *
 * This matches the approach used in KELEvents.computeSaid:
 * 1. Clone event and reset d to '' (and i to '' for inception events)
 * 2. Set version string to the placeholder used by build functions
 * 3. Canonicalize with RFC8785
 * 4. Hash with Blake3
 * 5. Encode with CESR 'E' prefix
 *
 * Note: KELEvents.computeSaid computes SAID over the unsigned event which has
 * d: '' and v: 'KERI10JSON000000_' (a fixed placeholder). The final event then
 * gets v recomputed for its actual size.
 *
 * @param event - The KEL event
 * @returns The computed SAID for this event
 */
function computeEventSaid(event: KELEvent): string {
  // Clone the event and reset SAID-derived fields to their placeholder values
  const eventCopy = { ...event } as Record<string, unknown>;
  eventCopy.d = '';

  // For inception events, i = d, so reset i as well
  if (event.t === 'icp' || event.t === 'dip') {
    eventCopy.i = '';
  }

  // Set version string to the placeholder used by build functions
  // KELEvents.computeSaid hashes the event with this placeholder v
  eventCopy.v = 'KERI10JSON000000_';

  // Canonicalize and compute digest
  const { raw } = Data.fromJson(eventCopy).canonicalize();
  return Data.digest(raw);
}

/**
 * Get required fields for a given event type
 *
 * @param eventType - The event type (icp, rot, ixn, dip, drt)
 * @returns Array of required field names
 */
function getRequiredFields(eventType: string): string[] {
  const common = ['v', 't', 'd', 'i', 's'];

  switch (eventType) {
    case 'icp':
      return [...common, 'kt', 'k', 'nt', 'n', 'bt', 'b', 'c', 'a'];
    case 'rot':
      return [...common, 'p', 'kt', 'k', 'nt', 'n', 'bt', 'br', 'ba', 'c', 'a'];
    case 'ixn':
      return [...common, 'p', 'a'];
    case 'dip':
      return [...common, 'kt', 'k', 'nt', 'n', 'bt', 'b', 'c', 'a', 'di'];
    case 'drt':
      return [...common, 'p', 'kt', 'k', 'nt', 'n', 'bt', 'br', 'ba', 'c', 'a'];
    default:
      return common;
  }
}

/**
 * Check if all required fields are present in an event
 *
 * @param event - The KEL event
 * @returns Object with passed status and missing fields if any
 */
function checkRequiredFields(event: KELEvent): { passed: boolean; missing?: string[] } {
  const requiredFields = getRequiredFields(event.t);
  const eventObj = event as Record<string, unknown>;
  const missing = requiredFields.filter((field) => !(field in eventObj) || eventObj[field] === undefined);

  return {
    passed: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Validate signatures and collect details for each signature
 *
 * @param cesrEvent - The CESR event with attachments
 * @param keys - Current signing keys
 * @returns Object with signature details and validation results
 */
function validateSignaturesWithDetails(
  cesrEvent: CESREvent,
  keys: PublicKey[],
): {
  details: SignatureDetail[];
  allValid: boolean;
  validKeyIndices: Set<number>;
} {
  const event = cesrEvent.event;
  const sigAttachments = getSignatureAttachments(cesrEvent);
  const details: SignatureDetail[] = [];
  const validKeyIndices = new Set<number>();
  let allValid = true;

  for (const sigAtt of sigAttachments) {
    const keyIndex = typeof sigAtt.keyIndex === 'number' ? sigAtt.keyIndex : parseInt(sigAtt.keyIndex as any, 10);

    if (keyIndex < 0 || keyIndex >= keys.length) {
      details.push({
        keyIndex,
        publicKey: 'unknown',
        valid: false,
        error: `Key index ${keyIndex} out of range (0-${keys.length - 1})`,
      });
      allValid = false;
      continue;
    }

    const publicKey = keys[keyIndex]!;
    const isValid = verifyEventSignature(event, publicKey, sigAtt.sig);

    details.push({
      keyIndex,
      publicKey,
      valid: isValid,
      error: isValid ? undefined : 'Signature verification failed',
    });

    if (isValid) {
      validKeyIndices.add(keyIndex);
    } else {
      allValid = false;
    }
  }

  return { details, allValid, validKeyIndices };
}

/**
 * Validate previous event link (p field matches prior event's SAID)
 *
 * For non-inception events (rot, ixn, drt), verifies that the p field
 * correctly references the previous event in the chain.
 *
 * @param currentEvent - Current event being validated
 * @param previousEvent - Previous event in the KEL (at seqNo - 1)
 * @returns Check result with expected and actual values
 */
function validatePreviousEventLink(
  currentEvent: KELEvent,
  previousEvent: KELEvent | undefined,
): CheckResult & { expectedSaid?: string; actualPField?: string } {
  // Inception events (icp, dip) don't have a p field
  if (currentEvent.t === 'icp' || currentEvent.t === 'dip') {
    return { passed: true };
  }

  // Non-inception events must have a previous event
  if (!previousEvent) {
    return {
      passed: false,
      error: 'Non-inception event has no previous event to reference',
      expectedSaid: undefined,
      actualPField: (currentEvent as any).p,
    };
  }

  const expectedSaid = previousEvent.d;
  const actualPField = (currentEvent as any).p as string | undefined;

  if (!actualPField) {
    return {
      passed: false,
      error: 'Event missing required p field',
      expectedSaid,
      actualPField: undefined,
    };
  }

  if (actualPField !== expectedSaid) {
    return {
      passed: false,
      error: `Previous event mismatch: p field is ${actualPField}, expected ${expectedSaid}`,
      expectedSaid,
      actualPField,
    };
  }

  return { passed: true, expectedSaid, actualPField };
}

/**
 * Validate key chain continuity and return detailed results
 *
 * @param currentEvent - Current event being validated
 * @param previousEstablishment - Previous establishment event
 * @returns Check result with expected and actual digests
 */
function validateKeyChainWithDetails(
  currentEvent: KELEvent,
  previousEstablishment: IcpEvent | RotEvent | DipEvent | DrtEvent,
): CheckResult & {
  expectedDigests?: string[];
  actualDigests?: string[];
  revealed?: { kIndex: number; nIndex: number }[];
  augmented?: number[];
} {
  // Only rotation events need key chain validation
  if (currentEvent.t !== 'rot' && currentEvent.t !== 'drt') {
    return { passed: true };
  }

  const rotEvent = currentEvent as RotEvent | DrtEvent;
  const prevNextDigests = previousEstablishment.n;
  const currentKeys = rotEvent.k;

  const matchResult = matchKeyRevelation({
    priorN: prevNextDigests,
    priorNt: previousEstablishment.nt,
    proposedK: currentKeys,
  });

  if (matchResult.errors.length > 0) {
    return {
      passed: false,
      error: `Key revelation errors: ${matchResult.errors.join('; ')}`,
      expectedDigests: [...prevNextDigests],
      actualDigests: currentKeys.map((k: string) => digestVerfer(k)),
      revealed: matchResult.revealed,
      augmented: matchResult.augmented,
    };
  }

  if (!matchResult.priorNtSatisfied) {
    return {
      passed: false,
      error: `Prior-next threshold not satisfied: revealed ${matchResult.revealed.length} of ${prevNextDigests.length} committed keys`,
      expectedDigests: [...prevNextDigests],
      actualDigests: currentKeys.map((k: string) => digestVerfer(k)),
      revealed: matchResult.revealed,
      augmented: matchResult.augmented,
    };
  }

  return {
    passed: true,
    expectedDigests: [...prevNextDigests],
    actualDigests: currentKeys.map((k: string) => digestVerfer(k)),
    revealed: matchResult.revealed,
    augmented: matchResult.augmented,
  };
}

/**
 * Validate delegated event using provided parent KEL
 *
 * @param cesrEvent - The delegated event
 * @param parentKel - Optional parent KEL events for validation
 * @returns Check result with delegation details
 */
function validateDelegationWithDetails(
  cesrEvent: CESREvent,
  parentKel?: CESREvent[],
): CheckResult & { parentAid?: string; missingParentKel?: boolean } {
  const event = cesrEvent.event;

  if (!isDelegatedEvent(event)) {
    return { passed: true };
  }

  // Try to get the delegator AID from the event.
  // dip events carry di; drt events do not (delegation established at inception).
  const parentAid = ((event as any).di as string | undefined) ?? 'unknown';

  if (!parentKel || parentKel.length === 0) {
    return {
      passed: false,
      error: 'Parent KEL not provided',
      parentAid,
      missingParentKel: true,
    };
  }

  // Look for VRC (validator receipt) attachment from parent
  const vrcAttachments = getVrcAttachments(cesrEvent);

  if (vrcAttachments.length === 0) {
    return {
      passed: false,
      error: `No VRC attachment found for delegated event from parent ${parentAid}`,
      parentAid,
    };
  }

  // Find the last establishment event in parent KEL to get signing keys
  let parentEstablishment: (IcpEvent | RotEvent | DipEvent | DrtEvent) | undefined;
  for (const pEvent of parentKel) {
    if (isEstablishmentEvent(pEvent.event)) {
      parentEstablishment = pEvent.event;
    }
  }

  if (!parentEstablishment) {
    return {
      passed: false,
      error: 'No establishment event found in parent KEL',
      parentAid,
    };
  }

  // Validate each VRC signature
  for (const vrc of vrcAttachments) {
    // VRC must sign over the child event SAID
    if (vrc.cid !== event.d) {
      return {
        passed: false,
        error: `VRC child SAID mismatch: expected ${event.d}, got ${vrc.cid}`,
        parentAid,
      };
    }

    // Find the parent key for verification
    let parentKey: PublicKey | undefined;

    // Find the event at seal sequence to get the signing key
    for (const pEvent of parentKel) {
      if (pEvent.event.s === vrc.seal.s && pEvent.event.d === vrc.seal.d) {
        if (isEstablishmentEvent(pEvent.event)) {
          parentKey = pEvent.event.k[0] as PublicKey;
        }
        break;
      }
    }

    if (!parentKey) {
      // Fallback to latest establishment keys
      parentKey = parentEstablishment.k[0] as PublicKey;
    }

    // Verify parent signature over child event's canonical serialized bytes
    const isValid = verifyEventSignature(event as KELEvent, parentKey, vrc.sig);

    if (!isValid) {
      return {
        passed: false,
        error: 'Parent signature invalid for delegated event',
        parentAid,
      };
    }
  }

  return { passed: true, parentAid };
}

// --------------------------------------------------------------------------------------
// Type Guards
// --------------------------------------------------------------------------------------

/**
 * Type guard for establishment events (have k, n, kt, nt fields)
 */
function isEstablishmentEvent(event: KELEvent): event is IcpEvent | RotEvent | DipEvent | DrtEvent {
  return event.t === 'icp' || event.t === 'rot' || event.t === 'dip' || event.t === 'drt';
}

/**
 * Type guard for delegated events (have di field)
 */
function isDelegatedEvent(event: KELEvent): event is DipEvent | DrtEvent {
  return event.t === 'dip' || event.t === 'drt';
}

/**
 * Get signature attachments from a CESREvent
 */
function getSignatureAttachments(cesrEvent: CESREvent): Array<CesrAttachment & { kind: 'sig' }> {
  return cesrEvent.attachments.filter((a): a is CesrAttachment & { kind: 'sig' } => a.kind === 'sig');
}

/**
 * Get VRC (validator receipt) attachments from a CESREvent
 */
function getVrcAttachments(cesrEvent: CESREvent): Array<CesrAttachment & { kind: 'vrc' }> {
  return cesrEvent.attachments.filter((a): a is CesrAttachment & { kind: 'vrc' } => a.kind === 'vrc');
}

/**
 * Verify a signature against an event
 *
 * Signatures are created over the canonical (RFC8785) JSON representation of the event.
 * This matches how signatures are created during event signing (see kel-incept.ts).
 *
 * @param event - The KEL event
 * @param publicKey - Public key to verify with
 * @param signature - Signature to verify
 * @returns true if signature is valid
 */
function verifyEventSignature(event: KELEvent, publicKey: PublicKey, signature: Signature): boolean {
  // KERI signatures are over the canonical JSON bytes of the event
  const { raw: canonicalBytes } = Data.fromJson(event).canonicalize();
  return verify(publicKey, signature, canonicalBytes);
}

// --------------------------------------------------------------------------------------
// Exported Granular Validation Helpers
// --------------------------------------------------------------------------------------

/**
 * Validate that an event is a valid KERI event type (icp|rot|ixn|dip|drt)
 *
 * @param event - Unknown data to validate
 * @returns Type predicate indicating if the event has a valid type field
 */
export function isValidKeriEvent(event: unknown): event is KELEvent {
  if (!event || typeof event !== 'object') return false;
  const t = (event as Record<string, unknown>).t;
  return t === 'icp' || t === 'rot' || t === 'ixn' || t === 'dip' || t === 'drt';
}

/**
 * Compute and verify the SAID (Self-Addressing Identifier) of a KEL event
 *
 * @param event - The KEL event to validate
 * @returns Object with valid flag and expected/actual SAID values
 */
export function validateEventSaid(event: KELEvent): {
  valid: boolean;
  expected: string;
  actual: string;
} {
  const computed = computeEventSaid(event);
  return {
    valid: computed === event.d,
    expected: computed,
    actual: event.d,
  };
}

/**
 * Check that all required fields are present for a KEL event type
 *
 * @param event - The KEL event to validate
 * @returns Object with valid flag and array of missing field names
 */
export function validateRequiredFields(event: KELEvent): {
  valid: boolean;
  missing: string[];
} {
  const result = checkRequiredFields(event);
  return {
    valid: result.passed,
    missing: result.missing ?? [],
  };
}

/**
 * Validate key chain continuity between a rotation event and its previous establishment
 *
 * @param currentEvent - Current event being validated (typically rot or drt)
 * @param previousEstablishment - Previous establishment event (icp, rot, dip, or drt)
 * @returns Object with valid flag and expected/actual digest arrays for debugging
 */
export function validateKeyChain(
  currentEvent: KELEvent,
  previousEstablishment: IcpEvent | RotEvent | DipEvent | DrtEvent,
): {
  valid: boolean;
  expectedDigests: string[];
  actualDigests: string[];
} {
  const result = validateKeyChainWithDetails(currentEvent, previousEstablishment);
  return {
    valid: result.passed,
    expectedDigests: result.expectedDigests ?? [],
    actualDigests: result.actualDigests ?? [],
  };
}

// --------------------------------------------------------------------------------------
// Two-Pass Validation
// --------------------------------------------------------------------------------------

/**
 * Check an array for duplicate entries
 *
 * @param items - Array of strings to check
 * @returns Array of duplicate values, empty if no duplicates
 */
function checkArrayUniqueness(items: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of items) {
    if (seen.has(item)) {
      duplicates.push(item);
    }
    seen.add(item);
  }
  return duplicates;
}

/**
 * Validate a KEL using pre-computed derived state (two-pass architecture).
 *
 * Pass 1: `reduceKelState` derives per-event state (keys, thresholds, witnesses, traits).
 * Pass 2: `validateKel` runs validation checks against each event using that state.
 *
 * This separation allows callers who already have derived state to skip re-derivation,
 * and enables future validation presets (structural, fully-witnessed, strict).
 *
 * @param events - Array of CESR events to validate
 * @param states - Pre-computed derived state from `reduceKelState`
 * @param options - Optional validation options (parentKel, startIndex, mode)
 * @returns RichValidationResult with per-event details and overall validity
 */
export function validateKel(
  events: CESREvent[],
  states: DerivedState[],
  options?: KelValidationOptions,
): RichValidationResult {
  const eventDetails: EventValidationDetail[] = [];
  let firstError: ValidationError | undefined;
  let overallValid = true;

  if (events.length === 0) {
    return { valid: true, eventDetails: [] };
  }

  const start = options?.startIndex ?? 0;
  const parentKel = options?.parentKel;

  // Track the most recent establishment event for key chain validation
  let lastEstablishment: (IcpEvent | RotEvent | DipEvent | DrtEvent) | undefined;

  // Find the last establishment event before startIndex
  for (let i = 0; i < start && i < events.length; i++) {
    const event = events[i]!.event;
    if (isEstablishmentEvent(event)) {
      lastEstablishment = event;
    }
  }

  // Validate each event starting from startIndex
  for (let i = start; i < events.length; i++) {
    const cesrEvent = events[i]!;
    const event = cesrEvent.event;
    const eventType = event.t as KelEventType;
    const state = states[i];

    // Initialize checks for this event
    const checks: EventValidationDetail['checks'] = {
      isValidKeriEvent: { passed: true },
      saidValid: { passed: true },
      requiredFieldsPresent: { passed: true },
      signaturesValid: { passed: true },
      thresholdMet: { passed: true },
    };

    // 1. Event type validation
    const validTypes = ['icp', 'rot', 'ixn', 'dip', 'drt'];
    const typeValid = validTypes.includes(event.t);
    let typeError: string | undefined;
    if (!typeValid) {
      typeError = `Invalid event type '${event.t}'. Must be one of: ${validTypes.join(', ')}`;
    }
    checks.isValidKeriEvent = { passed: typeValid, error: typeError };

    if (!typeValid && !firstError) {
      firstError = {
        code: 'MISSING_REQUIRED_FIELD',
        scope: 'event',
        severity: 'error',
        message: typeError ?? 'Invalid KERI event type',
        eventIndex: i,
      };
      overallValid = false;
    }

    // 2. SAID validation
    const computedSaid = computeEventSaid(event);
    const saidMatches = computedSaid === event.d;
    checks.saidValid = {
      passed: saidMatches,
      expected: computedSaid,
      actual: event.d,
      error: saidMatches ? undefined : `SAID mismatch: expected ${computedSaid}, got ${event.d}`,
    };

    if (!saidMatches && !firstError) {
      firstError = {
        code: 'SAID_MISMATCH',
        scope: 'event',
        severity: 'error',
        message: `SAID mismatch for event ${i}`,
        eventIndex: i,
      };
      overallValid = false;
    }

    // 3. Required fields validation
    const requiredResult = checkRequiredFields(event);
    checks.requiredFieldsPresent = {
      passed: requiredResult.passed,
      missing: requiredResult.missing,
      error: requiredResult.passed ? undefined : `Missing required fields: ${requiredResult.missing?.join(', ')}`,
    };

    if (!requiredResult.passed && !firstError) {
      firstError = {
        code: 'MISSING_REQUIRED_FIELD',
        scope: 'event',
        severity: 'error',
        message: `Missing required fields in event ${i}: ${requiredResult.missing?.join(', ')}`,
        eventIndex: i,
      };
      overallValid = false;
    }

    // 4. Previous event link validation (p field matches prior event's SAID)
    const previousEvent = i > 0 ? events[i - 1]?.event : undefined;
    const prevEventResult = validatePreviousEventLink(event, previousEvent);
    checks.previousEventValid = prevEventResult;

    if (!prevEventResult.passed && !firstError) {
      firstError = {
        code: 'PREVIOUS_EVENT_MISMATCH',
        scope: 'chain',
        severity: 'error',
        message: prevEventResult.error ?? `Previous event link invalid in event ${i}`,
        eventIndex: i,
      };
      overallValid = false;
    }

    // Get keys and threshold for signature validation
    let keys: PublicKey[];
    let threshold: Threshold;

    if (isEstablishmentEvent(event)) {
      keys = event.k as PublicKey[];
      threshold = event.kt as Threshold;
    } else if (lastEstablishment) {
      keys = lastEstablishment.k as PublicKey[];
      threshold = lastEstablishment.kt as Threshold;
    } else {
      keys = [];
      threshold = '0';
    }

    // 5. Signature validation with details
    const sigResult = validateSignaturesWithDetails(cesrEvent, keys);
    checks.signaturesValid = {
      passed: sigResult.allValid,
      details: sigResult.details,
      error: sigResult.allValid ? undefined : 'One or more signatures failed verification',
    };

    if (!sigResult.allValid && !firstError) {
      const firstInvalid = sigResult.details.find((d) => !d.valid);
      firstError = {
        code: 'SIGNATURE_INVALID',
        scope: 'attachment',
        severity: 'error',
        message: `Signature at index ${firstInvalid?.keyIndex ?? 'unknown'} is invalid`,
        eventIndex: i,
      };
      overallValid = false;
    }

    // 6. Threshold validation — prefer normalized threshold from state if available
    let thresholdMet = false;
    if (state) {
      const normalizedResult = checkNormalizedThreshold(state.signingThreshold, sigResult.validKeyIndices);
      thresholdMet = normalizedResult.satisfied;
    } else {
      try {
        const thresholdSpec: ThresholdSpec = threshold;
        const thresholdResult = checkThreshold(thresholdSpec, Array.from(sigResult.validKeyIndices), keys.length);
        thresholdMet = thresholdResult.satisfied;
      } catch {
        thresholdMet = false;
      }
    }

    checks.thresholdMet = {
      passed: thresholdMet,
      required: typeof threshold === 'string' ? threshold : JSON.stringify(threshold),
      validSignatureCount: sigResult.validKeyIndices.size,
      error: thresholdMet ? undefined : `Threshold not met: ${sigResult.validKeyIndices.size} valid signatures`,
    };

    if (!thresholdMet && !firstError) {
      firstError = {
        code: 'THRESHOLD_NOT_MET',
        scope: 'attachment',
        severity: 'error',
        message: `Threshold not met for event ${i}: ${sigResult.validKeyIndices.size} valid signatures`,
        eventIndex: i,
      };
      overallValid = false;
    }

    // 7. Key chain validation for rotation events
    if ((event.t === 'rot' || event.t === 'drt') && lastEstablishment) {
      const keyChainResult = validateKeyChainWithDetails(event, lastEstablishment);
      checks.keyChainValid = keyChainResult;

      if (!keyChainResult.passed && !firstError) {
        firstError = {
          code: 'NEXT_KEY_MISMATCH',
          scope: 'event',
          severity: 'error',
          message: `Keys in event ${i} do not match previous event's next key commitments`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 8. Delegation validation for delegated events
    if (isDelegatedEvent(event)) {
      const delegationResult = validateDelegationWithDetails(cesrEvent, parentKel);
      checks.delegationValid = delegationResult;

      if (!delegationResult.passed && !firstError) {
        const errorCode = delegationResult.missingParentKel ? 'MISSING_PARENT_KEL' : 'PARENT_SIGNATURE_INVALID';
        firstError = {
          code: errorCode,
          scope: 'attachment',
          severity: 'error',
          message: delegationResult.error ?? 'Delegation validation failed',
          eventIndex: i,
          missingAid: delegationResult.parentAid as AID | undefined,
        };
        overallValid = false;
      }
    }

    // 9. Sequence number validation (uses derived state)
    if (state && event.s !== state.expectedSequence) {
      if (!firstError) {
        firstError = {
          code: 'SEQUENCE_INVALID',
          scope: 'event',
          severity: 'error',
          message: `Sequence number mismatch at event ${i}: expected ${state.expectedSequence}, got ${event.s}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 10. AID consistency (uses derived state)
    if (state && i > 0 && event.i !== (state.kelAid as string)) {
      if (!firstError) {
        firstError = {
          code: 'AID_INCONSISTENT',
          scope: 'chain',
          severity: 'error',
          message: `AID mismatch at event ${i}: expected ${state.kelAid}, got ${event.i}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 11. First event must be inception (uses derived state)
    if (state && i === 0 && event.t !== 'icp' && event.t !== 'dip') {
      if (!firstError) {
        firstError = {
          code: 'FIRST_EVENT_NOT_INCEPTION',
          scope: 'chain',
          severity: 'error',
          message: `First event must be icp or dip, got ${event.t}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 12. Non-transferable violation (uses derived state)
    // A non-transferable AID (n=[]) cannot have ANY subsequent events.
    if (state?.nonTransferable && i > start) {
      if (!firstError) {
        firstError = {
          code: 'NON_TRANSFERABLE_VIOLATION',
          scope: 'event',
          severity: 'error',
          message: `Non-transferable AID cannot have any event after inception at index ${i}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 13. Config trait: EO (establishment only) blocks ixn
    if (state?.inceptionTraits.has('EO') && event.t === 'ixn') {
      if (!firstError) {
        firstError = {
          code: 'CONFIG_TRAIT_VIOLATION',
          scope: 'event',
          severity: 'error',
          message: `Establishment-only (EO) AID cannot have interaction event at ${i}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 13b. Config trait immutability: rotation cannot remove inception traits
    if (state && (event.t === 'rot' || event.t === 'drt') && state.inceptionTraits.size > 0) {
      const rotTraits = new Set((event as RotEvent | DrtEvent).c ?? []);
      for (const trait of state.inceptionTraits) {
        if (!rotTraits.has(trait)) {
          if (!firstError) {
            firstError = {
              code: 'CONFIG_TRAIT_REMOVED',
              scope: 'event',
              severity: 'error',
              message: `Rotation at event ${i} removes inception trait '${trait}'`,
              eventIndex: i,
            };
          }
          overallValid = false;
          break;
        }
      }
    }

    // 14. Duplicate keys check
    if (isEstablishmentEvent(event)) {
      const dupKeys = checkArrayUniqueness(event.k as string[]);
      if (dupKeys.length > 0 && !firstError) {
        firstError = {
          code: 'DUPLICATE_KEYS',
          scope: 'event',
          severity: 'error',
          message: `Duplicate signing keys at event ${i}: ${dupKeys.join(', ')}`,
          eventIndex: i,
        };
        overallValid = false;
      }

      const dupNextDigests = checkArrayUniqueness(event.n as string[]);
      if (dupNextDigests.length > 0 && !firstError) {
        firstError = {
          code: 'DUPLICATE_NEXT_DIGESTS',
          scope: 'event',
          severity: 'error',
          message: `Duplicate next key digests at event ${i}: ${dupNextDigests.join(', ')}`,
          eventIndex: i,
        };
        overallValid = false;
      }
    }

    // 15. Witness validation (uses derived state)
    if (state && isEstablishmentEvent(event)) {
      const bt = typeof state.witnessThreshold === 'string' ? parseInt(state.witnessThreshold, 10) || 0 : 0;
      const witnessCount = state.witnesses.size;

      // 15a. Witness threshold must be satisfiable (bt <= witness count)
      if (bt > witnessCount) {
        if (!firstError) {
          firstError = {
            code: 'WITNESS_THRESHOLD_UNSATISFIABLE',
            scope: 'event',
            severity: 'error',
            message: `Witness threshold ${bt} exceeds witness count ${witnessCount} at event ${i}`,
            eventIndex: i,
          };
        }
        overallValid = false;
      }

      // 15b. Witness delta validity for rotation events
      const witnessNotes = state.notes.filter((n) => n.code === 'malformed-witnesses');
      if (witnessNotes.length > 0) {
        if (!firstError) {
          firstError = {
            code: 'WITNESS_DELTA_INVALID',
            scope: 'event',
            severity: 'error',
            message: witnessNotes[0]!.message,
            eventIndex: i,
          };
        }
        overallValid = false;
      }
    }

    // 15c. Witness receipt threshold (fully-witnessed mode only)
    if (state && options?.mode === 'fully-witnessed' && isEstablishmentEvent(event)) {
      const bt = typeof state.witnessThreshold === 'string' ? parseInt(state.witnessThreshold, 10) || 0 : 0;
      if (bt > 0) {
        const rctAttachments = cesrEvent.attachments.filter((a) => a.kind === 'rct');
        // Count receipts from witnesses in the current witness set
        const validReceipts = rctAttachments.filter((a) => state.witnesses.has((a as any).by as string));
        if (validReceipts.length < bt) {
          if (!firstError) {
            firstError = {
              code: 'WITNESS_RECEIPT_THRESHOLD_NOT_MET',
              scope: 'attachment',
              severity: 'error',
              message: `Witness receipt threshold not met at event ${i}: ${validReceipts.length} receipts, need ${bt}`,
              eventIndex: i,
            };
          }
          overallValid = false;
        }
      }
    }

    // Update last establishment event
    if (isEstablishmentEvent(event)) {
      lastEstablishment = event;
    }

    // Collect event detail
    eventDetails.push({
      eventIndex: i,
      eventType,
      eventSaid: event.d,
      checks,
    });

    // Update overall validity based on all checks
    const allChecksPassed =
      checks.isValidKeriEvent.passed &&
      checks.saidValid.passed &&
      checks.requiredFieldsPresent.passed &&
      (checks.previousEventValid?.passed ?? true) &&
      checks.signaturesValid.passed &&
      checks.thresholdMet.passed &&
      (checks.keyChainValid?.passed ?? true) &&
      (checks.delegationValid?.passed ?? true);

    if (!allChecksPassed) {
      overallValid = false;
    }
  }

  return {
    valid: overallValid,
    eventDetails,
    firstError,
  };
}

// --------------------------------------------------------------------------------------
// Main Chain Validation (Thin Wrapper)
// --------------------------------------------------------------------------------------

/**
 * Validate a KEL chain with rich per-event details
 *
 * Thin wrapper over the two-pass architecture:
 * 1. `reduceKelState` derives per-event state
 * 2. `validateKel` runs validation checks against each event
 *
 * @param events - Array of CESR events to validate
 * @param options - Optional validation options (parentKel, startIndex, mode)
 * @returns RichValidationResult with per-event details and overall validity
 */
export function validateKelChain(events: CESREvent[], options?: KelValidationOptions): RichValidationResult {
  const states = reduceKelState(events);
  return validateKel(events, states, options);
}
