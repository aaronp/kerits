import { describe, expect, it, afterAll } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ScenarioObservation } from './scenario-types.js';
import type { Capability, Domain, Functionality, Layer } from './types.js';
import {
  __appendObservation,
  __getRegisteredDefinitions,
  scenario,
} from './scenario.js';

// --- Test-local fixture data (no dependency on any consumer's registry) ---
const testLayer: Layer = { id: 'test-layer', description: 'Test layer' };
const testDomain: Domain = { id: 'test-domain', description: 'Test domain' };
const testCap: Capability = {
  id: 'test-cap', domain: testDomain, layers: [testLayer],
  purpose: 'Test capability for scenario.test.ts',
};
const testFunc1: Functionality = {
  id: 'test-func-1', capability: testCap,
  description: 'First test functionality',
};
const testFunc2: Functionality = {
  id: 'test-func-2', capability: testCap,
  description: 'Second test functionality',
};

const EVIDENCE_DIR = mkdtempSync(join(tmpdir(), 'kerits-arch-evidence-'));
process.env.KERITS_EVIDENCE_DIR = EVIDENCE_DIR;
process.env.KERITS_RUN_ID = 'test-run-scenario';

afterAll(() => {
  rmSync(EVIDENCE_DIR, { recursive: true, force: true });
  delete process.env.KERITS_EVIDENCE_DIR;
  delete process.env.KERITS_RUN_ID;
});

function readAllObservations(): ScenarioObservation[] {
  if (!existsSync(EVIDENCE_DIR)) return [];
  const files = readdirSync(EVIDENCE_DIR).filter((f) => f.endsWith('.jsonl'));
  return files.flatMap((f) =>
    readFileSync(join(EVIDENCE_DIR, f), 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ScenarioObservation),
  );
}

// --- Path 1: exercise __appendObservation directly (failure recording) ---

describe('__appendObservation (internal, direct invocation)', () => {
  it('appends a failed observation with error text when given an Error', () => {
    __appendObservation(
      { id: 'fail-direct', functionality: testFunc1, description: 'direct failure record' },
      'failed', 12.5, new Error('boom'),
    );
    const obs = readAllObservations();
    const match = obs.find((o) => o.fullScenarioId === 'test-cap/test-func-1/fail-direct');
    expect(match).toBeDefined();
    expect(match!.status).toBe('failed');
    expect(match!.error ?? '').toContain('boom');
    expect(match!.durationMs).toBe(12.5);
  });
});

// --- Path 2: scenario() at describe-scope registers a definition ---

describe('scenario() — definition registration', () => {
  scenario(
    { id: 'register-probe', functionality: testFunc1, description: 'probe registration' },
    () => { expect(1 + 1).toBe(2); },
  );

  it('registers a ScenarioDefinition with source capture in the catalog', () => {
    const defs = __getRegisteredDefinitions();
    const probe = defs.find((d) => d.id === 'register-probe');
    expect(probe).toBeDefined();
    expect(probe!.functionality).toBe(testFunc1);
    expect(probe!.description).toBe('probe registration');
    expect(probe!.sourceFile ?? '').toContain('scenario.test.ts');
    expect(typeof probe!.sourceLine).toBe('number');
  });
});

// --- Path 3: scenario() passing / todo / skip paths write observations ---

describe('scenario() — passing / todo / skip observation shapes', () => {
  scenario(
    { id: 'pass-1', functionality: testFunc1, description: 'asserts true' },
    () => { expect(true).toBe(true); },
  );

  scenario.todo({
    id: 'todo-1', functionality: testFunc2, description: 'pending implementation',
  });

  scenario.skip(
    { id: 'skip-1', functionality: testFunc2, description: 'skipped for now' },
    () => { expect(true).toBe(true); },
  );

  it('records observations for passed, todo, and skipped scenarios with correct linkage', () => {
    const obs = readAllObservations();

    const pass = obs.find((o) => o.fullScenarioId === 'test-cap/test-func-1/pass-1');
    expect(pass).toBeDefined();
    expect(pass!.status).toBe('passed');
    expect(pass!.functionalityId).toBe('test-func-1');
    expect(pass!.capabilityId).toBe('test-cap');
    expect(pass!.domainId).toBe('test-domain');
    expect(pass!.layerIds).toEqual(['test-layer']);
    expect(typeof pass!.durationMs).toBe('number');
    expect(pass!.runId).toBe('test-run-scenario');

    const todo = obs.find((o) => o.fullScenarioId === 'test-cap/test-func-2/todo-1');
    expect(todo).toBeDefined();
    expect(todo!.status).toBe('todo');

    const skip = obs.find((o) => o.fullScenarioId === 'test-cap/test-func-2/skip-1');
    expect(skip).toBeDefined();
    expect(skip!.status).toBe('skipped');
  });
});

