import { canonical } from '../common/canonical.js';
import type { AID } from '../common/types.js';
import { KELOps } from '../kel/ops.js';
import type { CESREvent } from '../kel/types.js';
import { delegatorOf, validateKelWithAncestors } from '../requirements/kel-ancestry.js';
import { KelFreshness } from '../requirements/kel-freshness.js';
import { MAX_REQUIREMENT_DEPTH } from '../requirements/types.js';
import { err, ok, type Result } from '../result.js';
import { verify as verifyQb64 } from '../signature/verify.js';
import type {
  Challenge,
  ChallengeFailure,
  ChallengeKelForked,
  ChallengeLineageUnresolved,
  ChallengeResponse,
} from './types.js';

/** Domain separator: challenge signatures cannot be replayed as any other kerits signature. */
const CHALLENGE_DOMAIN = 'kerits-challenge/v2';
/** Domain of kerits-auth/1 controls: a control never verifies as an identity challenge, nor the reverse. */
export const AUTH_DOMAIN = 'kerits-auth/1';

/**
 * Canonical signed payload: the challenge and its `audience` (who the response is for). Supporting data (`kel`, `lineage`, `remotes`) is not signed —
 * KELs are self-certifying and are used only when they validate (see {@link resolveKels}).
 */
function signingBytes(
  r: Pick<ChallengeResponse, 'nonce' | 'audience' | 'aid' | 'publicKey' | 'subject'>,
  domain: string = CHALLENGE_DOMAIN,
): Uint8Array {
  return new TextEncoder().encode(
    canonical({
      t: domain,
      nonce: r.nonce,
      audience: r.audience,
      aid: r.aid,
      publicKey: r.publicKey,
      subject: r.subject ?? null,
    }),
  );
}

/** Current keys of the KEL, or undefined if the KEL (or its delegator chain) is invalid/empty. Never throws (untrusted input). */
function currentKeys(
  kel: CESREvent[],
  ancestorKels: Record<string, CESREvent[]>,
): { i: string; k: string[] } | undefined {
  try {
    // ksn() echoes the aid it is given, so derive it from the KEL itself
    const aid = kel[0]!.event.i as AID;
    if (!validateKelWithAncestors(aid, { ...ancestorKels, [aid]: kel })) return undefined;
    return KELOps.forKEL(aid, kel).ksn();
  } catch {
    return undefined;
  }
}

/**
 * `c.audience`: the verifier the response must be signed for (the AS origin, or the challenger AID).
 * `ancestorKels` supplies the delegator chain when the subject KEL is delegated (`dip`).
 */
function verify(
  c: Pick<Challenge, 'nonce' | 'subject'> & { audience: string },
  r: ChallengeResponse,
  subjectKel: CESREvent[],
  ancestorKels: Record<string, CESREvent[]> = {},
  domain: string = CHALLENGE_DOMAIN,
): Result<true, ChallengeFailure> {
  if (r.nonce !== c.nonce) return err({ kind: 'nonce-mismatch' });
  if (r.audience !== c.audience) return err({ kind: 'audience-mismatch' });
  if ((r.subject ?? null) !== (c.subject ?? null)) return err({ kind: 'subject-mismatch' });
  const ksn = currentKeys(subjectKel, ancestorKels);
  if (!ksn) return err({ kind: 'kel-invalid' });
  if (ksn.i !== r.aid) return err({ kind: 'aid-mismatch' });
  if (!ksn.k.includes(r.publicKey)) return err({ kind: 'key-not-in-kel' });
  // verifyQb64 catches decode errors and returns false; guard again so this never throws (untrusted input)
  let valid = false;
  try {
    valid = verifyQb64(r.publicKey, r.signature, signingBytes(r, domain));
  } catch {
    valid = false;
  }
  return valid ? ok(true) : err({ kind: 'signature-invalid' });
}

type KelChoice = { use: 'included' | 'local' } | { use: 'forked'; sn: number };

