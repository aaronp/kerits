import type { ScenarioDefinition, ScenarioObservation } from '@kerits/architecture';
import { deriveArchitectureReport, renderCapabilitiesMdx, renderStatusMdx } from '@kerits/architecture';
import { capabilities, domains, functionality, layers } from './registry.js';

const coreRegistry = { layers, domains, capabilities, functionality };

export function renderCapabilitiesBody(
  defs: readonly ScenarioDefinition[],
  observations: readonly ScenarioObservation[],
): string {
  const report = deriveArchitectureReport(coreRegistry, defs, observations);
  return renderCapabilitiesMdx(report, {
    baseUrl: 'https://github.com/aaronp/kerits/blob/master',
    packagePrefix: 'packages/core/',
  });
}

export function renderStatusBody(
  defs: readonly ScenarioDefinition[],
  observations: readonly ScenarioObservation[],
): string {
  const report = deriveArchitectureReport(coreRegistry, defs, observations);
  return renderStatusMdx(report);
}
