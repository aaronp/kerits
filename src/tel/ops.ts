import { Value } from '@sinclair/typebox/value';
import type { AID } from '../common/types.js';
import { TELData } from './tel-data.js';
import {
  BisEventSchema,
  BrvEventSchema,
  IssEventSchema,
  RevEventSchema,
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

  // Sequence is a valid non-negative integer
  const sn = parseInt(event.s, 10);
  if (Number.isNaN(sn) || sn < 0) {
    errors.push({ field: 's', message: 'sequence must be a non-negative integer string' });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Validate that candidate can be appended to the existing chain.
 *
 * Invariants:
 * - s === existing.length (zero-based, contiguous, append-only)
 * - Events with `p` (VRT, REV, BRV) must link to prior event's SAID
 * - Events without `p` (VCP, ISS, BIS) are inception-like at their position
 * - Exactly one VCP at sequence 0; additional VCP events are invalid
 * - VRT requires a prior VCP in the chain
 * - ISS/REV require a non-empty ri field
 * - Registry ID consistency: VCP/VRT use `i`, ISS/REV use `ri`, BIS/BRV use `ra.i`
 * - No duplicate SAIDs
 */
function validateAppend(existing: TelEvent[], candidate: TelEvent): TelValidationResult {
  const errors: TelValidationError[] = [];

  // Structural validation first
  const structural = validateEvent(candidate);
  if (!structural.ok) return structural;

  const expectedSeq = existing.length;
  const candidateSeq = parseInt(candidate.s, 10);

  // Sequence contiguity
  if (candidateSeq !== expectedSeq) {
    errors.push({
      field: 's',
      message: `expected sequence ${expectedSeq}, got ${candidateSeq}`,
    });
  }

  // VCP only at sequence 0
  if (TELData.isVcp(candidate) && expectedSeq !== 0) {
    errors.push({
      field: 't',
      message: 'VCP is only valid at sequence 0',
    });
  }

  // Non-VCP requires existing VCP
  if (!TELData.isVcp(candidate) && existing.length === 0) {
    errors.push({
      field: 't',
      message: 'first event must be VCP',
    });
  }

  // VRT requires prior VCP (registry rotation needs an inception)
  if (TELData.isVrt(candidate)) {
    const hasVcp = existing.some((e) => TELData.isVcp(e));
    if (!hasVcp) {
      errors.push({
        field: 't',
        message: 'VRT requires a prior VCP in the chain',
      });
    }
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
    errors.push({
      field: 'ri',
      message: 'ISS/REV require a non-empty ri field',
    });
  }

  // Registry ID consistency: all events must reference the same registry
  if (existing.length > 0) {
    const vcpRegistryId = existing[0]!.i; // VCP's `i` is the registry SAID
    const candidateRegistryId = TELData.registryId(candidate);
    if (candidateRegistryId !== vcpRegistryId) {
      errors.push({
        field: 'i',
        message: `registry ID mismatch: expected ${vcpRegistryId}, got ${candidateRegistryId}`,
      });
    }
  }

  // Duplicate SAID check
  const existingSaids = new Set(existing.map((e) => e.d));
  if (existingSaids.has(candidate.d)) {
    errors.push({
      field: 'd',
      message: `duplicate SAID: ${candidate.d}`,
    });
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

/**
 * Validate full chain integrity by cumulatively applying validateAppend.
 */
function validateChain(entries: TelEvent[]): TelValidationResult {
  for (let i = 0; i < entries.length; i++) {
    const existing = entries.slice(0, i);
    const candidate = entries[i]!;
    const result = validateAppend(existing, candidate);
    if (!result.ok) return result;
  }
  return { ok: true };
}

export type { TelValidationError, TelValidationResult };

export const TELOps = {
  head,
  issuerId,
  credentialStatus,
  validateEvent,
  validateAppend,
  validateChain,
} as const;
