import type { DerivationSurface } from '../common/derivation-surface.js';
import { deriveSaid } from '../common/derivation-surface.js';
import type { SAID } from '../common/types.js';
import type {
  BisEvent,
  BrvEvent,
  EstablishmentTelEvent,
  IssEvent,
  RevEvent,
  RSN,
  TelEvent,
  VcpEvent,
  VrtEvent,
} from './types.js';

// ── Type guards ─────────────────────────────────────────────────────

function isVcp(e: TelEvent): e is VcpEvent {
  return e.t === 'vcp';
}

function isVrt(e: TelEvent): e is VrtEvent {
  return e.t === 'vrt';
}

function isIss(e: TelEvent): e is IssEvent {
  return e.t === 'iss';
}

function isRev(e: TelEvent): e is RevEvent {
  return e.t === 'rev';
}

function isBis(e: TelEvent): e is BisEvent {
  return e.t === 'bis';
}

function isBrv(e: TelEvent): e is BrvEvent {
  return e.t === 'brv';
}

function isEstablishment(e: TelEvent): e is EstablishmentTelEvent {
  return isVcp(e) || isVrt(e);
}

// ── Accessors ───────────────────────────────────────────────────────

/**
 * Return the backer list from an establishment event or current RSN state.
 * VCP has `b` directly. VRT applies `br`/`ba` against prior state (use RSN).
 * Non-establishment events defer to the RSN.
 */
function backerList(event: TelEvent, rsn?: RSN): string[] {
  if (isVcp(event)) return event.b;
  if (rsn) return rsn.b;
  return [];
}

/**
 * Resolve backer threshold as a simple integer.
 * Only parses simple (string) thresholds. Weighted thresholds (string[][])
 * are not supported in TEL context — returns 0 for those.
 */
function backerThreshold(event: TelEvent, rsn?: RSN): number {
  let raw: string | string[][] | undefined;
  if (isVcp(event) || isVrt(event)) {
    raw = event.bt;
  } else if (rsn) {
    raw = rsn.bt;
  }
  if (typeof raw !== 'string') return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Return the prior event SAID (`p` field) if present.
 * Events with `p`: VRT, REV, BRV.
 * Events without `p`: VCP, ISS, BIS.
 */
function priorSaid(event: TelEvent): string | undefined {
  if (isVrt(event) || isRev(event) || isBrv(event)) return event.p;
  return undefined;
}

/**
 * Return the credential SAID from an issuance/revocation event.
 * For ISS/REV/BIS/BRV, the `i` field is the credential SAID.
 * For VCP/VRT, `i` is the registry SAID (not a credential).
 */
function credentialId(event: TelEvent): string | undefined {
  if (isIss(event) || isRev(event) || isBis(event) || isBrv(event)) return event.i;
  return undefined;
}

/**
 * Return the registry identifier for a TEL event.
 * - VCP/VRT: registry SAID is in `i`
 * - ISS/REV: registry SAID is in `ri`
 * - BIS/BRV: registry SAID is in `ra.i`
 */
function registryId(event: TelEvent): string {
  if (isVcp(event) || isVrt(event)) return event.i;
  if (isIss(event) || isRev(event)) return event.ri;
  if (isBis(event) || isBrv(event)) return event.ra.i;
  return (event as TelEvent).i;
}

function sequenceNumber(event: TelEvent): number {
  return parseInt(event.s, 10);
}

// ── RSN derivation ──────────────────────────────────────────────────

/**
 * Build RSN from a pre-validated TEL chain.
 *
 * - Returns undefined if entries is empty or VCP.i does not match rid.
 * - Walks entries forward, accumulating backer state from VCP and VRT.
 * - VRT applies backer changes: `br` (remove) then `ba` (add).
 */
function fromTEL(rid: SAID, entries: TelEvent[]): RSN | undefined {
  if (entries.length === 0) return undefined;

  // Verify VCP registry ID matches rid
  const first = entries[0];
  if (!first || !isVcp(first) || first.i !== rid) return undefined;

  let bt: string = '1';
  let b: string[] = [];
  let c: string[] = [];

  let _headSaid = '';
  let headSeq = '0';
  let headEt: RSN['et'] = 'vcp';

  for (const evt of entries) {
    _headSaid = evt.d;
    headEt = evt.t as RSN['et'];
    if ('s' in evt && typeof evt.s === 'string') {
      headSeq = evt.s;
    }

    if (isVcp(evt)) {
      bt = evt.bt as string;
      b = [...evt.b];
      c = evt.c ?? [];
    } else if (isVrt(evt)) {
      bt = evt.bt as string;
      // Apply backer removals then additions
      const removeSet = new Set(evt.br);
      b = b.filter((aid) => !removeSet.has(aid));
      for (const aid of evt.ba) {
        if (!b.includes(aid)) {
          b.push(aid);
        }
      }
    }
  }

  const rsnBody: Record<string, unknown> = {
    v: '',
    i: rid,
    s: headSeq,
    d: '',
    et: headEt,
    bt,
    b,
    c,
  };

  const RSN_SURFACE: DerivationSurface = {
    saidField: 'd',
    derivedFieldsInOrder: ['v', 'i', 's', 'd', 'et', 'bt', 'b', 'c'],
    hasVersionString: true,
    versionStringField: 'v',
    protocol: 'KERI',
  };

  const { sealed } = deriveSaid(rsnBody, RSN_SURFACE);
  return sealed as RSN;
}

// ── Namespace export ────────────────────────────────────────────────

export const TELData = {
  isVcp,
  isVrt,
  isIss,
  isRev,
  isBis,
  isBrv,
  isEstablishment,
  backerList,
  backerThreshold,
  priorSaid,
  credentialId,
  registryId,
  sequenceNumber,
  fromTEL,
} as const;
