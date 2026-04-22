import { describe, expect, test } from 'bun:test';
import { deriveArchitectureReport } from './report.js';
import type { Capability, Domain, Functionality, Layer } from './types.js';
import type { ScenarioDefinition, ScenarioObservation } from './scenario-types.js';

const layer: Layer = { id: 'test-layer', description: 'Test' };
const domain: Domain = { id: 'test-domain', description: 'Test' };
const cap: Capability = {
  id: 'test-cap', domain, layers: [layer],
  purpose: 'Test capability',
};
const func: Functionality = {
  id: 'test-func', capability: cap,
  description: 'Test functionality',
};

const registry = {
  layers: { 'test-layer': layer },
  domains: { 'test-domain': domain },
  capabilities: { 'test-cap': cap },
  functionality: { 'test-func': func },
};

describe('deriveArchitectureReport', () => {
  test('counts a passing scenario', () => {
    const def: ScenarioDefinition = {
      id: 'sc1', functionality: func, description: 'Test scenario',
    };
    const obs: ScenarioObservation = {
      fullScenarioId: 'test-cap/test-func/sc1',
      functionalityId: 'test-func',
      capabilityId: 'test-cap',
      domainId: 'test-domain',
      layerIds: ['test-layer'],
      status: 'passed',
      durationMs: 10,
      timestamp: '2026-01-01T00:00:00Z',
    };
    const report = deriveArchitectureReport(registry, [def], [obs]);
    expect(report.byFunctionality['test-func']!.passed).toBe(1);
    expect(report.byFunctionality['test-func']!.status).toBe('VERIFIED');
    expect(report.byCapability['test-cap']!.status).toBe('VERIFIED');
  });

  test('marks unobserved scenarios as not-run', () => {
    const def: ScenarioDefinition = {
      id: 'sc1', functionality: func, description: 'Test scenario',
    };
    const report = deriveArchitectureReport(registry, [def], []);
    expect(report.byFunctionality['test-func']!.notRun).toBe(1);
    expect(report.byFunctionality['test-func']!.status).toBe('PLANNED');
  });
});