// --- Path 4: catalog dump in catalog-only mode ---

describe('scenario() — catalog dump in catalog-only mode', () => {
  it('writes scenarios.index.json when catalog-only is active and process exits', () => {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const archDir = resolve(thisDir); // packages/architecture/src/

    const evidenceDir = mkdtempSync(join(tmpdir(), 'kerits-catalog-dump-'));
    try {
      // Use inline fixture data in the subprocess — no imports from any consumer registry.
      const script =
        `import { scenario } from '${archDir}/index.ts';\n` +
        `const layer = { id: 'test', description: 'test' };\n` +
        `const domain = { id: 'test', description: 'test' };\n` +
        `const cap = { id: 'test-cap', domain, layers: [layer], purpose: 'test' };\n` +
        `const func = { id: 'test-func', capability: cap, description: 'test' };\n` +
        `scenario({ id: 'probe', functionality: func, description: 'probe' }, () => {});`;

      const result = spawnSync(
        'bun', ['-e', script],
        {
          env: {
            ...process.env,
            KERITS_CATALOG_ONLY: '1',
            KERITS_EVIDENCE_DIR: evidenceDir,
            KERITS_RUN_ID: 'catalog-dump-test',
          },
          encoding: 'utf-8',
        },
      );

      expect(result.status).toBe(0);
      const indexPath = join(evidenceDir, 'scenarios.index.json');
      expect(existsSync(indexPath)).toBe(true);
      const defs = JSON.parse(readFileSync(indexPath, 'utf-8'));
      expect(Array.isArray(defs)).toBe(true);
      expect(defs).toHaveLength(1);
      expect(defs[0].id).toBe('probe');
      expect(defs[0].functionality.id).toBe('test-func');
    } finally {
      rmSync(evidenceDir, { recursive: true, force: true });
    }
  });

  it('preserves covers and annotations through the catalog JSON', () => {
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const archDir = resolve(thisDir);
    const evidenceDir = mkdtempSync(join(tmpdir(), 'kerits-catalog-covers-'));
    try {
      // Use inline fixture data in the subprocess — no imports from any consumer registry.
      const script =
        `import { scenario } from '${archDir}/index.ts';\n` +
        `const layer = { id: 'test', description: 'test' };\n` +
        `const domain = { id: 'test', description: 'test' };\n` +
        `const cap = { id: 'test-cap', domain, layers: [layer], purpose: 'test', invariants: [{ id: 'deterministic', statement: 'test invariant' }] };\n` +
        `const func = { id: 'test-func', capability: cap, description: 'test' };\n` +
        `scenario({ id: 'probe', functionality: func, description: 'probe',\n` +
        `  covers: ['deterministic'], annotations: ['a note'] }, () => {});`;

      const result = spawnSync(
        'bun',
        ['-e', script],
        {
          env: {
            ...process.env,
            KERITS_CATALOG_ONLY: '1',
            KERITS_EVIDENCE_DIR: evidenceDir,
            KERITS_RUN_ID: 'catalog-dump-covers-test',
          },
          encoding: 'utf-8',
        },
      );

      expect(result.status).toBe(0);
      const defs = JSON.parse(readFileSync(join(evidenceDir, 'scenarios.index.json'), 'utf-8'));
      expect(defs).toHaveLength(1);
      expect(defs[0].covers).toEqual(['deterministic']);
      expect(defs[0].annotations).toEqual(['a note']);
    } finally {
      rmSync(evidenceDir, { recursive: true, force: true });
    }
  });
});