/** Which KEL to verify `aid` with: the included one only when it validates and extends/supersedes local, else local; a valid fork is reported with its sn. Never throws (untrusted input). */
function chooseKel(
  aid: AID,
  local: CESREvent[],
  included: CESREvent[] | undefined,
  ancestorKels: Record<string, CESREvent[]>,
): KelChoice {
  const local_: KelChoice = { use: 'local' };
  try {
    if (!included || included.length === 0) return local_;
    if (!validateKelWithAncestors(aid, { ...ancestorKels, [aid]: included })) return local_;
    if (local.length === 0) return { use: 'included' };
    const d = KelFreshness.diff(local, included);
    switch (d.kind) {
      case 'identical':
        // same SAIDs: keep local when it validates; otherwise prefer included
        return validateKelWithAncestors(aid, { ...ancestorKels, [aid]: local }) ? local_ : { use: 'included' };
      case 'extends':
        return d.longer === 'other' ? { use: 'included' } : local_;
      case 'superseded':
        return d.by === 'other' ? { use: 'included' } : local_;
      case 'supersede-unsupported':
        // Context: a delegated AID's compromised `ixn` superseded by a rotation at the same sn. Not handled: delegator
        // approval of the superseding rotation is not modelled, so the recovery cannot be validated. Supporting it needs a
        // delegator-sealed recovery `drt` and its approval flow. Until then the local copy is kept (never a fork).
        return local_;
      case 'forked':
        // a malformed local event is local corruption, not duplicity
        return d.mine === '' ? local_ : { use: 'forked', sn: d.sn };
      default: {
        const unknown: never = d;
        throw new Error(`Unsupported KEL diff: ${String(unknown)}`);
      }
    }
  } catch {
    return local_;
  }
}

type Kels = Record<string, CESREvent[]>;

/** `kels[aid]` when it is an own array property (keys may come from untrusted input). */
function own(kels: Kels, aid: string): CESREvent[] | undefined {
  const kel: unknown = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
  return Array.isArray(kel) ? (kel as CESREvent[]) : undefined;
}

/** Included KELs of a response keyed by AID: the responder's `kel` plus each `lineage` entry's `kel`. */
function includedKels(r: Pick<ChallengeResponse, 'aid' | 'kel' | 'lineage'>): Kels {
  return Object.fromEntries([
    ...(r.lineage ?? []).flatMap((l) => (l.kel ? [[l.aid, l.kel] as const] : [])),
    ...(r.kel ? [[r.aid, r.kel] as const] : []),
  ]);
}

/** Delegator of `aid` per its local KEL (else its included KEL). Never throws (untrusted input). */
function delegatorFor(aid: AID, local: Kels, included: Kels): AID | undefined {
  const l = own(local, aid);
  const kel = l && l.length > 0 ? l : own(included, aid);
  try {
    return kel && kel.length > 0 ? delegatorOf(kel) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Choose the KEL to verify `aid` with, and for each delegator in its chain, root-first: an included KEL
 * only when it validates (against the already-chosen ancestors) and strictly extends the local copy
 * ({@link chooseKel}), else the local copy. A delegator with no valid chosen KEL → `lineage-unresolved`; a valid
 * included KEL forking from the local copy → `kel-forked`.
 * The responder's own KEL is left for {@link verify} to judge. `included` lists, root-first, the AIDs whose
 * included KEL was chosen (the KELs a caller may replay). Pure; never throws.
 */
function resolveKels(
  aid: AID,
  local: Kels,
  included: Kels,
): Result<{ kels: Kels; included: AID[] }, ChallengeLineageUnresolved | ChallengeKelForked> {
  try {
    const chain: AID[] = [];
    for (let cur: AID | undefined = aid; cur; cur = delegatorFor(cur, local, included)) {
      if (chain.includes(cur) || chain.length >= MAX_REQUIREMENT_DEPTH)
        return err({ kind: 'lineage-unresolved', aid: cur });
      chain.push(cur);
    }
    const kels: Kels = {};
    const used: AID[] = [];
    for (const a of chain.reverse()) {
      const choice = chooseKel(a, own(local, a) ?? [], own(included, a), kels);
      if (choice.use === 'forked') return err({ kind: 'kel-forked', aid: a, sn: choice.sn });
      const useIncluded = choice.use === 'included';
      const kel = (useIncluded ? own(included, a) : own(local, a)) ?? [];
      if (a !== aid && !validateKelWithAncestors(a, { ...kels, [a]: kel }))
        return err({ kind: 'lineage-unresolved', aid: a });
      if (useIncluded) used.push(a);
      Object.defineProperty(kels, a, { value: kel, enumerable: true, writable: true, configurable: true });
    }
    return ok({ kels, included: used });
  } catch {
    return err({ kind: 'lineage-unresolved', aid });
  }
}

export const ChallengeOps = { signingBytes, verify, includedKels, delegatorFor, resolveKels } as const;
