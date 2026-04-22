import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_LOAD_RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Resolve the directory where per-pid JSONL evidence is written.
 * Override via KERITS_EVIDENCE_DIR; default is
 *   <packages/architecture>/.architecture-evidence
 */
export function resolveEvidenceDir(env: NodeJS.ProcessEnv): string {
  if (env.KERITS_EVIDENCE_DIR && env.KERITS_EVIDENCE_DIR.length > 0) {
    return env.KERITS_EVIDENCE_DIR;
  }
  // This file is at packages/architecture/src/evidence-paths.ts
  // Default directory is packages/architecture/.architecture-evidence
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return resolve(thisDir, '../../.architecture-evidence');
}

/**
 * Run id stable for the duration of a single test process.
 * Override via KERITS_RUN_ID; default captures module-load time.
 */
export function resolveRunId(env: NodeJS.ProcessEnv): string {
  if (env.KERITS_RUN_ID && env.KERITS_RUN_ID.length > 0) {
    return env.KERITS_RUN_ID;
  }
  return MODULE_LOAD_RUN_ID;
}

/** Filename scheme: pid-<pid>-<runId>.jsonl — safe for parallel workers. */
export function resolveEvidenceFilename(ctx: { pid: number; runId: string }): string {
  return `pid-${ctx.pid}-${ctx.runId}.jsonl`;
}

/** Catalog-only mode — scenario() suppresses it() and observation writes. */
export function isCatalogOnly(env: NodeJS.ProcessEnv): boolean {
  return env.KERITS_CATALOG_ONLY === '1';
}
