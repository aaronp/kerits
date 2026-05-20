import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';
import { VERSION } from '../version.js';

/** Package root (standalone sync and monorepo `packages/core`). */
const PACKAGE_ROOT = join(import.meta.dir, '../..');
const packageVersion = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version as string;

describe('@kerits/core VERSION', () => {
  it('matches package.json version', () => {
    expect(VERSION).toBe(packageVersion);
  });
});
