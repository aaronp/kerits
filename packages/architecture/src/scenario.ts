import { it } from 'bun:test';
import { appendFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { captureSource } from './capture-source.js';
import { isCatalogOnly, resolveEvidenceDir, resolveEvidenceFilename, resolveRunId } from './evidence-paths.js';
import type { ObservationStatus, ScenarioDefinition, ScenarioObservation } from './scenario-types.js';

/**
 * Resolve the monorepo root once at module load.
 *
 * Strategy (first match wins):
 *   1. KERITS_REPO_ROOT env var (escape hatch for unusual environments)
 *   2. Walk up from this module's directory until a `.git` entry is found
 *   3. undefined — captureSource returns absolute paths, and a one-line
 *      warning is emitted so contributors notice before the diff gate
 *
 * Must complete before any scenario() call registers a definition.
 */
function resolveMonorepoRoot(): string | undefined {
  const override = process.env.KERITS_REPO_ROOT;
  if (override) return override;

  let dir = import.meta.dir;
  while (true) {
    if (existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }

  // eslint-disable-next-line no-console
  console.warn(
    '[kerits/architecture] could not locate monorepo root (no .git ancestor, ' +
      'no KERITS_REPO_ROOT). Source paths in generated docs will be absolute and the ' +
      'diff gate will likely fail on commit.',
  );
  return undefined;
}

// Frozen at first import — tests that need a different root must use a subprocess.
const MONOREPO_ROOT = resolveMonorepoRoot();

export interface ScenarioFn {
  (def: ScenarioDefinition, fn: () => void | Promise<void>): void;
  todo(def: ScenarioDefinition): void;
  skip(def: ScenarioDefinition, fn: () => void | Promise<void>): void;
}

// Module-local catalog of all scenario definitions registered during this process.
const catalog: ScenarioDefinition[] = [];

// Serialize the catalog to scenarios.index.json on process exit, but only
// when running in catalog-only mode. Using 'exit' is safe here because
// scenario() registrations happen synchronously during module load; no
// asynchronous catalog mutation remains by the time 'exit' fires.
if (isCatalogOnly(process.env)) {
  process.on('exit', () => {
    try {
      const dir = resolveEvidenceDir(process.env);
      mkdirSync(dir, { recursive: true });
      const tmpPath = join(dir, 'scenarios.index.json.tmp');
      const finalPath = join(dir, 'scenarios.index.json');
      // writeFileSync (not append) — a stale .tmp from a prior crashed run
      // must be overwritten, not appended to.
      writeFileSync(tmpPath, JSON.stringify(catalog, null, 2));
      // Atomic rename — avoids partial-write readers on the final path.
      renameSync(tmpPath, finalPath);
    } catch (err) {
      process.exitCode = 1;
      // eslint-disable-next-line no-console
      console.error('[kerits/architecture] failed to write scenarios.index.json:', err);
    }
  });
}

/** @internal Exposed for tests and for check-scenarios.ts. Not re-exported. */
export function __getRegisteredDefinitions(): readonly ScenarioDefinition[] {
  return catalog;
}

/** @internal Clear the catalog — for tests only. Not re-exported. */
export function __resetForTests(): void {
  catalog.length = 0;
}

function fullIdOf(def: ScenarioDefinition): string {
  return `${def.functionality.capability.id}/${def.functionality.id}/${def.id}`;
}

/** @internal Append a single observation synchronously. Exposed for tests. */
export function __appendObservation(
  def: ScenarioDefinition,
  status: ObservationStatus,
  durationMs: number,
  error?: unknown,
): void {
  const dir = resolveEvidenceDir(process.env);
  mkdirSync(dir, { recursive: true });
  const runId = resolveRunId(process.env);
  const file = join(dir, resolveEvidenceFilename({ pid: process.pid, runId }));

  const obs: ScenarioObservation = {
    fullScenarioId: fullIdOf(def),
    functionalityId: def.functionality.id,
    capabilityId: def.functionality.capability.id,
    domainId: def.functionality.capability.domain.id,
    layerIds: def.functionality.capability.layers.map((l) => l.id),
    status,
    durationMs,
    error:
      error instanceof Error
        ? `${error.message}\n${error.stack ?? ''}`
        : error !== undefined
          ? String(error)
          : undefined,
    testFile: def.sourceFile,
    runId,
    timestamp: new Date().toISOString(),
  };

  appendFileSync(file, `${JSON.stringify(obs)}\n`);
}

function registerAndEnrich(def: ScenarioDefinition): ScenarioDefinition {
  const src = captureSource(new Error().stack, MONOREPO_ROOT);
  const enriched = { ...def, ...src };
  catalog.push(enriched);
  return enriched;
}

export const scenario: ScenarioFn = Object.assign(
  (def: ScenarioDefinition, fn: () => void | Promise<void>) => {
    const enriched = registerAndEnrich(def);
    if (isCatalogOnly(process.env)) return;
    it(`[${def.id}] ${def.description}`, async () => {
      const started = performance.now();
      try {
        await fn();
        __appendObservation(enriched, 'passed', performance.now() - started);
      } catch (err) {
        __appendObservation(enriched, 'failed', performance.now() - started, err);
        throw err; // preserve test failure signal
      }
    });
  },
  {
    todo(def: ScenarioDefinition) {
      const enriched = registerAndEnrich(def);
      if (isCatalogOnly(process.env)) return;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      it.todo(`[${def.id}] ${def.description}`, () => {});
      __appendObservation(enriched, 'todo', 0);
    },
    skip(def: ScenarioDefinition, fn: () => void | Promise<void>) {
      const enriched = registerAndEnrich(def);
      if (isCatalogOnly(process.env)) return;
      it.skip(`[${def.id}] ${def.description}`, fn);
      __appendObservation(enriched, 'skipped', 0);
    },
  },
);
