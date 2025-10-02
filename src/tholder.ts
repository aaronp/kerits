/**
 * Tholder - KERI Signing Threshold class
 *
 * Validates and normalizes signing thresholds for KERI events.
 * MVP: Supports only numeric thresholds (no weighted/fractional thresholds)
 */

/**
 * Signing threshold holder
 *
 * Validates and stores signing threshold information for KERI events.
 * The threshold determines how many signatures are required to validate
 * a key event.
 */
export class Tholder {
  /** Original threshold value (int or hex string) */
  public readonly sith: number | string;

  /** Integer threshold value */
  public readonly num: number;

  /** Minimum size of key list */
  public readonly size: number;

  /**
   * Create a new Tholder
   *
   * @param sith - Signing threshold (int, hex string, or undefined for default)
   *               - If number: used directly as threshold
   *               - If string: parsed as hex or decimal integer
   *
   * @example
   * new Tholder({ sith: 1 })     // Threshold of 1
   * new Tholder({ sith: "2" })   // Threshold of 2 (from decimal string)
   * new Tholder({ sith: "0x2" }) // Threshold of 2 (from hex string)
   */
  constructor({ sith }: { sith: number | string }) {
    // Parse threshold value
    let num: number;

    if (typeof sith === 'number') {
      num = sith;
    } else if (typeof sith === 'string') {
      // Try parsing as hex first (if starts with 0x) or decimal
      num = sith.startsWith('0x')
        ? parseInt(sith, 16)
        : parseInt(sith, 10);

      if (isNaN(num)) {
        throw new Error(`Invalid threshold string: ${sith}`);
      }
    } else {
      throw new Error(`Invalid threshold type: ${typeof sith}`);
    }

    // Validate threshold
    if (!Number.isInteger(num)) {
      throw new Error(`Threshold must be an integer: ${num}`);
    }

    if (num < 0) {
      throw new Error(`Invalid threshold ${num}, must be non-negative`);
    }

    this.sith = sith;
    this.num = num;
    this.size = num; // For numeric thresholds, size equals the threshold
  }

  /**
   * Validate threshold against key count
   *
   * @param keyCount - Number of keys available
   * @throws Error if threshold is invalid for the given key count
   */
  validate(keyCount: number): void {
    if (this.num < 1) {
      throw new Error(`Invalid threshold ${this.num}, must be at least 1`);
    }
    if (this.num > keyCount) {
      throw new Error(
        `Invalid threshold ${this.num}, exceeds key count ${keyCount}`
      );
    }
  }
}

/**
 * Calculate default signing threshold for a given number of keys
 *
 * Uses majority threshold: ceil(keyCount / 2)
 *
 * @param keyCount - Number of signing keys
 * @returns Default threshold (at least 1, at most keyCount)
 *
 * @example
 * defaultThreshold(1) // 1
 * defaultThreshold(2) // 1
 * defaultThreshold(3) // 2
 * defaultThreshold(4) // 2
 * defaultThreshold(5) // 3
 */
export function defaultThreshold(keyCount: number): number {
  if (keyCount < 1) {
    throw new Error(`Invalid key count ${keyCount}, must be at least 1`);
  }
  return Math.max(1, Math.ceil(keyCount / 2));
}

/**
 * Calculate default next signing threshold for a given number of next keys
 *
 * Uses majority threshold, but allows 0 for empty next keys
 *
 * @param nextKeyCount - Number of next key digests
 * @returns Default next threshold (at least 0, at most nextKeyCount)
 *
 * @example
 * defaultNextThreshold(0) // 0
 * defaultNextThreshold(1) // 1
 * defaultNextThreshold(2) // 1
 * defaultNextThreshold(3) // 2
 */
export function defaultNextThreshold(nextKeyCount: number): number {
  if (nextKeyCount < 0) {
    throw new Error(`Invalid next key count ${nextKeyCount}, must be non-negative`);
  }
  return Math.max(0, Math.ceil(nextKeyCount / 2));
}
