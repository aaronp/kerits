/**
 * KEL Interface
 *
 * Pure interface defining the contract for a controller's Key Event Log.
 * Partial port from kv4 packages/kerits/src/api/kel.ts — interface only;
 * KELs impl factory stays in kv4 until Phase 2 (B-004).
 */

import type { AID, CESREvent, KSN, SAID } from './types.js';

/**
 * Representation of a controller's KEL
 */
export interface KEL {
  aid(): Promise<AID | undefined>;
  append(
    env: CESREvent,
    ksn?: KSN,
  ): Promise<{
    said: SAID;
    sequence: string;
    index: number;
  }>;
  get(said: SAID): Promise<CESREvent | undefined>;
  at(index: number): Promise<CESREvent | undefined>;
  events(): Promise<CESREvent[]>;
  ksn(): Promise<KSN | undefined>;
}
