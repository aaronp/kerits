/**
 * DSL Singleton for kerits UI
 *
 * Provides a user-aware instance of the kerits DSL using IndexedDB storage.
 * Each user gets their own isolated database instance.
 */

import { useState, useEffect } from 'react';
// Direct imports to avoid bundling Node.js-only DiskKv adapter
import { createKerStore } from '../../../src/storage/core';
import { IndexedDBKv } from '../../../src/storage/adapters/indexeddb';
import { createKeritsDSL } from '../../../src/app/dsl';
import type { KeritsDSL } from '../../../src/app/dsl/types';

/**
 * User-specific DSL instances
 * Map of userId -> DSL instance for proper user isolation
 */
const dslInstances = new Map<string, KeritsDSL>();

/**
 * Get a user-specific DSL instance
 *
 * Each user gets their own isolated IndexedDB database and DSL instance.
 * This ensures proper data isolation between users.
 *
 * @param userId - User ID for database namespacing
 * @returns Promise<KeritsDSL>
 */
export async function getDSL(userId?: string): Promise<KeritsDSL> {
  // If no userId provided, throw error - DSL must be user-aware
  if (!userId) {
    throw new Error('getDSL requires a userId for proper data isolation');
  }

  // Return cached instance if exists
  if (dslInstances.has(userId)) {
    return dslInstances.get(userId)!;
  }

  // Create user-specific IndexedDB KV adapter
  const kv = new IndexedDBKv(`kerits-app-${userId}`);

  // Create KerStore with IndexedDB backend
  const store = createKerStore(kv);

  // Create DSL
  const dslInstance = createKeritsDSL(store);

  // Cache it
  dslInstances.set(userId, dslInstance);

  return dslInstance;
}

/**
 * Reset DSL instance for a specific user (useful for testing or logout)
 *
 * @param userId - User ID whose DSL instance to reset
 * @param clearData - If true, clears all data from IndexedDB
 */
export async function resetDSL(userId: string, clearData = false): Promise<void> {
  if (clearData) {
    const kv = new IndexedDBKv(`kerits-app-${userId}`);
    await kv.clear();
    await kv.close();
  }

  dslInstances.delete(userId);
}

/**
 * Reset all DSL instances (useful for testing)
 */
export async function resetAllDSL(): Promise<void> {
  dslInstances.clear();
}

/**
 * React hook for accessing the user-aware DSL
 *
 * Usage:
 * ```tsx
 * import { useUser } from './user-provider';
 *
 * const { currentUser } = useUser();
 * const { dsl, loading, error } = useDSL(currentUser?.id);
 *
 * if (dsl) {
 *   const accountDsl = await dsl.account('alice');
 * }
 * ```
 */
export function useDSL(userId?: string) {
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setDsl(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getDSL(userId)
      .then(d => {
        setDsl(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setDsl(null);
        setLoading(false);
      });
  }, [userId]);

  return { dsl, loading, error };
}

// For non-React usage
export { getDSL as default };
