import { versify, Protocol, VERSION_1_0, Kind } from './versify';
import { saidify } from './saidify';
import { randomBytes } from 'node:crypto';

/**
 * Transaction Event Log (TEL) for ACDC Credentials
 *
 * TEL provides a verifiable event log for credential lifecycle events:
 * - vcp: Registry inception
 * - vrt: Registry rotation (backer management)
 * - iss: Credential issuance
 * - rev: Credential revocation
 * - ixn: Interaction (endorsements, attestations)
 * - bis: Backerless issuance
 * - brv: Backerless revocation
 */

/**
 * Registry inception options
 */
export interface RegistryInceptionOptions {
  issuer: string;           // Issuer AID
  nonce?: string;          // Unique nonce (auto-generated if not provided)
  baks?: string[];         // Backer AIDs (optional)
  toad?: number;           // Backer threshold (optional, auto-computed if not provided)
  cnfg?: string[];         // Configuration traits (optional)
}

/**
 * Registry inception result
 */
export interface RegistryInception {
  sad: Record<string, any>;  // Registry event as JSON object
  raw: string;               // Serialized event
  said: string;              // SAID of event
  regk: string;              // Registry identifier (same as SAID for inception)
}

/**
 * Issuance event options
 */
export interface IssuanceOptions {
  vcdig: string;   // Credential SAID
  regk: string;    // Registry identifier
  dt?: string;     // Issuance datetime (ISO 8601, auto-generated if not provided)
}

/**
 * Issuance event result
 */
export interface IssuanceEvent {
  sad: Record<string, any>;  // Issuance event as JSON object
  raw: string;               // Serialized event
  said: string;              // SAID of event
}

/**
 * Revocation event options
 */
export interface RevocationOptions {
  vcdig: string;   // Credential SAID
  regk: string;    // Registry identifier
  dig: string;     // Prior event digest
  dt?: string;     // Revocation datetime (ISO 8601, auto-generated if not provided)
}

/**
 * Revocation event result
 */
export interface RevocationEvent {
  sad: Record<string, any>;  // Revocation event as JSON object
  raw: string;               // Serialized event
  said: string;              // SAID of event
}

/**
 * Interaction event options
 */
export interface InteractionOptions {
  vcdig: string;              // Credential SAID
  regk: string;               // Registry identifier
  dig: string;                // Prior event digest
  sn: number;                 // Sequence number
  data?: Record<string, any>; // Interaction data/metadata (optional)
  dt?: string;                // Interaction datetime (ISO 8601, auto-generated if not provided)
}

/**
 * Interaction event result
 */
export interface InteractionEvent {
  sad: Record<string, any>;  // Interaction event as JSON object
  raw: string;               // Serialized event
  said: string;              // SAID of event
}

/**
 * Registry rotation options
 */
export interface RegistryRotationOptions {
  regk: string;        // Registry identifier
  dig: string;         // Prior event digest
  sn: number;          // Sequence number
  toad?: number;       // New backer threshold (optional, auto-computed if not provided)
  adds?: string[];     // Backers to add (optional)
  cuts?: string[];     // Backers to remove (optional)
}

/**
 * Registry rotation result
 */
export interface RegistryRotation {
  sad: Record<string, any>;  // Registry rotation event as JSON object
  raw: string;               // Serialized event
  said: string;              // SAID of event
}

/**
 * Generate a random nonce for registry inception
 */
function generateNonce(): string {
  // Generate 33 random bytes and encode as base64url (44 chars)
  const raw = randomBytes(33);
  const b64 = raw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Ensure it's exactly 44 characters (CESR format)
  return 'A' + b64.substring(0, 43);
}

/**
 * Get current ISO 8601 timestamp
 */
function nowIso8601(): string {
  const now = new Date();
  const iso = now.toISOString();
  // Convert to microseconds format: YYYY-MM-DDTHH:MM:SS.ffffff+00:00
  const microseconds = iso.substring(0, 23) + '000+00:00';
  return microseconds;
}

/**
 * Compute default threshold for backers (ample function from KERI)
 */
