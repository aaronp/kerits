/**
 * In-memory KV adapter for testing and development
 */

import type { Kv } from '../types';

export class MemoryKv implements Kv {
  private map = new Map<string, Uint8Array>();

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
}
