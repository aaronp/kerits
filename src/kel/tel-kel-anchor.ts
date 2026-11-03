import type { KELEvent } from './types.js';
import { eventContainsAnchorForSaid } from './validation-predicates.js';

export type TelKelAnchorResult =
  | {
      readonly status: 'anchored';
      readonly telEventSaid: string;
      /** KEL event that contains the seal. */
      readonly kelEventSaid: string;
    }
  | {
      readonly status: 'missing';
      readonly telEventSaid: string;
    }
  | {
      readonly status: 'invalid';
      readonly reason: string;
    };

/**
 * Assess whether a TEL event SAID is sealed in an issuer KEL.
 *
 * Pure check over KEL event bodies — does not validate the KEL or TEL chain.
 * Any KEL event whose `a[]` seals `telEventSaid` counts as anchored
 * (same match as {@link eventContainsAnchorForSaid}).
 *
 * Callers decide how to treat `missing`.
 */
export function assessTelKelAnchor(kelEvents: readonly KELEvent[], telEventSaid: string): TelKelAnchorResult {
  const said = telEventSaid.trim();
  if (!said) {
    return { status: 'invalid', reason: 'telEventSaid is required' };
  }

  for (const event of kelEvents) {
    if (eventContainsAnchorForSaid(event, said)) {
      const kelEventSaid = typeof event.d === 'string' ? event.d : '';
      if (!kelEventSaid) {
        return { status: 'invalid', reason: 'KEL event sealing TEL lacks SAID (d)' };
      }
      return {
        status: 'anchored',
        telEventSaid: said,
        kelEventSaid,
      };
    }
  }

  return { status: 'missing', telEventSaid: said };
}

/** Assess each TEL event SAID against the same KEL. */
export function assessTelKelAnchors(
  kelEvents: readonly KELEvent[],
  telEventSaids: readonly string[],
): readonly TelKelAnchorResult[] {
  return telEventSaids.map((said) => assessTelKelAnchor(kelEvents, said));
}

/** The leading TEL events sealed in the issuer KEL; stops at the first event not `anchored`. */
export function anchoredPrefix<T extends { d: string }>(
  events: readonly T[],
  issuerKelBodies: readonly KELEvent[],
): T[] {
  const firstUnanchored = events.findIndex((ev) => assessTelKelAnchor(issuerKelBodies, ev.d).status !== 'anchored');
  return firstUnanchored === -1 ? [...events] : events.slice(0, firstUnanchored);
}

/**
 * A stored TEL lane as a validator reads it: {@link anchoredPrefix}, but never cut below the lane's inception (`vcp` /
 * `iss`). Trailing unanchored events stay unread (stored junk past the anchored head, as a KSN ignores a KEL's), while
 * an unanchored inception is kept so the anchor check reports `tel-unanchored` instead of an empty lane.
 */
export function anchoredLane<T extends { d: string }>(events: readonly T[], issuerKelBodies: readonly KELEvent[]): T[] {
  const prefix = anchoredPrefix(events, issuerKelBodies);
  return prefix.length === 0 ? events.slice(0, 1) : prefix;
}