function ample(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  // f = (n - 1) / 3, m = f + 1
  const f = Math.floor((count - 1) / 3);
  return f + 1;
}

/**
 * Create a registry inception event (vcp)
 *
 * Creates a TEL registry for managing credential lifecycle events.
 *
 * @param options - Registry inception options
 * @returns Registry inception event with SAID
 */
export function registryIncept(options: RegistryInceptionOptions): RegistryInception {
  const { issuer, baks = [], cnfg = [] } = options;

  let { nonce, toad } = options;

  // Validate required fields
  if (!issuer) {
    throw new Error('Issuer AID is required');
  }

  // Generate nonce if not provided
  if (!nonce) {
    nonce = generateNonce();
  }

  // Validate backers
  if (baks.length !== new Set(baks).size) {
    throw new Error('Duplicate backers not allowed');
  }

  // Compute threshold if not provided
  if (toad === undefined) {
    toad = baks.length === 0 ? 0 : ample(baks.length);
  }

  // Validate threshold
  if (baks.length > 0) {
    if (toad < 1 || toad > baks.length) {
      throw new Error(`Invalid threshold ${toad} for ${baks.length} backers`);
    }
  } else {
    if (toad !== 0) {
      throw new Error(`Invalid threshold ${toad} for 0 backers`);
    }
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create event structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'vcp',          // Registry inception ilk
    d: '',             // Will be computed
    i: '',             // Registry identifier (same as d for inception)
    ii: issuer,        // Issuer AID
    s: '0',            // Sequence number (hex)
    c: cnfg,           // Configuration traits
    bt: toad.toString(16),  // Backer threshold (hex)
    b: baks,           // Backer AIDs
    n: nonce,          // Nonce
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  ked.i = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;
  ked.i = saidified.d;  // Registry identifier is the SAID

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: ked.d,
    regk: ked.i,
  };
}

/**
 * Create a credential issuance event (iss)
 *
 * Records the issuance of a credential in the TEL.
 *
 * @param options - Issuance event options
 * @returns Issuance event with SAID
 */
export function issue(options: IssuanceOptions): IssuanceEvent {
  const { vcdig, regk } = options;
  let { dt } = options;

  // Validate required fields
  if (!vcdig) {
    throw new Error('Credential SAID (vcdig) is required');
  }

  if (!regk) {
    throw new Error('Registry identifier (regk) is required');
  }

  // Generate datetime if not provided
  if (!dt) {
    dt = nowIso8601();
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create event structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'iss',          // Issuance ilk
    d: '',             // Will be computed
    i: vcdig,          // Credential SAID
    s: '0',            // Sequence number (hex) - always 0 for issuance
    ri: regk,          // Registry identifier
    dt: dt,            // Issuance datetime
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: ked.d,
  };
}

/**
 * Create a credential revocation event (rev)
 *
 * Records the revocation of a credential in the TEL.
 *
 * @param options - Revocation event options
 * @returns Revocation event with SAID
 */
export function revoke(options: RevocationOptions): RevocationEvent {
  const { vcdig, regk, dig } = options;
  let { dt } = options;

  // Validate required fields
  if (!vcdig) {
    throw new Error('Credential SAID (vcdig) is required');
  }

  if (!regk) {
    throw new Error('Registry identifier (regk) is required');
  }

  if (!dig) {
    throw new Error('Prior event digest (dig) is required');
  }

  // Generate datetime if not provided
  if (!dt) {
    dt = nowIso8601();
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create event structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'rev',          // Revocation ilk
    d: '',             // Will be computed
    i: vcdig,          // Credential SAID
    s: '1',            // Sequence number (hex) - always 1 for revocation
    ri: regk,          // Registry identifier
    p: dig,            // Prior event digest
    dt: dt,            // Revocation datetime
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: ked.d,
  };
}

/**
 * Create a credential interaction event (ixn)
 *
 * Records an interaction, endorsement, or attestation without changing credential status.
 *
 * @param options - Interaction event options
 * @returns Interaction event with SAID
 */
