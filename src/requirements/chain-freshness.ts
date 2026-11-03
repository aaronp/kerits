import { err, ok, type Result } from '../result.js';

export type ChainFreshnessFailure = 'missing' | 'stale' | 'forked';

/**
 * Where two chains diverge. `sn` is the element index (the event sn for a well-formed chain). `S` brands the SAIDs.
 * In `forked`, `''` marks a side whose element at `sn` is malformed (its SAID could not be read).
 */
export type ChainDiff<S extends string = string> =
  | { kind: 'identical' }
  /** one chain is a strict SAID prefix of the other; `sn` is the shorter chain's head */
  | { kind: 'extends'; longer: 'mine' | 'other'; sn: number }
  /** a rotation on one side against an interaction on the other at `sn` (structural only: no supersede validation) */
  | { kind: 'superseded'; sn: number; by: 'mine' | 'other'; rotation: S; superseded: S }
  | { kind: 'forked'; sn: number; mine: S | ''; other: S | '' };

/** Compare two append-only chains by element SAID. Pure; never throws (malformed → `forked` at its sn). */
function diff<T, S extends string = string>(
  mine: readonly T[],
  other: readonly T[],
  said: (t: T) => S,
  isRotation: (t: T) => boolean,
  isInteraction: (t: T) => boolean,
): ChainDiff<S> {
  const saidOrEmpty = (t: T): S | '' => {
    try {
      return said(t);
    } catch {
      return '';
    }
  };
  let sn = 0;
  try {
    for (; sn < Math.min(mine.length, other.length); sn++) {
      const m = mine[sn]!;
      const o = other[sn]!;
      const [ms, os] = [said(m), said(o)];
      if (ms === os) continue;
      if (isInteraction(m) && isRotation(o))
        return { kind: 'superseded', sn, by: 'other', rotation: os, superseded: ms };
      if (isRotation(m) && isInteraction(o))
        return { kind: 'superseded', sn, by: 'mine', rotation: ms, superseded: os };
      return { kind: 'forked', sn, mine: ms, other: os };
    }
    if (mine.length === other.length) return { kind: 'identical' };
    return { kind: 'extends', longer: mine.length > other.length ? 'mine' : 'other', sn: sn - 1 };
  } catch {
    const at = (c: readonly T[]) => (sn < c.length ? saidOrEmpty(c[sn]!) : '');
    return { kind: 'forked', sn, mine: at(mine), other: at(other) };
  }
}

/**
 * The fresher of two append-only chains compared by element SAID (no validation), on {@link diff}.
 * Store absent → supplied; supplied absent or equal → store; supplied strictly extends store → supplied;
 * supplied a strict prefix of store → `stale`; otherwise `forked` (a structural supersede included: this rule
 * knows no recovery). Never throws (malformed → `forked`).
 */
function choose<T>(
  supplied: T[] | undefined,
  store: T[] | undefined,
  said: (t: T) => string,
): Result<T[], ChainFreshnessFailure> {
  const absent = (c: T[] | undefined): c is undefined => !c || c.length === 0;
  if (absent(store)) return absent(supplied) ? err('missing') : ok(supplied);
  if (absent(supplied)) return ok(store);
  const d = diff(
    store,
    supplied,
    said,
    () => false,
    () => false,
  );
  switch (d.kind) {
    case 'identical':
      return ok(store);
    case 'extends':
      return d.longer === 'other' ? ok(supplied) : err('stale');
    case 'superseded':
    case 'forked':
      return err('forked');
    default: {
      const unknown: never = d;
      throw new Error(`Unsupported chain diff: ${String(unknown)}`);
    }
  }
}

export const ChainFreshness = { choose, diff } as const;

/** TEL events are chained by their own SAID `d`. */
export const TelFreshness = {
  choose: <T extends { d: string }>(supplied: T[] | undefined, store: T[] | undefined) =>
    choose(supplied, store, (ev) => ev.d),
} as const;
