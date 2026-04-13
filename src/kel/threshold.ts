/**
 * Threshold Logic for Multi-Signature Validation
 *
 * Consolidated from two kv4 sources:
 * - packages/kerits/src/threshold.ts (parsing, validation, resolution)
 * - packages/core/src/threshold-check.ts (checking satisfaction)
 *
 * Implements KERI threshold satisfaction logic for both simple integer
 * and weighted threshold configurations.
 *
 * KERI Specification Requirements:
 * - Simple integer thresholds: M-of-N where any M signatures satisfy
 * - Weighted thresholds: Clauses with rational fractions that must sum to >= 1.0
 * - Multi-clause logic: All clauses must be satisfied (AND operation)
 * - Key order MUST match threshold weight list order (1-to-1 correspondence)
 *
 * @module kel/threshold
 */

import type { Threshold } from '../common/types.js';

// =====================================================================
// From kv4 packages/kerits/src/threshold.ts
// =====================================================================

export type ThresholdValue = number | string[][];

/**
 * Parse a simple threshold expression ("2", "2/3") into an integer t.
 *
 * Semantics:
 * - "k" means require k signatures, 1 <= k <= n
 * - "a/b" means require a signatures out of n, with b == n
 */
export function parseSimpleThreshold(expr: string | undefined, n: number): number {
  if (!expr) return 1;

  if (expr.includes('/')) {
    const parts = expr.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid threshold "${expr}": expected "numerator/denominator"`);
    }

    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);

    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error(`Invalid threshold "${expr}": numerator and denominator must be integers`);
    }

    if (denominator !== n) {
      throw new Error(
        `Invalid threshold "${expr}" for N=${n}: denominator must equal cardinality (got ${denominator}, expected ${n})`,
      );
    }

    if (numerator < 1 || numerator > n) {
      throw new Error(`Invalid threshold "${expr}": numerator must be between 1 and ${n}`);
    }

    return numerator;
  }

  const t = Number(expr);
  if (!Number.isInteger(t)) {
    throw new Error(`Invalid threshold "${expr}": must be an integer`);
  }
  if (t < 1 || t > n) {
    throw new Error(`Invalid threshold "${expr}" for N=${n}: must be between 1 and ${n}`);
  }
  return t;
}

/**
 * Validate threshold format at entry point (multiSig factory)
 *
 * Validates both simple/fractional thresholds (string) and weighted thresholds (string[][]).
 * This provides early validation before command construction.
 *
 * @param threshold - Threshold specification to validate
 * @param n - Cardinality of the keyset
 * @param fieldName - Name of the field being validated (for error messages)
 * @throws Error if threshold is invalid
 */
export function validateThreshold(threshold: Threshold, n: number, fieldName: string): void {
  if (Array.isArray(threshold)) {
    // Weighted threshold - validate structure and format
    if (threshold.length === 0) {
      throw new Error(`${fieldName}: weighted threshold must have at least one clause`);
    }

    for (let clauseIndex = 0; clauseIndex < threshold.length; clauseIndex++) {
      const clause = threshold[clauseIndex];
      if (!Array.isArray(clause)) {
        throw new Error(`${fieldName}: clause ${clauseIndex} must be an array of weight strings`);
      }

      if (clause.length !== n) {
        throw new Error(
          `${fieldName}: clause ${clauseIndex} has ${clause.length} weights but there are ${n} keys. Clause length must equal key count.`,
        );
      }

      // Validate each weight is a valid fraction
      for (let i = 0; i < clause.length; i++) {
        const weight = clause[i];
        if (typeof weight !== 'string') {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} must be a string, got ${typeof weight}`);
        }

        // Validate fraction format
        const parts = weight.split('/');
        if (parts.length !== 2) {
          throw new Error(
            `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" is invalid. Expected format: "numerator/denominator"`,
          );
        }

        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);

        if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
          throw new Error(
            `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have integer numerator and denominator`,
          );
        }

        if (denominator === 0) {
          throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" has zero denominator`);
        }

        if (numerator < 0 || denominator < 0) {
          throw new Error(
            `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have non-negative numerator and denominator`,
          );
        }
      }
    }
  } else if (typeof threshold === 'string') {
    // Simple or fractional threshold - use parseSimpleThreshold for validation
    try {
      parseSimpleThreshold(threshold, n);
    } catch (error) {
      throw new Error(`${fieldName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    throw new Error(`${fieldName}: invalid type ${typeof threshold}. Expected string or array of arrays.`);
  }
}

/**
 * Validate a weighted threshold specification (string[][]).
 */
export function validateWeightedThreshold(clauses: string[][], n: number, fieldName: string): void {
  if (clauses.length === 0) {
    throw new Error(`${fieldName}: weighted threshold must have at least one clause`);
  }

  for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex++) {
    const clause = clauses[clauseIndex];

    if (!Array.isArray(clause)) {
      throw new Error(`${fieldName}: clause ${clauseIndex} must be an array of weight strings`);
    }

    if (clause.length !== n) {
      throw new Error(
        `${fieldName}: clause ${clauseIndex} has ${clause.length} weights but there are ${n} keys. Clause length must equal key count.`,
      );
    }

    for (let i = 0; i < clause.length; i++) {
      const weight = clause[i];
      if (typeof weight !== 'string') {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} must be a string, got ${typeof weight}`);
      }

      const parts = weight.split('/');
      if (parts.length !== 2) {
        throw new Error(
          `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" is invalid. Expected format: "numerator/denominator"`,
        );
      }

      const numerator = Number(parts[0]);
      const denominator = Number(parts[1]);

      if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
        throw new Error(
          `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have integer numerator and denominator`,
        );
      }

      if (denominator === 0) {
        throw new Error(`${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" has zero denominator`);
      }

      if (numerator < 0 || denominator < 0) {
        throw new Error(
          `${fieldName}: clause ${clauseIndex} weight ${i} "${weight}" must have non-negative numerator and denominator`,
        );
      }
    }
  }
}

