import { describe, expect, it } from 'bun:test';
import {
  resolveEvidenceDir,
  resolveRunId,
  resolveEvidenceFilename,
  isCatalogOnly,
} from './evidence-paths.js';

describe('resolveEvidenceDir', () => {
  it('returns the env override when set', () => {
    expect(resolveEvidenceDir({ KERITS_EVIDENCE_DIR: '/tmp/custom-evidence' }))
      .toBe('/tmp/custom-evidence');
  });

  it('returns the default (absolute, ending in .architecture-evidence) when unset', () => {
    const dir = resolveEvidenceDir({});
    expect(dir.endsWith('/.architecture-evidence')).toBe(true);
    expect(dir.startsWith('/')).toBe(true);
  });
});

describe('resolveRunId', () => {
  it('returns the env override when set', () => {
    expect(resolveRunId({ KERITS_RUN_ID: 'run-123' })).toBe('run-123');
  });

  it('falls back to a stable id for the current module load when unset', () => {
    const a = resolveRunId({});
    const b = resolveRunId({});
    expect(a).toBe(b);                 // stable across calls in same process
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('resolveEvidenceFilename', () => {
  it('produces pid-<pid>-<runId>.jsonl', () => {
    expect(resolveEvidenceFilename({ pid: 42, runId: 'run-x' }))
      .toBe('pid-42-run-x.jsonl');
  });
});

describe('isCatalogOnly', () => {
  it('is true when KERITS_CATALOG_ONLY === "1"', () => {
    expect(isCatalogOnly({ KERITS_CATALOG_ONLY: '1' })).toBe(true);
  });

  it('is false for any other value', () => {
    expect(isCatalogOnly({ KERITS_CATALOG_ONLY: 'true' })).toBe(false);
    expect(isCatalogOnly({ KERITS_CATALOG_ONLY: '' })).toBe(false);
    expect(isCatalogOnly({})).toBe(false);
  });
});
