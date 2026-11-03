import { ACDCOps } from '../acdc/ops.js';
import type { AID } from '../common/types.js';
import { validateDelegation } from '../kel/delegation-validation.js';
import { anchoredPrefix, assessTelKelAnchor } from '../kel/tel-kel-anchor.js';
import type { CESREvent } from '../kel/types.js';
import { validateKelChain } from '../kel/validation.js';
import { err, ok, type Result } from '../result.js';
import { TELEvents } from '../tel/events.js';
import { TELOps } from '../tel/ops.js';
import { CredentialEligibility } from './credential-eligibility.js';
import { delegatorOf, validateKelWithAncestors } from './kel-ancestry.js';
import { PolicyOps, RequirementOps } from './requirement-ops.js';
import {
  type EvidenceFailure,
  type Expression,
  type ExpressionEvidence,
  type HasCredential,
  type HasCredentialEvidence,
  type IsMemberEvidence,
  MAX_REQUIREMENT_DEPTH,
  type Requirement,
  type ResolvedEvidence,
  type ResolvedProofBundle,
} from './types.js';

type Failures = EvidenceFailure[];
const failure = (path: string[], kind: EvidenceFailure['kind'], detail?: string): EvidenceFailure =>
  detail === undefined ? { path, kind } : { path, kind, detail };

/** Shared by is-member and has-credential holder checks. */
export function verifyMembership(
  parentAID: AID,
  maxDepth: number,
  subject: AID,
  e: IsMemberEvidence,
  path: string[],
): Failures {
  const { lineage, kels } = e;
  const out: Failures = [];
  if (lineage.length < 2 || lineage[0] !== parentAID || new Set(lineage).size !== lineage.length) {
    out.push(failure(path, 'lineage-mismatch'));
  }
  if (lineage[lineage.length - 1] !== subject) out.push(failure(path, 'subject-mismatch'));
  if (lineage.length - 1 > maxDepth)
    out.push(failure(path, 'max-depth-exceeded', `${lineage.length - 1} > ${maxDepth}`));
  if (out.length > 0) return out;

  for (const aid of lineage) {
    const kel: unknown = Object.hasOwn(kels, aid) ? kels[aid] : undefined;
    if (!Array.isArray(kel) || kel.length === 0) out.push(failure(path, 'kel-missing', aid));
  }
  if (out.length > 0) return out;

  // each KEL must actually be the KEL of the AID it is filed under
  for (const aid of lineage) {
    const actual = (kels[aid]![0] as { event?: { i?: unknown } } | undefined)?.event?.i;
    if (actual !== aid) return [failure(path, 'kel-invalid', `${aid}: KEL belongs to ${String(actual)}`)];
  }

  try {
    return verifyLineageKels(lineage, kels, path);
  } catch (error) {
    return [failure(path, 'kel-invalid', error instanceof Error ? error.message : String(error))];
  }
}

function verifyLineageKels(lineage: AID[], kels: Record<string, CESREvent[]>, path: string[]): Failures {
  const out: Failures = [];
  if (!validateKelWithAncestors(lineage[0]!, kels)) return [failure(path, 'kel-invalid', lineage[0])];

  for (let i = 1; i < lineage.length; i++) {
    const parent = lineage[i - 1]!;
    const child = lineage[i]!;
    const childKel = kels[child]!;
    const parentKel = kels[parent]!;
    if (delegatorOf(childKel) !== parent) {
      out.push(failure(path, 'lineage-mismatch', `${child} is not delegated by ${parent}`));
      continue;
    }
    // distinguish "parent never sealed this delegation" from "child KEL is broken"
    const sealed = childKel.every((ev) => {
      const t = (ev.event as { t?: string }).t;
      return (
        (t !== 'dip' && t !== 'drt') || validateDelegation({ childEvent: ev, parentKel, delegatorAid: parent }).passed
      );
    });
    if (!sealed) out.push(failure(path, 'delegation-unsealed', child));
    else if (!validateKelChain(childKel, { parentKel }).valid) out.push(failure(path, 'kel-invalid', child));
  }
  return out;
}

