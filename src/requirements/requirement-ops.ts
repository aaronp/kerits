// packages/core/src/requirements/requirement-ops.ts
import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { ACDCOps } from '../acdc/ops.js';
import type { ACDCCredential } from '../acdc/types.js';
import type { AID } from '../common/types.js';
import { err, ok, type Result } from '../result.js';
import { SchemaOps } from '../schema/ops.js';
import { ALIAS_PATTERN } from './auth-types.js';
import { DisclosureOps } from './disclosure-ops.js';
import { resolveFieldPath } from './field-path.js';
import { evaluateFieldPredicate, predicateHasRequiredValues } from './field-predicate.js';
import { PolicyData } from './requirement-data.js';
import {
  ACDC_ONLY_METADATA,
  type EvidenceFailure,
  type HasCredential,
  type IsMember,
  MAX_REQUIREMENT_DEPTH,
  type Policy,
  PolicySchema,
  type Requirement,
  type RequirementError,
  RequirementSchema,
} from './types.js';

// Core registers no CESR format checkers, so Value.Check rejects any schema using them.
// Shape-check only here; CESR strictness is enforced at parse boundaries (same as tel/ops.ts).
for (const f of ['qb64', 'qb64-key', 'qb64-digest', 'qb64-signature', 'qb64-key-transferable']) {
  if (!FormatRegistry.Has(f)) FormatRegistry.Set(f, () => true);
}

const NAME_RE = new RegExp(ALIAS_PATTERN);
/** The per-credential token objects (`kerits.<as>[.<name>].data|credential`); a child named so would read as one. */
const RESERVED_NAMES = new Set(['data', 'credential']);

function fail(kind: RequirementError['kind'], path: string[], detail?: string): Result<never, RequirementError> {
  return err(detail === undefined ? { kind, path } : { kind, path, detail });
}

function validateIssuer(r: HasCredential, path: string[]): Result<true, RequirementError> {
  switch (r.issuer.type) {
    case 'any-of':
    case 'any':
      return ok(true);
    case 'self-asserted':
      // self-asserted values are bound only to the slot subject (who proves control)
      return r.holder.type === 'subject'
        ? ok(true)
        : fail('invalid-shape', path, 'self-asserted requires holder subject');
    default: {
      const unknownIssuer: never = r.issuer;
      return fail('invalid-shape', path, `unknown issuer: ${JSON.stringify(unknownIssuer)}`);
    }
  }
}

function validateDisclosure(r: HasCredential, path: string[]): Result<true, RequirementError> {
  const d = DisclosureOps.validate(r.disclosure);
  if (!d.ok) return fail(d.error.kind === 'duplicate-path' ? 'duplicate-path' : 'invalid-shape', path, d.error.detail);
  if (r.issuer.type === 'self-asserted') {
    const acdcOnly = r.disclosure.metadata.find((m) => ACDC_ONLY_METADATA.includes(m.field));
    if (acdcOnly) return fail('metadata-unsatisfiable', path, acdcOnly.field);
  }
  return ok(true);
}

function validateTree(r: Requirement, path: string[], depth: number): Result<Requirement, RequirementError> {
  switch (r.type) {
    case 'is-member':
      return ok(r);
    case 'has-credential': {
      const issuer = validateIssuer(r, path);
      if (!issuer.ok) return issuer;
      const disclosure = validateDisclosure(r, path);
      if (!disclosure.ok) return disclosure;
      if (r.issuer.type === 'self-asserted' && r.sources !== undefined)
        return fail('invalid-shape', path, 'self-asserted may not carry sources');
      if (!SchemaOps.verifySaid(r.credential.schema)) return fail('schema-said-invalid', path);
      for (const p of r.credential.predicates) {
        if (!predicateHasRequiredValues(p.op, p.value, p.value2, p.values))
          return fail('predicate-invalid', path, p.path);
      }
      return ok(r);
    }
    case 'and':
    case 'or': {
      if (depth > MAX_REQUIREMENT_DEPTH) return fail('too-deep', path);
      const entries = Object.entries(r.requirements);
      if (entries.length === 0) return fail('empty-expression', path);
      for (const [key, child] of entries) {
        // names become token namespaces (`kerits.<as>.<name>`): `$…`, `__proto__` etc. never match
        if (!NAME_RE.test(key)) return fail('reserved-name', [...path, key], `name must match ${ALIAS_PATTERN}`);
        if (RESERVED_NAMES.has(key)) return fail('reserved-name', [...path, key], `name ${key} is reserved`);
        const v = validateTree(child, [...path, key], depth + 1);
        if (!v.ok) return v;
      }
      return ok(r);
    }
    default: {
      const unknownType: never = r;
      return fail('invalid-shape', path, `unknown requirement: ${JSON.stringify(unknownType)}`);
    }
  }
}

