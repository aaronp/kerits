/**
 * Pure validation for multi-sig inception sign requests.
 *
 * Validates that an ICP event received in a sign request matches locally stored
 * governance parameters and contains the participant's key contribution correctly.
 * No I/O, no storage, no messaging — pure functional core.
 *
 * @module kel/msig-sign-validation
 */

import { SAID_PLACEHOLDER } from '../common/data.js';
import { deriveSaid, serializeForSigning } from '../common/derivation-surface.js';
import type { PublicKey, SAID, Signature, Threshold } from '../common/types.js';
import { KEL_ICP_SURFACE } from '../said/surfaces.js';
import { verify } from '../signature/verify.js';
import type { IcpEvent, KELEvent } from './types.js';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * Expected governance parameters for the ceremony.
 * These are the locally-stored values the participant uses to validate
 * that the orchestrator's proposed event matches what was agreed upon.
 */
export interface ExpectedCeremonyGovernance {
  /** Expected number of keys in the multi-sig group */
  keyCount: number;
  /** Expected signing threshold */
  signingThreshold: Threshold;
  /** Expected next-key threshold */
  nextThreshold: Threshold;
  /** Expected witnesses (optional) */
  witnesses?: string[];
  /** Expected witness threshold (optional) */
  witnessThreshold?: Threshold;
  /** Expected config traits (optional) */
  config?: string[];
}

/**
 * Parameters for validating a multi-sig inception sign request.
 */
export interface ValidateInceptionSignRequestParams {
  /** The ICP event proposed by the orchestrator */
  event: KELEvent;
  /** The SAID the orchestrator claims for this event */
  expectedEventSaid: SAID;
  /** Governance parameters the participant expects */
  governance: ExpectedCeremonyGovernance;
  /** The participant's own public key (qb64) */
  ownPublicKey: PublicKey;
  /** The participant's own next-key digest (qb64) */
  ownNextKeyDigest: string;
  /** The index where the participant's key should appear */
  participantKeyIndex: number;
  /** The orchestrator's public key for signature verification */
  orchestratorPublicKey: PublicKey;
  /** The orchestrator's signature over the finalized event bytes */
  orchestratorSignature: Signature;
}

/**
 * Validation failure codes.
 */
export type ValidationFailureCode =
  | 'invalid-event-structure'
  | 'event-said-mismatch'
  | 'key-count-mismatch'
  | 'signing-threshold-mismatch'
  | 'next-threshold-mismatch'
  | 'witnesses-mismatch'
  | 'witness-threshold-mismatch'
  | 'config-mismatch'
  | 'own-key-mismatch'
  | 'own-next-digest-mismatch'
  | 'orchestrator-sig-invalid';

/**
 * Result of validating a multi-sig inception sign request.
 */