const msg = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Issuer KEL must exist, be filed under its own AID, and validate. Returns the KEL or failures. */
function issuerKelOf(
  e: HasCredentialEvidence,
  issuerAid: AID,
  path: string[],
): { kel: CESREvent[] } | { failures: Failures } {
  const kel: unknown = Object.hasOwn(e.kels, issuerAid) ? e.kels[issuerAid] : undefined;
  if (!Array.isArray(kel) || kel.length === 0) return { failures: [failure(path, 'kel-missing', issuerAid)] };
  const actual = (kel[0] as { event?: { i?: unknown } } | undefined)?.event?.i;
  if (actual !== issuerAid)
    return { failures: [failure(path, 'kel-invalid', `${issuerAid}: KEL belongs to ${String(actual)}`)] };
  return validateKelWithAncestors(issuerAid, e.kels)
    ? { kel: kel as CESREvent[] }
    : { failures: [failure(path, 'kel-invalid', issuerAid)] };
}

/** A TEL event's `d` must equal the SAID recomputed from its body (anchors seal `d` only). */
function telSaidHolds(ev: { d: string }, isInception: boolean): boolean {
  return TELEvents.computeSaid({ ...ev }, isInception).said === ev.d;
}

function verifyTelLinkage(
  acdc: HasCredentialEvidence['acdc'],
  registryTel: HasCredentialEvidence['registryTel'],
  credentialTel: HasCredentialEvidence['credentialTel'],
  path: string[],
): Failures {
  try {
    const registry = registryTel[0]!;
    const iss = credentialTel[0]!;
    if (registry.t !== 'vcp' || iss.t !== 'iss')
      return [failure(path, 'tel-mismatch', 'TEL must start with vcp (registry) and iss (credential)')];
    const linked = iss.i === acdc.d && iss.ri === registry.i && registry.i === acdc.ri && registry.ii === acdc.i;
    if (!linked) return [failure(path, 'tel-mismatch')];
    const saidsHold =
      registryTel.every((ev) => telSaidHolds(ev, ev.t === 'vcp') && (ev.t !== 'vcp' || ev.i === ev.d)) &&
      credentialTel.every((ev) => telSaidHolds(ev, false));
    return saidsHold ? [] : [failure(path, 'tel-mismatch', 'TEL event SAID does not match its body')];
  } catch (error) {
    return [failure(path, 'tel-mismatch', msg(error))];
  }
}

const isBacked = (ev: { t: string }) => ev.t === 'bis' || ev.t === 'brv';

/** Both TEL lanes: backers unsupported, chain validity, and linkage to the ACDC. */
function verifyTels(
  acdc: HasCredentialEvidence['acdc'],
  registryTel: HasCredentialEvidence['registryTel'],
  credentialTel: HasCredentialEvidence['credentialTel'],
  path: string[],
): Failures {
  if (
    !Array.isArray(registryTel) ||
    registryTel.length === 0 ||
    !Array.isArray(credentialTel) ||
    credentialTel.length === 0
  )
    return [failure(path, 'tel-mismatch', 'registryTel and credentialTel must be non-empty arrays')];
  // TODO - backers not supported: never silently accept bis/brv
  if ([...registryTel, ...credentialTel].some(isBacked))
    return [failure(path, 'backers-unsupported', 'TODO - backers not supported')];
  for (const [events, scope] of [
    [registryTel, 'registry'],
    [credentialTel, 'credential'],
  ] as const) {
    const chain = TELOps.validateChain(events, scope);
    if (!chain.ok)
      return [
        failure(
          path,
          'tel-mismatch',
          `${scope} TEL: ${chain.errors.map((e) => `${e.field}: ${e.message}`).join('; ')}`,
        ),
      ];
  }
  return verifyTelLinkage(acdc, registryTel, credentialTel, path);
}

