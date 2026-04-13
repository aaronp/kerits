/**
 * KEL Event Predicates
 *
 * Pure type guards for KEL event types, lifted from kv4's KELs impl namespace
 * (packages/kerits/src/impl/kel-api.ts). These are standalone pure functions
 * with no runtime dependencies beyond the KEL event types.
 *
 * See B-005: pure helpers lifted from impl namespace.
 */

import type { DipEvent, DrtEvent, IcpEvent, IxnEvent, KELEvent, RotEvent } from './types.js';

/** All "establishment" events: those that define key state + next commitments. */
export type EstablishmentEvent = IcpEvent | RotEvent | DipEvent | DrtEvent;

export function isIcp(e: KELEvent): e is IcpEvent {
  return e.t === 'icp';
}

export function isRot(e: KELEvent): e is RotEvent {
  return e.t === 'rot';
}

export function isIxn(e: KELEvent): e is IxnEvent {
  return e.t === 'ixn';
}

export function isDip(e: KELEvent): e is DipEvent {
  return e.t === 'dip';
}

export function isDrt(e: KELEvent): e is DrtEvent {
  return e.t === 'drt';
}

export function isEstablishment(e: KELEvent): e is EstablishmentEvent {
  return e.t === 'icp' || e.t === 'rot' || e.t === 'dip' || e.t === 'drt';
}
