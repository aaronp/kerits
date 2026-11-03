// packages/core/src/requirements/disclosure-ops.ts
import { Value } from '@sinclair/typebox/value';
import type { AID, SAID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { parseFieldPath, resolveFieldPath } from './field-path.js';
import {
  CredentialDisclosureSchema,
  type CredentialMetadataField,
  type CredentialDisclosure as Disclosure,
  type Requirement,
  type ResolvedEvidence,
} from './types.js';

export type DisclosureError = {
  kind: 'invalid-shape' | 'invalid-path' | 'duplicate-path';
  detail?: string;
};

/** Where the sign-in service's own keri store publishes each ACDC (by `acdc.d`) and its TEL. */
export type PublishedOobis = Record<SAID, { credentialOOBI?: string; telOOBI?: string }>;

export type DisclosureProjectInput = {
  requirement: Requirement;
  evidence: ResolvedEvidence;
  subject: AID;
  published?: PublishedOobis;
};

export type DisclosureProjectResult = {
  claims: Record<string, unknown>;
  missingRequired: string[];
};

function validatePath(path: string): Result<true, DisclosureError> {
  if (path === '.') return ok(true);
  try {
    parseFieldPath(path);
    return ok(true);
  } catch (e) {
    return err({ kind: 'invalid-path', detail: e instanceof Error ? e.message : path });
  }
}

function subjectAttrs(a: unknown): Record<string, unknown> {
  if (typeof a !== 'object' || a === null || Array.isArray(a)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
    if (k === 'd' || k === 'i') continue;
    if (v !== undefined && v !== null) put(out, k, v);
  }
  return out;
}

/** Own-property write: keys like `__proto__` / `constructor` are plain data, never the prototype. */
function put(obj: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
}

/** The object at `segments` (created where absent or not an object); `claims` itself for none. */
function objectAt(claims: Record<string, unknown>, segments: readonly string[]): Record<string, unknown> {
  let cur = claims;
  for (const seg of segments) {
    const next = Object.hasOwn(cur, seg) ? cur[seg] : undefined;
    if (typeof next !== 'object' || next === null || Array.isArray(next)) put(cur, seg, {});
    cur = cur[seg] as Record<string, unknown>;
  }
  return cur;
}

function valueAtPath(attrs: Record<string, unknown>, path: string): unknown | undefined {
  if (path === '.') return attrs;
  const values = resolveFieldPath(attrs, path);
  return values.length > 0 && values[0] !== undefined && values[0] !== null ? values[0] : undefined;
}

/** The ACDC's holder (`a.i`); not necessarily the slot subject (e.g. `member-of-holder`). */
function holderOf(a: unknown): unknown {
  return typeof a === 'object' && a !== null && Object.hasOwn(a, 'i') ? (a as { i: unknown }).i : undefined;
}

type Leaf = { attrs: Record<string, unknown>; metadata: Partial<Record<CredentialMetadataField, string>> };

/** Attributes and available metadata of one credential leaf's evidence; undefined when it carries none. */
/** `subject` is used only for self-asserted (whose holder is the proven slot subject). */
function leafOf(e: ResolvedEvidence, subject: AID, published: PublishedOobis): Leaf | undefined {
  switch (e.type) {
    case 'has-credential': {
      const holder = holderOf(e.acdc.a);
      const said = String(e.acdc.d);
      const oobis = Object.hasOwn(published, said) ? published[said as SAID] : undefined;
      return {
        attrs: subjectAttrs(e.acdc.a),
        metadata: {
          issuerAID: String(e.acdc.i),
          ...(typeof holder === 'string' ? { holderAID: holder } : {}),
          acdcSAID: said,
          ...(oobis?.credentialOOBI ? { credentialOOBI: oobis.credentialOOBI } : {}),
          ...(oobis?.telOOBI ? { telOOBI: oobis.telOOBI } : {}),
        },
      };
    }
    case 'self-asserted':
      return { attrs: subjectAttrs(e.attributes), metadata: { holderAID: subject } };
    case 'is-member':
    case 'and':
    case 'or':
      return undefined;
    default: {
      const _exhaustive: never = e;
      throw new Error(`Unsupported evidence: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/** Writes `{ data, credential }` at `prefix`; attribute values only ever land inside `data`. */
function projectLeaf(d: Disclosure, leaf: Leaf, prefix: readonly string[], out: DisclosureProjectResult): void {
  const missing = (path: string) => out.missingRequired.push([...prefix, path].join('.'));
  const data: Record<string, unknown> = {};
  for (const f of d.fields) {
    const value = valueAtPath(leaf.attrs, f.path);
    if (value === undefined) {
      if (f.required) missing(`data.${f.path}`);
    } else if (f.path === '.') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) put(data, k, v);
    } else {
      const segs = parseFieldPath(f.path).map((s) => s.property);
      put(objectAt(data, segs.slice(0, -1)), segs.at(-1)!, value);
    }
  }
  const meta: Record<string, string> = {};
  for (const m of d.metadata) {
    const value = leaf.metadata[m.field];
    if (value !== undefined) meta[m.field] = value;
    else if (m.required) missing(`credential.${m.field}`);
  }
  if (Object.keys(data).length === 0 && Object.keys(meta).length === 0) return;
  const target = objectAt(out.claims, prefix);
  if (Object.keys(data).length > 0) put(target, 'data', data);
  if (Object.keys(meta).length > 0) put(target, 'credential', meta);
}

/** Joint walk: each has-credential leaf projects at its name path; is-member projects nothing. */
function walk(
  r: Requirement,
  e: ResolvedEvidence,
  input: DisclosureProjectInput,
  prefix: string[],
  out: DisclosureProjectResult,
): void {
  switch (r.type) {
    case 'is-member':
      return;
    case 'has-credential': {
      const leaf = leafOf(e, input.subject, input.published ?? {});
      if (leaf) projectLeaf(r.disclosure, leaf, prefix, out);
      return;
    }
    case 'and':
    case 'or': {
      if (e.type !== r.type) return;
      // only supplied (hence verified) branches project
      for (const [name, child] of Object.entries(r.requirements)) {
        if (Object.hasOwn(e.evidence, name)) walk(child, e.evidence[name]!, input, [...prefix, name], out);
      }
      return;
    }
    default: {
      const _exhaustive: never = r;
      throw new Error(`Unsupported requirement: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export const DisclosureOps = {
  empty(): Disclosure {
    return { fields: [], metadata: [] };
  },

  validate(d: Disclosure): Result<Disclosure, DisclosureError> {
    if (!Value.Check(CredentialDisclosureSchema, d)) {
      return err({ kind: 'invalid-shape' });
    }
    const seen = new Set<string>();
    for (const f of d.fields) {
      const v = validatePath(f.path);
      if (!v.ok) return v;
      if (seen.has(f.path)) return err({ kind: 'duplicate-path', detail: f.path });
      seen.add(f.path);
    }
    const metaSeen = new Set<string>();
    for (const m of d.metadata) {
      if (metaSeen.has(m.field)) return err({ kind: 'duplicate-path', detail: m.field });
      metaSeen.add(m.field);
    }
    return ok(d);
  },

  /**
   * Claims namespaced by requirement name (root leaf at the top): attributes under `data`, metadata under
   * `credential` (OOBIs only from `published`). Array paths (`emails[]`) project the first element only.
   */
  project(input: DisclosureProjectInput): DisclosureProjectResult {
    const out: DisclosureProjectResult = { claims: {}, missingRequired: [] };
    walk(input.requirement, input.evidence, input, [], out);
    return out;
  },
} as const;
