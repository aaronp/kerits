#!/usr/bin/env bun
/**
 * regen-docs.ts
 *
 * Reads the authored registry, scenarios.index.json, and merged.json,
 * then rewrites the GENERATED:BEGIN/END region in each of:
 *   - packages/core/docs/content/docs/architecture/capabilities.mdx
 *   - packages/core/docs/content/docs/architecture/status.mdx
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveEvidenceDir } from '../src/architecture/evidence-paths.ts';
import { renderCapabilitiesBody, renderStatusBody } from '../src/architecture/regen-docs-lib.ts';
import type { ScenarioDefinition, ScenarioObservation } from '../src/architecture/scenario-types.ts';

const REPO_ROOT = resolve(import.meta.dir, '../../..');
const CAPABILITIES_PATH = join(REPO_ROOT, 'packages/core/docs/content/docs/architecture/capabilities.mdx');
const STATUS_PATH = join(REPO_ROOT, 'packages/core/docs/content/docs/architecture/status.mdx');

const BEGIN = '{/* GENERATED:BEGIN */}';
const END = '{/* GENERATED:END */}';

function replaceGenerated(filePath: string, body: string): void {
  if (!existsSync(filePath)) {
    throw new Error(`regen-docs: MDX file missing: ${filePath}`);
  }
  const current = readFileSync(filePath, 'utf-8');
  const beginIdx = current.indexOf(BEGIN);
  const endIdx = current.indexOf(END);
  if (beginIdx < 0 || endIdx < 0 || endIdx < beginIdx) {
    throw new Error(`regen-docs: GENERATED markers not found in ${filePath}`);
  }
  const head = current.slice(0, beginIdx + BEGIN.length);
  const tail = current.slice(endIdx);
  const next = `${head}\n${body}\n${tail}`;
  if (next !== current) writeFileSync(filePath, next);
}

function main(): number {
  const dir = resolveEvidenceDir(process.env);
  const indexPath = join(dir, 'scenarios.index.json');
  const mergedPath = join(dir, 'merged.json');

  if (!existsSync(indexPath)) {
    console.error(
      `regen-docs: ${indexPath} missing. Run 'bun run docs:check' first (or use 'bun run docs:regen' which chains it).`,
    );
    return 1;
  }
  if (!existsSync(mergedPath)) {
    console.error(`regen-docs: ${mergedPath} missing. Run 'bun run docs:merge' first.`);
    return 1;
  }

  const defs = JSON.parse(readFileSync(indexPath, 'utf-8')) as ScenarioDefinition[];
  const observations = JSON.parse(readFileSync(mergedPath, 'utf-8')) as ScenarioObservation[];

  replaceGenerated(CAPABILITIES_PATH, renderCapabilitiesBody(defs, observations));
  replaceGenerated(STATUS_PATH, renderStatusBody(defs, observations));

  console.log(`[regen-docs] updated ${CAPABILITIES_PATH}`);
  console.log(`[regen-docs] updated ${STATUS_PATH}`);
  return 0;
}

process.exit(main());
