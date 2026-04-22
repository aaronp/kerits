import { describe, expect, it } from 'bun:test';
import type { RegistryData } from './report.js';
import type { ScenarioDefinition } from './scenario-types.js';
import { validateCatalog } from './validate.js';

// ---------------------------------------------------------------------------
// Minimal fixture helpers
// ---------------------------------------------------------------------------

function makeRegistry(overrides?: Partial<RegistryData>): RegistryData {
  return {
    layers: {
      'api-layer': { id: 'api-layer', description: 'API layer' },
    },
    domains: {
      'messaging': { id: 'messaging', description: 'Messaging domain' },
    },
    capabilities: {
      'messaging/channel': {
        id: 'messaging/channel',
        domain: { id: 'messaging', description: 'Messaging domain' },
        layers: [{ id: 'api-layer', description: 'API layer' }],
        purpose: 'Channel capability',
      },
    },
    functionality: {
      'channel/send': {
        id: 'channel/send',
        capability: {
          id: 'messaging/channel',
          domain: { id: 'messaging', description: 'Messaging domain' },
          layers: [{ id: 'api-layer', description: 'API layer' }],
          purpose: 'Channel capability',
        },
        description: 'Send functionality',
      },
    },
    ...overrides,
  };
}

function makeDef(
  id: string,
  functionalityId = 'channel/send',
  capabilityId = 'messaging/channel',
  opts?: { sourceFile?: string; sourceLine?: number },
): ScenarioDefinition {
  return {
    id,
    functionality: {
      id: functionalityId,
      capability: {
        id: capabilityId,
        domain: { id: 'messaging', description: 'Messaging domain' },
        layers: [{ id: 'api-layer', description: 'API layer' }],
        purpose: 'Channel capability',
      },
      description: 'Send functionality',
    },
    description: `Scenario ${id}`,
    sourceFile: opts?.sourceFile ?? 'some/file.ts',
    sourceLine: opts?.sourceLine ?? 10,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateCatalog', () => {
  it('returns ok with no errors or warnings for a valid catalog', () => {
    const registry = makeRegistry();
    const defs = [makeDef('scenario-1')];
    const report = validateCatalog(registry, defs);

    expect(report.ok).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.warnings).toHaveLength(0);
    expect(report.fullScenarioIds).toContain('messaging/channel/channel/send/scenario-1');
  });

  it('reports unknown-functionality when scenario references a functionality not in registry', () => {
    const registry = makeRegistry();
    const def = makeDef('scenario-1', 'channel/nonexistent');
    const report = validateCatalog(registry, [def]);

    expect(report.ok).toBe(false);
    const err = report.errors.find((e) => e.kind === 'unknown-functionality');
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      kind: 'unknown-functionality',
      functionalityId: 'channel/nonexistent',
    });
  });

  it('reports orphan-functionality when functionality references unknown capability', () => {
    // Capability "messaging/channel" is removed from registry but functionality still points to it
    const registry = makeRegistry({
      capabilities: {},
    });
    const defs = [makeDef('scenario-1')];
    const report = validateCatalog(registry, defs);

    expect(report.ok).toBe(false);
    const err = report.errors.find((e) => e.kind === 'orphan-functionality');
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      kind: 'orphan-functionality',
      functionalityId: 'channel/send',
      capabilityId: 'messaging/channel',
    });
  });

  it('reports duplicate-full-id when two scenarios share the same full ID', () => {
    const registry = makeRegistry();
    const def1 = makeDef('dup-scenario', 'channel/send', 'messaging/channel', {
      sourceFile: 'a.ts',
      sourceLine: 1,
    });
    const def2 = makeDef('dup-scenario', 'channel/send', 'messaging/channel', {
      sourceFile: 'b.ts',
      sourceLine: 2,
    });
    const report = validateCatalog(registry, [def1, def2]);

    expect(report.ok).toBe(false);
    const err = report.errors.find((e) => e.kind === 'duplicate-full-id');
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      kind: 'duplicate-full-id',
      fullScenarioId: 'messaging/channel/channel/send/dup-scenario',
    });
    // Should list both sources
    if (err?.kind === 'duplicate-full-id') {
      expect(err.sources).toHaveLength(2);
    }
  });

  it('warns on functionality-without-scenarios for functionalities that have no scenarios', () => {
    const registry = makeRegistry();
    // No defs at all → "channel/send" has no scenarios
    const report = validateCatalog(registry, []);

    expect(report.ok).toBe(true); // warnings don't make ok false
    expect(report.errors).toHaveLength(0);
    const warn = report.warnings.find((w) => w.kind === 'functionality-without-scenarios');
    expect(warn).toBeDefined();
    expect(warn).toMatchObject({
      kind: 'functionality-without-scenarios',
      functionalityId: 'channel/send',
    });
  });

  it('reports unknown-domain when capability references a domain not in registry', () => {
    const registry = makeRegistry({
      domains: {}, // messaging domain removed
    });
    const defs = [makeDef('scenario-1')];
    const report = validateCatalog(registry, defs);

    expect(report.ok).toBe(false);
    const err = report.errors.find((e) => e.kind === 'unknown-domain');
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      kind: 'unknown-domain',
      capabilityId: 'messaging/channel',
      domainId: 'messaging',
    });
  });

  it('reports unknown-layer when capability references a layer not in registry', () => {
    const registry = makeRegistry({
      layers: {}, // api-layer removed
    });
    const defs = [makeDef('scenario-1')];
    const report = validateCatalog(registry, defs);

    expect(report.ok).toBe(false);
    const err = report.errors.find((e) => e.kind === 'unknown-layer');
    expect(err).toBeDefined();
    expect(err).toMatchObject({
      kind: 'unknown-layer',
      capabilityId: 'messaging/channel',
      layerId: 'api-layer',
    });
  });

  it('reports duplicate IDs within a registry kind (object key collision is not testable; checks distinct fullIds from distinct defs)', () => {
    // Object keys are inherently unique; this test verifies that identical
    // fullScenarioId entries from two defs yield a duplicate-full-id error.
    const registry = makeRegistry();
    const def1 = makeDef('same-id');
    const def2 = makeDef('same-id');
    const report = validateCatalog(registry, [def1, def2]);

    expect(report.errors.some((e) => e.kind === 'duplicate-full-id')).toBe(true);
  });
});