function validate(r: Requirement): Result<Requirement, RequirementError> {
  if (!Value.Check(RequirementSchema, r)) {
    const first = Value.Errors(RequirementSchema, r).First();
    return fail('invalid-shape', [], first ? `${first.path}: ${first.message}` : undefined);
  }
  return validateTree(r, [], 1);
}

export function expectedHolder(r: HasCredential, subject: AID): AID {
  switch (r.holder.type) {
    case 'subject':
    case 'holder-is-member':
      return subject;
    case 'member-of-holder':
      return r.holder.parentAID;
    default: {
      const unknownHolder: never = r.holder;
      throw new Error(`Unsupported holder: ${JSON.stringify(unknownHolder)}`);
    }
  }
}

type Failures = EvidenceFailure[];
const push = (out: Failures, kind: EvidenceFailure['kind'], detail?: string) =>
  out.push(detail === undefined ? { path: [], kind } : { path: [], kind, detail });

function isRecord(a: unknown): a is Record<string, unknown> {
  return typeof a === 'object' && a !== null && !Array.isArray(a);
}

/** Every predicate must hold on `attrs`; malformed paths/predicates are reported, never thrown. */
function predicateFailures(r: HasCredential, attrs: Record<string, unknown> | undefined, now: Date): Failures {
  const out: Failures = [];
  for (const p of r.credential.predicates) {
    let passed = false;
    try {
      passed =
        attrs !== undefined &&
        resolveFieldPath(attrs, p.path).some((v) =>
          evaluateFieldPredicate(v, p, p.fieldType ?? 'string', now.getTime()),
        );
    } catch {
      passed = false;
    }
    if (!passed) push(out, 'predicate-failed', p.path);
  }
  return out;
}

function matchCredential(
  r: HasCredential,
  acdc: ACDCCredential,
  subject: AID,
  now: Date,
): Result<true, EvidenceFailure[]> {
  const failures: Failures = [];
  const f = (kind: EvidenceFailure['kind'], detail?: string) => push(failures, kind, detail);

  if (acdc.s !== r.credential.schema.d) f('schema-mismatch', String(acdc.s));
  switch (r.issuer.type) {
    case 'any-of':
      if (!r.issuer.aids.includes(acdc.i as AID)) f('issuer-not-allowed', String(acdc.i));
      break;
    case 'any':
      break;
    case 'self-asserted':
      f('type-mismatch', 'self-asserted requirement cannot be met by an ACDC');
      break;
    default: {
      const unknownIssuer: never = r.issuer;
      f('type-mismatch', `unknown issuer ${JSON.stringify(unknownIssuer)}`);
    }
  }
  const attrs = isRecord(acdc.a) ? acdc.a : undefined;
  if (!attrs || !ACDCOps.projectAndValidateClaims(acdc, r.credential.schema).validation.valid) f('claims-invalid');
  failures.push(...predicateFailures(r, attrs, now));

  const holder = expectedHolder(r, subject);
  if (attrs?.i !== holder) f('holder-mismatch', `expected ${holder}`);

  return failures.length === 0 ? ok(true) : err(failures);
}

/** Self-asserted values: schema + predicates only (no issuer, TEL or KEL). */
function matchSelfAsserted(r: HasCredential, attributes: unknown, now: Date): Result<true, EvidenceFailure[]> {
  const failures: Failures = [];
  const attrs = isRecord(attributes) ? attributes : undefined;
  if (!attrs || !SchemaOps.validate(r.credential.schema, attrs).valid) push(failures, 'claims-invalid');
  failures.push(...predicateFailures(r, attrs, now));
  if (r.holder.type !== 'subject') push(failures, 'holder-mismatch', 'self-asserted requires holder subject');
  return failures.length === 0 ? ok(true) : err(failures);
}

/** The one requirement leaf walker: every leaf with its name path (`[]` for a root leaf), in declaration order. */
function leaves(r: Requirement, path: string[] = []): { path: string[]; leaf: HasCredential | IsMember }[] {
  switch (r.type) {
    case 'is-member':
    case 'has-credential':
      return [{ path, leaf: r }];
    case 'and':
    case 'or':
      return Object.entries(r.requirements).flatMap(([key, child]) => leaves(child, [...path, key]));
    default: {
      const unknownRequirement: never = r;
      throw new Error(`Unsupported requirement: ${JSON.stringify(unknownRequirement)}`);
    }
  }
}

export const RequirementOps = { validate, matchCredential, matchSelfAsserted, leaves } as const;

export const PolicyOps = {
  validate(p: Policy): Result<Policy, RequirementError> {
    if (!Value.Check(PolicySchema, p)) return fail('invalid-shape', []);
    const v = validate(p.requirement);
    if (!v.ok) return v;
    return p.d === PolicyData.digest(p.requirement, p.purpose, p.onboarding) ? ok(p) : fail('said-mismatch', ['d']);
  },
} as const;
