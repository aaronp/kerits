import type { AID, SAID } from '../common/types.js';

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
 */
export const CanonicalPaths = {
  kel: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/kel`,
  ksn: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/ksn`,
  aidManifest: (aid: AID) => `${KERI_PREFIX}/aid/${aid}/manifest`,
  oobi: (aid: AID) => `${KERI_PREFIX}/oobi/${aid}`,
  schema: (said: SAID) => `${KERI_PREFIX}/said/${said}/schema`,
  acdc: (said: SAID) => `${KERI_PREFIX}/said/${said}/acdc`,
  tel: (rid: SAID) => `${KERI_PREFIX}/registry/${rid}/tel`,
  rsn: (rid: SAID) => `${KERI_PREFIX}/registry/${rid}/rsn`,
  event: (said: SAID) => `${KERI_PREFIX}/events/${said}/event`,
  receipts: (said: SAID) => `${KERI_PREFIX}/events/${said}/receipts`,
  fullUrl: (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/, '')}${path}`,
} as const;
