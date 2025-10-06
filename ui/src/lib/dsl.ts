/**
 * DSL Singleton for kerits UI
 *
 * Provides a single global instance of the kerits DSL using IndexedDB storage.
 * This replaces the old storage.ts layer with the robust DSL architecture.
 */

import { useState, useEffect } from 'react';
// Direct imports to avoid bundling Node.js-only DiskKv adapter
import { createKerStore } from '../../../src/storage/core';
import { IndexedDBKv } from '../../../src/storage/adapters/indexeddb';
import { createKeritsDSL } from '../../../src/app/dsl';
import type { KeritsDSL } from '../../../src/app/dsl/types';

/**
 * Global DSL instance
 * Lazy-initialized on first access
 */
let dslInstance: KeritsDSL | null = null;

/**
 * Get the global DSL instance
 *
 * On first call, initializes the IndexedDB backend and creates the DSL.
 * Subsequent calls return the same instance.
 *
 * @returns Promise<KeritsDSL>
 */
export async function getDSL(): Promise<KeritsDSL> {
  if (dslInstance) {
    return dslInstance;
  }

  // Create IndexedDB KV adapter
  const kv = new IndexedDBKv('kerits-app');

  // Create KerStore with IndexedDB backend
  const store = createKerStore(kv);

  // Create DSL
  dslInstance = createKeritsDSL(store);

  return dslInstance;
}

/**
 * Reset the DSL instance (useful for testing or logout)
 *
 * @param clearData - If true, clears all data from IndexedDB
 */
export async function resetDSL(clearData = false): Promise<void> {
  if (clearData && dslInstance) {
    const kv = new IndexedDBKv('kerits-app');
    await kv.clear();
    await kv.close();
  }

  dslInstance = null;
}

/**
 * React hook for accessing the DSL
 *
 * Usage:
 * ```tsx
 * const dsl = useDSL();
 * const accountDsl = await dsl.account('alice');
 * ```
 */
export function useDSL() {
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDSL()
      .then(d => {
        setDsl(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { dsl, loading, error };
}

// For non-React usage
export { getDSL as default };
