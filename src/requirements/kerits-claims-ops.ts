import type { AID, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import type { VerifiedAuth, VerifiedEntry } from './auth-ops.js';
import type { AuthRequest } from './auth-types.js';
import { DisclosureOps, type PublishedOobis } from './disclosure-ops.js';
import type { Policy } from './types.js';

/** `{ v, policySAIDs }` plus one object per satisfied alias. */
export type KeritsClaims = { v: 2; policySAIDs: SAID[] } & Record<string, unknown>;
export type ResourceGrant = { origin: string; aliases: string[] };
export type KeritsGrant = {
  sub: AID;
  /** OIDC keys lifted from `any-of` issuer entries only. */
  topLevel: Record<string, unknown>;
  kerits: KeritsClaims;
  resources: ResourceGrant[];
};

export type ProjectFailure =
  | { kind: 'missing-sub' }
  | { kind: 'ambiguous-subject' }
  | { kind: 'disclosure-missing'; as: string; path: string }
  | { kind: 'audience-invalid'; as: string; reason: 'missing' | 'not-a-url' }
  | { kind: 'oidc-conflict'; as: string };

const OIDC_KEYS = ['email', 'email_verified', 'name', 'preferred_username'] as const;

/** Only a ROOT `any-of` credential lifts: self-asserted / any-issuer values must never read as verified OIDC identity. */
function liftsToTopLevel(policy: Policy): boolean {
  const r = policy.requirement;
  if (r.type !== 'has-credential') return false;
  switch (r.issuer.type) {
    case 'any-of':
      return true;
    case 'any':
    case 'self-asserted':
      return false;
    default: {
      const _x: never = r.issuer;
      throw new Error(`Unsupported issuer: ${JSON.stringify(_x)}`);
    }
  }
}

/** Alias-relative paths (`data.email`) that project() lifts to the id_token top level (never under the alias). */
function liftedKeys(policy: Policy): readonly string[] {
  return liftsToTopLevel(policy) ? OIDC_KEYS.map((k) => `data.${k}`) : [];
}

export type OobiField = 'credentialOOBI' | 'telOOBI';

/** Own-property object at `key`, else undefined. */
function ownObject(obj: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const v = Object.hasOwn(obj, key) ? obj[key] : undefined;
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  let cur: unknown = obj;
  for (const seg of path.split('.')) {
    if (typeof cur !== 'object' || cur === null || !Object.hasOwn(cur, seg)) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function originOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function pickSub(verified: VerifiedAuth): Result<AID, ProjectFailure> {
  if (verified.target) return ok(verified.target);
  const subjects = new Set(verified.entries.map((e) => e.subject));
  if (subjects.size === 0) return err({ kind: 'missing-sub' });
  if (subjects.size > 1) return err({ kind: 'ambiguous-subject' });
  return ok([...subjects][0]!);
}

type Projected = { entry: VerifiedEntry; fields: Record<string, unknown> };

function project(
  request: AuthRequest,
  verified: VerifiedAuth,
  published?: PublishedOobis,
): Result<KeritsGrant, ProjectFailure[]> {
  const failures: ProjectFailure[] = [];
  const sub = pickSub(verified);
  if (!sub.ok) failures.push(sub.error);

  const topLevel: Record<string, unknown> = {};
  const kerits: KeritsClaims = { v: 2, policySAIDs: verified.entries.map((e) => e.policySaid) };
  const projected = new Map<string, Projected>();

  for (const entry of verified.entries) {
    const { claims, missingRequired } = DisclosureOps.project({
      requirement: entry.policy.requirement,
      evidence: entry.evidence,
      subject: entry.subject,
      published,
    });
    for (const path of missingRequired) failures.push({ kind: 'disclosure-missing', as: entry.as, path });
    const fields = { ...claims };
    const data = ownObject(fields, 'data');
    if (data && liftsToTopLevel(entry.policy)) {
      for (const k of OIDC_KEYS) {
        if (Object.hasOwn(data, k)) {
          // two entries must not both claim one OIDC key (first-wins would be arbitrary)
          if (k in topLevel) failures.push({ kind: 'oidc-conflict', as: entry.as });
          topLevel[k] = data[k];
          delete data[k];
        }
      }
      if (Object.keys(data).length === 0) delete fields.data;
    }
    // policySAID is authoritative (DisclosureOps keeps attribute values inside `data`; this guards the alias level)
    const { policySAID: _p, ...safe } = fields;
    projected.set(entry.as, { entry, fields: safe });
    kerits[entry.as] = { policySAID: entry.policySaid, ...safe };
  }

  const resources: ResourceGrant[] = [];
  for (const re of request.entries) {
    const p = projected.get(re.as);
    if (!re.audienceFrom || !p) continue;
    const value = getPath(p.fields, re.audienceFrom);
    const origin = originOf(value);
    if (origin === undefined) {
      failures.push({ kind: 'audience-invalid', as: re.as, reason: value === undefined ? 'missing' : 'not-a-url' });
      continue;
    }
    const included = (re.audienceIncludes ?? []).filter((a) => projected.has(a));
    resources.push({ origin, aliases: [re.as, ...included] });
  }

  if (failures.length > 0 || !sub.ok) return err(failures);
  return ok({ sub: sub.value, topLevel, kerits, resources });
}

function base(grant: KeritsGrant): KeritsClaims {
  return { v: 2, policySAIDs: grant.kerits.policySAIDs };
}

/** RFC 8707: the token for `resource` carries only that resource's aliases. */
function forResource(grant: KeritsGrant, resource: string): Result<KeritsClaims, 'invalid_target'> {
  const origin = originOf(resource);
  const matches = grant.resources.filter((r) => r.origin === origin);
  if (origin === undefined || matches.length !== 1) return err('invalid_target');
  const out = base(grant);
  for (const a of matches[0]!.aliases) out[a] = grant.kerits[a];
  return ok(out);
}

export const KeritsClaimsOps = { project, forResource, base, liftedKeys } as const;
