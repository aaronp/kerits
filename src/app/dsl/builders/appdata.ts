/**
 * AppDataDSL - Application preferences and settings
 *
 * Stores user-scoped preferences under prefs/ directory
 */

import type { Kv } from '../../../storage/types';
import type { AppDataDSL } from '../types';

const PREFS_PREFIX = 'prefs/';

/**
 * Create an AppDataDSL instance
 * @param kv - Key-value store (user-scoped)
 * @returns AppDataDSL instance
 */
export function createAppDataDSL(kv: Kv): AppDataDSL {
  return {
    async get<T = any>(key: string): Promise<T | null> {
      const fullKey = `${PREFS_PREFIX}${key}`;
      const raw = await kv.get(fullKey);

      if (!raw) {
        return null;
      }

      try {
        const json = new TextDecoder().decode(raw);
        return JSON.parse(json) as T;
      } catch (error) {
        console.error(`Failed to parse preference ${key}:`, error);
        return null;
      }
    },

    async set(key: string, value: any): Promise<void> {
      const fullKey = `${PREFS_PREFIX}${key}`;
      const json = JSON.stringify(value);
      const bytes = new TextEncoder().encode(json);
      await kv.put(fullKey, bytes);
    },

    async delete(key: string): Promise<void> {
      const fullKey = `${PREFS_PREFIX}${key}`;
      await kv.del(fullKey);
    },

    async list(): Promise<string[]> {
      const results = await kv.list(PREFS_PREFIX, { keysOnly: true });
      // Strip the prefix from each key
      return results.map(r => r.key.slice(PREFS_PREFIX.length));
    },

    async clear(): Promise<void> {
      const keys = await this.list();
      for (const key of keys) {
        await this.delete(key);
      }
    },
  };
}
