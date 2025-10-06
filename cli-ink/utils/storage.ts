/**
 * Storage utilities for managing KERITS_DIR and DiskKV
 */
import { homedir } from 'os';
import { join } from 'path';
import { createKeritsDSL } from '../../src/app/dsl/index.js';
import { createKerStore, DiskKv, DefaultJsonCesrParser, CesrHasher } from '../../src/storage/index.js';

/**
 * Get the KERITS directory path
 */
export function getKeritsDir(): string {
  return process.env.KERITS_DIR || join(homedir(), '.kerits');
}

/**
 * Get the data directory for a specific account
 */
export function getAccountDataDir(alias: string): string {
  return join(getKeritsDir(), alias, 'data');
}

/**
 * Create a DSL instance for an account
 */
export async function loadAccountDSL(alias: string) {
  const dataDir = getAccountDataDir(alias);
  const hasher = new CesrHasher();
  const parser = new DefaultJsonCesrParser(hasher);
  const store = createKerStore(new DiskKv({ baseDir: dataDir }), { parser, hasher });
  const dsl = createKeritsDSL(store);

  return { store, dsl, dataDir };
}

/**
 * Get list of existing accounts
 */
export async function listAccounts(): Promise<string[]> {
  const keritsDir = getKeritsDir();

  try {
    const { readdir, stat } = await import('fs/promises');
    const entries = await readdir(keritsDir, { withFileTypes: true });
    const accounts: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      // Check if this directory has a 'data' subdirectory (account structure)
      const dataDir = join(keritsDir, entry.name, 'data');
      try {
        const stats = await stat(dataDir);
        if (stats.isDirectory()) {
          accounts.push(entry.name);
        }
      } catch {
        // No data directory, not an account
        continue;
      }
    }

    return accounts.sort();
  } catch (error) {
    // Directory doesn't exist yet
    return [];
  }
}

/**
 * Get or create current account selection
 */
export async function getCurrentAccount(): Promise<string | null> {
  const keritsDir = getKeritsDir();
  const currentFile = join(keritsDir, '.current');

  try {
    const { readFile } = await import('fs/promises');
    const content = await readFile(currentFile, 'utf-8');
    return content.trim();
  } catch {
    return null;
  }
}

/**
 * Set current account
 */
export async function setCurrentAccount(alias: string): Promise<void> {
  const keritsDir = getKeritsDir();
  const { mkdir, writeFile } = await import('fs/promises');

  await mkdir(keritsDir, { recursive: true });
  await writeFile(join(keritsDir, '.current'), alias);
}
