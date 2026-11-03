// packages/core/src/requirements/evidence-data.ts
import { Value } from '@sinclair/typebox/value';
import type { AID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import {
  type IsMemberEvidence,
  isOobiRef,
  isRequiredRef,
  type Ref,
  type ResolvedEvidence,
  type SuppliedEvidence,
  SuppliedEvidenceSchema,
  type SuppliedIsMemberEvidence,
} from './types.js';

type Unwrapped<T> = { ok: true; value: T } | { ok: false; oobi: string };

function unwrap<T>(ref: Ref<T>): Unwrapped<T> {
  if (isOobiRef(ref)) return { ok: false, oobi: ref.oobi };
  if (isRequiredRef(ref)) return { ok: true, value: ref.value };
  return { ok: true, value: ref as T };
}

function refUrl(ref: unknown): string | undefined {
  return typeof ref === 'object' && ref !== null && !Array.isArray(ref) && Object.hasOwn(ref, 'oobi')
    ? String((ref as { oobi: string }).oobi)
    : undefined;
}

function refs(e: SuppliedEvidence): string[] {
  switch (e.type) {
    case 'is-member':
      return Object.values(e.kels).flatMap((k) => refUrl(k) ?? []);
    case 'has-credential':
      return [
        refUrl(e.acdc),
        refUrl(e.registryTel),
        refUrl(e.credentialTel),
        ...Object.values(e.kels).map(refUrl),
        ...(e.membership ? refs(e.membership) : []),
      ].filter((u): u is string => u !== undefined);
    case 'self-asserted':
      return [];
    case 'and':
    case 'or':
      return Object.values(e.evidence).flatMap(refs);
    default: {
      const unknownEvidence: never = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(unknownEvidence)}`);
    }
  }
}

function inlineKels(kels: SuppliedIsMemberEvidence['kels'], missing: string[]): IsMemberEvidence['kels'] {
  const out: IsMemberEvidence['kels'] = {};
  for (const [aid, ref] of Object.entries(kels)) {
    const u = unwrap(ref);
    if (u.ok) out[aid] = u.value;
    else missing.push(u.oobi);
  }
  return out;
}

function inlineMembership(e: SuppliedIsMemberEvidence, missing: string[]): IsMemberEvidence {
  return { type: 'is-member', lineage: e.lineage as AID[], kels: inlineKels(e.kels, missing) };
}

/** Unwraps refs; pushes every unresolvable OOBI to `missing` and returns undefined if this subtree is incomplete. */
function inline(e: SuppliedEvidence, missing: string[]): ResolvedEvidence | undefined {
  switch (e.type) {
    case 'is-member':
      return inlineMembership(e, missing);
    case 'has-credential': {
      const acdc = unwrap(e.acdc);
      const registryTel = unwrap(e.registryTel);
      const credentialTel = unwrap(e.credentialTel);
      for (const u of [acdc, registryTel, credentialTel]) if (!u.ok) missing.push(u.oobi);
      const kels = inlineKels(e.kels, missing);
      const membership = e.membership ? inlineMembership(e.membership, missing) : undefined;
      if (!acdc.ok || !registryTel.ok || !credentialTel.ok) return undefined;
      return {
        type: 'has-credential',
        acdc: acdc.value,
        registryTel: registryTel.value,
        credentialTel: credentialTel.value,
        kels,
        ...(membership ? { membership } : {}),
      };
    }
    case 'self-asserted':
      return { type: 'self-asserted', attributes: e.attributes };
    case 'and':
    case 'or': {
      const children = Object.entries(e.evidence).map(([k, v]) => [k, inline(v, missing)] as const);
      if (children.some(([, v]) => v === undefined)) return undefined;
      return { type: e.type, evidence: Object.fromEntries(children) as Record<string, ResolvedEvidence> };
    }
    default: {
      const unknownEvidence: never = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(unknownEvidence)}`);
    }
  }
}

/** The evidence at a requirement name path (and/or levels hold child names); undefined when absent. */
function at<E extends SuppliedEvidence | ResolvedEvidence>(e: E, path: readonly string[]): E | undefined {
  let cur: E | undefined = e;
  for (const name of path) {
    if (cur?.type !== 'and' && cur?.type !== 'or') return undefined;
    const children = cur.evidence as Record<string, E>;
    cur = Object.hasOwn(children, name) ? children[name] : undefined;
  }
  return cur;
}

export const EvidenceData = {
  refs,
  at,
  /** Schema-check untrusted JSON into SuppliedEvidence (CESR formats are registered by requirement-ops). */
  parseSupplied(raw: unknown): Result<SuppliedEvidence, string> {
    if (Value.Check(SuppliedEvidenceSchema, raw)) return ok(raw);
    const first = Value.Errors(SuppliedEvidenceSchema, raw).First();
    return err(first ? `${first.path || '/'}: ${first.message}` : 'invalid evidence');
  },
  fromInline(e: SuppliedEvidence): Result<ResolvedEvidence, { refs: string[] }> {
    const missing: string[] = [];
    const value = inline(e, missing);
    return value !== undefined && missing.length === 0 ? ok(value) : err({ refs: missing });
  },
} as const;
