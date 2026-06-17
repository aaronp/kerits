import type { AID, SAID } from '../common/types.js';
import type { ProfileAlias } from './profile-alias.js';

/**
 * Well-known prefix for all canonical KERI paths.
 * All OOBI/KERI endpoints live under this prefix.
 */
export const KERI_PREFIX = '/.well-known/keri';

/**
 * Canonical URL path strings for kerits-published KERI artifacts.
 *
 * These are URL paths only — not storage keys. Each server backend
 * maps these paths to its own internal storage keys independently.
 *
 * TEL paths:
 * - `telEvent(said)` — immutable per-SAID individual TEL event (VCP, ISS, REV, etc.)
 * - `tel(rid)` — mutable full-history aggregate (`TelEvent[]`) for a registry, overwritten on each publish
 * - `rsn(rid)` — mutable registry state notice (derived from the TEL chain)
 */
export const CanonicalPaths = {
  kel: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/kel`,
  ksn: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/ksn`,
  aidManifest: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/manifest`,
  oobi: (aid: AID) => `${KERI_PREFIX}/oobi/${aid}`,
  schema: (said: SAID) => `${KERI_PREFIX}/said/${said}/schema`,
  acdc: (said: SAID) => `${KERI_PREFIX}/said/${said}/acdc`,
  /** Full-history TEL aggregate for a registry — mutable, stores `TelEvent[]`. */
  tel: (rid: SAID) => `${KERI_PREFIX}/registry/${rid}/tel`,
  rsn: (rid: SAID) => `${KERI_PREFIX}/registry/${rid}/rsn`,
  event: (said: SAID) => `${KERI_PREFIX}/events/${said}/event`,
  receipts: (said: SAID) => `${KERI_PREFIX}/events/${said}/receipts`,
  /** Individual TEL event by SAID — immutable, stores a single `TelEvent`. */
  telEvent: (said: SAID) => `${KERI_PREFIX}/tel/${said}/event`,
  profile: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/profile`,
  credentialMetadata: (aid: AID, schemaSaid: SAID) => `${KERI_PREFIX}/aid/${aid}/credential-metadata/${schemaSaid}`,
  aliasProfile: (alias: ProfileAlias) => `${KERI_PREFIX}/alias/${alias}/profile`,
  fullUrl: (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/, '')}${path}`,
  /** Strips the `/.well-known/keri/...` suffix from a manifest (or any canonical) URL to recover the base URL. */
  baseUrlFromManifest: (manifestUrl: string) => manifestUrl.replace(/\/\.well-known\/keri\/.*$/, ''),
  /** Derives all canonical URLs for an AID from a manifest URL. */
  resolveAidUrls: (manifestUrl: string, aid: AID) => {
    const base = manifestUrl.replace(/\/\.well-known\/keri\/.*$/, '');
    return {
      profileUrl: `${base}${CanonicalPaths.profile(aid)}`,
      kelUrl: `${base}${CanonicalPaths.kel(aid)}`,
      ksnUrl: `${base}${CanonicalPaths.ksn(aid)}`,
      oobiUrl: `${base}${CanonicalPaths.oobi(aid)}`,
    };
  },
} as const;
