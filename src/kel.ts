/**
 * KEL (Key Event Log) utilities
 *
 * A KEL is a sequence of key events (inception, rotation, etc.) for an identifier.
 * Events are stored as newline-delimited JSON strings.
 */

import type { SAID, AID } from './types/keri';

export interface KeyEvent {
  ked: Record<string, any>;
  raw: string;
  said?: SAID;
  pre?: AID;
}

/**
 * Serialize a sequence of key events into a KEL
 *
 * Pure function that concatenates event raw serializations with newlines.
 *
 * @param events - Array of key events (inception, rotation, etc.)
 * @returns KEL string (newline-delimited JSON)
 */
export function serializeKEL(events: KeyEvent[]): string {
  if (!events || events.length === 0) {
    return '';
  }

  return events.map(event => event.raw).join('\n');
}

/**
 * Parse a KEL string into individual key events
 *
 * Pure function that splits newline-delimited JSON and parses each event.
 *
 * @param kel - KEL string (newline-delimited JSON)
 * @returns Array of parsed key event objects
 */
export function parseKEL(kel: string): Record<string, any>[] {
  if (!kel || kel.trim() === '') {
    return [];
  }

  return kel
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => JSON.parse(line));
}

/**
 * Get the latest event from a KEL
 *
 * @param kel - KEL string (newline-delimited JSON)
 * @returns The last event in the KEL, or null if empty
 */
export function getLatestEvent(kel: string): Record<string, any> | null {
  const events = parseKEL(kel);
  return events.length > 0 ? events[events.length - 1] : null;
}

/**
 * Get the sequence number from the latest event in a KEL
 *
 * @param kel - KEL string (newline-delimited JSON)
 * @returns The sequence number (as integer) of the latest event, or -1 if empty
 */
export function getLatestSequenceNumber(kel: string): number {
  const latest = getLatestEvent(kel);
  if (!latest || !latest.s) {
    return -1;
  }

  // Parse hex sequence number to integer
  return parseInt(latest.s, 16);
}
