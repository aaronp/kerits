import type { ObservationStatus, ScenarioObservation } from './scenario-types.js';

const SEVERITY: Record<ObservationStatus, number> = {
  failed: 4,
  passed: 3,
  skipped: 2,
  todo: 1,
};

/**
 * Reduce many observations to at most one per fullScenarioId.
 *
 * Algorithm (single pass):
 *   1. Group by fullScenarioId.
 *   2. Within each group, keep observations whose runId equals the max runId.
 *   3. If >1 remain, reduce by severity, tie-break by latest timestamp.
 */
export function mergeObservations(all: readonly ScenarioObservation[]): ScenarioObservation[] {
  const groups = new Map<string, ScenarioObservation[]>();
  for (const o of all) {
    const list = groups.get(o.fullScenarioId) ?? [];
    list.push(o);
    groups.set(o.fullScenarioId, list);
  }

  const result: ScenarioObservation[] = [];
  for (const [, group] of groups) {
    const maxRunId = group.map((o) => o.runId ?? '').reduce((a, b) => (a >= b ? a : b), '');
    const latest = group.filter((o) => (o.runId ?? '') === maxRunId);
    if (latest.length === 1) {
      result.push(latest[0]!);
      continue;
    }
    const winner = latest.reduce((best, o) => {
      const bSev = SEVERITY[best.status];
      const oSev = SEVERITY[o.status];
      if (oSev > bSev) return o;
      if (oSev < bSev) return best;
      return o.timestamp > best.timestamp ? o : best;
    });
    result.push(winner);
  }
  return result;
}