/**
 * Validate a Threshold spec at API boundaries.
 */
export function validateThresholdSpec(threshold: Threshold, n: number, fieldName: string): void {
  if (Array.isArray(threshold)) {
    validateWeightedThreshold(threshold, n, fieldName);
  } else if (typeof threshold === 'string') {
    parseSimpleThreshold(threshold, n);
  } else {
    throw new Error(`${fieldName}: invalid type ${typeof threshold}. Expected string or array of arrays.`);
  }
}

/**
 * Convert a Threshold into the exact ThresholdValue shape:
 * - string -> parsed simple threshold number
 * - string[][] -> validated weighted threshold
 */
export function resolveThresholdValue(threshold: Threshold | undefined, n: number): ThresholdValue {
  if (!threshold) return 1;

  if (Array.isArray(threshold)) {
    validateWeightedThreshold(threshold, n, 'threshold');
    return threshold;
  }

  return parseSimpleThreshold(threshold, n);
}

// =====================================================================
// From kv4 packages/core/src/threshold-check.ts
// =====================================================================

/**
 * Threshold specification types
 */
export type ThresholdSpec = number | string | string[][];

/**
 * Rational fraction representation (numerator/denominator)
 */
interface Fraction {
  numerator: number;
  denominator: number;
}

/**
 * Result of threshold check
 */
export interface ThresholdCheckResult {
  /**
   * Whether the threshold is satisfied
   */
  satisfied: boolean;

  /**
   * Required signature count or weight sum
   */
  required: number | string;

  /**
   * Collected signature count or weight sum
   */
  collected: number | string;

  /**
   * Type of threshold checked
   */
  type: 'simple' | 'weighted';

  /**
   * Details about clause satisfaction (for weighted thresholds)
   */
  clauseDetails?: Array<{
    clauseIndex: number;
    required: number;
    collected: number;
    satisfied: boolean;
  }>;
}

/**
 * Parse a rational fraction string like "1/2" into numerator and denominator
 */
