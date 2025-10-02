import { saidify } from './saidify';
import { parseCredential } from './credential';

/**
 * Credential Verification
 *
 * Provides cryptographic verification of ACDC credentials by validating:
 * - Credential SAID (self-addressing identifier)
 * - Subject SAID within attributes
 * - Version string integrity
 * - Structure validity
 */

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    credentialSaid: boolean;
    subjectSaid: boolean;
    versionString: boolean;
    structure: boolean;
  };
}

/**
 * Verify a credential's cryptographic integrity
 *
 * Performs the following checks:
 * 1. Credential SAID matches recomputed SAID
 * 2. Subject SAID matches recomputed SAID
 * 3. Version string is valid
 * 4. Required fields are present
 *
 * @param credentialJson - Credential as JSON string or object
 * @returns Verification result with detailed check results
 */
export function verifyCredential(credentialJson: string | Record<string, any>): VerificationResult {
  const result: VerificationResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: {
      credentialSaid: false,
      subjectSaid: false,
      versionString: false,
      structure: false,
    },
  };

  let cred: Record<string, any>;

  // Parse credential
  try {
    if (typeof credentialJson === 'string') {
      const parsed = parseCredential(credentialJson);
      cred = parsed.sad;
    } else {
      cred = credentialJson;
    }
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Failed to parse credential: ${error.message}`);
    return result;
  }

  // Check structure
  try {
    validateStructure(cred);
    result.checks.structure = true;
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Structure validation failed: ${error.message}`);
    return result;
  }

  // Check version string
  try {
    if (!cred.v || !cred.v.startsWith('ACDC')) {
      throw new Error('Invalid version string, must start with ACDC');
    }
    result.checks.versionString = true;
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Version string validation failed: ${error.message}`);
  }

  // Verify credential SAID
  try {
    const saidified = saidify(cred, { label: 'd' });
    if (saidified.d === cred.d) {
      result.checks.credentialSaid = true;
    } else {
      result.valid = false;
      result.errors.push(
        `Credential SAID mismatch: expected ${cred.d}, computed ${saidified.d}`
      );
    }
  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Credential SAID verification failed: ${error.message}`);
  }

  // Verify subject SAID (if attributes present)
  if (cred.a && typeof cred.a === 'object') {
    try {
      const subjectSaidified = saidify(cred.a, { label: 'd' });
      if (subjectSaidified.d === cred.a.d) {
        result.checks.subjectSaid = true;
      } else {
        result.valid = false;
        result.errors.push(
          `Subject SAID mismatch: expected ${cred.a.d}, computed ${subjectSaidified.d}`
        );
      }
    } catch (error: any) {
      result.valid = false;
      result.errors.push(`Subject SAID verification failed: ${error.message}`);
    }
  } else {
    result.warnings.push('No attributes section (a) found in credential');
    result.checks.subjectSaid = true; // Not applicable
  }

  return result;
}

/**
 * Validate credential structure
 */
function validateStructure(cred: Record<string, any>): void {
  // Required top-level fields
  const requiredFields = ['v', 'd', 'i', 's'];
  for (const field of requiredFields) {
    if (!cred[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate attributes if present
  if (cred.a) {
    if (typeof cred.a !== 'object') {
      throw new Error('Attributes (a) must be an object');
    }

    if (!cred.a.d) {
      throw new Error('Attributes must have SAID field (d)');
    }

    if (!cred.a.dt) {
      throw new Error('Attributes must have datetime field (dt)');
    }
  }
}

/**
 * Verify multiple credentials
 *
 * @param credentials - Array of credentials to verify
 * @returns Array of verification results
 */
export function verifyCredentials(
  credentials: Array<string | Record<string, any>>
): VerificationResult[] {
  return credentials.map((cred) => verifyCredential(cred));
}

/**
 * Get a summary of verification results
 *
 * @param result - Verification result
 * @returns Human-readable summary string
 */
export function getVerificationSummary(result: VerificationResult): string {
  const lines: string[] = [];

  lines.push(`Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}`);
  lines.push('');

  lines.push('Checks:');
  lines.push(`  Credential SAID: ${result.checks.credentialSaid ? '✓' : '✗'}`);
  lines.push(`  Subject SAID:    ${result.checks.subjectSaid ? '✓' : '✗'}`);
  lines.push(`  Version String:  ${result.checks.versionString ? '✓' : '✗'}`);
  lines.push(`  Structure:       ${result.checks.structure ? '✓' : '✗'}`);

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    result.errors.forEach((error) => lines.push(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    result.warnings.forEach((warning) => lines.push(`  - ${warning}`));
  }

  return lines.join('\n');
}
