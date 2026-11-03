import type { SAID } from '../common/types.js';
import { normalizeChildren } from './normalize.js';
import { computeNodeSAID } from './said.js';
import type { AclNode, AclRef, AclTarget } from './types.js';

/** Build an AclNode with normalized children and computed SAID. */
export function makeAclNode(
  nodeId: string,
  children: AclRef[],
  mutators: AclTarget = { kind: 'any-authenticated' },
): AclNode {
  const normalized = normalizeChildren(children);
  const partial = { nodeId, children: normalized, mutators };
  return { ...partial, d: computeNodeSAID(partial) as SAID };
}
