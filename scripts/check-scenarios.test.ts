import { describe, expect, it, beforeEach } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to this test file — works in both monorepo and standalone.
const THIS_DIR    = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT    = resolve(THIS_DIR, '..');
const SCRIPT_PATH = join(THIS_DIR, 'check-scenarios.ts');

let tmpEvidence: string;

beforeEach(() => {
  if (tmpEvidence) rmSync(tmpEvidence, { recursive: true, force: true });
  tmpEvidence = mkdtempSync(join(tmpdir(), 'kerits-check-scenarios-'));
});

describe('check-scenarios.ts script', () => {
  it('smoke test: exits 0, produces scenarios.index.json, and the 5 bootstrap scenario IDs are present', () => {
    const result = spawnSync('bun', [SCRIPT_PATH], {
      cwd: PKG_ROOT,
      env: {
        ...process.env,
        KERITS_EVIDENCE_DIR: tmpEvidence,
      },
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    const indexPath = join(tmpEvidence, 'scenarios.index.json');
    expect(existsSync(indexPath)).toBe(true);
    const defs = JSON.parse(readFileSync(indexPath, 'utf-8'));

    const ids: string[] = defs.map((d: { id: string }) => d.id);
    const bootstrapIds = [
      'accepts-correct-said',
      'encodes-simple-object',
      'is-deterministic',
      'rejects-invalid-said-string',
      'rejects-tampered-object',
    ];
    for (const id of bootstrapIds) {
      expect(ids).toContain(id);
    }
  });
});
