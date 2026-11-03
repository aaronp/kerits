import { Value } from '@sinclair/typebox/value';
import { type AID, SequenceNumber } from '../common/types.js';
import { TELData } from './tel-data.js';
import {
  BisEventSchema,
  BrvEventSchema,
  IssEventSchema,
  RevEventSchema,
  type TELScope,
  type TelEvent,
  VcpEventSchema,
  VrtEventSchema,
} from './types.js';

type TelValidationError = { field: string; message: string };
type TelValidationResult = { ok: true } | { ok: false; errors: TelValidationError[] };

/**
 * Return the last event in the chain, or undefined if empty.
 */
function head(entries: TelEvent[]): TelEvent | undefined {
  return entries.length > 0 ? entries[entries.length - 1] : undefined;
}

/**
 * Return the issuer AID from the VCP at sequence 0, or from a BIS event's `ii`.
 * Assumes pre-validated chain (validateChain).
 */
function issuerId(entries: TelEvent[]): AID | undefined {
  if (entries.length === 0) return undefined;
  const first = entries[0];
  if (first && TELData.isVcp(first) && first.s === '0') {
    return first.ii as AID;
  }
  return undefined;
}

/**
 * Best-effort credential status projection over observed TEL events.
 * Scans for ISS/BIS (issuance) and REV/BRV (revocation) events where the
 * credential SAID (`i` field on credential events) matches credSaid.
 * Last matching event wins.
 *
 * Note: For ISS/REV/BIS/BRV, the `i` field holds the credential SAID.
 * For VCP/VRT, `i` is the registry SAID — those are skipped here.
 */
function credentialStatus(entries: TelEvent[], credSaid: string): 'issued' | 'revoked' | 'unknown' {
  let status: 'issued' | 'revoked' | 'unknown' = 'unknown';
  for (const evt of entries) {
    if ((TELData.isIss(evt) || TELData.isBis(evt)) && evt.i === credSaid) {
      status = 'issued';
    } else if ((TELData.isRev(evt) || TELData.isBrv(evt)) && evt.i === credSaid) {
      status = 'revoked';
    }
  }
  return status;
}

const schemaByType: Record<string, import('@sinclair/typebox').TSchema> = {
  vcp: VcpEventSchema,
  vrt: VrtEventSchema,
  iss: IssEventSchema,
  rev: RevEventSchema,
  bis: BisEventSchema,
  brv: BrvEventSchema,
};

/**
 * Validate structural correctness of a single TEL event.
 * Delegates structural field validation to the TypeBox schema for the event's `t` value,
 * then applies additional semantic checks (sequence parsing).
 *
 * Note: does not verify SAID derivation (would require knowing the serialization format).
 * SAID format is validated by the TypeBox schema's CesrDigestSchema constraint.
 */
