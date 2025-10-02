import { versify, Protocol, VERSION_1_0, Kind } from './versify';
import { saidify } from './saidify';

/**
 * ACDC (Authentic Chained Data Container) Credentials
 *
 * Creates verifiable credentials with self-addressing identifiers.
 */

export interface CredentialData {
  [key: string]: any;
  dt?: string;  // Optional datetime, will be auto-generated if not provided
}

export interface CredentialSubject {
  d: string;           // SAID of subject
  i?: string;          // Recipient AID (optional)
  dt: string;          // Issuance datetime (ISO 8601)
  [key: string]: any;  // Credential data
}

export interface CredentialOptions {
  schema: string;      // SAID of schema
  issuer: string;      // Issuer AID
  data: CredentialData;
  recipient?: string;  // Recipient AID (optional)
  registry?: string;   // Registry AID (optional - for revocable credentials)
  status?: string;     // Alias for registry
  private?: boolean;   // Privacy-preserving features (not MVP)
}

export interface Credential {
  sad: Record<string, any>;  // Credential as JSON object
  raw: string;               // Serialized credential
  said: string;              // SAID of credential
}

/**
 * Get current ISO 8601 timestamp
 */
function nowIso8601(): string {
  return new Date().toISOString();
}

/**
 * Create an ACDC credential
 *
 * Pure function that creates a verifiable credential with SAID.
 * The credential follows the ACDC specification.
 *
 * @param options - Credential creation options
 * @returns Credential with SAID
 */
export function credential(options: CredentialOptions): Credential {
  const {
    schema,
    issuer,
    data,
    recipient,
    registry,
    status,
  } = options;

  // Validate required fields
  if (!schema) {
    throw new Error('Schema SAID is required');
  }

  if (!issuer) {
    throw new Error('Issuer AID is required');
  }

  if (!data) {
    throw new Error('Credential data is required');
  }

  // Create subject (attributes)
  const subject: Record<string, any> = {
    d: '',  // Will be computed
  };

  // Add recipient if specified
  if (recipient) {
    subject.i = recipient;
  }

  // Add datetime (use provided or generate)
  subject.dt = data.dt || nowIso8601();

  // Add all data fields
  Object.keys(data).forEach(key => {
    if (key !== 'dt') {  // Don't duplicate dt
      subject[key] = data[key];
    }
  });

  // Compute subject SAID
  const saidifiedSubject = saidify(subject, { label: 'd' });

  // Create credential structure
  const vs = versify(Protocol.ACDC, VERSION_1_0, Kind.JSON, 0);

  const vc: Record<string, any> = {
    v: vs,
    d: '',        // Will be computed
    i: issuer,
  };

  // Add registry if specified (must come BEFORE schema in Python order)
  const registryAid = registry || status;
  if (registryAid) {
    vc.ri = registryAid;
  }

  // Add schema and attributes
  vc.s = schema;
  vc.a = saidifiedSubject;

  // Compute credential size with placeholder SAID
  vc.d = '#'.repeat(44);
  let serialized = JSON.stringify(vc);
  const size = serialized.length;

  // Update version with actual size
  vc.v = versify(Protocol.ACDC, VERSION_1_0, Kind.JSON, size);

  // Compute credential SAID
  const saidified = saidify(vc, { label: 'd' });
  vc.d = saidified.d;

  // Final serialization
  serialized = JSON.stringify(vc);

  return {
    sad: vc,
    raw: serialized,
    said: vc.d,
  };
}

/**
 * Parse a credential from raw JSON
 *
 * @param raw - Serialized credential JSON
 * @returns Parsed credential
 */
export function parseCredential(raw: string): Credential {
  const sad = JSON.parse(raw);

  if (!sad.d) {
    throw new Error('Credential must have d (SAID) field');
  }

  if (!sad.v || !sad.v.startsWith('ACDC')) {
    throw new Error('Invalid credential version string');
  }

  return {
    sad,
    raw,
    said: sad.d,
  };
}
