import { describe, expect, it } from 'bun:test';
import type { ScenarioObservation } from './scenario-types.js';
import { mergeObservations } from './merge-evidence-lib.js';

function obs(partial: Partial<ScenarioObservation>): ScenarioObservation {
  return {
    fullScenarioId: 'cap/func/id',
    functionalityId: 'said-encode',
    capabilityId: 'said-computation',
    domainId: 'SAID',
    layerIds: ['core'],
    status: 'passed',
    runId: 'r1',
    timestamp: '2026-04-16T00:00:00.000Z',
    ...partial,
  } as ScenarioObservation;
}

describe('mergeObservations', () => {
  it('returns [] for empty input', () => {
    expect(mergeObservations([])).toEqual([]);
  });

  it('returns the single observation when one is present', () => {
    const o = obs({ fullScenarioId: 'a/b/c' });
    const merged = mergeObservations([o]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(o);
  });

  it('keeps only observations from the latest run id per fullScenarioId', () => {
    const older = obs({ fullScenarioId: 'x', runId: 'r1', status: 'failed' });
    const newer = obs({ fullScenarioId: 'x', runId: 'r2', status: 'passed' });
    const merged = mergeObservations([older, newer]);
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('passed');
    expect(merged[0].runId).toBe('r2');
  });

  it('treats lexicographically greater runId as newer', () => {
    // runIds are ISO-like timestamps (module-load default). Lex order === chrono order.
    const a = obs({ fullScenarioId: 'x', runId: '2026-04-01', status: 'passed' });
    const b = obs({ fullScenarioId: 'x', runId: '2026-04-02', status: 'failed' });
    const merged = mergeObservations([a, b]);
    expect(merged[0].runId).toBe('2026-04-02');
    expect(merged[0].status).toBe('failed');
  });

  it('reduces multiple observations from the same run by severity: failed > passed > skipped > todo', () => {
    const passed  = obs({ fullScenarioId: 'x', runId: 'r', status: 'passed'  });
    const failed  = obs({ fullScenarioId: 'x', runId: 'r', status: 'failed'  });
    const skipped = obs({ fullScenarioId: 'x', runId: 'r', status: 'skipped' });
    const todo    = obs({ fullScenarioId: 'x', runId: 'r', status: 'todo'    });
    expect(mergeObservations([passed, failed, skipped, todo])[0].status).toBe('failed');
    expect(mergeObservations([passed, skipped, todo])[0].status).toBe('passed');
    expect(mergeObservations([skipped, todo])[0].status).toBe('skipped');
    expect(mergeObservations([todo])[0].status).toBe('todo');
  });

  it('breaks severity ties by latest timestamp', () => {
    const earlier = obs({ fullScenarioId: 'x', runId: 'r', status: 'passed', timestamp: '2026-04-16T00:00:00.000Z' });
    const later   = obs({ fullScenarioId: 'x', runId: 'r', status: 'passed', timestamp: '2026-04-16T00:00:01.000Z' });
    expect(mergeObservations([earlier, later])[0].timestamp).toBe('2026-04-16T00:00:01.000Z');
  });

  it('handles multiple distinct fullScenarioIds independently', () => {
    const a = obs({ fullScenarioId: 'a', runId: 'r', status: 'passed' });
    const b = obs({ fullScenarioId: 'b', runId: 'r', status: 'failed' });
    const merged = mergeObservations([a, b]);
    expect(merged).toHaveLength(2);
    const ids = merged.map((m) => m.fullScenarioId).sort();
    expect(ids).toEqual(['a', 'b']);
  });
});
