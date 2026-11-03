import type { AID } from '../common/types.js';
import { reduceKelState } from '../kel/kel-state.js';
import type { CESREvent } from '../kel/types.js';
import { validateKelChain } from '../kel/validation.js';
import { MAX_REQUIREMENT_DEPTH } from './types.js';

/** Delegator AID of a KEL's latest state, if delegated. */
export function delegatorOf(kel: CESREvent[]): AID | undefined {
  const states = reduceKelState(kel);
  return states[states.length - 1]?.delegatorAid;
}

function validAt(aid: string, kels: Record<string, CESREvent[]>, depth: number, seen: ReadonlySet<string>): boolean {
  if (depth < 1 || seen.has(aid)) return false;
  const kel: unknown = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
  if (!Array.isArray(kel) || kel.length === 0) return false;
  const first = (kel[0] as { event?: { i?: unknown; t?: unknown; di?: unknown } } | undefined)?.event;
  if (first?.i !== aid) return false;
  if (first.t !== 'dip') return validateKelChain(kel as CESREvent[]).valid;
  const di = first.di;
  if (typeof di !== 'string' || !validAt(di, kels, depth - 1, new Set([...seen, aid]))) return false;
  return validateKelChain(kel as CESREvent[], { parentKel: kels[di] }).valid;
}

/**
 * Validate `kels[aid]`, and for a delegated (`dip`) KEL its delegator chain from the same map.
 * Bounded by `depth` hops, cycle-safe, never throws (untrusted input).
 */
export function validateKelWithAncestors(
  aid: AID,
  kels: Record<string, CESREvent[]>,
  depth = MAX_REQUIREMENT_DEPTH,
): boolean {
  try {
    return validAt(aid, kels, depth, new Set());
  } catch {
    return false;
  }
}
