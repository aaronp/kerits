/**
 * KEL State Derivation
 *
 * Pure state machine that walks KEL events and derives per-event state.
 * Best-effort over untrusted input — never throws.
 *
 * @module kel/kel-state
 */

import type { AID, PublicKey, SAID, Threshold } from '../common/types.js';
import { type NormalizedThreshold, normalizeThreshold } from './threshold-normalize.js';
import type { CESREvent, DipEvent, DrtEvent, IcpEvent, KELEvent, RotEvent } from './types.js';

export interface DerivationNote {
  code: 'missing-field' | 'unparseable-threshold' | 'unexpected-event-type' | 'malformed-witnesses';
  message: string;
}

export type EstablishmentEvent = IcpEvent | RotEvent | DipEvent | DrtEvent;

export interface DerivedState {
  index: number;
  expectedSequence: string;
  kelAid: AID;
  signingKeys: PublicKey[];
  signingThreshold: NormalizedThreshold;
  previousSaid: SAID | undefined;
  lastEstablishment: EstablishmentEvent | undefined;
  witnesses: Set<string>;
  witnessThreshold: Threshold;
  inceptionTraits: ReadonlySet<string>;
  nonTransferable: boolean;
  delegatorAid: AID | undefined;
  notes: DerivationNote[];
}

function isEstablishment(event: KELEvent): event is EstablishmentEvent {
  return event.t === 'icp' || event.t === 'rot' || event.t === 'dip' || event.t === 'drt';
}

function isInception(event: KELEvent): event is IcpEvent | DipEvent {
  return event.t === 'icp' || event.t === 'dip';
}

function tryNormalize(
  raw: Threshold | undefined,
  keyCount: number,
): {
  threshold: NormalizedThreshold;
  note?: DerivationNote;
} {
  if (!raw) {
    return {
      threshold: { type: 'simple', m: 1, n: keyCount },
      note: { code: 'unparseable-threshold', message: 'Missing threshold, defaulting to 1' },
    };
  }
  try {
    return { threshold: normalizeThreshold(raw, keyCount) };
  } catch (e) {
    return {
      threshold: { type: 'simple', m: 1, n: keyCount },
      note: {
        code: 'unparseable-threshold',
        message: `Failed to parse threshold: ${e instanceof Error ? e.message : String(e)}`,
      },
    };
  }
}

export function reduceKelState(events: CESREvent[]): DerivedState[] {
  if (events.length === 0) return [];

  const states: DerivedState[] = [];
  let kelAid: AID = '' as AID;
  let signingKeys: PublicKey[] = [];
  let signingThreshold: NormalizedThreshold = { type: 'simple', m: 1, n: 1 };
  let previousSaid: SAID | undefined;
  let lastEstablishment: EstablishmentEvent | undefined;
  let witnesses = new Set<string>();
  let witnessThreshold: Threshold = '0';
  let inceptionTraits: ReadonlySet<string> = new Set();
  let nonTransferable = false;
  let delegatorAid: AID | undefined;

  for (let i = 0; i < events.length; i++) {
    const event = events[i]!.event;
    const notes: DerivationNote[] = [];

    if (i === 0) {
      kelAid = event.i as AID;
      if (!isInception(event)) {
        notes.push({
          code: 'unexpected-event-type',
          message: `First event is '${event.t}', expected 'icp' or 'dip'`,
        });
      }
    }

    if (isEstablishment(event)) {
      signingKeys = (event.k ?? []) as PublicKey[];
      const keyCount = signingKeys.length || 1;

      const { threshold, note } = tryNormalize(event.kt, keyCount);
      signingThreshold = threshold;
      if (note) notes.push(note);

      nonTransferable = Array.isArray(event.n) && event.n.length === 0;
      lastEstablishment = event;

      if (event.t === 'icp' || event.t === 'dip') {
        witnesses = new Set(event.b ?? []);
        witnessThreshold = event.bt ?? '0';
        inceptionTraits = new Set(event.c ?? []);

        if (event.t === 'dip') {
          if (event.di) {
            delegatorAid = event.di as AID;
          } else {
            notes.push({ code: 'missing-field', message: 'dip event missing di field' });
          }
        }
      } else if (event.t === 'rot' || event.t === 'drt') {
        const br: string[] = event.br ?? [];
        const ba: string[] = event.ba ?? [];
        const newWitnesses = new Set(witnesses);
        for (const removed of br) {
          if (!newWitnesses.has(removed)) {
            notes.push({
              code: 'malformed-witnesses',
              message: `br contains '${removed}' which is not in current witness set`,
            });
          }
          newWitnesses.delete(removed);
        }
        for (const added of ba) {
          if (newWitnesses.has(added)) {
            notes.push({
              code: 'malformed-witnesses',
              message: `ba contains '${added}' which is already in witness set`,
            });
          }
          newWitnesses.add(added);
        }
        witnesses = newWitnesses;
        witnessThreshold = event.bt ?? witnessThreshold;
      }
    }

    states.push({
      index: i,
      expectedSequence: String(i),
      kelAid,
      signingKeys: [...signingKeys],
      signingThreshold,
      previousSaid,
      lastEstablishment,
      witnesses: new Set(witnesses),
      witnessThreshold,
      inceptionTraits,
      nonTransferable,
      delegatorAid,
      notes,
    });

    previousSaid = event.d as SAID;
  }

  return states;
}
