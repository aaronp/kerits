import { AUTH_DOMAIN, ChallengeOps } from '../challenge/challenge-ops.js';
import type { ChallengeFailure, ChallengeResponse } from '../challenge/types.js';
import type { AID, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import {
  ALIAS_PATTERN,
  type AuthRequest,
  type AuthResponseSlot,
  isInlinePolicy,
  isPolicySaid,
  type PolicyRef,
  type RequestEntry,
} from './auth-types.js';
import type { KelFreshnessFailure, Kels } from './kel-freshness.js';
import { PolicyOps } from './requirement-ops.js';
import type { EvidenceFailure, Policy, ResolvedEvidence } from './types.js';

export type PolicyRefFailure = { kind: 'not-found' | 'said-mismatch' | 'invalid' };

/** Resolve a PolicyRef to a validated Policy: inline → validate; SAID → fetch, validate, and check `d`. */
function resolve(ref: PolicyRef, fetch?: (said: SAID) => Policy | undefined): Result<Policy, PolicyRefFailure> {
  const policy = isPolicySaid(ref) ? fetch?.(ref) : isInlinePolicy(ref) ? ref : null;
  if (policy === null) return err({ kind: 'invalid' });
  if (!policy) return err({ kind: 'not-found' });
  const valid = PolicyOps.validate(policy);
  if (!valid.ok) return err({ kind: valid.error.kind === 'said-mismatch' ? 'said-mismatch' : 'invalid' });
  return isPolicySaid(ref) && policy.d !== ref ? err({ kind: 'said-mismatch' }) : ok(policy);
}

export const PolicyRefOps = { resolve } as const;

export type ControlFailureReason = ChallengeFailure['kind'] | KelFreshnessFailure | 'aid-mismatch';

export type AuthFailure =
  | { kind: 'nonce-mismatch' }
  | { kind: 'target-not-allowed' }
  | { kind: 'unknown-alias'; as: string }
  | { kind: 'required-missing'; as: string }
  | { kind: 'policy-unresolved'; as: string; reason: PolicyRefFailure['kind'] }
  | { kind: 'policy-said-mismatch'; as: string }
  | { kind: 'evidence-invalid'; as: string; failures: EvidenceFailure[] }
  | { kind: 'control-missing'; aid: AID }
  | { kind: 'control-invalid'; aid: AID; aliases: string[]; reason: ControlFailureReason };

export type VerifiedEntry = {
  as: string;
  policySaid: SAID;
  policy: Policy;
  subject: AID;
  evidence: ResolvedEvidence;
};

export type VerifiedAuth = {
  /** Satisfied entries, in request order. */
  entries: VerifiedEntry[];
  target?: AID;
  /** Per proven AID, the qb64 public key that verified its control. */
  signingKeys: Record<AID, string>;
};

export type RequestError = {
  kind:
    | 'duplicate-alias'
    | 'reserved-alias'
    | 'bad-alias'
    | 'includes-without-audience'
    | 'audience-and-audience-from'
    | 'audience-invalid'
    | 'unknown-include'
    | 'self-include';
  as: string;
};

const RESERVED_ALIASES = new Set(['v', 'policySAIDs']);

/** `https:`, or `http:` only for loopback hosts. */
function isAllowedAudience(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' || (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'))
    );
  } catch {
    return false;
  }
}

const ALIAS_RE = new RegExp(ALIAS_PATTERN);

/** Alias rules the schema cannot express: uniqueness, reserved keys, and `audienceIncludes` references. */
function validateRequest(r: AuthRequest): Result<AuthRequest, RequestError[]> {
  const aliases = new Set(r.entries.map((e) => e.as));
  const seen = new Set<string>();
  const errors: RequestError[] = [];
  for (const e of r.entries) {
    const fail = (kind: RequestError['kind']) => errors.push({ kind, as: e.as });
    if (seen.has(e.as)) fail('duplicate-alias');
    else if (RESERVED_ALIASES.has(e.as)) fail('reserved-alias');
    else if (!ALIAS_RE.test(e.as)) fail('bad-alias');
    seen.add(e.as);
    const includes = e.audienceIncludes ?? [];
    if (e.audience !== undefined && e.audienceFrom !== undefined) fail('audience-and-audience-from');
    else if (e.audience !== undefined && !isAllowedAudience(e.audience)) fail('audience-invalid');
    else if (includes.length > 0 && !e.audience && !e.audienceFrom) fail('includes-without-audience');
    else if (includes.includes(e.as)) fail('self-include');
    else if (includes.some((a) => !aliases.has(a))) fail('unknown-include');
  }
  return errors.length > 0 ? err(errors) : ok(r);
}

