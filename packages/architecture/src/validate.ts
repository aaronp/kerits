import type { RegistryData } from './report.js';
import type { ScenarioDefinition } from './scenario-types.js';

export type ValidationError =
  | { kind: 'duplicate-full-id'; fullScenarioId: string; sources: readonly string[] }
  | { kind: 'unknown-functionality'; scenarioId: string; functionalityId: string }
  | { kind: 'unknown-capability'; functionalityId: string; capabilityId: string }
  | { kind: 'unknown-domain'; capabilityId: string; domainId: string }
  | { kind: 'unknown-layer'; capabilityId: string; layerId: string }
  | { kind: 'orphan-functionality'; functionalityId: string; capabilityId: string }
  | { kind: 'unresolved-invariant-id'; invariantId: string; scenarioId: string; capabilityId: string }
  | { kind: 'uncovered-invariant'; invariantId: string; capabilityId: string };

export type ValidationWarning = { kind: 'functionality-without-scenarios'; functionalityId: string };

export interface CatalogReport {
  readonly ok: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly fullScenarioIds: readonly string[];
}

function sourceLabel(def: ScenarioDefinition): string {
  const file = def.sourceFile ?? '<unknown>';
  const line = def.sourceLine != null ? `:${def.sourceLine}` : '';
  return `${file}${line}`;
}

export function validateCatalog(registry: RegistryData, defs: readonly ScenarioDefinition[]): CatalogReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // -------------------------------------------------------------------------
  // 1. Validate capability → domain references
  // -------------------------------------------------------------------------
  for (const [capId, cap] of Object.entries(registry.capabilities)) {
    if (!registry.domains[cap.domain.id]) {
      errors.push({ kind: 'unknown-domain', capabilityId: capId, domainId: cap.domain.id });
    }
    for (const layer of cap.layers) {
      if (!registry.layers[layer.id]) {
        errors.push({ kind: 'unknown-layer', capabilityId: capId, layerId: layer.id });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 2. Validate functionality → capability references (orphan-functionality)
  // -------------------------------------------------------------------------
  for (const [fid, fn] of Object.entries(registry.functionality)) {
    if (!registry.capabilities[fn.capability.id]) {
      errors.push({
        kind: 'orphan-functionality',
        functionalityId: fid,
        capabilityId: fn.capability.id,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 3. Validate scenario → functionality references + detect duplicates
  // -------------------------------------------------------------------------
  // Map: fullScenarioId → source labels (for duplicate detection)
  const seenIds = new Map<string, string[]>();

  for (const def of defs) {
    const fid = def.functionality.id;
    const capId = def.functionality.capability.id;
    const fullId = `${capId}/${fid}/${def.id}`;

    // Check functionality exists in registry
    if (!registry.functionality[fid]) {
      errors.push({
        kind: 'unknown-functionality',
        scenarioId: def.id,
        functionalityId: fid,
      });
    }

    // Validate covers: each referenced invariant id must exist in the capability
    if (def.covers && def.covers.length > 0) {
      const cap = registry.capabilities[capId];
      const validInvariantIds = new Set((cap?.invariants ?? []).map((inv) => (typeof inv === 'string' ? inv : inv.id)));
      for (const invId of def.covers) {
        if (!validInvariantIds.has(invId)) {
          errors.push({
            kind: 'unresolved-invariant-id',
            invariantId: invId,
            scenarioId: def.id,
            capabilityId: capId,
          });
        }
      }
    }

    // Track for duplicate detection
    const label = sourceLabel(def);
    const existing = seenIds.get(fullId);
    if (existing) {
      existing.push(label);
    } else {
      seenIds.set(fullId, [label]);
    }
  }

  // Emit duplicate-full-id errors
  for (const [fullId, sources] of seenIds) {
    if (sources.length > 1) {
      errors.push({ kind: 'duplicate-full-id', fullScenarioId: fullId, sources });
    }
  }

  // -------------------------------------------------------------------------
  // 4. Check that every declared capability invariant is covered by at least one scenario
  // -------------------------------------------------------------------------
  const coveredByCap = new Map<string, Set<string>>();
  for (const def of defs) {
    if (!def.covers || def.covers.length === 0) continue;
    const capId = def.functionality.capability.id;
    let set = coveredByCap.get(capId);
    if (!set) {
      set = new Set();
      coveredByCap.set(capId, set);
    }
    for (const invId of def.covers) set.add(invId);
  }

  for (const [capId, cap] of Object.entries(registry.capabilities)) {
    if (!cap.invariants || cap.invariants.length === 0) continue;
    const covered = coveredByCap.get(capId) ?? new Set<string>();
    for (const inv of cap.invariants) {
      const invId = typeof inv === 'string' ? inv : inv.id;
      if (!covered.has(invId)) {
        errors.push({ kind: 'uncovered-invariant', invariantId: invId, capabilityId: capId });
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Warn on functionalities with zero scenarios
  // -------------------------------------------------------------------------
  const functionalitiesWithScenarios = new Set<string>();
  for (const def of defs) {
    functionalitiesWithScenarios.add(def.functionality.id);
  }
  for (const fid of Object.keys(registry.functionality)) {
    if (!functionalitiesWithScenarios.has(fid)) {
      warnings.push({ kind: 'functionality-without-scenarios', functionalityId: fid });
    }
  }

  // -------------------------------------------------------------------------
  // Build full scenario ID list (unique, from seen map)
  // -------------------------------------------------------------------------
  const fullScenarioIds = Array.from(seenIds.keys());

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    fullScenarioIds,
  };
}
