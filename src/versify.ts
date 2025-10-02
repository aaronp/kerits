/**
 * KERI version string generation
 *
 * Creates version strings for KERI protocol messages in the format:
 * <protocol><major><minor><kind><size>_
 *
 * Example: KERI10JSON00012b_
 */

/**
 * Protocol identifiers
 */
export enum Protocol {
  KERI = 'KERI',
  ACDC = 'ACDC',
}

/**
 * Serialization kinds
 */
export enum Kind {
  JSON = 'JSON',
  CBOR = 'CBOR',
  MGPK = 'MGPK',
}

/**
 * Protocol version
 */
export interface Version {
  major: number;
  minor: number;
}

/**
 * Default KERI version 1.0
 */
export const VERSION_1_0: Version = { major: 1, minor: 0 };

/**
 * Generate a KERI version string
 *
 * @param protocol - Protocol identifier (default: KERI)
 * @param version - Protocol version (default: 1.0)
 * @param kind - Serialization kind (default: JSON)
 * @param size - Size of serialized content in bytes (default: 0)
 * @returns Version string in format: <protocol><major><minor><kind><size>_
 *
 * @example
 * versify() // 'KERI10JSON000000_'
 * versify(Protocol.KERI, { major: 1, minor: 0 }, Kind.JSON, 299) // 'KERI10JSON00012b_'
 */
export function versify(
  protocol: Protocol = Protocol.KERI,
  version: Version = VERSION_1_0,
  kind: Kind = Kind.JSON,
  size: number = 0
): string {
  // Convert version numbers to hex digits (single char each)
  const major = version.major.toString(16);
  const minor = version.minor.toString(16);

  // Convert size to hex string, zero-padded to 6 characters
  const sizeHex = size.toString(16).padStart(6, '0');

  // V1 termination character
  const terminator = '_';

  return `${protocol}${major}${minor}${kind}${sizeHex}${terminator}`;
}
