#!/usr/bin/env bun
/**
 * merge-evidence.ts
 *
 * Reads all pid-*.jsonl files in the evidence directory, consolidates
 * observations by fullScenarioId, writes merged.json.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveEvidenceDir } from '../src/architecture/evidence-paths.ts';
import { mergeObservations } from '../src/architecture/merge-evidence-lib.ts';
import type { ScenarioObservation } from '../src/architecture/scenario-types.ts';

function main(): number {
  const dir = resolveEvidenceDir(process.env);
  mkdirSync(dir, { recursive: true });

  const files = existsSync(dir) ? readdirSync(dir).filter((f) => /^pid-.*\.jsonl$/.test(f)) : [];

  const all: ScenarioObservation[] = [];
  for (const f of files) {
    const full = join(dir, f);
    const content = readFileSync(full, 'utf-8');
    const lines = content.split('\n').filter((l) => l.length > 0);
    for (let i = 0; i < lines.length; i++) {
      try {
        all.push(JSON.parse(lines[i]) as ScenarioObservation);
      } catch (_err) {
        console.warn(`[merge-evidence] malformed JSONL in ${f}:${i + 1} — skipped`);
      }
    }
  }

  if (files.length === 0) {
    console.warn('[merge-evidence] no pid-*.jsonl files found — writing empty merged.json');
  }

  const merged = mergeObservations(all);
  writeFileSync(join(dir, 'merged.json'), JSON.stringify(merged, null, 2));
  console.log(`[merge-evidence] ${all.length} raw → ${merged.length} merged observations.`);
  return 0;
}

process.exit(main());