function parseFraction(str: string): Fraction {
  const parts = str.trim().split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid fraction format: "${str}". Expected format: "numerator/denominator"`);
  }

  const numerator = Number.parseInt(parts[0]!, 10);
  const denominator = Number.parseInt(parts[1]!, 10);

  if (Number.isNaN(numerator) || Number.isNaN(denominator)) {
    throw new Error(`Invalid fraction: "${str}". Numerator and denominator must be integers.`);
  }

  if (denominator === 0) {
    throw new Error(`Invalid fraction: "${str}". Denominator cannot be zero.`);
  }

  if (numerator < 0 || denominator < 0) {
    throw new Error(`Invalid fraction: "${str}". Numerator and denominator must be non-negative.`);
  }

  return { numerator, denominator };
}

/**
 * Convert fraction to decimal for comparison
 */
function fractionToDecimal(fraction: Fraction): number {
  return fraction.numerator / fraction.denominator;
}

/**
 * Add two fractions
 */
function addFractions(a: Fraction, b: Fraction): Fraction {
  // a/b + c/d = (ad + bc) / (bd)
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return { numerator, denominator };
}

/**
 * Check if a simple integer threshold is satisfied
 *
 * @param threshold - Required number of signatures (M in "M-of-N")
 * @param signedIndices - Set of key indices that have provided signatures
 * @param totalKeys - Total number of keys (N in "M-of-N")
 * @returns Threshold check result
 */
function checkSimpleThreshold(threshold: number, signedIndices: Set<number>, totalKeys: number): ThresholdCheckResult {
  if (threshold < 0) {
    throw new Error(`Invalid threshold: ${threshold}. Threshold must be non-negative.`);
  }

  if (threshold > totalKeys) {
    throw new Error(
      `Invalid threshold: ${threshold} exceeds total keys ${totalKeys}. Threshold cannot exceed cardinality.`,
    );
  }

  const collected = signedIndices.size;
  const satisfied = collected >= threshold;

  return {
    satisfied,
    required: threshold,
    collected,
    type: 'simple',
  };
}

/**
 * Check if a weighted threshold is satisfied
 *
 * Weighted thresholds consist of one or more clauses, where each clause
 * specifies weights for each key position. All clauses must be satisfied
 * (AND operation).
 *
 * For a clause to be satisfied, the sum of weights for signed keys must be >= 1.0
 *
 * @param clauses - Array of weight clauses, each clause is an array of weight strings
 * @param signedIndices - Set of key indices that have provided signatures
 * @param totalKeys - Total number of keys
 * @returns Threshold check result
 */
function checkWeightedThreshold(
  clauses: string[][],
  signedIndices: Set<number>,
  totalKeys: number,
): ThresholdCheckResult {
  if (clauses.length === 0) {
    throw new Error('Weighted threshold must have at least one clause');
  }

  const clauseDetails: ThresholdCheckResult['clauseDetails'] = [];
  let allClausesSatisfied = true;

  for (let clauseIndex = 0; clauseIndex < clauses.length; clauseIndex++) {
    const clause = clauses[clauseIndex]!;

    // Validate clause length matches total keys
    if (clause.length !== totalKeys) {
      throw new Error(
        `Clause ${clauseIndex} has ${clause.length} weights but there are ${totalKeys} keys. Clause length must equal key count.`,
      );
    }

    // Sum the weights for signed keys
    let weightSum: Fraction = { numerator: 0, denominator: 1 };

    for (const keyIndex of signedIndices) {
      if (keyIndex >= clause.length) {
        throw new Error(`Key index ${keyIndex} exceeds clause length ${clause.length}`);
      }

      const weightStr = clause[keyIndex]!;
      const weight = parseFraction(weightStr);
      weightSum = addFractions(weightSum, weight);
    }

    // Check if this clause is satisfied (weight sum >= 1.0)
    const weightDecimal = fractionToDecimal(weightSum);
    const clauseSatisfied = weightDecimal >= 1.0;

    clauseDetails.push({
      clauseIndex,
      required: 1.0,
      collected: weightDecimal,
      satisfied: clauseSatisfied,
    });

    if (!clauseSatisfied) {
      allClausesSatisfied = false;
    }
  }

  return {
    satisfied: allClausesSatisfied,
    required: '1.0 per clause',
    collected: `${clauseDetails.filter((c) => c.satisfied).length}/${clauses.length} clauses`,
    type: 'weighted',
    clauseDetails,
  };
}

/**
 * Check if a threshold is satisfied given a set of collected signatures
 *
 * This is the main entry point for threshold checking. It supports:
 * - Simple integer thresholds: checkThreshold(2, [0, 1], 3) -> 2-of-3
 * - Weighted thresholds: checkThreshold([["1/2", "1/2"]], [0], 2) -> weighted
 * - String thresholds: checkThreshold("2", [0, 1], 3) -> parsed as integer
 *
 * @param threshold - Threshold specification (number, string, or weighted array)
 * @param signedIndices - Array or Set of key indices that have provided signatures
 * @param totalKeys - Total number of keys in the keyset
 * @returns Threshold check result with satisfaction status and details
 */
export function checkThreshold(
  threshold: ThresholdSpec,
  signedIndices: number[] | Set<number>,
  totalKeys: number,
): ThresholdCheckResult {
  // Validate inputs
  if (totalKeys <= 0) {
    throw new Error(`Invalid totalKeys: ${totalKeys}. Must be positive.`);
  }

  // Convert array to Set if needed
  const signedSet = Array.isArray(signedIndices) ? new Set(signedIndices) : signedIndices;

  // Validate signed indices
  for (const index of signedSet) {
    if (index < 0 || index >= totalKeys) {
      throw new Error(`Invalid key index: ${index}. Must be in range [0, ${totalKeys - 1}]`);
    }
  }

  // Determine threshold type and check
  if (typeof threshold === 'number') {
    // Simple integer threshold
    return checkSimpleThreshold(threshold, signedSet, totalKeys);
  }

  if (typeof threshold === 'string') {
    // Parse string as integer
    const thresholdNum = Number.parseInt(threshold, 10);
    if (Number.isNaN(thresholdNum)) {
      throw new Error(`Invalid threshold string: "${threshold}". Expected integer or weighted array.`);
    }
    return checkSimpleThreshold(thresholdNum, signedSet, totalKeys);
  }

  if (Array.isArray(threshold)) {
    // Weighted threshold with clauses
    return checkWeightedThreshold(threshold, signedSet, totalKeys);
  }

  throw new Error(`Invalid threshold type: ${typeof threshold}. Expected number, string, or array.`);
}