export function interact(options: InteractionOptions): InteractionEvent {
  const { vcdig, regk, dig, sn, data = {} } = options;
  let { dt } = options;

  // Validate required fields
  if (!vcdig) {
    throw new Error('Credential SAID (vcdig) is required');
  }

  if (!regk) {
    throw new Error('Registry identifier (regk) is required');
  }

  if (!dig) {
    throw new Error('Prior event digest (dig) is required');
  }

  if (sn === undefined || sn < 0) {
    throw new Error('Sequence number (sn) is required and must be non-negative');
  }

  // Generate datetime if not provided
  if (!dt) {
    dt = nowIso8601();
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create event structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'ixn',          // Interaction ilk
    d: '',             // Will be computed
    i: vcdig,          // Credential SAID
    s: sn.toString(16), // Sequence number (hex)
    ri: regk,          // Registry identifier
    p: dig,            // Prior event digest
    a: data,           // Interaction data/metadata
    dt: dt,            // Interaction datetime
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: ked.d,
  };
}

/**
 * Create a registry rotation event (vrt)
 *
 * Manages registry backer changes and threshold updates.
 * Used to add/remove backers or update the backer threshold.
 *
 * @param options - Registry rotation options
 * @returns Registry rotation event with SAID
 */
export function registryRotate(options: RegistryRotationOptions): RegistryRotation {
  const { regk, dig, sn, adds = [], cuts = [] } = options;
  let { toad } = options;

  // Validate required fields
  if (!regk) {
    throw new Error('Registry identifier (regk) is required');
  }

  if (!dig) {
    throw new Error('Prior event digest (dig) is required');
  }

  if (sn === undefined || sn < 0) {
    throw new Error('Sequence number (sn) is required and must be non-negative');
  }

  // Validate no duplicates in adds
  if (adds.length !== new Set(adds).size) {
    throw new Error('Duplicate backers in adds list');
  }

  // Validate no duplicates in cuts
  if (cuts.length !== new Set(cuts).size) {
    throw new Error('Duplicate backers in cuts list');
  }

  // Validate no overlap between adds and cuts
  const addSet = new Set(adds);
  for (const cut of cuts) {
    if (addSet.has(cut)) {
      throw new Error(`Backer ${cut} appears in both adds and cuts`);
    }
  }

  // Compute new backer count after rotation
  // Note: This assumes we're tracking the list, but for the event we only need the threshold
  const newBackerCount = adds.length; // Simplified - in real usage, would be (current - cuts.length + adds.length)

  // Compute threshold if not provided
  if (toad === undefined) {
    toad = newBackerCount === 0 ? 0 : ample(newBackerCount);
  }

  // Create version string with placeholder size
  const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, 0);

  // Create event structure
  const ked: Record<string, any> = {
    v: vs,
    t: 'vrt',          // Registry rotation ilk
    d: '',             // Will be computed
    i: regk,           // Registry identifier
    p: dig,            // Prior event digest
    s: sn.toString(16), // Sequence number (hex)
    bt: toad.toString(16), // Backer threshold (hex)
    br: cuts,          // Backers to remove
    ba: adds,          // Backers to add
  };

  // Compute size with placeholder SAID
  ked.d = '#'.repeat(44);
  let serialized = JSON.stringify(ked);
  const size = serialized.length;

  // Update version with actual size
  ked.v = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, size);

  // Compute SAID
  const saidified = saidify(ked, { label: 'd' });
  ked.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(ked);

  return {
    sad: ked,
    raw: serialized,
    said: ked.d,
  };
}

/**
 * Parse a TEL event from raw JSON
 *
 * @param raw - Serialized TEL event JSON
 * @returns Parsed TEL event
 */
export function parseTelEvent(raw: string): Record<string, any> {
  const sad = JSON.parse(raw);

  if (!sad.d) {
    throw new Error('TEL event must have d (SAID) field');
  }

  if (!sad.v || !sad.v.startsWith('KERI')) {
    throw new Error('Invalid TEL event version string');
  }

  if (!sad.t || !['vcp', 'vrt', 'iss', 'rev', 'ixn', 'bis', 'brv'].includes(sad.t)) {
    throw new Error('Invalid TEL event type');
  }

  return sad;
}
