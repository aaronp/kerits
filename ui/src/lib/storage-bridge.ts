/**
 * Storage Bridge - Adapts KERITS Kv to MERITS Kv interface
 *
 * KERITS Kv: Uses Uint8Array values (binary storage)
 * MERITS Kv: Uses generic T values (JSON storage)
 *
 * This adapter serializes/deserializes JSON to Uint8Array for compatibility.
 */

import type { Kv as KeritsDslKv } from '../../../src/storage/types';

/**
 * MERITS KV interface (from merits/lib/storage)
 */
export interface MeritsKv {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  has(key: string): Promise<boolean>;
  clear?(): Promise<void>;
}

/**
 * Adapter that wraps KERITS Kv to implement MERITS Kv interface
 */
export class KvAdapter implements MeritsKv {
  constructor(
    private keritsDslKv: KeritsDslKv,
    private namespace: string = ''
  ) {}

  /**
   * Create namespaced key
   */
  private key(k: string): string {
    return this.namespace ? `${this.namespace}:${k}` : k;
  }

  /**
   * Remove namespace from key
   */
  private unkey(k: string): string {
    if (!this.namespace) return k;
    const prefix = `${this.namespace}:`;
    return k.startsWith(prefix) ? k.substring(prefix.length) : k;
  }

  /**
   * Serialize value to Uint8Array
   */
  private serialize<T>(value: T): Uint8Array {
    const json = JSON.stringify(value);
    return new TextEncoder().encode(json);
  }

  /**
   * Deserialize Uint8Array to value
   */
  private deserialize<T>(bytes: Uint8Array): T {
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const bytes = await this.keritsDslKv.get(this.key(key));
    if (!bytes) return null;
    return this.deserialize<T>(bytes);
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    const bytes = this.serialize(value);
    await this.keritsDslKv.put(this.key(key), bytes);
  }

  async delete(key: string): Promise<void> {
    await this.keritsDslKv.del(this.key(key));
  }

  async list(prefix?: string): Promise<string[]> {
    // Build search prefix with namespace
    const searchKey = prefix ? this.key(prefix) : this.namespace ? `${this.namespace}:` : '';

    // List all keys with that prefix
    const results = await this.keritsDslKv.list(searchKey, { keysOnly: true });

    // Remove namespace and return
    return results.map(r => this.unkey(r.key));
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async clear(): Promise<void> {
    // List all keys in this namespace
    const keys = await this.list();

    // Delete each one
    for (const key of keys) {
      await this.delete(key);
    }
  }
}

/**
 * Create a MERITS-compatible KV store from KERITS DSL store
 *
 * @param keritsDslKv - KERITS Kv instance (from dsl.store)
 * @param namespace - Optional namespace for isolation (e.g., "messages", "contacts")
 * @returns MERITS Kv instance
 */
export function createMeritsKv(
  keritsDslKv: KeritsDslKv,
  namespace: string = ''
): MeritsKv {
  return new KvAdapter(keritsDslKv, namespace);
}
