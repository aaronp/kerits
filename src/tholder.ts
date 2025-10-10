/**
 * Tholder - KERI Signing Threshold class
 *
 * Validates and normalizes signing thresholds for KERI events.
 * Supports both numeric and weighted (fractional) thresholds.
 */

export type ThresholdValue = number | string | string[];

/**
 * Signing threshold holder
 *
 * Validates and stores signing threshold information for KERI events.
 * The threshold determines how many signatures are required to validate
 * a key event.
 *
 * Supports:
 * - Numeric thresholds: 1, 2, 3, etc.
 * - String numeric: "1", "2", "3", etc.
 * - Weighted thresholds: ["1/2", "1/2", "1/2"] (fractional weights per key)
 */
export class Tholder {
  /** Original threshold value */
  public readonly sith: ThresholdValue;

  /** Integer threshold value (for numeric thresholds) */
  public readonly num: number;

  /** Weighted threshold values (for weighted thresholds) */
  public readonly weighted: string[] | null;

  /** Minimum size of key list */
  public readonly size: number;

  /**
   * Create a new Tholder
   *
   * @param sith - Signing threshold
   *               - If number: used directly as threshold
   *               - If string: parsed as hex or decimal integer
   *               - If string[]: weighted threshold (fractional weights)
   *
   * @example
   * new Tholder({ sith: 1 })     // Numeric threshold of 1
   * new Tholder({ sith: "2" })   // Numeric threshold of 2
   * new Tholder({ sith: ["1/2", "1/2", "1/2"] }) // Weighted threshold
   */
  constructor({ sith }: { sith: ThresholdValue }) {
    this.sith = sith;

    if (Array.isArray(sith)) {
      // Weighted threshold
      this.weighted = sith;
      this.num = this.computeWeightedThreshold(sith);
      this.size = sith.length;
    } else {
      // Numeric threshold
      this.weighted = null;
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

      this.num = num;
      this.size = num;
    }
  }

  /**
   * Compute the effective numeric threshold from weighted thresholds
   *
   * For weighted thresholds, the sum of weights must be >= 1/2 of total weight.
   * This is simplified to: need at least ceil(count/2) signatures.
   *
   * @param weights - Array of fractional weights like ["1/2", "1/2", "1/2"]
   * @returns Minimum number of signatures required
   */
  private computeWeightedThreshold(weights: string[]): number {
    // Parse weights and compute total
    let totalWeight = 0;
    const parsedWeights: number[] = [];

    for (const w of weights) {
      const parts = w.split('/');
      if (parts.length !== 2) {
        throw new Error(`Invalid weight format: ${w}`);
      }

      const numerator = parseInt(parts[0], 10);
      const denominator = parseInt(parts[1], 10);

      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error(`Invalid weight: ${w}`);
      }

      const weight = numerator / denominator;
      parsedWeights.push(weight);
      totalWeight += weight;
    }

    // For majority threshold with equal weights, need > 1/2 of total weight
    // This simplifies to ceil(count/2) for equal "1/2" weights
    return Math.ceil(weights.length / 2);
  }

  /**
   * Validate threshold against key count
   *
   * @param keyCount - Number of keys available
   * @throws Error if threshold is invalid for the given key count
   */
  validate(keyCount: number): void {
    if (this.weighted) {
      // Weighted threshold: must match key count
      if (this.weighted.length !== keyCount) {
        throw new Error(
          `Weighted threshold length ${this.weighted.length} must match key count ${keyCount}`
        );
      }
    } else {
      // Numeric threshold: must be >= 1 and <= keyCount
      if (this.num < 1 && keyCount > 0) {
        throw new Error(`Invalid threshold ${this.num}, must be at least 1`);
      }
      if (this.num > keyCount) {
        throw new Error(
          `Invalid threshold ${this.num}, exceeds key count ${keyCount}`
        );
      }
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