function sealsOf(ev: CESREvent['event']): { i?: unknown; d?: unknown }[] {
  const a = (ev as { a?: unknown }).a;
  return Array.isArray(a)
    ? a.filter((x): x is { i?: unknown; d?: unknown } => typeof x === 'object' && x !== null)
    : [];
}

function verifyCredential(
  r: HasCredential,
  subject: AID,
  e: HasCredentialEvidence,
  now: Date,
  path: string[],
): Failures {
  const { acdc } = e;
  const issuerAid = acdc.i as AID;
  const issuerKel = issuerKelOf(e, issuerAid, path);
  if ('failures' in issuerKel) return issuerKel.failures;
  const out: Failures = [];

  try {
    if (!ACDCOps.validateSaid(acdc).valid) out.push(failure(path, 'acdc-said-invalid'));
  } catch (error) {
    out.push(failure(path, 'acdc-said-invalid', msg(error)));
  }
  const match = RequirementOps.matchCredential(r, acdc, subject, now);
  if (!match.ok) out.push(...match.error.map((f) => ({ ...f, path })));

  const telFailures = verifyTels(acdc, e.registryTel, e.credentialTel, path);
  out.push(...telFailures);
  if (telFailures.length === 0) {
    // anchor before status: every event in both lanes must be sealed in the issuer KEL,
    // and status reads only the anchored prefix — an unanchored rev is tel-unanchored, never revoked
    const bodies = issuerKel.kel.map((ev) => ev.event);
    for (const { d: telSaid } of [...e.registryTel, ...e.credentialTel]) {
      if (assessTelKelAnchor(bodies, telSaid).status !== 'anchored') out.push(failure(path, 'tel-unanchored', telSaid));
    }
    if (TELOps.credentialStatus(anchoredPrefix(e.credentialTel, bodies), acdc.d) === 'revoked')
      out.push(failure(path, 'revoked'));
    // a credential-TEL event sealed in the issuer KEL but absent from the TEL is a dropped rev (iss is present)
    const inTel = new Set<unknown>(e.credentialTel.map((ev) => ev.d));
    const dropped = bodies.flatMap(sealsOf).find((seal) => seal.i === acdc.d && !inTel.has(seal.d));
    if (dropped) out.push(failure(path, 'revoked', `${dropped.d} sealed in issuer KEL, absent from credentialTel`));
  }

  switch (r.holder.type) {
    case 'subject':
      break;
    case 'holder-is-member':
    case 'member-of-holder':
      if (!e.membership) out.push(failure(path, 'membership-missing'));
      else
        out.push(
          ...verifyMembership(
            r.holder.parentAID,
            r.holder.maxDepth ?? MAX_REQUIREMENT_DEPTH,
            subject,
            e.membership,
            path,
          ),
        );
      break;
    default: {
      const unknownHolder: never = r.holder;
      out.push(failure(path, 'type-mismatch', `unknown holder ${JSON.stringify(unknownHolder)}`));
    }
  }
  return out;
}

/** Self-asserted values: schema + predicates, and no required ACDC-only metadata. */
function verifySelfAsserted(r: HasCredential, attributes: unknown, now: Date, path: string[]): Failures {
  const match = RequirementOps.matchSelfAsserted(r, attributes, now);
  const out: Failures = match.ok ? [] : match.error.map((f) => ({ ...f, path }));
  const eligible = CredentialEligibility.forSelfAsserted(r);
  if (!eligible.ok) out.push(...eligible.required.map((field) => failure(path, 'metadata-unavailable', field)));
  return out;
}

