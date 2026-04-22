#!/usr/bin/env bun
/**
 * check-scenarios.ts
 *
 * Validates scenario definitions and architecture linkage; emits the
 * catalog to <evidence-dir>/scenarios.index.json.
 *
 * Strategy:
 *   1. Write a temporary bun test preload file that uses afterAll() to
 *      export the per-worker scenario catalog to a per-pid JSONL staging
 *      file. (process.on('exit') is not fired by bun test workers, but
 *      afterAll() is — this is the correct hook for bun test.)
 *   2. Spawn `bun test packages/core/src/said` with KERITS_CATALOG_ONLY=1 and
 *      --preload <tmpfile>. In catalog-only mode, scenario() registers
 *      definitions but suppresses it() so tests don't run.
 *   3. Merge the per-pid JSONL staging files into scenarios.index.json,
 *      validate structurally (by id, since deserialized functionality refs
 *      are not `===` to the registry consts), print the report.
 *   4. Exit 1 on errors; 0 otherwise.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { resolveEvidenceDir } from '../src/architecture/evidence-paths.ts';
import { capabilities, domains, functionality as functionalityRegistry, layers } from '../src/architecture/registry.ts';

const PKG_ROOT = resolve(import.meta.dir, '..');
const ARCH_SRC = resolve(import.meta.dir, '../src/architecture');

interface RawCatalogEntry {
  id: string;
  description: string;
  sourceFile?: string;
  sourceLine?: number;
  covers?: string[];
  functionality: {
    id: string;
    capability: { id: string; domain: { id: string }; layers: { id: string }[] };
  };
}

interface Report {
  ok: boolean;
  errors: string[];
  warnings: string[];
  count: number;
}

function validateRaw(defs: RawCatalogEntry[]): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenFullIds = new Map<string, number>();
  const functionalitiesWithDefs = new Set<string>();

  for (const d of defs) {
    const fid = d.functionality?.id;
    const cid = d.functionality?.capability?.id;
    const did = d.functionality?.capability?.domain?.id;
    const lids = d.functionality?.capability?.layers?.map((l) => l.id) ?? [];

    if (!fid || !(fid in functionalityRegistry)) {
      errors.push(`unreachable-functionality: scenario '${d.id}' references unknown functionality '${fid ?? '?'}'`);
      continue;
    }
    if (!cid || !(cid in capabilities)) {
      errors.push(`unknown-capability: scenario '${d.id}' references unknown capability '${cid ?? '?'}'`);
      continue;
    }
    if (!did || !(did in domains)) {
      errors.push(`unknown-domain: scenario '${d.id}' references unknown domain '${did ?? '?'}'`);
      continue;
    }
    for (const lid of lids) {
      if (!(lid in layers)) {
        errors.push(`unknown-layer: scenario '${d.id}' references unknown layer '${lid}'`);
      }
    }

    // unresolved-invariant-id: every covers entry must resolve against the scenario's capability.
    if (d.covers && d.covers.length > 0) {
      const capEntry = cid && cid in capabilities ? capabilities[cid as keyof typeof capabilities] : undefined;
      const capInvIds = new Set((capEntry?.invariants ?? []).map((i) => i.id));
      for (const inv of d.covers) {
        if (!capInvIds.has(inv)) {
          errors.push(
            `unresolved-invariant-id: scenario '${d.id}' covers unknown invariant ` + `'${inv}' on capability '${cid}'`,
          );
        }
      }
    }

    functionalitiesWithDefs.add(fid);
    const fullId = `${cid}/${fid}/${d.id}`;
    const prev = seenFullIds.get(fullId) ?? 0;
    seenFullIds.set(fullId, prev + 1);
  }

  for (const [fullId, count] of seenFullIds) {
    if (count > 1) errors.push(`duplicate-full-id: ${fullId} occurs ${count} times`);
  }

  // uncovered-invariant: every declared capability invariant must have >=1 covering scenario.
  const coveredByCap = new Map<string, Set<string>>();
  for (const d of defs) {
    if (!d.covers || d.covers.length === 0) continue;
    const capId = d.functionality?.capability?.id;
    if (!capId) continue;
    let set = coveredByCap.get(capId);
    if (!set) {
      set = new Set();
      coveredByCap.set(capId, set);
    }
    for (const inv of d.covers) set.add(inv);
  }
  for (const cap of Object.values(capabilities)) {
    if (!cap.invariants || cap.invariants.length === 0) continue;
    const covered = coveredByCap.get(cap.id) ?? new Set<string>();
    for (const inv of cap.invariants) {
      if (!covered.has(inv.id)) {
        errors.push(
          `uncovered-invariant: capability '${cap.id}' has uncovered invariant '${inv.id}' ` +
            `(add a scenario with covers: ['${inv.id}'])`,
        );
      }
    }
  }

  for (const id of Object.keys(functionalityRegistry)) {
    if (!functionalitiesWithDefs.has(id)) {
      warnings.push(`functionality-without-scenarios: ${id}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, count: defs.length };
}

function main(): number {
  const evidenceDir = resolveEvidenceDir(process.env);
  const indexPath = join(evidenceDir, 'scenarios.index.json');
  mkdirSync(evidenceDir, { recursive: true });

  // Staging dir for per-worker JSONL catalog slices.
  const stagingDir = mkdtempSync(join(tmpdir(), 'kerits-catalog-staging-'));

  // Generate a temporary preload file.  The preload runs inside each bun test
  // worker process and uses afterAll() (which fires reliably in bun workers,
  // unlike process.on('exit') which bun suppresses) to dump the per-worker
  // catalog slice to a per-pid JSONL file in the staging dir.
  const preloadPath = join(stagingDir, 'catalog-preload.ts');
  const preloadSrc = [
    `import { afterAll } from 'bun:test';`,
    `import { appendFileSync, mkdirSync } from 'node:fs';`,
    `import { join } from 'node:path';`,
    `import { __getRegisteredDefinitions } from '${ARCH_SRC}/scenario.ts';`,
    ``,
    `afterAll(() => {`,
    `  const stagingDir = ${JSON.stringify(stagingDir)};`,
    `  mkdirSync(stagingDir, { recursive: true });`,
    `  const defs = __getRegisteredDefinitions();`,
    `  if (defs.length === 0) return;`,
    `  const slicePath = join(stagingDir, 'pid-' + process.pid + '.jsonl');`,
    `  for (const def of defs) {`,
    `    appendFileSync(slicePath, JSON.stringify(def) + '\\n');`,
    `  }`,
    `});`,
  ].join('\n');
  writeFileSync(preloadPath, preloadSrc);

  console.log(`[check-scenarios] catalog-only test pass → ${indexPath}`);

  const result = spawnSync(
    'bun',
    ['test', '--preload', preloadPath, 'src/said', 'src/kel/__tests__/validation.test.ts'],
    {
      cwd: PKG_ROOT,
      env: {
        ...process.env,
        KERITS_CATALOG_ONLY: '1',
        KERITS_EVIDENCE_DIR: evidenceDir,
      },
      stdio: 'inherit',
    },
  );

  // Merge per-worker JSONL slices into the catalog.
  const sliceFiles = readdirSync(stagingDir).filter((f) => f.endsWith('.jsonl'));
  const allDefs: RawCatalogEntry[] = sliceFiles.flatMap((f) =>
    readFileSync(join(stagingDir, f), 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RawCatalogEntry),
  );

  // Clean up staging dir before further work — we've read everything we need.
  rmSync(stagingDir, { recursive: true, force: true });

  if (allDefs.length === 0) {
    if (result.status !== 0) {
      console.error(
        `[check-scenarios] catalog-only test pass exited ${result.status} and no scenarios were registered`,
      );
    } else {
      console.error(`[check-scenarios] scenarios.index.json would be empty — no scenario() calls were reached`);
      console.error('Likely cause: no scenario() calls were imported during the catalog pass.');
    }
    return 1;
  }

  // Validate FIRST, over the full (possibly-duplicate) list, so real
  // user-authored duplicates are caught and reported.
  const report = validateRaw(allDefs);

  console.log(`[check-scenarios] ${report.count} scenarios registered.`);
  for (const w of report.warnings) console.warn(`[warn] ${w}`);
  for (const e of report.errors) console.error(`[error] ${e}`);

  if (!report.ok) {
    return 1;
  }

  // Validation passed — dedupe defensively (bun may share module state across
  // workers in future versions) and write the catalog atomically.
  const seen = new Set<string>();
  const dedupedDefs = allDefs.filter((d) => {
    const key = `${d.functionality?.capability?.id}/${d.functionality?.id}/${d.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const tmpPath = `${indexPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(dedupedDefs, null, 2));
  renameSync(tmpPath, indexPath);

  return 0;
}

process.exit(main());
