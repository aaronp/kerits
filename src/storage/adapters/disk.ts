/**
 * On-disk KV adapter for persistent storage
 *
 * File layout:
 * - Each key is encoded as a safe filesystem path
 * - Values are stored as raw bytes in individual files
 * - Directory structure mirrors key hierarchy (separated by '/')
 */

import type { Kv } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Encode a key into a safe filesystem path
 * Replaces special characters to ensure cross-platform compatibility
 * Note: Forward slashes (/) are preserved to create directory hierarchy
 */
function encodeKey(key: string): string {
  // Split by / to preserve directory structure
  const parts = key.split('/');
  return parts.map(part =>
    part
      .replace(/%/g, '%25')    // Escape % first
      .replace(/\\/g, '%5C')   // Escape \
      .replace(/:/g, '%3A')    // Escape :
      .replace(/\*/g, '%2A')   // Escape *
      .replace(/\?/g, '%3F')   // Escape ?
      .replace(/"/g, '%22')    // Escape "
      .replace(/</g, '%3C')    // Escape <
      .replace(/>/g, '%3E')    // Escape >
      .replace(/\|/g, '%7C')   // Escape |
  ).join('/');
}

/**
 * Decode a filesystem path back to a key
 */
function decodeKey(encodedKey: string): string {
  // Split by / to preserve directory structure
  const parts = encodedKey.split(path.sep);
  return parts.map(part =>
    part
      .replace(/%7C/g, '|')
      .replace(/%3E/g, '>')
      .replace(/%3C/g, '<')
      .replace(/%22/g, '"')
      .replace(/%3F/g, '?')
      .replace(/%2A/g, '*')
      .replace(/%3A/g, ':')
      .replace(/%5C/g, '\\')
      .replace(/%25/g, '%')
  ).join('/');
}

/**
 * Get file path for a key
 */
function keyToPath(baseDir: string, key: string): string {
  const encoded = encodeKey(key);
  return path.join(baseDir, encoded);
}

/**
 * Recursively walk directory and collect all keys with prefix
 */
async function walkDir(
  dir: string,
  baseDir: string,
  prefix: string,
  results: string[]
): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    // Directory doesn't exist, return empty
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = await stat(fullPath);

    if (stats.isFile()) {
      // Convert file path back to key
      const relativePath = path.relative(baseDir, fullPath);
      const key = decodeKey(relativePath);

      if (key.startsWith(prefix)) {
        results.push(key);
      }
    } else if (stats.isDirectory()) {
      // Recurse into subdirectory
      await walkDir(fullPath, baseDir, prefix, results);
    }
  }
}

export interface DiskKvOptions {
  /** Base directory for storage */
  baseDir: string;
  /** Create directory if it doesn't exist (default: true) */
  createIfMissing?: boolean;
}

/**
 * On-disk KV adapter
 *
 * Stores each key-value pair as a file on disk.
 * Keys are encoded to be filesystem-safe.
 */
export class DiskKv implements Kv {
  private baseDir: string;

  constructor(options: DiskKvOptions) {
    this.baseDir = path.resolve(options.baseDir);

    // Create base directory if needed
    if (options.createIfMissing !== false) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err: any) {
        if (err.code !== 'EEXIST') {
          throw err;
        }
      }
    }
  }

  async get(key: string): Promise<Uint8Array | null> {
    const filePath = keyToPath(this.baseDir, key);

    try {
      const buffer = await readFile(filePath);
      return new Uint8Array(buffer);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    const filePath = keyToPath(this.baseDir, key);
    const dir = path.dirname(filePath);

    // Ensure parent directory exists
    await mkdir(dir, { recursive: true });

    // Write value
    await writeFile(filePath, value);
  }

  async del(key: string): Promise<void> {
    const filePath = keyToPath(this.baseDir, key);

    try {
      await unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // Silently ignore if file doesn't exist
    }
  }

  async list(
    prefix: string,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: string; value?: Uint8Array }>> {
    const out: Array<{ key: string; value?: Uint8Array }> = [];
    const lim = opts?.limit ?? Infinity;

    // Collect all keys with prefix
    const keys: string[] = [];
    await walkDir(this.baseDir, this.baseDir, prefix, keys);

    // Sort keys for deterministic ordering
    keys.sort();

    // Fetch values if needed
    for (const key of keys) {
      if (out.length >= lim) break;

      if (opts?.keysOnly) {
        out.push({ key });
      } else {
        const value = await this.get(key);
        if (value !== null) {
          out.push({ key, value });
        }
      }
    }

    return out;
  }

  async batch(
    ops: Array<{ type: 'put' | 'del'; key: string; value?: Uint8Array }>
  ): Promise<void> {
    // Simple sequential execution
    // For better performance, could parallelize or use transactions
    for (const op of ops) {
      if (op.type === 'put' && op.value) {
        await this.put(op.key, op.value);
      } else if (op.type === 'del') {
        await this.del(op.key);
      }
    }
  }

  // Helper methods for testing

  /**
   * Clear all data (remove all files)
   */
  async clear(): Promise<void> {
    const keys: string[] = [];
    await walkDir(this.baseDir, this.baseDir, '', keys);

    for (const key of keys) {
      await this.del(key);
    }
  }

  /**
   * Get number of stored keys
   */
  async size(): Promise<number> {
    const keys: string[] = [];
    await walkDir(this.baseDir, this.baseDir, '', keys);
    return keys.length;
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    const keys: string[] = [];
    await walkDir(this.baseDir, this.baseDir, '', keys);
    return keys.sort();
  }

  /**
   * Get base directory path
   */
  getBaseDir(): string {
    return this.baseDir;
  }
}
