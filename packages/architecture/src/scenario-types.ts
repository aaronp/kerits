import type { Functionality } from './types.js';

export interface ScenarioDefinition {
  readonly id: string; // local, unique within a functionality
  readonly functionality: Functionality;
  readonly description: string;
  /**
   * Invariant IDs this scenario covers. Lexically scoped to the scenario's capability.
   * Validated by check-scenarios.ts; uncovered capability invariants fail the build.
   */
  readonly covers?: readonly string[];
  /**
   * Free-form prose rendered under the scenario in MDX (e.g. "Blocked by PB-012: …").
   * One `_note:_` line per element.
   */
  readonly annotations?: readonly string[];
  readonly sourceFile?: string; // captured via Error.stack
  readonly sourceLine?: number;
}

export type ObservationStatus = 'passed' | 'failed' | 'skipped' | 'todo';

export interface ScenarioObservation {
  readonly fullScenarioId: string; // capability.id + '/' + functionality.id + '/' + scenario.id
  readonly functionalityId: string;
  readonly capabilityId: string;
  readonly domainId: string;
  readonly layerIds: readonly string[];
  readonly status: ObservationStatus;
  readonly durationMs?: number;
  readonly error?: string;
  readonly testFile?: string;
  readonly runId?: string;
  readonly timestamp: string;
}

/** Per-scenario status at render time. `not-run` means defined but unobserved. */
export type DerivedScenarioStatus = ObservationStatus | 'not-run';

/** UPPERCASE rollup status — aggregate across scenarios. */
export type RollupStatus = 'FAILING' | 'VERIFIED' | 'PARTIAL' | 'PLANNED' | 'NOT-STARTED';

export interface RollupSummary {
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly todo: number;
  readonly notRun: number;
  readonly status: RollupStatus;
}
