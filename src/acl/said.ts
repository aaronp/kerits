/**
 * SAID computation for AclNode and ResolvedNode.
 */
import { saidOf } from '../common/data.js';
import type { PublicKey, SAID } from '../common/types.js';
import { normalizeChildren, normalizeKeys } from './normalize.js';
import type { AclRef, AclTarget } from './types.js';

export function computeNodeSAID(node: { nodeId: string; children: AclRef[]; mutators?: AclTarget }): SAID {
  const canonical = {
    nodeId: node.nodeId,
    children: normalizeChildren(node.children),
    ...(node.mutators ? { mutators: node.mutators } : {}),
    d: '',
  };
  return saidOf(canonical) as SAID;
}

/** @deprecated Use computeNodeSAID — accepts Merits-shaped { groupId, members, admin }. */
export function computeGroupSAID(group: { groupId: string; members: AclRef[]; admin: AclTarget }): SAID {
  return computeNodeSAID({
    nodeId: group.groupId,
    children: group.members,
    mutators: group.admin,
  });
}

export function computeResolvedNodeSAID(nodeSAID: SAID, keys: Set<PublicKey>): SAID {
  const canonical = {
    nodeSAID,
    keys: normalizeKeys(keys),
    d: '',
  };
  return saidOf(canonical) as SAID;
}

/** @deprecated Use computeResolvedNodeSAID */
export function computeResolvedGroupSAID(groupSAID: SAID, keys: Set<PublicKey>): SAID {
  return computeResolvedNodeSAID(groupSAID, keys);
}
