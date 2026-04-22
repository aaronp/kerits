/**
 * Threshold Normalization
 *
 * Provides a single canonical internal representation for KERI thresholds.
 * Parse once at the boundary, validate everywhere against the normalized form.
 *
 * The new validator never calls legacy checkThreshold — only normalizeThreshold
 * + checkNormalizedThreshold.
 */

import type { Threshold } from '../common/types.js';

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface WeightedClause {
  weights: Fraction[];
}

export type NormalizedThreshold =
  | { type: 'simple'; m: number; n: number }
  | { type: 'weighted'; clauses: WeightedClause[] };

export interface NormalizedThresholdCheckResult {
  satisfied: boolean;
  type: 'simple' | 'weighted';
  required: number | string;
  collected: number | string;
  clauseDetails?: Array<{
    clauseIndex: number;
    required: number;
    collected: number;
    satisfied: boolean;
  }>;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

function parseFractionStr(str: string): Fraction {
  const parts = str.trim().split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid fraction: "${str}"`);
  }
  const numerator = Number.parseInt(parts[0]!, 10);
  const denominator = Number.parseInt(parts[1]!, 10);
  if (Number.isNaN(numerator) || Number.isNaN(denominator)) {
    throw new Error(`Invalid fraction: "${str}"`);
  }
  if (denominator === 0) {
    throw new Error(`Zero denominator in fraction: "${str}"`);
  }
  if (numerator < 0 || denominator < 0) {
    throw new Error(`Negative value in fraction: "${str}"`);
  }
  return { numerator, denominator };
}

/**
 * Parse a raw Threshold into a NormalizedThreshold.
 *
 * @param raw - Threshold from a KEL event (string or string[][])
 * @param keyCount - Number of keys in the signing set
 * @throws Error if threshold is malformed or unsatisfiable
 */
export function normalizeThreshold(raw: Threshold, keyCount: number): NormalizedThreshold {
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      throw new Error('Weighted threshold must have at least one clause');
    }
    const clauses: WeightedClause[] = [];
    for (let ci = 0; ci < raw.length; ci++) {
      const clause = raw[ci]!;
      if (!Array.isArray(clause)) {
        throw new Error(`Clause ${ci} must be an array`);
      }
      if (clause.length !== keyCount) {
        throw new Error(`Clause ${ci} has ${clause.length} weights but there are ${keyCount} keys`);
      }
      const weights = clause.map((w) => parseFractionStr(w));
      clauses.push({ weights });
    }
    return { type: 'weighted', clauses };
  }

  if (typeof raw === 'string') {
    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length !== 2) throw new Error(`Invalid threshold: "${raw}"`);
      const m = Number.parseInt(parts[0]!, 10);
      const n = Number.parseInt(parts[1]!, 10);
      if (Number.isNaN(m) || Number.isNaN(n)) throw new Error(`Invalid threshold: "${raw}"`);
      if (n !== keyCount) {
        throw new Error(`Threshold denominator ${n} !== key count ${keyCount}`);
      }
      if (m < 1 || m > n) throw new Error(`Threshold ${m} out of range [1, ${n}]`);
      return { type: 'simple', m, n };
    }
    const m = Number.parseInt(raw, 10);
    if (Number.isNaN(m)) throw new Error(`Invalid threshold: "${raw}"`);
    if (m < 1 || m > keyCount) throw new Error(`Threshold ${m} out of range [1, ${keyCount}]`);
    return { type: 'simple', m, n: keyCount };
  }

  throw new Error(`Invalid threshold type: ${typeof raw}`);
}

/**
 * Check if a normalized threshold is satisfied by a set of signed key indices.
 * Uses rational arithmetic to avoid IEEE 754 precision issues.
 */
export function checkNormalizedThreshold(
  threshold: NormalizedThreshold,
  signedIndices: Set<number>,
): NormalizedThresholdCheckResult {
  if (threshold.type === 'simple') {
    const collected = signedIndices.size;
    return {
      satisfied: collected >= threshold.m,
      type: 'simple',
      required: threshold.m,
      collected,
    };
  }

  // Weighted — use rational arithmetic (LCD) to avoid float precision issues
  const clauseDetails: NormalizedThresholdCheckResult['clauseDetails'] = [];
  let allSatisfied = true;

  for (let ci = 0; ci < threshold.clauses.length; ci++) {
    const clause = threshold.clauses[ci]!;
    let lcd = 1;
    for (const w of clause.weights) lcd = lcm(lcd, w.denominator);
    let sumNumerator = 0;
    for (const idx of signedIndices) {
      if (idx < clause.weights.length) {
        const w = clause.weights[idx]!;
        sumNumerator += w.numerator * (lcd / w.denominator);
      }
    }
    const satisfied = sumNumerator >= lcd;
    const sum = sumNumerator / lcd;
    clauseDetails.push({ clauseIndex: ci, required: 1.0, collected: sum, satisfied });
    if (!satisfied) allSatisfied = false;
  }

  return {
    satisfied: allSatisfied,
    type: 'weighted',
    required: '1.0 per clause',
    collected: `${clauseDetails.filter((c) => c.satisfied).length}/${threshold.clauses.length}`,
    clauseDetails,
  };
}
