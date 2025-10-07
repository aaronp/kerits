/**
 * On-disk KV adapter for persistent storage
 *
 * File layout:
 * - Each key is encoded as a safe filesystem path
 * - Values are stored as raw bytes in individual files
 * - Directory structure mirrors key hierarchy (separated by '/')
 * - Supports structured keys with proper file extensions (.cesr, .json, .icp.cesr, etc.)
 */

import type { Kv, StorageKey } from '../types';
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
 * Convert StorageKey to filesystem path with proper extensions
 */
function storageKeyToPath(baseDir: string, key: StorageKey): string {
  const dirPath = path.join(baseDir, ...key.path.slice(0, -1).map(p => encodeKey(p)));
  const fileName = key.path[key.path.length - 1];

  // Build file extension
  let ext = '';
  if (key.meta?.eventType) {
    ext += `.${key.meta.eventType}`;
  }
  if (key.type === 'cesr') {
    // Add encoding suffix for CESR
    const encoding = key.meta?.cesrEncoding || 'binary';
    ext += `.${encoding}.cesr`;
  } else if (key.type === 'json') {
    ext += '.json';
  }

  return path.join(dirPath, encodeKey(fileName) + ext);
}

/**
 * Convert filesystem path back to StorageKey
 */
function pathToStorageKey(baseDir: string, filePath: string): StorageKey {
  const relativePath = path.relative(baseDir, filePath);
  const parts = relativePath.split(path.sep).map(p => decodeKey(p));

  // Extract extensions from last part
  const lastPart = parts[parts.length - 1];
  let fileName = lastPart;
  let type: 'cesr' | 'json' | 'text' | undefined;
  let eventType: string | undefined;
  let cesrEncoding: 'binary' | 'text' | undefined;

  // Check for .cesr or .json extension
  if (lastPart.endsWith('.cesr')) {
    type = 'cesr';
    fileName = lastPart.slice(0, -5); // Remove .cesr

    // Check for encoding (.binary.cesr or .text.cesr)
    if (fileName.endsWith('.binary')) {
      cesrEncoding = 'binary';
      fileName = fileName.slice(0, -7);
    } else if (fileName.endsWith('.text')) {
      cesrEncoding = 'text';
      fileName = fileName.slice(0, -5);
    }

    // Check for event type before encoding
    const eventTypes = ['icp', 'rot', 'ixn', 'vcp', 'iss', 'rev', 'upg', 'vtc', 'nrx'];
    for (const et of eventTypes) {
      if (fileName.endsWith(`.${et}`)) {
        eventType = et;
        fileName = fileName.slice(0, -(et.length + 1));
        break;
      }
    }
  } else if (lastPart.endsWith('.json')) {
    type = 'json';
    fileName = lastPart.slice(0, -5); // Remove .json
  }

  parts[parts.length - 1] = fileName;

  return {
    path: parts,
    type,
    meta: eventType || cesrEncoding ? {
      eventType: eventType as any,
      cesrEncoding
    } : undefined
  };
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

  // Structured key methods

  async getStructured(key: StorageKey): Promise<Uint8Array | null> {
    const filePath = storageKeyToPath(this.baseDir, key);

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

  async putStructured(key: StorageKey, value: Uint8Array): Promise<void> {
    const filePath = storageKeyToPath(this.baseDir, key);
    const dir = path.dirname(filePath);

    // Ensure parent directory exists
    await mkdir(dir, { recursive: true });

    // Write value
    await writeFile(filePath, value);
  }

  async delStructured(key: StorageKey): Promise<void> {
    const filePath = storageKeyToPath(this.baseDir, key);

    try {
      await unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // Silently ignore if file doesn't exist
    }
  }

  async listStructured(
    keyPrefix: StorageKey,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: StorageKey; value?: Uint8Array }>> {
    const out: Array<{ key: StorageKey; value?: Uint8Array }> = [];
    const lim = opts?.limit ?? Infinity;

    // Build directory path from prefix
    const prefixPath = path.join(this.baseDir, ...keyPrefix.path);

    // Walk directory
    const results: { key: StorageKey; filePath: string }[] = [];
    await this.walkDirStructured(prefixPath, results);

    // Sort by path for deterministic ordering
    results.sort((a, b) => a.key.path.join('/').localeCompare(b.key.path.join('/')));

    // Fetch values if needed
    for (const { key, filePath } of results) {
      if (out.length >= lim) break;

      if (opts?.keysOnly) {
        out.push({ key });
      } else {
        try {
          const buffer = await readFile(filePath);
          out.push({ key, value: new Uint8Array(buffer) });
        } catch (err: any) {
          // File may have been deleted, skip
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }
    }

    return out;
  }

  private async walkDirStructured(
    dir: string,
    results: Array<{ key: StorageKey; filePath: string }>
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
        const key = pathToStorageKey(this.baseDir, fullPath);
        results.push({ key, filePath: fullPath });
      } else if (stats.isDirectory()) {
        await this.walkDirStructured(fullPath, results);
      }
    }
  }
}
