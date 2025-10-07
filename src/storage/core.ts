/**
 * KerStore - Core KERI storage API factory
 *
 * NOTE: This now uses KerStore2 internally with a compatibility wrapper.
 * The old implementation has been replaced with the modern storage layer.
 */

import type {
  Kv,
  KerStore,
  StoreOptions,
} from './types';
import { createKerStore2 } from './core2';
import { createKerStoreCompat } from './compat';

/**
 * Create a KerStore backed by given Kv
 *
 * This now uses KerStore2 internally for improved storage architecture:
 * - Structured keys throughout
 * - HEAD tracking for KEL/TEL chains
 * - Separate raw CESR and metadata storage
 * - Content-addressable ACDC/schema storage
 */
export function createKerStore(kv: Kv, opts?: StoreOptions): KerStore {
  // Create KerStore2 with compatible options
  const store2 = createKerStore2(kv, {
    defaultEncoding: 'binary',
    parser: opts?.parser,
    hasher: opts?.hasher,
    clock: opts?.clock
  });

  // Wrap with compatibility layer
  return createKerStoreCompat(store2, kv);
}
