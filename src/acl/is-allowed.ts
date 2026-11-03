/**
 * Authorization against a resolved AclTarget.
 */
import type { PublicKey } from '../common/types.js';
import type { AclTarget, ResolvedNode } from './types.js';

export type ResolvedNodeLookup = (nodeId: string) => ResolvedNode | undefined;

/**
 * True if subjectKey may act under target.
 * Fail-closed: missing target / missing resolved node → false.
 */
export function isAllowed(
  target: AclTarget | undefined,
  subjectKey: PublicKey,
  lookupResolved: ResolvedNodeLookup,
): boolean {
  if (!target) return false;
  if (target.kind === 'any-authenticated') return true;
  const resolved = lookupResolved(target.nodeId);
  if (!resolved) return false;
  return resolved.keys.has(subjectKey);
}
