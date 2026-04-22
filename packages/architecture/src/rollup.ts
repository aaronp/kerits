import type { RollupStatus, RollupSummary } from './scenario-types.js';

/**
 * Derive rollup status from observation counts.
 *
 * Precedence:
 *   FAILING      — any failed > 0
 *   VERIFIED     — passed > 0 AND nothing else
 *   PARTIAL      — passed > 0 alongside pending/skipped/notRun (no failed)
 *   PLANNED      — only pending/skipped/notRun, no passed and no failed
 *   NOT-STARTED  — all counts zero
 *
 * `notRun` is "defined in the catalog, no observation in merged evidence"
 * (lowercase, per-scenario). It is computed by the generator, never by the
 * runtime. `NOT-STARTED` (UPPERCASE) is per-rollup.
 */
export function rollupStatus(counts: Omit<RollupSummary, 'status'>): RollupStatus {
  if (counts.failed > 0) return 'FAILING';
  if (counts.passed > 0 && counts.failed === 0 && counts.skipped === 0 && counts.todo === 0 && counts.notRun === 0) {
    return 'VERIFIED';
  }
  if (counts.passed > 0) return 'PARTIAL';
  if (counts.todo + counts.skipped + counts.notRun > 0) return 'PLANNED';
  return 'NOT-STARTED';
}
