import { describe, expect, it, beforeEach } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to this test file — works in both monorepo and standalone.
const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(THIS_DIR, '..');
const SCRIPT_PATH = join(THIS_DIR, 'merge-evidence.ts');

let dir: string;

beforeEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = mkdtempSync(join(tmpdir(), 'kerits-merge-evidence-'));
});

function writeJsonl(name: string, lines: object[]): void {
  writeFileSync(join(dir, name), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
}

describe('merge-evidence.ts', () => {
  it('produces merged.json from multiple pid JSONL files', () => {
    writeJsonl('pid-1-r1.jsonl', [
      { fullScenarioId: 'c/f/a', functionalityId: 'said-encode', capabilityId: 'said-computation', domainId: 'SAID', layerIds: ['core'], status: 'passed', runId: 'r1', timestamp: '2026-04-16T00:00:00.000Z' },
    ]);
    writeJsonl('pid-2-r1.jsonl', [
      { fullScenarioId: 'c/f/b', functionalityId: 'said-verify', capabilityId: 'said-computation', domainId: 'SAID', layerIds: ['core'], status: 'failed', runId: 'r1', timestamp: '2026-04-16T00:00:00.000Z' },
    ]);

    const result = spawnSync('bun', [SCRIPT_PATH], {
      cwd: PKG_ROOT,
      env: { ...process.env, KERITS_EVIDENCE_DIR: dir },
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);

    const merged = JSON.parse(readFileSync(join(dir, 'merged.json'), 'utf-8'));
    expect(merged).toHaveLength(2);
    const ids = merged.map((m: { fullScenarioId: string }) => m.fullScenarioId).sort();
    expect(ids).toEqual(['c/f/a', 'c/f/b']);
  });

  it('warns and produces empty array when no evidence files exist', () => {
    const result = spawnSync('bun', [SCRIPT_PATH], {
      cwd: PKG_ROOT,
      env: { ...process.env, KERITS_EVIDENCE_DIR: dir },
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    expect(existsSync(join(dir, 'merged.json'))).toBe(true);
    const merged = JSON.parse(readFileSync(join(dir, 'merged.json'), 'utf-8'));
    expect(merged).toEqual([]);
  });

  it('skips malformed JSONL lines with a warning', () => {
    writeJsonl('pid-1-r1.jsonl', [
      { fullScenarioId: 'c/f/a', functionalityId: 'said-encode', capabilityId: 'said-computation', domainId: 'SAID', layerIds: ['core'], status: 'passed', runId: 'r1', timestamp: '2026-04-16T00:00:00.000Z' },
    ]);
    // Append a malformed line
    appendFileSync(join(dir, 'pid-1-r1.jsonl'), 'not-json\n');

    const result = spawnSync('bun', [SCRIPT_PATH], {
      cwd: PKG_ROOT,
      env: { ...process.env, KERITS_EVIDENCE_DIR: dir },
      encoding: 'utf-8',
    });
    expect(result.status).toBe(0);
    // NOTE: Bun's test runner in workspace mode does not expose child-process stdio via
    // spawnSync's .stdout/.stderr fields (Bun v1.3.6 regression). We verify behaviour
    // through the output file instead of asserting on the warning message.
    const merged = JSON.parse(readFileSync(join(dir, 'merged.json'), 'utf-8'));
    expect(merged).toHaveLength(1);
  });
});
