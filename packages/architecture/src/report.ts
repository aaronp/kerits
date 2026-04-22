import { rollupStatus } from './rollup.js';
import type {
  DerivedScenarioStatus,
  RollupSummary,
  ScenarioDefinition,
  ScenarioObservation,
} from './scenario-types.js';
import type { Capability, Domain, Functionality, Layer } from './types.js';

export interface RegistryData {
  readonly layers: Record<string, Layer>;
  readonly domains: Record<string, Domain>;
  readonly capabilities: Record<string, Capability>;
  readonly functionality: Record<string, Functionality>;
}

export interface ArchitectureReport {
  readonly byFunctionality: Record<string, RollupSummary>;
  readonly byCapability: Record<string, RollupSummary>;
  readonly byDomain: Record<string, RollupSummary>;
  readonly byLayer: Record<string, RollupSummary>;
  /** Per-scenario derived status, keyed by fullScenarioId. */
  readonly scenarioStatus: Record<string, DerivedScenarioStatus>;
  readonly registry: RegistryData;
  readonly defs: readonly ScenarioDefinition[];
}

type CountBuckets = { -readonly [K in keyof Omit<RollupSummary, 'status'>]: Omit<RollupSummary, 'status'>[K] };

function zero(): CountBuckets {
  return { passed: 0, failed: 0, skipped: 0, todo: 0, notRun: 0 };
}

function toSummary(b: CountBuckets): RollupSummary {
  return { ...b, status: rollupStatus(b) };
}

function add(a: CountBuckets, b: CountBuckets): CountBuckets {
  return {
    passed: a.passed + b.passed,
    failed: a.failed + b.failed,
    skipped: a.skipped + b.skipped,
    todo: a.todo + b.todo,
    notRun: a.notRun + b.notRun,
  };
}

export function deriveArchitectureReport(
  registry: RegistryData,
  defs: readonly ScenarioDefinition[],
  observations: readonly ScenarioObservation[],
): ArchitectureReport {
  const byFunctionality: Record<string, CountBuckets> = {};
  for (const id of Object.keys(registry.functionality)) byFunctionality[id] = zero();

  const obsByFullId = new Map<string, ScenarioObservation>();
  for (const o of observations) obsByFullId.set(o.fullScenarioId, o);

  const scenarioStatus: Record<string, DerivedScenarioStatus> = {};

  for (const def of defs) {
    const fid = def.functionality.id;
    const fullId = `${def.functionality.capability.id}/${fid}/${def.id}`;
    const o = obsByFullId.get(fullId);
    const bucket = byFunctionality[fid]!;
    if (o) {
      scenarioStatus[fullId] = o.status;
      switch (o.status) {
        case 'passed':
          bucket.passed++;
          break;
        case 'failed':
          bucket.failed++;
          break;
        case 'skipped':
          bucket.skipped++;
          break;
        case 'todo':
          bucket.todo++;
          break;
      }
    } else {
      scenarioStatus[fullId] = 'not-run';
      bucket.notRun++;
    }
  }

  // Roll up to capability
  const byCapability: Record<string, CountBuckets> = {};
  for (const id of Object.keys(registry.capabilities)) byCapability[id] = zero();
  for (const [fid, buckets] of Object.entries(byFunctionality)) {
    const fn = registry.functionality[fid]!;
    const cap = fn.capability.id;
    byCapability[cap] = add(byCapability[cap]!, buckets);
  }

  // Roll up to domain
  const byDomain: Record<string, CountBuckets> = {};
  for (const id of Object.keys(registry.domains)) byDomain[id] = zero();
  for (const [cap, buckets] of Object.entries(byCapability)) {
    const capEntry = registry.capabilities[cap]!;
    const dom = capEntry.domain.id;
    byDomain[dom] = add(byDomain[dom]!, buckets);
  }

  // Roll up to layer
  const byLayer: Record<string, CountBuckets> = {};
  for (const id of Object.keys(registry.layers)) byLayer[id] = zero();
  for (const [cap, buckets] of Object.entries(byCapability)) {
    const capEntry = registry.capabilities[cap]!;
    for (const layer of capEntry.layers) {
      byLayer[layer.id] = add(byLayer[layer.id]!, buckets);
    }
  }

  const finalize = (r: Record<string, CountBuckets>): Record<string, RollupSummary> => {
    const out: Record<string, RollupSummary> = {};
    for (const [k, v] of Object.entries(r)) out[k] = toSummary(v);
    return out;
  };

  return {
    byFunctionality: finalize(byFunctionality),
    byCapability: finalize(byCapability),
    byDomain: finalize(byDomain),
    byLayer: finalize(byLayer),
    scenarioStatus,
    registry,
    defs,
  };
}