/** `rec[key]` when it is an own property (keys come from untrusted input; aliases like `constructor` are valid). */
function own<T>(rec: Readonly<Record<string, T>> | undefined, key: string): T | undefined {
  return rec && Object.hasOwn(rec, key) ? rec[key] : undefined;
}

/** Prefer the slot's own policy when its `d` matches the ref; resolution still validates and checks the SAID. */
function resolveSlotPolicy(
  ref: PolicyRef,
  slot: { policy?: Policy },
  fetchPolicy: ((said: SAID) => Policy | undefined) | undefined,
) {
  const refSaid = isPolicySaid(ref) ? ref : isInlinePolicy(ref) ? ref.d : undefined;
  return resolve(slot.policy && slot.policy.d === refSaid ? slot.policy : ref, fetchPolicy);
}

/** The slot shape both the wire response and the resolved response share. */
type ShapeSlot = { policySaid: SAID; policy?: Policy; subject: AID };
type ShapeResponse<S extends ShapeSlot> = { requestNonce: string; target?: AID; slots: Record<string, S> };
export type ShapedEntry<S extends ShapeSlot = AuthResponseSlot> = { entry: RequestEntry; slot: S; policy: Policy };

/**
 * The response's shape against its request: the nonce, the target flag, every slot alias requested, every required
 * entry present, and each present slot's policy resolved (the entry's inline policy, else the slot's own policy when its
 * `d` equals the ref, else `fetchPolicy`) and named by `policySaid`. Returns each present entry with its slot and policy.
 */
function checkShape<S extends ShapeSlot>(
  request: AuthRequest,
  response: ShapeResponse<S>,
  fetchPolicy?: (said: SAID) => Policy | undefined,
): Result<ShapedEntry<S>[], AuthFailure[]> {
  if (response.requestNonce !== request.nonce) return err([{ kind: 'nonce-mismatch' }]);
  if (response.target && !request.allowTargetAid) return err([{ kind: 'target-not-allowed' }]);
  const requested = new Set(request.entries.map((e) => e.as));
  const failures: AuthFailure[] = Object.keys(response.slots)
    .filter((as) => !requested.has(as))
    .map((as) => ({ kind: 'unknown-alias', as }));
  const shaped: ShapedEntry<S>[] = [];
  for (const entry of request.entries) {
    const { as } = entry;
    const slot = own(response.slots, as);
    if (!slot) {
      if (entry.need === 'required') failures.push({ kind: 'required-missing', as });
      continue;
    }
    const resolved = resolveSlotPolicy(entry.policy, slot, fetchPolicy);
    if (!resolved.ok) failures.push({ kind: 'policy-unresolved', as, reason: resolved.error.kind });
    else if (slot.policySaid !== resolved.value.d) failures.push({ kind: 'policy-said-mismatch', as });
    else shaped.push({ entry, slot, policy: resolved.value });
  }
  return failures.length > 0 ? err(failures) : ok(shaped);
}

/** Each AID that must prove control (present slots' subjects, then the target) with the aliases it holds. */
function controlAids<S extends ShapeSlot>(request: AuthRequest, response: ShapeResponse<S>): Map<AID, string[]> {
  const aliasesOf = new Map<AID, string[]>();
  for (const { as } of request.entries) {
    const slot = own(response.slots, as);
    if (slot) aliasesOf.set(slot.subject, [...(aliasesOf.get(slot.subject) ?? []), as]);
  }
  if (response.target && !aliasesOf.has(response.target)) aliasesOf.set(response.target, []);
  return aliasesOf;
}

/**
 * `aid`'s control: signed over the request's `nonce` and `audience` (else `audience-mismatch`) by ONE key in the current `k[]` of `kels[aid]` (`kt` is not consulted, by
 * design), its delegator chain read from `kels`. The caller chooses the KELs. Returns the signing key.
 */
function verifyControl(
  request: Pick<AuthRequest, 'nonce' | 'audience'>,
  aid: AID,
  control: ChallengeResponse,
  kels: Kels,
): Result<string, ControlFailureReason> {
  if (control.aid !== aid) return err('aid-mismatch');
  const kel = own(kels, aid);
  if (!kel || kel.length === 0) return err('kel-missing');
  const r = ChallengeOps.verify({ nonce: request.nonce, audience: request.audience }, control, kel, kels, AUTH_DOMAIN);
  return r.ok ? ok(control.publicKey) : err(r.error.kind);
}

/** The bytes a kerits-auth/1 control signs (domain-separated from identity challenges). */
function signingBytes(r: Parameters<typeof ChallengeOps.signingBytes>[0]): Uint8Array {
  return ChallengeOps.signingBytes(r, AUTH_DOMAIN);
}

export const AuthOps = { validateRequest, checkShape, controlAids, verifyControl, signingBytes } as const;
