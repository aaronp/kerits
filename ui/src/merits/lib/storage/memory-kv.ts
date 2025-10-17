/**
 * Memory KV Store (for testing)
 *
 * In-memory implementation of the Kv interface.
 * Useful for unit tests without IndexedDB overhead.
 */

import type { Kv } from './indexeddb-kv';

export class MemoryKv implements Kv {
  private data = new Map<string, unknown>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = this.data.get(key);
    return value !== undefined ? (value as T) : null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    if (!prefix) return keys;
    return keys.filter((k) => k.startsWith(prefix));
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}
