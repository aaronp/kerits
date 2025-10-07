/**
 * In-memory KV adapter for testing and development
 */

import type { Kv, StorageKey } from '../types';

export class MemoryKv implements Kv {
  private map = new Map<string, Uint8Array>();

  // Helper to convert StorageKey to string key
  private storageKeyToString(key: StorageKey): string {
    let path = key.path.join('/');

    if (key.meta?.eventType) {
      path += `.${key.meta.eventType}`;
    }

    if (key.type === 'cesr') {
      const encoding = key.meta?.cesrEncoding || 'binary';
      path += `.${encoding}.cesr`;
    } else if (key.type === 'json') {
      path += '.json';
    }

    return path;
  }

  async get(key: string): Promise<Uint8Array | null> {
    return this.map.get(key) ?? null;
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    this.map.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }

  async list(
    prefix: string,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: string; value?: Uint8Array }>> {
    const out: Array<{ key: string; value?: Uint8Array }> = [];
    const lim = opts?.limit ?? Infinity;

    for (const [k, v] of this.map) {
      if (!k.startsWith(prefix)) continue;
      if (opts?.keysOnly) {
        out.push({ key: k });
      } else {
        out.push({ key: k, value: v });
      }
      if (out.length >= lim) break;
    }

    return out;
  }

  async batch(
    ops: Array<{ type: "put" | "del"; key: string; value?: Uint8Array }>
  ): Promise<void> {
    for (const op of ops) {
      if (op.type === "put" && op.value) {
        this.map.set(op.key, op.value);
      }
      if (op.type === "del") {
        this.map.delete(op.key);
      }
    }
  }

  // Helper methods for testing
  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }

  keys(): string[] {
    return Array.from(this.map.keys());
  }

  // Structured key methods
  async getStructured(key: StorageKey): Promise<Uint8Array | null> {
    const stringKey = this.storageKeyToString(key);
    return this.map.get(stringKey) ?? null;
  }

  async putStructured(key: StorageKey, value: Uint8Array): Promise<void> {
    const stringKey = this.storageKeyToString(key);
    this.map.set(stringKey, value);
  }

  async delStructured(key: StorageKey): Promise<void> {
    const stringKey = this.storageKeyToString(key);
    this.map.delete(stringKey);
  }

  async listStructured(
    keyPrefix: StorageKey,
    opts?: { keysOnly?: boolean; limit?: number }
  ): Promise<Array<{ key: StorageKey; value?: Uint8Array }>> {
    const prefix = keyPrefix.path.join('/');
    const results: Array<{ key: StorageKey; value?: Uint8Array }> = [];
    const lim = opts?.limit ?? Infinity;

    for (const [k, v] of this.map) {
      if (!k.startsWith(prefix)) continue;

      // Parse the string key back to StorageKey
      // Remove extensions (.json, .cesr, .icp.binary.cesr, etc.)
      let pathString = k;
      // Remove known extensions
      pathString = pathString.replace(/\.(binary|text)\.cesr$/, '');
      pathString = pathString.replace(/\.(icp|rot|ixn|vcp|iss|rev|upg|vtc|nrx)$/, '');
      pathString = pathString.replace(/\.json$/, '');
      pathString = pathString.replace(/\.cesr$/, '');

      const parsedKey: StorageKey = {
        path: pathString.split('/').filter(Boolean),
        type: keyPrefix.type
      };

      if (opts?.keysOnly) {
        results.push({ key: parsedKey });
      } else {
        results.push({ key: parsedKey, value: v });
      }

      if (results.length >= lim) break;
    }

    return results;
  }
}
