import type { AID, SAID } from '../common/types.js';
import { KELOps } from '../kel/ops.js';
import type { CESREvent } from '../kel/types.js';
import { err, ok, type Result } from '../result.js';
import { type ChainDiff, ChainFreshness } from './chain-freshness.js';
import { validateKelWithAncestors } from './kel-ancestry.js';
import type { Source } from './types.js';

export type Kels = Readonly<Record<AID, CESREvent[]>>;
export type KelFreshnessFailure =
  | 'kel-missing'
  | 'kel-invalid'
  | 'kel-stale'
  | 'kel-forked'
  | 'kel-superseded'
  | 'kel-supersede-unsupported';

/**
 * {@link ChainDiff} over KELs, where `superseded` is a VALID KERI supersede ({@link KELOps.validateSupersede}); an
 * invalid one is `forked`. A delegated AID's supersede is `supersede-unsupported` (never `forked`).
 */
export type KelDiff =
  | ChainDiff<SAID>
  | { kind: 'supersede-unsupported'; sn: number; by: 'mine' | 'other'; case: 'delegated' };

/** Diff two KSN-bounded KELs by event SAID. Pure; never throws (malformed → `forked` at its sn). */
function diff(mine: readonly CESREvent[], other: readonly CESREvent[]): KelDiff {
  const d = ChainFreshness.diff(
    mine,
    other,
    (ev) => {
      const said: unknown = ev.event.d;
      if (typeof said !== 'string') throw new Error('malformed KEL event: no SAID');
      return said as SAID;
    },
    // drt counts as a rotation so a delegated supersede reaches validateSupersede (→ supersede-unsupported)
    (ev) => ev.event.t === 'rot' || ev.event.t === 'drt',
    (ev) => ev.event.t === 'ixn',
  );
  if (d.kind !== 'superseded') return d;
  const forked: KelDiff = {
    kind: 'forked',
    sn: d.sn,
    mine: d.by === 'mine' ? d.rotation : d.superseded,
    other: d.by === 'other' ? d.rotation : d.superseded,
  };
  try {
    const [withRot, withIxn] = d.by === 'mine' ? [mine, other] : [other, mine];
    const v = KELOps.validateSupersede(withRot.slice(0, d.sn), withIxn.slice(d.sn), withRot[d.sn]!);
    if (v.ok) return d;
    switch (v.error.kind) {
      case 'supersede-unsupported':
        return { kind: 'supersede-unsupported', sn: d.sn, by: d.by, case: v.error.case };
      case 'kel-invalid':
        return forked;
      default: {
        const unknown: never = v.error;
        throw new Error(`Unsupported supersede error: ${String(unknown)}`);
      }
    }
  } catch {
    return forked;
  }
}

/**
 * KEL to verify `aid`'s control with, on {@link diff} (store = mine, supplied = other): the store's (the verifier's own
 * read) first, the supplied KEL only when it validates and strictly extends the store's (wallet rotated, not yet
 * published), validly supersedes it (recovery rotation over the store's `ixn`), or the store does not know the AID.
 * Supplied behind the store → `kel-stale`; supplied is the branch the store's rotation superseded → `kel-superseded`;
 * delegated supersede → `kel-supersede-unsupported`; diverging → `kel-forked`. `ancestors` supplies a delegator chain.
 * Never throws (untrusted input).
 */
function choose(
  aid: AID,
  supplied: CESREvent[] | undefined,
  store: CESREvent[] | undefined,
  ancestors: Kels,
): Result<CESREvent[], KelFreshnessFailure> {
  try {
    const validated = (kel: CESREvent[]): Result<CESREvent[], KelFreshnessFailure> =>
      validateKelWithAncestors(aid, { ...ancestors, [aid]: kel }) ? ok(kel) : err('kel-invalid');
    const absent = (c: CESREvent[] | undefined): c is undefined => !c || c.length === 0;
    if (absent(store)) return absent(supplied) ? err('kel-missing') : validated(supplied);
    // the store's own read is trusted as-is; a supplied KEL (newer, or a recovery) must validate
    if (absent(supplied)) return ok(store);
    const d = diff(store, supplied);
    switch (d.kind) {
      case 'identical':
        return ok(store);
      case 'extends':
        return d.longer === 'other' ? validated(supplied) : err('kel-stale');
      case 'superseded':
        return d.by === 'other' ? validated(supplied) : err('kel-superseded');
      case 'supersede-unsupported':
        return err('kel-supersede-unsupported');
      case 'forked':
        return err('kel-forked');
      default: {
        const unknown: never = d;
        throw new Error(`Unsupported KEL diff: ${String(unknown)}`);
      }
    }
  } catch {
    return err('kel-invalid');
  }
}

/** What a validator does with a candidate KEL given its {@link diff} against what it already knows. */
export type KelOutcome =
  | { kind: 'use-candidate' }
  | { kind: 'also-ingest-known' }
  | {
      kind: 'forked';
      fork: {
        kind: 'kel-forked' | 'kel-superseded';
        aid: AID;
        sn: number;
        known: SAID;
        candidate: SAID;
        sources: Source[];
      };
    }
  | {
      kind: 'not-yet-supported';
      case: 'supersede-recovery-tel' | 'supersede-recovery-delegated';
      aid: AID;
      sn: number;
    };

/**
 * Decide on {@link diff} (mine = known, other = candidate). Known equal or ahead → also ingest it; candidate ahead or a
 * valid recovery over the known `ixn` → use it; a real divergence → `kel-forked`; the candidate is the branch the known
 * rotation superseded → `kel-superseded`. A supersede is never reported as `forked`. Pure; unknown kinds throw.
 */
function outcome(d: KelDiff, ctx: { aid: AID; used: Source; issuerTelImported: boolean }): KelOutcome {
  const { aid } = ctx;
  const sources: Source[] = ['expected', ctx.used];
  switch (d.kind) {
    case 'identical':
      return { kind: 'also-ingest-known' };
    case 'extends':
      return d.longer === 'mine' ? { kind: 'also-ingest-known' } : { kind: 'use-candidate' };
    case 'forked':
      return {
        kind: 'forked',
        fork: { kind: 'kel-forked', aid, sn: d.sn, known: d.mine as SAID, candidate: d.other as SAID, sources },
      };
    case 'superseded':
      if (d.by === 'mine')
        return {
          kind: 'forked',
          fork: { kind: 'kel-superseded', aid, sn: d.sn, known: d.rotation, candidate: d.superseded, sources },
        };
      // a recovery over an ixn whose TEL events the profile already imported would need those events un-counted
      return ctx.issuerTelImported
        ? { kind: 'not-yet-supported', case: 'supersede-recovery-tel', aid, sn: d.sn }
        : { kind: 'use-candidate' };
    case 'supersede-unsupported':
      // A delegated AID's compromised `ixn` superseded by a rotation at the same sn. Not handled: the delegator's
      // approval of the superseding rotation is not modelled. Supporting it needs a delegator-sealed recovery `drt`
      // and its approval flow.
      return { kind: 'not-yet-supported', case: 'supersede-recovery-delegated', aid, sn: d.sn };
    default: {
      const unknown: never = d;
      throw new Error(`Unsupported KEL diff: ${JSON.stringify(unknown)}`);
    }
  }
}

export const KelFreshness = { choose, diff, outcome } as const;
