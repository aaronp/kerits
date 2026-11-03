import { SequenceNumber } from '../common/types.js';
import type { CESREvent, KELEvent } from './types.js';

/** A wire `s` as a number, or undefined when malformed (an untrusted seal or event never matches). */
export function snOf(s: string): number | undefined {
  const sn = SequenceNumber.parse(s);
  return sn.ok ? sn.value : undefined;
}

export type AnchorTargetsValidationResult =
  | { readonly passed: true }
  | {
      readonly passed: false;
      readonly reason: 'missing-referenced-event' | 'said-mismatch';
      readonly anchor?: { readonly i: string; readonly s: string; readonly d: string };
    };

/**
 * Pure check: every `a[]` seal on `event` resolves to a matching event in
 * `referencedEvents` (same AID `i`, sequence `s`, SAID `d`).
 */
export function validateAnchorTargets(
  event: KELEvent,
  referencedEvents: readonly CESREvent[],
): AnchorTargetsValidationResult {
  const anchors = (event as KELEvent & { a?: Array<{ i?: string; s?: string; d?: string }> }).a;
  if (!anchors || anchors.length === 0) {
    return { passed: true };
  }

  for (const raw of anchors) {
    const i = raw.i;
    const s = raw.s;
    const d = raw.d;
    if (i === undefined || s === undefined || d === undefined) {
      return {
        passed: false,
        reason: 'missing-referenced-event',
        anchor: { i: i ?? '', s: s ?? '', d: d ?? '' },
      };
    }
    const anchor = { i, s, d };
    const targetSn = snOf(s);
    const candidates = referencedEvents.filter(
      (e) => e.event.i === i && targetSn !== undefined && snOf(e.event.s) === targetSn,
    );
    if (candidates.length === 0) {
      return { passed: false, reason: 'missing-referenced-event', anchor };
    }
    const match = candidates.find((e) => e.event.d === d);
    if (!match) {
      return { passed: false, reason: 'said-mismatch', anchor };
    }
  }

  return { passed: true };
}