function validateEvent(event: TelEvent): TelValidationResult {
  const errors: TelValidationError[] = [];

  // Delegate structural validation to TypeBox schema
  const schema = schemaByType[event.t];
  if (!schema) {
    errors.push({ field: 't', message: `unknown event type: ${event.t}` });
    return { ok: false, errors };
  }

  // Filter out "Unknown format" errors: CESR format validators (qb64, qb64-digest, etc.)
  // are not registered in the core package (browser-safe, no runtime registrations).
  // Format constraints in schemas serve as annotations; enforcement happens at parse boundaries.
  const typeboxErrors = [...Value.Errors(schema, event)].filter((e) => !e.message.startsWith('Unknown format'));
  if (typeboxErrors.length > 0) {
    for (const err of typeboxErrors) {
      errors.push({ field: err.path.replace(/^\//, '') || err.path, message: err.message });
    }
    return { ok: false, errors };
  }

  // Semantic checks beyond schema: CESR format validators are not registered in core,
  // so empty SAID/registry ID strings must be caught manually.
  if (!event.d) {
    errors.push({ field: 'd', message: 'missing or empty SAID' });
  }
  if (!event.i) {
    errors.push({ field: 'i', message: 'missing or empty identifier' });
  }

  // Sequence is keripy hex
  const sn = SequenceNumber.parse(event.s);
  if (!sn.ok) {
    errors.push({ field: 's', message: `sequence must be a hex string: ${sn.error.message}` });
  } else {
    /* well formed */
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Validate that candidate can be appended to the existing chain.
 *
 * scope='registry' (default): VCP genesis, VRT allowed, ISS/REV/BIS/BRV allowed after VCP.
 * scope='credential': ISS genesis at sn=0, REV at sn=1 (terminal); VCP/VRT/BIS/BRV rejected.
 *
 * Invariants (both scopes):
 * - s === existing.length (zero-based, contiguous, append-only)
 * - Events with `p` (VRT, REV, BRV) must link to prior event's SAID
 * - ISS/REV require a non-empty ri field
 * - Registry ID consistency across all events in chain
 * - No duplicate SAIDs
 */
function validateAppend(existing: TelEvent[], candidate: TelEvent, scope: TELScope = 'registry'): TelValidationResult {
  const errors: TelValidationError[] = [];

  // Structural validation first
  const structural = validateEvent(candidate);
  if (!structural.ok) return structural;

  const expectedSeq = existing.length;
  const candidateSeq = SequenceNumber.of(candidate.s); // structural validation above parsed it

  // Sequence contiguity
  if (candidateSeq !== expectedSeq) {
    errors.push({
      field: 's',
      message: `expected sequence ${expectedSeq}, got ${candidateSeq}`,
    });
  }

  if (scope === 'registry') {
    // VCP only at sequence 0
    if (TELData.isVcp(candidate) && expectedSeq !== 0) {
      errors.push({ field: 't', message: 'VCP is only valid at sequence 0' });
    }

    // Non-VCP requires existing VCP
    if (!TELData.isVcp(candidate) && existing.length === 0) {
      errors.push({ field: 't', message: 'first event must be VCP' });
    }

    // VRT requires prior VCP (registry rotation needs an inception)
    if (TELData.isVrt(candidate)) {
      const hasVcp = existing.some((e) => TELData.isVcp(e));
      if (!hasVcp) {
        errors.push({ field: 't', message: 'VRT requires a prior VCP in the chain' });
      }
    }
  } else if (scope === 'credential') {
    // Only ISS and REV are valid in a credential TEL
    if (!TELData.isIss(candidate) && !TELData.isRev(candidate)) {
      errors.push({ field: 't', message: `event type '${candidate.t}' is not allowed in a credential TEL` });
    }

    // ISS must be genesis
    if (!TELData.isIss(candidate) && existing.length === 0) {
      errors.push({ field: 't', message: 'first event in a credential TEL must be ISS' });
    }

    // REV is terminal — reject any append after a REV exists
    if (existing.some((e) => TELData.isRev(e))) {
      errors.push({ field: 't', message: 'credential TEL is terminal: REV has already been appended' });
    }
  } else {
    const _exhaustive: never = scope;
    throw new Error(`Unsupported TELScope: ${_exhaustive}`);
  }

  // Prior SAID linkage: only events with `p` field (VRT, REV, BRV)
  const prior = existing.length > 0 ? existing[existing.length - 1] : undefined;
  if (prior && (TELData.isVrt(candidate) || TELData.isRev(candidate) || TELData.isBrv(candidate))) {
    if (candidate.p !== prior.d) {
      errors.push({
        field: 'p',
        message: `prior SAID mismatch: expected ${prior.d}, got ${candidate.p}`,
      });
    }
  }

  // ISS/REV require non-empty ri
  if ((TELData.isIss(candidate) || TELData.isRev(candidate)) && !candidate.ri) {
    errors.push({ field: 'ri', message: 'ISS/REV require a non-empty ri field' });
  }

  // Registry ID consistency: all events must reference the same registry.
  // In registry scope the anchor is existing[0].i (VCP's registry SAID).
  // In credential scope the anchor is existing[0]'s registryId (ISS.ri).
  if (existing.length > 0) {
    const anchorRegistryId = TELData.registryId(existing[0]!);
    const candidateRegistryId = TELData.registryId(candidate);
    if (candidateRegistryId !== anchorRegistryId) {
      errors.push({
        field: 'i',
        message: `registry ID mismatch: expected ${anchorRegistryId}, got ${candidateRegistryId}`,
      });
    }
  }

  // Duplicate SAID check
  const existingSaids = new Set(existing.map((e) => e.d));
  if (existingSaids.has(candidate.d)) {
    errors.push({ field: 'd', message: `duplicate SAID: ${candidate.d}` });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Validate full chain integrity by cumulatively applying validateAppend.
 * Pass scope='credential' for ISS/REV status TELs (ISS genesis at sn=0).
 */
function validateChain(entries: TelEvent[], scope: TELScope = 'registry'): TelValidationResult {
  for (let i = 0; i < entries.length; i++) {
    const existing = entries.slice(0, i);
    const candidate = entries[i]!;
    const result = validateAppend(existing, candidate, scope);
    if (!result.ok) return result;
  }
  return { ok: true };
}

/**
 * Split a mixed proof/sync TEL bag into registry events and per-credential status TELs.
 * Dual-TEL: VCP/VRT live on the management TEL; ISS/REV/BIS/BRV on credential TELs.
 */
function partitionByScope(entries: readonly TelEvent[]): {
  readonly registry: TelEvent[];
  readonly byCredential: ReadonlyMap<string, TelEvent[]>;
} {
  const registry: TelEvent[] = [];
  const byCredential = new Map<string, TelEvent[]>();
  for (const event of entries) {
    if (TELData.isVcp(event) || TELData.isVrt(event)) {
      registry.push(event);
      continue;
    }
    const credSaid = TELData.credentialId(event);
    if (!credSaid) continue;
    const list = byCredential.get(credSaid) ?? [];
    list.push(event);
    byCredential.set(credSaid, list);
  }
  return { registry, byCredential };
}

/** One lane of a registry aggregate: the registry's own events, or one credential's. */
export type TelLane =
  | { readonly kind: 'registry'; readonly ri: string }
  | { readonly kind: 'credential'; readonly said: string };

/** The events of `entries` in `lane`: vcp/vrt with `i === ri`, or the events whose credential id is `said`. Pure. */
function lane(entries: readonly TelEvent[], l: TelLane): TelEvent[] {
  switch (l.kind) {
    case 'registry':
      return entries.filter((e) => (TELData.isVcp(e) || TELData.isVrt(e)) && e.i === l.ri);
    case 'credential':
      return entries.filter((e) => !TELData.isVcp(e) && !TELData.isVrt(e) && TELData.credentialId(e) === l.said);
    default: {
      const unknownLane: never = l;
      throw new Error(`Unsupported TEL lane: ${JSON.stringify(unknownLane)}`);
    }
  }
}

export type { TelValidationError, TelValidationResult };

export const TELOps = {
  head,
  issuerId,
  credentialStatus,
  validateEvent,
  validateAppend,
  validateChain,
  partitionByScope,
  lane,
} as const;