/** Pairs the requirement's issuer variant with the evidence variant it accepts. */
function verifyHasCredential(r: HasCredential, subject: AID, e: ResolvedEvidence, now: Date, path: string[]): Failures {
  const issuer = r.issuer.type;
  switch (issuer) {
    case 'any-of':
      if (e.type === 'has-credential') return verifyCredential(r, subject, e, now, path);
      if (e.type === 'self-asserted') return [failure(path, 'self-asserted-not-allowed')];
      return [failure(path, 'type-mismatch', `expected has-credential, got ${e.type}`)];
    case 'any':
      if (e.type === 'has-credential') return verifyCredential(r, subject, e, now, path);
      // a non-subject holder can only be met by an ACDC (self-asserted fails holder-mismatch)
      if (e.type === 'self-asserted') return verifySelfAsserted(r, e.attributes, now, path);
      return [failure(path, 'type-mismatch', `expected has-credential or self-asserted, got ${e.type}`)];
    case 'self-asserted':
      if (e.type !== 'self-asserted') return [failure(path, 'type-mismatch', `expected self-asserted, got ${e.type}`)];
      return verifySelfAsserted(r, e.attributes, now, path);
    default: {
      const unknownIssuer: never = issuer;
      return [failure(path, 'type-mismatch', `unknown issuer ${JSON.stringify(unknownIssuer)}`)];
    }
  }
}

function verifyExpression(
  r: Expression,
  subject: AID,
  e: ExpressionEvidence,
  now: Date,
  path: string[],
  depth: number,
): Failures {
  const out: Failures = [];
  const required = Object.keys(r.requirements);
  const supplied = Object.keys(e.evidence);
  // hasOwn: prototype keys like "constructor" must not count as children
  const isChild = (k: string) => Object.hasOwn(r.requirements, k);
  for (const key of supplied) {
    if (!isChild(key)) out.push(failure([...path, key], 'unexpected-evidence'));
  }
  if (r.type === 'and') {
    const missing = required.filter((k) => !Object.hasOwn(e.evidence, k));
    if (missing.length > 0) out.push(failure(path, 'and-incomplete', missing.join(',')));
  } else if (!supplied.some(isChild)) {
    out.push(failure(path, 'or-empty'));
  }
  for (const key of supplied.filter(isChild)) {
    out.push(...verifyAt(r.requirements[key]!, subject, e.evidence[key]!, now, [...path, key], depth + 1));
  }
  return out;
}

export function verifyAt(
  r: Requirement,
  subject: AID,
  e: ResolvedEvidence,
  now: Date,
  path: string[],
  depth: number,
): Failures {
  if (depth > MAX_REQUIREMENT_DEPTH) return [failure(path, 'type-mismatch', 'too deep')];
  switch (r.type) {
    case 'is-member':
      return e.type === 'is-member'
        ? verifyMembership(r.parentAID, r.maxDepth ?? MAX_REQUIREMENT_DEPTH, subject, e, path)
        : [failure(path, 'type-mismatch', `expected is-member, got ${e.type}`)];
    case 'has-credential':
      return verifyHasCredential(r, subject, e, now, path);
    case 'and':
    case 'or':
      return e.type === r.type
        ? verifyExpression(r, subject, e, now, path, depth)
        : [failure(path, 'type-mismatch', `expected ${r.type}, got ${e.type}`)];
    default: {
      const unknownRequirement: never = r;
      return [failure(path, 'type-mismatch', `unknown requirement ${JSON.stringify(unknownRequirement)}`)];
    }
  }
}

export const EvidenceOps = {
  verify(r: Requirement, subject: AID, e: ResolvedEvidence, now: Date): Result<true, EvidenceFailure[]> {
    // untrusted input: any structural absence that slips past the checks becomes a failure, never a throw
    try {
      const failures = verifyAt(r, subject, e, now, [], 1);
      return failures.length === 0 ? ok(true) : err(failures);
    } catch (error) {
      return err([failure([], 'type-mismatch', `malformed evidence: ${msg(error)}`)]);
    }
  },
} as const;

export const ProofBundleOps = {
  verify(b: ResolvedProofBundle, now: Date): Result<true, EvidenceFailure[]> {
    const policy = PolicyOps.validate(b.policy);
    if (!policy.ok)
      return err([
        failure(
          policy.error.path,
          policy.error.kind === 'said-mismatch' ? 'said-mismatch' : 'type-mismatch',
          policy.error.detail,
        ),
      ]);
    return EvidenceOps.verify(b.policy.requirement, b.subject, b.evidence, now);
  },
} as const;