export type ValidateInceptionSignRequestResult =
  | { ok: true }
  | { ok: false; code: ValidationFailureCode; reason: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function fail(code: ValidationFailureCode, reason: string): ValidateInceptionSignRequestResult {
  return { ok: false, code, reason };
}

function thresholdsEqual(a: Threshold, b: Threshold): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

// ── Main validation ──────────────────────────────────────────────────────────

/**
 * Validate a multi-sig inception sign request.
 *
 * This is the critical security gate that prevents a malicious orchestrator
 * from tricking participants into signing tampered events.
 *
 * Validation steps (in order):
 * 1. Valid ICP structure (event.t === 'icp', has k[] and n[])
 * 2. SAID integrity (recompute and compare)
 * 3. Governance checks (key count, thresholds, witnesses, config)
 * 4. Own key placement
 * 5. Own next digest placement
 * 6. Orchestrator signature verification
 */
export function validateInceptionSignRequest(
  params: ValidateInceptionSignRequestParams,
): ValidateInceptionSignRequestResult {
  const {
    event,
    expectedEventSaid,
    governance,
    ownPublicKey,
    ownNextKeyDigest,
    participantKeyIndex,
    orchestratorPublicKey,
    orchestratorSignature,
  } = params;

  // 1. Valid ICP structure
  if (event.t !== 'icp') {
    return fail('invalid-event-structure', `Expected event type 'icp', got '${event.t}'`);
  }
  const icpEvent = event as IcpEvent;
  if (!Array.isArray(icpEvent.k) || icpEvent.k.length === 0) {
    return fail('invalid-event-structure', 'Event missing or empty key array (k)');
  }
  if (!Array.isArray(icpEvent.n) || icpEvent.n.length === 0) {
    return fail('invalid-event-structure', 'Event missing or empty next-key digest array (n)');
  }

  // 2. SAID integrity — recompute using same derivation as KELEvents.computeSaid
  const eventForDerivation = { ...icpEvent, d: SAID_PLACEHOLDER, i: SAID_PLACEHOLDER };
  const { said: recomputedSaid } = deriveSaid(eventForDerivation, KEL_ICP_SURFACE);
  if (recomputedSaid !== expectedEventSaid) {
    return fail(
      'event-said-mismatch',
      `Recomputed SAID '${recomputedSaid}' does not match expected '${expectedEventSaid}'`,
    );
  }

  // 3. Governance checks
  if (icpEvent.k.length !== governance.keyCount) {
    return fail('key-count-mismatch', `Expected ${governance.keyCount} keys, event has ${icpEvent.k.length}`);
  }
  if (!thresholdsEqual(icpEvent.kt, governance.signingThreshold)) {
    return fail(
      'signing-threshold-mismatch',
      `Event signing threshold ${JSON.stringify(icpEvent.kt)} does not match expected ${JSON.stringify(governance.signingThreshold)}`,
    );
  }
  if (!thresholdsEqual(icpEvent.nt, governance.nextThreshold)) {
    return fail(
      'next-threshold-mismatch',
      `Event next threshold ${JSON.stringify(icpEvent.nt)} does not match expected ${JSON.stringify(governance.nextThreshold)}`,
    );
  }
  if (governance.witnesses !== undefined) {
    if (!arraysEqual(icpEvent.b, governance.witnesses)) {
      return fail(
        'witnesses-mismatch',
        `Event witnesses [${icpEvent.b.join(', ')}] do not match expected [${governance.witnesses.join(', ')}]`,
      );
    }
  }
  if (governance.witnessThreshold !== undefined) {
    if (!thresholdsEqual(icpEvent.bt, governance.witnessThreshold)) {
      return fail(
        'witness-threshold-mismatch',
        `Event witness threshold ${JSON.stringify(icpEvent.bt)} does not match expected ${JSON.stringify(governance.witnessThreshold)}`,
      );
    }
  }
  if (governance.config !== undefined) {
    if (!arraysEqual(icpEvent.c, governance.config)) {
      return fail(
        'config-mismatch',
        `Event config [${icpEvent.c.join(', ')}] does not match expected [${governance.config.join(', ')}]`,
      );
    }
  }

  // 4. Own key placement
  if (icpEvent.k[participantKeyIndex] !== ownPublicKey) {
    return fail(
      'own-key-mismatch',
      `Key at index ${participantKeyIndex} is '${icpEvent.k[participantKeyIndex]}', expected own key '${ownPublicKey}'`,
    );
  }

  // 5. Own next digest placement
  if (icpEvent.n[participantKeyIndex] !== ownNextKeyDigest) {
    return fail(
      'own-next-digest-mismatch',
      `Next digest at index ${participantKeyIndex} is '${icpEvent.n[participantKeyIndex]}', expected '${ownNextKeyDigest}'`,
    );
  }

  // 6. Orchestrator signature — verify over the finalized event bytes
  // The finalized event has d and i set to the SAID
  const finalizedEvent = { ...icpEvent, d: expectedEventSaid, i: expectedEventSaid };
  const { raw: eventBytes } = serializeForSigning(finalizedEvent, KEL_ICP_SURFACE);
  const sigValid = verify(orchestratorPublicKey, orchestratorSignature, eventBytes);
  if (!sigValid) {
    return fail('orchestrator-sig-invalid', 'Orchestrator signature verification failed');
  }

  return { ok: true };
}
